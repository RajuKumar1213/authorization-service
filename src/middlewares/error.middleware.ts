import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../core/errors';
import { logger } from '../core/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.issues,
      },
    });
    return;
  }

  // Log unhandled errors
  logger.error(err, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    },
  });
};
