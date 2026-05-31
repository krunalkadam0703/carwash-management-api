import { Response } from 'express';

import { HttpStatus } from '../constants/http.js';

export class ApiResponse {

    static success(res: Response, data: T, message = 'Success', statusCode = HttpStatus.OK):void {
         res.status(statusCode).json({
            success: true,
            status: 'success',
            message,
            data,
        });
    }

    static error(res: Response, message = 'Error', statusCode = HttpStatus.INTERNAL_SERVER_ERROR):void {
        res.status(statusCode).json({
            status: 'error',
            error:{
                message,
                ...(process.env.NODE_ENV === 'development' && errorDetails ? { details: errorDetails } : {}),
            }
        });
    }

}