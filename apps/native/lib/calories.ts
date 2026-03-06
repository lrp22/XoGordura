export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type MacroPresetKey = "moderate" | "lower_carb" | "higher_carb";

export interface MacroSplit {
	proteinPct: number; // 0–100
	fatPct: number;
	carbsPct: number;
}

// ─── Activity multipliers ────────────────────────────────
const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
	sedentary: 1.2,
	light: 1.375,
	moderate: 1.55,
	active: 1.725,
};

// ─── Macro distribution presets ──────────────────────────
export const MACRO_PRESETS: Record<
	MacroPresetKey,
	{ label: string; tag: string; description: string; split: MacroSplit }
> = {
	moderate: {
		label: "Moderada",
		tag: "30/35/35",
		description: "Equilíbrio entre todos os macros",
		split: { proteinPct: 30, fatPct: 35, carbsPct: 35 },
	},
	lower_carb: {
		label: "Low Carb",
		tag: "40/40/20",
		description: "Mais proteína e gordura, menos carbos",
		split: { proteinPct: 40, fatPct: 40, carbsPct: 20 },
	},
	higher_carb: {
		label: "High Carb",
		tag: "30/20/50",
		description: "Mais energia de carboidratos",
		split: { proteinPct: 30, fatPct: 20, carbsPct: 50 },
	},
};

// ─── Calculate macros from a calorie target + split ──────
export function calcMacrosFromSplit(
	calories: number,
	split: MacroSplit,
): { protein: number; fat: number; carbs: number } {
	return {
		protein: Math.round((calories * split.proteinPct) / 100 / 4),
		fat: Math.round((calories * split.fatPct) / 100 / 9),
		carbs: Math.round((calories * split.carbsPct) / 100 / 4),
	};
}

// ─── Reverse: compute calorie total from gram values ─────
export function calcCaloriesFromMacros(
	proteinG: number,
	carbsG: number,
	fatG: number,
): number {
	return Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);
}

// ─── BMR (Mifflin-St Jeor) ──────────────────────────────
export function calcBMR(
	weightKg: number,
	heightCm: number,
	age: number,
	gender: "male" | "female",
): number {
	const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
	return gender === "male" ? base + 5 : base - 161;
}

/**
 * FIX 4: calcAge now checks whether the birthday has passed this year.
 *
 * Since the app stores birthDate as "YYYY-01-01" (only year is collected),
 * birthMonth defaults to 1 (January), which means the age is always exact for
 * the stored data. When a real birth month is available it can be passed in.
 *
 * The old implementation ( currentYear - birthYear ) overestimated age by up
 * to 11 months for users whose birthday hadn't yet occurred in the current year.
 */
export function calcAge(birthYear: number, birthMonth = 1): number {
	const now = new Date();
	const age = now.getFullYear() - birthYear;
	// Subtract 1 if we haven't reached the birth month yet this year
	return now.getMonth() + 1 >= birthMonth ? age : age - 1;
}

// ─── Full goal calculation ───────────────────────────────
export function calcGoals(
	weightKg: number,
	heightCm: number,
	birthYear: number,
	gender: "male" | "female",
	activityLevel: ActivityLevel,
	deficitPercentage: number,
	macroSplit: MacroSplit,
	/** Pass the stored birth month (1-12) when available. Defaults to 1. */
	birthMonth = 1,
) {
	const age = calcAge(birthYear, birthMonth);
	const bmr = calcBMR(weightKg, heightCm, age, gender);
	const tdee = bmr * ACTIVITY_FACTORS[activityLevel];
	const calories = Math.round(tdee * (1 - deficitPercentage));
	const deficit = Math.round(tdee - calories);
	const { protein, fat, carbs } = calcMacrosFromSplit(calories, macroSplit);

	return {
		calories,
		protein,
		carbs,
		fat,
		bmr: Math.round(bmr),
		tdee: Math.round(tdee),
		deficit,
	};
}