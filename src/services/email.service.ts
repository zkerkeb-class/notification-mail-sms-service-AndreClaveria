// services/emailService.ts
import { transporter, defaultMailOptions } from "../config/email-config";
import { logger } from "../utils/logger";
import { getConfirmationEmailTemplate } from "../templates/confirmation-email";
import config from "../config";
import EmailHistory from "../models/email.model";
import { DataService } from "./data.service";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  metadata?: Record<string, any>;
}

interface SendCRMEmailOptions {
  fromUserId: string;
  fromCompanyId: string;
  toContactId: string;
  subject: string;
  body: string;
  htmlBody?: string;
  template?: string;
  templateType?: EmailTemplateType;
  authToken?: string;
}

export type EmailTemplateType =
  | "professional"
  | "followup"
  | "proposal"
  | "meeting"
  | "thank-you"
  | "introduction"
  | "newsletter"
  | "reminder";

// Fonction utilitaire pour gérer les erreurs
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Une erreur inconnue s'est produite";
};

class EmailService {
  /**
   * Envoie un email sans persistance en base de données (méthode existante)
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text, metadata = {} } = options;

    try {
      const replyToString = `${defaultMailOptions.replyTo.name} <${defaultMailOptions.replyTo.email}>`;

      const mailOptions = {
        ...defaultMailOptions,
        replyTo: replyToString, // Override with string format
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, "")
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
   * DEBUG VERSION: Envoie un email CRM avec logging détaillé
   */
  async sendCRMEmail(options: SendCRMEmailOptions) {
    const {
      fromUserId,
      fromCompanyId,
      toContactId,
      subject,
      body,
      htmlBody,
      template,
      templateType,
      authToken
    } = options;

    // Générer un ID de tracking unique
    const trackingId = `crm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info(`🚀 Début sendCRMEmail - trackingId: ${trackingId}`);
    logger.info(`📋 Paramètres reçus:`, {
      fromUserId,
      fromCompanyId,
      toContactId,
      subject,
      hasAuthToken: !!authToken,
      bodyLength: body?.length || 0
    });

    try {
      // STEP 1: Get all required data
      logger.info(`📡 Récupération des données via DataService...`);

      let company, user, contact;

      try {
        logger.info(`📡 Récupération company (${fromCompanyId})...`);
        company = await DataService.getCompanyById(fromCompanyId, authToken);
        logger.info(`✅ Company récupérée:`, {
          name: company?.name,
          email: company?.email
        });
      } catch (error) {
        logger.error(`❌ Erreur récupération company:`, error);
        throw new Error(`Impossible de récupérer l'entreprise: `);
      }

      try {
        logger.info(`📡 Récupération user (${fromUserId})...`);
        user = await DataService.getUserById(fromUserId, authToken);
        logger.info(`✅ User récupéré:`, {
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email
        });
      } catch (error) {
        logger.error(`❌ Erreur récupération user:`, error);
        throw new Error(`Impossible de récupérer l'utilisateur: `);
      }

      try {
        logger.info(`📡 Récupération contact (${toContactId})...`);
        contact = await DataService.getContactById(toContactId, authToken);
        logger.info(`✅ Contact récupéré:`, {
          firstName: contact?.firstName,
          lastName: contact?.lastName,
          email: contact?.email
        });
      } catch (error) {
        logger.error(`❌ Erreur récupération contact:`, error);
        throw new Error(`Impossible de récupérer le contact: `);
      }

      if (!contact.email) {
        logger.error(`❌ Contact sans email:`, contact);
        throw new Error(`Le contact ${toContactId} n'a pas d'adresse email`);
      }

      // STEP 2: Create EmailHistory with the actual email
      logger.info(
        `💾 Création de l'EmailHistory avec toEmail: ${contact.email}`
      );
      const emailHistory = new EmailHistory({
        fromUserId,
        fromCompanyId,
        toContactId,
        toEmail: contact.email,
        subject,
        body,
        htmlBody,
        status: "pending",
        emailProvider: "brevo",
        trackingId
      });

      // STEP 3: Prepare content
      logger.info(`📝 Préparation du contenu...`);
      let finalBody = body;
      let finalHtmlBody = htmlBody;

      if (templateType) {
        logger.info(`🎨 Application du template: ${templateType}`);
        const { html: templateHtml, text: templateText } =
          this.generateEmailTemplate(templateType, {
            user,
            company,
            contact,
            content: { subject, body }
          });
        finalBody = templateText;
        finalHtmlBody = templateHtml;
      } else {
        logger.info(`✍️ Ajout de la signature...`);
        const signature = this.createSignature(user, company);
        finalBody = `${body}\n\n${signature}`;
        finalHtmlBody = htmlBody
          ? `${htmlBody}<div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px;">${signature.replace(/\n/g, "<br>")}</div>`
          : `<div style="white-space: pre-line;">${finalBody}</div>`;
      }

