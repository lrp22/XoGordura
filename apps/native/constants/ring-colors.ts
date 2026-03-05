// constants/ring-colors.ts
// ─────────────────────────────────────────────────────────────
// Single source of truth for all SVG ring colors in the app.
// Keep in sync with the --ring-* variables in globals.css.
// ─────────────────────────────────────────────────────────────

export const ringColors = {
  light: {
    // Calorie ring
    track: "#809ed8",
    success: "#22c55e",
    danger: "#ef4444",
    // Macro rings
    protein: "#3B82F6",
    fat: "#F59E0B",
    carbs: "#8B5CF6",
    sugar: "#E53935",
    fiber: "#4CAF50",
    netCarbs: "#EC4899",
  },
  dark: {
    // Calorie ring
    track: "#374151",
    success: "#10b981",
    danger: "#f87171",
    // Macro rings
    protein: "#60A5FA",
    fat: "#FBD34D",
    carbs: "#A78BFA",
    sugar: "#F87171",
    fiber: "#34D399",
    netCarbs: "#F472B6",
  },
} as const;
