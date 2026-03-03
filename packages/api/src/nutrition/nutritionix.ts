import type { NutritionSource } from "./types";

// ─── Nutritionix Natural Language API ────────────────────
// Accepts English natural language queries
// Returns structured nutrition data

export async function searchNutritionix(
  queryEn: string,
  appId: string,
  appKey: string,
): Promise<NutritionSource | null> {
  try {
    const response = await fetch(
      "https://trackapi.nutritionix.com/v2/natural/nutrients",
      {
        method: "POST",
        headers: {
          "x-app-id": appId,
          "x-app-key": appKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: queryEn }),
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      foods?: {
        nf_calories?: number;
        nf_protein?: number;
        nf_total_carbohydrate?: number;
        nf_total_fat?: number;
        serving_weight_grams?: number;
      }[];
    };
    const food = data?.foods?.[0];
    if (!food) return null;

    return {
      source: "nutritionix",
      calories: Math.round(food.nf_calories ?? 0),
      proteinG: +(food.nf_protein ?? 0).toFixed(1),
      carbsG: +(food.nf_total_carbohydrate ?? 0).toFixed(1),
      fatG: +(food.nf_total_fat ?? 0).toFixed(1),
      portionG: food.serving_weight_grams ?? 100,
      confidence: 0, // set by pipeline
    };
  } catch (error) {
    console.warn("[Nutritionix] lookup failed:", error);
    return null;
  }
}
