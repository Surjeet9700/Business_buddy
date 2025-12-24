import { Request, Response } from 'express';
import { submissionService } from '@/services/submission.service';
import { catchAsync } from '@/utils/asyncWrapper';
import { z } from 'zod';
import { SubmissionStatus } from '@prisma-client';

const createSubmissionSchema = z.object({
    formId: z.string(),
    data: z.record(z.any()),
    submitNow: z.boolean().optional()
});

const approvalSchema = z.object({
    comment: z.string().optional()
});

export class SubmissionController {
    public getAll = catchAsync(async (req: Request, res: Response) => {
        const result = await submissionService.findAll({
            page: Number(req.query.page) || 1,
            pageSize: Number(req.query.pageSize) || 20,
            formId: req.query.formId as string,
            status: req.query.status as SubmissionStatus
        });
        res.status(200).json({ success: true, ...result });
    });

    public getOne = catchAsync(async (req: Request, res: Response) => {
        const submission = await submissionService.findById(req.params.id);
        res.status(200).json({ success: true, data: submission });
    });

    public create = catchAsync(async (req: Request, res: Response) => {
        const validated = createSubmissionSchema.parse(req.body);

        // TODO: Get userId from authenticated request (req.user.id)
        const { db } = await import('@/config/database');
        const user = await db.user.findFirst();
        if (!user) throw new Error('No users found in database.');
        const userId = user.id;

        const submission = await submissionService.create({ ...validated, userId });
        res.status(201).json({ success: true, data: submission });
    });

    public submitDraft = catchAsync(async (req: Request, res: Response) => {
        // TODO: Get userId from authenticated request (req.user.id)
        const { db } = await import('@/config/database');
        const user = await db.user.findFirst();
        if (!user) throw new Error('No users found in database.');
        const userId = user.id;

        const submission = await submissionService.submit(req.params.id, userId);
        res.status(200).json({ success: true, data: submission });
    });

    public approve = catchAsync(async (req: Request, res: Response) => {
        const validated = approvalSchema.parse(req.body);

        // TODO: Get userId from authenticated request (req.user.id)
        const { db } = await import('@/config/database');
        const user = await db.user.findFirst();
        if (!user) throw new Error('No users found in database.');
        const userId = user.id;

        await submissionService.approve(req.params.id, userId, validated.comment);
        res.status(200).json({ success: true, data: { message: "Approved successfully" } });
    });

    public reject = catchAsync(async (req: Request, res: Response) => {
        const validated = approvalSchema.parse(req.body);

        // TODO: Get userId from authenticated request (req.user.id)
        const { db } = await import('@/config/database');
        const user = await db.user.findFirst();
        if (!user) throw new Error('No users found in database.');
        const userId = user.id;

        await submissionService.reject(req.params.id, userId, validated.comment);
        res.status(200).json({ success: true, data: { message: "Rejected successfully" } });
    });
}

export const submissionController = new SubmissionController();
