import { Router } from 'express';
import { userController } from '@/controllers/user.controller';

const router = Router();

// TODO: Add auth and RBAC middleware
router.get('/', userController.getAllDetails);
router.post('/', userController.create);
router.get('/:id', userController.getOne);
router.patch('/:id', userController.update);
router.patch('/:id/roles', userController.updateRoles);

export const userRoutes = router;
