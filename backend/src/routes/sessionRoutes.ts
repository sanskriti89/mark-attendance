import { Router } from 'express';
import {
  startSession,
  getActiveSession,
  endSession,
  updateHeadcount,
} from '../controllers/sessionController.js';

const router = Router();

router.post('/start', startSession);
router.get('/active', getActiveSession);
router.post('/end/:id', endSession);
router.patch('/headcount/:id', updateHeadcount);

export default router;
