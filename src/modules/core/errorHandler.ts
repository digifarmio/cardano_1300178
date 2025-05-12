import { ErrorRequestHandler } from 'express';
import { NMKRAPIError, NotFoundError } from '../../modules/core/errors';

export const globalErrorHandler: ErrorRequestHandler = (err, _req, res) => {
  if (err instanceof NotFoundError) {
    console.error(err.message);
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: err.message,
    });
    return;
  }

  if (err instanceof NMKRAPIError) {
    console.error(`API Error ${err.statusCode}: ${err.message}`, err.details);
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
      message: err.details,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error occurred';
  console.error('Internal Server Error', { error: message });
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message,
  });
};
