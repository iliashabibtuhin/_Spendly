import { prisma } from "../lib/prisma.js";
import { monthRange, shiftMonth } from "../utils/dates.js";
import { toMajor } from "../utils/money.js";
import { getBudgetStatus } from "./budget.service.js";
import { categorySelect, serializeTransaction } from "./transaction.service.js";

const TREND_MONTHS = 6;

/**
 * Dashboard summary for one month. Every figure is derived from the user's
 * transactions in the database; nothing is accepted from the client.
 */
export async function getMonthlySummary(userId, month) {
  const { start, end } = monthRange(month);
  const inMonth = { userId, date: { gte: start, lt: end } };
  const trendStart = monthRange(shiftMonth(month, -(TREND_MONTHS - 1))).start;

  const [byType, count, allTime, byCategory, trendRows, recent, budget] = await Promise.all([
    prisma.transaction.groupBy({ by: ["type"], where: inMonth, _sum: { amount: true } }),
    prisma.transaction.count({ where: inMonth }),
    prisma.transaction.groupBy({ by: ["type"], where: { userId }, _sum: { amount: true } }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { ...inMonth, type: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: trendStart, lt: end } },
      select: { date: true, type: true, amount: true },
    }),
    prisma.transaction.findMany({
      where: inMonth,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: { category: categorySelect },
    }),
    getBudgetStatus(userId, month),
  ]);

  const sumOf = (rows, type) => rows.find((r) => r.type === type)?._sum.amount ?? 0;
  const income = sumOf(byType, "INCOME");
  const expense = sumOf(byType, "EXPENSE");

  // Expense breakdown by category
  const categories = await prisma.category.findMany({
    where: { userId, id: { in: byCategory.map((c) => c.categoryId) } },
    select: { id: true, name: true, color: true, icon: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const breakdown = byCategory
    .map((row) => ({
      ...catMap.get(row.categoryId),
      total: toMajor(row._sum.amount),
      percent: expense ? Math.round((row._sum.amount / expense) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Income vs expense per month, with empty months filled with zeros
  const buckets = new Map();
  for (let i = TREND_MONTHS - 1; i >= 0; i--) buckets.set(shiftMonth(month, -i), { income: 0, expense: 0 });
  for (const row of trendRows) {
    const bucket = buckets.get(row.date.toISOString().slice(0, 7));
    if (bucket) bucket[row.type === "INCOME" ? "income" : "expense"] += row.amount;
  }
  const trend = [...buckets].map(([m, v]) => ({ month: m, income: toMajor(v.income), expense: toMajor(v.expense) }));

  return {
    month,
    totals: {
      income: toMajor(income),
      expense: toMajor(expense),
      net: toMajor(income - expense),
      count,
      balance: toMajor(sumOf(allTime, "INCOME") - sumOf(allTime, "EXPENSE")),
    },
    budget,
    breakdown,
    trend,
    recent: recent.map(serializeTransaction),
  };
}
