import { Router } from "express";

import {
  createRoomMessage,
  getOrCreateOrderRoom,
  getOrCreateSupportRoom,
  getRoomMessages,
  listAdminChatRooms,
  uploadChatImage,
} from "../controllers/chatController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const chatRouter = Router();

chatRouter.use(authenticate);
chatRouter.get("/admin/rooms", authorize("ADMIN"), asyncHandler(listAdminChatRooms));
chatRouter.get("/support", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(getOrCreateSupportRoom));
chatRouter.get("/orders/:orderId", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(getOrCreateOrderRoom));
chatRouter.get("/rooms/:roomId/messages", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(getRoomMessages));
chatRouter.post("/rooms/:roomId/messages", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(createRoomMessage));
chatRouter.post("/rooms/:roomId/images", authorize("CUSTOMER", "VENDOR", "RIDER", "ADMIN"), asyncHandler(uploadChatImage));

export { chatRouter };
