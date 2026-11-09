import { z } from "zod";

// Trim before checking the format: z.email().trim() validates first, so an
// address with a trailing space (common from mobile keyboards) would fail.
const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(254));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name is too long"),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password").max(72),
});
