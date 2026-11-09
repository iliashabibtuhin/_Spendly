import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

/** Requires a valid Bearer token and attaches { id, email, name } as req.user. */
export async function requireAuth(req, _res, next) {
  const header = req.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw AppError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw AppError.unauthorized("Your session has expired. Please sign in again.");
  }

  // Confirm the user still exists (e.g. token issued before an account deletion).
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, currency: true },
  });
  if (!user) throw AppError.unauthorized();

  req.user = user;
  next();
}
