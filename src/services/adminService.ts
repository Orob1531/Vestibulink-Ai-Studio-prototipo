import { AuditLogEntry, SchoolPartnershipLead } from "../domain/models";
import { ProcessoSeletivo } from "../types";
import { apiRequest } from "./apiClient";

export interface AdminOverviewSummary {
  usersCount: number;
  institutionsCount: number;
  opportunitiesCount: number;
  officialSourcesCount: number;
  alertsCount: number;
  scheduledJobsCount: number;
  notificationsCount: number;
  editalDocumentsCount: number;
  schoolLeadsCount: number;
}

/**
 * Serviço Administrativo e de Parcerias Escolares.
 * Conecta com os endpoints administrativos protegidos por RBAC (/api/admin/*)
 * e com o registro de parcerias de escolas (/api/schools/partnership).
 */
export const adminService = {
  async getOverview(): Promise<{
    summary: AdminOverviewSummary;
    recentLogs: AuditLogEntry[];
  }> {
    return apiRequest<{
      success: boolean;
      summary: AdminOverviewSummary;
      recentLogs: AuditLogEntry[];
    }>("/api/admin/overview");
  },

  async verifyOpportunity(opportunityId: string): Promise<ProcessoSeletivo> {
    const res = await apiRequest<{
      success: boolean;
      opportunity: ProcessoSeletivo;
    }>(`/api/admin/opportunities/${encodeURIComponent(opportunityId)}/verify`, {
      method: "PATCH",
    });
    return res.opportunity;
  },

  async submitSchoolPartnership(payload: {
    nomeEscola: string;
    cidadeEstado: string;
    nomeResponsavel: string;
    cargo: string;
    whatsapp: string;
    email: string;
  }): Promise<SchoolPartnershipLead | null> {
    try {
      const res = await apiRequest<{
        success: boolean;
        lead: SchoolPartnershipLead;
      }>("/api/schools/partnership", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.lead;
    } catch {
      return null;
    }
  },
};
