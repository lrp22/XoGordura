import type { FoodItemResult, NutritionSource } from "./types";

const SOURCE_CONFIDENCE = {
  basic: {
    taco: 0.95,
    fatsecret: 0.85,
    web: 0.6,
    ai_estimate: 0.5,
  },
  branded: {
    taco: 0.0,
    fatsecret: 0.95,
    web: 0.9,
    ai_estimate: 0.4,
  },
} as const;

export function assignConfidence(
  source: NutritionSource,
  foodType: "basic" | "branded",
): NutritionSource {
  return {
    ...source,
    confidence: SOURCE_CONFIDENCE[foodType][source.source],
  };
}

export function computeWeightedAverage(
  sources: NutritionSource[],
  foodName: string,
  portion: string,
  glycemicLoad: "low" | "medium" | "high",
): FoodItemResult {
  const validSources = sources.filter((s) => s.confidence > 0);

  if (validSources.length === 0) {
    return {
      name: foodName,
      portion,
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      sugarG: 0,
      netCarbsG: 0,
      glycemicLoad,
      confidence: "low",
      sourcesUsed: [],
      bestSource: "none",
    };
  }

  const totalWeight = validSources.reduce((sum, s) => sum + s.confidence, 0);

  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let fiberG = 0;
  let sugarG = 0;

  for (const s of validSources) {
    const w = s.confidence / totalWeight;
    calories += s.calories * w;
    proteinG += s.proteinG * w;
    carbsG += s.carbsG * w;
    fatG += s.fatG * w;
    fiberG += s.fiberG * w;
    sugarG += s.sugarG * w;
  }

  const netCarbsG = Math.max(0, carbsG - fiberG);

  const calValues = validSources.map((s) => s.calories);
  const maxCal = Math.max(...calValues);
  const minCal = Math.min(...calValues);
  const avgCal = calories;

  let confidence: "high" | "medium" | "low";
  if (validSources.length >= 2 && avgCal > 0) {
    const spread = (maxCal - minCal) / avgCal;
    if (spread <= 0.2) confidence = "high";
    else if (spread <= 0.5) confidence = "medium";
    else confidence = "low";
  } else if (validSources.length === 1 && validSources[0]!.confidence >= 0.9) {
    confidence = "high";
  } else {
    confidence = "medium";
  }

  const bestSource = validSources.sort(
    (a, b) => b.confidence - a.confidence,
  )[0]!.source;

  return {
    name: foodName,
    portion,
    calories: Math.round(calories),
    proteinG: +proteinG.toFixed(1),
    carbsG: +carbsG.toFixed(1),
    fatG: +fatG.toFixed(1),
    fiberG: +fiberG.toFixed(1),
    sugarG: +sugarG.toFixed(1),
    netCarbsG: +netCarbsG.toFixed(1),
    glycemicLoad,
    confidence,
    sourcesUsed: validSources.map((s) => s.source),
    bestSource,
  };
}
