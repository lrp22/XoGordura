import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// ─── User Nutrition Profile ─────────────────────────────
// Extends the auth user with nutrition-specific data.
// One-to-one with the auth `user` table.

export const userProfile = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  birthDate: text("birth_date"), // "1960-03-15" — stored as text for simplicity
  heightCm: real("height_cm"),
  currentWeightKg: real("current_weight_kg"),
  goalWeightKg: real("goal_weight_kg"),
  dailyCalorieGoal: integer("daily_calorie_goal").default(1500),
  activityLevel: text("activity_level").default("sedentary"), // sedentary | light | moderate | active
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ─── Meals ──────────────────────────────────────────────
// Each meal logged by the user (breakfast, lunch, etc.)

export const meal = pgTable(
  "meal",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "2025-01-15"
    mealType: text("meal_type").notNull(), // breakfast | lunch | dinner | snack
    voiceTranscript: text("voice_transcript"),
    aiRawResponse: text("ai_raw_response"),
    totalCalories: integer("total_calories").default(0).notNull(),
    totalProteinG: real("total_protein_g").default(0).notNull(),
    totalCarbsG: real("total_carbs_g").default(0).notNull(),
    totalFatG: real("total_fat_g").default(0).notNull(),
    confidence: text("confidence").default("medium"), // high | medium | low
    aiTip: text("ai_tip"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("meal_user_id_idx").on(table.userId),
    index("meal_date_idx").on(table.date),
    index("meal_user_date_idx").on(table.userId, table.date),
  ],
);

// ─── Meal Items ─────────────────────────────────────────
// Individual food items within a meal (arroz, feijão, etc.)

export const mealItem = pgTable(
  "meal_item",
  {
    id: serial("id").primaryKey(),
    mealId: integer("meal_id")
      .notNull()
      .references(() => meal.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "Arroz branco"
    portion: text("portion"), // "1 escumadeira média"
    calories: integer("calories").default(0).notNull(),
    proteinG: real("protein_g").default(0).notNull(),
    carbsG: real("carbs_g").default(0).notNull(),
    fatG: real("fat_g").default(0).notNull(),
    source: text("source").default("ai_estimate"), // taco | fatsecret | nutritionix | web | ai_estimate
  },
  (table) => [index("meal_item_meal_id_idx").on(table.mealId)],
);

// ─── Weight Log ─────────────────────────────────────────
// Daily weight entries for tracking progress.
// One entry per user per day (enforced by unique constraint).

export const weightLog = pgTable(
  "weight_log",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "2025-01-15"
    weightKg: real("weight_kg").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("weight_log_user_date_unique").on(table.userId, table.date),
    index("weight_log_user_id_idx").on(table.userId),
  ],
);

// ─── Relations ──────────────────────────────────────────
// Note: We don't add relations TO the user table here
// to avoid conflicting with auth.ts userRelations.
// We only define relations FROM our tables pointing back.

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
}));

export const mealRelations = relations(meal, ({ one, many }) => ({
  user: one(user, {
    fields: [meal.userId],
    references: [user.id],
  }),
  items: many(mealItem),
}));

export const mealItemRelations = relations(mealItem, ({ one }) => ({
  meal: one(meal, {
    fields: [mealItem.mealId],
    references: [meal.id],
  }),
}));

export const weightLogRelations = relations(weightLog, ({ one }) => ({
  user: one(user, {
    fields: [weightLog.userId],
    references: [user.id],
  }),
}));
