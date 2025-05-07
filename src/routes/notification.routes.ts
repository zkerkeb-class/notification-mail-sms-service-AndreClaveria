import { Router } from "express";
import notificationController from "../controllers/notification.controller";

const router = Router();

// Envoyer un email de confirmation
router.post("/send-confirmation", notificationController.sendConfirmationEmail);

// Récupérer l'historique des notifications
// router.get("/history", notificationController.getNotificationHistory);

export default router;
