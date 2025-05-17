// src/app.ts
import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import route from "./routes/index";
import config from "./config";
import { setupSwagger } from "./config/swagger.config";
const app: Application = express();

// Middlewares
app.use(helmet()); // Sécurité
app.use(cors()); // Gestion CORS
app.use(express.json()); // Parsing JSON
app.use(morgan("dev")); // Logs HTTP

// Routes
app.use("/api", route);
setupSwagger(app);

app.get("/health", async (req: Request, res: Response) => {
  // Endpoint de health check simplifié - sera surveillé par le service de notification
  const status = {
    status: "UP",
    timestamp: new Date().toISOString(),
    service: config.discord.service_name
  };

  res.status(200).json(status);
});

// Gestion des routes non trouvées
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `La route ${req.originalUrl} n'existe pas`
  });
});

export default app;
