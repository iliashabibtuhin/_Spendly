import { z } from "zod";

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like YYYY-MM");

export const daySchema = z.iso.date("Date must look like YYYY-MM-DD");

export const typeSchema = z.enum(["INCOME", "EXPENSE"], "Type must be INCOME or EXPENSE");

/**
 * Positive money amount with at most 2 decimal places. Accepts a number or a
 * numeric string; anything else (booleans, null, "") is rejected rather than
 * coerced, so `true` can't become 1.
 */
export const amountSchema = z.preprocess(
  (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
  z
    .number("Amount must be a number")
    .positive("Amount must be greater than 0")
    .max(1_000_000_000, "Amount is too large")
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Use at most 2 decimal places"),
);

export const idParam = z.object({ id: z.string().min(1).max(64) });
