# Dodago — Infrastructure Scaling Guide

Items #13, #14, #15 from the audit require infrastructure-level changes, not just code edits.
This document explains exactly what to do and why for each one.

---

## #13 — Job Queue for Notifications (BullMQ)

### Problem
FCM push notifications are sent synchronously inside the request lifecycle via `runNotificationTask`.
If Firebase is slow (network latency spike), every order creation hangs waiting for it.
If the server restarts mid-request, the notification is silently lost.

### Fix

**Install:**
```bash
npm install bullmq@5 --save-exact
```

**Create `backend/src/queues/notificationQueue.js`:**
```js
import { Queue, Worker } from "bullmq";
import { redisClient } from "../config/redis.js";

const connection = redisClient;

export const notifQueue = new Queue("notifications", { connection });

// Worker runs in the same process (or a separate worker process)
new Worker("notifications", async (job) => {
  const { type, payload } = job.data;
  const { notifyOrderCreated, notifyOrderStatusChanged, notifyVendorNewOrder } =
    await import("../services/notificationService.js");

  if (type === "order-created")  await notifyOrderCreated(payload);
  if (type === "status-changed") await notifyOrderStatusChanged(payload);
  if (type === "vendor-new")     await notifyVendorNewOrder(payload);
}, { connection, concurrency: 5 });
```

**In `orderController.js`, replace `runNotificationTask(notifyOrderCreated(order))` with:**
```js
await notifQueue.add("notify", { type: "order-created", payload: serializeOrder(order) });
```

**Why BullMQ:**
- Jobs persist in Redis — survive server restarts
- Retries with exponential backoff on FCM failure
- Concurrency control (5 parallel FCM calls max)
- Zero impact on order creation response time

---

## #14 — Frontend Order Polling → Socket.IO Push

### Problem
Every customer with an active order fires `GET /api/orders/my` every 15 seconds.
1000 active customers = 67 requests/second just from polling.
Each request fetches the full order history with nested includes.

### Fix

**Backend — emit order status updates via Socket.IO:**

In `orderController.js` `updateOrderStatus`, after the successful update:
```js
import { getIo } from "../socket/chatSocket.js"; // expose ioInstance

// Emit to the customer's private room
getIo()?.to(`user:${updatedOrder.customerId}`).emit("order:status", {
  orderId: updatedOrder.id,
  status: updatedOrder.status,
  updatedAt: updatedOrder.updatedAt,
  rider: updatedOrder.rider,
});
```

Export `ioInstance` from `chatSocket.js`:
```js
export const getIo = () => ioInstance;
```

**Frontend — in `Orders.jsx`, subscribe to socket instead of polling:**
```js
import { getChatSocket } from "../../services/chatSocket.js";

useEffect(() => {
  const socket = getChatSocket();
  const handler = ({ orderId, status, rider }) => {
    setOrders((prev) =>
      prev.map((o) => o.id === orderId ? { ...o, status, rider } : o)
    );
    setSelectedOrder((prev) =>
      prev?.id === orderId ? { ...prev, status, rider } : prev
    );
  };
  socket.on("order:status", handler);
  return () => socket.off("order:status", handler);
}, []);
```

Remove the `setInterval` polling entirely for status updates.
Keep a single load on mount for the initial order list.

**Impact:** 1000 customers × 1 WS connection vs 1000 customers × 4 req/min = 67 req/s eliminated.

---

## #15 — PostgreSQL Read Replica

### Problem
All reads (restaurant list, menu, orders, reviews) and writes (order creation, status updates)
hit the same single PostgreSQL instance. At scale, read traffic drowns out writes.

### Fix on Railway / Supabase

**Railway:**
1. Open your PostgreSQL service → click "Add Read Replica"
2. Copy the read replica connection string
3. Add to `.env`: `DATABASE_READONLY_URL=postgres://...`

**Code change in `database.js`:**
```js
// Add a second Prisma client for reads
export const prismaRead = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_READONLY_URL || getDatabaseUrl() } },
});
```

**Use `prismaRead` for heavy read-only queries:**
```js
// restaurantController.js, publicController.js, reviewController.js
import { prismaRead } from "../config/database.js";

// Use for all findMany / findFirst that don't need latest write data
const restaurants = await prismaRead.restaurant.findMany({ ... });
```

Keep `prisma` (write client) for all mutations and transactional operations.

**Impact:** Read traffic offloaded to replica. Write path latency drops.
Reads also get a dedicated connection pool — no contention with writes.

---

## Summary — What to Do in Order

| Priority | Item | Effort | Impact |
|---|---|---|---|
| 1 | #13 BullMQ job queue | 2 hours | Reliable notifications, faster order creation |
| 2 | #14 Socket push for order status | 3 hours | Eliminates ~67 req/s polling load |
| 3 | #15 Read replica | 30 min (Railway) | Doubles read throughput, protects write path |

All three can be done independently — no dependencies between them.
