import { Router } from 'express';
import { RoleController } from '@/controllers/role.controller';

const router = Router();

// Routes
router.get('/', RoleController.getRoles);
router.get('/permissions', RoleController.getPermissions);
router.post('/toggle', RoleController.togglePermission);

export default router;
