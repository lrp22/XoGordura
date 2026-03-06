import type { NutritionSource } from "./types";

// ─── OAuth 2.0 token cache ──────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const id = clientId.trim();
  const secret = clientSecret.trim();

  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
    },
    body: "grant_type=client_credentials&scope=basic",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FatSecret auth failed: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = data.access_token;
  // Refresh 5 minutes before expiry
  tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

  return cachedToken as string;
}

/**
 * Parse the FatSecret food_description string into all nutrients.
 *
 * FatSecret pt-BR format (basic scope):
 *   "Por 100g - Calorias: 89kcal | Gord.: 0,33g | Carbs: 22,84g | Prot.: 1,09g"
 *
 * FatSecret en format:
 *   "Per 100g - Calories: 89kcal | Fat: 0.33g | Carbs: 22.84g | Protein: 1.09g"
 *
 * Fiber and sugar only present with premier scope:
 *   "| Fiber: 1.5g | Sugar: 2.0g"  /  "| Fibra: 1,5g | Açúcar: 2,0g"
 */
function parseDescription(desc: string): {
  servingG: number;
  calories: number;
  fatG: number;
  carbsG: number;
  proteinG: number;
  fiberG: number;
  sugarG: number;
} | null {
  try {
    // ── Serving size — handles both "Per 100g" and "Por 100g" ──
    const servingMatch = desc.match(/(?:Per|Por)\s+.*?([\d,.]+)\s*(?:g|ml)/i);
    const servingG = servingMatch
      ? Number.parseFloat(servingMatch[1]!.replace(",", "."))
      : 100;

    function extract(pattern: RegExp): number {
      const m = desc.match(pattern);
      return m ? Number.parseFloat(m[1]!.replace(",", ".")) : 0;
    }

    // ── Core macros — handles full words, abbreviations, dots ──
    const calories = extract(/(?:Calorias|Calories|Cal\.?)\s*:\s*([\d,.]+)/i);
    const fatG = extract(/(?:Gordura|Gord\.?|Fat)\s*:\s*([\d,.]+)/i);
    const carbsG = extract(
      /(?:Carboidratos|Carbs?\.?|Carb\.?)\s*:\s*([\d,.]+)/i,
    );
    const proteinG = extract(
      /(?:Prote[íi]nas?|Protein|Prot\.?)\s*:\s*([\d,.]+)/i,
    );

    // ── Fiber & sugar — only present with premier scope ────────
    const fiberG = extract(
      /(?:Dietary\s+)?Fib(?:er|ra)(?:\s+Alimentar)?\s*:\s*([\d,.]+)/i,
    );
    const sugarG = extract(
      /(?:A(?:ç|c)(?:ú|u)cares?|Sugars?)\s*:\s*([\d,.]+)/i,
    );

    if (calories === 0) return null; // malformed / unrecognised format

    return { servingG, calories, fatG, carbsG, proteinG, fiberG, sugarG };
  } catch (e) {
    console.warn("[FatSecret] parseDescription error:", desc, e);
    return null;
  }
}

// ─── Search FatSecret for a food ─────────────────────────
export async function searchFatSecret(
  query: string,
  portionG: number,
  clientId: string,
  clientSecret: string,
): Promise<NutritionSource | null> {
  console.log("[FatSecret] searching for:", query);
  try {
    const token = await getAccessToken(clientId, clientSecret);
    console.log("[FatSecret] got token, calling API...");

    const params = new URLSearchParams({
      search_expression: query,
      format: "json",
      region: "BR",
      language: "pt",
      max_results: "3",
    });

    const response = await fetch(
      `https://platform.fatsecret.com/rest/foods/search/v1?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("[FatSecret] response status:", response.status);
    if (!response.ok) return null;

    const data = (await response.json()) as any;
    console.log("[FatSecret] raw data:", JSON.stringify(data).slice(0, 500));

    // FatSecret returns { foods: { food: [] } } — NOT foods_search.results.food
    const foods = data?.foods?.food;
    console.log(
      "[FatSecret] foods found:",
      Array.isArray(foods) ? foods.length : foods ? 1 : 0,
    );
    if (!foods) return null;

    // Single result comes back as an object, not an array
    const best = Array.isArray(foods) ? foods[0]! : foods;
    console.log("[FatSecret] food_description:", best?.food_description);

    const desc = best?.food_description;
    if (!desc) return null;

    const parsed = parseDescription(desc);
    console.log("[FatSecret] parsed:", parsed);
    if (!parsed) return null;

    const scale = portionG / parsed.servingG;

    return {
      source: "fatsecret",
      calories: Math.round(parsed.calories * scale),
      proteinG: +(parsed.proteinG * scale).toFixed(1),
      carbsG: +(parsed.carbsG * scale).toFixed(1),
      fatG: +(parsed.fatG * scale).toFixed(1),
      fiberG: +(parsed.fiberG * scale).toFixed(1),
      sugarG: +(parsed.sugarG * scale).toFixed(1),
      portionG,
      confidence: 0, // assigned by pipeline based on food type
    };
  } catch (error) {
    console.warn("[FatSecret] lookup failed:", error);
    return null;
  }
}
