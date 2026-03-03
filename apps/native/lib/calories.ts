export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

// ─── Mifflin-St Jeor (Female) ────────────────────────────
// BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
export function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calcTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

// Gentle 400 kcal deficit, minimum 1200 for women, rounded to nearest 50
export function calcDailyGoal(tdee: number): number {
  const deficit = 400;
  const goal = tdee - deficit;
  const minimum = 1200;
  return Math.max(minimum, Math.round(goal / 50) * 50);
}

export function calcAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function calcGoalFromInputs(
  weightKg: number,
  heightCm: number,
  birthYear: number,
  activityLevel: ActivityLevel,
): number {
  const age = calcAge(birthYear);
  const bmr = calcBMR(weightKg, heightCm, age);
  const tdee = calcTDEE(bmr, activityLevel);
  return calcDailyGoal(tdee);
}
