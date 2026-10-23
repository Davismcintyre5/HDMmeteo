const { ApiError } = require('../../utils/apiError');

function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    throw ApiError.badRequest('VALIDATION_ERROR', 'Invalid input', details);
  }
  return result.data;
}

function validateBody(schema) {
  return function (req, res, next) {
    try {
      req.body = parse(schema, req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

function validateQuery(schema) {
  return function (req, res, next) {
    try {
      req.query = parse(schema, req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validateBody, validateQuery };