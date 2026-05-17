import { Router } from "express";

import { adminRouter } from "./adminRoutes.js";
import { authRouter } from "./authRoutes.js";
import { chatRouter } from "./chatRoutes.js";
import { favoriteRouter } from "./favoriteRoutes.js";
import { menuRouter } from "./menuRoutes.js";
import { notificationRouter } from "./notificationRoutes.js";
import { orderRouter } from "./orderRoutes.js";
import { paymentRouter } from "./paymentRoutes.js";
import { reviewRouter } from "./reviewRoutes.js";
import { restaurantRouter } from "./restaurantRoutes.js";
import { userRouter } from "./userRoutes.js";
import riderRouter  from "./riderRoutes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/chats", chatRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/restaurants", restaurantRouter);
apiRouter.use("/menu-items", menuRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/favorites", favoriteRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/rider", riderRouter);

export { apiRouter };
