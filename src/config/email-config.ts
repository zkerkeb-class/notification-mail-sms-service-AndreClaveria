// src/config/email-config.ts
import * as Brevo from "@getbrevo/brevo";
import config from "./index";

// Configuration client Brevo
const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  config.email.brevo.apiKey
);

// Configuration email par défaut
const defaultMailOptions = {
  sender: {
    name: config.email.defaults.from.name,
    email: config.email.defaults.from.address
  },
  replyTo: {
    name: config.email.defaults.from.name,
    email: config.email.defaults.from.address
  }
};

// Interface étendue pour supporter les headers personnalisés
interface MailOptions {
  from?: {
    name: string;
    address: string;
  };
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>; // Ajout pour le tracking
}

interface SendMailResponse {
  messageId: string;
  response: string;
}

const transporter = {
  sendMail: async (mailOptions: MailOptions): Promise<SendMailResponse> => {
    try {
      const sendSmtpEmail: any = {};

      // Expéditeur
      sendSmtpEmail.sender = {
        name: mailOptions.from?.name || defaultMailOptions.sender.name,
        email: mailOptions.from?.address || defaultMailOptions.sender.email
      };

      // Destinataires
      sendSmtpEmail.to = Array.isArray(mailOptions.to)
        ? mailOptions.to.map((email) => ({ email }))
        : [{ email: mailOptions.to }];

      sendSmtpEmail.subject = mailOptions.subject;
      sendSmtpEmail.htmlContent = mailOptions.html || "";
      sendSmtpEmail.textContent = mailOptions.text || "";

      // ReplyTo
      if (mailOptions.replyTo) {
        sendSmtpEmail.replyTo = {
          email: mailOptions.replyTo,
          name: mailOptions.from?.name || defaultMailOptions.sender.name
        };
      }

      // Headers personnalisés pour le tracking (IMPORTANT pour les réponses)
      if (mailOptions.headers) {
        sendSmtpEmail.headers = mailOptions.headers;
      }

      console.log(
        "Email configuration:",
        JSON.stringify({
          sender: sendSmtpEmail.sender,
          subject: sendSmtpEmail.subject,
          headers: sendSmtpEmail.headers
        })
      );

      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

      return {
        messageId: (data as any).messageId || "message-id-not-available",
        response: "Email sent successfully"
      };
    } catch (error) {
      console.error("Error details:", error);
      throw error;
    }
  },

  verify: async (): Promise<boolean> => {
    try {
      const accountApi = new Brevo.AccountApi();
      accountApi.setApiKey(
        Brevo.AccountApiApiKeys.apiKey,
        config.email.brevo.apiKey
      );
      await accountApi.getAccount();
      return true;
    } catch (error) {
      throw error;
    }
  }
};

// Nouvelle fonction pour les webhooks Brevo
export const setupBrevoWebhooks = async () => {
  try {
    const webhooksApi = new Brevo.WebhooksApi();
    webhooksApi.setApiKey(
      Brevo.WebhooksApiApiKeys.apiKey,
      config.email.brevo.apiKey
    );

    // Tu peux utiliser cette fonction pour configurer les webhooks programmatiquement
    // Ou le faire manuellement dans le dashboard Brevo
    console.log("Webhooks API ready for configuration");
    return webhooksApi;
  } catch (error) {
    console.error("Error setting up webhooks:", error);
    throw error;
  }
};

export { transporter, defaultMailOptions, apiInstance };
