import api from '@/lib/api';

export interface Role {
    id: string;
    name: string;
    description: string;
    userRoles: {
        user: {
            id: string;
            name: string;
            avatar: string | null;
        }
    }[];
    rolePermissions: {
        permissionId: string;
        permission: Permission;
    }[];
}

export interface Permission {
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
}

export const roleService = {
    getRoles: async () => {
        const response = await api.get('/roles');
        return response.data.data;
    },

    getPermissions: async () => {
        const response = await api.get('/roles/permissions');
        return response.data.data;
    },

    togglePermission: async (roleId: string, permissionId: string, action: 'grant' | 'revoke') => {
        const response = await api.post('/roles/toggle', { roleId, permissionId, action });
        return response.data;
    }
};
