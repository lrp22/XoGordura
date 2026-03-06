import type { GeminiParseResponse } from "./types";

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
6. Forneça estimativa calórica, proteína, carbos, gordura, FIBRA e AÇÚCAR para cada item
7. Classifique a CARGA GLICÊMICA de cada item: "low", "medium" ou "high"
   - low: IG < 55 ou porção pequena de carboidrato (vegetais, legumes, nozes)
   - medium: IG 55-69 ou porção moderada (arroz integral, pão integral, frutas)
   - high: IG >= 70 ou porção grande de carboidrato refinado (arroz branco, pão branco, açúcar, suco)
8. Gere uma dica curta e ENCORAJADORA sobre a refeição (max 1 frase)
9. Na dúvida sobre porção, assuma porção MÉDIA brasileira
10. Café com açúcar = 2 itens separados (café + açúcar)
11. Se mencionar "com salada", inclua os vegetais típicos (alface, tomate)

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
        "fatG": 0.3,
        "fiberG": 0.4,
        "sugarG": 0.1,
        "glycemicLoad": "high"
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

// ─── Call Groq as final fallback ─────────────────────────
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

      if (status && status !== 429 && status < 500) {
        throw error;
      }
    }
  }

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

  throw new Error(
    `All AI models failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
  );
}

// packages/api/src/nutrition/gemini.ts

export async function generateMacroSuggestion(
  remaining: {
    remCalories: number;
    remProtein: number;
    remCarbs: number;
    remFat: number;
  },
  isDiabetic: boolean,
  apiKey: string,
) {
  const prompt = `Você é um nutricionista brasileiro focado em bater macros. O usuário do app precisa de uma sugestão de prato ou lanche prático para fechar o dia.
  
  Faltam aproximadamente:
  - ${remaining.remCalories} kcal
  - ${remaining.remProtein}g de proteína
  - ${remaining.remCarbs}g de carboidrato
  - ${remaining.remFat}g de gordura

  Condição do usuário: ${isDiabetic ? "TEM DIABETES (foco em baixo índice glicêmico, sem açúcar, mais fibras)." : "Sem restrições médicas."}

  Sugira UMA única opção prática, usando ingredientes típicos do Brasil, que se encaixe o MAIS PRÓXIMO POSSÍVEL nesses valores restantes.
  
  Responda APENAS com um JSON válido neste formato:
  {
    "title": "Nome criativo do lanche/refeição",
    "description": "Explicação simples com as quantidades exatas para atingir os macros.",
    "macros": "Aprox: X kcal | P: Xg | C: Xg | G: Xg"
  }`;

  // Using the fastest model for this quick suggestion
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    },
  );

  if (!response.ok) throw new Error("Gemini API error in suggestion");

  const data = (await response.json()) as any;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response");

  return JSON.parse(text) as {
    title: string;
    description: string;
    macros: string;
  };
}
