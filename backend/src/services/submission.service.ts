import { db } from '../config/database';
import { AppError, NotFoundError } from '../utils/AppError';
import { SubmissionStatus, WorkflowStatus, WorkflowStepStatus, Prisma } from '@prisma/client';

export class SubmissionService {
    private static instance: SubmissionService;
    private constructor() { }

    public static getInstance(): SubmissionService {
        if (!SubmissionService.instance) {
            SubmissionService.instance = new SubmissionService();
        }
        return SubmissionService.instance;
    }

    public async findAll(params: {
        page?: number;
        pageSize?: number;
        formId?: string;
        status?: SubmissionStatus;
        submittedBy?: string;
        userId?: string;
        roles?: string[];
    }) {
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;

        const where: Prisma.SubmissionWhereInput = {};
        if (params.formId) where.formId = params.formId;
        if (params.status) where.status = params.status;

        // Data Isolation logic
        const isAdmin = params.roles?.some(r => r.toLowerCase() === 'admin');

        // If specific submittedBy requested (e.g. filtering via UI)
        if (params.submittedBy) {
            where.submittedBy = params.submittedBy;
        }
        // Force filter for non-admins to only see their own submissions
        else if (params.userId && !isAdmin) {
            where.submittedBy = params.userId;
        }

        const [submissions, total] = await Promise.all([
            db.submission.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    submitter: { select: { id: true, name: true, email: true } },
                    form: { select: { id: true, name: true, description: true } }
                }
            }),
            db.submission.count({ where })
        ]);

        return {
            data: submissions,
            meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
        };
    }

    public async findById(id: string) {
        const submission = await db.submission.findUnique({
            where: { id },
            include: {
                form: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        currentVersion: true,
                        versions: {
                            orderBy: { version: 'desc' },
                            take: 1,
                            select: { schema: true }
                        }
                    }
                },
                submitter: { select: { id: true, name: true, email: true } },
                workflowInstance: {
                    include: {
                        steps: {
                            include: { approvals: { include: { user: { select: { name: true } } } } },
                            orderBy: { stepOrder: 'asc' }
                        }
                    }
                }
            }
        });
        if (!submission) throw new NotFoundError('Submission not found');

        // Attach schema to form object for easier access
        if (submission.form && (submission.form as any).versions?.[0]?.schema) {
            (submission.form as any).schema = (submission.form as any).versions[0].schema;
        }

        return submission;
    }

    public async create(data: {
        formId: string;
        data: any;
        submitNow?: boolean;
        userId: string;
    }) {
        const form = await db.form.findUnique({ where: { id: data.formId } });
        if (!form || !form.isActive) throw new AppError('Form is not active', 400);

        return db.$transaction(async (tx) => {
            // Create submission
            const submission = await tx.submission.create({
                data: {
                    formId: data.formId,
                    formVersion: form.currentVersion,
                    data: data.data,
                    status: data.submitNow ? 'submitted' : 'draft',
                    submittedBy: data.userId,
                    submittedAt: data.submitNow ? new Date() : null
                }
            });

            if (data.submitNow && form.workflowId) {
                await this.startWorkflow(tx, submission.id, form.workflowId);
            }

            return submission;
        });
    }

    public async submit(id: string, userId: string) {
        const submission = await db.submission.findUnique({ where: { id } });
        if (!submission) throw new NotFoundError('Submission not found');
        if (submission.status !== 'draft') throw new AppError('Submission already submitted', 400);

        const form = await db.form.findUnique({ where: { id: submission.formId } });

        return db.$transaction(async (tx) => {
            const updated = await tx.submission.update({
                where: { id },
                data: {
                    status: 'submitted',
                    submittedAt: new Date(),
                    data: submission.data || undefined // Keep existing data
                }
            });

            if (form?.workflowId) {
                await this.startWorkflow(tx, id, form.workflowId);
            }

            return updated;
        });
    }

    private async startWorkflow(tx: Prisma.TransactionClient, submissionId: string, workflowId: string) {
        const workflow = await tx.workflow.findUnique({
            where: { id: workflowId },
            include: { steps: { orderBy: { order: 'asc' } } }
        });

        if (!workflow || workflow.steps.length === 0) return;

        const instance = await tx.workflowInstance.create({
            data: {
                workflowId,
                submissionId,
                status: 'submitted',
                currentStepIndex: 0
            }
        });

        // Create step instances
        await tx.workflowStepInstance.createMany({
            data: workflow.steps.map(step => ({
                workflowInstanceId: instance.id,
                stepId: step.id,
                stepOrder: step.order,
                status: step.order === 0 ? 'pending' : 'pending' // Technically first one is 'active' pending awaiting approval
            }))
        });
    }

    public async approve(id: string, userId: string, comment?: string) {
        const submission = await db.submission.findUnique({
            where: { id },
            include: { workflowInstance: { include: { steps: { orderBy: { stepOrder: 'asc' } } } } }
        });

        if (!submission) throw new NotFoundError('Submission not found');
        if (submission.status !== 'submitted') throw new AppError('Submission is not in submitted status', 400);

        // If no workflow, directly approve
        if (!submission.workflowInstance) {
            await db.submission.update({
                where: { id },
                data: { status: 'approved' }
            });
            return;
        }

        const instance = submission.workflowInstance;
        const currentStep = instance.steps[instance.currentStepIndex];

        if (!currentStep) throw new AppError('Workflow finished or invalid state', 400);

        await db.$transaction(async (tx) => {
            await tx.workflowApproval.create({
                data: {
                    workflowStepInstanceId: currentStep.id,
                    userId,
                    action: 'approve',
                    comment
                }
            });

            // Move to next step
            const nextIndex = instance.currentStepIndex + 1;
            const nextStep = instance.steps[nextIndex];

            if (nextStep) {
                await tx.workflowInstance.update({
                    where: { id: instance.id },
                    data: { currentStepIndex: nextIndex }
                });
            } else {
                // Workflow complete
                await tx.workflowInstance.update({
                    where: { id: instance.id },
                    data: { status: 'approved', completedAt: new Date() }
                });
                await tx.submission.update({
                    where: { id },
                    data: { status: 'approved' }
                });
            }
        });
    }

    public async reject(id: string, userId: string, reason?: string) {
        const submission = await db.submission.findUnique({
            where: { id },
            include: { workflowInstance: { include: { steps: { orderBy: { stepOrder: 'asc' } } } } }
        });

        if (!submission) throw new NotFoundError('Submission not found');
        if (submission.status !== 'submitted') throw new AppError('Submission is not in submitted status', 400);

        // If no workflow, directly reject
        if (!submission.workflowInstance) {
            await db.submission.update({
                where: { id },
                data: { status: 'rejected' }
            });
            return;
        }

        const instance = submission.workflowInstance;
        const currentStep = instance.steps[instance.currentStepIndex];

        await db.$transaction(async (tx) => {
            if (currentStep) {
                await tx.workflowApproval.create({
                    data: {
                        workflowStepInstanceId: currentStep.id,
                        userId,
                        action: 'reject',
                        comment: reason
                    }
                });
            }

            // Reject workflow
            await tx.workflowInstance.update({
                where: { id: instance.id },
                data: { status: 'rejected', completedAt: new Date() }
            });
            await tx.submission.update({
                where: { id },
                data: { status: 'rejected' }
            });
        });
    }
}

export const submissionService = SubmissionService.getInstance();
