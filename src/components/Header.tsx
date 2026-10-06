import { Bell, Plus, FileText, School, ChevronRight } from "lucide-react";
import { UserPreferences } from "../types";

interface HeaderProps {
  preferences: UserPreferences;
  onChangeFase: (fase: 1 | 2 | 3) => void;
  alertasCount: number;
  onOpenAlertasList: () => void;
  onOpenNewProcessModal: () => void;
  onOpenProposalModal: () => void;
  onOpenSchoolModal: () => void;
}

export function Header({
  preferences,
  onChangeFase,
  alertasCount,
  onOpenAlertasList,
  onOpenNewProcessModal,
  onOpenProposalModal,
  onOpenSchoolModal,
}: HeaderProps) {
  return (
    <header className="w-full bg-[#172554] text-white border-b border-indigo-950 shadow-md">
      {/* Barra superior de status de lançamento */}
      <div className="bg-[#0f172a] px-4 py-1.5 text-[11px] border-b border-slate-800 text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Fase 1 em Operação:</span>
            <span className="text-slate-400">Validação focada no Centro-Oeste (~195 mil concluintes de E.M.)</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={onOpenSchoolModal}
              className="flex items-center gap-1 text-indigo-300 hover:text-white transition-colors"
            >
              <School className="h-3 w-3" />
              <span>Canal de Escolas (MT / GO)</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={onOpenProposalModal}
              className="flex items-center gap-1 text-amber-300 hover:text-white transition-colors"
            >
              <FileText className="h-3 w-3" />
              <span>Ver Compilado do Projeto (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Slogan */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-display">
                VESTIBULINK
              </span>
              <span className="rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 text-[10px] font-medium tracking-wide">
                nome provisório — a confirmar
              </span>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-300 mt-0.5">
            Nunca perca um prazo de vestibular
          </p>

          {/* Trilha do Projeto: Centro-Oeste -> Brasil -> Concursos Públicos */}
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onChangeFase(1)}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                preferences.faseLançamento === 1
                  ? "bg-rose-500 text-white shadow-xs"
                  : "bg-slate-800/80 text-slate-300 hover:text-white"
              }`}
            >
              Centro-Oeste
            </button>
            <ChevronRight className="h-3 w-3 text-slate-500" />
            <button
              type="button"
              onClick={() => onChangeFase(2)}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                preferences.faseLançamento === 2
                  ? "bg-rose-500 text-white shadow-xs"
                  : "bg-slate-800/80 text-slate-300 hover:text-white"
              }`}
            >
              Brasil
            </button>
            <ChevronRight className="h-3 w-3 text-slate-500" />
            <button
              type="button"
              onClick={() => onChangeFase(3)}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                preferences.faseLançamento === 3
                  ? "bg-rose-500 text-white shadow-xs"
                  : "bg-slate-800/80 text-slate-300 hover:text-white"
              }`}
            >
              Concursos Públicos
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Cadastrar Manualmente (Decisão-chave MVP) */}
          <button
            id="header-btn-cadastrar-edital"
            type="button"
            onClick={onOpenNewProcessModal}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-600/30 hover:bg-indigo-600/50 px-3.5 py-2 text-xs font-bold text-white transition-all active:scale-98 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 text-rose-300" />
            <span>+ Cadastrar Edital</span>
          </button>

          {/* Central de Alertas */}
          <button
            id="header-btn-meus-alertas"
            type="button"
            onClick={onOpenAlertasList}
            className="relative flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-all active:scale-98 shadow-md"
          >
            <Bell className="h-4 w-4" />
            <span>Meus Alertas</span>
            {alertasCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-600 text-[11px] font-black shadow-xs">
                {alertasCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
