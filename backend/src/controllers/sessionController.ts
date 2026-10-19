import { Request, Response, NextFunction } from 'express';
import { Session } from '../models/Session.js';
import { getIO } from '../sockets/socketHandler.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

// Start a new broadcast session
export const startSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      courseCode,
      courseName,
      classroom,
      department,
      broadcastPin,
      durationSeconds = 180,
      totalTarget = 72,
    } = req.body;

    const teacherFacultyId = req.user?.facultyId || req.body.teacherFacultyId;
    const teacherName = req.user?.name || req.body.teacherName || 'Faculty Member';

    if (!courseCode || !broadcastPin) {
      res.status(400).json({
        success: false,
        message: 'Course Code and 2-digit Broadcast PIN are required.',
      });
      return;
    }

    // Deactivate previous active sessions for this course / teacher
    await Session.updateMany(
      { teacherFacultyId, status: 'ACTIVE' },
      { $set: { status: 'ENDED' } }
    );

    const expiresAt = new Date(Date.now() + durationSeconds * 1000);

    const session = await Session.create({
      teacherFacultyId,
      teacherName,
      courseCode,
      courseName: courseName || 'University Lecture',
      classroom: classroom || 'Room FB',
      department: department || req.user?.department || 'CSIT',
      broadcastPin: String(broadcastPin).padStart(2, '0'),
      durationSeconds,
      expiresAt,
      status: 'ACTIVE',
      currentAttendanceCount: 0,
      totalTarget,
      physicalHeadcount: 0,
      recentJoins: [],
    });

    // Broadcast socket event
    try {
      const io = getIO();
      io.emit('session:started', {
        sessionId: session._id,
        courseCode: session.courseCode,
        courseName: session.courseName,
        classroom: session.classroom,
        teacherName: session.teacherName,
        expiresAt: session.expiresAt,
        durationSeconds: session.durationSeconds,
      });
    } catch (e) {
      console.warn('Socket emit warning:', e);
    }

    res.status(201).json({
      success: true,
      message: 'Broadcast session initiated successfully',
      session,
    });
  } catch (error) {
    next(error);
  }
};

// Get the currently active broadcast session
export const getActiveSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseCode, teacherFacultyId, department } = req.query;

    const query: any = { status: 'ACTIVE', expiresAt: { $gt: new Date() } };

    if (courseCode) query.courseCode = courseCode;
    if (teacherFacultyId) query.teacherFacultyId = teacherFacultyId;
    if (department) query.department = department;

    const session = await Session.findOne(query).sort({ createdAt: -1 });

    if (!session) {
      res.status(200).json({
        success: true,
        hasActiveSession: false,
        session: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      hasActiveSession: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

// End a session
export const endSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await Session.findByIdAndUpdate(
      id,
      { $set: { status: 'ENDED' } },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    try {
      const io = getIO();
      io.emit('session:ended', { sessionId: session._id });
    } catch (e) {
      console.warn('Socket emit warning:', e);
    }

    res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      session,
    });
  } catch (error) {
    next(error);
  }
};

// Update physical headcount for discrepancy auditing
export const updateHeadcount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { physicalHeadcount } = req.body;

    const session = await Session.findByIdAndUpdate(
      id,
      { $set: { physicalHeadcount: Number(physicalHeadcount) || 0 } },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    const discrepancy = session.currentAttendanceCount - session.physicalHeadcount;

    try {
      const io = getIO();
      io.to(String(session._id)).emit('session:headcount_updated', {
        sessionId: session._id,
        physicalHeadcount: session.physicalHeadcount,
        digitalCount: session.currentAttendanceCount,
        discrepancy,
      });
    } catch (e) {
      console.warn('Socket emit warning:', e);
    }

    res.status(200).json({
      success: true,
      message: 'Headcount updated',
      session,
      discrepancy,
    });
  } catch (error) {
    next(error);
  }
};
