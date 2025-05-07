import axios from "axios";
import { logger } from "../utils/logger";
import config from "../config";

interface ServiceConfig {
  name: string;
  url: string;
  endpoint: string;
}

interface ServiceStatus {
  name: string;
  status: "up" | "down";
  details?: any;
  lastChecked: Date;
}

class HealthService {
  private services: ServiceConfig[];
  private lastStatus: Map<string, ServiceStatus> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  // Mise à jour du constructeur dans health.service.ts
  constructor() {
    this.services = [
      {
        name: "auth-service",
        url: config.services.auth.url,
        endpoint: "/health" // Endpoint direct à la racine
      },
      {
        name: "database-service",
        url: config.services.database.url,
        endpoint: "/health" // Endpoint direct à la racine
      },
      {
        name: "mail-notification-service",
        url: `http://localhost:${config.server.port}`,
        endpoint: "/api/health" // Notre propre service utilise /api/health
      }
    ];
  }

  /**
   * Vérifie l'état de santé d'un service
   */
  async checkServiceHealth(service: ServiceConfig): Promise<ServiceStatus> {
    try {
      const response = await axios.get(`${service.url}${service.endpoint}`, {
        timeout: 5000 // timeout de 5 secondes
      });

      const status: ServiceStatus = {
        name: service.name,
        status: response.status === 200 ? "up" : "down",
        details: response.data,
        lastChecked: new Date()
      };

      this.lastStatus.set(service.name, status);
      return status;
    } catch (error) {
      const status: ServiceStatus = {
        name: service.name,
        status: "down",
        details: {
          error: error,
          code: "CONNEXION_ERROR"
        },
        lastChecked: new Date()
      };

      this.lastStatus.set(service.name, status);
      return status;
    }
  }

