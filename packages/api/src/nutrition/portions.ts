import type { PortionInfo } from "./types";

// ─── Default Brazilian portion sizes ─────────────────────
// Sources: IBGE POF 2017-2018 + Guia Alimentar Brasileiro
// Keys are normalized (no accents, lowercase)

const PORTIONS: Record<string, PortionInfo> = {
  // Cereais
  arroz: {
    defaultG: 125,
    unit: "escumadeira",
    smallG: 80,
    mediumG: 125,
    largeG: 200,
  },
  "arroz integral": {
    defaultG: 125,
    unit: "escumadeira",
    smallG: 80,
    mediumG: 125,
    largeG: 200,
  },
  macarrao: {
    defaultG: 110,
    unit: "escumadeira",
    smallG: 80,
    mediumG: 110,
    largeG: 170,
  },
  "pao frances": {
    defaultG: 50,
    unit: "unidade",
    smallG: 40,
    mediumG: 50,
    largeG: 70,
  },
  "pao de forma": {
    defaultG: 25,
    unit: "fatia",
    smallG: 25,
    mediumG: 25,
    largeG: 50,
  },
  biscoito: {
    defaultG: 30,
    unit: "unidade (6)",
    smallG: 15,
    mediumG: 30,
    largeG: 45,
  },
  aveia: {
    defaultG: 30,
    unit: "colher sopa",
    smallG: 15,
    mediumG: 30,
    largeG: 45,
  },
  cuscuz: {
    defaultG: 135,
    unit: "fatia",
    smallG: 90,
    mediumG: 135,
    largeG: 200,
  },
  tapioca: {
    defaultG: 60,
    unit: "unidade",
    smallG: 40,
    mediumG: 60,
    largeG: 90,
  },
  "pao de queijo": {
    defaultG: 40,
    unit: "unidade",
    smallG: 25,
    mediumG: 40,
    largeG: 60,
  },
  granola: {
    defaultG: 30,
    unit: "colher sopa",
    smallG: 15,
    mediumG: 30,
    largeG: 50,
  },

  // Leguminosas
  feijao: {
    defaultG: 86,
    unit: "concha",
    smallG: 55,
    mediumG: 86,
    largeG: 130,
  },
  lentilha: {
    defaultG: 86,
    unit: "concha",
    smallG: 55,
    mediumG: 86,
    largeG: 130,
  },
  "grao de bico": {
    defaultG: 86,
    unit: "concha",
    smallG: 55,
    mediumG: 86,
    largeG: 130,
  },

  // Carnes
  "frango peito": {
    defaultG: 100,
    unit: "filé",
    smallG: 75,
    mediumG: 100,
    largeG: 150,
  },
  "frango coxa": {
    defaultG: 90,
    unit: "unidade",
    smallG: 70,
    mediumG: 90,
    largeG: 120,
  },
  "frango sobrecoxa": {
    defaultG: 100,
    unit: "unidade",
    smallG: 80,
    mediumG: 100,
    largeG: 130,
  },
  bife: {
    defaultG: 100,
    unit: "unidade",
    smallG: 70,
    mediumG: 100,
    largeG: 150,
  },
  "carne moida": {
    defaultG: 100,
    unit: "colher servir",
    smallG: 70,
    mediumG: 100,
    largeG: 150,
  },
  "carne acem": {
    defaultG: 100,
    unit: "pedaço",
    smallG: 70,
    mediumG: 100,
    largeG: 150,
  },
  linguica: {
    defaultG: 80,
    unit: "gomo",
    smallG: 50,
    mediumG: 80,
    largeG: 120,
  },
  salsicha: {
    defaultG: 50,
    unit: "unidade",
    smallG: 50,
    mediumG: 100,
    largeG: 150,
  },
  calabresa: {
    defaultG: 80,
    unit: "porção",
    smallG: 50,
    mediumG: 80,
    largeG: 120,
  },
  presunto: {
    defaultG: 30,
    unit: "fatia (2)",
    smallG: 15,
    mediumG: 30,
    largeG: 60,
  },
  peixe: { defaultG: 120, unit: "filé", smallG: 80, mediumG: 120, largeG: 180 },
  ovo: { defaultG: 50, unit: "unidade", smallG: 50, mediumG: 100, largeG: 150 },

  // Laticínios
  leite: {
    defaultG: 200,
    unit: "copo",
    smallG: 150,
    mediumG: 200,
    largeG: 300,
  },
  "queijo minas": {
    defaultG: 30,
    unit: "fatia",
    smallG: 20,
    mediumG: 30,
    largeG: 50,
  },
  "queijo mussarela": {
    defaultG: 20,
    unit: "fatia",
    smallG: 15,
    mediumG: 20,
    largeG: 40,
  },
  "queijo prato": {
    defaultG: 20,
    unit: "fatia",
    smallG: 15,
    mediumG: 20,
    largeG: 40,
  },
  iogurte: {
    defaultG: 170,
    unit: "pote",
    smallG: 100,
    mediumG: 170,
    largeG: 200,
  },
  manteiga: {
    defaultG: 10,
    unit: "colher chá",
    smallG: 5,
    mediumG: 10,
    largeG: 20,
  },
  requeijao: {
    defaultG: 30,
    unit: "colher sopa",
    smallG: 15,
    mediumG: 30,
    largeG: 45,
  },

  // Frutas
  banana: {
    defaultG: 86,
    unit: "unidade",
    smallG: 60,
    mediumG: 86,
    largeG: 120,
  },
  maca: {
    defaultG: 130,
    unit: "unidade",
    smallG: 100,
    mediumG: 130,
    largeG: 170,
  },
  laranja: {
    defaultG: 145,
    unit: "unidade",
    smallG: 100,
    mediumG: 145,
    largeG: 200,
  },
  mamao: {
    defaultG: 170,
    unit: "fatia",
    smallG: 100,
    mediumG: 170,
    largeG: 260,
  },
  manga: {
    defaultG: 140,
    unit: "unidade",
    smallG: 100,
    mediumG: 140,
    largeG: 200,
  },
  melancia: {
    defaultG: 200,
    unit: "fatia",
    smallG: 120,
    mediumG: 200,
    largeG: 350,
  },
  abacaxi: {
    defaultG: 130,
    unit: "fatia",
    smallG: 75,
    mediumG: 130,
    largeG: 200,
  },
  morango: {
    defaultG: 100,
    unit: "porção (8)",
    smallG: 60,
    mediumG: 100,
    largeG: 160,
  },
  uva: {
    defaultG: 100,
    unit: "cacho pequeno",
    smallG: 60,
    mediumG: 100,
    largeG: 150,
  },
  abacate: {
    defaultG: 100,
    unit: "colher sopa (3)",
    smallG: 50,
    mediumG: 100,
    largeG: 170,
  },

  // Verduras / Legumes
  alface: { defaultG: 30, unit: "porção", smallG: 15, mediumG: 30, largeG: 50 },
  tomate: {
    defaultG: 75,
    unit: "unidade",
    smallG: 50,
    mediumG: 75,
    largeG: 125,
  },
  cenoura: {
    defaultG: 50,
    unit: "colher servir",
    smallG: 30,
    mediumG: 50,
    largeG: 85,
  },
  cebola: { defaultG: 30, unit: "porção", smallG: 15, mediumG: 30, largeG: 50 },
  batata: {
    defaultG: 120,
    unit: "unidade",
    smallG: 80,
    mediumG: 120,
    largeG: 175,
  },
  "batata doce": {
    defaultG: 120,
    unit: "unidade",
    smallG: 80,
    mediumG: 120,
    largeG: 175,
  },
  mandioca: {
    defaultG: 100,
    unit: "pedaço (2)",
    smallG: 60,
    mediumG: 100,
    largeG: 160,
  },
  abobrinha: {
    defaultG: 80,
    unit: "colher servir",
    smallG: 50,
    mediumG: 80,
    largeG: 120,
  },
  brocolis: {
    defaultG: 60,
    unit: "porção",
    smallG: 40,
    mediumG: 60,
    largeG: 100,
  },
  couve: {
    defaultG: 60,
    unit: "colher servir",
    smallG: 36,
    mediumG: 60,
    largeG: 100,
  },
  salada: {
    defaultG: 100,
    unit: "porção",
    smallG: 60,
    mediumG: 100,
    largeG: 150,
  },

  // Óleos
  oleo: { defaultG: 8, unit: "colher sopa", smallG: 4, mediumG: 8, largeG: 15 },
  azeite: {
    defaultG: 5,
    unit: "colher chá",
    smallG: 3,
    mediumG: 5,
    largeG: 10,
  },
  margarina: {
    defaultG: 10,
    unit: "colher chá",
    smallG: 5,
    mediumG: 10,
    largeG: 20,
  },

  // Açúcar
  acucar: {
    defaultG: 10,
    unit: "colher chá (2)",
    smallG: 5,
    mediumG: 10,
    largeG: 20,
  },

  // Bebidas
  cafe: { defaultG: 50, unit: "xícara", smallG: 50, mediumG: 50, largeG: 100 },
  "suco de laranja": {
    defaultG: 240,
    unit: "copo",
    smallG: 150,
    mediumG: 240,
    largeG: 350,
  },
  suco: { defaultG: 240, unit: "copo", smallG: 150, mediumG: 240, largeG: 350 },

  // Preparações
  farofa: {
    defaultG: 30,
    unit: "colher sopa",
    smallG: 15,
    mediumG: 30,
    largeG: 50,
  },
};

