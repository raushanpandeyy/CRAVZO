import { prisma } from "../config/database.js";
import { connectRedis } from "../config/redis.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";
import { canVendorManageRestaurant } from "../utils/restaurantAccess.js";

const CLOSED_ORDER_STATUSES = ["DELIVERED", "CANCELLED", "REJECTED"];
const MESSAGE_LIMIT_MAX = 50;
const MESSAGE_LIMIT_DEFAULT = 30;
const CHAT_RATE_PREFIX = "rl:chat:";
const CHAT_RATE_TTL_SECONDS = 1;

const sanitizeMessage = (message) => ({
  id: message.id,
  roomId: message.roomId,
  text: message.text,
  imageUrl: message.imageUrl,
  kind: message.kind,
  createdAt: message.createdAt,
  sender: message.sender
    ? {
        id: message.sender.id,
        name: message.sender.name,
        role: message.sender.role,
        avatarUrl: message.sender.avatarUrl,
      }
    : null,
});

const sanitizeRoom = (room) => ({
  id: room.id,
  type: room.type,
  orderId: room.orderId,
  supportUserId: room.supportUserId,
  status: room.status,
  lastMessageAt: room.lastMessageAt,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

const getMessageKind = ({ text, imageUrl }) => {
  if (text && imageUrl) return "MIXED";
  if (imageUrl) return "IMAGE";
  return "TEXT";
};

const assertCanUseOrderChat = async (req, orderId, { forWrite = false, roomType = null } = {}) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: {
        select: {
          id: true,
          vendorId: true,
          name: true,
          operatorAccesses: { where: { vendorId: req.user.sub }, select: { vendorId: true } },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      rider: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isAdmin = req.user.role === "ADMIN";
  const isCustomer = req.user.role === "CUSTOMER" && order.customerId === req.user.sub;
  const isVendor = req.user.role === "VENDOR" && canVendorManageRestaurant(order.restaurant, req.user.sub);
  const isRider = req.user.role === "RIDER" && order.riderId === req.user.sub;

  if (!isAdmin && !isCustomer && !isVendor && !isRider) {
    throw new ApiError(403, "You do not have permission to access this order chat");
  }

  const isVendorOrCustomer = isVendor || isCustomer;
  if (!isAdmin && !isVendorOrCustomer && !order.riderId) {
    throw new ApiError(400, "Rider chat starts after a rider is assigned");
  }
  if (!isAdmin && roomType === "ORDER_RIDER" && isVendor) {
    throw new ApiError(403, "Restaurant users cannot access the customer-rider chat");
  }
  if (!isAdmin && roomType === "ORDER_VENDOR" && isRider) {
    throw new ApiError(403, "Riders cannot access the customer-restaurant chat");
  }

  if (forWrite && !isAdmin && CLOSED_ORDER_STATUSES.includes(order.status)) {
    throw new ApiError(400, "This order chat is closed");
  }

  return order;
};

const assertCanAccessRoom = async (req, room, options = {}) => {
  if (!room) {
    throw new ApiError(404, "Chat room not found");
  }

  if (room.type === "SUPPORT") {
    if (req.user.role === "ADMIN") return null;
    if (room.supportUserId !== req.user.sub) {
      throw new ApiError(403, "You do not have permission to access this support chat");
    }

    return null;
  }

  return assertCanUseOrderChat(req, room.orderId, { ...options, roomType: room.type });
};

const getOrCreateSupportRoom = async (req, res) => {
  if (req.user.role === "ADMIN") {
    const customerId = req.body.customerId;
    if (customerId) {
      const customerRoom = await prisma.chatRoom.findFirst({
        where: { type: "SUPPORT", supportUserId: customerId },
      });
      if (customerRoom) {
        return res.status(200).json(apiResponse({ message: "Customer support room ready", data: sanitizeRoom(customerRoom) }));
      }
      const newRoom = await prisma.chatRoom.create({
        data: { type: "SUPPORT", supportUserId: customerId },
      });
      return res.status(200).json(apiResponse({ message: "Customer support room created", data: sanitizeRoom(newRoom) }));
    }
    const existingRoom = await prisma.chatRoom.findFirst({ where: { type: "SUPPORT" } });
    if (existingRoom) {
      return res.status(200).json(apiResponse({ message: "Support room ready", data: sanitizeRoom(existingRoom) }));
    }
    const adminRoom = await prisma.chatRoom.create({ data: { type: "SUPPORT", supportUserId: req.user.sub } });
    return res.status(200).json(apiResponse({ message: "Support room created", data: sanitizeRoom(adminRoom) }));
  }

  const room = await prisma.chatRoom.upsert({
    where: { supportUserId: req.user.sub },
    create: { type: "SUPPORT", supportUserId: req.user.sub },
    update: {},
  });

  res.status(200).json(
    apiResponse({
      message: "Support chat room ready",
      data: sanitizeRoom(room),
    }),
  );
};

const getOrCreateOrderRoom = async (req, res) => {
  const order = await assertCanUseOrderChat(req, req.params.orderId, { roomType: "ORDER_RIDER" });
  const isClosed = CLOSED_ORDER_STATUSES.includes(order.status);

  const room = await prisma.chatRoom.upsert({
    where: {
      type_orderId: {
        type: "ORDER_RIDER",
        orderId: req.params.orderId,
      },
    },
    create: {
      type: "ORDER_RIDER",
      orderId: req.params.orderId,
      status: isClosed ? "CLOSED" : "ACTIVE",
    },
    update: {
      status: isClosed ? "CLOSED" : "ACTIVE",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Order chat room ready",
      data: sanitizeRoom(room),
    }),
  );
};

const getOrCreateVendorOrderRoom = async (req, res) => {
  const order = await assertCanUseOrderChat(req, req.params.orderId, { roomType: "ORDER_VENDOR" });
  const isClosed = CLOSED_ORDER_STATUSES.includes(order.status);

  const room = await prisma.chatRoom.upsert({
    where: {
      type_orderId: {
        type: "ORDER_VENDOR",
        orderId: req.params.orderId,
      },
    },
    create: {
      type: "ORDER_VENDOR",
      orderId: req.params.orderId,
      status: isClosed ? "CLOSED" : "ACTIVE",
    },
    update: {
      status: isClosed ? "CLOSED" : "ACTIVE",
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Vendor order chat room ready",
      data: sanitizeRoom(room),
    }),
  );
};

const getRoomMessages = async (req, res) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: req.params.roomId },
  });

  await assertCanAccessRoom(req, room);

  const limit = Math.min(Number(req.query.limit) || MESSAGE_LIMIT_DEFAULT, MESSAGE_LIMIT_MAX);
  const afterDate = req.query.after ? new Date(req.query.after) : null;

  if (afterDate && Number.isNaN(afterDate.getTime())) {
    throw new ApiError(400, "Invalid after timestamp");
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      roomId: room.id,
      ...(afterDate ? { createdAt: { gt: afterDate } } : {}),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  res.status(200).json(
    apiResponse({
      message: "Chat messages fetched successfully",
      data: messages.reverse().map(sanitizeMessage),
      meta: {
        limit,
        latestAt: messages[0]?.createdAt || null,
      },
    }),
  );
};

