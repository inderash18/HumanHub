export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errors = null;

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = 'Resource not found';
    statusCode = 404;
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = 'Data Validation Error';
    statusCode = 400;
    errors = Object.values(err.errors).map(val => val.message);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
