import React, { useState, FormEvent } from "react";
import {
  X,
  Bell,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Send,
} from "lucide-react";
import { AlertaUsuario, ProcessoSeletivo } from "../types";
import { formatarDataBR } from "../utils/dateUtils";

interface AlertModalProps {
  processo: ProcessoSeletivo | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAlert: (alerta: AlertaUsuario) => void;
  existingAlert?: AlertaUsuario;
}

export function AlertModal({
  processo,
  isOpen,
  onClose,
  onSaveAlert,
  existingAlert,
}: AlertModalProps) {
  if (!isOpen || !processo) return null;

  const [tipoContato, setTipoContato] = useState<"whatsapp" | "email" | "ambos">(
    existingAlert?.tipoContato || "whatsapp"
  );
  const [telefone, setTelefone] = useState(existingAlert?.telefone || "");
  const [email, setEmail] = useState(existingAlert?.email || "");
  const [alerta48h, setAlerta48h] = useState(
    existingAlert ? existingAlert.alerta48h : true
  );
  const [alertaDiaFinal, setAlertaDiaFinal] = useState(
    existingAlert ? existingAlert.alertaDiaFinal : true
  );
  const [alertaIsencao, setAlertaIsencao] = useState(
    existingAlert ? existingAlert.alertaIsencao : processo.temIsencao
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const novoAlerta: AlertaUsuario = {
      id: existingAlert?.id || `alerta-${Date.now()}`,
      processoId: processo.id,
      siglaInstituicao: processo.sigla,
      tipoContato,
      telefone: tipoContato !== "email" ? telefone : undefined,
      email: tipoContato !== "whatsapp" ? email : undefined,
      alerta48h,
      alertaDiaFinal,
      alertaIsencao,
      criadoEm: new Date().toISOString(),
    };

    onSaveAlert(novoAlerta);
    setIsSubmitted(true);
  };

  const linkWhatsAppConfirmacao = () => {
    const textoMsg = encodeURIComponent(
      `Olá! Quero ativar meus alertas do Vestibulink para o ${processo.sigla} (${processo.tituloProcesso}). Prazo final de inscrição: ${formatarDataBR(
        processo.periodoInscricaoFim
      )}.`
    );
    return `https://wa.me/?text=${textoMsg}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-lg bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
        {/* Header do Alerta */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-display">
                Ativar Alerta de Prazo
              </h3>
              <p className="text-xs text-slate-500">
                {processo.sigla} • Inscrições até {formatarDataBR(processo.periodoInscricaoFim)}
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

        {/* Conteúdo */}
        <div className="p-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* O Diferencial Original do Vestibulink (Página 3 e 9 do PDF) */}
              <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-900 leading-relaxed">
                  <strong>O diferencial Vestibulink:</strong> avisamos diretamente no seu WhatsApp antes do edital fechar, para você nunca mais perder uma taxa ou o prazo final.
                </p>
              </div>

              {/* Escolha do Canal de Notificação */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Como você quer ser avisado?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoContato("whatsapp")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                      tipoContato === "whatsapp"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs">WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoContato("email")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                      tipoContato === "email"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-bold shadow-xs ring-1 ring-indigo-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Mail className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs">E-mail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoContato("ambos")}
                    className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-center transition-all ${
                      tipoContato === "ambos"
                        ? "border-purple-500 bg-purple-50 text-purple-900 font-bold shadow-xs ring-1 ring-purple-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Bell className="h-4 w-4 text-purple-600" />
                    <span className="text-xs">Ambos</span>
                  </button>
                </div>
              </div>

              {/* Campos de Contato */}
              <div className="flex flex-col gap-3">
                {(tipoContato === "whatsapp" || tipoContato === "ambos") && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Seu WhatsApp com DDD
                    </label>
                    <input
                      type="tel"
                      required={tipoContato === "whatsapp" || tipoContato === "ambos"}
                      placeholder="(62) 99999-9999 ou (65) 9..."
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {(tipoContato === "email" || tipoContato === "ambos") && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Seu E-mail
                    </label>
                    <input
                      type="email"
                      required={tipoContato === "email" || tipoContato === "ambos"}
                      placeholder="seu.email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Alertas Granulares (Conforme Página 9 do PDF) */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Frequência dos Lembretes:
                </span>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={alerta48h}
                    onChange={(e) => setAlerta48h(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Avisar <strong>48 horas antes</strong> do encerramento</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={alertaDiaFinal}
                    onChange={(e) => setAlertaDiaFinal(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Avisar no <strong>último dia (horário limite)</strong></span>
                </label>

                {processo.temIsencao && (
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={alertaIsencao}
                      onChange={(e) => setAlertaIsencao(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Lembrete do prazo de <strong>isenção da taxa</strong></span>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md active:scale-98 transition-all"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>Confirmar e Ativar Alerta</span>
                </button>
              </div>
            </form>
          ) : (
            /* Tela de Confirmação e Sucesso */
            <div className="flex flex-col items-center text-center py-4 gap-4 animate-in fade-in">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-900">
                  Alerta Ativado com Sucesso!
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mt-1">
                  Você receberá as notificações do processo seletivo <strong>{processo.sigla}</strong> antes do encerramento das inscrições em {formatarDataBR(processo.periodoInscricaoFim)}.
                </p>
              </div>

              {/* Botão de WhatsApp direto */}
              {(tipoContato === "whatsapp" || tipoContato === "ambos") && (
                <a
                  href={linkWhatsAppConfirmacao()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar Confirmação no WhatsApp</span>
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-6 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors mt-2"
              >
                Concluído
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
