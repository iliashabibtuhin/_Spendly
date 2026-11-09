import * as service from "../services/transaction.service.js";

export async function list(req, res) {
  res.json(await service.listTransactions(req.user.id, req.valid.query));
}

export async function get(req, res) {
  res.json({ transaction: await service.getTransaction(req.user.id, req.valid.params.id) });
}

export async function create(req, res) {
  const transaction = await service.createTransaction(req.user.id, req.valid.body);
  res.status(201).json({ transaction });
}

export async function update(req, res) {
  const transaction = await service.updateTransaction(req.user.id, req.valid.params.id, req.valid.body);
  res.json({ transaction });
}

export async function remove(req, res) {
  await service.deleteTransaction(req.user.id, req.valid.params.id);
  res.status(204).end();
}
