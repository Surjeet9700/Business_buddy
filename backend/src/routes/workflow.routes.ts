import { Router } from 'express';
import { workflowController } from '@/controllers/workflow.controller';
import { protect } from '@/middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', workflowController.getAll);
router.post('/', workflowController.create);
router.get('/:id', workflowController.getOne);
router.put('/:id', workflowController.update);

export const workflowRoutes = router;
