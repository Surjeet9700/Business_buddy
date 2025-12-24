import api from '@/lib/api';

export const auditService = {
    getAll: async (params?: {
        page?: number;
        limit?: number;
        userId?: string;
        entityType?: string;
        entityId?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
    }) => {
        const response = await api.get('/analytics/audit-logs', { params });
        return response.data;
    },
};
