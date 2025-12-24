import { Request, Response } from 'express';
import { catchAsync } from '@/utils/asyncWrapper';
import { roleService } from '@/services/role.service';
import { z } from 'zod';

const togglePermissionSchema = z.object({
    roleId: z.string().uuid(),
    permissionId: z.string().uuid(),
    action: z.enum(['grant', 'revoke'])
});

export class RoleController {
    static getRoles = catchAsync(async (req: Request, res: Response) => {
        const roles = await roleService.findAllRoles();
        res.status(200).json({
            status: 'success',
            data: roles
        });
    });

    static getPermissions = catchAsync(async (req: Request, res: Response) => {
        const permissions = await roleService.findAllPermissions();
        res.status(200).json({
            status: 'success',
            data: permissions
        });
    });

    static togglePermission = catchAsync(async (req: Request, res: Response) => {
        const { roleId, permissionId, action } = togglePermissionSchema.parse(req.body);

        if (action === 'grant') {
            await roleService.assignPermissionToRole(roleId, permissionId);
        } else {
            await roleService.removePermissionFromRole(roleId, permissionId);
        }

        res.status(200).json({
            status: 'success',
            message: `Permission ${action}ed successfully`
        });
    });
}
