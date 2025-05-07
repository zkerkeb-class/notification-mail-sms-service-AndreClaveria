// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

// Étendre l'interface Request pour inclure l'utilisateur authentifié
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Configuration
const JWT_SECRET = config.jwt.secret;

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Récupérer le token depuis l'en-tête Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Accès non autorisé. Token manquant." });
  }

  // Format attendu: "Bearer [token]"
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Format de token invalide." });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // Ajouter les données utilisateur à la requête
    console.log(req.user); // Debugging line

    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide ou expiré." });
  }
};

// Middleware pour vérifier les rôles (optionnel)
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Accès refusé. Rôle insuffisant." });
    }

    next();
  };
};
