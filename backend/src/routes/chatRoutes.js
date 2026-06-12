import { Router } from "express";

import {
  createRoomMessage,
  getOrCreateOrderRoom,
  getOrCreateSupportRoom,
  getOrCreateVendorOrderRoom,
  getRoomMessages,
  listAdminChatRooms,
  sanitizeRoom,
  uploadChatImage,
} from "../controllers/chatController.js";
import { ApiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/database.js";

const chatRouter = Router();

chatRouter.use(authenticate);
chatRouter.get("/admin/rooms", authorize("ADMIN"), asyncHandler(listAdminChatRooms));
chatRouter.get("/admin/rooms/:customerId", authorize("ADMIN"), asyncHandler(async (req, res) => {
  const room = await prisma.chatRoom.findFirst({
    where: { type: "SUPPORT", supportUserId: req.params.customerId },
  });
  if (!room) throw new ApiError(404, "No support room found for this customer");
  res.status(200).json(apiResponse({ message: "Customer support room found", data: sanitizeRoom(room) }));
}));
chatRouter.get("/support", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(getOrCreateSupportRoom));
chatRouter.get("/orders/:orderId", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(getOrCreateOrderRoom));
chatRouter.get("/orders/:orderId/vendor", authorize("CUSTOMER", "VENDOR", "ADMIN"), asyncHandler(getOrCreateVendorOrderRoom));
chatRouter.get("/rooms/:roomId/messages", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(getRoomMessages));
chatRouter.post("/rooms/:roomId/messages", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(createRoomMessage));
chatRouter.post("/rooms/:roomId/images", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(uploadChatImage));

export { chatRouter };