const createRoomMessage = async (req, res) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: req.params.roomId },
  });

  await assertCanAccessRoom(req, room, { forWrite: true });

  const rateKey = `${CHAT_RATE_PREFIX}${req.user.sub}:${room.id}`;
  const redis = await connectRedis();
  if (redis?.isOpen) {
    const exists = await redis.exists(rateKey);
    if (exists) {
      throw new ApiError(429, "Please wait a second before sending another message");
    }
    await redis.setEx(rateKey, CHAT_RATE_TTL_SECONDS, "1");
  }

  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  const imageUrl = typeof req.body.imageUrl === "string" ? req.body.imageUrl.trim() : "";

  if (!text && !imageUrl) {
    throw new ApiError(400, "Message text or image is required");
  }

  if (text.length > 1200) {
    throw new ApiError(400, "Message is too long");
  }

  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    throw new ApiError(400, "Invalid image URL");
  }

  const message = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: req.user.sub,
        text: text || null,
        imageUrl: imageUrl || null,
        kind: getMessageKind({ text, imageUrl }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    await tx.chatRoom.update({
      where: { id: room.id },
      data: {
        lastMessageAt: createdMessage.createdAt,
      },
    });

    return createdMessage;
  });

  res.status(201).json(
    apiResponse({
      message: "Message sent successfully",
      data: sanitizeMessage(message),
    }),
  );
};

