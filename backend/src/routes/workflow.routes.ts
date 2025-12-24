import { Router } from 'express';
import { workflowController } from '@/controllers/workflow.controller';

const router = Router();

router.get('/', workflowController.getAll);
router.post('/', workflowController.create);
router.get('/:id', workflowController.getOne);
router.put('/:id', workflowController.update);

export const workflowRoutes = router;
