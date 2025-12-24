import api from '@/lib/api';

export const submissionService = {
    getAll: async (params?: any) => {
        const response = await api.get('/submissions', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get(`/submissions/${id}`);
        return response.data.data;
    },

    create: async (data: any) => {
        const response = await api.post('/submissions', data);
        return response.data.data;
    },

    submit: async (id: string) => {
        const response = await api.post(`/submissions/${id}/submit`);
        return response.data.data;
    },

    approve: async (id: string, comment?: string) => {
        const response = await api.post(`/submissions/${id}/approve`, { comment });
        return response.data;
    },

    reject: async (id: string, reason?: string) => {
        const response = await api.post(`/submissions/${id}/reject`, { comment: reason });
        return response.data;
    }
};
