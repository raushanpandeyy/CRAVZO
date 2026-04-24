import { Router } from "express";

import { adminRouter } from "./adminRoutes.js";
import { authRouter } from "./authRoutes.js";
import { favoriteRouter } from "./favoriteRoutes.js";
import { menuRouter } from "./menuRoutes.js";
import { orderRouter } from "./orderRoutes.js";
<<<<<<< HEAD
import { paymentRouter } from "./paymentRoutes.js";
import { reviewRouter } from "./reviewRoutes.js";
import { restaurantRouter } from "./restaurantRoutes.js";
import { userRouter } from "./userRoutes.js";
import riderRouter  from "./riderRoutes.js";
=======
import { reviewRouter } from "./reviewRoutes.js";
import { restaurantRouter } from "./restaurantRoutes.js";
import { userRouter } from "./userRoutes.js";
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/restaurants", restaurantRouter);
apiRouter.use("/menu-items", menuRouter);
apiRouter.use("/orders", orderRouter);
<<<<<<< HEAD
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/favorites", favoriteRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/rider", riderRouter);
=======
apiRouter.use("/admin", adminRouter);
apiRouter.use("/favorites", favoriteRouter);
apiRouter.use("/reviews", reviewRouter);
>>>>>>> 33b5dab1833a5ae4b042ad9531206515cfafc594

export { apiRouter };
