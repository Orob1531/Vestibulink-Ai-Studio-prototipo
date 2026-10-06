import { AlertaUsuario } from "../types";
import { Favorite } from "../domain/models";
import { apiRequest } from "../services/apiClient";

const STORAGE_ALERTAS_KEY = "vestibulink_alertas_v1";

/**
 * Repositório de Alertas e Favoritos.
 * Sincroniza configurações de alertas com o backend (que agenda os jobs na fila de disparo)
 * mantendo cache local para resposta imediata na interface.
 */
export const alertRepository = {
  getInitialCached(): AlertaUsuario[] {
    try {
      const salvo = localStorage.getItem(STORAGE_ALERTAS_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Erro ao ler alertas do cache local:", e);
    }
    return [];
  },

  saveToLocalCache(alertas: AlertaUsuario[]): void {
    try {
      localStorage.setItem(STORAGE_ALERTAS_KEY, JSON.stringify(alertas));
    } catch {
      // Ignorar erro de quota
    }
  },

  async fetchAll(): Promise<AlertaUsuario[]> {
    try {
      const res = await apiRequest<{
        success: boolean;
        alerts: AlertaUsuario[];
      }>("/api/alerts");
      if (Array.isArray(res.alerts)) {
        const local = this.getInitialCached();
        // Mescla alertas locais caso existam registros criados antes da conexão com o servidor
        const mergedMap = new Map<string, AlertaUsuario>();
        for (const item of [...res.alerts, ...local]) {
          if (!mergedMap.has(item.processoId)) {
            mergedMap.set(item.processoId, item);
          }
        }
        const merged = Array.from(mergedMap.values());
        this.saveToLocalCache(merged);
        return merged;
      }
    } catch {
      // Fallback para o cache local
    }
    return this.getInitialCached();
  },

  async saveAlert(novoAlerta: AlertaUsuario): Promise<AlertaUsuario> {
    const current = this.getInitialCached();
    const updatedLocal = [
      novoAlerta,
      ...current.filter((a) => a.processoId !== novoAlerta.processoId),
    ];
    this.saveToLocalCache(updatedLocal);

    try {
      const res = await apiRequest<{
        success: boolean;
        alert: AlertaUsuario;
      }>("/api/alerts", {
        method: "POST",
        body: JSON.stringify(novoAlerta),
      });
      if (res.alert) {
        const synced = [
          res.alert,
          ...current.filter((a) => a.processoId !== res.alert.processoId),
        ];
        this.saveToLocalCache(synced);
        return res.alert;
      }
    } catch {
      // Mantém salvo no cache local caso offline
    }

    return novoAlerta;
  },

  async removeAlert(alertaId: string): Promise<void> {
    const current = this.getInitialCached();
    const filtered = current.filter((a) => a.id !== alertaId);
    this.saveToLocalCache(filtered);

    try {
      await apiRequest(`/api/alerts/${encodeURIComponent(alertaId)}`, {
        method: "DELETE",
      });
    } catch {
      // Ignorar se já removido
    }
  },

  async fetchFavorites(): Promise<Favorite[]> {
    try {
      const res = await apiRequest<{ success: boolean; favorites: Favorite[] }>(
        "/api/favorites"
      );
      return res.favorites || [];
    } catch {
      return [];
    }
  },
};
