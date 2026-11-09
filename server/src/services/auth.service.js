import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { createDefaultCategories } from "./category.service.js";

const BCRYPT_ROUNDS = 12;
const publicUser = { id: true, name: true, email: true, currency: true, createdAt: true };

const signToken = (user) =>
  jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export async function register({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw AppError.badRequest("Some fields are invalid.", {
      fields: { email: "An account with this email already exists" },
    });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { name, email, passwordHash }, select: publicUser });
    await createDefaultCategories(created.id, tx);
    return created;
  });

  return { user, token: signToken(user) };
}

// Compared against when the email is unknown, so response timing doesn't reveal
// which emails are registered.
const DUMMY_HASH = bcrypt.hashSync("spendly-timing-guard", BCRYPT_ROUNDS);

export async function login({ email, password }) {
  const record = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, record?.passwordHash ?? DUMMY_HASH);
  if (!record || !ok) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  const { id, name, currency, createdAt } = record;
  const user = { id, name, email: record.email, currency, createdAt };
  return { user, token: signToken(user) };
}

export function getProfile(userId) {
  return prisma.user.findUnique({ where: { id: userId }, select: publicUser });
}
