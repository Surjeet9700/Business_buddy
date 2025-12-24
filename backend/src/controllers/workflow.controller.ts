import { Request, Response } from 'express';
import { workflowService } from '../services/workflow.service';
import { catchAsync } from '../utils/asyncWrapper';
import { z } from 'zod';
import { AppRole } from '@prisma/client';

const stepSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    approverRoles: z.array(z.nativeEnum(AppRole)),
    requiredApprovals: z.number().default(1),
    autoApprove: z.boolean().default(false),
    timeoutDays: z.number().optional()
});

const createWorkflowSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    steps: z.array(stepSchema).min(1)
});

export class WorkflowController {
    public getAll = catchAsync(async (req: Request, res: Response) => {
        const result = await workflowService.findAll({
            page: Number(req.query.page) || 1,
            pageSize: Number(req.query.pageSize) || 20,
            userId: req.user?.id,
            roles: req.user?.roles
        });
        res.status(200).json({ success: true, ...result });
    });

    public getOne = catchAsync(async (req: Request, res: Response) => {
        const workflow = await workflowService.findById(req.params.id);
        res.status(200).json({ success: true, data: workflow });
    });

    public create = catchAsync(async (req: Request, res: Response) => {
        const validated = createWorkflowSchema.parse(req.body);

        if (!req.user || !req.user.id) throw new Error('User not authenticated');

        const workflow = await workflowService.create({ ...validated, userId: req.user.id });
        res.status(201).json({ success: true, data: workflow });
    });

    public update = catchAsync(async (req: Request, res: Response) => {
        const validated = createWorkflowSchema.parse(req.body);
        const workflow = await workflowService.update(req.params.id, validated);
        res.status(200).json({ success: true, data: workflow });
    });
}

export const workflowController = new WorkflowController();
