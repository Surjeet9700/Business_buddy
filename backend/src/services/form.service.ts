import { db } from '@/config/database';
import { AppError, NotFoundError } from '@/utils/AppError';
import { Prisma } from '@prisma/client';

export class FormService {
    private static instance: FormService;
    private constructor() { }

    public static getInstance(): FormService {
        if (!FormService.instance) {
            FormService.instance = new FormService();
        }
        return FormService.instance;
    }

    public async findAll(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        isActive?: boolean;
        hasWorkflow?: boolean;
        userId?: string;
        roles?: string[];
    }) {
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;
        const skip = (page - 1) * pageSize;

        const where: Prisma.FormWhereInput = {};

        // Data Isolation: If not admin, only show own forms
        const isAdmin = params.roles?.some(role => role.toLowerCase() === 'admin');
        if (params.userId && !isAdmin) {
            where.createdBy = params.userId;
        }

        if (params.search) {
            where.name = { contains: params.search, mode: 'insensitive' };
        }
        if (params.isActive !== undefined) {
            where.isActive = params.isActive;
        }
        if (params.hasWorkflow !== undefined) {
            where.workflowId = params.hasWorkflow ? { not: null } : null;
        }

        const [forms, total] = await Promise.all([
            db.form.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: { workflow: { select: { id: true, name: true } } }
            }),
            db.form.count({ where })
        ]);

        return {
            data: forms,
            meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
        };
    }

    public async findById(id: string) {
        const form = await db.form.findUnique({
            where: { id },
            include: {
                workflow: true,
                versions: {
                    // where: { version: { equals: db.form.fields.currentVersion } }, 
                    // Prisma doesn't support comparing fields in include this easily without raw query or separate fetch
                    orderBy: { version: 'desc' },
                    take: 1
                }
            }
        });

        // Prisma relation filtering on fields of same model is tricky in findUnique includes. 
        // Optimization: fetch form first, then fetch specific version if needed.
        // However, let's keep it simple: fetch form, then fetch the current version payload.

        const formBase = await db.form.findUnique({
            where: { id },
            include: { workflow: true }
        });

        if (!formBase) throw new NotFoundError('Form not found');

        const currentVersion = await db.formVersion.findUnique({
            where: {
                formId_version: {
                    formId: id,
                    version: formBase.currentVersion
                }
            }
        });

        return { ...formBase, schema: currentVersion?.schema };
    }

    public async create(data: {
        name: string;
        description?: string;
        schema: any;
        permissions: any;
        workflowId?: string;
        userId: string;
    }) {
        return db.$transaction(async (tx) => {
            const form = await tx.form.create({
                data: {
                    name: data.name,
                    description: data.description,
                    permissions: data.permissions,
                    workflowId: data.workflowId,
                    createdBy: data.userId,
                    currentVersion: 1
                }
            });

            await tx.formVersion.create({
                data: {
                    formId: form.id,
                    version: 1,
                    schema: data.schema,
                    createdBy: data.userId,
                    changelog: 'Initial creation'
                }
            });

            return form;
        });
    }

    public async update(id: string, data: {
        name?: string;
        description?: string;
        schema?: any;
        permissions?: any;
        workflowId?: string | null;
        isActive?: boolean;
        changelog?: string;
        userId: string;
    }) {
        const form = await db.form.findUnique({ where: { id } });
        if (!form) throw new NotFoundError('Form not found');

        return db.$transaction(async (tx) => {
            let newVersion = form.currentVersion;

            // If schema changes, increment version
            if (data.schema) {
                newVersion++;
                await tx.formVersion.create({
                    data: {
                        formId: id,
                        version: newVersion,
                        schema: data.schema,
                        createdBy: data.userId,
                        changelog: data.changelog || 'Updated schema'
                    }
                });
            }

            const updatedForm = await tx.form.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    permissions: data.permissions,
                    workflowId: data.workflowId,
                    isActive: data.isActive,
                    currentVersion: newVersion
                }
            });

            return updatedForm;
        });
    }

    public async delete(id: string) {
        // Soft delete
        await db.form.update({
            where: { id },
            data: { isActive: false }
        });
    }

    public async duplicate(id: string, userId: string) {
        const original = await this.findById(id);
        if (!original) throw new NotFoundError('Form not found');

        return db.$transaction(async (tx) => {
            const form = await tx.form.create({
                data: {
                    name: `${original.name} (Copy)`,
                    description: original.description,
                    permissions: original.permissions as any,
                    workflowId: original.workflowId,
                    createdBy: userId,
                    currentVersion: 1
                }
            });

            await tx.formVersion.create({
                data: {
                    formId: form.id,
                    version: 1,
                    schema: original.schema as any,
                    createdBy: userId
                }
            });

            return form;
        });
    }
}

export const formService = FormService.getInstance();
