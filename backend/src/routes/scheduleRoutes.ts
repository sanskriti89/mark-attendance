import { Router } from 'express';
import {
  getTeacherSchedule,
  getStudentSchedule,
  uploadScheduleBatch,
} from '../controllers/scheduleController.js';

const router = Router();

router.get('/teacher', getTeacherSchedule);
router.get('/teacher/:facultyId(*)?', getTeacherSchedule);
router.get('/student', getStudentSchedule);
router.get('/student/:enrollmentNo(*)?', getStudentSchedule);
router.post('/sync', uploadScheduleBatch);

export default router;
