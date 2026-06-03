import { HttpStatus } from '../constants/http.js';

export class AppError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: HttpStatus, isOperational = true) {
    super(message);

    // Explicitly restore prototype chain for custom errors in modern ES environments
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Type-safe V8 stack trace capture check
    if ('captureStackTrace' in Error) {
      (
        Error as unknown as { captureStackTrace: (target: object, constructor: unknown) => void }
      ).captureStackTrace(this, this.constructor);
    }
  }
}
