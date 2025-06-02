/* eslint-disable @typescript-eslint/no-unused-vars */
import { AxiosError } from 'axios';
import { ErrorRequestHandler, Request } from 'express';
import {
  ApiError,
  ApplicationError,
  BatchProcessingError,
  NotFoundError,
  ReportGenerationError,
  ValidationError,
} from '@/modules/core/errors';
import { ErrorResponse } from '@/types';

/* ===================== ERROR EXTRACTION ===================== */

/**
 * Extracts core error information from different error types.
 */
function getErrorInfo(err: unknown) {
  const baseErrorInfo = {
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    message: 'An unknown error occurred',
    details: undefined as unknown,
    field: undefined as string | undefined,
    reportId: undefined as string | undefined,
    batchId: undefined as string | undefined,
  };

  if (!(err instanceof Error)) return baseErrorInfo;

  const enhancedErrorInfo = { ...baseErrorInfo, message: err.message };
  if (err.name === 'TokenExpiredError') {
    enhancedErrorInfo.code = 'TOKEN_EXPIRED';
    enhancedErrorInfo.statusCode = 401;
    enhancedErrorInfo.message = 'Token has expired';
    return enhancedErrorInfo;
  }

  if (err.name === 'JsonWebTokenError') {
    enhancedErrorInfo.code = 'INVALID_TOKEN';
    enhancedErrorInfo.statusCode = 401;
    enhancedErrorInfo.message = 'Invalid authentication token';
    return enhancedErrorInfo;
  }

  if (err instanceof ApplicationError) {
    enhancedErrorInfo.code = err.code;
    enhancedErrorInfo.details = err.details;

    switch (true) {
      case err instanceof NotFoundError:
        enhancedErrorInfo.statusCode = 404;
        break;
      case err instanceof ValidationError:
        enhancedErrorInfo.statusCode = 400;
        enhancedErrorInfo.field = err.field;
        break;
      case err instanceof ApiError:
        enhancedErrorInfo.statusCode = err.statusCode;
        break;
      case err instanceof ReportGenerationError:
        enhancedErrorInfo.statusCode = 422;
        enhancedErrorInfo.reportId = err.reportId;
        break;
      case err instanceof BatchProcessingError:
        enhancedErrorInfo.statusCode = 422;
        enhancedErrorInfo.batchId = err.batchId;
        break;
      default:
        enhancedErrorInfo.statusCode = 500;
    }
  }

  return enhancedErrorInfo;
}

/**
 * Extracts detailed error information from AxiosError safely.
 */
function extractAxiosErrorMessage(error: AxiosError): string {
  const data = error.response?.data as Record<string, unknown> | undefined;
  return (
    (data?.errorMessage as string) ||
    (data?.message as string) ||
    error.message ||
    'API request failed'
  );
}

/**
 * Extracts original error details for logging or propagation.
 */
function extractOriginalErrorDetails(originalError?: unknown): unknown {
  if (originalError instanceof Error) {
    return {
      message: originalError.message,
      stack: originalError.stack,
    };
  }
  return originalError;
}

/* ===================== RESPONSE BUILDING ===================== */

/**
 * Builds a standardized error response structure.
 */
function buildErrorResponse(errorInfo: ReturnType<typeof getErrorInfo>): ErrorResponse {
  const errorData = Object.assign(
    { code: errorInfo.code, message: errorInfo.message },
    errorInfo.details ? { details: errorInfo.details } : {},
    errorInfo.field ? { field: errorInfo.field } : {},
    errorInfo.reportId ? { reportId: errorInfo.reportId } : {},
    errorInfo.batchId ? { batchId: errorInfo.batchId } : {}
  );

  return {
    success: false,
    error: errorData,
    timestamp: new Date().toISOString(),
  };
}

/* ===================== LOGGING ===================== */

/**
 * Creates the object used for logging error information.
 */
function createLogObject(
  err: unknown,
  errorInfo: ReturnType<typeof getErrorInfo>,
  isProd: boolean
) {
  const { code, statusCode, details, field, reportId, batchId } = errorInfo;

  const logObject: Record<string, unknown> = Object.assign(
    { code, statusCode },
    details ? { details } : {},
    field ? { field } : {},
    reportId ? { reportId } : {},
    batchId ? { batchId } : {}
  );

  if (!isProd && err instanceof Error) {
    logObject.stack = err.stack;
  }

  return logObject;
}

/**
 * Logs error information with context.
 */
function logError(
  req: Request,
  errorInfo: ReturnType<typeof getErrorInfo>,
  logObject: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ${req.method} ${req.path} - ${errorInfo.message}`, logObject);
}

/* ===================== EXPRESS ERROR HANDLER ===================== */

/**
 * Global Express error handler.
 */
export const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const errorInfo = getErrorInfo(err);
  const logObject = createLogObject(err, errorInfo, isProd);

  logError(req, errorInfo, logObject);

  const errorResponse = buildErrorResponse(errorInfo);
  res.status(errorInfo.statusCode).json(errorResponse);
};

/* ===================== HELPER FUNCTIONS ===================== */

/**
 * Converts Axios errors to API errors.
 */
export function handleAxiosError(error: unknown): never {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 500;
    const message = extractAxiosErrorMessage(error);
    throw new ApiError(message, status, error.response?.data);
  }

  if (error instanceof Error) {
    throw new ApiError(error.message);
  }

  throw new ApiError('Unknown error occurred');
}

/**
 * Handles report errors with contextual information.
 */
export function handleReportError(
  message: string,
  reportId?: string,
  originalError?: unknown
): never {
  const details = extractOriginalErrorDetails(originalError);
  throw new ReportGenerationError(message, reportId, details);
}
