import { Application } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import fs from "fs";

/**
 * Configure Swagger pour l'application Express
 * @param app Application Express
 */
export function setupSwagger(app: Application): void {
  try {
    // Charger le fichier YAML
    const swaggerDocument = YAML.load(path.join(__dirname, "../swagger.yaml"));

    // Ajouter les routes Swagger
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    // Endpoint pour récupérer la spécification Swagger en JSON
    app.get("/swagger.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerDocument);
    });

    console.log("Documentation Swagger configurée avec succès");
  } catch (error) {
    console.error("Erreur lors de la configuration de Swagger:", error);
  }
}
