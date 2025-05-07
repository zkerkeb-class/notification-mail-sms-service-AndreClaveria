const config = {
  server: {
    port: process.env.PORT,
    env: process.env.NODE_ENV
  },
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN
  },
  email: {
    brevo: {
      apiKey: process.env.BREVO_API_KEY || "votre-api-key-par-defaut"
    },
    defaults: {
      from: {
        name: process.env.EMAIL_FROM_NAME || "",
        address: process.env.EMAIL_FROM_ADDRESS || ""
      }
    },

    smtp: {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587"),
      auth: {
        user: process.env.SMTP_USER || "votre-utilisateur",
        pass: process.env.SMTP_PASS || "votre-mot-de-passe"
      }
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || "info"
  },
  services: {
    frontend: {
      url: process.env.FRONTEND_URL || "http://localhost:3000"
    },
    auth: {
      url: process.env.AUTH_SERVICE_URL || "http://localhost:3002"
    },
    database: {
      url: process.env.DATABASE_SERVICE_URL || "http://localhost:3001"
    }
  },
  notifications: {
    discord: {
      webhook: process.env.DISCORD_INFO_WEBHOOK || ""
    },
    monitoring: {
      intervalMinutes: parseInt(
        process.env.MONITORING_INTERVAL_MINUTES || "5",
        10
      ),
      enabled: process.env.ENABLE_MONITORING === "true"
    }
  }
};

export default config;
