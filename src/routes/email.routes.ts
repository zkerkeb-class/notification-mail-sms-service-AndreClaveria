// routes/email.route.ts
import { Router } from "express";
import crmEmailController from "../controllers/email.controller";
import {
  authenticateJWT,
  authorizeRoles
} from "../middlewares/auth.middleware";

const router = Router();

// ============================================
// ROUTES PUBLIQUES (sans authentification)
// ============================================

// Webhook pour traiter les réponses entrantes de Brevo
// Cette route doit être publique car elle est appelée par Brevo
router.post("/webhook/inbound", crmEmailController.processInboundReply);

// ============================================
// ROUTES PROTÉGÉES (avec authentification JWT)
// ============================================

// Appliquer l'authentification JWT aux routes suivantes
router.use(authenticateJWT);

// ============================================
// ENVOI D'EMAILS
// ============================================

router.post(
  "/send",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.sendCRMEmail
);

// ============================================
// HISTORIQUE ET CONSULTATION
// ============================================

// Historique général des emails
router.get(
  "/history",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.getEmailHistory
);

// Historique spécifique à un utilisateur
router.get(
  "/user/:userId/history",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.getEmailHistoryByUserId
);

// Détails d'un email spécifique
router.get(
  "/:emailId/details",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.getEmailDetails
);

// ============================================
// GESTION DES RÉPONSES ET CONVERSATIONS
// ============================================

// Récupérer toutes les réponses d'un email
router.get(
  "/:emailId/replies",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.getEmailReplies
);

// Récupérer la conversation complète (email + réponses)
router.get(
  "/:emailId/conversation",

  crmEmailController.getEmailConversation
);

// Rechercher un email par tracking ID
router.get(
  "/tracking/:trackingId",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.getEmailByTrackingId
);

// ============================================
// STATISTIQUES
// ============================================

// Statistiques générales
router.get(
  "/stats",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.getEmailStats
);

// Statistiques spécifiques à un utilisateur
router.get(
  "/user/:userId/stats",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.getEmailStatsByUserId
);

// ============================================
// GESTION DES EMAILS
// ============================================

// Marquer un email comme lu/non lu
router.patch(
  "/:emailId/read",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.markEmailAsRead
);

// Supprimer un email (soft delete ou permanent)
router.delete(
  "/:emailId",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.deleteEmail
);

// ============================================
// OUTILS ET TESTS
// ============================================

// Test de connexion SMTP (admin seulement)
router.get(
  "/test-connection",
  authorizeRoles("admin"),
  crmEmailController.testConnection
);

// ============================================
// ROUTE GÉNÉRIQUE (à placer en dernier)
// ============================================

// Cette route doit être en dernier pour éviter les conflits
router.get(
  "/:emailId",
  authorizeRoles("admin", "manager", "user"),
  crmEmailController.getEmailDetails
);

export default router;
