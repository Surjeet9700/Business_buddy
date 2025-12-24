import api from '@/lib/api';
import { LoginCredentials, RegisterCredentials, AuthResponse, RegisterResponse, User } from '@/types/index';

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', credentials);
        return response.data.data;
    },

    register: async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
        const response = await api.post('/auth/register', credentials);
        return response.data.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get('/auth/me');
        return response.data.data;
    },

    logout: async () => {
        await api.post('/auth/logout');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
    }
};
