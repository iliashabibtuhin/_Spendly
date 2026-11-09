import { z } from "zod";
import { typeSchema } from "./common.js";

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #4F46E5");
const iconSchema = z.string().regex(/^[a-z-]{1,30}$/, "Invalid icon");

const nameSchema = z.string().trim().min(1, "Enter a name").max(30, "Name must be 30 characters or fewer");

export const createCategorySchema = z.object({
  name: nameSchema,
  type: typeSchema,
  color: colorSchema.default("#6366F1"),
  icon: iconSchema.default("tag"),
});

// No defaults here: Zod 4 applies .default() even inside .partial(), which would
// reset color and icon whenever only the name is changed.
export const updateCategorySchema = z.object({ name: nameSchema, color: colorSchema, icon: iconSchema }).partial();

export const listCategoriesQuery = z.object({ type: typeSchema.optional() });
