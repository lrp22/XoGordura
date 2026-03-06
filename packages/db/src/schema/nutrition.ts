import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// ─── Enums ────────────────────────────────────────────────
export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export const confidenceEnum = pgEnum("confidence_level", [
  "high",
  "medium",
  "low",
]);

export const nutritionSourceEnum = pgEnum("nutrition_source", [
  "taco",
  "fatsecret",
  "web",
  "ai_estimate",
]);

export const glycemicLoadEnum = pgEnum("glycemic_load", [
  "low",
  "medium",
  "high",
]);

export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "light",
  "moderate",
  "active",
]);

export const diabetesTypeEnum = pgEnum("diabetes_type", [
  "type1",
  "type2",
  "gestational",
  "prediabetes",
]);

export const genderEnum = pgEnum("gender", ["male", "female"]);

// ─── User Profile ─────────────────────────────────────────
export const userProfile = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),

  // Personal info
  birthDate: text("birth_date"), // stored as "YYYY-MM-DD"
  gender: genderEnum("gender"),
  heightCm: real("height_cm"),
  currentWeightKg: real("current_weight_kg"),
  goalWeightKg: real("goal_weight_kg"), // FIX 2: was never persisted before

  // Nutrition goals
  dailyCalorieGoal: integer("daily_calorie_goal"),
  dailyProteinGoal: integer("daily_protein_goal"),
  dailyCarbsGoal: integer("daily_carbs_goal"),
  dailyFatGoal: integer("daily_fat_goal"),
  dailySugarLimitG: integer("daily_sugar_limit_g"),

  // Activity & diet settings
  activityLevel: activityLevelEnum("activity_level"),
  /**
   * FIX 3: Store the deficit percentage (e.g. 0.1 or 0.2) chosen during
   * onboarding so that edit-goals can recalculate with the correct deficit
   * instead of always defaulting to 20%.
   */
  deficitPercentage: real("deficit_percentage").default(0.2),

  // Health flags
  hasDiabetes: boolean("has_diabetes").default(false),
  diabetesType: diabetesTypeEnum("diabetes_type"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Meals ────────────────────────────────────────────────
export const meal = pgTable("meal", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  date: text("date").notNull(), // "YYYY-MM-DD"
  mealType: mealTypeEnum("meal_type").notNull(),
  voiceTranscript: text("voice_transcript"),

  // Aggregated totals
  totalCalories: integer("total_calories").notNull().default(0),
  totalProteinG: real("total_protein_g").notNull().default(0),
  totalCarbsG: real("total_carbs_g").notNull().default(0),
  totalFatG: real("total_fat_g").notNull().default(0),
  totalFiberG: real("total_fiber_g").notNull().default(0),
  totalSugarG: real("total_sugar_g").notNull().default(0),

  // Metadata
  confidence: confidenceEnum("confidence").default("medium"),
  aiTip: text("ai_tip"),
  aiRawResponse: text("ai_raw_response"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Meal Items ───────────────────────────────────────────
export const mealItem = pgTable("meal_item", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id")
    .notNull()
    .references(() => meal.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  portion: text("portion"),
  calories: integer("calories").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  carbsG: real("carbs_g").notNull().default(0),
  fatG: real("fat_g").notNull().default(0),
  fiberG: real("fiber_g").notNull().default(0),
  sugarG: real("sugar_g").notNull().default(0),
  glycemicLoad: glycemicLoadEnum("glycemic_load"),
  source: nutritionSourceEnum("source").default("ai_estimate"),
});

// ─── Weight Log ───────────────────────────────────────────
export const weightLog = pgTable(
  "weight_log",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    weightKg: real("weight_kg").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.date)],
);

// ─── Relations ────────────────────────────────────────────
export const mealRelations = relations(meal, ({ many }) => ({
  items: many(mealItem),
}));

export const mealItemRelations = relations(mealItem, ({ one }) => ({
  meal: one(meal, { fields: [mealItem.mealId], references: [meal.id] }),
}));

export const weightLogRelations = relations(weightLog, ({ one }) => ({
  user: one(user, { fields: [weightLog.userId], references: [user.id] }),
}));

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, { fields: [userProfile.userId], references: [user.id] }),
}));
