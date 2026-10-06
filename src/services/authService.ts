import { User } from "../domain/models";
import { apiRequest, setStoredAuthToken } from "./apiClient";

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export const authService = {
  async register(params: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
    acceptedPrivacyPolicy?: boolean;
  }): Promise<User> {
    const res = await apiRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(params),
    });
    setStoredAuthToken(res.token);
    return res.user;
  },

  async login(email: string, senha: string): Promise<User> {
    const res = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
    setStoredAuthToken(res.token);
    return res.user;
  },

  logout(): void {
    setStoredAuthToken(null);
  },

  async getCurrentSessionUser(): Promise<User | null> {
    try {
      const res = await apiRequest<{ success: boolean; user: User }>("/api/auth/me");
      return res.user;
    } catch {
      return null;
    }
  },

  async changePassword(senhaAtual: string, novaSenha: string): Promise<void> {
    await apiRequest("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
  },

  async deleteAccountLgpd(): Promise<void> {
    await apiRequest("/api/auth/account", {
      method: "DELETE",
    });
    setStoredAuthToken(null);
  },
};
