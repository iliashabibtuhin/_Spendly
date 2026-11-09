import * as service from "../services/category.service.js";

export async function list(req, res) {
  res.json({ categories: await service.listCategories(req.user.id, req.valid.query) });
}

export async function create(req, res) {
  const category = await service.createCategory(req.user.id, req.valid.body);
  res.status(201).json({ category });
}

export async function update(req, res) {
  const category = await service.updateCategory(req.user.id, req.valid.params.id, req.valid.body);
  res.json({ category });
}

export async function remove(req, res) {
  await service.deleteCategory(req.user.id, req.valid.params.id);
  res.status(204).end();
}
