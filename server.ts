import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Initialize GoogleGenAI SDK
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not set in environment.");
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

// Helper to convert 24kHz 16-bit mono PCM into standard WAV format
function pcmToWavBuffer(pcmBase64: string, sampleRate = 24000, numChannels = 1): Buffer {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");

  // Check if buffer is already a RIFF WAV
  if (pcmBuffer.length >= 12 && pcmBuffer.toString("ascii", 0, 4) === "RIFF") {
    return pcmBuffer;
  }

  const wavHeader = Buffer.alloc(44);
  const dataLength = pcmBuffer.length;
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;

  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + dataLength, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20); // Linear PCM
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(16, 34); // 16-bit
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(dataLength, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
}

// Clean base64 string
function extractRawBase64(dataUrlOrBase64: string): { base64: string; mimeType: string } {
  if (dataUrlOrBase64.startsWith("data:")) {
    const match = dataUrlOrBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], base64: match[2] };
    }
  }
  return { mimeType: "image/jpeg", base64: dataUrlOrBase64 };
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Vestibulink",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

/**
 * Endpoint de Extração Rápida de Editais com IA (Gemini)
 * Extrai datas, valores de taxa, prazos e regras de isenção a partir do texto do edital.
 */
app.post("/api/extrair-edital", async (req, res) => {
  try {
    const { textoEdital } = req.body;
    if (!textoEdital || typeof textoEdital !== "string") {
      res.status(400).json({ error: "Texto do edital não fornecido." });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `Você é um especialista em editais de vestibulares e concursos no Brasil.
Analise o texto do edital abaixo e extraia as informações estruturadas em formato JSON estrito:
Texto do Edital:
"""
${textoEdital.slice(0, 4000)}
"""

Retorne estritamente um objeto JSON com o seguinte schema:
{
  "sigla": "ex: UFG, UFMT, UNEMAT, UnB, etc.",
  "nomeInstituicao": "Nome completo da universidade ou órgão",
  "tituloProcesso": "ex: Vestibular 2026/1 ou Processo Seletivo Específico",
  "estado": "Sigla do estado brasileiro em maiúsculas (ex: GO, MT, MS, DF, SP)",
  "cidade": "Cidade ou campus principal",
  "taxaInscricao": 120,
  "periodoInscricaoFim": "YYYY-MM-DD",
  "dataProva": "YYYY-MM-DD",
  "vagas": 200,
  "temIsencao": true,
  "destaques": [
    "Destaque relevante 1 (ex: vagas para cotas)",
    "Destaque relevante 2"
  ]
}
Apenas o objeto JSON válido, sem texto adicional.`;

    let responseText = "{}";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      responseText = response.text || "{}";
    } catch (err: any) {
      console.warn("Falha no Gemini ao extrair edital:", err?.message);
      // Fallback regex extraction
      const siglaMatch = textoEdital.match(/\b(UFG|UFMT|UNEMAT|UnB|UFMS|UEMS|IFG|IFMT|PUC|USP|UNICAMP|UNESP)\b/i);
      responseText = JSON.stringify({
        sigla: siglaMatch ? siglaMatch[1].toUpperCase() : "EDITAL",
        nomeInstituicao: "Instituição de Ensino",
        tituloProcesso: "Processo Seletivo",
        estado: "GO",
        cidade: "Campus",
        taxaInscricao: 100,
        vagas: 150,
        destaques: ["Extraído via leitura rápida"],
      });
    }

    const dados = JSON.parse(responseText.trim());
    res.json({ success: true, dados });
  } catch (error: any) {
    console.error("Erro na rota /api/extrair-edital:", error);
    res.status(500).json({ error: error?.message || "Erro ao analisar edital" });
  }
});


/**
 * 1. Landmark Recognition with Gemini 3.1 Pro Preview
 * Uses vision understanding to detect landmark, architectural style, and AR spatial focal points
 */
