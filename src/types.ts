import type {
  BrazilTimezone,
  ConcursoProcessDetails,
  DataOriginClassification,
  OfficialSource,
  ScheduledAlertJob,
  VerificationHealthStatus,
} from "./domain/models";

export type {
  BrazilTimezone,
  ConcursoProcessDetails,
  DataOriginClassification,
  OfficialSource,
  ScheduledAlertJob,
  VerificationHealthStatus,
};

export type EstadoBrasil =
  | "TODOS"
  | "GO"
  | "MT"
  | "MS"
  | "DF"
  | "SP"
  | "RJ"
  | "MG"
  | "PR"
  | "SC"
  | "RS"
  | "BA"
  | "PE"
  | "CE";

export type RegiaoBrasil = "Centro-Oeste" | "Sudeste" | "Sul" | "Nordeste" | "Norte" | "Nacional";

export type TipoProcesso = "vestibular" | "concurso" | "todos";

export type StatusInscricao =
  | "aberto"
  | "reta-final" // menos de 48h
  | "fecha-hoje"
  | "isencao-aberta"
  | "em-breve"
  | "encerrado";

export type AreaCurso =
  | "todas"
  | "medicina"
  | "direito"
  | "engenharias"
  | "tecnologia"
  | "saude"
  | "humanas"
  | "negocios"
  | "concurso-geral";

export interface CronogramaItem {
  etapa: string;
  dataInicio: string; // YYYY-MM-DD
  dataFim?: string;
  descricao?: string;
  destaque?: boolean;
}

export interface ProcessoSeletivo {
  id: string;
  institutionId?: string;
  sigla: string;
  nomeInstituicao: string;
  tituloProcesso: string;
  tipo: "vestibular" | "concurso";
  subtipo: "Vestibular Próprio" | "SiSU / ENEM" | "Vestibular Seriado / PAS" | "Concurso Público" | "Vestibular de Medicina";
  estado: EstadoBrasil;
  cidade: string;
  regiao: RegiaoBrasil;
  vagas: number;
  taxaInscricao: number; // 0 se gratuito
  temIsencao: boolean;
  limiteIsencao?: string; // YYYY-MM-DD
  periodoInscricaoInicio: string; // YYYY-MM-DD
  periodoInscricaoFim: string; // YYYY-MM-DD
  horaFechamento?: string; // ex: "23:59"
  fusoHorario?: BrazilTimezone; // ex: "America/Sao_Paulo", "America/Cuiaba"
  dataProva: string; // YYYY-MM-DD
  dataProvaFim?: string;
  areasPrincipais: AreaCurso[];
  linkSiteOficial?: string;
  linkEdital: string;
  linkInscricao: string;
  linkResultados?: string;
  linkCronograma?: string;
  fontesOficiais?: OfficialSource[];
  destaques: string[];
  cronograma: CronogramaItem[];
  notaObservacao?: string;
  verificadoManualmente: boolean;
  statusVerificacao?: VerificationHealthStatus;
  dataOrigin?: DataOriginClassification;
  dataCriacao?: string;
  dataAtualizacao: string;
  ultimaVerificacao?: string;
  concursoDetails?: ConcursoProcessDetails;
}

export interface AlertaUsuario {
  id: string;
  userId?: string;
  processoId: string;
  siglaInstituicao: string;
  tipoContato: "whatsapp" | "email" | "ambos";
  telefone?: string;
  email?: string;
  alerta48h: boolean;
  alertaDiaFinal: boolean;
  alertaIsencao: boolean;
  status?: "CONFIGURED" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  scheduledJobs?: ScheduledAlertJob[];
  criadoEm: string;
}

export interface UserPreferences {
  estadoSelecionado: EstadoBrasil;
  areaSelecionada: AreaCurso;
  tipoSelecionado: TipoProcesso;
  apenasComIsencao: boolean;
  apenasGratis: boolean;
  faseLançamento: 1 | 2 | 3;
}
