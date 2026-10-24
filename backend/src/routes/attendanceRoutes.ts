import { Router } from 'express';
import {
  markAttendance,
  getSessionAttendance,
  getAttendanceReports,
  toggleAttendance,
  exportAttendanceCsv,
  saveAttendanceReport,
  getSavedReports,
  emailAttendanceReport,
} from '../controllers/attendanceController.js';

const router = Router();

router.post('/mark', markAttendance);
router.get('/session/:sessionId', getSessionAttendance);
router.get('/reports', getAttendanceReports);
router.patch('/toggle/:id', toggleAttendance);
router.get('/export/csv', exportAttendanceCsv);
router.post('/export/csv', exportAttendanceCsv);

// Official Attendance Reports in Database
router.post('/report/save', saveAttendanceReport);
router.get('/report/saved', getSavedReports);
router.post('/report/email', emailAttendanceReport);

export default router;
