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

export const profileRouter = {
  // ─── Get profile (returns null if not set up) ─────
  get: protectedProcedure.handler(async ({ context }) => {
    const result = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, context.session.user.id),
    });

    return result ?? null;
  }),

  // ─── Create or update profile ─────────────────────
  upsert: protectedProcedure
    .input(
      z.object({
        birthDate: z.string().optional(),
        heightCm: z.number().min(50).max(250).optional(),
        currentWeightKg: z.number().min(20).max(500).optional(),
        goalWeightKg: z.number().min(20).max(500).optional(),
        dailyCalorieGoal: z.number().int().min(800).max(5000).optional(),
        activityLevel: activityLevelSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const result = await db
        .insert(userProfile)
        .values({
          userId,
          birthDate: input.birthDate,
          heightCm: input.heightCm,
          currentWeightKg: input.currentWeightKg,
          goalWeightKg: input.goalWeightKg,
          dailyCalorieGoal: input.dailyCalorieGoal,
          activityLevel: input.activityLevel,
        })
        .onConflictDoUpdate({
          target: userProfile.userId,
          set: {
            ...(input.birthDate !== undefined && {
              birthDate: input.birthDate,
            }),
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
            ...(input.activityLevel !== undefined && {
              activityLevel: input.activityLevel,
            }),
          },
        })
        .returning();

      return result[0];
    }),
};
