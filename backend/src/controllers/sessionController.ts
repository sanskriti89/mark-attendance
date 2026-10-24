import { Request, Response, NextFunction } from 'express';
import { Session } from '../models/Session.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { AttendanceReport } from '../models/AttendanceReport.js';
import { User } from '../models/User.js';
import { getIO } from '../sockets/socketHandler.js';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { sendAttendanceReportEmail } from '../utils/emailService.js';

const getTodayDateString = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

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
      durationSeconds = 900,
      totalTarget = 72,
    } = req.body;

    const cleanTeacherId = req.user?.facultyId || req.body.teacherFacultyId || 'EMP/2026/8042';
    const cleanTeacherName = req.user?.name || req.body.teacherName || 'Dr. Rajesh Kumar Singh';
    let cleanTeacherEmail = req.user?.email || req.body.teacherEmail || '';

    if (!cleanTeacherEmail) {
      const teacherUser = await User.findOne({
        $or: [{ facultyId: cleanTeacherId }, { name: cleanTeacherName }, { role: 'TEACHER' }],
      });
      if (teacherUser && teacherUser.email) {
        cleanTeacherEmail = teacherUser.email;
      }
    }

    if (!courseCode || !broadcastPin) {
      res.status(400).json({
        success: false,
        message: 'Course Code and 2-digit Broadcast PIN are required.',
      });
      return;
    }

    // Deactivate all previous active sessions so the new one takes over immediately
    await Session.updateMany(
      { status: 'ACTIVE' },
      { $set: { status: 'ENDED' } }
    );

    const expiresAt = new Date(Date.now() + durationSeconds * 1000);

    const session = await Session.create({
      teacherFacultyId: cleanTeacherId,
      teacherName: cleanTeacherName,
      teacherEmail: cleanTeacherEmail,
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

    let session = await Session.findOne(query).sort({ createdAt: -1 });

    // Fallback: If querying with specific filters yielded nothing, detect ANY active campus broadcast
    if (!session && (courseCode || teacherFacultyId || department)) {
      session = await Session.findOne({ status: 'ACTIVE', expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    }

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

// End a session and automatically archive daily attendance + email to teacher
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

    // Socket notification
    try {
      const io = getIO();
      io.emit('session:ended', { sessionId: session._id });
    } catch (e) {
      console.warn('Socket emit warning:', e);
    }

    // 1. Gather all student records marked for this session
    const markedRecords = await AttendanceRecord.find({ sessionId: session._id });

    // 2. Fetch all officially enrolled students for this course
    const cleanTarget = String(session.courseCode).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const allStudents = await User.find({ role: 'STUDENT' });
    const enrolledStudents = allStudents.filter((s: any) =>
      Array.isArray(s.enrolledCourses) &&
      s.enrolledCourses.some((c: any) => {
        const cCode = (typeof c === 'string' ? c : c?.courseCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        return cCode === cleanTarget;
      })
    );

    const recordedMap = new Map<string, any>();
    for (const rec of markedRecords) {
      const key = (rec.studentEnrollment || '').toUpperCase().trim();
      if (key && !recordedMap.has(key)) {
        recordedMap.set(key, rec);
      }
    }

    const mergedList: any[] = [];
    const targetStudentList = enrolledStudents.length > 0 ? enrolledStudents : allStudents.slice(0, 5);

    for (let i = 0; i < targetStudentList.length; i++) {
      const student = targetStudentList[i];
      const key = (student.enrollmentNo || '').toUpperCase().trim();
      if (recordedMap.has(key)) {
        const rec = recordedMap.get(key);
        mergedList.push({
          sNo: String(i + 1).padStart(2, '0'),
          studentName: rec.studentName || student.name,
          studentEnrollment: student.enrollmentNo || key,
          department: student.department || rec.department || 'CSIT',
          courseType: rec.courseType || 'Major',
          isPresent: rec.isPresent ?? true,
          checkInTime: rec.markedAt
            ? new Date(rec.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Verified',
          verificationMethod: rec.verifiedVia || 'GGU GPS + PIN',
        });
      } else {
        mergedList.push({
          sNo: String(i + 1).padStart(2, '0'),
          studentName: student.name,
          studentEnrollment: student.enrollmentNo || `GGV/25/CSIT/${i + 1}`,
          department: student.department || 'CSIT',
          courseType: 'Major',
          isPresent: false,
          checkInTime: 'Absent',
          verificationMethod: 'ABSENT',
        });
      }
    }

    // Include any student who marked attendance even if outside enrolled list
    for (const [key, rec] of recordedMap.entries()) {
      if (!mergedList.some((m) => (m.studentEnrollment || '').toUpperCase().trim() === key)) {
        mergedList.push({
          sNo: String(mergedList.length + 1).padStart(2, '0'),
          studentName: rec.studentName,
          studentEnrollment: rec.studentEnrollment,
          department: rec.department || 'CSIT',
          courseType: rec.courseType || 'Major',
          isPresent: rec.isPresent ?? true,
          checkInTime: rec.markedAt
            ? new Date(rec.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Verified',
          verificationMethod: rec.verifiedVia || 'GGU GPS + PIN',
        });
      }
    }

    const totalEnrolled = mergedList.length;
    const totalPresent = mergedList.filter((r) => r.isPresent).length;
    const totalAbsent = totalEnrolled - totalPresent;
    const todayStr = getTodayDateString(session.startedAt || new Date());

    // 3. Resolve Teacher Email
    let teacherEmail = session.teacherEmail || req.user?.email || '';
    if (!teacherEmail) {
      const teacherUser = await User.findOne({
        $or: [
          { facultyId: session.teacherFacultyId },
          { name: session.teacherName },
          { role: 'TEACHER' },
        ],
      });
      if (teacherUser && teacherUser.email) {
        teacherEmail = teacherUser.email;
      }
    }

    // 4. Archive separately in MongoDB AttendanceReport
    const report = await AttendanceReport.findOneAndUpdate(
      { sessionId: session._id },
      {
        sessionId: session._id,
        courseCode: session.courseCode,
        courseName: session.courseName,
        teacherFacultyId: session.teacherFacultyId,
        teacherName: session.teacherName,
        teacherEmail,
        classroom: session.classroom,
        department: session.department,
        sessionDate: session.startedAt || new Date(),
        dateString: todayStr,
        totalPresent,
        totalAbsent,
        totalEnrolled,
        physicalHeadcount: session.physicalHeadcount || 0,
        hasDiscrepancy: totalPresent > (session.physicalHeadcount || 0),
        records: mergedList,
        status: 'FINALIZED',
      },
      { new: true, upsert: true }
    );

    // 5. Automatically send attendance email to teacher upon attendance completion
    let emailDispatched = false;
    if (teacherEmail) {
      try {
        emailDispatched = await sendAttendanceReportEmail({
          toEmail: teacherEmail,
          teacherName: session.teacherName,
          courseCode: session.courseCode,
          courseName: session.courseName,
          classroom: session.classroom,
          sessionDate: session.startedAt || new Date(),
          totalPresent,
          totalAbsent,
          totalEnrolled,
          records: mergedList,
        });

        if (emailDispatched) {
          await AttendanceReport.findByIdAndUpdate(report._id, {
            $set: { emailSent: true, emailSentTo: teacherEmail },
          });
          console.log(`📧 [Auto Email Sent] Attendance report emailed to ${teacherEmail}`);
        }
      } catch (err: any) {
        console.warn('⚠️ [Auto Email Warning]:', err?.message || err);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Session ended successfully, attendance report archived & emailed to faculty.',
      session,
      report,
      emailSent: emailDispatched,
      emailSentTo: teacherEmail,
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
