import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { monthRange } from "../utils/dates.js";
import { toMajor, toMinor } from "../utils/money.js";

/** Total expenses for a month, always computed from stored transactions. */
async function monthlySpentMinor(userId, month) {
  const { start, end } = monthRange(month);
  const agg = await prisma.transaction.aggregate({
    where: { userId, type: "EXPENSE", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

export async function getBudgetStatus(userId, month) {
  const [budget, spentMinor] = await Promise.all([
    prisma.budget.findUnique({ where: { userId_month: { userId, month } } }),
    monthlySpentMinor(userId, month),
  ]);
  if (!budget) return { month, amount: null, spent: toMajor(spentMinor), remaining: null, percent: null };

  return {
    month,
    amount: toMajor(budget.amount),
    spent: toMajor(spentMinor),
    remaining: toMajor(budget.amount - spentMinor),
    percent: Math.round((spentMinor / budget.amount) * 1000) / 10,
  };
}

export async function upsertBudget(userId, month, amount) {
  const minor = toMinor(amount);
  await prisma.budget.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, amount: minor },
    update: { amount: minor },
  });
  return getBudgetStatus(userId, month);
}

export async function deleteBudget(userId, month) {
  const { count } = await prisma.budget.deleteMany({ where: { userId, month } });
  if (count === 0) throw AppError.notFound("No budget is set for this month.");
}

/** Recent budgets with spending, newest first. */
export async function listBudgets(userId) {
  const budgets = await prisma.budget.findMany({ where: { userId }, orderBy: { month: "desc" }, take: 12 });
  return Promise.all(budgets.map((b) => getBudgetStatus(userId, b.month)));
}
