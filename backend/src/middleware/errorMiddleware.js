export const notFound = (req, res, next) => {
  const error = new Error(`Not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const isValidationError = err.name === 'ValidationError';
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  const validationErrors = isValidationError
    ? Object.values(err.errors || {}).map((error) => error.message)
    : undefined;

  res.status(statusCode).json({
    message: validationErrors?.[0] || err.message || 'Something went wrong',
    errors: validationErrors,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
