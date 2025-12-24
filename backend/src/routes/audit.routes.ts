import { Router } from 'express';
import { AuditController } from '@/controllers/audit.controller';

export const auditRoutes = Router();

// TODO: Add auth middleware and RBAC (admins only typically)
auditRoutes.get('/', AuditController.getAll);
