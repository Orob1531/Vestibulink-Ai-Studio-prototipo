/**
 * VESTIBULINK — Arquitetura de Domínio Oficial (Fase 1.0)
 *
 * Define as entidades canônicas do produto real:
 * - USER & ROLES (RBAC)
 * - USER_PREFERENCES
 * - INSTITUTION
 * - OPPORTUNITY (VESTIBULAR, CONCURSO, PROCESSO_SELETIVO)
 * - VESTIBULAR_PROCESS & CONCURSO_PROCESS
 * - OFFICIAL_SOURCE (Fontes oficiais e status de verificação)
 * - FAVORITE
 * - ALERT & SCHEDULED_ALERT_JOB (Separação entre configuração e envio)
 * - NOTIFICATION (Histórico e fila de disparo)
 * - EDITAL_DOCUMENT (Pipeline de extração e revisão humana)
 * - AUDIT_LOG & LGPD
 */

import { AreaCurso, CronogramaItem, EstadoBrasil, RegiaoBrasil } from "../types";

// ============================================================================
// 1. PAPÉIS (ROLES) E CONTROLE DE ACESSO (RBAC)
// ============================================================================

export type UserRole =
  | "USER"
  | "ADMIN"
  | "EDITOR"
  | "MODERATOR"
  | "DATA_REVIEWER"
  | "SCHOOL_ADMIN"
  | "PARTNER";

export type UserStatus = "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED" | "DELETED";

