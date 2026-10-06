import {
  X,
  Calendar,
  Clock,
  ExternalLink,
  Bell,
  MapPin,
  FileText,
  DollarSign,
  Users,
  CheckCircle2,
  CalendarPlus,
  Share2,
} from "lucide-react";
import { ProcessoSeletivo } from "../types";
import {
  calcularStatus,
  formatarDataBR,
  formatarMoeda,
  gerarLinkGoogleAgenda,
  baixarArquivoICS,
} from "../utils/dateUtils";

interface VestibularDetailModalProps {
  processo: ProcessoSeletivo | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAlert: (processo: ProcessoSeletivo) => void;
  hasActiveAlert: boolean;
}

export function VestibularDetailModal({
  processo,
  isOpen,
  onClose,
  onOpenAlert,
  hasActiveAlert,
}: VestibularDetailModalProps) {
  if (!isOpen || !processo) return null;

  const { status, diasRestantes, textoUrgencia, badgeClasse } = calcularStatus(processo);
  const isRetaFinal = status === "reta-final" || status === "fecha-hoje";

  const handleCompartilhar = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Prazo do Vestibular ${processo.sigla} no Vestibulink`,
          text: `Inscrições para o ${processo.tituloProcesso} encerram em ${formatarDataBR(
            processo.periodoInscricaoFim
          )}. Não perca o prazo!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Vestibular ${processo.sigla}: inscrições até ${formatarDataBR(
          processo.periodoInscricaoFim
        )}. Acompanhe no Vestibulink: ${window.location.href}`
      );
      alert("Link e resumo copiados para a área de transferência!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
        {/* Header do Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6 bg-slate-50/70">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="rounded-xl bg-slate-900 text-white px-2.5 py-1 text-xs font-black">
                {processo.sigla}
              </span>
              <span className="rounded-lg bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold">
                {processo.subtipo}
              </span>
              <span className={`rounded-xl border px-2.5 py-0.5 text-xs font-semibold ${badgeClasse}`}>
                {textoUrgencia}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 font-display">
              {processo.tituloProcesso}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span>
                {processo.nomeInstituicao} • {processo.cidade} - {processo.estado} ({processo.regiao})
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Card Resumo de Prazos e Taxa */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Término Inscrições
              </span>
              <p className={`text-sm font-black mt-1 ${isRetaFinal ? "text-rose-600" : "text-slate-900"}`}>
                {formatarDataBR(processo.periodoInscricaoFim)}
              </p>
              {processo.horaFechamento && (
                <span className="text-[10px] text-slate-500">
                  às {processo.horaFechamento}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Taxa de Inscrição
              </span>
              <p className="text-sm font-black text-slate-900 mt-1">
                {formatarMoeda(processo.taxaInscricao)}
              </p>
              <span className="text-[10px] text-slate-500">
                {processo.temIsencao ? "Permite isenção" : "Sem isenção"}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total de Vagas
              </span>
              <p className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {processo.vagas.toLocaleString("pt-BR")}
              </p>
              <span className="text-[10px] text-slate-500">ampla concorrência + cotas</span>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Data da Prova
              </span>
              <p className="text-sm font-black text-indigo-700 mt-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatarDataBR(processo.dataProva)}
              </p>
              <span className="text-[10px] text-slate-500">fase objetiva</span>
            </div>
          </div>

          {/* Destaques do Edital */}
          {processo.destaques && processo.destaques.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Pontos-Chave do Processo Seletivo
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {processo.destaques.map((destaque, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-700"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{destaque}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cronograma Completo e Oficial */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-600" />
                Cronograma Oficial de Datas
              </h4>
              <span className="text-[11px] text-slate-400">
                Verificado manualmente no edital
              </span>
            </div>

            <div className="relative pl-6 border-l-2 border-indigo-100 flex flex-col gap-4 my-2">
              {processo.cronograma.map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Ponto na timeline */}
                  <div
                    className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 transition-transform ${
                      item.destaque
                        ? "border-rose-500 scale-110 shadow-xs"
                        : "border-indigo-400"
                    }`}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-mono font-bold ${
                          item.destaque
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {formatarDataBR(item.dataInicio)}
                        {item.dataFim && ` até ${formatarDataBR(item.dataFim)}`}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900">
                        {item.etapa}
                      </h5>
                    </div>
                    {item.descricao && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {item.descricao}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agendar no Calendário */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <CalendarPlus className="h-4 w-4 text-indigo-600" />
                Sincronizar com seu Calendário Pessoal
              </h5>
              <p className="text-xs text-indigo-800/80 mt-0.5">
                Adicione o prazo final de inscrição direto na sua agenda.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={gerarLinkGoogleAgenda(processo)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-white border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-900 hover:bg-indigo-50 shadow-2xs transition-colors"
              >
                Google Agenda
              </a>
              <button
                type="button"
                onClick={() => baixarArquivoICS(processo)}
                className="rounded-xl bg-white border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-900 hover:bg-indigo-50 shadow-2xs transition-colors"
              >
                Baixar .ICS
              </button>
            </div>
          </div>
        </div>

        {/* Footer com Botões de Ação */}
        <div className="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCompartilhar}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Compartilhar</span>
            </button>

            <a
              href={processo.linkEdital}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Edital Oficial (PDF)</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={processo.linkInscricao}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <span>Ir para Inscrição Oficial</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </a>

            <button
              type="button"
              onClick={() => {
                onOpenAlert(processo);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors shadow-md active:scale-98"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>{hasActiveAlert ? "Alerta já Ativado" : "Ativar Alerta no WhatsApp"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
