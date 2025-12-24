import api from '@/lib/api';

export const analyticsService = {
    getDashboardStats: async () => {
        const response = await api.get('/analytics/dashboard');
        return response.data;
    }
};
