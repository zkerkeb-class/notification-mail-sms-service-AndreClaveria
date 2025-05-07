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

// Interface pour les options d'email (compatible avec nodemailer)
interface MailOptions {
  from?: {
    name: string;
    address: string;
  };
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

// Type de retour pour notre fonction sendMail
interface SendMailResponse {
  messageId: string;
  response: string;
}

// Pour maintenir la compatibilité avec votre code actuel
const transporter = {
  // Cette fonction simule l'interface de nodemailer
  sendMail: async (mailOptions: MailOptions): Promise<SendMailResponse> => {
    try {
      // Créer un nouvel objet conforme à l'API Brevo
      const sendSmtpEmail: any = {};

      // Définir l'expéditeur dans le format attendu par Brevo
      sendSmtpEmail.sender = {
        name: mailOptions.from?.name || "CRM AndreClaveria",
        email: mailOptions.from?.address || "notifications@andreclaveria.fr"
      };

      // Assurez-vous que email est bien défini dans la propriété sender
      console.log("Sender email:", sendSmtpEmail.sender.email);

      // Définir les destinataires
      sendSmtpEmail.to = Array.isArray(mailOptions.to)
        ? mailOptions.to.map((email) => ({ email }))
        : [{ email: mailOptions.to }];

      sendSmtpEmail.subject = mailOptions.subject;
      sendSmtpEmail.htmlContent = mailOptions.html || "";
      sendSmtpEmail.textContent = mailOptions.text || "";

      // Afficher l'objet complet pour débogage
      console.log(
        "Email configuration:",
        JSON.stringify({
          sender: sendSmtpEmail.sender,
          subject: sendSmtpEmail.subject
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
  // Pour maintenir la compatibilité avec la méthode verify()
  verify: async (): Promise<boolean> => {
    try {
      // Vérifier si l'API key est valide en récupérant les infos du compte
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

export { transporter, defaultMailOptions };
