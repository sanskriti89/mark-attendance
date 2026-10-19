import { Request, Response, NextFunction } from 'express';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Session } from '../models/Session.js';
import { getIO } from '../sockets/socketHandler.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';

// GGU Campus Bilaspur Coordinates (Latitude: 22.1293° N, Longitude: 82.1360° E)
const GGU_CAMPUS = {
  latitude: 22.1293,
  longitude: 82.136,
  radiusMeters: 500, // 500 meter geofence radius
};

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Student marks attendance via PIN and GPS Geofence
export const markAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      pin,
      studentEnrollment,
      studentName,
      department,
      courseCode,
      courseType,
      latitude,
      longitude,
    } = req.body;

    const enrollment = req.user?.enrollmentNo || studentEnrollment;
    const name = req.user?.name || studentName || 'Student';
    const dept = req.user?.department || department || 'CSIT';

    if (!pin || !enrollment) {
      res.status(400).json({
        success: false,
        message: 'PIN and Student Enrollment number are required.',
      });
      return;
    }

    // Find active session
    const sessionQuery: any = { status: 'ACTIVE', expiresAt: { $gt: new Date() } };
    if (courseCode) {
      sessionQuery.courseCode = courseCode;
    }
    const session = await Session.findOne(sessionQuery).sort({ createdAt: -1 });

    if (!session) {
      res.status(404).json({
        success: false,
        message: 'No active attendance broadcast session found for this course.',
      });
      return;
    }

    // Verify 2-digit PIN
    if (session.broadcastPin !== String(pin).padStart(2, '0')) {
      res.status(400).json({
        success: false,
        message: 'Invalid 2-digit PIN. Please check the PIN displayed on the teacher screen.',
      });
      return;
    }

    // Geofence check (optional simulation fallback if GPS coords not provided)
    let isGeofenceValid = true;
    if (latitude !== undefined && longitude !== undefined) {
      const distance = calculateDistanceMeters(
        latitude,
        longitude,
        GGU_CAMPUS.latitude,
        GGU_CAMPUS.longitude
      );
      if (distance > GGU_CAMPUS.radiusMeters) {
        isGeofenceValid = false;
      }
    }

    // Check if already marked
    const existing = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentEnrollment: enrollment.toUpperCase(),
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Attendance has already been marked for this session.',
      });
      return;
    }

    const record = await AttendanceRecord.create({
      sessionId: session._id,
      courseCode: session.courseCode,
      courseName: session.courseName,
      teacherFacultyId: session.teacherFacultyId,
      studentEnrollment: enrollment.toUpperCase(),
      studentName: name,
      department: dept,
      courseType: courseType || 'Major',
      isPresent: true,
      geofenceVerified: isGeofenceValid,
      latitude,
      longitude,
      verifiedVia: 'PIN_AND_GEOFENCE',
      markedAt: new Date(),
    });

    // Update Session attendance count and recent joins list
    const updatedSession = await Session.findByIdAndUpdate(
      session._id,
      {
        $inc: { currentAttendanceCount: 1 },
        $push: { recentJoins: { $each: [name], $slice: -5 } },
      },
      { new: true }
    );

    // Emit real-time update to teacher & students
    try {
      const io = getIO();
      io.emit('attendance:student_joined', {
        sessionId: session._id,
        studentName: name,
        studentEnrollment: enrollment.toUpperCase(),
        currentCount: updatedSession?.currentAttendanceCount,
        totalTarget: session.totalTarget,
        recentJoins: updatedSession?.recentJoins || [],
      });
    } catch (e) {
      console.warn('Socket emit warning:', e);
    }

    res.status(201).json({
      success: true,
      message: `Verified! Attendance recorded for ${session.courseName} (${session.courseCode}).`,
      record,
      currentAttendanceCount: updatedSession?.currentAttendanceCount,
    });
  } catch (error) {
    next(error);
  }
};

// Get Session Attendance Roster
export const getSessionAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const records = await AttendanceRecord.find({ sessionId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
};

// Get Comprehensive Attendance Reports
export const getAttendanceReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { department, courseCode, courseType, search } = req.query;

    const query: any = {};

    if (department && department !== 'All') {
      query.department = department;
    }
    if (courseCode) {
      query.courseCode = courseCode;
    }
    if (courseType && courseType !== 'All') {
      query.courseType = courseType;
    }
    if (search) {
      query.$or = [
        { studentName: { $regex: String(search), $options: 'i' } },
        { studentEnrollment: { $regex: String(search), $options: 'i' } },
        { department: { $regex: String(search), $options: 'i' } },
      ];
    }

    const records = await AttendanceRecord.find(query).sort({ markedAt: -1 }).limit(100);

    res.status(200).json({
      success: true,
      total: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
};

// Teacher Manually Toggles Attendance status (Present <-> Absent)
export const toggleAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const record = await AttendanceRecord.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Attendance record not found.' });
      return;
    }

    record.isPresent = !record.isPresent;
    record.verifiedVia = 'MANUAL_TEACHER';
    await record.save();

    res.status(200).json({
      success: true,
      message: `Status updated to ${record.isPresent ? 'Present' : 'Absent'}`,
      record,
    });
  } catch (error) {
    next(error);
  }
};

// Export Attendance Roster as CSV
export const exportAttendanceCsv = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, department, courseCode } = req.query;

    const query: any = {};
    if (sessionId) query.sessionId = sessionId;
    if (department && department !== 'All') query.department = department;
    if (courseCode) query.courseCode = courseCode;

    const records = await AttendanceRecord.find(query).sort({ markedAt: -1 });

    const headers = [
      'S.No',
      'Student Name',
      'Enrollment No',
      'Department',
      'Course Code',
      'Course Name',
      'Course Type',
      'Status',
      'Verified Via',
      'Geofence Verified',
      'Marked At',
    ];

    const rows = records.map((r, i) => [
      i + 1,
      `"${r.studentName}"`,
      r.studentEnrollment,
      r.department,
      r.courseCode,
      `"${r.courseName}"`,
      r.courseType,
      r.isPresent ? 'Present' : 'Absent',
      r.verifiedVia,
      r.geofenceVerified ? 'Yes' : 'No',
      r.markedAt.toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
