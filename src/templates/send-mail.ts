// templates/send-email.ts

export interface EmailTemplateData {
  user: {
    firstName: string;
    lastName: string;
    position?: string;
    email: string;
    phone?: string;
  };
  company: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    website?: string;
  };
  contact: {
    firstName: string;
    lastName: string;
    company?: string;
    position?: string;
  };
  content: {
    subject: string;
    body: string;
    preheader?: string;
  };
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

class EmailTemplateService {
  /**
   * Génère le HTML simple pour un email CRM (correspond à votre méthode actuelle)
   */
  generateEmailTemplate(
    type: EmailTemplateType,
    data: EmailTemplateData
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
    data: EmailTemplateData
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
   * Crée la signature simple (identique à votre méthode EmailService)
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

  /**
   * Méthodes d'aide pour des templates spécifiques
   */
  static createProfessionalEmail(data: EmailTemplateData) {
    const service = new EmailTemplateService();
    return service.generateEmailTemplate("professional", data);
  }

  static createFollowUpEmail(data: EmailTemplateData) {
    const service = new EmailTemplateService();
    return service.generateEmailTemplate("followup", data);
  }

  static createProposalEmail(data: EmailTemplateData) {
    const service = new EmailTemplateService();
    return service.generateEmailTemplate("proposal", data);
  }

  static createMeetingEmail(data: EmailTemplateData) {
    const service = new EmailTemplateService();
    return service.generateEmailTemplate("meeting", data);
  }

  static createThankYouEmail(data: EmailTemplateData) {
    const service = new EmailTemplateService();
    return service.generateEmailTemplate("thank-you", data);
  }

  static createIntroductionEmail(data: EmailTemplateData) {
    const service = new EmailTemplateService();
    return service.generateEmailTemplate("introduction", data);
  }
}

export default EmailTemplateService;
