const AppError = require('../utils/AppError');

/**
 * Validates request body/query/params using a Zod schema.
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return next(new AppError('Validation failed', 400, details));
  }
  req[source] = result.data;
  next();
};

module.exports = validate;