export interface LgpdConsent {
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  marketingOptIn: boolean;
  consentedAt: string;
  ipHash?: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerificado: boolean;
  lgpdConsent?: LgpdConsent;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// ============================================================================
// 2. PREFERÊNCIAS DO USUÁRIO (USER_PREFERENCES)
// ============================================================================

export type NotificationChannelType = "EMAIL" | "WHATSAPP" | "PUSH" | "SMS";

export interface UserPreferencesEntity {
  id: string;
  userId?: string; // Opcional para visitantes anônimos antes do login
  estadosInteresse: EstadoBrasil[];
  cidadesInteresse: string[];
  cursosInteresse: string[];
  areasInteresse: AreaCurso[];
  tiposOportunidade: OpportunityType[];
  instituicoesInteresse: string[];
  canaisNotificacao: NotificationChannelType[];
  antecedenciaAlertaHoras: number[]; // ex: [48, 24]
  alertaIsencaoAtivo: boolean;
  updatedAt: string;
}

// ============================================================================
// 3. INSTITUIÇÃO (INSTITUTION)
// ============================================================================

export type InstitutionType =
  | "UNIVERSIDADE_PUBLICA"
  | "UNIVERSIDADE_PRIVADA"
  | "INSTITUTO_FEDERAL"
  | "ORGAO_PUBLICO"
  | "BANCA_EXAMINADORA"
  | "ESCOLA_TECNICA"
  | "OUTRA";

export type EntityRecordStatus = "ACTIVE" | "ARCHIVED" | "DRAFT";

export interface Institution {
  id: string;
  nome: string;
  sigla: string;
  tipo: InstitutionType;
  estado: EstadoBrasil;
  cidade: string;
  siteOficial: string;
  status: EntityRecordStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 4. FONTES OFICIAIS E CONFIABILIDADE (OFFICIAL_SOURCE)
// ============================================================================

export type OfficialSourceType =
  | "OFFICIAL_WEBSITE"
  | "NOTICE"
  | "REGISTRATION"
  | "RESULTS"
  | "SCHEDULE"
  | "EXEMPTION"
  | "OTHER";

export type VerificationHealthStatus =
  | "VERIFIED_RECENTLY" // 🟢 Verificado recentemente
  | "VERIFIED_OLD" // 🟡 Verificado há algum tempo
  | "NEEDS_UPDATE" // 🔴 Necessita atualização
  | "PENDING_VERIFICATION"; // ⚪ Pendente de validação humana

export type DataOriginClassification =
  | "DEMO_SEED" // Dados de demonstração / seed para validação do protótipo
  | "MANUAL_CURATED" // Cadastrado manualmente por usuário/operador
  | "AI_EXTRACTED_DRAFT" // Extraído por IA aguardando revisão humana
  | "OFFICIAL_VERIFIED"; // Validado oficialmente pela equipe de revisão

export interface OfficialSource {
  id: string;
  opportunityId?: string;
  institutionId?: string;
  url: string;
  tipoFonte: OfficialSourceType;
  titulo?: string;
  lastCheckedAt?: string;
  nextCheckAt?: string;
  statusVerificacao: VerificationHealthStatus;
  httpStatus?: number;
  observacoes?: string;
}

// ============================================================================
// 5. OPORTUNIDADE (OPPORTUNITY, VESTIBULAR_PROCESS, CONCURSO_PROCESS)
// ============================================================================

export type OpportunityType = "VESTIBULAR" | "CONCURSO" | "PROCESSO_SELETIVO" | "CURSO_TECNICO";

export type OpportunityPublicationStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "ARCHIVED";

export type BrazilTimezone =
  | "America/Sao_Paulo" // GO, DF, SP, RJ, MG, PR, SC, RS, BA, PE, CE
  | "America/Cuiaba" // MT
  | "America/Campo_Grande" // MS
  | "America/Manaus" // AM, RR, RO
  | "America/Belem" // PA, AP
  | "America/Rio_Branco"; // AC

export interface VestibularProcessDetails {
  modalidadeIngresso:
    | "Vestibular Próprio"
    | "SiSU / ENEM"
    | "Vestibular Seriado / PAS"
    | "Vestibular de Medicina"
    | "Processo Seletivo Simplificado";
  cursosPrincipais?: string[];
  cotaEscolaPublica?: boolean;
  usaNotaEnem?: boolean;
}

export interface ConcursoProcessDetails {
  orgao: string;
  bancaExaminadora?: string;
  cargos?: string[];
  nivelEscolaridade?: ("MEDIO" | "TECNICO" | "SUPERIOR")[];
  remuneracaoInicial?: number;
  remuneracaoMaxima?: number;
}

export interface Opportunity {
  id: string;
  institutionId: string;
  siglaInstituicao: string;
  nomeInstituicao: string;
  titulo: string;
  tipo: OpportunityType;
  estado: EstadoBrasil;
  cidade: string;
  regiao: RegiaoBrasil;
  vagas: number;
  taxaInscricao: number;
  temIsencao: boolean;
  limiteIsencao?: string;
  periodoInscricaoInicio: string;
  periodoInscricaoFim: string;
  horaFechamento?: string;
  timezone: BrazilTimezone;
  dataProva: string;
  dataProvaFim?: string;
  areas: AreaCurso[];
  linkSiteOficial?: string;
  linkEdital: string;
  linkInscricao: string;
  linkResultados?: string;
  linkCronograma?: string;
  fontesOficiais: OfficialSource[];
  destaques: string[];
  cronograma: CronogramaItem[];
  observacoes?: string;
  vestibularDetails?: VestibularProcessDetails;
  concursoDetails?: ConcursoProcessDetails;
  statusPublicacao: OpportunityPublicationStatus;
  statusVerificacao: VerificationHealthStatus;
  dataOrigin: DataOriginClassification;
  verificadoManualmente: boolean;
  ultimaVerificacaoEm?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 6. FAVORITOS (FAVORITE)
// ============================================================================

export interface Favorite {
  id: string;
  userId: string;
  opportunityId: string;
  createdAt: string;
}

// ============================================================================
// 7. ALERTAS E NOTIFICAÇÕES (SEPARAÇÃO ENTRE CONFIGURAÇÃO E ENVIO)
// ============================================================================

export type AlertSubscriptionStatus =
  | "CONFIGURED" // Configurado pelo usuário (aguardando janela de disparo)
  | "SCHEDULED" // Jobs agendados na fila
  | "COMPLETED" // Todos os avisos desta oportunidade já foram processados
  | "CANCELLED"; // Cancelado pelo usuário

export type AlertTriggerType =
  | "DEADLINE_48H" // 48h antes do fim da inscrição
  | "DEADLINE_FINAL_DAY" // No último dia de inscrição
  | "EXEMPTION_DEADLINE"; // Prazo limite de isenção de taxa

export type ScheduledJobStatus =
  | "PENDING" // Na fila aguardando horário programado
  | "QUEUED" // Pronto para envio pelo worker
  | "SENT" // Enviado por provedor real configurado
  | "SIMULATED_PROTOTYPE" // Registrado em modo protótipo (sem provedor externo ativo)
  | "FAILED" // Erro no envio
  | "CANCELLED";

export interface ScheduledAlertJob {
  id: string;
  alertId: string;
  opportunityId: string;
  triggerType: AlertTriggerType;
  channel: NotificationChannelType;
  recipient: string;
  scheduledFor: string; // ISO timestamp considerando o timezone do processo
  status: ScheduledJobStatus;
  sentAt?: string;
  deliveryResult?: string;
}

export interface AlertEntity {
  id: string;
  userId?: string;
  opportunityId: string;
  siglaInstituicao: string;
  canais: NotificationChannelType[];
  telefone?: string;
  email?: string;
  alerta48h: boolean;
  alertaDiaFinal: boolean;
  alertaIsencao: boolean;
  status: AlertSubscriptionStatus;
  scheduledJobs: ScheduledAlertJob[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  alertId: string;
  jobId?: string;
  userId?: string;
  opportunityId: string;
  channel: NotificationChannelType;
  recipient: string;
  subject: string;
  body: string;
  status: "QUEUED" | "SENT" | "SIMULATED_PROTOTYPE" | "FAILED";
  providerName?: string;
  providerResponse?: string;
  createdAt: string;
  sentAt?: string;
}

// ============================================================================
// 8. EDITAIS E EXTRAÇÃO ASSISTIDA POR IA (EDITAL_DOCUMENT)
// ============================================================================

export type EditalExtractionStatus =
  | "UPLOADED"
  | "EXTRACTING"
  | "EXTRACTED_PENDING_REVIEW"
  | "REVIEWED_APPROVED"
  | "REJECTED";

export interface EditalDocument {
  id: string;
  opportunityId?: string;
  institutionId?: string;
  titulo: string;
  sourceUrl?: string;
  rawTextLength: number;
  versionLabel: string;
  extractionStatus: EditalExtractionStatus;
  extractedPayload?: Record<string, unknown>;
  requiresHumanReview: boolean;
  reviewedByUserId?: string;
  reviewedAt?: string;
  createdAt: string;
}

// ============================================================================
// 9. CANAL DE ESCOLAS E AUDITORIA (SCHOOL_PARTNERSHIP & AUDIT_LOG)
// ============================================================================

export interface SchoolPartnershipLead {
  id: string;
  nomeEscola: string;
  cidadeEstado: string;
  nomeResponsavel: string;
  cargo: string;
  whatsapp: string;
  email: string;
  status: "NEW" | "CONTACTED" | "PARTNER_ACTIVE";
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorUserId?: string;
  actorRole?: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}
