import React from "react";
import {
  Calendar,
  Clock,
  ExternalLink,
  Bell,
  MapPin,
  CheckCircle2,
  Users,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { ProcessoSeletivo } from "../types";
import { calcularStatus, formatarDataBR, formatarMoeda } from "../utils/dateUtils";

interface VestibularCardProps {
  key?: string;
  processo: ProcessoSeletivo;
  onOpenDetail: (processo: ProcessoSeletivo) => void;
  onOpenAlert: (processo: ProcessoSeletivo) => void;
  hasActiveAlert: boolean;
}

export function VestibularCard({
  processo,
  onOpenDetail,
  onOpenAlert,
  hasActiveAlert,
}: VestibularCardProps) {
  const { status, diasRestantes, horasRestantes, textoUrgencia, badgeClasse } =
    calcularStatus(processo);

  const isRetaFinal = status === "reta-final" || status === "fecha-hoje";

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl border bg-white p-5 sm:p-6 transition-all duration-200 ${
        isRetaFinal
          ? "border-rose-300 shadow-md ring-1 ring-rose-200 hover:shadow-lg"
          : "border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div>
        {/* Top Badges & Urgência */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-slate-900 text-white px-2.5 py-1 text-xs font-black tracking-wide">
              {processo.sigla}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] font-bold">
              <MapPin className="h-3 w-3 text-rose-500" />
              {processo.estado} • {processo.cidade}
            </span>
            <span className="rounded-lg bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[11px] font-semibold">
              {processo.subtipo}
            </span>
          </div>

          {/* Badge de Prazo & Contagem Regressiva */}
          <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold ${badgeClasse}`}>
            {isRetaFinal && <Clock className="h-3.5 w-3.5 shrink-0" />}
            <span>{textoUrgencia}</span>
          </span>
        </div>

        {/* Título do Processo e Instituição */}
        <div className="mb-4">
          <h3
            onClick={() => onOpenDetail(processo)}
            className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
          >
            {processo.tituloProcesso}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
            {processo.nomeInstituicao}
          </p>
        </div>

        {/* Grade de Dados Cruciais (Inscrições, Taxa, Vagas, Prova) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 mb-4 text-xs">
          {/* Prazo Final */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Inscrições até
            </span>
            <span className={`font-bold block mt-0.5 ${isRetaFinal ? "text-rose-600" : "text-slate-800"}`}>
              {formatarDataBR(processo.periodoInscricaoFim)}
            </span>
            {processo.horaFechamento && (
              <span className="text-[10px] text-slate-500">
                até às {processo.horaFechamento}
              </span>
            )}
          </div>

          {/* Taxa e Isenção */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Taxa de Inscrição
            </span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {formatarMoeda(processo.taxaInscricao)}
            </span>
            {processo.temIsencao ? (
              <span className="text-[10px] text-emerald-700 font-semibold">
                Tem isenção
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Sem isenção</span>
            )}
          </div>

          {/* Vagas */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Vagas Abertas
            </span>
            <span className="font-bold text-slate-800 block mt-0.5 flex items-center gap-1">
              <Users className="h-3 w-3 text-slate-400" />
              {processo.vagas.toLocaleString("pt-BR")}
            </span>
            <span className="text-[10px] text-slate-500">ampla + cotas</span>
          </div>

          {/* Data da Prova */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Data da Prova
            </span>
            <span className="font-bold text-indigo-700 block mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatarDataBR(processo.dataProva)}
            </span>
            <span className="text-[10px] text-slate-500">etapa única/1ª fase</span>
          </div>
        </div>

        {/* Destaques Rápido */}
        {processo.destaques && processo.destaques.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {processo.destaques.slice(0, 2).map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
              >
                <span className="h-1 w-1 rounded-full bg-slate-400" />
                <span className="truncate max-w-[260px]">{item}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Botões de Ação do Card */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onOpenDetail(processo)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-1"
        >
          Ver Cronograma Completo e Edital →
        </button>

        {/* Botão de Alerta (Diferencial Original do Produto) */}
        <button
          type="button"
          onClick={() => onOpenAlert(processo)}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-98 shadow-xs ${
            hasActiveAlert
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-[#172554] hover:bg-[#1e3a8a] text-white"
          }`}
        >
          <Bell className={`h-3.5 w-3.5 ${hasActiveAlert ? "fill-current" : ""}`} />
          <span>{hasActiveAlert ? "Alerta Ativado!" : "Ativar Alerta Grátis"}</span>
        </button>
      </div>
    </div>
  );
}
