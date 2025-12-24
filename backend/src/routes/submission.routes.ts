import { Router } from 'express';
import { submissionController } from '../controllers/submission.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', submissionController.getAll);
router.post('/', submissionController.create);
router.get('/:id', submissionController.getOne);
router.post('/:id/submit', submissionController.submitDraft);
router.post('/:id/approve', submissionController.approve);
router.post('/:id/reject', submissionController.reject);

export const submissionRoutes = router;
