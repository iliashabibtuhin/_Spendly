import * as authService from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";

export async function register(req, res) {
  const result = await authService.register(req.valid.body);
  res.status(201).json(result);
}

export async function login(req, res) {
  const result = await authService.login(req.valid.body);
  res.json(result);
}

export async function me(req, res) {
  const user = await authService.getProfile(req.user.id);
  if (!user) throw AppError.unauthorized();
  res.json({ user });
}
