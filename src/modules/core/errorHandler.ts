import { NMKRAPIError, NotFoundError, ValidationError } from '@/modules/core/errors';
import { AxiosError } from 'axios';
import { ErrorRequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    error: err.name,
    message: err.message,
    ...(err instanceof NMKRAPIError && {
      status: err.statusCode,
      details: err.details,
      originalResponse: JSON.stringify(err.details, null, 2),
    }),
    ...(err instanceof ValidationError && { field: err.field }),
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  if (err instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: err.message,
    });
    return;
  }

  if (err instanceof NMKRAPIError) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: 'Service Error',
      message: err.message,
      ...(process.env.NODE_ENV !== 'production' && { details: err.details }),
    });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      ...(err.field && { field: err.field }),
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal Error',
    message: 'An unexpected error occurred',
  });
};

export function handleAxiosError(error: unknown): never {
  if (error instanceof AxiosError) {
    const message =
      error.response?.data?.errorMessage || // NMKR error format
      error.response?.data?.message || // Standard API error format
      error.message; // Fallback to generic message
    throw new NMKRAPIError(message, error.response?.status, error.response?.data);
  }

  if (error instanceof Error) {
    throw new NMKRAPIError(error.message);
  }

  throw new NMKRAPIError('Unknown error occurred');
}
