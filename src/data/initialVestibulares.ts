import { ProcessoSeletivo } from "../types";
import { Institution, OfficialSource } from "../domain/models";
import { obterFusoHorarioPorEstado } from "../utils/dateUtils";

// Helper para gerar datas relativas dinâmicas para a demonstração e validação do MVP (SEED / DEMO DATA)
function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function subDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export const INITIAL_INSTITUTIONS: Institution[] = [
  {
    id: "inst-ufg",
    nome: "Universidade Federal de Goiás",
    sigla: "UFG",
    tipo: "UNIVERSIDADE_PUBLICA",
    estado: "GO",
    cidade: "Goiânia",
    siteOficial: "https://ufg.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-ufmt",
    nome: "Universidade Federal de Mato Grosso",
    sigla: "UFMT",
    tipo: "UNIVERSIDADE_PUBLICA",
    estado: "MT",
    cidade: "Cuiabá",
    siteOficial: "https://ufmt.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-unemat",
    nome: "Universidade do Estado de Mato Grosso",
    sigla: "UNEMAT",
    tipo: "UNIVERSIDADE_PUBLICA",
    estado: "MT",
    cidade: "Cáceres",
    siteOficial: "https://unemat.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-unb",
    nome: "Universidade de Brasília",
    sigla: "UnB",
    tipo: "UNIVERSIDADE_PUBLICA",
    estado: "DF",
    cidade: "Brasília",
    siteOficial: "https://unb.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-ufms",
    nome: "Universidade Federal de Mato Grosso do Sul",
    sigla: "UFMS",
    tipo: "UNIVERSIDADE_PUBLICA",
    estado: "MS",
    cidade: "Campo Grande",
    siteOficial: "https://ufms.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-puc-go",
    nome: "Pontifícia Universidade Católica de Goiás",
    sigla: "PUC Goiás",
    tipo: "UNIVERSIDADE_PRIVADA",
    estado: "GO",
    cidade: "Goiânia",
    siteOficial: "https://pucgoias.edu.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-ifg",
    nome: "Instituto Federal de Educação, Ciência e Tecnologia de Goiás",
    sigla: "IFG",
    tipo: "INSTITUTO_FEDERAL",
    estado: "GO",
    cidade: "Goiânia",
    siteOficial: "https://ifg.edu.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-unirv",
    nome: "Universidade de Rio Verde",
    sigla: "UniRV",
    tipo: "UNIVERSIDADE_PUBLICA",
    estado: "GO",
    cidade: "Rio Verde",
    siteOficial: "https://unirv.edu.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-usp",
    nome: "Universidade de São Paulo",
    sigla: "USP / Fuvest",
    tipo: "UNIVERSIDADE_PUBLICA",
    estado: "SP",
    cidade: "São Paulo",
    siteOficial: "https://fuvest.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-unicamp",
    nome: "Universidade Estadual de Campinas",
    sigla: "UNICAMP",
    tipo: "UNIVERSIDADE_PUBLICA",
    estado: "SP",
    cidade: "Campinas",
    siteOficial: "https://comvest.unicamp.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-tj-go",
    nome: "Tribunal de Justiça do Estado de Goiás",
    sigla: "TJ-GO",
    tipo: "ORGAO_PUBLICO",
    estado: "GO",
    cidade: "Goiânia",
    siteOficial: "https://tjgo.jus.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "inst-bb",
    nome: "Banco do Brasil S.A.",
    sigla: "Banco do Brasil",
    tipo: "ORGAO_PUBLICO",
    estado: "DF",
    cidade: "Brasília (Nacional)",
    siteOficial: "https://bb.com.br",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-12T00:00:00.000Z",
  },
];

