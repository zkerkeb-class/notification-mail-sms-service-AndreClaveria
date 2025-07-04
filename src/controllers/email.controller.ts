// controllers/crmEmailController.ts
import { Request, Response } from "express";
import EmailService from "../services/email.service";
import { logger } from "../utils/logger";

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

export class CRMEmailController {
  /**
   * Envoie un email CRM
   */
  async sendCRMEmail(req: Request, res: Response) {
    try {
      const {
        fromUserId,
        fromCompanyId,
        toContactId,
        subject,
        body,
        htmlBody,
        template,
        templateType
      } = req.body;

      // Validation des champs requis
      if (!fromUserId || !fromCompanyId || !toContactId || !subject || !body) {
        return res.status(400).json({
          success: false,
          message:
            "Champs requis manquants: fromUserId, fromCompanyId, toContactId, subject, body"
        });
      }

      // Récupérer le token depuis l'en-tête Authorization
      const authHeader = req.headers.authorization;
      const authToken = authHeader ? authHeader.split(" ")[1] : undefined;

      const result = await EmailService.sendCRMEmail({
        fromUserId,
        fromCompanyId,
        toContactId,
        subject,
        body,
        htmlBody,
        template,
        templateType,
        authToken
      });

      res.status(200).json({
        success: true,
        message: "Email CRM envoyé avec succès",
        data: {
          emailId: result.emailHistory._id,
          messageId: result.messageId,
          trackingId: result.trackingId,
          sentTo: result.sentTo,
          sentFrom: result.sentFrom,
          sentAt: result.emailHistory.sentAt
        }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans sendCRMEmail: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi de l'email CRM",
        error: errorMessage
      });
    }
  }

  /**
   * Traite les réponses entrantes de Brevo (Webhook)
   */
  async processInboundReply(req: Request, res: Response) {
    try {
      const webhookData = req.body;

      logger.info(
        "Réception d'un webhook Brevo:",
        JSON.stringify(webhookData, null, 2)
      );

      // Validation basique du webhook
      if (!webhookData.From || !webhookData.To || !webhookData.Subject) {
        return res.status(400).json({
          success: false,
          message: "Données de webhook invalides"
        });
      }

      const result = await EmailService.processInboundReply(webhookData);

      if (!result) {
        return res.status(200).json({
          success: true,
          message: "Email traité mais aucun email original trouvé"
        });
      }

      res.status(200).json({
        success: true,
        message: "Réponse entrante traitée avec succès",
        data: {
          replyId: result._id,
          originalEmailId: result.originalEmailId,
          fromEmail: result.fromEmail,
          toEmail: result.toEmail,
          subject: result.subject,
          receivedAt: result.metadata?.receivedAt
        }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans processInboundReply: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors du traitement de la réponse entrante",
        error: errorMessage
      });
    }
  }

  /**
   * Récupère l'historique des emails
   */
  async getEmailHistory(req: Request, res: Response) {
    try {
      const {
        userId,
        companyId,
        contactId,
        status,
        dateFrom,
        dateTo,
        page = "1",
        limit = "10"
      } = req.query;

      const filters: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (userId) filters.userId = userId as string;
      if (companyId) filters.companyId = companyId as string;
      if (contactId) filters.contactId = contactId as string;
      if (status) filters.status = status as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const result = await EmailService.getEmailHistory(filters);

      res.status(200).json({
        success: true,
        message: "Historique récupéré avec succès",
        data: result.emails,
        pagination: result.pagination
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans getEmailHistory: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de l'historique",
        error: errorMessage
      });
    }
  }

  /**
   * Récupère l'historique des emails pour un utilisateur spécifique
   */
  async getEmailHistoryByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const {
        companyId,
        contactId,
        status,
        dateFrom,
        dateTo,
        page = "1",
        limit = "10"
      } = req.query;

