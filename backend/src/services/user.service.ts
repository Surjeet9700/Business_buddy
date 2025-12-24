import { db } from '../config/database';
import { AppError, NotFoundError } from '../utils/AppError';
import { User, AppRole, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

export class UserService {
    private static instance: UserService;

    private constructor() { }

    public static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    public async findAll(params: {
        page?: number;
        pageSize?: number;
        search?: string;
        role?: AppRole;
        isActive?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;
        const skip = (page - 1) * pageSize;

        const where: Prisma.UserWhereInput = {};

        if (params.search) {
            where.OR = [
                { email: { contains: params.search, mode: 'insensitive' } },
                { name: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        if (params.isActive !== undefined) {
            where.isActive = params.isActive;
        }

        if (params.role) {
            where.userRoles = {
                some: {
                    role: {
                        name: params.role,
                    },
                },
            };
        }

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    [params.sortBy || 'createdAt']: params.sortOrder || 'desc',
                },
                include: {
                    userRoles: { include: { role: true } },
                },
            }),
            db.user.count({ where }),
        ]);

        return {
            data: users.map(u => this.sanitizeUser(u)),
            meta: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    public async findById(id: string) {
        const user = await db.user.findUnique({
            where: { id },
            include: {
                userRoles: { include: { role: true } },
            },
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return this.sanitizeUser(user);
    }

    public async create(data: Prisma.UserCreateInput & { roles: AppRole[] }) {
        const existing = await db.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw new AppError('Email already exists', 409);
        }

        const passwordHash = await bcrypt.hash(data.passwordHash, 10);

        // Transaction to create user and assign roles
        const user = await db.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: data.email,
                    name: data.name,
                    passwordHash, // In a real scenario, this comes from input
                    isActive: true,
                },
            });

            // Find role IDs
            const roles = await tx.role.findMany({
                where: { name: { in: data.roles } },
            });

            if (roles.length !== data.roles.length) {
                throw new AppError('One or more invalid roles provided', 400);
            }

            await tx.userRole.createMany({
                data: roles.map(role => ({
                    userId: newUser.id,
                    roleId: role.id,
                })),
            });

            return newUser;
        });

        return this.findById(user.id);
    }

    public async update(id: string, data: Prisma.UserUpdateInput) {
        const user = await db.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundError('User not found');

        const updatedUser = await db.user.update({
            where: { id },
            data,
            include: { userRoles: { include: { role: true } } },
        });

        return this.sanitizeUser(updatedUser);
    }

    public async updateRoles(id: string, roles: AppRole[]) {
        const user = await db.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundError('User not found');

        await db.$transaction(async (tx) => {
            // Remove old roles
            await tx.userRole.deleteMany({ where: { userId: id } });

            const roleRecords = await tx.role.findMany({
                where: { name: { in: roles } }
            });

            await tx.userRole.createMany({
                data: roleRecords.map(r => ({ userId: id, roleId: r.id }))
            });
        });

        return this.findById(id);
    }

    // Helper to remove sensitive fields
    private sanitizeUser(user: any) {
        const { passwordHash, ...rest } = user;
        // Flatten roles for easier consumption
        const roles = user.userRoles?.map((ur: any) => ur.role.name) || [];
        return { ...rest, roles };
    }
}

export const userService = UserService.getInstance();
