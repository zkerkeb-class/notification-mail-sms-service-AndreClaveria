import { Request, Response } from "express";
import emailService from "../services/email.service";
import { logger } from "../utils/logger";

class NotificationController {
  async sendConfirmationEmail(req: Request, res: Response): Promise<Response> {
    try {
      const { email, confirmationToken } = req.body;

      if (!email || !confirmationToken) {
        logger.warn(
          `Tentative d'envoi d'email avec des données incomplètes: ${JSON.stringify(req.body)}`
        );
        return res.status(400).json({
          success: false,
          message: "Email et token de confirmation sont requis"
        });
      }

      // Vérifier le format de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        logger.warn(`Format d'email invalide: ${email}`);
        return res.status(400).json({
          success: false,
          message: "Format d'email invalide"
        });
      }

      const username = email.split("@")[0];

      // Tentative d'envoi
      const success = await emailService.sendConfirmationEmail(
        email,
        confirmationToken,
        username
      );

      if (success) {
        logger.info(`Email de confirmation envoyé avec succès à ${email}`);
        return res.status(200).json({
          success: true,
          message: "Email de confirmation envoyé avec succès"
        });
      } else {
        logger.error(`Échec de l'envoi d'email à ${email}`);
        return res.status(500).json({
          success: false,
          message: "Échec de l'envoi de l'email de confirmation"
        });
      }
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de l'email de confirmation:`, error);
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  async sendEmailToClient(req: Request, res: Response): Promise<Response> {
    try {
      const {email, confirmationToken} = req.body
      return res.status(200).json({
        success: false,
        message: "Email envoyé"
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
        error: error instanceof Error ? error.message : String(error)

      })
    }
  }
}

export default new NotificationController();
