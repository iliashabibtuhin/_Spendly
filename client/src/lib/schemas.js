// Client-side validation for instant feedback. The server validates everything
// again and is the source of truth.
import { z } from "zod";

const amount = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Enter a number with up to 2 decimals")
  .refine((v) => Number(v) > 0, "Amount must be greater than 0")
  .refine((v) => Number(v) <= 1_000_000_000, "Amount is too large");

// Trimmed before the format check so a trailing space from autofill isn't an error.
const email = z.string().trim().pipe(z.email("Enter a valid email address"));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name is too long"),
    email,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .regex(/[A-Za-z]/, "Password must contain a letter")
      .regex(/\d/, "Password must contain a number"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount,
  categoryId: z.string().min(1, "Choose a category"),
  date: z.iso.date("Choose a date"),
  description: z.string().trim().max(200, "Description is too long"),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(30, "Name must be 30 characters or fewer"),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string(),
  icon: z.string(),
});

export const budgetSchema = z.object({ amount });

/** Runs a schema and returns { data } or { errors: { field: message } }. */
export function check(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data };
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return { errors };
}
