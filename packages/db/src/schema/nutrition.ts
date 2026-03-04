import { relations } from "drizzle-orm";
import {
  boolean,
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
export const userProfile = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  birthDate: text("birth_date"),
  gender: text("gender").default("female"),
  heightCm: real("height_cm"),
  currentWeightKg: real("current_weight_kg"),
  goalWeightKg: real("goal_weight_kg"),
  dailyCalorieGoal: integer("daily_calorie_goal").default(1500),
  dailyProteinGoal: integer("daily_protein_goal").default(100),
  dailyCarbsGoal: integer("daily_carbs_goal").default(150),
  dailyFatGoal: integer("daily_fat_goal").default(50),
  dailySugarLimitG: integer("daily_sugar_limit_g"), // null = not tracking
  activityLevel: text("activity_level").default("sedentary"),
  // ── Diabetes fields ─────────────────────────
  hasDiabetes: boolean("has_diabetes").default(false),
  diabetesType: text("diabetes_type"), // "type1" | "type2" | "gestational" | "prediabetes"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ─── Meals ──────────────────────────────────────────────
export const meal = pgTable(
  "meal",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    mealType: text("meal_type").notNull(),
    voiceTranscript: text("voice_transcript"),
    aiRawResponse: text("ai_raw_response"),
    totalCalories: integer("total_calories").default(0).notNull(),
    totalProteinG: real("total_protein_g").default(0).notNull(),
    totalCarbsG: real("total_carbs_g").default(0).notNull(),
    totalFatG: real("total_fat_g").default(0).notNull(),
    totalFiberG: real("total_fiber_g").default(0).notNull(),
    totalSugarG: real("total_sugar_g").default(0).notNull(),
    confidence: text("confidence").default("medium"),
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
export const mealItem = pgTable(
  "meal_item",
  {
    id: serial("id").primaryKey(),
    mealId: integer("meal_id")
      .notNull()
      .references(() => meal.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    portion: text("portion"),
    calories: integer("calories").default(0).notNull(),
    proteinG: real("protein_g").default(0).notNull(),
    carbsG: real("carbs_g").default(0).notNull(),
    fatG: real("fat_g").default(0).notNull(),
    fiberG: real("fiber_g").default(0).notNull(),
    sugarG: real("sugar_g").default(0).notNull(),
    glycemicLoad: text("glycemic_load"), // "low" | "medium" | "high"
    source: text("source").default("ai_estimate"),
  },
  (table) => [index("meal_item_meal_id_idx").on(table.mealId)],
);

// ─── Weight Log ─────────────────────────────────────────
export const weightLog = pgTable(
  "weight_log",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    weightKg: real("weight_kg").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("weight_log_user_date_unique").on(table.userId, table.date),
    index("weight_log_user_id_idx").on(table.userId),
  ],
);

// ─── Relations ──────────────────────────────────────────
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
