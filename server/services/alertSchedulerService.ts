import { AlertaUsuario, ProcessoSeletivo } from "../../src/types";
import {
  AlertTriggerType,
  NotificationChannelType,
  NotificationRecord,
  ScheduledAlertJob,
} from "../../src/domain/models";
import {
  obterFusoHorarioPorEstado,
  obterOffsetPorFuso,
  obterTimestampFechamento,
} from "../../src/utils/dateUtils";
import { db } from "../data/database";

/**
 * Calcula e cria os jobs agendados na fila de notificações para um alerta configurado.
 * Separa rigorosamente a CONFIGURAÇÃO do alerta do ENVIO da notificação.
 */
export function buildScheduledJobsForAlert(
  alerta: AlertaUsuario,
  processo?: ProcessoSeletivo
): ScheduledAlertJob[] {
  if (!processo) return [];

  const channels: NotificationChannelType[] = [];
  if (alerta.tipoContato === "whatsapp" || alerta.tipoContato === "ambos") {
    if (alerta.telefone) channels.push("WHATSAPP");
  }
  if (alerta.tipoContato === "email" || alerta.tipoContato === "ambos") {
    if (alerta.email) channels.push("EMAIL");
  }

  const timezone = processo.fusoHorario || obterFusoHorarioPorEstado(processo.estado);
  const offset = obterOffsetPorFuso(timezone);
  const fechamentoDate = obterTimestampFechamento(processo);

  const triggers: { type: AlertTriggerType; scheduledDate: Date }[] = [];

  if (alerta.alerta48h) {
    const date48h = new Date(fechamentoDate.getTime() - 48 * 60 * 60 * 1000);
    triggers.push({ type: "DEADLINE_48H", scheduledDate: date48h });
  }

  if (alerta.alertaDiaFinal) {
    const dateFinalMorning = new Date(`${processo.periodoInscricaoFim}T08:00:00${offset}`);
    triggers.push({
      type: "DEADLINE_FINAL_DAY",
      scheduledDate: Number.isNaN(dateFinalMorning.getTime())
        ? fechamentoDate
        : dateFinalMorning,
    });
  }

  if (alerta.alertaIsencao && processo.temIsencao && processo.limiteIsencao) {
    const dateIsencao = new Date(`${processo.limiteIsencao}T08:00:00${offset}`);
    if (!Number.isNaN(dateIsencao.getTime())) {
      triggers.push({ type: "EXEMPTION_DEADLINE", scheduledDate: dateIsencao });
    }
  }

  const jobs: ScheduledAlertJob[] = [];

  for (const channel of channels) {
    const recipient = channel === "WHATSAPP" ? alerta.telefone || "" : alerta.email || "";
    if (!recipient) continue;

    for (const trig of triggers) {
      jobs.push({
        id: `job-${alerta.id}-${channel.toLowerCase()}-${trig.type.toLowerCase()}`,
        alertId: alerta.id,
        opportunityId: processo.id,
        triggerType: trig.type,
        channel,
        recipient,
        scheduledFor: trig.scheduledDate.toISOString(),
        status: "PENDING",
      });
    }
  }

  return jobs;
}

/**
 * Registra o alerta no banco persistente e agenda os jobs na fila de disparo.
 */
export function registerAlertInQueue(alertaInput: AlertaUsuario): AlertaUsuario {
  const state = db.getState();
  const processo = state.opportunities.find((p) => p.id === alertaInput.processoId);

  // Remove alerta anterior do mesmo processo/contato para evitar duplicidade
  state.alerts = state.alerts.filter(
    (a) => a.id !== alertaInput.id && a.processoId !== alertaInput.processoId
  );
  state.scheduledJobs = state.scheduledJobs.filter(
    (j) => j.alertId !== alertaInput.id && j.opportunityId !== alertaInput.processoId
  );

  const scheduledJobs = buildScheduledJobsForAlert(alertaInput, processo);

  const savedAlert: AlertaUsuario = {
    ...alertaInput,
    status: scheduledJobs.length > 0 ? "SCHEDULED" : "CONFIGURED",
    scheduledJobs,
  };

  state.alerts.unshift(savedAlert);
  state.scheduledJobs.push(...scheduledJobs);

  // Registra log de notificação em fila (sem afirmar envio real se não houver provedor externo ativo)
  const hasRealWhatsappProvider = Boolean(process.env.WHATSAPP_API_TOKEN);
  const hasRealEmailProvider = Boolean(process.env.SMTP_HOST || process.env.EMAIL_API_KEY);

  for (const job of scheduledJobs) {
    const isProviderConfigured =
      job.channel === "WHATSAPP" ? hasRealWhatsappProvider : hasRealEmailProvider;

    const notification: NotificationRecord = {
      id: `notif-${job.id}`,
      alertId: savedAlert.id,
      jobId: job.id,
      userId: savedAlert.userId,
      opportunityId: savedAlert.processoId,
      channel: job.channel,
      recipient: job.recipient,
      subject: `[Vestibulink] Lembrete programado (${job.triggerType}): ${savedAlert.siglaInstituicao}`,
      body: `Alerta configurado para ${savedAlert.siglaInstituicao}. Agendado para ${job.scheduledFor}.`,
      status: isProviderConfigured ? "QUEUED" : "SIMULATED_PROTOTYPE",
      providerName: isProviderConfigured ? "EXTERNAL_PROVIDER" : "LOCAL_SCHEDULER_QUEUE",
      providerResponse: isProviderConfigured
        ? "Aguardando janela de disparo no agendador"
        : "Configuração salva na fila local (provedor externo de disparo pendente de configuração)",
      createdAt: new Date().toISOString(),
    };
    state.notifications.unshift(notification);
  }

  db.commit();
  return savedAlert;
}
