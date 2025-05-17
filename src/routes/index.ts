import { Router } from "express";

import notificationRoutes from "./notification.routes";

const router = Router();

// Routes de notification
router.use("/notification", notificationRoutes);

export default router;
