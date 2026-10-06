import { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { OnboardingFilter } from "./components/OnboardingFilter";
import { VestibularCard } from "./components/VestibularCard";
import { VestibularDetailModal } from "./components/VestibularDetailModal";
import { AlertModal } from "./components/AlertModal";
import { MyAlertsModal } from "./components/MyAlertsModal";
import { NewProcessModal } from "./components/NewProcessModal";
import { ProjectProposalModal } from "./components/ProjectProposalModal";
import { SchoolPartnershipModal } from "./components/SchoolPartnershipModal";
import { INITIAL_PROCESSOS } from "./data/initialVestibulares";
import {
  AlertaUsuario,
  AreaCurso,
  EstadoBrasil,
  ProcessoSeletivo,
  TipoProcesso,
  UserPreferences,
} from "./types";
import { calcularStatus } from "./utils/dateUtils";
import {
  AlertTriangle,
  Sparkles,
  TrendingUp,
  School,
  FileText,
  Clock,
  CheckCircle2,
  Filter,
} from "lucide-react";

const STORAGE_PROCESSOS_KEY = "vestibulink_processos_v1";
const STORAGE_ALERTAS_KEY = "vestibulink_alertas_v1";
const STORAGE_PREFS_KEY = "vestibulink_preferences_v1";

export default function App() {
  // Lista de Processos Seletivos (com persistência de novos cadastros manuais)
  const [processos, setProcessos] = useState<ProcessoSeletivo[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_PROCESSOS_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Erro ao ler processos do storage:", e);
    }
    return INITIAL_PROCESSOS;
  });

  // Alertas do Usuário
  const [alertas, setAlertas] = useState<AlertaUsuario[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_ALERTAS_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Erro ao ler alertas do storage:", e);
    }
    return [];
  });

  // Preferências do Usuário (Onboarding)
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_PREFS_KEY);
      if (salvo) {
        return JSON.parse(salvo);
      }
    } catch (e) {
      console.warn("Erro ao ler preferencias:", e);
    }
    return {
      estadoSelecionado: "TODOS",
      areaSelecionada: "todas",
      tipoSelecionado: "vestibular", // Foco 100% vestibular no início
      apenasComIsencao: false,
      apenasGratis: false,
      faseLançamento: 1, // Fase 1: Centro-Oeste
    };
  });

  // Busca livre por texto
  const [searchTerm, setSearchTerm] = useState("");
  const [apenasRetaFinal, setApenasRetaFinal] = useState(false);

  // Modais
  const [selectedProcessoDetail, setSelectedProcessoDetail] = useState<ProcessoSeletivo | null>(null);
  const [selectedProcessoAlert, setSelectedProcessoAlert] = useState<ProcessoSeletivo | null>(null);
  const [isAlertasModalOpen, setIsAlertasModalOpen] = useState(false);
  const [isNewProcessModalOpen, setIsNewProcessModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);

  // Sincronizar storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ALERTAS_KEY, JSON.stringify(alertas));
    } catch (e) {}
  }, [alertas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(preferences));
    } catch (e) {}
  }, [preferences]);

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updated }));
  };

  const handleChangeFase = (fase: 1 | 2 | 3) => {
    if (fase === 1) {
      setPreferences((prev) => ({
        ...prev,
        faseLançamento: 1,
        tipoSelecionado: "vestibular",
        estadoSelecionado: "TODOS",
      }));
    } else if (fase === 2) {
      setPreferences((prev) => ({
        ...prev,
        faseLançamento: 2,
        tipoSelecionado: "vestibular",
        estadoSelecionado: "TODOS",
      }));
    } else {
      setPreferences((prev) => ({
        ...prev,
        faseLançamento: 3,
        tipoSelecionado: "todos",
        estadoSelecionado: "TODOS",
      }));
    }
  };

  const handleSaveAlerta = (novoAlerta: AlertaUsuario) => {
    setAlertas((prev) => {
      const filtered = prev.filter((a) => a.processoId !== novoAlerta.processoId);
      return [novoAlerta, ...filtered];
    });
  };

  const handleRemoveAlerta = (alertaId: string) => {
    setAlertas((prev) => prev.filter((a) => a.id !== alertaId));
  };

  const handleAddProcesso = (novoProcesso: ProcessoSeletivo) => {
    setProcessos((prev) => {
      const atualizados = [novoProcesso, ...prev];
      try {
        localStorage.setItem(STORAGE_PROCESSOS_KEY, JSON.stringify(atualizados));
      } catch (e) {}
      return atualizados;
    });
  };

  // Filtragem e Ordenação: PRAZO MAIS PRÓXIMO PRIMEIRO (conforme PDF página 4)
  const processosFiltrados = useMemo(() => {
    return processos
      .filter((proc) => {
        // Filtro de Fase de Lançamento
        if (preferences.faseLançamento === 1) {
          // Fase 1: Centro-Oeste
          if (proc.regiao !== "Centro-Oeste") return false;
          if (proc.tipo !== "vestibular") return false;
        } else if (preferences.faseLançamento === 2) {
          // Fase 2: Resto do Brasil (Apenas vestibulares)
          if (proc.tipo !== "vestibular") return false;
        }
        // Fase 3: Concursos e vestibulares

        // Filtro de Estado
        if (
          preferences.estadoSelecionado !== "TODOS" &&
          proc.estado !== preferences.estadoSelecionado
        ) {
          return false;
        }

        // Filtro de Tipo
        if (preferences.tipoSelecionado !== "todos" && proc.tipo !== preferences.tipoSelecionado) {
          return false;
        }

        // Filtro de Área
        if (
          preferences.areaSelecionada !== "todas" &&
          !proc.areasPrincipais.includes("todas") &&
          !proc.areasPrincipais.includes(preferences.areaSelecionada)
        ) {
          return false;
        }

        // Filtro de Isenção
        if (preferences.apenasComIsencao && !proc.temIsencao) {
          return false;
        }

        // Filtro de Gratuito
        if (preferences.apenasGratis && proc.taxaInscricao > 0) {
          return false;
        }

        // Filtro de Reta Final
        const { status } = calcularStatus(proc);
        if (apenasRetaFinal && status !== "reta-final" && status !== "fecha-hoje") {
          return false;
        }

        // Busca livre
        if (searchTerm.trim()) {
          const termo = searchTerm.toLowerCase();
          const matchSigla = proc.sigla.toLowerCase().includes(termo);
          const matchNome = proc.nomeInstituicao.toLowerCase().includes(termo);
          const matchTitulo = proc.tituloProcesso.toLowerCase().includes(termo);
          const matchCidade = proc.cidade.toLowerCase().includes(termo);
          const matchEstado = proc.estado.toLowerCase().includes(termo);
          if (!matchSigla && !matchNome && !matchTitulo && !matchCidade && !matchEstado) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Ordenação estrita por prazo final mais próximo primeiro
        const timeA = new Date(`${a.periodoInscricaoFim}T23:59:59`).getTime();
        const timeB = new Date(`${b.periodoInscricaoFim}T23:59:59`).getTime();
        return timeA - timeB;
      });
  }, [processos, preferences, searchTerm, apenasRetaFinal]);

  // Contagem de processos em reta final
  const totalRetaFinal = useMemo(() => {
    return processos.filter((p) => {
      const { status } = calcularStatus(p);
      return status === "reta-final" || status === "fecha-hoje";
    }).length;
  }, [processos]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Topo do Vestibulink */}
      <Header
        preferences={preferences}
        onChangeFase={handleChangeFase}
        alertasCount={alertas.length}
        onOpenAlertasList={() => setIsAlertasModalOpen(true)}
        onOpenNewProcessModal={() => setIsNewProcessModalOpen(true)}
        onOpenProposalModal={() => setIsProposalModalOpen(true)}
        onOpenSchoolModal={() => setIsSchoolModalOpen(true)}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Banner de Dados Estratégicos do Mercado (Página 10 do PDF) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Censo Escolar 2025
              </span>
              <p className="text-sm font-extrabold text-slate-900">
                584.699 matrículas E.M.
              </p>
              <span className="text-[11px] text-slate-500">
                Centro-Oeste (rede pública e privada)
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 font-bold shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Validação da Fase 1
              </span>
              <p className="text-sm font-extrabold text-slate-900">
                ~195 mil concluintes/ano
              </p>
              <span className="text-[11px] text-slate-500">
                Suficiente pra validar com rapidez
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 flex items-center gap-3.5 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Destaque UFG Retomada
              </span>
              <p className="text-sm font-extrabold text-slate-900">
                2.209 vagas diretas
              </p>
              <span className="text-[11px] text-slate-500">
                Vestibular próprio após 11 anos
              </span>
            </div>
          </div>
        </div>

        {/* 1. Onboarding e Filtros (Página 4 do PDF) */}
        <OnboardingFilter
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalResultados={processosFiltrados.length}
          totalRetaFinal={totalRetaFinal}
          apenasRetaFinal={apenasRetaFinal}
          onToggleApenasRetaFinal={() => setApenasRetaFinal(!apenasRetaFinal)}
        />

        {/* 2. Lista de Processos Seletivos (Prazo Mais Próximo Primeiro) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 font-display">
                Processos Seletivos Abertos
              </h2>
              <span className="rounded-md bg-slate-200 text-slate-700 text-[11px] font-bold px-2 py-0.5">
                Prazo mais próximo primeiro
              </span>
            </div>

            <span className="text-xs text-slate-400">
              {processosFiltrados.length} {processosFiltrados.length === 1 ? "edital listado" : "editais listados"}
            </span>
          </div>

          {processosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Filter className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Nenhum processo encontrado com esses filtros
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                Tente selecionar outro estado ou área de interesse, ou limpe o termo de busca.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setApenasRetaFinal(false);
                  setPreferences((p) => ({
                    ...p,
                    estadoSelecionado: "TODOS",
                    areaSelecionada: "todas",
                    apenasComIsencao: false,
                    apenasGratis: false,
                  }));
                }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processosFiltrados.map((processo) => {
                const hasActiveAlert = alertas.some((a) => a.processoId === processo.id);
                return (
                  <VestibularCard
                    key={processo.id}
                    processo={processo}
                    onOpenDetail={(proc) => setSelectedProcessoDetail(proc)}
                    onOpenAlert={(proc) => setSelectedProcessoAlert(proc)}
                    hasActiveAlert={hasActiveAlert}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Footer com citação do projeto */}
        <footer className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">VESTIBULINK</span>
            <span>•</span>
            <span>Nunca perca um prazo de vestibular</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setIsProposalModalOpen(true)}
              className="text-indigo-600 hover:underline"
            >
              Compilado do Projeto (PDF)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsSchoolModalOpen(true)}
              className="text-indigo-600 hover:underline"
            >
              Parceria com Escolas
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsNewProcessModalOpen(true)}
              className="text-indigo-600 hover:underline"
            >
              Cadastrar Edital
            </button>
          </div>
        </footer>
      </main>

      {/* 3. Modal de Detalhes do Processo (Datas, Taxa, Edital, Botão de Alerta) */}
      <VestibularDetailModal
        processo={selectedProcessoDetail}
        isOpen={Boolean(selectedProcessoDetail)}
        onClose={() => setSelectedProcessoDetail(null)}
        onOpenAlert={(proc) => setSelectedProcessoAlert(proc)}
        hasActiveAlert={
          selectedProcessoDetail
            ? alertas.some((a) => a.processoId === selectedProcessoDetail.id)
            : false
        }
      />

      {/* 4. Modal de Alerta Automático (Diferencial Original do Produto: WhatsApp/E-mail) */}
      <AlertModal
        processo={selectedProcessoAlert}
        isOpen={Boolean(selectedProcessoAlert)}
        onClose={() => setSelectedProcessoAlert(null)}
        onSaveAlert={handleSaveAlerta}
        existingAlert={
          selectedProcessoAlert
            ? alertas.find((a) => a.processoId === selectedProcessoAlert.id)
            : undefined
        }
      />

      {/* Central de Alertas Cadastrados */}
      <MyAlertsModal
        isOpen={isAlertasModalOpen}
        onClose={() => setIsAlertasModalOpen(false)}
        alertas={alertas}
        processos={processos}
        onRemoveAlerta={handleRemoveAlerta}
        onOpenProcessoDetail={(proc) => setSelectedProcessoDetail(proc)}
      />

      {/* Modal de Cadastro Manual (Decisão-chave: validação rápida sem scraper) */}
      <NewProcessModal
        isOpen={isNewProcessModalOpen}
        onClose={() => setIsNewProcessModalOpen(false)}
        onAddProcesso={handleAddProcesso}
      />

      {/* Modal de Apresentação da Proposta do PDF (Slides completos da proposta) */}
      <ProjectProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
      />

      {/* Modal de Parceria com Escolas de Ensino Médio de MT e GO */}
      <SchoolPartnershipModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
      />
    </div>
  );
}
