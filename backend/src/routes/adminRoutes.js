import { Router } from "express";

import { getAdminOverview } from "../controllers/adminController.js";
import { initiateAdminRefund, reconcileAdminRefund } from "../controllers/adminRefundController.js";
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
  grantRestaurantOperatorAccess,
  listRestaurantOperatorAccesses,
  listRestaurants,
  revokeRestaurantOperatorAccess,
  updateRestaurantStatus,
} from "../controllers/adminRestaurantController.js";
import { getAdminPricingSettings, updateAdminPricingSettings } from "../controllers/adminPricingController.js";
import {
  listPromoCodes,
  getPromoCode,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeStats,
} from "../controllers/adminPromoCodeController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const adminRouter = Router();

adminRouter.use(authenticate, authorize("ADMIN"));

adminRouter.get("/overview", asyncHandler(getAdminOverview));
adminRouter.get("/pricing-settings", asyncHandler(getAdminPricingSettings));
adminRouter.patch("/pricing-settings", asyncHandler(updateAdminPricingSettings));
adminRouter.post("/orders/:orderId/refund/initiate", asyncHandler(initiateAdminRefund));
adminRouter.post("/orders/:orderId/refund/reconcile", asyncHandler(reconcileAdminRefund));
adminRouter.get("/support/user-search", asyncHandler(searchUserSupportDetails));
adminRouter.get("/users", asyncHandler(listUsers));
adminRouter.get("/users/:userId", asyncHandler(getUserDetails));
adminRouter.get("/users/:userId/orders", asyncHandler(getUserOrders));
adminRouter.get("/restaurants", asyncHandler(listRestaurants));
adminRouter.post("/restaurants", asyncHandler(createRestaurantForVendor));
adminRouter.get("/restaurant-operator-accesses", asyncHandler(listRestaurantOperatorAccesses));
adminRouter.post("/restaurant-operator-accesses", asyncHandler(grantRestaurantOperatorAccess));
adminRouter.delete("/restaurant-operator-accesses", asyncHandler(revokeRestaurantOperatorAccess));
adminRouter.patch("/users/:userId/status", asyncHandler(updateUserStatus));
adminRouter.patch("/restaurants/:restaurantId/status", asyncHandler(updateRestaurantStatus));
adminRouter.get("/vendors/pending", asyncHandler(getPendingVendors));
adminRouter.patch("/vendors/:vendorId/approve", asyncHandler(approveVendor));
adminRouter.get("/riders/pending", asyncHandler(getPendingRiders));
adminRouter.patch("/riders/:riderId/approve", asyncHandler(approveRider));

// ── Promo Codes ────────────────────────────────────────────────────────────────
adminRouter.get("/promo-codes/stats",  asyncHandler(getPromoCodeStats));
adminRouter.get("/promo-codes",        asyncHandler(listPromoCodes));
adminRouter.get("/promo-codes/:id",    asyncHandler(getPromoCode));
adminRouter.post("/promo-codes",       asyncHandler(createPromoCode));
adminRouter.patch("/promo-codes/:id",  asyncHandler(updatePromoCode));
adminRouter.delete("/promo-codes/:id", asyncHandler(deletePromoCode));

export { adminRouter };

