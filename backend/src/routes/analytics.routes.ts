import { Router } from 'express';
import { AnalyticsController } from '@/controllers/analytics.controller';

export const analyticsRoutes = Router();

analyticsRoutes.get('/dashboard', AnalyticsController.getDashboardStats);
