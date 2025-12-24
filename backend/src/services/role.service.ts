import { Prisma, Role, Permission } from '@prisma-client';
import { Database } from '@/config/database';
import { AppError } from '@/utils/AppError';

export class RoleService {
    private static instance: RoleService;
    private db = Database.getInstance().client;

    private constructor() { }

    public static getInstance(): RoleService {
        if (!RoleService.instance) {
            RoleService.instance = new RoleService();
        }
        return RoleService.instance;
    }

    // Get all roles with their permissions
    public async findAllRoles() {
        return this.db.role.findMany({
            include: {
                userRoles: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true
                            }
                        }
                    }
                },
                rolePermissions: {
                    include: {
                        permission: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
    }

    // Get all available permissions
    public async findAllPermissions() {
        return this.db.permission.findMany({
            orderBy: [
                { resource: 'asc' },
                { action: 'asc' }
            ]
        });
    }

    // Assign permission to role
    public async assignPermissionToRole(roleId: string, permissionId: string) {
        return this.db.rolePermission.create({
            data: {
                roleId,
                permissionId
            }
        });
    }

    // Remove permission from role
    public async removePermissionFromRole(roleId: string, permissionId: string) {
        return this.db.rolePermission.delete({
            where: {
                roleId_permissionId: {
                    roleId,
                    permissionId
                }
            }
        });
    }
}

export const roleService = RoleService.getInstance();
