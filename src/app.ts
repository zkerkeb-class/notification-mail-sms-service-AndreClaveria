// src/app.ts
import express, { Application } from "express";
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
// Route racine
app.get("/", (req, res) => {
  res.json({
    name: "mail-notification-service",
    status: "running",
    environment: config.server.env
  });
});

// Gestion des routes non trouvées
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `La route ${req.originalUrl} n'existe pas`
  });
});

export default app;
