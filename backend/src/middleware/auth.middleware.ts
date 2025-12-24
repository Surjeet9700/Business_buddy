import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, UnauthorizedError } from '@/utils/AppError';
import { env } from '@/config/env';
import { db } from '@/config/database';

interface JwtPayload {
    userId: string;
    roles: string[];
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                roles: string[];
            }
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new UnauthorizedError('Not authorized to access this route'));
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

        // Verify user still exists
        const currentUser = await db.user.findUnique({
            where: { id: decoded.userId },
            include: { userRoles: { include: { role: true } } }
        });

        if (!currentUser) {
            return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
        }

        if (!currentUser.isActive) {
            return next(new UnauthorizedError('User account is deactivated.'));
        }

        // Add user info to request
        req.user = {
            id: currentUser.id,
            roles: currentUser.userRoles.map((ur: any) => ur.role.name)
        };
        next();
    } catch (error) {
        return next(new UnauthorizedError('Not authorized to access this route'));
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.some(role => req.user!.roles.includes(role))) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
