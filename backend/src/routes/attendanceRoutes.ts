import { Router } from 'express';
import {
  markAttendance,
  getSessionAttendance,
  getAttendanceReports,
  toggleAttendance,
  exportAttendanceCsv,
} from '../controllers/attendanceController.js';

const router = Router();

router.post('/mark', markAttendance);
router.get('/session/:sessionId', getSessionAttendance);
router.get('/reports', getAttendanceReports);
router.patch('/toggle/:id', toggleAttendance);
router.get('/export/csv', exportAttendanceCsv);

export default router;
