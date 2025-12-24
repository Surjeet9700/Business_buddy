import api from '@/lib/api';

export const formService = {
    getAll: async (params?: any) => {
        const response = await api.get('/forms', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/forms/${id}`);
        return response.data.data;
    },

    create: async (data: any) => {
        const response = await api.post('/forms', data);
        return response.data.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.put(`/forms/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await api.delete(`/forms/${id}`);
        return response.data;
    },

    duplicate: async (id: string) => {
        const response = await api.post(`/forms/${id}/duplicate`);
        return response.data.data;
    }
};