      // STEP 4: Prepare mail options
      const fromEmail = company.email;
      const fromName = `${user.firstName} ${user.lastName}`;

      logger.info(`📧 Préparation des options d'email:`, {
        from: `${fromName} <${fromEmail}>`,
        to: contact.email,
        subject,
        trackingId
      });

      const mailOptions = {
        from: {
          name: fromName,
          address: fromEmail
        },
        to: contact.email,
        subject,
        html: finalHtmlBody,
        text: finalBody,
        replyTo: user.email || fromEmail,
        headers: {
          "X-CRM-Tracking-ID": trackingId,
          "X-CRM-Contact-ID": toContactId,
          "X-CRM-User-ID": fromUserId,
          "X-CRM-Company-ID": fromCompanyId
        }
      };

      // STEP 5: Send email
      logger.info(`📤 Envoi de l'email via transporter...`);
      let info;
      try {
        info = await transporter.sendMail(mailOptions);
        logger.info(`✅ Email envoyé avec succès:`, {
          messageId: info.messageId,
          response: info.response
        });
      } catch (error) {
        logger.error(`❌ Erreur lors de l'envoi SMTP:`, error);
        throw new Error(`Erreur SMTP: ${getErrorMessage(error)}`);
      }

      // STEP 6: Update and save EmailHistory
      logger.info(`💾 Mise à jour de l'EmailHistory...`);
      emailHistory.status = "sent";
      emailHistory.sentAt = new Date();
      emailHistory.metadata = {
        messageId: info.messageId,
        response: info.response,
        brevoMessageId: info.messageId
      };

      try {
        await emailHistory.save();
        logger.info(`✅ EmailHistory sauvegardé avec succès`);
      } catch (error) {
        logger.error(`❌ Erreur sauvegarde EmailHistory:`, error);
        throw new Error(`Erreur sauvegarde: ${getErrorMessage(error)}`);
      }

      logger.info(
        `🎉 Email CRM envoyé avec succès - trackingId: ${trackingId}`
      );

