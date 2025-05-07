interface ConfirmationEmailTemplateProps {
  username: string;
  confirmUrl: string;
}

export const getConfirmationEmailTemplate = (
  props: ConfirmationEmailTemplateProps
) => {
  const { username, confirmUrl } = props;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de votre compte CRM AndreClaveria</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 20px 0;
        border-bottom: 1px solid #eee;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #4a6cf7;
      }
      .content {
        padding: 20px 0;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: #4a6cf7;
        color: white !important;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        margin: 20px 0;
        text-align: center;
      }
      .footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #888;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">CRM AndreClaveria</div>
      </div>
      <div class="content">
        <h2>Bienvenue ${username} !</h2>
        <p>Merci de vous être inscrit sur la plateforme CRM AndreClaveria. Pour activer votre compte et commencer à utiliser notre CRM, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous.</p>
        
        <div style="text-align: center;">
          <a href="${confirmUrl}" class="button">Confirmer mon adresse e-mail</a>
        </div>
        
        <p>Si le bouton ne fonctionne pas, vous pouvez également copier et coller l'URL suivante dans votre navigateur :</p>
        <p style="word-break: break-all; font-size: 14px;">${confirmUrl}</p>
        
        <p>Ce lien expirera dans 24 heures pour des raisons de sécurité.</p>
        
        <p>Cordialement,<br>L'équipe CRM AndreClaveria</p>
      </div>
      <div class="footer">
        <p>Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
        <p>&copy; ${new Date().getFullYear()} CRM AndreClaveria. Tous droits réservés.</p>
      </div>
    </div>
  </body>
  </html>
    `;

  // Version texte pour les clients mail qui ne supportent pas le HTML
  const text = `
  Bienvenue ${username} !
  
  Merci de vous être inscrit sur la plateforme CRM AndreClaveria. Pour activer votre compte et commencer à utiliser notre CRM, veuillez confirmer votre adresse e-mail en visitant le lien suivant :
  
  ${confirmUrl}
  
  Ce lien expirera dans 24 heures pour des raisons de sécurité.
  
  Cordialement,
  L'équipe CRM AndreClaveria
  
  Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.
  © ${new Date().getFullYear()} CRM AndreClaveria. Tous droits réservés.
    `;

  return { html, text };
};
