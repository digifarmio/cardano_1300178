export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NMKRError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NMKRError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NMKRAPIError extends NMKRError {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'NMKRAPIError';
    Error.captureStackTrace(this, this.constructor);
  }
}