const uploadChatImage = async (req, res) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: req.params.roomId },
  });

  await assertCanAccessRoom(req, room, { forWrite: true });

  const dataUrl = typeof req.body.dataUrl === "string" ? req.body.dataUrl : "";

  if (!dataUrl.startsWith("data:image/")) {
    throw new ApiError(400, "Image data URL is required");
  }

  if (dataUrl.length > 6 * 1024 * 1024) {
    throw new ApiError(400, "Image must be under 6 MB");
  }

  const uploaded = await uploadImageToCloudinary({
    dataUrl,
    folder: "cravzo/chat",
  });

  res.status(201).json(
    apiResponse({
      message: "Chat image uploaded successfully",
      data: uploaded,
    }),
  );
};

const createMessageForRoom = async ({ user, roomId, text: rawText = "", imageUrl: rawImageUrl = "" }) => {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
  });

  await assertCanAccessRoom({ user: { sub: user.sub, role: user.role } }, room, { forWrite: true });

  const rateKey = `${CHAT_RATE_PREFIX}${user.sub}:${room.id}`;
  const redis = await connectRedis();
  if (redis?.isOpen) {
    const exists = await redis.exists(rateKey);
    if (exists) {
      throw new ApiError(429, "Please wait a second before sending another message");
    }
    await redis.setEx(rateKey, CHAT_RATE_TTL_SECONDS, "1");
  }

  const text = typeof rawText === "string" ? rawText.trim() : "";
  const imageUrl = typeof rawImageUrl === "string" ? rawImageUrl.trim() : "";

  if (!text && !imageUrl) {
    throw new ApiError(400, "Message text or image is required");
  }

  if (text.length > 1200) {
    throw new ApiError(400, "Message is too long");
  }

  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    throw new ApiError(400, "Invalid image URL");
  }

  const message = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.chatMessage.create({
      data: {
        roomId: room.id,
        senderId: user.sub,
        text: text || null,
        imageUrl: imageUrl || null,
        kind: getMessageKind({ text, imageUrl }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    await tx.chatRoom.update({
      where: { id: room.id },
      data: {
        lastMessageAt: createdMessage.createdAt,
      },
    });

    return createdMessage;
  });

  return sanitizeMessage(message);
};

const listAdminChatRooms = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    throw new ApiError(403, "Only admins can view the chat inbox");
  }

  const type = ["ORDER_RIDER", "ORDER_VENDOR"].includes(req.query.type) ? req.query.type : "SUPPORT";
  const rooms = await prisma.chatRoom.findMany({
    where: { type },
    orderBy: { lastMessageAt: "desc" },
    take: 30,
    include: {
      supportUser: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatarUrl: true,
        },
      },
      order: {
        select: {
          id: true,
          status: true,
          customer: {
            select: { id: true, name: true, phone: true },
          },
          rider: {
            select: { id: true, name: true, phone: true },
          },
          restaurant: {
            select: { id: true, name: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  res.status(200).json(
    apiResponse({
      message: "Admin chat rooms fetched successfully",
      data: rooms.map((room) => ({
        ...sanitizeRoom(room),
        supportUser: room.supportUser,
        order: room.order,
        latestMessage: room.messages[0] ? sanitizeMessage(room.messages[0]) : null,
      })),
    }),
  );
};

export {
  assertCanAccessRoom,
  createMessageForRoom,
  createRoomMessage,
  getOrCreateOrderRoom,
  getOrCreateSupportRoom,
  getOrCreateVendorOrderRoom,
  getRoomMessages,
  listAdminChatRooms,
  sanitizeMessage,
  sanitizeRoom,
  uploadChatImage,
};


