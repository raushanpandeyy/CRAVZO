import { Router } from "express";

import { getAdminOverview } from "../controllers/adminController.js";
import {
  approveRider,
  approveVendor,
  getPendingRiders,
  getPendingVendors,
  getUserDetails,
  getUserOrders,
  listUsers,
  searchUserSupportDetails,
  updateUserStatus,
} from "../controllers/adminUserController.js";
import {
  createRestaurantForVendor,
  listRestaurants,
  updateRestaurantStatus,
} from "../controllers/adminRestaurantController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const adminRouter = Router();

adminRouter.use(authenticate, authorize("ADMIN"));
adminRouter.get("/debug-user", (req, res) => res.json({ user: req.user }));
adminRouter.get("/test", (req, res) => res.json({ message: "test works" }));
adminRouter.get("/overview", asyncHandler(getAdminOverview));
adminRouter.get("/support/user-search", asyncHandler(searchUserSupportDetails));
adminRouter.get("/users", asyncHandler(listUsers));
adminRouter.get("/users/:userId", asyncHandler(getUserDetails));
adminRouter.get("/users/:userId/orders", asyncHandler(getUserOrders));
adminRouter.get("/restaurants", asyncHandler(listRestaurants));
adminRouter.post("/restaurants", asyncHandler(createRestaurantForVendor));
adminRouter.patch("/users/:userId/status", asyncHandler(updateUserStatus));
adminRouter.patch("/restaurants/:restaurantId/status", asyncHandler(updateRestaurantStatus));
adminRouter.get("/vendors/pending", asyncHandler(getPendingVendors));
adminRouter.patch("/vendors/:vendorId/approve", asyncHandler(approveVendor));
adminRouter.get("/riders/pending", asyncHandler(getPendingRiders));
adminRouter.patch("/riders/:riderId/approve", asyncHandler(approveRider));

export { adminRouter };
