export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(message: string, statusCode: number, isOperational = true, errorCode?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errorCode = 'BAD_REQUEST') {
    super(message, 400, true, errorCode);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    super(message, 401, true, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    super(message, 403, true, errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found', errorCode = 'NOT_FOUND') {
    super(message, 404, true, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', errorCode = 'CONFLICT') {
    super(message, 409, true, errorCode);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', errorCode = 'INTERNAL_SERVER_ERROR') {
    super(message, 500, false, errorCode);
  }
}
