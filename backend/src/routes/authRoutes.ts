import { Router } from 'express';
import multer from 'multer';
import {
  registerStudent,
  registerTeacher,
  login,
  getCurrentUser,
  parsePdfCourseSlip,
} from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const router = Router();

router.post('/register/student', registerStudent);
router.post('/register/teacher', registerTeacher);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/parse-pdf', upload.single('file'), parsePdfCourseSlip);

export default router;
