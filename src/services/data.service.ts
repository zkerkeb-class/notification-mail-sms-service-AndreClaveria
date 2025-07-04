// services/data.service.ts - Version finale
import { createAuthenticatedService } from "./external.service";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Une erreur inconnue s'est produite";
};

export class DataService {
  static async getCompanyById(companyId: string, authToken?: string) {
    try {
      const service = createAuthenticatedService(
        process.env.DATABASE_SERVICE_URL || "http://localhost:3000",
        authToken || ""
      );
      const response = await service.get(`/api/companies/${companyId}`);

      // L'API retourne {success: true, data: {...}}, on veut juste data
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(`Failed to get company: ${getErrorMessage(error)}`);
    }
  }

  static async getUserById(userId: string, authToken?: string) {
    try {
      const service = createAuthenticatedService(
        process.env.AUTH_SERVICE_URL || "http://localhost:3001",
        authToken || ""
      );
      const response = await service.get(`/api/users/${userId}`);

      // L'API retourne {success: true, data: {...}}, on veut juste data
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(`Failed to get user: ${getErrorMessage(error)}`);
    }
  }

  static async getContactById(contactId: string, authToken?: string) {
    try {
      const service = createAuthenticatedService(
        process.env.DATABASE_SERVICE_URL || "http://localhost:3000",
        authToken || ""
      );
      const response = await service.get(`/api/contacts/${contactId}`);

      // L'API retourne {success: true, data: {...}}, on veut juste data
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(`Failed to get contact: ${getErrorMessage(error)}`);
    }
  }
}
