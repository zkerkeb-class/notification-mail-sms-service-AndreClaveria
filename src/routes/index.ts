import { Router } from "express";

import notificationRoutes from "./notification.routes";
import emailRoutes from "./email.routes";
const router = Router();

// Routes de notification
router.use("/notification", notificationRoutes);
router.use("/email", emailRoutes);
export default router;
