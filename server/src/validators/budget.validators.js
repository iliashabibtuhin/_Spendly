import { z } from "zod";
import { amountSchema, monthSchema } from "./common.js";

export const monthParam = z.object({ month: monthSchema });
export const upsertBudgetSchema = z.object({ amount: amountSchema });
export const summaryQuery = z.object({ month: monthSchema.optional() });
