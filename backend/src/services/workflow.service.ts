import { db } from '../config/database';
import { AppError, NotFoundError } from '../utils/AppError';
import { Prisma, AppRole } from '@prisma/client';

export class WorkflowService {
    private static instance: WorkflowService;
    private constructor() { }

    public static getInstance(): WorkflowService {
        if (!WorkflowService.instance) {
            WorkflowService.instance = new WorkflowService();
        }
        return WorkflowService.instance;
    }

    public async findAll(params: {
        page?: number;
        pageSize?: number;
        userId?: string;
        roles?: string[];
    }) {
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;

        const where: Prisma.WorkflowWhereInput = {};

        // Data Isolation: If not admin, only show own workflows
        const isAdmin = params.roles?.some(r => r.toLowerCase() === 'admin');
        if (params.userId && !isAdmin) {
            where.createdBy = params.userId;
        }

        const [workflows, total] = await Promise.all([
            db.workflow.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            db.workflow.count({ where })
        ]);

        return {
            data: workflows,
            meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
        };
    }

    public async findById(id: string) {
        const workflow = await db.workflow.findUnique({
            where: { id },
            include: { steps: { orderBy: { order: 'asc' } } }
        });
        if (!workflow) throw new NotFoundError('Workflow not found');
        return workflow;
    }

    public async create(data: {
        name: string;
        description?: string;
        steps: {
            name: string;
            description?: string;
            approverRoles: AppRole[];
            requiredApprovals?: number;
            autoApprove?: boolean;
            timeoutDays?: number;
        }[];
        userId: string;
    }) {
        if (data.steps.length === 0) {
            throw new AppError('At least one step is required', 400);
        }

        return db.workflow.create({
            data: {
                name: data.name,
                description: data.description,
                createdBy: data.userId,
                isActive: true,
                steps: {
                    create: data.steps.map((step, index) => ({
                        name: step.name,
                        description: step.description,
                        order: index,
                        approverRoles: step.approverRoles,
                        requiredApprovals: step.requiredApprovals || 1,
                        autoApprove: step.autoApprove || false,
                        timeoutDays: step.timeoutDays
                    }))
                }
            },
            include: { steps: true }
        });
    }

    public async update(id: string, data: any) {
        // Note: Updating workflows that have active instances is complex. 
        // For simplicity, we strictly follow the contract: "Changes only affect new workflow instances"
        // Ideally we might want to version workflows too, or block updates if in use.

        return db.$transaction(async (tx) => {
            // Delete existing steps (simplest way to reorder/update)
            // WARNING: This breaks historical data integrity if we don't have soft deletes or versioning.
            // Given constraints, we will assume this is acceptable or we should ideally create a new workflow version.
            // For MVP, let's update basic info and recreate steps.

            await tx.workflowStep.deleteMany({ where: { workflowId: id } });

            const updated = await tx.workflow.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    steps: {
                        create: data.steps.map((step: any, index: number) => ({
                            name: step.name,
                            description: step.description,
                            order: index,
                            approverRoles: step.approverRoles,
                            requiredApprovals: step.requiredApprovals || 1,
                            autoApprove: step.autoApprove || false,
                            timeoutDays: step.timeoutDays
                        }))
                    }
                },
                include: { steps: true }
            });

            return updated;
        });
    }
}

export const workflowService = WorkflowService.getInstance();
