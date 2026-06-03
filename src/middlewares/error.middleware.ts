import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { HttpStatus } from '../constants/http.js';

export const errorMiddleware: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    ApiResponse.error(res, err.message, err.statusCode);
    return;
  }
  console.error('Unexpected error:', err);
  ApiResponse.error(res, 'An unexpected error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
};
