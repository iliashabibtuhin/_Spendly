import { AppError } from "../utils/AppError.js";

/**
 * Validates req[source] against a Zod schema and stores the parsed result on
 * req.valid[source]. Unknown keys are stripped by the schemas themselves.
 */
export const validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }
    return next(AppError.badRequest("Some fields are invalid.", { fields }));
  }
  req.valid ??= {};
  req.valid[source] = result.data;
  next();
};
