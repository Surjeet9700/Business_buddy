import api from '@/lib/api';
import { User } from '@/types/index';

export const userService = {
    getAll: async (params?: any) => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/users/${id}`);
        return response.data.data;
    },

    create: async (data: Partial<User>) => {
        const response = await api.post('/users', data);
        return response.data.data;
    },

    update: async (id: string, data: Partial<User>) => {
        const response = await api.patch(`/users/${id}`, data);
        return response.data.data;
    },

    updateRoles: async (id: string, roles: string[]) => {
        const response = await api.patch(`/users/${id}/roles`, { roles });
        return response.data.data;
    }
};
