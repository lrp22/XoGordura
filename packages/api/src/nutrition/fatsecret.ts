import type { NutritionSource } from "./types";

// ─── OAuth 2.0 token cache ──────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch("https://oauth.fatsecret.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials&scope=basic premier",
  });

  if (!response.ok) {
    throw new Error(`FatSecret auth failed: ${response.status}`);
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

// ─── Parse FatSecret food description string ─────────────
// Format: "Per 100g - Calorias: 128kcal | Gordura: 0,20g | Carbs: 28,10g | Prot: 2,50g"
// OR:     "Per 100g - Calories: 128kcal | Fat: 0.20g | Carbs: 28.10g | Protein: 2.50g"
function parseDescription(desc: string): {
  servingG: number;
  calories: number;
  fatG: number;
  carbsG: number;
  proteinG: number;
} | null {
  try {
    // Extract serving size
    const servingMatch = desc.match(/Per\s+([\d,.]+)\s*(g|ml)/i);
    const servingG = servingMatch
      ? Number.parseFloat(servingMatch[1]!.replace(",", "."))
      : 100;

    // Extract nutrients — handle both pt-BR and en formats
    const cal =
      desc.match(/Cal(?:orias?)?:\s*([\d,.]+)/i)?.[1]?.replace(",", ".") || "0";
    const fat =
      desc.match(/(?:Gordura|Fat):\s*([\d,.]+)/i)?.[1]?.replace(",", ".") ||
      "0";
    const carbs =
      desc.match(/Carbs?:\s*([\d,.]+)/i)?.[1]?.replace(",", ".") || "0";
    const protein =
      desc.match(/Prot(?:eína?|ein)?:\s*([\d,.]+)/i)?.[1]?.replace(",", ".") ||
      "0";

    return {
      servingG,
      calories: Number.parseFloat(cal),
      fatG: Number.parseFloat(fat),
      carbsG: Number.parseFloat(carbs),
      proteinG: Number.parseFloat(protein),
    };
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
  try {
    const token = await getAccessToken(clientId, clientSecret);

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

    // Use the first (most relevant) result
    const best = Array.isArray(foods) ? foods[0]! : foods;
    const desc = best.food_description;
    if (!desc) return null;

    const parsed = parseDescription(desc);
    if (!parsed) return null;

    // Scale to requested portion
    const scale = portionG / parsed.servingG;

    return {
      source: "fatsecret",
      calories: Math.round(parsed.calories * scale),
      proteinG: +(parsed.proteinG * scale).toFixed(1),
      carbsG: +(parsed.carbsG * scale).toFixed(1),
      fatG: +(parsed.fatG * scale).toFixed(1),
      portionG,
      confidence: 0, // set by pipeline based on food type
    };
  } catch (error) {
    console.warn("[FatSecret] lookup failed:", error);
    return null;
  }
}
