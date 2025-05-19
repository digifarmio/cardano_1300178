export class ApplicationError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly field?: string,
    details?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with ID ${id} not found` : `${resource} not found`, 'NOT_FOUND', {
      resource,
      id,
    });
  }
}

export class ApiError extends ApplicationError {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly originalError?: unknown
  ) {
    super(message, 'API_ERROR', originalError);
  }
}

export class ReportGenerationError extends ApplicationError {
  constructor(
    message: string,
    public readonly reportId?: string,
    details?: unknown
  ) {
    super(message, 'REPORT_GENERATION_ERROR', details);
  }
}

export class BatchProcessingError extends ApplicationError {
  constructor(
    message: string,
    public readonly batchId?: string,
    details?: unknown
  ) {
    super(message, 'BATCH_PROCESSING_ERROR', details);
  }
}
