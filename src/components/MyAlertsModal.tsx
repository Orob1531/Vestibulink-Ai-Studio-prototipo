import { X, Bell, Trash2, Calendar, MapPin, ExternalLink, ShieldCheck } from "lucide-react";
import { AlertaUsuario, ProcessoSeletivo } from "../types";
import { calcularStatus, formatarDataBR } from "../utils/dateUtils";

interface MyAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertas: AlertaUsuario[];
  processos: ProcessoSeletivo[];
  onRemoveAlerta: (alertaId: string) => void;
  onOpenProcessoDetail: (processo: ProcessoSeletivo) => void;
}

export function MyAlertsModal({
  isOpen,
  onClose,
  alertas,
  processos,
  onRemoveAlerta,
  onOpenProcessoDetail,
}: MyAlertsModalProps) {
  if (!isOpen) return null;

  const getProcesso = (processoId: string) => {
    return processos.find((p) => p.id === processoId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-xl max-h-[85vh] bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Meus Alertas Agendados
              </h3>
              <p className="text-xs text-slate-500">
                Você será notificado antes do encerramento de cada prazo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lista de Alertas */}
        <div className="flex-1 overflow-y-auto p-5">
          {alertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Bell className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Nenhum alerta cadastrado ainda
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Clique no botão "Ativar Alerta" em qualquer vestibular ou concurso na lista para receber lembretes automáticos.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {alertas.map((alerta) => {
                const proc = getProcesso(alerta.processoId);
                if (!proc) return null;

                const { status, textoUrgencia, badgeClasse } = calcularStatus(proc);

                return (
                  <div
                    key={alerta.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 bg-white hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-lg bg-slate-900 text-white px-2 py-0.5 text-xs font-black">
                          {proc.sigla}
                        </span>
                        <span className="text-xs text-slate-500">
                          {proc.cidade} - {proc.estado}
                        </span>
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] ${badgeClasse}`}>
                          {textoUrgencia}
                        </span>
                      </div>

                      <h4
                        onClick={() => {
                          onOpenProcessoDetail(proc);
                          onClose();
                        }}
                        className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                      >
                        {proc.tituloProcesso}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>
                          Inscrições até: <strong>{formatarDataBR(proc.periodoInscricaoFim)}</strong>
                        </span>
                        <span>•</span>
                        <span className="capitalize">
                          Canal: {alerta.tipoContato} {alerta.telefone ? `(${alerta.telefone})` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenProcessoDetail(proc);
                          onClose();
                        }}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Ver Detalhes
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveAlerta(alerta.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remover alerta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
