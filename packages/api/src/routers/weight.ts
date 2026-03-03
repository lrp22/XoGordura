import { ORPCError } from "@orpc/server";
import { db } from "@XoGordura/db";
import { weightLog } from "@XoGordura/db/schema/nutrition";
import { and, asc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure } from "../index";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const weightRouter = {
  // ─── Get full weight history (for chart) ──────────
  getHistory: protectedProcedure.handler(async ({ context }) => {
    return await db
      .select({
        id: weightLog.id,
        date: weightLog.date,
        weightKg: weightLog.weightKg,
      })
      .from(weightLog)
      .where(eq(weightLog.userId, context.session.user.id))
      .orderBy(asc(weightLog.date));
  }),

  // ─── Log weight (upsert — one entry per day) ──────
  log: protectedProcedure
    .input(
      z.object({
        date: dateString,
        weightKg: z.number().min(20).max(500),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      const result = await db
        .insert(weightLog)
        .values({
          userId,
          date: input.date,
          weightKg: input.weightKg,
        })
        .onConflictDoUpdate({
          target: [weightLog.userId, weightLog.date],
          set: { weightKg: input.weightKg },
        })
        .returning();

      return result[0];
    }),

  // ─── Delete a weight entry ────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const result = await db
        .delete(weightLog)
        .where(
          and(
            eq(weightLog.id, input.id),
            eq(weightLog.userId, context.session.user.id),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Registro não encontrado",
        });
      }

      return { success: true };
    }),
};