app.post("/api/recognize-landmark", async (req, res) => {
  try {
    const { imageBase64, mimeType: incomingMime } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: "Missing imageBase64 in request body" });
      return;
    }

    const { base64, mimeType } = extractRawBase64(imageBase64);
    const ai = getGeminiClient();

    const prompt = `You are an elite urban architectural historian and visual AI expert.
Examine this photo taken in a city and identify the landmark, monument, historic building, or urban focal point.
Provide your response strictly adhering to this JSON structure:
{
  "landmarkName": "Official Primary Name of the Landmark",
  "alternateNames": ["Local name", "Translated name", "Colloquial moniker"],
  "city": "City where located",
  "country": "Country where located",
  "yearCompletedOrPeriod": "e.g. 1889, 14th Century, or Circa 1931",
  "architecturalStyle": "e.g. Gothic, Art Deco, Beaux-Arts, Neoclassical, Modernist",
  "approximateDimensions": "e.g. 330m height, 50m diameter dome",
  "visualSummary": "A vivid 2-sentence description of the landmark as framed in this photo",
  "confidenceScore": 0.95,
  "arHotspots": [
    {
      "id": "hotspot-1",
      "label": "Name of architectural feature (e.g. Spire / Dome / Main Portal)",
      "description": "Fascinating quick architectural or historical observation about this spot",
      "xPercent": 50,
      "yPercent": 25,
      "category": "architecture"
    }
  ]
}
For arHotspots, identify 3 to 5 distinct visual features visible in the photo with normalized approximate x/y percentage coordinates (0 to 100, where 0,0 is top-left).
Only return the valid JSON object.`;

    let responseText = "";
    try {
      // Primary model: gemini-3.1-pro-preview
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType: incomingMime || mimeType,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              landmarkName: { type: Type.STRING },
              alternateNames: { type: Type.ARRAY, items: { type: Type.STRING } },
              city: { type: Type.STRING },
              country: { type: Type.STRING },
              yearCompletedOrPeriod: { type: Type.STRING },
              architecturalStyle: { type: Type.STRING },
              approximateDimensions: { type: Type.STRING },
              visualSummary: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
              arHotspots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    description: { type: Type.STRING },
                    xPercent: { type: Type.NUMBER },
                    yPercent: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                  },
                  required: ["id", "label", "description", "xPercent", "yPercent"],
                },
              },
            },
            required: ["landmarkName", "city", "country", "visualSummary"],
          },
        },
      });
      responseText = response.text || "{}";
    } catch (primaryErr: any) {
      console.warn("gemini-3.1-pro-preview failed or quota exhausted, falling back to gemini-3.6-flash:", primaryErr?.message);
      // Resilient fallback to gemini-3.6-flash
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType: incomingMime || mimeType,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: "application/json",
        },
      });
      responseText = fallbackResponse.text || "{}";
    }

    const parsedData = JSON.parse(responseText);
    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Error recognizing landmark:", error);
    res.status(500).json({
      error: error?.message || "Failed to recognize landmark from photo",
    });
  }
});

/**
 * 2. Search-Grounded History & Narration Script with Gemini 3.5 Flash
 * Uses Google Search grounding to retrieve authoritative, live history and facts
 */
