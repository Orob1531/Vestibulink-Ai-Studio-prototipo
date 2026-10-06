import { useState } from "react";
import {
  X,
  FileText,
  Target,
  Users,
  Compass,
  TrendingUp,
  CheckCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  School,
  Building,
} from "lucide-react";

interface ProjectProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectProposalModal({
  isOpen,
  onClose,
}: ProjectProposalModalProps) {
  const [activeTab, setActiveTab] = useState<
    "resumo" | "problema" | "mvp" | "mercado" | "concorrencia" | "roadmap"
  >("resumo");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
        {/* Header do Compilado */}
        <div className="flex items-center justify-between border-b border-indigo-950 p-5 bg-[#172554] text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500 text-white font-black text-sm">
              VL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight uppercase font-display">
                  VESTIBULINK
                </h3>
                <span className="rounded-md bg-rose-500/30 text-rose-200 px-2 py-0.5 text-[10px] font-bold">
                  Compilado do Projeto (PDF)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Nunca perca um prazo de vestibular • Centro-Oeste → Brasil → Concursos Públicos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Abas de Navegação pelos Slides do PDF */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab("resumo")}
            className={`rounded-xl px-3 py-1.5 transition-all shrink-0 ${
              activeTab === "resumo"
                ? "bg-white text-indigo-950 shadow-xs border border-slate-200"
                : "hover:text-slate-900"
            }`}
          >
            Visão Geral
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("problema")}
            className={`rounded-xl px-3 py-1.5 transition-all shrink-0 ${
              activeTab === "problema"
                ? "bg-white text-indigo-950 shadow-xs border border-slate-200"
                : "hover:text-slate-900"
            }`}
          >
            Problema & Solução
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mvp")}
            className={`rounded-xl px-3 py-1.5 transition-all shrink-0 ${
              activeTab === "mvp"
                ? "bg-white text-indigo-950 shadow-xs border border-slate-200"
                : "hover:text-slate-900"
            }`}
          >
            O MVP & Diferencial
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mercado")}
            className={`rounded-xl px-3 py-1.5 transition-all shrink-0 ${
              activeTab === "mercado"
                ? "bg-white text-indigo-950 shadow-xs border border-slate-200"
                : "hover:text-slate-900"
            }`}
          >
            Tamanho de Mercado
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("concorrencia")}
            className={`rounded-xl px-3 py-1.5 transition-all shrink-0 ${
              activeTab === "concorrencia"
                ? "bg-white text-indigo-950 shadow-xs border border-slate-200"
                : "hover:text-slate-900"
            }`}
          >
            Concorrência
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("roadmap")}
            className={`rounded-xl px-3 py-1.5 transition-all shrink-0 ${
              activeTab === "roadmap"
                ? "bg-white text-indigo-950 shadow-xs border border-slate-200"
                : "hover:text-slate-900"
            }`}
          >
            Roadmap & Monetização
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-800">
          {activeTab === "resumo" && (
            <div className="flex flex-col gap-5 animate-in fade-in">
              <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-5">
                <h4 className="text-base font-extrabold text-indigo-950 mb-1">
                  Apresentação da Proposta — VESTIBULINK
                </h4>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  "Bora tirar do papel. Validar a dor primeiro. Depois, construir." O Vestibulink foi desenhado como o agregador central definitivo para que nenhum vestibulando perca prazos de inscrição, isenção ou aplicação de provas.
                </p>
              </div>

              {/* Fases de Lançamento (Página 5 e 6 do PDF) */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Fases Estratégicas de Lançamento
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border-2 border-rose-400 bg-rose-50/40 p-4 relative">
                    <span className="rounded-md bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 uppercase block w-fit mb-2">
                      FASE 1 (Em Operação)
                    </span>
                    <h6 className="font-extrabold text-slate-900 text-sm">Centro-Oeste</h6>
                    <p className="text-xs text-slate-600 mt-1">
                      Só vestibulares. Validação manual curada, sem scraper, gerando alertas de alta confiabilidade.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                    <span className="rounded-md bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 uppercase block w-fit mb-2">
                      FASE 2
                    </span>
                    <h6 className="font-extrabold text-slate-900 text-sm">Resto do Brasil</h6>
                    <p className="text-xs text-slate-600 mt-1">
                      Expansão geográfica gradual (Sudeste, Sul, Nordeste, Norte), ainda focado exclusivamente em vestibulares.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                    <span className="rounded-md bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 uppercase block w-fit mb-2">
                      FASE 3
                    </span>
                    <h6 className="font-extrabold text-slate-900 text-sm">Concursos Públicos</h6>
                    <p className="text-xs text-slate-600 mt-1">
                      Inclusão da nova categoria de oportunidade para graduados e concluintes que buscam estabilidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "problema" && (
            <div className="flex flex-col gap-5 animate-in fade-in">
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                  O Problema (Página 2 do PDF)
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mb-2">
                  O estudante perde prazo de inscrição em vestibular
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  A informação está espalhada em dezenas de sites de universidades diferentes, sem padrão nenhum entre eles — datas, taxas e editais cada um de um jeito e em formatos confusos.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  A Solução (Página 3 do PDF)
                </span>
                <h4 className="text-base font-extrabold text-slate-900 mb-2">
                  Um agregador unificado filtrado pelo que importa
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                  Reúne, num lugar só, tudo o que o vestibulando precisa acompanhar — filtrado por <strong>Estado</strong> (onde vai prestar), <strong>Curso</strong> (área de interesse) e <strong>Tipo</strong>.
                </p>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs font-bold text-emerald-950">
                  🎯 O Diferencial Original: Alerta automático quando uma inscrição está perto de fechar (no WhatsApp e e-mail).
                </div>
              </div>
            </div>
          )}

          {activeTab === "mvp" && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">
                  Decisão-Chave do Projeto (Página 4 do PDF)
                </span>
                <p className="text-xs text-amber-950 font-bold">
                  "Sem scraper automático no início. Cadastro manual dos processos seletivos — valida rápido antes de resolver o problema difícil."
                </p>
              </div>

              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Os 4 Passos do Fluxo do Usuário:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-extrabold text-indigo-700 block mb-1">1. Onboarding</span>
                  <p className="text-slate-600">Estado, curso e tipo de interesse selecionados de imediato.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-extrabold text-indigo-700 block mb-1">2. Lista Inteligente</span>
                  <p className="text-slate-600">Processos abertos ordenados com <strong>prazo mais próximo primeiro</strong>.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-extrabold text-indigo-700 block mb-1">3. Detalhe Completo</span>
                  <p className="text-slate-600">Datas cruciais, taxa, regras de isenção, link do edital e calendário.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-extrabold text-rose-600 block mb-1">4. Alerta Automático</span>
                  <p className="text-slate-600">Aviso pontual no WhatsApp perto do prazo fechar (48h e dia final).</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "mercado" && (
            <div className="flex flex-col gap-5 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-indigo-50 p-4 border border-indigo-100 text-center">
                  <span className="text-2xl sm:text-3xl font-black text-indigo-950 block">
                    584.699
                  </span>
                  <span className="text-xs text-indigo-800 font-semibold block mt-1">
                    Matrículas no ensino médio do Centro-Oeste (Censo Escolar 2025)
                  </span>
                </div>

                <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100 text-center">
                  <span className="text-2xl sm:text-3xl font-black text-rose-900 block">
                    ~195 mil
                  </span>
                  <span className="text-xs text-rose-800 font-semibold block mt-1">
                    Estimativa de concluintes por ano no Centro-Oeste
                  </span>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-center">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-950 block">
                    2.209
                  </span>
                  <span className="text-xs text-emerald-800 font-semibold block mt-1">
                    Vagas só no vestibular próprio da UFG (retomado após 11 anos)
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <strong>Análise Estratégica:</strong> "Mercado do Centro-Oeste: estimativa de ~195 mil concluintes de ensino médio/ano — suficiente pra validar, pequeno demais pra ser destino final."
              </div>
            </div>
          )}

          {activeTab === "concorrencia" && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Concorrência Direta & Indireta (Páginas 7 e 8 do PDF)
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h6 className="font-bold text-slate-900">Alerta Editais</h6>
                  <p className="text-slate-500 mt-1">
                    Já cobre UFMT e UNEMAT. Cobram de R$49 a R$200/mês. Operação pequena, sem time visível e dados desatualizados.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h6 className="font-bold text-slate-900">Estratégia Vestibulares + estuda.com</h6>
                  <p className="text-slate-500 mt-1">
                    Conteúdo editorial forte, cobre UFG e principais do país, mas monetiza empurrando cursinho pago.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h6 className="font-bold text-slate-900">PCI Concursos</h6>
                  <p className="text-slate-500 mt-1">
                    Domina concursos há 15+ anos com 100+ concursos abertos, porém interface antiga e sem foco em vestibulando.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 bg-amber-50/50">
                  <h6 className="font-bold text-slate-900">Quero Bolsa / Quero Educação (Gigante)</h6>
                  <p className="text-slate-500 mt-1">
                    +60M visitantes/ano, foco em bolsas particulares sem vestibular. Potencial risco futuro se enxergarem valor.
                  </p>
                </div>
              </div>

              {/* O Diferencial Real */}
              <div className="rounded-2xl bg-indigo-900 text-white p-4 text-xs">
                <h6 className="font-bold text-amber-300 text-sm mb-1">
                  O Diferencial Real do Vestibulink (Página 9)
                </h6>
                <ul className="list-disc pl-4 space-y-1 text-slate-200">
                  <li><strong>Foco 100% vestibular:</strong> sem poluição de licitação ou concursos no início.</li>
                  <li><strong>Execução melhor:</strong> WhatsApp além de e-mail, alertas granulares de 48h e dia final.</li>
                  <li><strong>Canal de escola inexplorado:</strong> nenhum concorrente ataca aquisição via parceria com escolas de ensino médio.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "roadmap" && (
            <div className="flex flex-col gap-4 animate-in fade-in text-xs">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Roadmap de Validação (Página 12 do PDF)
              </h5>
              <div className="space-y-2">
                {[
                  { n: "01", t: "Validar a dor em grupos de vestibulando do Centro-Oeste" },
                  { n: "02", t: "Testar o alerta manualmente (grupo de WhatsApp/Telegram, 10-15 processos)" },
                  { n: "03", t: "Medir engajamento real — quem entra, quem fica, quem agradece" },
                  { n: "04", t: "Registrar domínio e colocar no ar com curadoria manual de processos" },
                  { n: "05", t: "Automatizar os alertas (WhatsApp via Zapier/Make e backend)" },
                  { n: "06", t: "Parceria com escolas de ensino médio em MT e GO" },
                ].map((item) => (
                  <div key={item.n} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500 text-white font-mono font-bold text-xs">
                      {item.n}
                    </span>
                    <span className="font-medium text-slate-800">{item.t}</span>
                  </div>
                ))}
              </div>

              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-3">
                Modelo de Monetização (Página 11)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">Início: 100% Grátis</span>
                  <span className="text-slate-500">Crescer base e validar recorrência.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">Uso validado: Afiliados</span>
                  <span className="text-slate-500">Cursinhos + B2B faculdades particulares sem custo pro estudante.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">Com volume: Freemium</span>
                  <span className="text-slate-500">Assinatura premium com recursos avançados.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Vestibulink • Compilado do projeto
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Entendido, Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
