import { Server } from "socket.io";

import { prisma } from "../config/database.js";
import { createMessageForRoom, assertCanAccessRoom } from "../controllers/chatController.js";
import { verifyToken } from "../utils/jwt.js";

const allowedOrigins = [
  "https://www.cravzo.shop",
  "https://cravzo.shop",
  "http://localhost:5173",
  "https://localhost:5173",
  "https://cravzo-nine.vercel.app",
];

const getSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const headerToken = socket.handshake.headers.authorization?.startsWith("Bearer ")
    ? socket.handshake.headers.authorization.split(" ")[1]
    : null;
  const cookieToken = socket.handshake.headers.cookie
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === "token")?.[1];

  return authToken || headerToken || (cookieToken ? decodeURIComponent(cookieToken) : null);
};

const attachChatSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const token = getSocketToken(socket);

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          role: true,
          isOnline: true,
          latitude: true,
          longitude: true,
          status: true,
          name: true,
        },
      });

      if (!user || user.status === "BLOCKED") {
        return next(new Error("Authentication failed"));
      }

      socket.user = {
        sub: user.id,
        email: user.email,
        role: user.role,
        isOnline: user.isOnline,
        latitude: user.latitude,
        longitude: user.longitude,
        status: user.status,
        name: user.name,
      };

      return next();
    } catch {
      return next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.sub}`);

    socket.on("chat:join", async ({ roomId } = {}, ack) => {
      try {
        if (!roomId) {
          throw new Error("Room id is required");
        }

        const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
        await assertCanAccessRoom({ user: socket.user }, room);

        socket.join(`chat:${roomId}`);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message || "Unable to join chat" });
      }
    });

    socket.on("chat:leave", ({ roomId } = {}) => {
      if (roomId) {
        socket.leave(`chat:${roomId}`);
      }
    });

    socket.on("chat:send", async ({ roomId, text = "", imageUrl = "", clientId = "" } = {}, ack) => {
      try {
        const message = await createMessageForRoom({
          user: socket.user,
          roomId,
          text,
          imageUrl,
        });

        io.to(`chat:${roomId}`).emit("chat:message", {
          message,
          clientId,
        });

        const room = await prisma.chatRoom.findUnique({
          where: { id: roomId },
          include: {
            supportUser: {
              select: { id: true, name: true, role: true },
            },
            order: {
              select: {
                id: true,
                status: true,
                customerId: true,
                riderId: true,
                restaurant: {
                  select: {
                    name: true,
                    vendorId: true,
                  },
                },
                customer: {
                  select: { name: true },
                },
                rider: {
                  select: { name: true },
                },
              },
            },
          },
        });

        const recipientIds =
          room?.type === "ORDER_RIDER"
            ? [room.order?.customerId, room.order?.riderId]
            : [room?.supportUserId];

        const notification = {
          id: `${message.id}:notification`,
          roomId,
          type: room?.type || "SUPPORT",
          orderId: room?.orderId || null,
          createdAt: message.createdAt,
          text: message.text || (message.imageUrl ? "Photo attachment" : "New message"),
          sender: message.sender,
          order: room?.order
            ? {
                id: room.order.id,
                status: room.order.status,
                restaurantName: room.order.restaurant?.name || "",
                customerName: room.order.customer?.name || "",
                riderName: room.order.rider?.name || "",
              }
            : null,
          supportUser: room?.supportUser || null,
        };

        recipientIds
          .filter(Boolean)
          .filter((recipientId) => recipientId !== socket.user.sub)
          .forEach((recipientId) => {
            io.to(`user:${recipientId}`).emit("chat:notification", notification);
          });

        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, message: error.message || "Unable to send message" });
      }
    });
  });

  return io;
};

export { attachChatSocket };
