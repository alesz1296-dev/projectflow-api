import { Request, Response, NextFunction } from 'express';

/**
 * Extended Error Class for handler
 * Extends JavaScript's built-in Error class
 * Adds statusCode property for HTTP responses
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message); // Call JS Error's constructor with the message
    Object.setPrototypeOf(this, AppError.prototype); // Fix instanceof, this object's blueprint is AppError, not just Error (parent's class we are using)
  }
}
/**
 * ============================================
 * GLOBAL ERROR HANDLER MIDDLEWARE
 * ============================================
 */
export const errorHandler = (error: any, req: Request, res: Response) => {
  // Default error properties
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let isOperational = error.isOperational ?? true;

  // Prisma Unique Constraint Violation
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    statusCode = 400;
    message = `A record with this ${field} already exists.`;
    isOperational = true;
  }

  // Prisma Record Not Found
  if (error.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found.';
    isOperational = true;
  }

  // Prisma Foreign Key Constraint
  if (error.code === 'P2003') {
    statusCode = 400;
    message = 'Invalid reference. Related record does not exist.';
    isOperational = true;
  }

  // JWT Errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
    isOperational = true;
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
    isOperational = true;
  }

  // Validation Errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    isOperational = true;
  }

  // Type Errors (e.g., parsing issues)
  if (error instanceof TypeError) {
    statusCode = 400;
    message = 'Invalid request format.';
    isOperational = true;
  }

  // Syntax Errors (JSON parsing)
  if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON format.';
    isOperational = true;
  }

  // Log operational errors during development
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR :', {
      statusCode,
      message,
      isOperational,
      stack: error.stack,
    });
  }

  // Don't leak error details in production for non-operational errors
  if (!isOperational) {
    statusCode = 500;
    message = 'Something went wrong. Please try again later.';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

/**
 * ============================================
 * ASYNC ERROR WRAPPER
 * ============================================
 * Wraps async route handlers to catch errors. We need this because it prevents having to create try/catchs for every controller function
 * We use fn to wrap around each function
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * ============================================
 * 404 HANDLER (Must be last middleware)
 * ============================================
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
