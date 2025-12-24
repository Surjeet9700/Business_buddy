import { Request, Response } from 'express';
import { userService } from '@/services/user.service';
import { catchAsync } from '@/utils/asyncWrapper';
import { z } from 'zod';
import { AppRole } from '@prisma-client';

const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    roles: z.array(z.nativeEnum(AppRole)).min(1)
});

const updateUserSchema = z.object({
    name: z.string().optional(),
    isActive: z.boolean().optional(),
    avatar: z.string().optional()
});

const updateRolesSchema = z.object({
    roles: z.array(z.nativeEnum(AppRole))
});

export class UserController {
    public getAllDetails = catchAsync(async (req: Request, res: Response) => {
        const result = await userService.findAll({
            page: Number(req.query.page) || 1,
            pageSize: Number(req.query.pageSize) || 20,
            search: req.query.search as string,
            role: req.query.role as AppRole,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as 'asc' | 'desc'
        });

        res.status(200).json({ success: true, ...result });
    });

    public getOne = catchAsync(async (req: Request, res: Response) => {
        const user = await userService.findById(req.params.id);
        res.status(200).json({ success: true, data: user });
    });

    public create = catchAsync(async (req: Request, res: Response) => {
        const validated = createUserSchema.parse(req.body);
        // Map password to passwordHash argument expected by service
        const user = await userService.create({
            email: validated.email,
            name: validated.name,
            passwordHash: validated.password,
            roles: validated.roles
        });
        res.status(201).json({ success: true, data: user });
    });

    public update = catchAsync(async (req: Request, res: Response) => {
        const validated = updateUserSchema.parse(req.body);
        const user = await userService.update(req.params.id, validated);
        res.status(200).json({ success: true, data: user });
    });

    public updateRoles = catchAsync(async (req: Request, res: Response) => {
        const validated = updateRolesSchema.parse(req.body);
        const user = await userService.updateRoles(req.params.id, validated.roles);
        res.status(200).json({ success: true, data: user });
    });
}

export const userController = new UserController();
