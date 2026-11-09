import { AppError } from "../utils/AppError.js";

export function notFoundHandler(req, _res, next) {
  next(AppError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) },
    });
  }

  // Malformed JSON body
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Request body is not valid JSON." } });
  }

  // Prisma known errors
  if (err?.code === "P2002") {
    return res.status(409).json({ error: { code: "CONFLICT", message: "That record already exists." } });
  }
  if (err?.code === "P2025") {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found." } });
  }

  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong on our side. Please try again." } });
}