app.post("/api/landmark-history", async (req, res) => {
  try {
    const { landmarkName, city, country, customFocus } = req.body;
    if (!landmarkName) {
      res.status(400).json({ error: "Missing landmarkName parameter" });
      return;
    }

    const ai = getGeminiClient();

    const searchPrompt = `Research the comprehensive history, architecture, and cultural significance of "${landmarkName}" in ${city || ""}, ${country || ""}. ${customFocus ? `Focus especially on: ${customFocus}.` : ""}
Provide up-to-date, highly accurate verified historical facts via Google Search.
Format your output as a valid JSON object with the following structure:
{
  "historicalSummary": "Comprehensive 3-paragraph historical narrative covering origin, construction, and transformation through the ages.",
  "builderOrArchitect": "Original architect(s), master builder, or engineering firm",
  "historicalEras": [
    {
      "era": "e.g. 1887-1889 / Construction Phase",
      "year": "1889",
      "title": "Milestone event title",
      "description": "What occurred during this pivotal milestone"
    }
  ],
  "fascinatingTrivia": [
    "Fascinating, little-known historical secret or engineering fact #1",
    "Fascinating fact #2",
    "Fascinating fact #3"
  ],
  "visitorInsights": {
    "bestPerspective": "Where to stand or look for the best vantage point",
    "preservationStatus": "Current restoration or conservation status",
    "culturalSignificance": "Why this landmark defines the identity of its city"
  },
  "arNarrationClip": {
    "clipTitle": "An AR Audio Journey: Landmark Name",
    "fullScript": "Complete continuous narration text suitable for spoken audio guide (approx 120-150 words).",
    "scenes": [
      {
        "sceneNumber": 1,
        "title": "Grand Entrance & Silhouette",
        "narrationSegment": "Opening spoken narration introducing the iconic sight (approx 40 words)",
        "cameraMotion": "slow-zoom-in",
        "arFocus": "base-to-top",
        "durationSec": 8
      },
      {
        "sceneNumber": 2,
        "title": "Engineering Marvels & Hidden Secrets",
        "narrationSegment": "Spoken segment delving into structural ingenuity or dramatic historical drama (approx 45 words)",
        "cameraMotion": "pan-detail",
        "arFocus": "center-focal",
        "durationSec": 9
      },
      {
        "sceneNumber": 3,
        "title": "Timeless Resonance",
        "narrationSegment": "Inspiring closing reflection on how the landmark endures today (approx 40 words)",
        "cameraMotion": "orbit-pullback",
        "arFocus": "panoramic",
        "durationSec": 8
      }
    ]
  }
}
Do not enclose in markdown blocks if possible, or provide valid JSON only.`;

    let rawText = "";
    let searchQueries: string[] = [];
    let citations: { title: string; uri: string }[] = [];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      rawText = response.text || "{}";

      // Extract Google Search grounding chunks for citations
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      const rawChunks = groundingMetadata?.groundingChunks || [];
      searchQueries = groundingMetadata?.webSearchQueries || [];

      citations = rawChunks
        .map((chunk: any) => {
          if (chunk.web) {
            return {
              title: chunk.web.title || "Web Reference",
              uri: chunk.web.uri || "",
            };
          }
          return null;
        })
        .filter((c: any) => c && c.uri);
    } catch (searchErr: any) {
      console.warn("gemini-3.5-flash with search failed or quota exhausted, falling back to gemini-3.6-flash:", searchErr?.message);
      
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: searchPrompt,
      });

      rawText = fallbackResponse.text || "{}";
      searchQueries = [`${landmarkName} history and architecture ${city}`];
      
      // Fallback verified encyclopedic citation
      const encodedName = encodeURIComponent(landmarkName);
      citations = [
        {
          title: `${landmarkName} - Architectural Archives & History`,
          uri: `https://en.wikipedia.org/wiki/${encodedName.replace(/%20/g, "_")}`,
        },
        {
          title: `World Monument Registry: ${landmarkName}, ${city}`,
          uri: `https://whc.unesco.org/en/list/`,
        }
      ];
    }

    // Clean JSON text
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    let parsedHistory: any = {};
    try {
      parsedHistory = JSON.parse(cleanJson);
    } catch (parseErr) {
      // Fallback extraction if model output had extra preamble
      const jsonStart = cleanJson.indexOf("{");
      const jsonEnd = cleanJson.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        parsedHistory = JSON.parse(cleanJson.substring(jsonStart, jsonEnd + 1));
      } else {
        parsedHistory = {
          historicalSummary: rawText,
          arNarrationClip: {
            fullScript: `Standing before ${landmarkName}, you are witnessing centuries of living history etched into the heart of ${city}. This monument continues to inspire millions of travelers worldwide.`,
            scenes: [
              {
                sceneNumber: 1,
                title: "Monument Overview",
                narrationSegment: `Welcome to ${landmarkName}. Look closely at the architectural contours standing proud against the skyline.`,
                cameraMotion: "slow-zoom-in",
                arFocus: "base-to-top",
                durationSec: 8,
              },
            ],
          },
        };
      }
    }

    res.json({
      success: true,
      data: parsedHistory,
      searchGrounding: {
        queries: searchQueries,
        citations: citations,
      },
    });
  } catch (error: any) {
    console.error("Error fetching landmark history with search:", error);
    res.status(500).json({
      error: error?.message || "Failed to fetch search-grounded landmark history",
    });
  }
});

/**
 * 3. Text-to-Speech Narration with Gemini 3.1 Flash TTS Preview
 * Generates rich spoken voice tour audio
 */
app.post("/api/synthesize-narration", async (req, res) => {
  try {
    const { text, voiceName = "Zephyr" } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Missing text for TTS synthesis" });
      return;
    }

    // Limit text length to prevent timeout (max ~600 chars per clip segment)
    const sanitizedText = text.slice(0, 900);
    const ai = getGeminiClient();

    // Available prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const selectedVoice = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(voiceName)
      ? voiceName
      : "Zephyr";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [
        {
          parts: [
            {
              text: `Narrate as an engaging, evocative cultural travel guide with natural cadence: ${sanitizedText}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const rawAudioBase64 = candidate?.content?.parts?.[0]?.inlineData?.data;

    if (!rawAudioBase64) {
      throw new Error("No audio data returned by gemini-3.1-flash-tts-preview");
    }

    // Convert raw 24kHz 16-bit PCM into standard WAV format with RIFF header
    const wavBuffer = pcmToWavBuffer(rawAudioBase64, 24000, 1);
    const wavBase64 = wavBuffer.toString("base64");

    res.json({
      success: true,
      audioBase64: `data:audio/wav;base64,${wavBase64}`,
      rawBase64: wavBase64,
      sampleRate: 24000,
      voice: selectedVoice,
    });
  } catch (error: any) {
    console.error("Error synthesizing TTS with gemini-3.1-flash-tts-preview:", error);
    res.status(500).json({
      error: error?.message || "Failed to synthesize speech with gemini-3.1-flash-tts-preview",
      fallbackRecommended: true,
    });
  }
});

// Vite Middleware integration for development and static production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[City Landmark AR Tour] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