function criarFontesPadrao(
  opportunityId: string,
  institutionId: string,
  linkEdital: string,
  linkInscricao: string,
  linkSiteOficial?: string
): OfficialSource[] {
  const fontes: OfficialSource[] = [];
  if (linkSiteOficial) {
    fontes.push({
      id: `src-web-${opportunityId}`,
      opportunityId,
      institutionId,
      url: linkSiteOficial,
      tipoFonte: "OFFICIAL_WEBSITE",
      titulo: "Portal Oficial da Instituição",
      statusVerificacao: "PENDING_VERIFICATION",
      observacoes: "Fonte base cadastrada no seed de demonstração (DEMO_SEED)",
    });
  }
  fontes.push(
    {
      id: `src-notice-${opportunityId}`,
      opportunityId,
      institutionId,
      url: linkEdital,
      tipoFonte: "NOTICE",
      titulo: "Página / Edital do Processo Seletivo",
      statusVerificacao: "PENDING_VERIFICATION",
      observacoes: "Link de referência para edital (DEMO_SEED - pendente validação de ciclo)",
    },
    {
      id: `src-reg-${opportunityId}`,
      opportunityId,
      institutionId,
      url: linkInscricao,
      tipoFonte: "REGISTRATION",
      titulo: "Página Oficial de Inscrição",
      statusVerificacao: "PENDING_VERIFICATION",
      observacoes: "Portal do candidato / inscrição (DEMO_SEED)",
    }
  );
  return fontes;
}

