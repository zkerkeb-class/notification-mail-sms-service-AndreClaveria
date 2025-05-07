import { transporter, defaultMailOptions } from "../config/email-config";
import { logger } from "../utils/logger";
import { getConfirmationEmailTemplate } from "../templates/confirmation-email";
import config from "../config";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  metadata?: Record<string, any>;
}

class EmailService {
  /**
   * Envoie un email sans persistance en base de données
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text, metadata = {} } = options;

    try {
      // Envoyer l'email
      const mailOptions = {
        ...defaultMailOptions,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, "") // Convertir HTML en texte si text n'est pas fourni
      };

      const info = await transporter.sendMail(mailOptions);

      // Log les informations de l'email envoyé
      logger.info(`Email envoyé avec succès à ${to}, ID: ${info.messageId}`);
      logger.debug(
        `Métadonnées de l'email: ${JSON.stringify({
          to,
          subject,
          messageId: info.messageId,
          response: info.response,
          ...metadata
        })}`
      );

      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de l'email à ${to}`, error);
      logger.error(`Détails de l'erreur: ${JSON.stringify(error)}`);
      return false;
    }
  }

  /**
   * Envoie un email de confirmation d'inscription
   */
  async sendConfirmationEmail(
    email: string,
    confirmationToken: string,
    username: string
  ): Promise<boolean> {
    const confirmUrl = `${config.services.frontend.url}/confirm-email?token=${confirmationToken}`;

    const { html, text } = getConfirmationEmailTemplate({
      username,
      confirmUrl
    });

    return this.sendEmail({
      to: email,
      subject: "Confirmez votre adresse email pour CRM AndreClaveria",
      html,
      text,
      metadata: {
        emailType: "confirmation",
        username,
        confirmationToken,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Vérifie la connexion SMTP
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      logger.info("Connexion SMTP vérifiée avec succès");
      return true;
    } catch (error) {
      logger.error(
        `Erreur lors de la vérification de la connexion SMTP:`,
        error
      );
      return false;
    }
  }
}

export default new EmailService();
