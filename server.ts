import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { db, StoredUserRecord } from "./server/data/database";
import {
  authenticateOptional,
  createRateLimiter,
  hashPassword,
  issueSessionToken,
  requireAuth,
  requireRole,
  sanitizeString,
  verifyPassword,
} from "./server/security/auth";
import { registerAlertInQueue } from "./server/services/alertSchedulerService";
import { extractEditalStructuredDraft } from "./server/services/editalAiService";
import { obterFusoHorarioPorEstado } from "./src/utils/dateUtils";
import { AlertaUsuario, EstadoBrasil, ProcessoSeletivo, UserPreferences } from "./src/types";
import { OfficialSource, SchoolPartnershipLead } from "./src/domain/models";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api", createRateLimiter(180, 60_000));
app.use("/api", authenticateOptional);

// ============================================================================
// 1. HEALTH CHECK & ARQUITETURA
// ============================================================================

app.get("/api/health", (_req, res) => {
  const state = db.getState();
  res.json({
    status: "ok",
    app: "Vestibulink",
    version: state.version,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    metrics: {
      opportunities: state.opportunities.length,
      institutions: state.institutions.length,
      officialSources: state.officialSources.length,
      activeAlerts: state.alerts.length,
      scheduledJobs: state.scheduledJobs.length,
    },
    time: new Date().toISOString(),
  });
});

// ============================================================================
// 2. AUTENTICAÇÃO, SESSÃO E LGPD (/api/auth/*)
// ============================================================================

