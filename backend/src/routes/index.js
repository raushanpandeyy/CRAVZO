import { Router } from "express";

import { adminRouter } from "./adminRoutes.js";
import { analyticsRouter } from "./analyticsRoutes.js";
import { authRouter } from "./authRoutes.js";
import { chatRouter } from "./chatRoutes.js";
import { couponRouter } from "./couponRoutes.js";
import { favoriteRouter } from "./favoriteRoutes.js";
import { menuRouter } from "./menuRoutes.js";
import { notificationRouter } from "./notificationRoutes.js";
import { orderRouter } from "./orderRoutes.js";
import { paymentRouter } from "./paymentRoutes.js";
import { promotionRouter } from "./promotionRoutes.js";
import { publicRouter } from "./publicRoutes.js";
import { reviewRouter } from "./reviewRoutes.js";
import { restaurantRouter } from "./restaurantRoutes.js";
import { riderRatingRouter } from "./riderRatingRoutes.js";
import { userRouter } from "./userRoutes.js";
import riderRouter  from "./riderRoutes.js";
import { referralRouter } from "./referralRoutes.js";
import { v1Router } from "./v1/index.js";

const apiRouter = Router();

apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/chats", chatRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/restaurants", restaurantRouter);
apiRouter.use("/menu-items", menuRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/promotions", promotionRouter);
apiRouter.use("/public", publicRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/favorites", favoriteRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/rider", riderRouter);
apiRouter.use("/coupons", couponRouter);
apiRouter.use("/rider-ratings", riderRatingRouter);
apiRouter.use("/referrals", referralRouter);

apiRouter.use("/v1", v1Router);

export { apiRouter };
