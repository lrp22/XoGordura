import type { GeminiParseResponse } from "./types";

// ─── Model fallback chain ────────────────────────────────
// If the primary model hits rate limits (429), we try the next one.
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

const SYSTEM_PROMPT = `Você é um assistente nutricional brasileiro especializado em identificar alimentos em descrições de refeições.

TAREFA:
Analise a descrição de uma refeição em português e extraia cada alimento individual.

REGRAS:
1. Identifique CADA alimento separadamente (arroz e feijão = 2 itens)
2. Inclua o método de preparo quando mencionado (grelhado, frito, cozido)
3. Estime a porção em gramas baseado na descrição ou porções brasileiras típicas
4. Classifique: "basic" para comida caseira/in natura, "branded" para produtos industrializados
5. Forneça o nome em inglês (para busca em bancos internacionais)
6. Forneça uma estimativa calórica para cada item (será usada como fallback)
7. Gere uma dica curta e ENCORAJADORA sobre a refeição (max 1 frase)
8. Na dúvida sobre porção, assuma porção MÉDIA brasileira
9. Café com açúcar = 2 itens separados (café + açúcar)
10. Se mencionar "com salada", inclua os vegetais que são típicos (alface, tomate)

IMPORTANTE: Responda APENAS com JSON válido, sem markdown.

FORMATO:
{
  "items": [
    {
      "name": "Arroz branco",
      "nameEn": "cooked white rice",
      "portion": "1 escumadeira média",
      "estimatedGrams": 125,
      "type": "basic",
      "brand": null,
      "aiEstimate": {
        "calories": 160,
        "proteinG": 3.1,
        "carbsG": 35.1,
        "fatG": 0.3
      }
    }
  ],
  "tip": "Boa escolha! Arroz com feijão é uma combinação de proteína completa 💪"
}`;

// ─── Call a single Gemini model ──────────────────────────
async function callGemini(
  voiceTranscript: string,
  apiKey: string,
  model: string,
): Promise<GeminiParseResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\nDESCRIÇÃO DA REFEIÇÃO:\n"${voiceTranscript}"`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const err = new Error(
      `Gemini ${model} error (${response.status}): ${errorBody}`,
    );
    (err as any).status = response.status;
    throw err;
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini ${model} returned empty response`);
  }

  const parsed = JSON.parse(text) as GeminiParseResponse;

  if (
    !parsed.items ||
    !Array.isArray(parsed.items) ||
    parsed.items.length === 0
  ) {
    throw new Error(`Gemini ${model} returned no food items`);
  }

  return parsed;
}

// ─── Call Groq (Llama) as final fallback ─────────────────
async function callGroq(
  voiceTranscript: string,
  apiKey: string,
): Promise<GeminiParseResponse> {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `DESCRIÇÃO DA REFEIÇÃO:\n"${voiceTranscript}"`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Groq returned empty response");
  }

  const parsed = JSON.parse(text) as GeminiParseResponse;

  if (
    !parsed.items ||
    !Array.isArray(parsed.items) ||
    parsed.items.length === 0
  ) {
    throw new Error("Groq returned no food items");
  }

  return parsed;
}

// ─── Main entry: try Gemini models, then Groq ────────────
export async function parseWithAI(
  voiceTranscript: string,
  geminiApiKey: string,
  groqApiKey?: string,
): Promise<GeminiParseResponse> {
  const errors: string[] = [];

  // ── Try each Gemini model in order ─────────────────
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[AI] Trying ${model}...`);
      const result = await callGemini(voiceTranscript, geminiApiKey, model);
      console.log(`[AI] ✅ Success with ${model}`);
      return result;
    } catch (error: any) {
      const status = error?.status;
      const message = error?.message ?? String(error);
      errors.push(`${model}: ${message}`);
      console.warn(`[AI] ❌ ${model} failed (status: ${status})`);

      // Only fallback on rate limit (429) or server error (5xx)
      // For other errors (400 bad request, etc), don't retry
      if (status && status !== 429 && status < 500) {
        throw error;
      }

      // Continue to next model
    }
  }

  // ── Try Groq as final fallback ─────────────────────
  if (groqApiKey) {
    try {
      console.log("[AI] Trying Groq (Llama 3.3 70B)...");
      const result = await callGroq(voiceTranscript, groqApiKey);
      console.log("[AI] ✅ Success with Groq");
      return result;
    } catch (error: any) {
      errors.push(`groq: ${error?.message ?? String(error)}`);
      console.warn("[AI] ❌ Groq failed");
    }
  }

  // ── All models failed ─────────────────────────────
  throw new Error(
    `All AI models failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
  );
}
