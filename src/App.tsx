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
import {
  AlertaUsuario,
  ProcessoSeletivo,
  UserPreferences,
} from "./types";
import { opportunityRepository } from "./repositories/opportunityRepository";
import { alertRepository } from "./repositories/alertRepository";
import { preferencesRepository } from "./repositories/preferencesRepository";
import { opportunityService } from "./services/opportunityService";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Filter,
} from "lucide-react";

export default function App() {
  // Lista de Processos Seletivos (inicializa via camada de repositório e sincroniza com o backend)
  const [processos, setProcessos] = useState<ProcessoSeletivo[]>(() =>
    opportunityRepository.getInitialCached()
  );

  // Alertas do Usuário (inicializa via camada de repositório e sincroniza com a fila do backend)
  const [alertas, setAlertas] = useState<AlertaUsuario[]>(() =>
    alertRepository.getInitialCached()
  );

  // Preferências do Usuário (Onboarding)
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    preferencesRepository.getInitialCached()
  );

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

  // Sincronização inicial assíncrona com a camada de dados do backend
  useEffect(() => {
    opportunityRepository.fetchAll().then((remoteProcessos) => {
      if (remoteProcessos.length > 0) {
        setProcessos(remoteProcessos);
      }
    });
    alertRepository.fetchAll().then((remoteAlertas) => {
      setAlertas(remoteAlertas);
    });
  }, []);

  // Persistir preferências na camada de dados
  useEffect(() => {
    preferencesRepository.save(preferences);
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
    alertRepository.saveAlert(novoAlerta).then((saved) => {
      setAlertas((prev) => [
        saved,
        ...prev.filter((a) => a.processoId !== saved.processoId),
      ]);
    });
  };

  const handleRemoveAlerta = (alertaId: string) => {
    setAlertas((prev) => prev.filter((a) => a.id !== alertaId));
    alertRepository.removeAlert(alertaId);
  };

  const handleAddProcesso = (novoProcesso: ProcessoSeletivo) => {
    setProcessos((prev) => [
      novoProcesso,
      ...prev.filter((p) => p.id !== novoProcesso.id),
    ]);
    opportunityRepository.create(novoProcesso).then((saved) => {
      setProcessos((prev) => [
        saved,
        ...prev.filter((p) => p.id !== saved.id && p.id !== novoProcesso.id),
      ]);
    });
  };

  // Filtragem e Ordenação: PRAZO MAIS PRÓXIMO PRIMEIRO via camada de serviço (respeitando fuso horário)
  const processosFiltrados = useMemo(() => {
    return opportunityService.filterAndSortByDeadline(processos, {
      preferences,
      searchTerm,
      apenasRetaFinal,
    });
  }, [processos, preferences, searchTerm, apenasRetaFinal]);

  // Contagem de processos em reta final
  const totalRetaFinal = useMemo(() => {
    return opportunityService.countRetaFinal(processos);
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
