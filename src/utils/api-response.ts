import { Response } from 'express';

import { HttpStatus } from '../constants/http.js';

export class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = HttpStatus.OK): void {
    res.status(statusCode).json({
      success: true,
      status: 'success',
      message,
      data,
    });
  }

  static error(
    res: Response,
    message = 'Error',
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errorDetails?: unknown,
  ): void {
    res.status(statusCode).json({
      success: false,
      status: 'error',
      error: {
        message,
        ...(process.env.NODE_ENV === 'development' && errorDetails
          ? { details: errorDetails }
          : {}),
      },
    });
  }
}
