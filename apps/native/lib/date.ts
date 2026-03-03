// Brazil is UTC-3. Using local timezone avoids
// late-night dates rolling to the wrong day.

export function getLocalToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDatePtBr(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
};

const MEAL_TYPE_EMOJIS: Record<string, string> = {
  breakfast: "☀️",
  lunch: "🌤️",
  dinner: "🌙",
  snack: "🍎",
};

export function getMealTypeLabel(type: string): string {
  return MEAL_TYPE_LABELS[type] ?? type;
}

export function getMealTypeEmoji(type: string): string {
  return MEAL_TYPE_EMOJIS[type] ?? "🍽️";
}
