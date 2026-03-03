import { TACO_FOODS } from "./taco-data";
import type { TacoFood } from "./types";

// Remove accents and special characters for fuzzy matching
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// ─── Search TACO by fuzzy name match ─────────────────────
export function searchTaco(query: string, limit = 3): TacoFood[] {
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  if (terms.length === 0) return [];

  // Score each food based on how many query terms match
  const scored = TACO_FOODS.map((food) => {
    let score = 0;

    // All terms present = highest base score
    const allMatch = terms.every((term) => food.normalized.includes(term));
    if (allMatch) score += 100;

    // Count individual term matches
    for (const term of terms) {
      if (food.normalized.includes(term)) {
        score += 10;
        // Bonus for exact word boundary match
        const words = food.normalized.split(/\s+/);
        if (words.some((w) => w === term)) {
          score += 5;
        }
      }
    }

    // Prefer shorter names (more specific matches)
    if (score > 0) {
      score -= food.normalized.length * 0.1;
    }

    return { food, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ food }) => food);
}

// ─── Scale TACO values from per-100g to actual portion ───
export function scaleTaco(
  food: TacoFood,
  portionG: number,
): {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
} {
  const scale = portionG / 100;
  return {
    calories: Math.round(food.kcal * scale),
    proteinG: +(food.proteinG * scale).toFixed(1),
    carbsG: +(food.carbsG * scale).toFixed(1),
    fatG: +(food.fatG * scale).toFixed(1),
  };
}
