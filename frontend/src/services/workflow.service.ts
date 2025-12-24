import api from '@/lib/api';

export const workflowService = {
    getAll: async (params?: any) => {
        const response = await api.get('/workflows', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/workflows/${id}`);
        return response.data.data;
    },

    create: async (data: any) => {
        const response = await api.post('/workflows', data);
        return response.data.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/workflows/${id}`, data);
        return response.data.data;
    }
};
