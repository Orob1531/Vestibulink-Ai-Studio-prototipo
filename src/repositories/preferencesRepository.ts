import { UserPreferences } from "../types";
import { apiRequest } from "../services/apiClient";

const STORAGE_PREFS_KEY = "vestibulink_preferences_v1";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  estadoSelecionado: "TODOS",
  areaSelecionada: "todas",
  tipoSelecionado: "vestibular", // Foco 100% vestibular no início
  apenasComIsencao: false,
  apenasGratis: false,
  faseLançamento: 1, // Fase 1: Centro-Oeste
};

/**
 * Repositório de Preferências do Usuário.
 * Abstrai o armazenamento local e sincroniza com o backend.
 */
export const preferencesRepository = {
  getInitialCached(): UserPreferences {
    try {
      const salvo = localStorage.getItem(STORAGE_PREFS_KEY);
      if (salvo) {
        return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(salvo) };
      }
    } catch (e) {
      console.warn("Erro ao ler preferências do cache local:", e);
    }
    return DEFAULT_USER_PREFERENCES;
  },

  save(preferences: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(preferences));
    } catch {
      // Ignorar erro de storage
    }

    apiRequest("/api/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    }).catch(() => {
      // Silencioso caso offline
    });
  },
};
