import app from "./app";
import config from "./config";
import { logger } from "./utils/logger";
import { transporter } from "./config/email-config";
import connectDB from "./config/db.config";

const PORT = config.server.port;

connectDB();

const startServer = async () => {
  try {
    // Vérifier la connexion SMTP
    await transporter.verify();
    logger.info("Connexion SMTP vérifiée avec succès");

    // Démarrer le serveur
    // Dans votre fonction de démarrage du serveur
    app.listen(PORT, () => {
      logger.info(
        `Service de notification démarré sur le port ${config.server.port} en mode ${config.server.env}`
      );
    });
  } catch (error) {
    logger.error(`Erreur lors du démarrage du serveur:`, error);
    logger.warn("Le serveur démarre sans connexion SMTP valide");

    // Démarrer le serveur malgré l'erreur SMTP
    app.listen(PORT, () => {
      logger.info(
        `Service de notification démarré sur le port ${config.server.port} en mode ${config.server.env}`
      );
    });
  }
};

// Gestion des erreurs non capturées
process.on("uncaughtException", (error) => {
  logger.error(`Erreur non capturée: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Promesse rejetée non gérée: ${reason}`);
  process.exit(1);
});

// Démarrer le serveur
startServer();
