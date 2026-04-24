import { Router } from "express";

import { createCheckoutOrder, getRazorpayConfig, verifyAndCreatePaidOrder,createCODOrder } from "../controllers/paymentController.js";
import { authorize, authenticate } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const paymentRouter = Router();

paymentRouter.use(authenticate, authorize("CUSTOMER"));
paymentRouter.get("/razorpay/config", asyncHandler(getRazorpayConfig));
paymentRouter.post("/razorpay/order", asyncHandler(createCheckoutOrder));
paymentRouter.post("/razorpay/verify", asyncHandler(verifyAndCreatePaidOrder));
paymentRouter.post("/cod/order", asyncHandler(createCODOrder));

export { paymentRouter };
