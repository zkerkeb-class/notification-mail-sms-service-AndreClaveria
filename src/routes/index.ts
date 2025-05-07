import { Router } from "express";
import healthRoutes from "./health.routes";
import notificationRoutes from "./notification.routes";

const router = Router();

// Routes de santé
router.use("/health", healthRoutes);
// Routes de notification
router.use("/notification", notificationRoutes);

export default router;
