import { BrazilTimezone, EstadoBrasil, ProcessoSeletivo, StatusInscricao } from "../types";

/**
 * Retorna o fuso horário IANA padrão para cada estado brasileiro quando não especificado no processo.
 */
export function obterFusoHorarioPorEstado(estado: EstadoBrasil): BrazilTimezone {
  switch (estado) {
    case "MT":
      return "America/Cuiaba"; // UTC-4
    case "MS":
      return "America/Campo_Grande"; // UTC-4
    default:
      return "America/Sao_Paulo"; // UTC-3 (GO, DF, SP, RJ, MG, PR, SC, RS, BA, PE, CE, etc.)
  }
}

/**
 * Retorna o offset ISO para o fuso horário brasileiro correspondente.
 */
export function obterOffsetPorFuso(timezone: BrazilTimezone): string {
  switch (timezone) {
    case "America/Cuiaba":
    case "America/Campo_Grande":
    case "America/Manaus":
      return "-04:00";
    case "America/Rio_Branco":
      return "-05:00";
    case "America/Sao_Paulo":
    case "America/Belem":
    default:
      return "-03:00";
  }
}

/**
 * Converte data YYYY-MM-DD + horaFechamento (ex: "18:00" ou "23:59") + fuso horário
 * em um objeto Date preciso, evitando assumir o fuso local do servidor.
 */
export function obterTimestampFechamento(processo: ProcessoSeletivo): Date {
  const timezone = processo.fusoHorario || obterFusoHorarioPorEstado(processo.estado);
  const offset = obterOffsetPorFuso(timezone);
  const hora = processo.horaFechamento && /^\d{2}:\d{2}$/.test(processo.horaFechamento)
    ? `${processo.horaFechamento}:59`
    : "23:59:59";
  const parsed = new Date(`${processo.periodoInscricaoFim}T${hora}${offset}`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(`${processo.periodoInscricaoFim}T23:59:59`);
  }
  return parsed;
}

export function calcularStatus(processo: ProcessoSeletivo): {
  status: StatusInscricao;
  diasRestantes: number;
  horasRestantes: number;
  textoUrgencia: string;
  badgeClasse: string;
} {
  const agora = new Date();
  const fimDate = obterTimestampFechamento(processo);
  const diffMs = fimDate.getTime() - agora.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHoras = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  // Checar se a isenção está aberta e acaba em até 2 dias considerando o fuso do processo
  let isencaoAtiva = false;
  if (processo.temIsencao && processo.limiteIsencao) {
    const timezone = processo.fusoHorario || obterFusoHorarioPorEstado(processo.estado);
    const offset = obterOffsetPorFuso(timezone);
    const isencaoFim = new Date(`${processo.limiteIsencao}T23:59:59${offset}`);
    const diffIsencao = isencaoFim.getTime() - agora.getTime();
    if (diffIsencao >= 0 && diffIsencao <= 2 * 24 * 60 * 60 * 1000) {
      isencaoAtiva = true;
    }
  }

  if (diffMs < 0) {
    return {
      status: "encerrado",
      diasRestantes: 0,
      horasRestantes: 0,
      textoUrgencia: "Inscrições Encerradas",
      badgeClasse: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  if (diffDias <= 1) {
    return {
      status: "fecha-hoje",
      diasRestantes: 0,
      horasRestantes: diffHoras,
      textoUrgencia: diffHoras > 0 ? `FECHA HOJE! (~${diffHoras}h)` : "FECHANDO AGORA!",
      badgeClasse: "bg-rose-500 text-white border-rose-600 animate-pulse font-bold shadow-xs",
    };
  }

  if (diffDias <= 3) {
    return {
      status: "reta-final",
      diasRestantes: diffDias,
      horasRestantes: diffHoras,
      textoUrgencia: `Reta Final: Faltam ${diffDias} dias!`,
      badgeClasse: "bg-amber-500 text-white border-amber-600 font-bold shadow-xs",
    };
  }

  if (isencaoAtiva) {
    return {
      status: "isencao-aberta",
      diasRestantes: diffDias,
      horasRestantes: diffHoras,
      textoUrgencia: "Últimos dias de Isenção da Taxa!",
      badgeClasse: "bg-emerald-600 text-white border-emerald-700 font-medium shadow-xs",
    };
  }

  return {
    status: "aberto",
    diasRestantes: diffDias,
    horasRestantes: diffHoras,
    textoUrgencia: `Aberto: ${diffDias} dias restantes`,
    badgeClasse: "bg-indigo-50 text-indigo-700 border-indigo-200 font-medium",
  };
}

export function formatarDataBR(dataStr: string): string {
  if (!dataStr) return "";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarMoeda(valor: number): string {
  if (valor === 0) return "Gratuito";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Gerar link para Google Agenda
export function gerarLinkGoogleAgenda(processo: ProcessoSeletivo): string {
  const titulo = encodeURIComponent(`[Vestibulink] Fim da Inscrição: ${processo.sigla}`);
  const detalhes = encodeURIComponent(
    `Processo: ${processo.tituloProcesso}\nInstituição: ${processo.nomeInstituicao}\nTaxa: ${formatarMoeda(
      processo.taxaInscricao
    )}\nLink Oficial de Inscrição: ${processo.linkInscricao}\nEdital: ${processo.linkEdital}\n\nLembrete organizado pelo Vestibulink - Nunca perca um prazo de vestibular.`
  );
  const dataFimFormatada = processo.periodoInscricaoFim.replace(/-/g, "");
  const dates = `${dataFimFormatada}T090000Z/${dataFimFormatada}T220000Z`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${dates}&details=${detalhes}&location=${encodeURIComponent(
    processo.cidade + " - " + processo.estado
  )}`;
}

// Gerar arquivo .ICS para download
export function baixarArquivoICS(processo: ProcessoSeletivo) {
  const dataFim = processo.periodoInscricaoFim.replace(/-/g, "");
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Vestibulink//PT-BR
BEGIN:VEVENT
UID:${processo.id}-${Date.now()}@vestibulink.com.br
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART;VALUE=DATE:${dataFim}
DTEND;VALUE=DATE:${dataFim}
SUMMARY:[Vestibulink] Último Dia de Inscrição: ${processo.sigla}
DESCRIPTION:Último dia para se inscrever no ${processo.tituloProcesso}. Link: ${processo.linkInscricao}
LOCATION:${processo.cidade} - ${processo.estado}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `vestibulink-${processo.sigla.toLowerCase()}-prazo.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
