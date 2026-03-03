export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female",
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export function calcAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function calcGoals(
  weightKg: number,
  heightCm: number,
  birthYear: number,
  gender: "male" | "female",
  activityLevel: ActivityLevel,
  deficitPercentage: number, // Ex: 0.10 ou 0.20
) {
  const age = calcAge(birthYear);
  const bmr = calcBMR(weightKg, heightCm, age, gender);
  const tdee = bmr * ACTIVITY_FACTORS[activityLevel];

  // Calorias com déficit aplicado
  const calories = Math.round(tdee * (1 - deficitPercentage));

  // Proteína: 2.2g por kg (padrão bulking/cutting limpo)
  const protein = Math.round(weightKg * 2.2);

  // Calorias restantes para Gordura e Carbos
  const proteinCalories = protein * 4;
  const remainingCals = Math.max(0, calories - proteinCalories);

  // Split 70% Gordura / 30% Carbos (conforme sua solicitação)
  const fat = Math.round((remainingCals * 0.7) / 9);
  const carbs = Math.round((remainingCals * 0.3) / 4);

  return {
    calories,
    protein,
    carbs,
    fat,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}
