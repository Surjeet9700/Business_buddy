import { Router } from 'express';
import { userController } from '@/controllers/user.controller';
import { protect, restrictTo } from '@/middleware/auth.middleware';

const router = Router();

router.use(protect); // All routes require login

// Admin only routes for user management
router.get('/', restrictTo('ADMIN'), userController.getAllDetails);
router.post('/', restrictTo('ADMIN'), userController.create);
router.patch('/:id/roles', restrictTo('ADMIN'), userController.updateRoles);

// User access (Self/Admin handled in controller logic usually, but here generally admin manages users)
// For now, let's allow finding one (profile) by any auth user, but maybe restrict update?
router.get('/:id', userController.getOne);
router.patch('/:id', userController.update);

export const userRoutes = router;
