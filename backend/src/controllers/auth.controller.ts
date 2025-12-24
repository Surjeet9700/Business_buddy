import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/auth.service';
import { catchAsync } from '@/utils/asyncWrapper';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export class AuthController {
    public register = catchAsync(async (req: Request, res: Response) => {
        const validated = registerSchema.parse(req.body);
        const user = await authService.register(validated);

        res.status(201).json({
            success: true,
            data: {
                user,
                message: 'Account created. Please verify your email.',
            },
        });
    });

    public login = catchAsync(async (req: Request, res: Response) => {
        const validated = loginSchema.parse(req.body);
        const { user, tokens } = await authService.login(validated);

        res.status(200).json({
            success: true,
            data: {
                ...tokens,
                user,
            },
        });
    });

    public getCurrentUser = catchAsync(async (req: Request, res: Response) => {
        // TODO: Get user from authenticated request (req.user)
        // For now, return first user from database
        const { db } = await import('@/config/database');

        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await db.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                userRoles: {
                    include: {
                        role: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userWithRoles = {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.userRoles.map((ur: any) => ur.role.name)
        };

        res.status(200).json({ success: true, data: userWithRoles });
    });
}

export const authController = new AuthController();
