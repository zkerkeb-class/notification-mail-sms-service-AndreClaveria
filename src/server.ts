import app from "./app";
import config from "./config";
import { logger } from "./utils/logger";
import { transporter } from "./config/email-config";
import healthService from "./services/health.service";
const startServer = async () => {
  try {
    // Vérifier la connexion SMTP
    await transporter.verify();
    logger.info("Connexion SMTP vérifiée avec succès");

    // Démarrer le serveur
    // Dans votre fonction de démarrage du serveur
    app.listen(config.server.port, () => {
      logger.info(
        `Service de notification démarré sur le port ${config.server.port} en mode ${config.server.env}`
      );
      try {
        // Message spécial pour le démarrage du service
        // Nous ajoutons un paramètre supplémentaire pour indiquer qu'il s'agit du démarrage
        healthService.sendStartupNotification();

        // Démarrer le monitoring automatique
        if (config.notifications.monitoring.enabled) {
          logger.info(
            `Démarrage du monitoring automatique avec intervalle de ${config.notifications.monitoring.intervalMinutes} minutes`
          );
          healthService.startMonitoring(
            config.notifications.monitoring.intervalMinutes
          );
        }
      } catch (error) {
        logger.error(
          "Impossible d'envoyer la notification de démarrage:",
          error
        );
      }
    });
  } catch (error) {
    logger.error(`Erreur lors du démarrage du serveur:`, error);
    logger.warn("Le serveur démarre sans connexion SMTP valide");

    // Démarrer le serveur malgré l'erreur SMTP
    app.listen(config.server.port, () => {
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
