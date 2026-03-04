import { ORPCError } from "@orpc/server";
import { db } from "@XoGordura/db";
import { meal, mealItem } from "@XoGordura/db/schema/nutrition";
import { and, desc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure } from "../index";
import { analyzeMeal } from "../nutrition";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
const confidenceSchema = z.enum(["high", "medium", "low"]);
const sourceSchema = z.enum(["taco", "fatsecret", "web", "ai_estimate"]);

const mealItemInput = z.object({
  name: z.string().min(1),
  portion: z.string().optional(),
  calories: z.number().int().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  source: sourceSchema.optional().default("ai_estimate"),
});

export const mealRouter = {
  // ─── AI meal analysis (Step 2 — the core feature) ─
  analyze: protectedProcedure
    .input(
      z.object({
        voiceTranscript: z.string().min(3, "Descrição muito curta").max(1000),
      }),
    )
    .handler(async ({ input }) => {
      try {
        return await analyzeMeal(input.voiceTranscript);
      } catch (error) {
        console.error("[meal.analyze] Pipeline error:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message:
            error instanceof Error
              ? error.message
              : "Erro ao analisar refeição",
        });
      }
    }),

  // ─── Get all meals for a specific date ────────────
  getByDate: protectedProcedure
    .input(z.object({ date: dateString }))
    .handler(async ({ input, context }) => {
      return await db.query.meal.findMany({
        where: and(
          eq(meal.userId, context.session.user.id),
          eq(meal.date, input.date),
        ),
        with: { items: true },
        orderBy: [desc(meal.createdAt)],
      });
    }),

  // ─── Get single meal by ID ────────────────────────
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const result = await db.query.meal.findFirst({
        where: and(
          eq(meal.id, input.id),
          eq(meal.userId, context.session.user.id),
        ),
        with: { items: true },
      });

      if (!result) {
        throw new ORPCError("NOT_FOUND", {
          message: "Refeição não encontrada",
        });
      }

      return result;
    }),

  // ─── Create meal with items (after confirm) ───────
  create: protectedProcedure
    .input(
      z.object({
        date: dateString,
        mealType: mealTypeSchema,
        voiceTranscript: z.string().optional(),
        items: z.array(mealItemInput).min(1),
        totalCalories: z.number().int().min(0),
        totalProteinG: z.number().min(0),
        totalCarbsG: z.number().min(0),
        totalFatG: z.number().min(0),
        confidence: confidenceSchema.optional().default("medium"),
        aiTip: z.string().optional(),
        aiRawResponse: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const insertedMeals = await db
        .insert(meal)
        .values({
          userId,
          date: input.date,
          mealType: input.mealType,
          voiceTranscript: input.voiceTranscript,
          totalCalories: input.totalCalories,
          totalProteinG: input.totalProteinG,
          totalCarbsG: input.totalCarbsG,
          totalFatG: input.totalFatG,
          confidence: input.confidence,
          aiTip: input.aiTip,
          aiRawResponse: input.aiRawResponse,
        })
        .returning();

      const newMeal = insertedMeals[0];
      if (!newMeal) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Falha ao salvar refeição",
        });
      }

      await db.insert(mealItem).values(
        input.items.map((item) => ({
          mealId: newMeal.id,
          name: item.name,
          portion: item.portion,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
          source: item.source,
        })),
      );

      return await db.query.meal.findFirst({
        where: eq(meal.id, newMeal.id),
        with: { items: true },
      });
    }),

  // ─── Delete a meal ────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const result = await db
        .delete(meal)
        .where(
          and(eq(meal.id, input.id), eq(meal.userId, context.session.user.id)),
        )
        .returning();

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Refeição não encontrada",
        });
      }

      return { success: true };
    }),
};
