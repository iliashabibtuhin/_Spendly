import { z } from "zod";
import { amountSchema, daySchema, typeSchema } from "./common.js";

const description = z.string().trim().max(200, "Description is too long");

const fields = {
  amount: amountSchema,
  type: typeSchema,
  categoryId: z.string().min(1, "Choose a category").max(64),
  description,
  date: daySchema,
};

export const createTransactionSchema = z.object({ ...fields, description: description.default("") });

// Built from the fields without defaults: Zod 4 applies .default() even inside
// .partial(), which would wipe the description on every partial update.
export const updateTransactionSchema = z.object(fields).partial();

export const listTransactionsQuery = z
  .object({
    search: z.string().trim().max(100).optional(),
    type: typeSchema.optional(),
    categoryId: z.string().max(64).optional(),
    from: daySchema.optional(),
    to: daySchema.optional(),
    sort: z.enum(["date", "amount"]).default("date"),
    order: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "Start date must be on or before end date",
    path: ["to"],
  });
