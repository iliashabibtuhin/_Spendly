import * as budgetService from "../services/budget.service.js";
import * as summaryService from "../services/summary.service.js";
import { currentMonth } from "../utils/dates.js";

export async function list(req, res) {
  res.json({ budgets: await budgetService.listBudgets(req.user.id) });
}

export async function get(req, res) {
  res.json({ budget: await budgetService.getBudgetStatus(req.user.id, req.valid.params.month) });
}

export async function upsert(req, res) {
  const budget = await budgetService.upsertBudget(req.user.id, req.valid.params.month, req.valid.body.amount);
  res.json({ budget });
}

export async function remove(req, res) {
  await budgetService.deleteBudget(req.user.id, req.valid.params.month);
  res.status(204).end();
}

export async function summary(req, res) {
  const month = req.valid.query.month ?? currentMonth();
  res.json(await summaryService.getMonthlySummary(req.user.id, month));
}
