import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/asyncWrapper';
import { AuditService } from '../services/audit.service';
import { z } from 'zod';

export class AuditController {
    static getAll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const querySchema = z.object({
            page: z.string().optional().transform(Number),
            limit: z.string().optional().transform(Number),
            userId: z.string().optional(),
            entityType: z.string().optional(),
            entityId: z.string().optional(),
            action: z.string().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        });

        const query = querySchema.parse(req.query);
        const auditService = AuditService.getInstance();

        // Parse dates if present
        const params = {
            ...query,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined
        };

        const result = await auditService.findAll(params);

        res.status(200).json({
            status: 'success',
            ...result
        });
    });
}
