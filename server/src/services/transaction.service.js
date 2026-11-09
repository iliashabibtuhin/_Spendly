import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { formatDay, parseDay } from "../utils/dates.js";
import { toMajor, toMinor } from "../utils/money.js";

export const categorySelect = { select: { id: true, name: true, color: true, icon: true, type: true } };

/** Shape a DB row for the API. */
export const serializeTransaction = (t) => ({
  id: t.id,
  amount: toMajor(t.amount),
  type: t.type,
  description: t.description,
  date: formatDay(t.date),
  category: t.category,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

const fieldError = (field, message) => AppError.badRequest("Some fields are invalid.", { fields: { [field]: message } });

/** Ensures the category belongs to the user and matches the transaction type. */
async function assertCategory(userId, categoryId, type) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw fieldError("categoryId", "Choose a valid category");
  if (category.type !== type) {
    throw fieldError("categoryId", `This category is for ${category.type.toLowerCase()} transactions`);
  }
}

export async function listTransactions(userId, q) {
  const where = { userId };
  if (q.type) where.type = q.type;
  if (q.categoryId) where.categoryId = q.categoryId;
  if (q.from || q.to) {
    where.date = {};
    if (q.from) where.date.gte = parseDay(q.from);
    if (q.to) where.date.lte = parseDay(q.to);
  }
  if (q.search) {
    // PostgreSQL `contains` is case-sensitive by default; ILIKE keeps search case-insensitive.
    where.OR = [
      { description: { contains: q.search, mode: "insensitive" } },
      { category: { name: { contains: q.search, mode: "insensitive" } } },
    ];
  }

  const orderBy =
    q.sort === "amount"
      ? [{ amount: q.order }, { date: "desc" }]
      : [{ date: q.order }, { createdAt: q.order }];

  const [rows, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: { category: categorySelect },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    items: rows.map(serializeTransaction),
    total,
    page: q.page,
    pageSize: q.pageSize,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

async function findOwned(userId, id) {
  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) throw AppError.notFound("Transaction not found.");
  return tx;
}

export async function getTransaction(userId, id) {
  const tx = await prisma.transaction.findFirst({ where: { id, userId }, include: { category: categorySelect } });
  if (!tx) throw AppError.notFound("Transaction not found.");
  return serializeTransaction(tx);
}

export async function createTransaction(userId, input) {
  await assertCategory(userId, input.categoryId, input.type);
  const tx = await prisma.transaction.create({
    data: {
      userId,
      amount: toMinor(input.amount),
      type: input.type,
      categoryId: input.categoryId,
      description: input.description ?? "",
      date: parseDay(input.date),
    },
    include: { category: categorySelect },
  });
  return serializeTransaction(tx);
}

export async function updateTransaction(userId, id, input) {
  const existing = await findOwned(userId, id);
  const type = input.type ?? existing.type;
  const categoryId = input.categoryId ?? existing.categoryId;
  if (input.type || input.categoryId) await assertCategory(userId, categoryId, type);

  const data = { type, categoryId };
  if (input.amount !== undefined) data.amount = toMinor(input.amount);
  if (input.description !== undefined) data.description = input.description;
  if (input.date !== undefined) data.date = parseDay(input.date);

  const tx = await prisma.transaction.update({ where: { id }, data, include: { category: categorySelect } });
  return serializeTransaction(tx);
}

export async function deleteTransaction(userId, id) {
  const { count } = await prisma.transaction.deleteMany({ where: { id, userId } });
  if (count === 0) throw AppError.notFound("Transaction not found.");
}
