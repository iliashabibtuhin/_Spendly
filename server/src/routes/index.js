import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as auth from "../controllers/auth.controller.js";
import * as budgets from "../controllers/budget.controller.js";
import * as categories from "../controllers/category.controller.js";
import * as transactions from "../controllers/transaction.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";
import { monthParam, summaryQuery, upsertBudgetSchema } from "../validators/budget.validators.js";
import {
  createCategorySchema,
  listCategoriesQuery,
  updateCategorySchema,
} from "../validators/category.validators.js";
import { idParam } from "../validators/common.js";
import {
  createTransactionSchema,
  listTransactionsQuery,
  updateTransactionSchema,
} from "../validators/transaction.validators.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many attempts. Try again in a few minutes." } },
});

export const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

// Auth
router.post("/auth/register", authLimiter, validate(registerSchema), auth.register);
router.post("/auth/login", authLimiter, validate(loginSchema), auth.login);
router.get("/auth/me", requireAuth, auth.me);

// Everything below requires a signed-in user and is scoped to that user.
router.use(requireAuth);

router.get("/summary", validate(summaryQuery, "query"), budgets.summary);

router.get("/transactions", validate(listTransactionsQuery, "query"), transactions.list);
router.post("/transactions", validate(createTransactionSchema), transactions.create);
router.get("/transactions/:id", validate(idParam, "params"), transactions.get);
router.patch("/transactions/:id", validate(idParam, "params"), validate(updateTransactionSchema), transactions.update);
router.delete("/transactions/:id", validate(idParam, "params"), transactions.remove);

router.get("/categories", validate(listCategoriesQuery, "query"), categories.list);
router.post("/categories", validate(createCategorySchema), categories.create);
router.patch("/categories/:id", validate(idParam, "params"), validate(updateCategorySchema), categories.update);
router.delete("/categories/:id", validate(idParam, "params"), categories.remove);

router.get("/budgets", budgets.list);
router.get("/budgets/:month", validate(monthParam, "params"), budgets.get);
router.put("/budgets/:month", validate(monthParam, "params"), validate(upsertBudgetSchema), budgets.upsert);
router.delete("/budgets/:month", validate(monthParam, "params"), budgets.remove);
