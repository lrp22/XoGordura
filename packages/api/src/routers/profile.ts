import { db } from "@XoGordura/db";
import { userProfile } from "@XoGordura/db/schema/nutrition";
import { eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure } from "../index";

const activityLevelSchema = z.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
]);

const diabetesTypeSchema = z.enum([
  "type1",
  "type2",
  "gestational",
  "prediabetes",
]);

export const profileRouter = {
  get: protectedProcedure.handler(async ({ context }) => {
    const result = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, context.session.user.id),
    });

    return result ?? null;
  }),

  upsert: protectedProcedure
    .input(
      z.object({
        birthDate: z.string().optional(),
        gender: z.enum(["male", "female"]).optional(),
        heightCm: z.number().min(50).max(250).optional(),
        currentWeightKg: z.number().min(20).max(500).optional(),
        // FIX 2: goalWeightKg is now accepted and persisted
        goalWeightKg: z.number().min(20).max(500).optional(),
        dailyCalorieGoal: z.number().int().min(800).max(5000).optional(),
        dailyProteinGoal: z.number().int().min(0).optional(),
        dailyCarbsGoal: z.number().int().min(0).optional(),
        dailyFatGoal: z.number().int().min(0).optional(),
        dailySugarLimitG: z
          .number()
          .int()
          .min(0)
          .max(200)
          .optional()
          .nullable(),
        activityLevel: activityLevelSchema.optional(),
        // FIX 3: deficitPercentage is now accepted and persisted so that
        // edit-goals can recalculate with the user's original choice
        deficitPercentage: z.number().min(0.05).max(0.5).optional(),
        hasDiabetes: z.boolean().optional(),
        diabetesType: diabetesTypeSchema.optional().nullable(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const result = await db
        .insert(userProfile)
        .values({
          userId,
          birthDate: input.birthDate,
          gender: input.gender,
          heightCm: input.heightCm,
          currentWeightKg: input.currentWeightKg,
          goalWeightKg: input.goalWeightKg,
          dailyCalorieGoal: input.dailyCalorieGoal,
          dailyProteinGoal: input.dailyProteinGoal,
          dailyCarbsGoal: input.dailyCarbsGoal,
          dailyFatGoal: input.dailyFatGoal,
          dailySugarLimitG: input.dailySugarLimitG,
          activityLevel: input.activityLevel,
          deficitPercentage: input.deficitPercentage,
          hasDiabetes: input.hasDiabetes,
          diabetesType: input.diabetesType,
        })
        .onConflictDoUpdate({
          target: userProfile.userId,
          set: {
            ...(input.birthDate !== undefined && {
              birthDate: input.birthDate,
            }),
            ...(input.gender !== undefined && { gender: input.gender }),
            ...(input.heightCm !== undefined && {
              heightCm: input.heightCm,
            }),
            ...(input.currentWeightKg !== undefined && {
              currentWeightKg: input.currentWeightKg,
            }),
            ...(input.goalWeightKg !== undefined && {
              goalWeightKg: input.goalWeightKg,
            }),
            ...(input.dailyCalorieGoal !== undefined && {
              dailyCalorieGoal: input.dailyCalorieGoal,
            }),
            ...(input.dailyProteinGoal !== undefined && {
              dailyProteinGoal: input.dailyProteinGoal,
            }),
            ...(input.dailyCarbsGoal !== undefined && {
              dailyCarbsGoal: input.dailyCarbsGoal,
            }),
            ...(input.dailyFatGoal !== undefined && {
              dailyFatGoal: input.dailyFatGoal,
            }),
            ...(input.dailySugarLimitG !== undefined && {
              dailySugarLimitG: input.dailySugarLimitG,
            }),
            ...(input.activityLevel !== undefined && {
              activityLevel: input.activityLevel,
            }),
            ...(input.deficitPercentage !== undefined && {
              deficitPercentage: input.deficitPercentage,
            }),
            ...(input.hasDiabetes !== undefined && {
              hasDiabetes: input.hasDiabetes,
            }),
            ...(input.diabetesType !== undefined && {
              diabetesType: input.diabetesType,
            }),
            updatedAt: new Date(),
          },
        })
        .returning();

      return result[0];
    }),
};
