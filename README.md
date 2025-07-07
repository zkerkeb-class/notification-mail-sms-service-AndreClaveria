# Service de Notifications

Service complet de notifications multi-canaux pour votre architecture microservices, gérant l'envoi d'emails, SMS et notifications push avec une API robuste et sécurisée.

## 🚀 Fonctionnalités

- **Notifications Email** : Envoi d'emails avec templates personnalisés
- **Notifications SMS** : Envoi de SMS via providers externes
- **Templates dynamiques** : Système de templates flexible
- **Files d'attente** : Gestion des envois en lot
- **Tracking** : Suivi des notifications envoyées
- **Retry Logic** : Nouvelle tentative automatique en cas d'échec
- **API RESTful** : Interface complète pour les notifications
- **Validation des données** : Validation robuste avec Joi

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- MongoDB
- TypeScript
- Compte Email Provider (SendGrid, Mailgun, etc.)
- Compte SMS Provider (Twilio, etc.)
- npm ou yarn

## 🛠️ Installation

```bash
# Cloner le repository
git clone <url-du-repository>

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
```

## ⚙️ Configuration

Créez un fichier `.env` avec les variables suivantes :

```env
PORT=3003
MONGODB_URI=mongodb://localhost:27017/notification-service
JWT_SECRET=votre-secret-jwt
NODE_ENV=development

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe
FROM_EMAIL=noreply@votresite.com

# Brevo Configuration
BREVO_API_KEY=votre-cle-api-brevo
BREVO_FROM_EMAIL=noreply@votresite.com

# SMS Configuration
TWILIO_ACCOUNT_SID=votre-sid-twilio
TWILIO_AUTH_TOKEN=votre-token-twilio
TWILIO_PHONE_NUMBER=+33123456789
```

## 🚀 Démarrage

```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

## 📚 Documentation API

Une fois le service démarré, accédez à la documentation Swagger :

- URL : `http://localhost:3003/api-docs`

## 🔐 Endpoints Principaux

### Notifications Email

- `POST /api/notifications/email` - Envoyer un email
- `POST /api/notifications/email/bulk` - Envoi en lot
- `GET /api/notifications/email/templates` - Lister les templates
- `POST /api/notifications/email/templates` - Créer un template

### Notifications SMS

- `POST /api/notifications/sms` - Envoyer un SMS
- `POST /api/notifications/sms/bulk` - Envoi en lot
- `GET /api/notifications/sms/status/:id` - État d'un SMS

### Historique

- `GET /api/notifications/history` - Historique des notifications
- `GET /api/notifications/history/:id` - Détail d'une notification
- `GET /api/notifications/stats` - Statistiques d'envoi

### Templates

- `GET /api/templates` - Lister les templates
- `POST /api/templates` - Créer un template
- `PUT /api/templates/:id` - Modifier un template
- `DELETE /api/templates/:id` - Supprimer un template

## 📧 Types de Notifications

### Email

- **Transactionnels** : Confirmations, factures
- **Marketing** : Newsletters, promotions
- **Système** : Alertes, notifications
- **Personnalisés** : Templates sur mesure

### SMS

- **Codes de vérification** : 2FA, OTP
- **Notifications urgentes** : Alertes système
- **Confirmations** : Commandes, rendez-vous
- **Marketing** : Promotions ciblées

### Push (Futur)

- **Notifications navigateur** : Web push
- **Notifications mobiles** : iOS/Android
- **Notifications desktop** : Applications

## 🎨 Système de Templates

### Variables Dynamiques

```handlebars
Bonjour
{{firstName}}, Votre commande #{{orderNumber}}
a été confirmée. Montant :
{{amount}}€ Cordialement, L'équipe
{{companyName}}
```

### Templates Prédéfinis

- **Welcome** : Email de bienvenue
- **Reset Password** : Réinitialisation
- **Order Confirmation** : Confirmation commande
- **Invoice** : Facture
- **Newsletter** : Newsletter

## 🧪 Tests

```bash
npm test
```

## 📁 Structure du Projet

```
src/
├── controllers/     # Contrôleurs API
├── middleware/      # Middlewares personnalisés
├── models/         # Modèles MongoDB
├── routes/         # Définition des routes
├── services/       # Logique métier
│   ├── email/      # Service email
│   ├── sms/        # Service SMS
│   └── template/   # Service templates
├── templates/      # Templates de notifications
├── utils/          # Utilitaires
├── validators/     # Validation Joi
└── server.ts       # Point d'entrée
```

## 🔧 Technologies Utilisées

- **Express.js** : Framework web
- **TypeScript** : Typage statique
- **MongoDB** : Base de données
- **Mongoose** : ODM pour MongoDB
- **Nodemailer** : Envoi d'emails
- **Brevo** : Service email
- **Joi** : Validation des données
- **Axios** : Client HTTP
- **Winston** : Logging
- **Swagger** : Documentation API

## 📊 Monitoring et Analytics

### Métriques

- **Taux de livraison** : Emails/SMS livrés
- **Taux d'ouverture** : Emails ouverts
- **Taux de clic** : Liens cliqués
- **Taux d'erreur** : Échecs d'envoi

### Logs

- **Envois** : Logs des notifications
- **Erreurs** : Logs d'erreurs
- **Performance** : Temps de traitement
- **Webhooks** : Callbacks providers

## 🚨 Gestion des Erreurs

### Retry Logic

- **Exponential Backoff** : Délais croissants
- **Max Retries** : Nombre maximum d'essais
- **Dead Letter Queue** : Messages échoués
- **Monitoring** : Alertes sur échecs

### Types d'Erreurs

- **Validation** : Données invalides
- **Provider** : Erreurs services externes
- **Réseau** : Problèmes de connectivité
- **Quota** : Limites atteintes

## 🛡️ Sécurité

- **Authentification JWT** : Sécurisation des endpoints

## 🔄 Intégrations

### Providers Email

- **Brevo** : Service européen

### Providers SMS

- **Twilio** : Service SMS
- **Nexmo** : Service SMS
- **Amazon SNS** : Service AWS
- **OVH** : Service français

## 📈 Performance

- **Queue System** : Traitement asynchrone
- **Bulk Processing** : Envois en lot
- **Caching** : Mise en cache des templates
- **Connection Pooling** : Optimisation connexions

## 📝 Licence

ISC

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez créer une issue avant de soumettre une pull request.
