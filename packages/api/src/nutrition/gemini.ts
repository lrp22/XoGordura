import type { GeminiParseResponse } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";

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

export async function parseWithGemini(
  voiceTranscript: string,
  apiKey: string,
): Promise<GeminiParseResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

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
        temperature: 0.2, // low creativity, high accuracy
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  const parsed = JSON.parse(text) as GeminiParseResponse;

  // Validate the response has items
  if (
    !parsed.items ||
    !Array.isArray(parsed.items) ||
    parsed.items.length === 0
  ) {
    throw new Error("Gemini returned no food items");
  }

  return parsed;
}
