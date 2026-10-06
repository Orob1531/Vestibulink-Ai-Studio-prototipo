import fs from "fs";
import path from "path";
import { INITIAL_INSTITUTIONS, INITIAL_PROCESSOS } from "../../src/data/initialVestibulares";
import { AlertaUsuario, ProcessoSeletivo, UserPreferences } from "../../src/types";
import {
  AuditLogEntry,
  EditalDocument,
  Favorite,
  Institution,
  NotificationRecord,
  OfficialSource,
  ScheduledAlertJob,
  SchoolPartnershipLead,
  User,
} from "../../src/domain/models";

export interface StoredUserRecord extends User {
  passwordHash: string;
}

export interface DatabaseSchema {
  version: string;
  updatedAt: string;
  users: StoredUserRecord[];
  preferencesByKey: Record<string, UserPreferences>;
  institutions: Institution[];
  opportunities: ProcessoSeletivo[];
  officialSources: OfficialSource[];
  favorites: Favorite[];
  alerts: AlertaUsuario[];
  scheduledJobs: ScheduledAlertJob[];
  notifications: NotificationRecord[];
  editalDocuments: EditalDocument[];
  schoolLeads: SchoolPartnershipLead[];
  auditLogs: AuditLogEntry[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE_PATH = path.join(DATA_DIR, "vestibulink-db.json");

function createInitialDatabase(): DatabaseSchema {
  const officialSources: OfficialSource[] = [];
  for (const proc of INITIAL_PROCESSOS) {
    if (proc.fontesOficiais) {
      officialSources.push(...proc.fontesOficiais);
    }
  }

  return {
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    users: [],
    preferencesByKey: {},
    institutions: [...INITIAL_INSTITUTIONS],
    opportunities: [...INITIAL_PROCESSOS],
    officialSources,
    favorites: [],
    alerts: [],
    scheduledJobs: [],
    notifications: [],
    editalDocuments: [],
    schoolLeads: [],
    auditLogs: [
      {
        id: `audit-init-${Date.now()}`,
        action: "DATABASE_SEED_INITIALIZED",
        entityType: "SYSTEM",
        metadata: {
          opportunitiesCount: INITIAL_PROCESSOS.length,
          institutionsCount: INITIAL_INSTITUTIONS.length,
          dataOrigin: "DEMO_SEED",
        },
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

class PersistentDatabase {
  private state: DatabaseSchema;

  constructor() {
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
        const defaults = createInitialDatabase();
        return {
          ...defaults,
          ...parsed,
          opportunities:
            Array.isArray(parsed.opportunities) && parsed.opportunities.length > 0
              ? parsed.opportunities
              : defaults.opportunities,
          institutions:
            Array.isArray(parsed.institutions) && parsed.institutions.length > 0
              ? parsed.institutions
              : defaults.institutions,
        };
      }
    } catch (err) {
      console.warn("[Vestibulink DB] Aviso ao carregar banco local, iniciando com seed:", err);
    }

    const initial = createInitialDatabase();
    this.saveToDisk(initial);
    return initial;
  }

  private saveToDisk(data: DatabaseSchema = this.state): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      data.updatedAt = new Date().toISOString();
      const tempPath = `${DB_FILE_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tempPath, DB_FILE_PATH);
    } catch (err) {
      console.error("[Vestibulink DB] Erro ao persistir banco em disco:", err);
    }
  }

  public getState(): DatabaseSchema {
    return this.state;
  }

  public commit(): void {
    this.saveToDisk(this.state);
  }

  public appendAuditLog(entry: Omit<AuditLogEntry, "id" | "createdAt">): AuditLogEntry {
    const log: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 500);
    }
    this.commit();
    return log;
  }
}

export const db = new PersistentDatabase();