// ─── Normalize text for portion lookup ───────────────────
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// ─── Resolve portion to grams ────────────────────────────
// Uses Gemini's gram estimate + our portion database for cross-reference
export function resolvePortionGrams(
  foodName: string,
  portionDescription: string,
  aiEstimatedGrams: number,
): number {
  const normalizedName = normalize(foodName);

  // Try to find a matching portion reference
  let portionRef: PortionInfo | undefined;
  for (const [key, value] of Object.entries(PORTIONS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      portionRef = value;
      break;
    }
  }

  // If no reference found, trust the AI estimate
  if (!portionRef) return aiEstimatedGrams;

  // Check if portion description mentions size
  const desc = normalize(portionDescription);
  if (desc.includes("pequen") || desc.includes("pouc")) {
    return portionRef.smallG;
  }
  if (
    desc.includes("grand") ||
    desc.includes("muit") ||
    desc.includes("pratao")
  ) {
    return portionRef.largeG;
  }

  // Check for quantities ("2 ovos", "3 pães")
  const qtyMatch = desc.match(/(\d+)\s/);
  if (qtyMatch) {
    const qty = Number.parseInt(qtyMatch[1]!, 10);
    if (qty > 0 && qty <= 10) {
      return portionRef.defaultG * qty;
    }
  }

  // Default: use medium portion, cross-reference with AI estimate
  // If AI estimate is within 50% of our default, use our default (more accurate)
  // Otherwise, trust the AI (she may have described something unusual)
  const ratio = aiEstimatedGrams / portionRef.defaultG;
  if (ratio >= 0.5 && ratio <= 1.5) {
    return portionRef.defaultG;
  }

  return aiEstimatedGrams;
}