      return {
        success: true,
        emailHistory,
        messageId: info.messageId,
        trackingId,
        sentTo: contact.email,
        sentFrom: fromEmail
      };
    } catch (error) {
      logger.error(`💥 Erreur dans sendCRMEmail:`, {
        trackingId,
        error: getErrorMessage(error),
        stack: error instanceof Error ? error.stack : "No stack trace available"
      });

      // Handle error properly - only save if we have contact email
      try {
        logger.info(`🔄 Tentative de sauvegarde de l'erreur...`);
        const contact = await DataService.getContactById(
          toContactId,
          authToken
        );
        if (contact?.email) {
          const failedEmailHistory = new EmailHistory({
            fromUserId,
            fromCompanyId,
            toContactId,
            toEmail: contact.email,
            subject,
            body,
            htmlBody,
            status: "failed",
            emailProvider: "brevo",
            trackingId,
            errorMessage: getErrorMessage(error)
          });
          await failedEmailHistory.save();
          logger.info(`✅ Erreur sauvegardée dans EmailHistory`);
        }
      } catch (saveError) {
        logger.error("❌ Erreur lors de la sauvegarde de l'échec:", saveError);
      }

      throw error;
    }
  }
  /**
   * NOUVELLE MÉTHODE: Traiter les réponses entrantes de Brevo
   */
  async processInboundReply(webhookData: any) {
    try {
      const {
        From: from,
        To: to,
        Subject: subject,
        Html: html,
        Text: text,
        Headers: headers,
        MessageId: messageId,
        References: references,
        InReplyTo: inReplyTo
      } = webhookData;

      logger.info(`Traitement d'une réponse entrante de ${from}`);

      // 1. Identifier l'email original via les headers
      let originalEmail = null;

      if (headers && headers["X-CRM-Tracking-ID"]) {
        originalEmail = await EmailHistory.findOne({
          trackingId: headers["X-CRM-Tracking-ID"]
        });
      }

      // 2. Si pas trouvé par header, essayer par références d'email
      if (!originalEmail && (inReplyTo || references)) {
        const referenceIds = [
          inReplyTo,
          ...(references ? references.split(" ") : [])
        ].filter(Boolean);

        originalEmail = await EmailHistory.findOne({
          $or: [
            { "metadata.messageId": { $in: referenceIds } },
            { "metadata.brevoMessageId": { $in: referenceIds } }
          ]
        });
      }

      if (!originalEmail) {
        logger.warn(
          `Impossible d'identifier l'email original pour la réponse de ${from}`
        );
        return null;
      }

      // 3. Créer l'entrée pour la réponse
      const replyHistory = new EmailHistory({
        fromUserId: null, // Réponse externe
        fromCompanyId: originalEmail.fromCompanyId,
        toContactId: originalEmail.toContactId,
        toEmail: Array.isArray(to) ? to[0] : to,
        fromEmail: from,
        subject: subject,
        body: text,
        htmlBody: html,
        status: "received",
        emailProvider: "brevo",
        isReply: true,
        originalEmailId: originalEmail._id,
        metadata: {
          originalTrackingId: originalEmail.trackingId,
          inboundMessageId: messageId,
          receivedAt: new Date(),
          webhookData: webhookData
        }
      });

      await replyHistory.save();

      // 4. Mettre à jour l'email original
      await EmailHistory.findByIdAndUpdate(originalEmail._id, {
        $set: {
          hasReply: true,
          lastReplyAt: new Date()
        },
        $inc: {
          replyCount: 1
        }
      });

      return replyHistory;
    } catch (error) {
      logger.error("Erreur lors du traitement de la réponse:", error);
      throw error;
    }
  }

  /**
   * Génère le template d'email selon le type
   */
  private generateEmailTemplate(
    type: EmailTemplateType,
    data: {
      user: any;
      company: any;
      contact: any;
      content: { subject: string; body: string };
    }
  ): { html: string; text: string } {
    // Corps du message selon le type
    const bodyContent = this.getBodyByType(type, data);

    // Signature simple comme dans votre méthode
    const signature = this.createSignature(data.user, data.company);

    // HTML simple
    const html = `<div style="white-space: pre-line;">${bodyContent}\n\n${signature.replace(/\n/g, "<br>")}</div>`;

    // Version texte
    const text = `${bodyContent}\n\n${signature}`;

    return { html, text };
  }

  /**
   * Génère le contenu du corps selon le type d'email
   */
  private getBodyByType(
    type: EmailTemplateType,
    data: {
      user: any;
      company: any;
      contact: any;
      content: { subject: string; body: string };
    }
  ): string {
    const contactName = data.contact.firstName;
    const baseBody = data.content.body;

    switch (type) {
      case "professional":
        return `Bonjour ${contactName},\n\n${baseBody}`;

      case "followup":
        return `Bonjour ${contactName},\n\nJ'espère que vous allez bien.\n\n${baseBody}\n\nN'hésitez pas à me contacter si vous avez des questions.`;

      case "proposal":
        return `Cher(e) ${contactName},\n\nSuite à nos échanges, j'ai le plaisir de vous présenter notre proposition :\n\n${baseBody}`;

      case "meeting":
        return `Bonjour ${contactName},\n\n${baseBody}`;

      case "thank-you":
        return `Cher(e) ${contactName},\n\nJe tenais à vous remercier pour le temps que vous nous avez accordé.\n\n${baseBody}\n\nAu plaisir de poursuivre nos échanges très prochainement.`;

      case "introduction":
        return `Bonjour ${contactName},\n\nJ'espère que ce message vous trouve en bonne santé.\n\nPermettez-moi de me présenter : je suis ${data.user.firstName} ${data.user.lastName}, ${data.user.position || "représentant"} chez ${data.company.name}.\n\n${baseBody}`;

      case "newsletter":
        return `Bonjour ${contactName},\n\nVoici les dernières actualités de ${data.company.name} :\n\n${baseBody}`;

      case "reminder":
        return `Bonjour ${contactName},\n\nJe me permets de vous rappeler :\n\n${baseBody}\n\nMerci de votre attention.`;

      default:
        return `Bonjour ${contactName},\n\n${baseBody}`;
    }
  }

  /**
   * Envoie un email de confirmation d'inscription (méthode existante)
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
   * NOUVELLE MÉTHODE : Récupère l'historique des emails
   */
  async getEmailHistory(filters: {
    userId?: string;
    companyId?: string;
    contactId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      companyId,
      contactId,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10
    } = filters;

    const filter: any = {};

    if (userId) filter.fromUserId = userId;
    if (companyId) filter.fromCompanyId = companyId;
    if (contactId) filter.toContactId = contactId;
    if (status) filter.status = status;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = dateFrom;
      if (dateTo) filter.createdAt.$lte = dateTo;
    }

    try {
      const [emails, total] = await Promise.all([
        EmailHistory.find(filter)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip((page - 1) * limit)
          .lean(),
        EmailHistory.countDocuments(filter)
      ]);

      return {
        emails,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error(
        `Erreur lors de la récupération de l'historique: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  /**
   * NOUVELLE MÉTHODE : Récupère les statistiques d'emails
   */
  async getEmailStats(filters: {
    userId?: string;
    companyId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const { userId, companyId, dateFrom, dateTo } = filters;

    const matchFilter: any = {};
    if (userId) matchFilter.fromUserId = userId;
    if (companyId) matchFilter.fromCompanyId = companyId;
    if (dateFrom || dateTo) {
      matchFilter.createdAt = {};
      if (dateFrom) matchFilter.createdAt.$gte = dateFrom;
      if (dateTo) matchFilter.createdAt.$lte = dateTo;
    }

    try {
      const stats = await EmailHistory.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalEmails: { $sum: 1 },
            sentEmails: {
              $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] }
            },
            failedEmails: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
            },
            pendingEmails: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
            }
          }
        }
      ]);

      return (
        stats[0] || {
          totalEmails: 0,
          sentEmails: 0,
          failedEmails: 0,
          pendingEmails: 0
        }
      );
    } catch (error) {
      logger.error(
        `Erreur lors du calcul des statistiques: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async getEmailHistoryByUserId(
    userId: string,
    authToken?: string,
    filters?: {
      companyId?: string;
      contactId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const {
      companyId,
      contactId,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10
    } = filters || {};

    try {
      // 1. Récupérer les informations utilisateur depuis le service externe
      logger.info(
        `Récupération des informations pour l'utilisateur ${userId}...`
      );
      const user = await DataService.getUserById(userId, authToken);

      if (!user) {
        throw new Error(`Utilisateur ${userId} non trouvé`);
      }

      // 2. Construire le filtre pour la requête
      const filter: any = { fromUserId: userId };

      if (companyId) filter.fromCompanyId = companyId;
      if (contactId) filter.toContactId = contactId;
      if (status) filter.status = status;

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = dateFrom;
        if (dateTo) filter.createdAt.$lte = dateTo;
      }

      // 3. Récupérer l'historique des emails
      const [emails, total] = await Promise.all([
        EmailHistory.find(filter)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip((page - 1) * limit)
          .lean(),
        EmailHistory.countDocuments(filter)
      ]);

      // 4. Enrichir les données avec les informations utilisateur
      const enrichedEmails = emails.map((email) => ({
        ...email,
        userInfo: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          position: user.position
        }
      }));

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          position: user.position
        },
        emails: enrichedEmails,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      logger.error(
        `Erreur lors de la récupération de l'historique pour l'utilisateur ${userId}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async getEmailStatsByUserId(
    userId: string,
    authToken?: string,
    filters?: {
      companyId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ) {
    const { companyId, dateFrom, dateTo } = filters || {};

    try {
      // 1. Vérifier que l'utilisateur existe
      const user = await DataService.getUserById(userId, authToken);
      if (!user) {
        throw new Error(`Utilisateur ${userId} non trouvé`);
      }

      // 2. Construire le filtre
      const matchFilter: any = { fromUserId: userId };

      if (companyId) matchFilter.fromCompanyId = companyId;
      if (dateFrom || dateTo) {
        matchFilter.createdAt = {};
        if (dateFrom) matchFilter.createdAt.$gte = dateFrom;
        if (dateTo) matchFilter.createdAt.$lte = dateTo;
      }

      // 3. Calculer les statistiques
      const stats = await EmailHistory.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalEmails: { $sum: 1 },
            sentEmails: {
              $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] }
            },
            failedEmails: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
            },
            pendingEmails: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalEmails: 0,
        sentEmails: 0,
        failedEmails: 0,
        pendingEmails: 0
      };

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        stats: result
      };
    } catch (error) {
      logger.error(
        `Erreur lors du calcul des statistiques pour l'utilisateur ${userId}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  /**
   * Vérifie la connexion SMTP (méthode existante)
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

  /**
   * Crée la signature utilisateur
   */
  private createSignature(user: any, company: any): string {
    const lines = ["--", `${user.firstName} ${user.lastName}`];

    if (user.position) lines.push(user.position);
    if (company.name) lines.push(company.name);
    if (company.email) lines.push(`Email: ${company.email}`);
    if (company.phone) lines.push(`Tél: ${company.phone}`);
    if (company.address) lines.push(company.address);
    if (company.website) lines.push(company.website);

    return lines.join("\n");
  }
}

export default new EmailService();
