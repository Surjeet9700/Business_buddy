import { Request, Response } from 'express';
import { formService } from '@/services/form.service';
import { catchAsync } from '@/utils/asyncWrapper';
import { z } from 'zod';

const createFormSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    schema: z.object({ fields: z.array(z.any()) }),
    permissions: z.object({
        canView: z.array(z.string()),
        canSubmit: z.array(z.string()),
        canApprove: z.array(z.string())
    }),
    workflowId: z.string().optional()
});

const updateFormSchema = createFormSchema.partial().extend({
    isActive: z.boolean().optional(),
    changelog: z.string().optional(),
    workflowId: z.string().nullable().optional() // Allow detaching workflow
});

export class FormController {
    public getAll = catchAsync(async (req: Request, res: Response) => {
        const result = await formService.findAll({
            page: Number(req.query.page) || 1,
            pageSize: Number(req.query.pageSize) || 20,
            search: req.query.search as string,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            hasWorkflow: req.query.hasWorkflow === 'true'
        });
        res.status(200).json({ success: true, ...result });
    });

    public getOne = catchAsync(async (req: Request, res: Response) => {
        const form = await formService.findById(req.params.id);
        res.status(200).json({ success: true, data: form });
    });

    public create = catchAsync(async (req: Request, res: Response) => {
        const validated = createFormSchema.parse(req.body);

        // TODO: Get userId from authenticated request (req.user.id)
        // For now, get the first user from database
        const { db } = await import('@/config/database');
        const user = await db.user.findFirst();
        if (!user) {
            throw new Error('No users found in database. Please create a user first.');
        }
        const userId = user.id;

        const form = await formService.create({ ...validated, userId });
        res.status(201).json({ success: true, data: form });
    });

    public update = catchAsync(async (req: Request, res: Response) => {
        const validated = updateFormSchema.parse(req.body);

        // TODO: Get userId from authenticated request (req.user.id)
        const { db } = await import('@/config/database');
        const user = await db.user.findFirst();
        if (!user) {
            throw new Error('No users found in database.');
        }
        const userId = user.id;

        const form = await formService.update(req.params.id, { ...validated, userId });
        res.status(200).json({ success: true, data: form });
    });

    public delete = catchAsync(async (req: Request, res: Response) => {
        await formService.delete(req.params.id);
        res.status(200).json({ success: true, data: { message: "Form deactivated" } });
    });

    public duplicate = catchAsync(async (req: Request, res: Response) => {
        // Get userId from authenticated request
        const { db } = await import('@/config/database');
        const user = await db.user.findFirst();
        if (!user) throw new Error('No users found in database.');
        const userId = user.id;

        const newForm = await formService.duplicate(req.params.id, userId);
        res.status(201).json({ success: true, data: newForm });
    });
}

export const formController = new FormController();
