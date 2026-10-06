import { Search, MapPin, GraduationCap, Layers, Sparkles, Filter } from "lucide-react";
import { AreaCurso, EstadoBrasil, TipoProcesso, UserPreferences } from "../types";

interface OnboardingFilterProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  totalResultados: number;
  totalRetaFinal: number;
  apenasRetaFinal: boolean;
  onToggleApenasRetaFinal: () => void;
}

export function OnboardingFilter({
  preferences,
  onUpdatePreferences,
  searchTerm,
  onSearchChange,
  totalResultados,
  totalRetaFinal,
  apenasRetaFinal,
  onToggleApenasRetaFinal,
}: OnboardingFilterProps) {
  const estadosCentroOeste: { sigla: EstadoBrasil; nome: string }[] = [
    { sigla: "GO", nome: "Goiás" },
    { sigla: "MT", nome: "Mato Grosso" },
    { sigla: "MS", nome: "Mato Grosso do Sul" },
    { sigla: "DF", nome: "Distrito Federal" },
  ];

  const outrosEstados: { sigla: EstadoBrasil; nome: string }[] = [
    { sigla: "SP", nome: "São Paulo" },
    { sigla: "RJ", nome: "Rio de Janeiro" },
    { sigla: "MG", nome: "Minas Gerais" },
    { sigla: "PR", nome: "Paraná" },
    { sigla: "BA", nome: "Bahia" },
  ];

  const areas: { id: AreaCurso; label: string }[] = [
    { id: "todas", label: "Todas as Áreas" },
    { id: "medicina", label: "Medicina" },
    { id: "direito", label: "Direito" },
    { id: "engenharias", label: "Engenharias" },
    { id: "tecnologia", label: "Tecnologia / TI" },
    { id: "saude", label: "Saúde / Bio" },
    { id: "humanas", label: "Humanas / Licenciatura" },
    { id: "negocios", label: "Negócios / Gestão" },
  ];

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Banner Motivacional do MVP (Conforme PDF) */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 font-display">
                O agregador que reúne tudo o que o vestibulando precisa
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              A informação não está mais espalhada em dezenas de sites. Acompanhe datas, taxas e editais padronizados, com alerta automático no seu WhatsApp antes do prazo fechar.
            </p>
          </div>

          {/* Destaque de Reta Final */}
          {totalRetaFinal > 0 && (
            <button
              type="button"
              onClick={onToggleApenasRetaFinal}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                apenasRetaFinal
                  ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-300"
                  : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
              }`}
            >
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>{totalRetaFinal} processos na Reta Final (menos de 48h)!</span>
            </button>
          )}
        </div>

        {/* 1. Onboarding de Filtros (Estado, Curso, Tipo) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Filtro: Estado */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span>Estado (Onde você vai prestar)</span>
            </label>
            <select
              id="filtro-estado-select"
              value={preferences.estadoSelecionado}
              onChange={(e) =>
                onUpdatePreferences({ estadoSelecionado: e.target.value as EstadoBrasil })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
            >
              <option value="TODOS">Todos os Estados</option>
              <optgroup label="Foco Centro-Oeste (Fase 1)">
                {estadosCentroOeste.map((est) => (
                  <option key={est.sigla} value={est.sigla}>
                    {est.nome} ({est.sigla})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Expansão Brasil (Fase 2)">
                {outrosEstados.map((est) => (
                  <option key={est.sigla} value={est.sigla}>
                    {est.nome} ({est.sigla})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Filtro: Curso / Área */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
              <span>Curso ou Área de Interesse</span>
            </label>
            <select
              id="filtro-area-select"
              value={preferences.areaSelecionada}
              onChange={(e) =>
                onUpdatePreferences({ areaSelecionada: e.target.value as AreaCurso })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
            >
              {areas.map((ar) => (
                <option key={ar.id} value={ar.id}>
                  {ar.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Tipo (Vestibular vs Concurso) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>Tipo de Oportunidade</span>
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => onUpdatePreferences({ tipoSelecionado: "vestibular" })}
                className={`flex-1 rounded-lg py-1.5 font-bold transition-all text-center ${
                  preferences.tipoSelecionado === "vestibular"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Só Vestibulares
              </button>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ tipoSelecionado: "concurso" })}
                className={`flex-1 rounded-lg py-1.5 font-bold transition-all text-center ${
                  preferences.tipoSelecionado === "concurso"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Concursos
              </button>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ tipoSelecionado: "todos" })}
                className={`flex-1 rounded-lg py-1.5 font-bold transition-all text-center ${
                  preferences.tipoSelecionado === "todos"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todos
              </button>
            </div>
          </div>
        </div>

        {/* Linha de Busca e Filtros Rápidos de Isenção / Gratuidade */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Campo de Busca Livre */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por universidade, cidade ou vestibular (ex: UFG, UFMT, UnB, Medicina)..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Filtros Booleans Rápidos */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                onUpdatePreferences({ apenasComIsencao: !preferences.apenasComIsencao })
              }
              className={`rounded-xl px-3 py-1.5 font-medium border transition-colors ${
                preferences.apenasComIsencao
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              Com Isenção de Taxa
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdatePreferences({ apenasGratis: !preferences.apenasGratis })
              }
              className={`rounded-xl px-3 py-1.5 font-medium border transition-colors ${
                preferences.apenasGratis
                  ? "bg-indigo-50 border-indigo-300 text-indigo-800 font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              Inscrição Gratuita (R$ 0)
            </button>

            <span className="text-slate-400 text-xs ml-1">
              ({totalResultados} {totalResultados === 1 ? "processo" : "processos"})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
