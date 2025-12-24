import { Router } from 'express';
import { formController } from '../controllers/form.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect); // Protect all routes

router.get('/', formController.getAll);
router.post('/', formController.create);
router.get('/:id', formController.getOne);
router.put('/:id', formController.update);
router.delete('/:id', formController.delete);
router.post('/:id/duplicate', formController.duplicate);

export const formRoutes = router;
