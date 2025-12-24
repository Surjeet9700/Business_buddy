import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';

export const analyticsRoutes = Router();

analyticsRoutes.use(protect);

analyticsRoutes.get('/dashboard', AnalyticsController.getDashboardStats);
