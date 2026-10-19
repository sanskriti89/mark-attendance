import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'TEACHER' | 'STUDENT';
    name?: string;
    email: string;
    enrollmentNo?: string;
    facultyId?: string;
    department: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'ggu_attendiq_jwt_secret_token_secure_key_2026';

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    return;
  }
};

export const requireRole = (allowedRole: 'TEACHER' | 'STUDENT') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== allowedRole) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Action requires ${allowedRole} permissions.`,
      });
      return;
    }
    next();
  };
};
