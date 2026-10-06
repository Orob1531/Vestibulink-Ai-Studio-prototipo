import { INITIAL_INSTITUTIONS, INITIAL_PROCESSOS } from "../data/initialVestibulares";
import { Institution, OfficialSource } from "../domain/models";
import { ProcessoSeletivo } from "../types";
import { apiRequest } from "../services/apiClient";

const STORAGE_PROCESSOS_KEY = "vestibulink_processos_v1";

/**
 * Repositório de Oportunidades, Instituições e Fontes Oficiais.
 * Implementa a transição progressiva de localStorage para o banco de dados do servidor,
 * mantendo cache local síncrono para inicialização imediata da UI sem alterar o comportamento visual.
 */
export const opportunityRepository = {
  getInitialCached(): ProcessoSeletivo[] {
    try {
      const salvo = localStorage.getItem(STORAGE_PROCESSOS_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Erro ao ler processos do cache local:", e);
    }
    return INITIAL_PROCESSOS;
  },

  saveToLocalCache(processos: ProcessoSeletivo[]): void {
    try {
      localStorage.setItem(STORAGE_PROCESSOS_KEY, JSON.stringify(processos));
    } catch {
      // Ignorar se storage indisponível
    }
  },

  async fetchAll(): Promise<ProcessoSeletivo[]> {
    try {
      const res = await apiRequest<{
        success: boolean;
        opportunities: ProcessoSeletivo[];
      }>("/api/opportunities");
      if (Array.isArray(res.opportunities) && res.opportunities.length > 0) {
        this.saveToLocalCache(res.opportunities);
        return res.opportunities;
      }
    } catch {
      // Fallback transparente para o cache local / seed data
    }
    return this.getInitialCached();
  },

  async create(novoProcesso: ProcessoSeletivo): Promise<ProcessoSeletivo> {
    const current = this.getInitialCached();
    const optimisticList = [
      novoProcesso,
      ...current.filter((p) => p.id !== novoProcesso.id),
    ];
    this.saveToLocalCache(optimisticList);

    try {
      const res = await apiRequest<{
        success: boolean;
        opportunity: ProcessoSeletivo;
      }>("/api/opportunities", {
        method: "POST",
        body: JSON.stringify(novoProcesso),
      });
      if (res.opportunity) {
        const syncedList = [
          res.opportunity,
          ...current.filter((p) => p.id !== res.opportunity.id),
        ];
        this.saveToLocalCache(syncedList);
        return res.opportunity;
      }
    } catch {
      // Mantém persistido no cache local caso offline
    }

    return novoProcesso;
  },

  async fetchInstitutions(): Promise<Institution[]> {
    try {
      const res = await apiRequest<{
        success: boolean;
        institutions: Institution[];
      }>("/api/institutions");
      if (Array.isArray(res.institutions)) return res.institutions;
    } catch {
      // Fallback
    }
    return INITIAL_INSTITUTIONS;
  },

  async fetchOfficialSources(): Promise<OfficialSource[]> {
    try {
      const res = await apiRequest<{
        success: boolean;
        sources: OfficialSource[];
      }>("/api/sources");
      if (Array.isArray(res.sources)) return res.sources;
    } catch {
      // Fallback
    }
    return [];
  },
};
