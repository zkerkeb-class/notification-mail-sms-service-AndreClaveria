// services/external.service.ts
import axios from "axios";

const databaseService = axios.create({
  baseURL: process.env.DATABASE_SERVICE_URL
});

const authService = axios.create({
  baseURL: process.env.AUTH_SERVICE_URL
});

// Fonction pour configurer le token d'authentification dynamiquement
export const setAuthToken = (token: string) => {
  if (token) {
    authService.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    databaseService.defaults.headers.common["Authorization"] =
      `Bearer ${token}`;
  } else {
    delete authService.defaults.headers.common["Authorization"];
    delete databaseService.defaults.headers.common["Authorization"];
  }
};

// Alternative: créer des instances avec token à la volée
export const createAuthenticatedService = (baseURL: string, token: string) => {
  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
};

export { databaseService, authService };
