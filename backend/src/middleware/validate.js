import ApiError from '../utils/ApiError.js';

// Usage: router.post('/route', validate(schema), controller)
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field:   e.path.join('.'),
      message: e.message,
    }));
    return next(new ApiError(400, 'Validation failed', errors));
  }
  req.body = result.data; // use the parsed + sanitized data
  next();
};

export default validate;