  /**
   * Vérifie l'état de santé de tous les services
   */
  async checkAllServices(): Promise<ServiceStatus[]> {
    const statuses: ServiceStatus[] = [];

    for (const service of this.services) {
      const status = await this.checkServiceHealth(service);
      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Envoie une notification Discord
   */
  // Modification de la fonction sendDiscordNotification dans health.service.ts
  async sendDiscordNotification(
    message: string,
    isAlert: boolean = false
  ): Promise<boolean> {
    try {
      // Utiliser un seul webhook, peu importe que ce soit une alerte ou non
      const webhookUrl = config.notifications.discord.webhook; // Utilisez une seule variable

      if (!webhookUrl) {
        logger.warn("URL Webhook Discord non configurée");
        return false;
      }

      const color = isAlert ? 15158332 : 3066993; // Rouge pour alerte, vert pour info

      // Définir les types corrects pour le payload Discord
      interface DiscordEmbed {
        title: string;
        description: string;
        color: number;
        timestamp: string;
        footer: {
          text: string;
        };
        fields: Array<{
          name: string;
          value: string;
          inline: boolean;
        }>;
      }

      // Récupérer les statuts des services
      const servicesStatus = this.getServicesStatus();
      const totalServices = servicesStatus.length;
      const downServices = servicesStatus.filter(
        (s) => s.status === "down"
      ).length;
      const upServices = totalServices - downServices;

      // Titre standard pour tous les messages
      const title = "État des Services CRM";

      // Description basée sur le statut des services
      let description = "";
      if (downServices === 0) {
        description = `**Tous les services CRM sont opérationnels** ${totalServices} services lors de la dernière vérification.`;
      } else {
        description = `**${downServices} service(s) indisponible(s)** sur ${totalServices} lors de la dernière vérification.`;
      }

      const embed: DiscordEmbed = {
        title: title,
        description: description,
        color: downServices > 0 ? 15158332 : 3066993, // Rouge si services down, vert sinon
        timestamp: new Date().toISOString(),
        footer: {
          text: `CRM AndreClaveria - Monitoring • ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
        },
        fields: []
      };

      // Ajouter un champ pour chaque service
      embed.fields = servicesStatus.map((service) => {
        return {
          name: service.name,
          value:
            service.status === "up" ? "✅ Opérationnel" : "❌ Indisponible",
          inline: true
        };
      });

      const payload = {
        embeds: [embed]
      };

      await axios.post(webhookUrl, payload);
      logger.info(
        `Notification Discord envoyée avec ${downServices} services indisponibles sur ${totalServices}`
      );
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'envoi de la notification Discord:`, error);
      return false;
    }
  }
  /**
   * Démarre la surveillance régulière des services
   */
  startMonitoring(intervalMinutes: number = 5): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Exécuter immédiatement une première vérification
    this.monitorStatusAndNotify();

    // Programmer les vérifications régulières
    this.monitoringInterval = setInterval(
      () => {
        this.monitorStatusAndNotify();
      },
      intervalMinutes * 60 * 1000
    );

    logger.info(
      `Surveillance des services démarrée (intervalle: ${intervalMinutes} minutes)`
    );
  }

  /**
   * Arrête la surveillance régulière
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info("Surveillance des services arrêtée");
    }
  }

  /**
   * Vérifie l'état des services et envoie des notifications si nécessaire
   */
  async monitorStatusAndNotify(): Promise<void> {
    try {
      // Vérifier l'état de tous les services
      const statuses = await this.checkAllServices();

      // Envoyer une notification avec l'état de tous les services
      // Pas besoin de créer un message spécifique, car notre nouvelle fonction sendDiscordNotification
      // construit le message complet en fonction des statuts des services
      await this.sendDiscordNotification("", false);

      // Logger les résultats
      const downServices = statuses.filter((s) => s.status === "down");
      if (downServices.length > 0) {
        logger.warn(
          `Services indisponibles détectés: ${downServices.map((s) => s.name).join(", ")}`
        );
      } else {
        logger.info("Tous les services sont opérationnels");
      }
    } catch (error) {
      logger.error(`Erreur lors de la surveillance des services:`, error);

      // En cas d'erreur grave, envoyer une notification d'alerte
      try {
        // Créer un message d'erreur simple
        const errorMessage = "**Erreur dans le processus de monitoring**";

        // Utiliser le même format de notification mais indiquer qu'il s'agit d'une erreur
        await this.sendDiscordNotification(errorMessage, true);
      } catch (notificationError) {
        logger.error(
          `Impossible d'envoyer la notification d'erreur:`,
          notificationError
        );
      }
    }
  }

  /**
   * Retourne l'état actuel de tous les services
   */
  getServicesStatus(): ServiceStatus[] {
    return this.services.map((service) => {
      return (
        this.lastStatus.get(service.name) || {
          name: service.name,
          status: "down",
          details: { error: "Non vérifié" },
          lastChecked: new Date(0) // date epoch
        }
      );
    });
  }

  /**
   * Ajoute un service personnalisé à surveiller
   */
  addCustomService(
    name: string,
    url: string,
    endpoint: string = "/health"
  ): boolean {
    try {
      // Vérifier si le service existe déjà
      if (this.services.some((s) => s.name === name)) {
        logger.warn(
          `Le service ${name} existe déjà dans la liste de surveillance`
        );
        return false;
      }

      // Ajouter le nouveau service
      this.services.push({
        name,
        url,
        endpoint
      });

      logger.info(`Service ${name} ajouté à la liste de surveillance`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de l'ajout du service ${name}: `, error);
      return false;
    }
  }

  /**
   * Supprime un service de la liste de surveillance
   */
  removeService(name: string): boolean {
    try {
      const initialLength = this.services.length;
      this.services = this.services.filter((s) => s.name !== name);

      if (this.services.length < initialLength) {
        // Supprimer également du cache de statut
        this.lastStatus.delete(name);
        logger.info(`Service ${name} retiré de la liste de surveillance`);
        return true;
      } else {
        logger.warn(`Service ${name} non trouvé dans la liste de surveillance`);
        return false;
      }
    } catch (error) {
      logger.error(`Erreur lors de la suppression du service ${name}: `, error);
      return false;
    }
  }
  async sendStartupNotification(): Promise<boolean> {
    try {
      const webhookUrl = config.notifications.discord.webhook;

      if (!webhookUrl) {
        logger.warn("URL Webhook Discord non configurée");
        return false;
      }

      const embed = {
        title: "État des Services CRM",
        description:
          "**Service de notification démarré**\nLe service de monitoring est maintenant opérationnel.",
        color: 3066993, // Vert
        timestamp: new Date().toISOString(),
        footer: {
          text: `CRM AndreClaveria - Monitoring • ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
        }
      };

      const payload = {
        embeds: [embed]
      };

      await axios.post(webhookUrl, payload);
      logger.info("Notification de démarrage envoyée");
      return true;
    } catch (error) {
      logger.error(
        `Erreur lors de l'envoi de la notification de démarrage:`,
        error
      );
      return false;
    }
  }
}

export default new HealthService();
