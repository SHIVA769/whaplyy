import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return sendError(res, 'Validation Error', 400, messages);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, `Duplicate field value entered for ${field}. Must be unique.`, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token expired.', 401);
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return sendError(res, err.message || 'Internal Server Error', statusCode);
};
