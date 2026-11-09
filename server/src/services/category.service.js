import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

export const DEFAULT_CATEGORIES = [
  { name: "Food", type: "EXPENSE", color: "#F97316", icon: "utensils" },
  { name: "Transport", type: "EXPENSE", color: "#3B82F6", icon: "bus" },
  { name: "Shopping", type: "EXPENSE", color: "#EC4899", icon: "shopping-bag" },
  { name: "Bills", type: "EXPENSE", color: "#EAB308", icon: "receipt" },
  { name: "Health", type: "EXPENSE", color: "#EF4444", icon: "heart-pulse" },
  { name: "Education", type: "EXPENSE", color: "#8B5CF6", icon: "graduation-cap" },
  { name: "Entertainment", type: "EXPENSE", color: "#06B6D4", icon: "clapperboard" },
  { name: "Salary", type: "INCOME", color: "#10B981", icon: "briefcase" },
  { name: "Freelance", type: "INCOME", color: "#14B8A6", icon: "laptop" },
  { name: "Business", type: "INCOME", color: "#6366F1", icon: "store" },
  { name: "Investment", type: "INCOME", color: "#22C55E", icon: "trending-up" },
  { name: "Other", type: "INCOME", color: "#64748B", icon: "coins" },
];

/** Creates the default category set for a user. Accepts a transaction client. */
export function createDefaultCategories(userId, db = prisma) {
  return db.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId, isDefault: true })),
  });
}

export async function listCategories(userId, { type } = {}) {
  const categories = await prisma.category.findMany({
    where: { userId, ...(type && { type }) },
    orderBy: [{ type: "asc" }, { isDefault: "desc" }, { name: "asc" }],
    include: { _count: { select: { transactions: true } } },
  });
  return categories.map(({ _count, ...c }) => ({ ...c, transactionCount: _count.transactions }));
}

async function findOwned(userId, id) {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw AppError.notFound("Category not found.");
  return category;
}

async function assertNameFree(userId, type, name, exceptId) {
  const clash = await prisma.category.findFirst({
    where: { userId, type, name, ...(exceptId && { NOT: { id: exceptId } }) },
  });
  if (clash) {
    throw AppError.badRequest("Some fields are invalid.", {
      fields: { name: `You already have a category named "${name}"` },
    });
  }
}

export async function createCategory(userId, input) {
  await assertNameFree(userId, input.type, input.name);
  return prisma.category.create({ data: { ...input, userId, isDefault: false } });
}

export async function updateCategory(userId, id, input) {
  const category = await findOwned(userId, id);
  if (category.isDefault) throw AppError.badRequest("Default categories can't be edited.");
  if (input.name && input.name !== category.name) {
    await assertNameFree(userId, category.type, input.name, id);
  }
  return prisma.category.update({ where: { id }, data: input });
}

export async function deleteCategory(userId, id) {
  const category = await findOwned(userId, id);
  if (category.isDefault) throw AppError.badRequest("Default categories can't be deleted.");
  const used = await prisma.transaction.count({ where: { categoryId: id, userId } });
  if (used > 0) {
    throw AppError.conflict(
      `This category is used by ${used} transaction${used === 1 ? "" : "s"}. Move or delete them first.`,
    );
  }
  await prisma.category.delete({ where: { id } });
}
