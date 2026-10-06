import { GoogleGenAI, Type } from "@google/genai";
import { EditalDocument } from "../../src/domain/models";
import { db } from "../data/database";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Vestibulink AI] GEMINI_API_KEY não configurada no ambiente.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export interface ExtractedEditalDraft {
  sigla: string;
  nomeInstituicao: string;
  tituloProcesso: string;
  estado: string;
  cidade: string;
  taxaInscricao: number;
  periodoInscricaoInicio?: string;
  periodoInscricaoFim?: string;
  horaFechamento?: string;
  dataProva?: string;
  vagas: number;
  temIsencao: boolean;
  limiteIsencao?: string;
  destaques: string[];
  requiresHumanReview: boolean;
  dataOrigin: "AI_EXTRACTED_DRAFT";
  documentId: string;
}

/**
 * Serviço auxiliar de extração estruturada de editais via Gemini.
 * Fluxo oficial:
 * Texto/Documento do Edital -> Extração Gemini -> Dados Estruturados -> Validação -> Revisão Humana -> Publicação.
 * A IA NUNCA publica nem sobrescreve dados oficiais sem revisão humana.
 */
export async function extractEditalStructuredDraft(
  textoEdital: string,
  sourceUrl?: string
): Promise<ExtractedEditalDraft> {
  // Não limita permanentemente aos primeiros 4.000 caracteres; suporta documentos extensos
  const maxSafePromptChars = 120_000;
  const normalizedText = textoEdital.trim().slice(0, maxSafePromptChars);

  const ai = getGeminiClient();
  const prompt = `Você é um analista especialista em editais de vestibulares, processos seletivos e concursos públicos no Brasil.
Analise o conteúdo do edital abaixo e extraia os dados estruturados em formato JSON estrito.
IMPORTANTE: Não invente URLs, datas ou valores que não estejam indicados ou implícitos no texto.

Conteúdo do Edital:
"""
${normalizedText}
"""`;

  let parsed: Record<string, any> = {};

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sigla: {
              type: Type.STRING,
              description: "Sigla da instituição ou banca (ex: UFG, UFMT, UnB, UNEMAT, USP)",
            },
            nomeInstituicao: {
              type: Type.STRING,
              description: "Nome completo da universidade ou órgão público",
            },
            tituloProcesso: {
              type: Type.STRING,
              description: "Título do vestibular, processo seletivo ou concurso",
            },
            estado: {
              type: Type.STRING,
              description: "Sigla da UF brasileira em 2 letras maiúsculas (ex: GO, MT, MS, DF, SP)",
            },
            cidade: {
              type: Type.STRING,
              description: "Cidade ou campus principal",
            },
            taxaInscricao: {
              type: Type.NUMBER,
              description: "Valor da taxa de inscrição em reais (0 se gratuito)",
            },
            periodoInscricaoInicio: {
              type: Type.STRING,
              description: "Data de início das inscrições no formato YYYY-MM-DD",
            },
            periodoInscricaoFim: {
              type: Type.STRING,
              description: "Data final das inscrições no formato YYYY-MM-DD",
            },
            horaFechamento: {
              type: Type.STRING,
              description: "Horário limite do encerramento no formato HH:MM (ex: 23:59 ou 18:00)",
            },
            dataProva: {
              type: Type.STRING,
              description: "Data principal da prova objetiva no formato YYYY-MM-DD",
            },
            vagas: {
              type: Type.INTEGER,
              description: "Número total estimado de vagas",
            },
            temIsencao: {
              type: Type.BOOLEAN,
              description: "Indica se o edital prevê isenção de taxa de inscrição",
            },
            limiteIsencao: {
              type: Type.STRING,
              description: "Data final para pedido de isenção no formato YYYY-MM-DD, se houver",
            },
            destaques: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Até 4 pontos importantes extraídos do edital",
            },
          },
          required: ["sigla", "nomeInstituicao", "tituloProcesso"],
        },
      },
    });

    const rawJson = response.text || "{}";
    parsed = JSON.parse(rawJson.trim());
  } catch (err: any) {
    console.warn("[Vestibulink AI] Fallback na extração de edital:", err?.message);
    const siglaMatch = normalizedText.match(
      /\b(UFG|UFMT|UNEMAT|UnB|UFMS|UEMS|IFG|IFMT|PUC|USP|UNICAMP|UNESP|UEG|UniRV)\b/i
    );
    parsed = {
      sigla: siglaMatch ? siglaMatch[1].toUpperCase() : "EDITAL",
      nomeInstituicao: "Instituição (Revisar Nome)",
      tituloProcesso: "Processo Seletivo (Extraído para Revisão)",
      estado: "GO",
      cidade: "Campus Principal",
      taxaInscricao: 0,
      vagas: 100,
      temIsencao: true,
      destaques: ["Rascunho extraído para conferência humana antes da publicação"],
    };
  }

  const docRecord: EditalDocument = {
    id: `edital-doc-${Date.now()}`,
    titulo: parsed.tituloProcesso || "Edital Analisado",
    sourceUrl,
    rawTextLength: textoEdital.length,
    versionLabel: "v1-draft",
    extractionStatus: "EXTRACTED_PENDING_REVIEW",
    extractedPayload: parsed,
    requiresHumanReview: true,
    createdAt: new Date().toISOString(),
  };

  const state = db.getState();
  state.editalDocuments.unshift(docRecord);
  db.appendAuditLog({
    action: "AI_EDITAL_EXTRACTION_DRAFT",
    entityType: "EDITAL_DOCUMENT",
    entityId: docRecord.id,
    metadata: {
      rawTextLength: textoEdital.length,
      siglaExtraida: parsed.sigla,
      requiresHumanReview: true,
    },
  });

  return {
    sigla: parsed.sigla || "EDITAL",
    nomeInstituicao: parsed.nomeInstituicao || "",
    tituloProcesso: parsed.tituloProcesso || "",
    estado: parsed.estado || "GO",
    cidade: parsed.cidade || "",
    taxaInscricao: typeof parsed.taxaInscricao === "number" ? parsed.taxaInscricao : 0,
    periodoInscricaoInicio: parsed.periodoInscricaoInicio,
    periodoInscricaoFim: parsed.periodoInscricaoFim,
    horaFechamento: parsed.horaFechamento,
    dataProva: parsed.dataProva,
    vagas: typeof parsed.vagas === "number" ? parsed.vagas : 100,
    temIsencao: Boolean(parsed.temIsencao ?? true),
    limiteIsencao: parsed.limiteIsencao,
    destaques: Array.isArray(parsed.destaques) ? parsed.destaques : [],
    requiresHumanReview: true,
    dataOrigin: "AI_EXTRACTED_DRAFT",
    documentId: docRecord.id,
  };
}
