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
 * FIX 1 & 5: Parse the FatSecret food_description string into all nutrients.
 *
 * The description can arrive in either pt-BR or en formats, e.g.:
 *   "Per 100g - Calorias: 128kcal | Gordura: 0,20g | Carbs: 28,10g | Prot: 2,50g"
 *   "Per 100g - Calories: 128kcal | Fat: 0.20g | Carbs: 28.10g | Protein: 2.50g"
 *
 * Fiber and sugar are not always present in the basic description, but when the
 * premier scope is granted they can appear as:
 *   "| Fiber: 1.5g | Sugar: 2.0g"  or  "| Fibra: 1,5g | Açúcar: 2,0g"
 *
 * The function now returns fiberG and sugarG (defaulting to 0 when absent),
 * which fixes the missing-field bug in the NutritionSource return value and
 * gives diabetic users real fiber/net-carb data whenever FatSecret provides it.
 */
function parseDescription(desc: string): {
  servingG: number;
  calories: number;
  fatG: number;
  carbsG: number;
  proteinG: number;
  /** Dietary fibre in grams — 0 when not present in the description */
  fiberG: number;
  /** Total sugars in grams — 0 when not present in the description */
  sugarG: number;
} | null {
  try {
    // ── Serving size ────────────────────────────────────────
    const servingMatch = desc.match(/Per\s+([\d,.]+)\s*(g|ml)/i);
    const servingG = servingMatch
      ? Number.parseFloat(servingMatch[1]!.replace(",", "."))
      : 100;

    // ── Helper: extract a numeric value from a labelled field ──
    function extract(pattern: RegExp): number {
      const m = desc.match(pattern);
      return m ? Number.parseFloat(m[1]!.replace(",", ".")) : 0;
    }

    // ── Core macros (pt-BR and en labels) ───────────────────
    const calories = extract(/Cal(?:orias?)?:\s*([\d,.]+)/i);
    const fatG = extract(/(?:Gordura|Fat):\s*([\d,.]+)/i);
    const carbsG = extract(/Carbs?:\s*([\d,.]+)/i);
    const proteinG = extract(/Prot(?:eína?|ein)?:\s*([\d,.]+)/i);

    // ── FIX 5: Fiber and sugar — present with premier scope ─
    // Accepted labels:  Fiber / Fibra / Dietary Fiber / Fibra Alimentar
    //                   Sugar / Açúcar / Sugars / Açúcares
    const fiberG = extract(
      /(?:Dietary\s+)?Fib(?:er|ra)(?:\s+Alimentar)?:\s*([\d,.]+)/i,
    );
    const sugarG = extract(/A(?:ç|c)(?:ú|u)cares?|Sugars?:\s*([\d,.]+)/i);

    if (calories === 0) return null; // malformed description

    return { servingG, calories, fatG, carbsG, proteinG, fiberG, sugarG };
  } catch {
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

    if (!response.ok) return null;

    const data = (await response.json()) as {
      foods_search?: { results?: { food?: { food_description?: string }[] } };
    };
    const foods = data?.foods_search?.results?.food;
    if (!foods || foods.length === 0) return null;

    const best = Array.isArray(foods) ? foods[0]! : foods;
    const desc = best.food_description;
    if (!desc) return null;

    const parsed = parseDescription(desc);
    if (!parsed) return null;

    // Scale all nutrients from the description's serving size to the
    // requested portion.
    const scale = portionG / parsed.servingG;

    // FIX 1: fiberG and sugarG are now always present on the returned object,
    // satisfying the NutritionSource interface without any `(result as any)`
    // workaround in the pipeline.
    return {
      source: "fatsecret",
      calories: Math.round(parsed.calories * scale),
      proteinG: +(parsed.proteinG * scale).toFixed(1),
      carbsG: +(parsed.carbsG * scale).toFixed(1),
      fatG: +(parsed.fatG * scale).toFixed(1),
      fiberG: +(parsed.fiberG * scale).toFixed(1),
      sugarG: +(parsed.sugarG * scale).toFixed(1),
      portionG,
      confidence: 0, // set by pipeline based on food type
    };
  } catch (error) {
    console.warn("[FatSecret] lookup failed:", error);
    return null;
  }
}
