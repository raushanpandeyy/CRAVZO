import { Router } from "express";
import { adminRouter } from "../adminRoutes.js";
import { authRouter } from "../authRoutes.js";
import { chatRouter } from "../chatRoutes.js";
import { favoriteRouter } from "../favoriteRoutes.js";
import { menuRouter } from "../menuRoutes.js";
import { notificationRouter } from "../notificationRoutes.js";
import { orderRouter } from "../orderRoutes.js";
import { paymentRouter } from "../paymentRoutes.js";
import { promotionRouter } from "../promotionRoutes.js";
import { publicRouter } from "../publicRoutes.js";
import { reviewRouter } from "../reviewRoutes.js";
import { referralRouter } from "../referralRoutes.js";
import { restaurantRouter } from "../restaurantRoutes.js";
import { userRouter } from "../userRoutes.js";
import riderRouter from "../riderRoutes.js";

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/chats", chatRouter);
v1Router.use("/users", userRouter);
v1Router.use("/restaurants", restaurantRouter);
v1Router.use("/menu-items", menuRouter);
v1Router.use("/orders", orderRouter);
v1Router.use("/notifications", notificationRouter);
v1Router.use("/payments", paymentRouter);
v1Router.use("/promotions", promotionRouter);
v1Router.use("/public", publicRouter);
v1Router.use("/admin", adminRouter);
v1Router.use("/favorites", favoriteRouter);
v1Router.use("/reviews", reviewRouter);
v1Router.use("/referrals", referralRouter);
v1Router.use("/rider", riderRouter);

export { v1Router };
