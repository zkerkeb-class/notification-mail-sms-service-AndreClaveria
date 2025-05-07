import { Router } from "express";
import healthController from "../controllers/health.controller";
import {
  authenticateJWT,
  authorizeRoles
} from "../middlewares/auth.middleware";

const router = Router();

// Route publique pour vérifier l'état du service
router.get("/", healthController.healthCheck);

// Vérifier l'état de tous les services
router.get(
  "/all",
  authenticateJWT,
  authorizeRoles("admin"),
  healthController.checkAllServices
);


router.get("/service/:serviceName", healthController.checkServiceHealth);

router.post("/test-notification", healthController.sendTestNotification);

router.post("/monitoring", healthController.toggleMonitoring);

export default router;
