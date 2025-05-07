import { Request, Response } from "express";
import healthService from "../services/health.service";
import emailService from "../services/email.service";
import { logger } from "../utils/logger";
import config from "../config";

class HealthController {
  /**
   * Vérifie l'état de santé d'un service spécifique
   */
  async checkServiceHealth(req: Request, res: Response): Promise<Response> {
    try {
      const { serviceName } = req.params;

      const service = healthService["services"].find(
        (s) => s.name === serviceName
      );

      if (!service) {
        return res.status(404).json({
          success: false,
          message: `Service ${serviceName} non trouvé`
        });
      }

      const status = await healthService.checkServiceHealth(service);

      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error(
        `Erreur lors de la vérification de l'état du service:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Vérifie l'état de santé de tous les services
   */
  async checkAllServices(req: Request, res: Response): Promise<Response> {
    try {
      const statuses = await healthService.checkAllServices();

      return res.status(200).json({
        success: true,
        data: {
          services: statuses,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error(
        `Erreur lors de la vérification de l'état des services: `,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Envoie une notification Discord de test
   */
  async sendTestNotification(req: Request, res: Response): Promise<Response> {
    try {
      const { type = "info" } = req.query;
      const isAlert = type === "alert";

      const message = isAlert
        ? "🧪 Ceci est un test d'alerte provenant du service de notification CRM"
        : "🧪 Ceci est un test d'information provenant du service de notification CRM";

      const success = await healthService.sendDiscordNotification(
        message,
        isAlert
      );

      if (success) {
        return res.status(200).json({
          success: true,
          message: `Notification Discord de type ${isAlert ? "alerte" : "information"} envoyée avec succès`
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Échec de l'envoi de la notification Discord"
        });
      }
    } catch (error) {
      logger.error(
        `Erreur lors de l'envoi de la notification de test: `,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Démarre ou arrête la surveillance des services
   */
  async toggleMonitoring(req: Request, res: Response): Promise<Response> {
    try {
      const { action, intervalMinutes } = req.body;

      if (action === "start") {
        const interval =
          intervalMinutes || config.notifications.monitoring.intervalMinutes;
        healthService.startMonitoring(interval);

        return res.status(200).json({
          success: true,
          message: `Surveillance des services démarrée (intervalle: ${interval} minutes)`
        });
      } else if (action === "stop") {
        healthService.stopMonitoring();

        return res.status(200).json({
          success: true,
          message: "Surveillance des services arrêtée"
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Action invalide. Utilisez "start" ou "stop"'
        });
      }
    } catch (error) {
      logger.error(`Erreur lors de la modification de la surveillance:`, error);
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }

  /**
   * Vérifier l'état du service de notification lui-même
   */
  async healthCheck(req: Request, res: Response): Promise<Response> {
    try {
      const smtpStatus = await emailService.verifyConnection();
      const monitoringStatus = healthService["monitoringInterval"] !== null;

      return res.status(200).json({
        success: true,
        message: "Service de notification opérationnel",
        details: {
          smtp: smtpStatus ? "Connecté" : "Problème de connexion",
          monitoring: monitoringStatus ? "Actif" : "Inactif",
          version: "1.0.0",
          environment: config.server.env
        }
      });
    } catch (error) {
      logger.error(
        `Erreur lors de la vérification de l'état du service:`,
        error
      );
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error
      });
    }
  }
}

export default new HealthController();