const RAW_SEED_PROCESSOS: ProcessoSeletivo[] = [
  {
    id: "ufg-vestibular-proprio",
    sigla: "UFG",
    nomeInstituicao: "Universidade Federal de Goiás",
    tituloProcesso: "Vestibular Próprio UFG 2026",
    tipo: "vestibular",
    subtipo: "Vestibular Próprio",
    estado: "GO",
    cidade: "Goiânia",
    regiao: "Centro-Oeste",
    vagas: 2209,
    taxaInscricao: 140,
    temIsencao: true,
    limiteIsencao: addDays(1),
    periodoInscricaoInicio: subDays(18),
    periodoInscricaoFim: addDays(2), // 🔴 Reta final! Faltam 2 dias
    horaFechamento: "23:59",
    dataProva: addDays(35),
    areasPrincipais: ["todas", "medicina", "direito", "engenharias", "tecnologia", "humanas", "saude"],
    linkEdital: "https://vestibular.ufg.br",
    linkInscricao: "https://vestibular.ufg.br/inscricoes",
    destaques: [
      "Retomado após 11 anos parado",
      "2.209 vagas diretas sem depender exclusivamente do SiSU",
      "Cursos em Goiânia, Aparecida e Cidade de Goiás",
      "Isenção via CadÚnico e renda familiar"
    ],
    cronograma: [
      { etapa: "Publicação do Edital", dataInicio: subDays(30), descricao: "Edital completo com normas e pesos" },
      { etapa: "Período de Solicitação de Isenção", dataInicio: subDays(18), dataFim: addDays(1), destaque: true },
      { etapa: "Prazo Final de Inscrições", dataInicio: subDays(18), dataFim: addDays(2), destaque: true },
      { etapa: "Pagamento do Boleto Bancário", dataInicio: addDays(3), descricao: "Último dia para compensação" },
      { etapa: "Cartão de Confirmação de Inscrição", dataInicio: addDays(20), descricao: "Divulgação dos locais de prova" },
      { etapa: "Aplicação da Prova Objetiva e Redação", dataInicio: addDays(35), destaque: true },
      { etapa: "Resultado Final e Convocação", dataInicio: addDays(55) }
    ],
    notaObservacao: "Destaque do Censo Escolar 2025: grande retorno do vestibular tradicional mais aguardado de Goiás.",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  {
    id: "ufmt-vestibular-geral",
    sigla: "UFMT",
    nomeInstituicao: "Universidade Federal de Mato Grosso",
    tituloProcesso: "Processo Seletivo Específico e Tradicional UFMT",
    tipo: "vestibular",
    subtipo: "Vestibular Próprio",
    estado: "MT",
    cidade: "Cuiabá",
    regiao: "Centro-Oeste",
    vagas: 1850,
    taxaInscricao: 120,
    temIsencao: true,
    limiteIsencao: subDays(2),
    periodoInscricaoInicio: subDays(25),
    periodoInscricaoFim: addDays(1), // 🔴 Reta final! Fecha amanhã
    horaFechamento: "18:00",
    dataProva: addDays(42),
    areasPrincipais: ["todas", "medicina", "engenharias", "direito", "saude", "tecnologia"],
    linkEdital: "https://ufmt.br/ingresso",
    linkInscricao: "https://sistemas.ufmt.br/ingresso/candidato",
    destaques: [
      "Campi em Cuiabá, Várzea Grande, Rondonópolis e Sinop",
      "Vagas reservadas para escola pública de MT",
      "Encerramento das inscrições às 18h pontual"
    ],
    cronograma: [
      { etapa: "Abertura das Inscrições", dataInicio: subDays(25) },
      { etapa: "Último Dia de Inscrição", dataInicio: addDays(1), destaque: true, descricao: "Encerra às 18h (horário de Cuiabá)" },
      { etapa: "Divulgação dos Locais de Prova", dataInicio: addDays(25) },
      { etapa: "Aplicação das Provas", dataInicio: addDays(42), destaque: true },
      { etapa: "Publicação do Gabarito Oficial", dataInicio: addDays(44) }
    ],
    notaObservacao: "Alerta importante: o sistema da UFMT fecha às 18h no fuso de Cuiabá.",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  {
    id: "unemat-vestibular-tradicional",
    sigla: "UNEMAT",
    nomeInstituicao: "Universidade do Estado de Mato Grosso",
    tituloProcesso: "Vestibular UNEMAT 2026/1",
    tipo: "vestibular",
    subtipo: "Vestibular Próprio",
    estado: "MT",
    cidade: "Cáceres",
    regiao: "Centro-Oeste",
    vagas: 2420,
    taxaInscricao: 100,
    temIsencao: true,
    limiteIsencao: addDays(0), // 🟡 Isenção acaba HOJE!
    periodoInscricaoInicio: subDays(10),
    periodoInscricaoFim: addDays(6), // Faltam 6 dias
    horaFechamento: "23:59",
    dataProva: addDays(48),
    areasPrincipais: ["todas", "direito", "engenharias", "humanas", "saude"],
    linkEdital: "https://vestibular.unemat.br",
    linkInscricao: "https://portaldocandidato.unemat.br",
    destaques: [
      "13 campi por todo o interior de Mato Grosso",
      "Isenção disponível para doadores de sangue e baixa renda",
      "Excelente capilaridade para concluintes do ensino médio de MT"
    ],
    cronograma: [
      { etapa: "Início das Inscrições", dataInicio: subDays(10) },
      { etapa: "Limite para Pedido de Isenção", dataInicio: addDays(0), destaque: true, descricao: "Termina hoje às 23:59" },
      { etapa: "Encerramento das Inscrições", dataInicio: addDays(6), destaque: true },
      { etapa: "Realização da Prova Única", dataInicio: addDays(48), destaque: true }
    ],
    notaObservacao: "A UNEMAT possui forte adesão nas cidades do interior de Mato Grosso.",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  {
    id: "unb-pas-vestibular",
    sigla: "UnB",
    nomeInstituicao: "Universidade de Brasília",
    tituloProcesso: "PAS UnB & Vestibular Tradicional",
    tipo: "vestibular",
    subtipo: "Vestibular Seriado / PAS",
    estado: "DF",
    cidade: "Brasília",
    regiao: "Centro-Oeste",
    vagas: 4250,
    taxaInscricao: 155,
    temIsencao: true,
    limiteIsencao: addDays(4),
    periodoInscricaoInicio: subDays(5),
    periodoInscricaoFim: addDays(12),
    horaFechamento: "18:00",
    dataProva: addDays(60),
    areasPrincipais: ["todas", "medicina", "direito", "engenharias", "tecnologia", "humanas", "negocios"],
    linkEdital: "https://cebraspe.org.br/vestibulares/unb",
    linkInscricao: "https://cebraspe.org.br/vestibulares/unb/inscricao",
    destaques: [
      "Avaliação Seriada (Subprograma 1, 2 e 3) e Vestibular Tradicional",
      "Banca CEBRASPE (método Certo/Errado)",
      "Campus Darcy Ribeiro (Asa Norte), Gama, Ceilândia e Planaltina"
    ],
    cronograma: [
      { etapa: "Publicação do Edital Cebraspe", dataInicio: subDays(15) },
      { etapa: "Inscrições Abertas", dataInicio: subDays(5), dataFim: addDays(12), destaque: true },
      { etapa: "Prazo para Isenção", dataInicio: subDays(5), dataFim: addDays(4) },
      { etapa: "Aplicação das Provas (Sábado e Domingo)", dataInicio: addDays(60), dataFim: addDays(61), destaque: true }
    ],
    notaObservacao: "O PAS é o principal caminho de entrada antecipada para o ensino médio no Distrito Federal.",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  {
    id: "ufms-vestibular-digital",
    sigla: "UFMS",
    nomeInstituicao: "Universidade Federal de Mato Grosso do Sul",
    tituloProcesso: "Vestibular UFMS e PASSE 2026",
    tipo: "vestibular",
    subtipo: "Vestibular Próprio",
    estado: "MS",
    cidade: "Campo Grande",
    regiao: "Centro-Oeste",
    vagas: 3100,
    taxaInscricao: 100,
    temIsencao: true,
    limiteIsencao: addDays(8),
    periodoInscricaoInicio: subDays(7),
    periodoInscricaoFim: addDays(18),
    horaFechamento: "23:59",
    dataProva: addDays(72),
    areasPrincipais: ["todas", "medicina", "direito", "engenharias", "saude", "tecnologia"],
    linkEdital: "https://ingresso.ufms.br",
    linkInscricao: "https://fapec.org/concursos",
    destaques: [
      "Opção de prova presencial ou digital",
      "Programa de Avaliação Seriada Seletiva (PASSE)",
      "Banca FAPEC"
    ],
    cronograma: [
      { etapa: "Inscrições Abertas no Portal Fapec", dataInicio: subDays(7), dataFim: addDays(18), destaque: true },
      { etapa: "Solicitação de Isenção", dataInicio: subDays(7), dataFim: addDays(8) },
      { etapa: "Dia da Prova Objetiva", dataInicio: addDays(72), destaque: true }
    ],
    notaObservacao: "Ampla concorrência e cotas integradas.",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  {
    id: "puc-goias-vestibular",
    sigla: "PUC Goiás",
    nomeInstituicao: "Pontifícia Universidade Católica de Goiás",
    tituloProcesso: "Vestibular Tradicional e Medicina PUC Goiás",
    tipo: "vestibular",
    subtipo: "Vestibular de Medicina",
    estado: "GO",
    cidade: "Goiânia",
    regiao: "Centro-Oeste",
    vagas: 1680,
    taxaInscricao: 110,
    temIsencao: false,
    periodoInscricaoInicio: subDays(14),
    periodoInscricaoFim: addDays(4), // Faltam 4 dias
    horaFechamento: "23:59",
    dataProva: addDays(21),
    areasPrincipais: ["medicina", "direito", "saude", "engenharias", "negocios"],
    linkEdital: "https://pucgoias.edu.br/vestibular",
    linkInscricao: "https://vestibular.pucgoias.edu.br/inscricoes",
    destaques: [
      "Referência em Medicina e Direito no Centro-Oeste",
      "Possibilidade de usar nota do ENEM ou prova presencial",
      "Bolsas de até 50% para concluintes do ensino médio"
    ],
    cronograma: [
      { etapa: "Abertura das Inscrições", dataInicio: subDays(14) },
      { etapa: "Último Dia para Inscrição de Medicina", dataInicio: addDays(4), destaque: true },
      { etapa: "Realização da Prova Presencial", dataInicio: addDays(21), destaque: true }
    ],
    notaObservacao: "Inscrições para o curso de Medicina costumam fechar antes dos demais cursos.",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  {
    id: "ifg-processo-seletivo",
    sigla: "IFG",
    nomeInstituicao: "Instituto Federal de Educação, Ciência e Tecnologia de Goiás",
    tituloProcesso: "Processo Seletivo Cursos Superiores IFG",
    tipo: "vestibular",
    subtipo: "Vestibular Próprio",
    estado: "GO",
    cidade: "Goiânia",
    regiao: "Centro-Oeste",
    vagas: 980,
    taxaInscricao: 0, // Gratuito!
    temIsencao: true,
    periodoInscricaoInicio: subDays(12),
    periodoInscricaoFim: addDays(9),
    horaFechamento: "23:59",
    dataProva: addDays(40),
    areasPrincipais: ["tecnologia", "engenharias", "humanas"],
    linkEdital: "https://ifg.edu.br/estude-no-ifg",
    linkInscricao: "https://selecao.ifg.edu.br",
    destaques: [
      "Inscrição 100% gratuita",
      "Cursos tecnológicos e engenharias de alto conceito MEC",
      "Campi em Goiânia, Anápolis, Formosa, Luziânia e Jataí"
    ],
    cronograma: [
      { etapa: "Período de Inscrição Gratuita", dataInicio: subDays(12), dataFim: addDays(9), destaque: true },
      { etapa: "Resultado Preliminar das Inscrições", dataInicio: addDays(15) },
      { etapa: "Prova de Redação e Seleção", dataInicio: addDays(40), destaque: true }
    ],
    notaObservacao: "Sem taxa de inscrição para nenhum candidato.",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  {
    id: "unirv-medicina-vestibular",
    sigla: "UniRV",
    nomeInstituicao: "Universidade de Rio Verde",
    tituloProcesso: "Vestibular de Medicina UniRV (Campi GO)",
    tipo: "vestibular",
    subtipo: "Vestibular de Medicina",
    estado: "GO",
    cidade: "Rio Verde",
    regiao: "Centro-Oeste",
    vagas: 420,
    taxaInscricao: 280,
    temIsencao: false,
    periodoInscricaoInicio: subDays(8),
    periodoInscricaoFim: addDays(3), // Faltam 3 dias
    horaFechamento: "23:59",
    dataProva: addDays(26),
    areasPrincipais: ["medicina", "saude"],
    linkEdital: "https://unirv.edu.br/vestibular",
    linkInscricao: "https://vestibular.unirv.edu.br",
    destaques: [
      "Maior polo de formação médica do sudoeste goiano",
      "Campi em Rio Verde, Aparecida, Goianésia, Formosa e Luziânia",
      "Provas em datas escalonadas por campus"
    ],
    cronograma: [
      { etapa: "Inscrições Online", dataInicio: subDays(8), dataFim: addDays(3), destaque: true },
      { etapa: "Cartão de Identificação", dataInicio: addDays(14) },
      { etapa: "Aplicação das Provas", dataInicio: addDays(26), destaque: true }
    ],
    notaObservacao: "Muito concorrido por estudantes de GO, MT, MG e SP.",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  // FASE 2: Expansão Nacional (Brasil)
  {
    id: "fuvest-usp",
    sigla: "USP / Fuvest",
    nomeInstituicao: "Universidade de São Paulo",
    tituloProcesso: "Vestibular FUVEST 2026",
    tipo: "vestibular",
    subtipo: "Vestibular Próprio",
    estado: "SP",
    cidade: "São Paulo",
    regiao: "Sudeste",
    vagas: 8147,
    taxaInscricao: 211,
    temIsencao: true,
    limiteIsencao: subDays(20),
    periodoInscricaoInicio: subDays(30),
    periodoInscricaoFim: addDays(5),
    horaFechamento: "12:00",
    dataProva: addDays(65),
    areasPrincipais: ["todas", "medicina", "direito", "engenharias", "tecnologia", "humanas"],
    linkEdital: "https://fuvest.br",
    linkInscricao: "https://app.fuvest.br",
    destaques: [
      "Maior universidade da América Latina",
      "1ª Fase em novembro e 2ª Fase em dezembro",
      "Opções para cotas PPI e escola pública"
    ],
    cronograma: [
      { etapa: "Prazo de Inscrições FUVEST", dataInicio: subDays(30), dataFim: addDays(5), destaque: true },
      { etapa: "Prova da 1ª Fase", dataInicio: addDays(65), destaque: true },
      { etapa: "Provas da 2ª Fase", dataInicio: addDays(95), dataFim: addDays(96), destaque: true }
    ],
    notaObservacao: "Atenção ao horário de encerramento ao meio-dia (12h).",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  {
    id: "unicamp-comvest",
    sigla: "UNICAMP",
    nomeInstituicao: "Universidade Estadual de Campinas",
    tituloProcesso: "Vestibular Unicamp 2026",
    tipo: "vestibular",
    subtipo: "Vestibular Próprio",
    estado: "SP",
    cidade: "Campinas",
    regiao: "Sudeste",
    vagas: 2540,
    taxaInscricao: 210,
    temIsencao: true,
    periodoInscricaoInicio: subDays(20),
    periodoInscricaoFim: addDays(7),
    horaFechamento: "17:00",
    dataProva: addDays(58),
    areasPrincipais: ["todas", "medicina", "engenharias", "tecnologia", "humanas"],
    linkEdital: "https://comvest.unicamp.br",
    linkInscricao: "https://comvest.unicamp.br/inscricao",
    destaques: [
      "Provas interdisciplinares",
      "Bonificação para estudantes da rede pública",
      "Campi em Campinas, Limeira e Piracicaba"
    ],
    cronograma: [
      { etapa: "Inscrições Abertas", dataInicio: subDays(20), dataFim: addDays(7), destaque: true },
      { etapa: "Aplicação da 1ª Fase", dataInicio: addDays(58), destaque: true }
    ],
    notaObservacao: "Provas aplicadas também em capitais fora de SP.",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  // FASE 3: Concursos Públicos
  {
    id: "concurso-tj-go",
    sigla: "TJ-GO",
    nomeInstituicao: "Tribunal de Justiça do Estado de Goiás",
    tituloProcesso: "Concurso Público para Analista e Técnico Judiciário",
    tipo: "concurso",
    subtipo: "Concurso Público",
    estado: "GO",
    cidade: "Goiânia",
    regiao: "Centro-Oeste",
    vagas: 145,
    taxaInscricao: 115,
    temIsencao: true,
    limiteIsencao: addDays(2),
    periodoInscricaoInicio: subDays(15),
    periodoInscricaoFim: addDays(8),
    horaFechamento: "23:59",
    dataProva: addDays(50),
    areasPrincipais: ["concurso-geral", "direito", "tecnologia"],
    linkEdital: "https://institutoaocp.org.br/concurso/tjgo",
    linkInscricao: "https://institutoaocp.org.br",
    destaques: [
      "Remuneração inicial de R$ 5.200 a R$ 11.400",
      "Vagas para nível médio e superior",
      "Lotação nas comarcas do interior e capital de Goiás"
    ],
    cronograma: [
      { etapa: "Inscrições no Instituto AOCP", dataInicio: subDays(15), dataFim: addDays(8), destaque: true },
      { etapa: "Prazo para Pedido de Isenção", dataInicio: subDays(15), dataFim: addDays(2) },
      { etapa: "Realização da Prova Objetiva e Discursiva", dataInicio: addDays(50), destaque: true }
    ],
    notaObservacao: "Fase 3 do Vestibulink: expansão para oportunidades de concursos públicos.",
    verificadoManualmente: true,
    dataAtualizacao: "2026-09-12"
  },
  {
    id: "concurso-banco-brasil",
    sigla: "Banco do Brasil",
    nomeInstituicao: "Banco do Brasil S.A.",
    tituloProcesso: "Concurso Escriturário e Agente de Tecnologia",
    tipo: "concurso",
    subtipo: "Concurso Público",
    estado: "DF",
    cidade: "Brasília (Nacional)",
    regiao: "Nacional",
    vagas: 3000,
    taxaInscricao: 50,
    temIsencao: true,
    periodoInscricaoInicio: subDays(10),
    periodoInscricaoFim: addDays(14),
    horaFechamento: "23:59",
    dataProva: addDays(68),
    areasPrincipais: ["concurso-geral", "tecnologia", "negocios"],
    linkEdital: "https://cesgranrio.org.br",
    linkInscricao: "https://cesgranrio.org.br/concursos/bb",
    destaques: [
      "Nível Médio completo",
      "Vagas em todas as agências do Centro-Oeste e Brasil",
      "Benefícios e participação nos lucros"
    ],
    cronograma: [
      { etapa: "Inscrições Fundação Cesgranrio", dataInicio: subDays(10), dataFim: addDays(14), destaque: true },
      { etapa: "Aplicação das Provas Objetivas", dataInicio: addDays(68), destaque: true }
    ],
    notaObservacao: "Grande porta de entrada para recém-formados do ensino médio.",
    verificadoManualmente: false,
    dataAtualizacao: "2026-09-12"
  }
];

/**
 * Dados iniciais (SEED / DEMO DATA) enriquecidos com fuso horário regional,
 * vínculo institucional, classificação de origem (DEMO_SEED) e fontes estruturadas.
 */
export const INITIAL_PROCESSOS: ProcessoSeletivo[] = RAW_SEED_PROCESSOS.map((proc) => {
  const inst = INITIAL_INSTITUTIONS.find(
    (i) => i.sigla.toLowerCase() === proc.sigla.toLowerCase()
  );
  const institutionId = inst?.id || `inst-${proc.id}`;
  const fusoHorario = obterFusoHorarioPorEstado(proc.estado);
  const linkSiteOficial = inst?.siteOficial;

  return {
    ...proc,
    institutionId,
    fusoHorario,
    linkSiteOficial,
    fontesOficiais: criarFontesPadrao(
      proc.id,
      institutionId,
      proc.linkEdital,
      proc.linkInscricao,
      linkSiteOficial
    ),
    verificadoManualmente: false,
    statusVerificacao: "PENDING_VERIFICATION",
    dataOrigin: "DEMO_SEED",
    dataCriacao: "2026-09-01",
  };
});