      // Validation du paramètre userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "L'ID utilisateur est requis"
        });
      }

      // Récupérer le token depuis l'en-tête Authorization
      const authHeader = req.headers.authorization;
      const authToken = authHeader ? authHeader.split(" ")[1] : undefined;

      if (!authToken) {
        return res.status(401).json({
          success: false,
          message: "Token d'authentification requis"
        });
      }

      const filters: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      if (companyId) filters.companyId = companyId as string;
      if (contactId) filters.contactId = contactId as string;
      if (status) filters.status = status as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const result = await EmailService.getEmailHistoryByUserId(
        userId,
        authToken,
        filters
      );

      res.status(200).json({
        success: true,
        message: "Historique utilisateur récupéré avec succès",
        data: {
          user: result.user,
          emails: result.emails
        },
        pagination: result.pagination
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(
        `Erreur dans getEmailHistoryByUserId: ${errorMessage}`,
        error
      );

      // Gestion spécifique des erreurs
      if (errorMessage.includes("non trouvé")) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
          error: errorMessage
        });
      }

      if (
        errorMessage.includes("authentification") ||
        errorMessage.includes("token")
      ) {
        return res.status(401).json({
          success: false,
          message: "Erreur d'authentification",
          error: errorMessage
        });
      }

      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de l'historique utilisateur",
        error: errorMessage
      });
    }
  }

  /**
   * Récupère les statistiques d'emails générales
   */
  async getEmailStats(req: Request, res: Response) {
    try {
      const { userId, companyId, dateFrom, dateTo } = req.query;

      const filters: any = {};
      if (userId) filters.userId = userId as string;
      if (companyId) filters.companyId = companyId as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const stats = await EmailService.getEmailStats(filters);

      // Calculer les pourcentages
      const totalEmails = stats.totalEmails;
      const successRate =
        totalEmails > 0
          ? ((stats.sentEmails / totalEmails) * 100).toFixed(2)
          : 0;
      const failureRate =
        totalEmails > 0
          ? ((stats.failedEmails / totalEmails) * 100).toFixed(2)
          : 0;

      res.status(200).json({
        success: true,
        message: "Statistiques récupérées avec succès",
        data: {
          ...stats,
          successRate: `${successRate}%`,
          failureRate: `${failureRate}%`
        }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans getEmailStats: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors du calcul des statistiques",
        error: errorMessage
      });
    }
  }

  /**
   * Récupère les statistiques d'emails pour un utilisateur spécifique
   */
  async getEmailStatsByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { companyId, dateFrom, dateTo } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "L'ID utilisateur est requis"
        });
      }

      const authHeader = req.headers.authorization;
      const authToken = authHeader ? authHeader.split(" ")[1] : undefined;

      if (!authToken) {
        return res.status(401).json({
          success: false,
          message: "Token d'authentification requis"
        });
      }

      const filters: any = {};
      if (companyId) filters.companyId = companyId as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const result = await EmailService.getEmailStatsByUserId(
        userId,
        authToken,
        filters
      );

      // Calculer les pourcentages
      const totalEmails = result.stats.totalEmails;
      const successRate =
        totalEmails > 0
          ? ((result.stats.sentEmails / totalEmails) * 100).toFixed(2)
          : 0;
      const failureRate =
        totalEmails > 0
          ? ((result.stats.failedEmails / totalEmails) * 100).toFixed(2)
          : 0;

      res.status(200).json({
        success: true,
        message: "Statistiques utilisateur récupérées avec succès",
        data: {
          user: result.user,
          stats: {
            ...result.stats,
            successRate: `${successRate}%`,
            failureRate: `${failureRate}%`
          }
        }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans getEmailStatsByUserId: ${errorMessage}`, error);

      if (errorMessage.includes("non trouvé")) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
          error: errorMessage
        });
      }

      res.status(500).json({
        success: false,
        message: "Erreur lors du calcul des statistiques utilisateur",
        error: errorMessage
      });
    }
  }

  /**
   * Récupère les détails d'un email spécifique
   */
  async getEmailDetails(req: Request, res: Response) {
    try {
      const { emailId } = req.params;

      if (!emailId) {
        return res.status(400).json({
          success: false,
          message: "L'ID de l'email est requis"
        });
      }

      const EmailHistory = (await import("../models/email.model")).default;
      const email = await EmailHistory.findById(emailId)
        .populate("originalEmailId", "subject sentAt fromUserId toEmail")
        .lean();

      if (!email) {
        return res.status(404).json({
          success: false,
          message: "Email non trouvé"
        });
      }

      res.status(200).json({
        success: true,
        message: "Détails de l'email récupérés avec succès",
        data: email
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans getEmailDetails: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des détails",
        error: errorMessage
      });
    }
  }

  /**
   * Récupère les réponses d'un email spécifique
   */
  async getEmailReplies(req: Request, res: Response) {
    try {
      const { emailId } = req.params;
      const { page = "1", limit = "10" } = req.query;

      if (!emailId) {
        return res.status(400).json({
          success: false,
          message: "L'ID de l'email est requis"
        });
      }

      const EmailHistory = (await import("../models/email.model")).default;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      // Vérifier que l'email original existe
      const originalEmail = await EmailHistory.findById(emailId);
      if (!originalEmail) {
        return res.status(404).json({
          success: false,
          message: "Email original non trouvé"
        });
      }

      // Récupérer les réponses
      const [replies, total] = await Promise.all([
        EmailHistory.find({ originalEmailId: emailId })
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
        EmailHistory.countDocuments({ originalEmailId: emailId })
      ]);

      res.status(200).json({
        success: true,
        message: "Réponses récupérées avec succès",
        data: {
          originalEmail: {
            id: originalEmail._id,
            subject: originalEmail.subject,
            sentAt: originalEmail.sentAt,
            toEmail: originalEmail.toEmail
          },
          replies
        },
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans getEmailReplies: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des réponses",
        error: errorMessage
      });
    }
  }

  /**
   * Recherche des emails par tracking ID
   */
  async getEmailByTrackingId(req: Request, res: Response) {
    try {
      const { trackingId } = req.params;

      if (!trackingId) {
        return res.status(400).json({
          success: false,
          message: "Le tracking ID est requis"
        });
      }

      const EmailHistory = (await import("../models/email.model")).default;
      const email = await EmailHistory.findOne({ trackingId }).lean();

      if (!email) {
        return res.status(404).json({
          success: false,
          message: "Email non trouvé avec ce tracking ID"
        });
      }

      // Récupérer aussi les réponses liées
      const replies = await EmailHistory.find({ originalEmailId: email._id })
        .sort({ createdAt: 1 })
        .lean();

      res.status(200).json({
        success: true,
        message: "Email trouvé avec succès",
        data: {
          email,
          replies,
          hasReplies: replies.length > 0,
          replyCount: replies.length
        }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans getEmailByTrackingId: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors de la recherche par tracking ID",
        error: errorMessage
      });
    }
  }

  /**
   * Récupère la conversation complète (email + toutes ses réponses)
   */
  async getEmailConversation(req: Request, res: Response) {
    try {
      const { emailId } = req.params;

      if (!emailId) {
        return res.status(400).json({
          success: false,
          message: "L'ID de l'email est requis"
        });
      }

      const EmailHistory = (await import("../models/email.model")).default;

      // Récupérer l'email original
      const originalEmail = await EmailHistory.findById(emailId).lean();
      if (!originalEmail) {
        return res.status(404).json({
          success: false,
          message: "Email non trouvé"
        });
      }

      // Récupérer toutes les réponses dans l'ordre chronologique
      const replies = await EmailHistory.find({ originalEmailId: emailId })
        .sort({ createdAt: 1 })
        .lean();

      // Construire la conversation complète
      const conversation = [originalEmail, ...replies].sort(
        (a: any, b: any) =>
          new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
      );

      res.status(200).json({
        success: true,
        message: "Conversation récupérée avec succès",
        data: {
          originalEmailId: originalEmail._id,
          conversationLength: conversation.length,
          conversation,
          summary: {
            totalMessages: conversation.length,
            originalEmail: 1,
            replies: replies.length,
            lastActivity: (conversation[conversation.length - 1] as any)
              ?.createdAt
          }
        }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans getEmailConversation: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de la conversation",
        error: errorMessage
      });
    }
  }

  /**
   * Teste la connexion SMTP
   */
  async testConnection(req: Request, res: Response) {
    try {
      const isConnected = await EmailService.verifyConnection();

      res.status(200).json({
        success: true,
        message: isConnected
          ? "Connexion SMTP OK"
          : "Problème de connexion SMTP",
        data: { isConnected }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans testConnection: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors du test de connexion",
        error: errorMessage
      });
    }
  }

  /**
   * Marque un email comme lu/non lu
   */
  async markEmailAsRead(req: Request, res: Response) {
    try {
      const { emailId } = req.params;
      const { isRead = true } = req.body;

      if (!emailId) {
        return res.status(400).json({
          success: false,
          message: "L'ID de l'email est requis"
        });
      }

      const EmailHistory = (await import("../models/email.model")).default;
      const email: any = await EmailHistory.findByIdAndUpdate(
        emailId,
        {
          $set: {
            "metadata.isRead": isRead,
            "metadata.readAt": isRead ? new Date() : null
          }
        },
        { new: true }
      );

      if (!email) {
        return res.status(404).json({
          success: false,
          message: "Email non trouvé"
        });
      }

      res.status(200).json({
        success: true,
        message: `Email marqué comme ${isRead ? "lu" : "non lu"}`,
        data: {
          emailId: email._id,
          isRead,
          readAt: email.metadata?.readAt
        }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans markEmailAsRead: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour du statut de lecture",
        error: errorMessage
      });
    }
  }

  /**
   * Supprime un email (soft delete)
   */
  async deleteEmail(req: Request, res: Response) {
    try {
      const { emailId } = req.params;
      const { permanent = false } = req.query;

      if (!emailId) {
        return res.status(400).json({
          success: false,
          message: "L'ID de l'email est requis"
        });
      }

      const EmailHistory = (await import("../models/email.model")).default;

      if (permanent === "true") {
        // Suppression définitive
        const result = await EmailHistory.findByIdAndDelete(emailId);
        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Email non trouvé"
          });
        }
      } else {
        // Soft delete
        const email: any = await EmailHistory.findByIdAndUpdate(
          emailId,
          {
            $set: {
              "metadata.isDeleted": true,
              "metadata.deletedAt": new Date()
            }
          },
          { new: true }
        );

        if (!email) {
          return res.status(404).json({
            success: false,
            message: "Email non trouvé"
          });
        }
      }

      res.status(200).json({
        success: true,
        message:
          permanent === "true"
            ? "Email supprimé définitivement"
            : "Email supprimé",
        data: { emailId }
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Erreur dans deleteEmail: ${errorMessage}`, error);

      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de l'email",
        error: errorMessage
      });
    }
  }
}

export default new CRMEmailController();
