import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { globalErrorHandler } from '@/middleware/error.middleware';
import { AppError } from '@/utils/AppError';
import { authRoutes } from '@/routes/auth.routes';
import { userRoutes } from '@/routes/user.routes';
import { formRoutes } from '@/routes/form.routes';
import { workflowRoutes } from '@/routes/workflow.routes';
import { submissionRoutes } from '@/routes/submission.routes';
import { analyticsRoutes } from '@/routes/analytics.routes';
import roleRoutes from '@/routes/role.routes';

class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddleware(): void {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('dev'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private initializeRoutes(): void {
        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({ status: 'ok', timestamp: new Date() });
        });

        this.app.get('/', (req: Request, res: Response) => {
            res.status(200).json({
                service: 'Business-Buddy API',
                status: 'active',
                version: '1.0.0',
                health_check: '/health'
            });
        });

        // API Routes
        this.app.use('/api/v1/auth', authRoutes);
        this.app.use('/api/v1/users', userRoutes);
        this.app.use('/api/v1/forms', formRoutes);
        this.app.use('/api/v1/workflows', workflowRoutes);
        this.app.use('/api/v1/submissions', submissionRoutes);
        this.app.use('/api/v1/analytics', analyticsRoutes);
        this.app.use('/api/v1/roles', roleRoutes);
    }

    private initializeErrorHandling(): void {
        this.app.all('*', (req: Request, res: Response, next) => {
            next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
        });

        this.app.use(globalErrorHandler);
    }
}

export const app = new App().app;
