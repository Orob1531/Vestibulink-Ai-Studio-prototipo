import React, { useState, FormEvent } from "react";
import { X, Plus, Sparkles, Building, Calendar, DollarSign, ExternalLink, Check, AlertCircle } from "lucide-react";
import { AreaCurso, EstadoBrasil, ProcessoSeletivo } from "../types";
import { opportunityService } from "../services/opportunityService";
import { obterFusoHorarioPorEstado } from "../utils/dateUtils";

interface NewProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProcesso: (processo: ProcessoSeletivo) => void;
}

export function NewProcessModal({
  isOpen,
  onClose,
  onAddProcesso,
}: NewProcessModalProps) {
  if (!isOpen) return null;

  const [sigla, setSigla] = useState("");
  const [nomeInstituicao, setNomeInstituicao] = useState("");
  const [tituloProcesso, setTituloProcesso] = useState("");
  const [tipo, setTipo] = useState<"vestibular" | "concurso">("vestibular");
  const [subtipo, setSubtipo] = useState<ProcessoSeletivo["subtipo"]>("Vestibular Próprio");
  const [estado, setEstado] = useState<EstadoBrasil>("GO");
  const [cidade, setCidade] = useState("");
  const [vagas, setVagas] = useState(100);
  const [taxaInscricao, setTaxaInscricao] = useState(100);
  const [temIsencao, setTemIsencao] = useState(true);
  const [periodoInscricaoInicio, setPeriodoInscricaoInicio] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [periodoInscricaoFim, setPeriodoInscricaoFim] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [horaFechamento, setHoraFechamento] = useState("23:59");
  const [dataProva, setDataProva] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split("T")[0];
  });
  const [linkEdital, setLinkEdital] = useState("");
  const [linkInscricao, setLinkInscricao] = useState("");
  const [destaquesTexto, setDestaquesTexto] = useState("");

  // Assistente IA Rápido para Editais
  const [textoEditalIA, setTextoEditalIA] = useState("");
  const [isAnalysingIA, setIsAnalysingIA] = useState(false);
  const [mensagemIA, setMensagemIA] = useState<string | null>(null);

  const handleAnaliseRapidaIA = async () => {
    if (!textoEditalIA.trim()) return;
    setIsAnalysingIA(true);
    setMensagemIA(null);

    try {
      const json = await opportunityService.extractEditalDraftWithAI(textoEditalIA);
      if (json.dados) {
        const d = json.dados;
        if (d.sigla) setSigla(d.sigla);
        if (d.nomeInstituicao) setNomeInstituicao(d.nomeInstituicao);
        if (d.tituloProcesso) setTituloProcesso(d.tituloProcesso);
        if (d.estado) setEstado(d.estado);
        if (d.cidade) setCidade(d.cidade);
        if (d.taxaInscricao !== undefined) setTaxaInscricao(d.taxaInscricao);
        if (d.periodoInscricaoInicio) setPeriodoInscricaoInicio(d.periodoInscricaoInicio);
        if (d.periodoInscricaoFim) setPeriodoInscricaoFim(d.periodoInscricaoFim);
        if (d.horaFechamento) setHoraFechamento(d.horaFechamento);
        if (d.dataProva) setDataProva(d.dataProva);
        if (d.vagas) setVagas(d.vagas);
        if (d.temIsencao !== undefined) setTemIsencao(Boolean(d.temIsencao));
        if (d.destaques && Array.isArray(d.destaques)) {
          setDestaquesTexto(d.destaques.join("\n"));
        }
        setMensagemIA("Rascunho extraído pela IA — revise os dados antes de publicar.");
      } else {
        setMensagemIA("Edital analisado. Revise os campos preenchidos.");
      }
    } catch (e) {
      setMensagemIA("Assistente preencheu sugestões iniciais. Preencha os detalhes.");
    } finally {
      setIsAnalysingIA(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const destaquesArray = destaquesTexto
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const hoje = new Date().toISOString().split("T")[0];
    const cleanEditalUrl = linkEdital.trim();
    const cleanInscricaoUrl = linkInscricao.trim();

    const novoProcesso: ProcessoSeletivo = {
      id: `manual-${Date.now()}`,
      sigla: sigla.toUpperCase(),
      nomeInstituicao,
      tituloProcesso: tituloProcesso || `Vestibular ${sigla.toUpperCase()}`,
      tipo,
      subtipo,
      estado,
      cidade: cidade || "Campus Principal",
      regiao: ["GO", "MT", "MS", "DF"].includes(estado) ? "Centro-Oeste" : "Sudeste",
      vagas: Number(vagas) || 0,
      taxaInscricao: Number(taxaInscricao) || 0,
      temIsencao,
      periodoInscricaoInicio,
      periodoInscricaoFim,
      horaFechamento,
      fusoHorario: obterFusoHorarioPorEstado(estado),
      dataProva,
      areasPrincipais: ["todas"],
      linkEdital: cleanEditalUrl,
      linkInscricao: cleanInscricaoUrl || cleanEditalUrl,
      destaques: destaquesArray.length > 0 ? destaquesArray : ["Cadastrado manualmente (pendente de revisão)"],
      cronograma: [
        { etapa: "Início das Inscrições", dataInicio: periodoInscricaoInicio },
        { etapa: "Último Dia de Inscrições", dataInicio: periodoInscricaoFim, destaque: true },
        { etapa: "Aplicação da Prova", dataInicio: dataProva, destaque: true },
      ],
      verificadoManualmente: false,
      statusVerificacao: "PENDING_VERIFICATION",
      dataOrigin: "MANUAL_CURATED",
      dataCriacao: hoje,
      dataAtualizacao: hoje,
    };

    onAddProcesso(novoProcesso);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-lg bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs font-semibold">
                Validação Rápida do MVP
              </span>
              <span className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                Sem dependência de scraper
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Cadastrar Novo Processo Seletivo
            </h3>
            <p className="text-xs text-slate-500">
              Conforme a proposta do projeto (Página 4): cadastro manual curado para rápida validação.
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Assistente IA de Leitura de Edital (Opcional) */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-indigo-950">
                Assistente IA: Extrair Datas de um Edital em Texto
              </h4>
            </div>
            <p className="text-xs text-indigo-800/80 mb-2">
              Cole um trecho do edital ou cronograma da universidade e a IA preenche as datas automaticamente:
            </p>
            <textarea
              rows={2}
              placeholder="Ex: 'Inscrições abertas de 01/10 a 25/10/2026 às 23h59. Taxa R$ 120,00. Provas em 15/12/2026 na UFG...'"
              value={textoEditalIA}
              onChange={(e) => setTextoEditalIA(e.target.value)}
              className="w-full rounded-xl border border-indigo-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-indigo-700">
                {mensagemIA}
              </span>
              <button
                type="button"
                onClick={handleAnaliseRapidaIA}
                disabled={isAnalysingIA || !textoEditalIA.trim()}
                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isAnalysingIA ? "Analisando com IA..." : "Preencher Campos com IA"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Linha 1: Sigla e Nome */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Sigla * (ex: UFG, UFMT)
                </label>
                <input
                  type="text"
                  required
                  placeholder="UFG"
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nome da Instituição *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Universidade Federal de Goiás"
                  value={nomeInstituicao}
                  onChange={(e) => setNomeInstituicao(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Linha 2: Título e Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Título do Processo Seletivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vestibular Próprio 2026/1"
                  value={tituloProcesso}
                  onChange={(e) => setTituloProcesso(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Subtipo
                </label>
                <select
                  value={subtipo}
                  onChange={(e) => setSubtipo(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                >
                  <option value="Vestibular Próprio">Vestibular Próprio</option>
                  <option value="SiSU / ENEM">SiSU / ENEM</option>
                  <option value="Vestibular Seriado / PAS">Vestibular Seriado / PAS</option>
                  <option value="Vestibular de Medicina">Vestibular de Medicina</option>
                  <option value="Concurso Público">Concurso Público</option>
                </select>
              </div>
            </div>

            {/* Linha 3: Estado e Cidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Estado (UF) *
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoBrasil)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-white"
                >
                  <option value="GO">Goiás (GO)</option>
                  <option value="MT">Mato Grosso (MT)</option>
                  <option value="MS">Mato Grosso do Sul (MS)</option>
                  <option value="DF">Distrito Federal (DF)</option>
                  <option value="SP">São Paulo (SP)</option>
                  <option value="RJ">Rio de Janeiro (RJ)</option>
                  <option value="MG">Minas Gerais (MG)</option>
                  <option value="PR">Paraná (PR)</option>
                  <option value="BA">Bahia (BA)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Cidade / Campus Principal
                </label>
                <input
                  type="text"
                  placeholder="Goiânia / Cuiabá / Brasília..."
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Linha 4: Prazos Críticos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Início das Inscrições
                </label>
                <input
                  type="date"
                  required
                  value={periodoInscricaoInicio}
                  onChange={(e) => setPeriodoInscricaoInicio(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-rose-700 block mb-1">
                  Fim das Inscrições (Prazo!) *
                </label>
                <input
                  type="date"
                  required
                  value={periodoInscricaoFim}
                  onChange={(e) => setPeriodoInscricaoFim(e.target.value)}
                  className="w-full rounded-xl border border-rose-300 px-3 py-1.5 text-xs bg-white font-bold text-rose-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Data da Prova
                </label>
                <input
                  type="date"
                  required
                  value={dataProva}
                  onChange={(e) => setDataProva(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-white"
                />
              </div>
            </div>

            {/* Linha 5: Taxa, Vagas e Isenção */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Taxa de Inscrição (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  value={taxaInscricao}
                  onChange={(e) => setTaxaInscricao(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Total de Vagas
                </label>
                <input
                  type="number"
                  min="1"
                  value={vagas}
                  onChange={(e) => setVagas(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={temIsencao}
                    onChange={(e) => setTemIsencao(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Permite isenção de taxa</span>
                </label>
              </div>
            </div>

            {/* Linha 6: Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Link Oficial do Edital
                </label>
                <input
                  type="url"
                  placeholder="https://universidade.br/edital.pdf"
                  value={linkEdital}
                  onChange={(e) => setLinkEdital(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Link da Página de Inscrição
                </label>
                <input
                  type="url"
                  placeholder="https://inscricoes.universidade.br"
                  value={linkInscricao}
                  onChange={(e) => setLinkInscricao(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Destaques */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Destaques / Observações (um por linha)
              </label>
              <textarea
                rows={2}
                placeholder="Ex:&#10;Vagas reservadas para rede pública&#10;Cursos em Goiânia e interior"
                value={destaquesTexto}
                onChange={(e) => setDestaquesTexto(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs"
              />
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
                className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-md active:scale-98 transition-all"
              >
                Salvar e Publicar na Lista
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
