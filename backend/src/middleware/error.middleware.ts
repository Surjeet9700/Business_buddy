import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';
import { env } from '@/config/env';
import { ZodError } from 'zod';

export const globalErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errorCode = 'INTERNAL_ERROR';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        errorCode = err.constructor.name.toUpperCase().replace('ERROR', '');
        if (errorCode === 'APP') errorCode = 'ERROR';
    } else if (err instanceof ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        errorCode = 'VALIDATION_ERROR';
        // You could include detailed validation errors here
    }

    // Log error in production
    if (env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message,
            ...(env.NODE_ENV === 'development' && { stack: err.stack }),
            ...(err instanceof ZodError && { details: err.format() }),
        },
    });
};