app.post("/api/auth/register", (req, res) => {
  try {
    const nome = sanitizeString(req.body?.nome, 120);
    const email = sanitizeString(req.body?.email, 160).toLowerCase();
    const telefone = sanitizeString(req.body?.telefone, 40) || undefined;
    const senha = typeof req.body?.senha === "string" ? req.body.senha : "";
    const acceptedPrivacyPolicy = Boolean(req.body?.acceptedPrivacyPolicy ?? true);

    if (!nome || !email || !email.includes("@")) {
      res.status(400).json({ error: "Nome e e-mail válido são obrigatórios." });
      return;
    }
    if (senha.length < 6) {
      res.status(400).json({ error: "A senha deve possuir no mínimo 6 caracteres." });
      return;
    }

    const state = db.getState();
    if (state.users.some((u) => u.email === email && u.status !== "DELETED")) {
      res.status(409).json({ error: "Já existe uma conta cadastrada com este e-mail." });
      return;
    }

    const now = new Date().toISOString();
    const isFirstUser = state.users.length === 0;
    const newUser: StoredUserRecord = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      nome,
      email,
      telefone,
      passwordHash: hashPassword(senha),
      role: isFirstUser ? "ADMIN" : "USER",
      status: "ACTIVE",
      emailVerificado: false,
      lgpdConsent: {
        acceptedTerms: true,
        acceptedPrivacyPolicy,
        marketingOptIn: false,
        consentedAt: now,
      },
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    state.users.push(newUser);
    db.appendAuditLog({
      actorUserId: newUser.id,
      actorRole: newUser.role,
      action: "USER_REGISTERED",
      entityType: "USER",
      entityId: newUser.id,
    });

    const { passwordHash: _pw, ...safeUser } = newUser;
    const token = issueSessionToken(safeUser);

    res.status(201).json({
      success: true,
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error("[Auth Register Error]:", err);
    res.status(500).json({ error: "Não foi possível concluir o cadastro." });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const email = sanitizeString(req.body?.email, 160).toLowerCase();
    const senha = typeof req.body?.senha === "string" ? req.body.senha : "";

    if (!email || !senha) {
      res.status(400).json({ error: "Informe e-mail e senha." });
      return;
    }

    const state = db.getState();
    const userRecord = state.users.find(
      (u) => u.email === email && u.status === "ACTIVE"
    );

    if (!userRecord || !verifyPassword(senha, userRecord.passwordHash)) {
      res.status(401).json({ error: "Credenciais inválidas." });
      return;
    }

    userRecord.lastLoginAt = new Date().toISOString();
    userRecord.updatedAt = userRecord.lastLoginAt;
    db.appendAuditLog({
      actorUserId: userRecord.id,
      actorRole: userRecord.role,
      action: "USER_LOGIN",
      entityType: "USER",
      entityId: userRecord.id,
    });

    const { passwordHash: _pw, ...safeUser } = userRecord;
    const token = issueSessionToken(safeUser);

    res.json({
      success: true,
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error("[Auth Login Error]:", err);
    res.status(500).json({ error: "Não foi possível realizar o login." });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.authUser,
  });
});

app.post("/api/auth/change-password", requireAuth, (req, res) => {
  const senhaAtual = typeof req.body?.senhaAtual === "string" ? req.body.senhaAtual : "";
  const novaSenha = typeof req.body?.novaSenha === "string" ? req.body.novaSenha : "";

  if (!senhaAtual || novaSenha.length < 6) {
    res.status(400).json({
      error: "Informe a senha atual e uma nova senha com pelo menos 6 caracteres.",
    });
    return;
  }

  const state = db.getState();
  const userRecord = state.users.find((u) => u.id === req.authUser?.id);
  if (!userRecord || !verifyPassword(senhaAtual, userRecord.passwordHash)) {
    res.status(401).json({ error: "Senha atual incorreta." });
    return;
  }

  userRecord.passwordHash = hashPassword(novaSenha);
  userRecord.updatedAt = new Date().toISOString();
  db.appendAuditLog({
    actorUserId: userRecord.id,
    actorRole: userRecord.role,
    action: "USER_PASSWORD_CHANGED",
    entityType: "USER",
    entityId: userRecord.id,
  });

  res.json({ success: true, message: "Senha atualizada com sucesso." });
});

// LGPD: Exclusão de conta e dados pessoais vinculados
app.delete("/api/auth/account", requireAuth, (req, res) => {
  const userId = req.authUser!.id;
  const state = db.getState();

  state.users = state.users.filter((u) => u.id !== userId);
  state.favorites = state.favorites.filter((f) => f.userId !== userId);
  state.alerts = state.alerts.filter((a) => a.userId !== userId);
  delete state.preferencesByKey[userId];

  db.appendAuditLog({
    actorUserId: userId,
    action: "LGPD_ACCOUNT_DELETED",
    entityType: "USER",
    entityId: userId,
  });

  res.json({
    success: true,
    message: "Conta e dados pessoais removidos conforme diretrizes da LGPD.",
  });
});

// ============================================================================
// 3. CATÁLOGO DE OPORTUNIDADES, INSTITUIÇÕES E FONTES OFICIAIS
// ============================================================================

app.get("/api/opportunities", (_req, res) => {
  const state = db.getState();
  res.json({
    success: true,
    opportunities: state.opportunities,
  });
});

app.post("/api/opportunities", (req, res) => {
  try {
    const body = req.body as Partial<ProcessoSeletivo>;
    const sigla = sanitizeString(body.sigla, 40).toUpperCase();
    const nomeInstituicao = sanitizeString(body.nomeInstituicao, 160);
    const tituloProcesso = sanitizeString(body.tituloProcesso, 200);

    if (!sigla || !nomeInstituicao || !tituloProcesso || !body.periodoInscricaoFim) {
      res.status(400).json({
        error: "Sigla, instituição, título do processo e prazo final são obrigatórios.",
      });
      return;
    }

    const estado = (body.estado || "GO") as EstadoBrasil;
    const fusoHorario = body.fusoHorario || obterFusoHorarioPorEstado(estado);
    const id = sanitizeString(body.id, 80) || `opp-${Date.now()}`;
    const institutionId = body.institutionId || `inst-${sigla.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const linkEdital = sanitizeString(body.linkEdital, 500);
    const linkInscricao = sanitizeString(body.linkInscricao, 500);

    // Nunca tratar URL '#' como fonte oficial validada
    const hasRealEditalUrl = linkEdital.startsWith("http://") || linkEdital.startsWith("https://");
    const hasRealInscricaoUrl =
      linkInscricao.startsWith("http://") || linkInscricao.startsWith("https://");

    const fontesOficiais: OfficialSource[] = [];
    if (hasRealEditalUrl) {
      fontesOficiais.push({
        id: `src-notice-${id}`,
        opportunityId: id,
        institutionId,
        url: linkEdital,
        tipoFonte: "NOTICE",
        titulo: "Edital / Página do Processo",
        statusVerificacao: "PENDING_VERIFICATION",
        observacoes: "Cadastrado manualmente — aguardando verificação oficial",
      });
    }
    if (hasRealInscricaoUrl) {
      fontesOficiais.push({
        id: `src-reg-${id}`,
        opportunityId: id,
        institutionId,
        url: linkInscricao,
        tipoFonte: "REGISTRATION",
        titulo: "Página de Inscrição",
        statusVerificacao: "PENDING_VERIFICATION",
        observacoes: "Cadastrado manualmente — aguardando verificação oficial",
      });
    }

    const hoje = new Date().toISOString().split("T")[0];
    const novoProcesso: ProcessoSeletivo = {
      id,
      institutionId,
      sigla,
      nomeInstituicao,
      tituloProcesso,
      tipo: body.tipo === "concurso" ? "concurso" : "vestibular",
      subtipo: body.subtipo || "Vestibular Próprio",
      estado,
      cidade: sanitizeString(body.cidade, 100) || "Campus Principal",
      regiao: ["GO", "MT", "MS", "DF"].includes(estado) ? "Centro-Oeste" : "Sudeste",
      vagas: Math.max(0, Number(body.vagas) || 0),
      taxaInscricao: Math.max(0, Number(body.taxaInscricao) || 0),
      temIsencao: Boolean(body.temIsencao),
      limiteIsencao: body.limiteIsencao,
      periodoInscricaoInicio: body.periodoInscricaoInicio || hoje,
      periodoInscricaoFim: body.periodoInscricaoFim,
      horaFechamento: body.horaFechamento || "23:59",
      fusoHorario,
      dataProva: body.dataProva || body.periodoInscricaoFim,
      areasPrincipais:
        Array.isArray(body.areasPrincipais) && body.areasPrincipais.length > 0
          ? body.areasPrincipais
          : ["todas"],
      linkEdital: hasRealEditalUrl ? linkEdital : "",
      linkInscricao: hasRealInscricaoUrl ? linkInscricao : hasRealEditalUrl ? linkEdital : "",
      fontesOficiais,
      destaques: Array.isArray(body.destaques)
        ? body.destaques.map((d) => sanitizeString(d, 200)).filter(Boolean)
        : [],
      cronograma: Array.isArray(body.cronograma) ? body.cronograma : [],
      notaObservacao: body.notaObservacao
        ? sanitizeString(body.notaObservacao, 400)
        : undefined,
      verificadoManualmente: false,
      statusVerificacao: "PENDING_VERIFICATION",
      dataOrigin: "MANUAL_CURATED",
      dataCriacao: hoje,
      dataAtualizacao: hoje,
    };

    const state = db.getState();
    state.opportunities = [
      novoProcesso,
      ...state.opportunities.filter((p) => p.id !== novoProcesso.id),
    ];
    if (fontesOficiais.length > 0) {
      state.officialSources.unshift(...fontesOficiais);
    }

    db.appendAuditLog({
      actorUserId: req.authUser?.id,
      actorRole: req.authUser?.role,
      action: "OPPORTUNITY_CREATED",
      entityType: "OPPORTUNITY",
      entityId: novoProcesso.id,
      metadata: {
        sigla: novoProcesso.sigla,
        dataOrigin: novoProcesso.dataOrigin,
        statusVerificacao: novoProcesso.statusVerificacao,
      },
    });

    res.status(201).json({
      success: true,
      opportunity: novoProcesso,
    });
  } catch (err) {
    console.error("[Create Opportunity Error]:", err);
    res.status(500).json({ error: "Erro ao salvar processo seletivo." });
  }
});

app.get("/api/institutions", (_req, res) => {
  res.json({
    success: true,
    institutions: db.getState().institutions,
  });
});

app.get("/api/sources", (_req, res) => {
  res.json({
    success: true,
    sources: db.getState().officialSources,
  });
});

// ============================================================================
// 4. ALERTAS, FILA DE AGENDAMENTO E FAVORITOS
// ============================================================================

app.get("/api/alerts", (req, res) => {
  const state = db.getState();
  const userId = req.authUser?.id;
  const alerts = userId
    ? state.alerts.filter((a) => !a.userId || a.userId === userId)
    : state.alerts;

  res.json({
    success: true,
    alerts,
  });
});

app.post("/api/alerts", (req, res) => {
  try {
    const body = req.body as Partial<AlertaUsuario>;
    if (!body.processoId || !body.siglaInstituicao) {
      res.status(400).json({ error: "Processo seletivo inválido para alerta." });
      return;
    }

    const tipoContato =
      body.tipoContato === "email" || body.tipoContato === "ambos"
        ? body.tipoContato
        : "whatsapp";

    const telefone = sanitizeString(body.telefone, 40) || undefined;
    const email = sanitizeString(body.email, 160) || undefined;

    const novoAlerta: AlertaUsuario = {
      id: sanitizeString(body.id, 80) || `alerta-${Date.now()}`,
      userId: req.authUser?.id,
      processoId: sanitizeString(body.processoId, 80),
      siglaInstituicao: sanitizeString(body.siglaInstituicao, 40),
      tipoContato,
      telefone,
      email,
      alerta48h: Boolean(body.alerta48h ?? true),
      alertaDiaFinal: Boolean(body.alertaDiaFinal ?? true),
      alertaIsencao: Boolean(body.alertaIsencao ?? false),
      criadoEm: body.criadoEm || new Date().toISOString(),
    };

    const saved = registerAlertInQueue(novoAlerta);

    db.appendAuditLog({
      actorUserId: req.authUser?.id,
      action: "ALERT_CONFIGURED",
      entityType: "ALERT",
      entityId: saved.id,
      metadata: {
        processoId: saved.processoId,
        tipoContato: saved.tipoContato,
        jobsScheduled: saved.scheduledJobs?.length || 0,
      },
    });

    res.status(201).json({
      success: true,
      alert: saved,
    });
  } catch (err) {
    console.error("[Create Alert Error]:", err);
    res.status(500).json({ error: "Erro ao configurar alerta." });
  }
});

app.delete("/api/alerts/:id", (req, res) => {
  const alertId = sanitizeString(req.params.id, 80);
  const state = db.getState();
  state.alerts = state.alerts.filter((a) => a.id !== alertId);
  state.scheduledJobs = state.scheduledJobs.filter((j) => j.alertId !== alertId);
  db.commit();

  res.json({
    success: true,
    deletedId: alertId,
  });
});

// Favoritos (Salvos pelo usuário)
app.get("/api/favorites", (req, res) => {
  const userId = req.authUser?.id || "anon";
  const favorites = db.getState().favorites.filter((f) => f.userId === userId);
  res.json({ success: true, favorites });
});

app.post("/api/favorites", (req, res) => {
  const userId = req.authUser?.id || "anon";
  const opportunityId = sanitizeString(req.body?.opportunityId, 80);
  if (!opportunityId) {
    res.status(400).json({ error: "opportunityId é obrigatório." });
    return;
  }

  const state = db.getState();
  const existing = state.favorites.find(
    (f) => f.userId === userId && f.opportunityId === opportunityId
  );
  if (existing) {
    res.json({ success: true, favorite: existing });
    return;
  }

  const fav = {
    id: `fav-${Date.now()}`,
    userId,
    opportunityId,
    createdAt: new Date().toISOString(),
  };
  state.favorites.push(fav);
  db.commit();
  res.status(201).json({ success: true, favorite: fav });
});

app.delete("/api/favorites/:opportunityId", (req, res) => {
  const userId = req.authUser?.id || "anon";
  const opportunityId = sanitizeString(req.params.opportunityId, 80);
  const state = db.getState();
  state.favorites = state.favorites.filter(
    (f) => !(f.userId === userId && f.opportunityId === opportunityId)
  );
  db.commit();
  res.json({ success: true });
});

// ============================================================================
// 5. PREFERÊNCIAS DO USUÁRIO & PARCERIA COM ESCOLAS
// ============================================================================

app.get("/api/preferences", (req, res) => {
  const key = req.authUser?.id || "default";
  const prefs = db.getState().preferencesByKey[key] || null;
  res.json({ success: true, preferences: prefs });
});

app.put("/api/preferences", (req, res) => {
  const key = req.authUser?.id || "default";
  const incoming = req.body as UserPreferences;
  if (!incoming || typeof incoming !== "object") {
    res.status(400).json({ error: "Objeto de preferências inválido." });
    return;
  }
  const state = db.getState();
  state.preferencesByKey[key] = incoming;
  db.commit();
  res.json({ success: true, preferences: incoming });
});

app.post("/api/schools/partnership", (req, res) => {
  try {
    const nomeEscola = sanitizeString(req.body?.nomeEscola, 160);
    const cidadeEstado = sanitizeString(req.body?.cidadeEstado, 120);
    const nomeResponsavel = sanitizeString(req.body?.nomeResponsavel, 120);
    const cargo = sanitizeString(req.body?.cargo, 80);
    const whatsapp = sanitizeString(req.body?.whatsapp, 40);
    const email = sanitizeString(req.body?.email, 160);

    if (!nomeEscola || !nomeResponsavel || !email) {
      res.status(400).json({ error: "Preencha os dados obrigatórios da escola." });
      return;
    }

    const lead: SchoolPartnershipLead = {
      id: `school-${Date.now()}`,
      nomeEscola,
      cidadeEstado,
      nomeResponsavel,
      cargo,
      whatsapp,
      email,
      status: "NEW",
      createdAt: new Date().toISOString(),
    };

    const state = db.getState();
    state.schoolLeads.unshift(lead);
    db.appendAuditLog({
      action: "SCHOOL_PARTNERSHIP_LEAD_CREATED",
      entityType: "SCHOOL_LEAD",
      entityId: lead.id,
      metadata: { nomeEscola, cidadeEstado },
    });

    res.status(201).json({ success: true, lead });
  } catch (err) {
    console.error("[School Partnership Error]:", err);
    res.status(500).json({ error: "Erro ao registrar parceria escolar." });
  }
});

// ============================================================================
// 6. EXTRAÇÃO AUXILIAR DE EDITAL COM IA (GEMINI)
// ============================================================================

app.post("/api/extrair-edital", async (req, res) => {
  try {
    const textoEdital =
      typeof req.body?.textoEdital === "string" ? req.body.textoEdital.trim() : "";
    const sourceUrl = sanitizeString(req.body?.sourceUrl, 500) || undefined;

    if (!textoEdital) {
      res.status(400).json({ error: "Texto do edital não fornecido." });
      return;
    }

    const dados = await extractEditalStructuredDraft(textoEdital, sourceUrl);
    res.json({
      success: true,
      dados,
      requiresHumanReview: true,
    });
  } catch (error: any) {
    console.error("Erro na rota /api/extrair-edital:", error);
    res.status(500).json({
      error: "Não foi possível extrair os dados do edital no momento.",
    });
  }
});

// ============================================================================
// 7. PAINEL ADMINISTRATIVO E AUDITORIA (PROTEGIDO POR RBAC)
// ============================================================================

app.get(
  "/api/admin/overview",
  requireRole(["ADMIN", "EDITOR", "DATA_REVIEWER"]),
  (_req, res) => {
    const state = db.getState();
    res.json({
      success: true,
      summary: {
        usersCount: state.users.length,
        institutionsCount: state.institutions.length,
        opportunitiesCount: state.opportunities.length,
        officialSourcesCount: state.officialSources.length,
        alertsCount: state.alerts.length,
        scheduledJobsCount: state.scheduledJobs.length,
        notificationsCount: state.notifications.length,
        editalDocumentsCount: state.editalDocuments.length,
        schoolLeadsCount: state.schoolLeads.length,
      },
      recentLogs: state.auditLogs.slice(0, 50),
    });
  }
);

app.patch(
  "/api/admin/opportunities/:id/verify",
  requireRole(["ADMIN", "EDITOR", "DATA_REVIEWER"]),
  (req, res) => {
    const id = sanitizeString(req.params.id, 80);
    const state = db.getState();
    const opp = state.opportunities.find((o) => o.id === id);
    if (!opp) {
      res.status(404).json({ error: "Oportunidade não encontrada." });
      return;
    }

    const nowIso = new Date().toISOString();
    opp.verificadoManualmente = true;
    opp.statusVerificacao = "VERIFIED_RECENTLY";
    opp.dataOrigin = "OFFICIAL_VERIFIED";
    opp.ultimaVerificacao = nowIso;
    opp.dataAtualizacao = nowIso.split("T")[0];

    db.appendAuditLog({
      actorUserId: req.authUser?.id,
      actorRole: req.authUser?.role,
      action: "OPPORTUNITY_VERIFIED_BY_ADMIN",
      entityType: "OPPORTUNITY",
      entityId: opp.id,
    });

    res.json({ success: true, opportunity: opp });
  }
);

// Tratamento seguro de erros (não vaza stack traces nem secrets para o cliente)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Vestibulink Unhandled Server Error]:", err.message);
  res.status(500).json({
    success: false,
    error: "Erro interno ao processar a solicitação.",
  });
});

// Integração com Vite Middleware em desenvolvimento e build estático em produção
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Vestibulink] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Vestibulink server:", err);
});
