import { ProcessoSeletivo, UserPreferences } from "../types";
import { calcularStatus, obterTimestampFechamento } from "../utils/dateUtils";
import { apiRequest } from "./apiClient";

export interface FilterCriteria {
  preferences: UserPreferences;
  searchTerm: string;
  apenasRetaFinal: boolean;
}

/**
 * Camada de Regras de Negócio (Business Logic) para Oportunidades e Processos Seletivos.
 * Desacopla a lógica de filtragem, ordenação por fuso horário e extração de edital do App.tsx.
 */
export const opportunityService = {
  /**
   * Filtra e ordena os processos seletivos com o prazo final mais próximo primeiro,
   * respeitando o fuso horário regional de cada oportunidade.
   */
  filterAndSortByDeadline(
    processos: ProcessoSeletivo[],
    criteria: FilterCriteria
  ): ProcessoSeletivo[] {
    const { preferences, searchTerm, apenasRetaFinal } = criteria;

    return processos
      .filter((proc) => {
        // Filtro de Fase de Lançamento
        if (preferences.faseLançamento === 1) {
          if (proc.regiao !== "Centro-Oeste") return false;
          if (proc.tipo !== "vestibular") return false;
        } else if (preferences.faseLançamento === 2) {
          if (proc.tipo !== "vestibular") return false;
        }

        // Filtro de Estado
        if (
          preferences.estadoSelecionado !== "TODOS" &&
          proc.estado !== preferences.estadoSelecionado
        ) {
          return false;
        }

        // Filtro de Tipo
        if (
          preferences.tipoSelecionado !== "todos" &&
          proc.tipo !== preferences.tipoSelecionado
        ) {
          return false;
        }

        // Filtro de Área
        if (
          preferences.areaSelecionada !== "todas" &&
          !proc.areasPrincipais.includes("todas") &&
          !proc.areasPrincipais.includes(preferences.areaSelecionada)
        ) {
          return false;
        }

        // Filtro de Isenção
        if (preferences.apenasComIsencao && !proc.temIsencao) {
          return false;
        }

        // Filtro de Gratuito
        if (preferences.apenasGratis && proc.taxaInscricao > 0) {
          return false;
        }

        // Filtro de Reta Final
        const { status } = calcularStatus(proc);
        if (
          apenasRetaFinal &&
          status !== "reta-final" &&
          status !== "fecha-hoje"
        ) {
          return false;
        }

        // Busca livre
        if (searchTerm.trim()) {
          const termo = searchTerm.toLowerCase();
          const matchSigla = proc.sigla.toLowerCase().includes(termo);
          const matchNome = proc.nomeInstituicao.toLowerCase().includes(termo);
          const matchTitulo = proc.tituloProcesso.toLowerCase().includes(termo);
          const matchCidade = proc.cidade.toLowerCase().includes(termo);
          const matchEstado = proc.estado.toLowerCase().includes(termo);
          if (
            !matchSigla &&
            !matchNome &&
            !matchTitulo &&
            !matchCidade &&
            !matchEstado
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = obterTimestampFechamento(a).getTime();
        const timeB = obterTimestampFechamento(b).getTime();
        return timeA - timeB;
      });
  },

  /**
   * Conta quantos processos estão em Reta Final (menos de 48h ou fechando hoje).
   */
  countRetaFinal(processos: ProcessoSeletivo[]): number {
    return processos.filter((p) => {
      const { status } = calcularStatus(p);
      return status === "reta-final" || status === "fecha-hoje";
    }).length;
  },

  /**
   * Solicita ao backend a extração estruturada auxiliar via Gemini.
   * O retorno é sempre marcado como rascunho sujeito à revisão humana antes da publicação.
   */
  async extractEditalDraftWithAI(textoEdital: string): Promise<{
    dados?: Record<string, any>;
    requiresHumanReview: boolean;
  }> {
    return apiRequest<{
      success: boolean;
      dados?: Record<string, any>;
      requiresHumanReview: boolean;
    }>("/api/extrair-edital", {
      method: "POST",
      body: JSON.stringify({ textoEdital }),
    });
  },
};
