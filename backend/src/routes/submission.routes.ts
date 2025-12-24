import { Router } from 'express';
import { submissionController } from '@/controllers/submission.controller';

const router = Router();

router.get('/', submissionController.getAll);
router.post('/', submissionController.create);
router.get('/:id', submissionController.getOne);
router.post('/:id/submit', submissionController.submitDraft);
router.post('/:id/approve', submissionController.approve);
router.post('/:id/reject', submissionController.reject);

export const submissionRoutes = router;
