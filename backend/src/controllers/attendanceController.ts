import { Request, Response, NextFunction } from 'express';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Session } from '../models/Session.js';
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
    let session = await Session.findOne(sessionQuery).sort({ createdAt: -1 });

    if (!session && courseCode) {
      session = await Session.findOne({ status: 'ACTIVE', expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    }

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

    // Strict Course Enrollment Check: Only students registered for this course can mark attendance
    try {
      const studentUser = await User.findOne({
        $or: [
          { enrollmentNo: enrollment.toUpperCase() },
          { email: req.user?.email || '' },
        ],
      });

      if (studentUser && Array.isArray(studentUser.enrolledCourses) && studentUser.enrolledCourses.length > 0) {
        const cleanSessionCode = session.courseCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const isEnrolled = studentUser.enrolledCourses.some((c: any) => {
          const raw = typeof c === 'string' ? c : c.courseCode || '';
          const cleanStudentCode = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (!cleanStudentCode) return false;
          return cleanStudentCode === cleanSessionCode;
        });

        if (!isEnrolled) {
          res.status(403).json({
            success: false,
            message: `Access Denied: You are not enrolled in ${session.courseCode} (${session.courseName}). Attendance is restricted to enrolled students only.`,
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Enrollment verification warning:', err);
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

    // Update Session attendance count and recent joins list (up to 100 students)
    const updatedSession = await Session.findByIdAndUpdate(
      session._id,
      {
        $inc: { currentAttendanceCount: 1 },
        $push: { recentJoins: { $each: [name], $slice: -100 } },
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
    const { department, courseCode, courseType, search, sessionId } = req.query;

    const query: any = {};

    if (sessionId) {
      query.sessionId = sessionId;
    }
    if (department && department !== 'All') {
      query.department = department;
    }
    if (courseCode) {
      const cleanTarget = String(courseCode).toUpperCase().replace(/[^A-Z0-9]/g, '');
      query.courseCode = cleanTarget;
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

    let finalRecords = records;

    // When a specific course is queried, ensure the roster strictly includes only officially enrolled students
    if (courseCode) {
      const cleanTarget = String(courseCode).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const allStudents = await User.find({ role: 'STUDENT' });
      const enrolledStudents = allStudents.filter((s: any) =>
        Array.isArray(s.enrolledCourses) &&
        s.enrolledCourses.some((c: any) => {
          const cCode = (typeof c === 'string' ? c : c?.courseCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          return cCode === cleanTarget;
        })
      );

      const recordedMap = new Map<string, any>();
      for (const rec of records) {
        const key = (rec.studentEnrollment || '').toUpperCase().trim();
        if (key && !recordedMap.has(key)) {
          recordedMap.set(key, rec);
        }
      }

      const mergedList: any[] = [];
      for (const student of enrolledStudents) {
        const key = (student.enrollmentNo || '').toUpperCase().trim();
        if (recordedMap.has(key)) {
          mergedList.push(recordedMap.get(key));
        } else {
          // Officially enrolled in this course, but currently absent
          mergedList.push({
            _id: `roster-${student._id}`,
            courseCode: cleanTarget,
            courseName: records[0]?.courseName || 'Lecture Session',
            studentEnrollment: student.enrollmentNo,
            studentName: student.name,
            department: student.department || 'CSIT',
            courseType: 'Major',
            isPresent: false,
            geofenceVerified: false,
            verifiedVia: 'ABSENT',
            markedAt: null,
          });
        }
      }

      finalRecords = mergedList.filter((item) => {
        if (department && department !== 'All' && item.department !== department) return false;
        if (courseType && courseType !== 'All' && item.courseType !== courseType) return false;
        if (search) {
          const s = String(search).toLowerCase();
          const match =
            (item.studentName || '').toLowerCase().includes(s) ||
            (item.studentEnrollment || '').toLowerCase().includes(s) ||
            (item.department || '').toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      });
    }

    res.status(200).json({
      success: true,
      total: finalRecords.length,
      records: finalRecords,
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

// Export Attendance Roster as Excel-compatible CSV (Only Present students: Date, Student Name, Enrollment Number)
export const exportAttendanceCsv = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = (req.body?.sessionId || req.query.sessionId) as string | undefined;
    const courseCode = (req.body?.courseCode || req.query.courseCode) as string | undefined;
    const date = (req.body?.date || req.query.date) as string | undefined;
    const department = (req.body?.department || req.query.department) as string | undefined;

    const titleCourse = courseCode && courseCode !== 'All' ? String(courseCode).toUpperCase() : 'All_Classes';
    const cleanTarget = courseCode && courseCode !== 'All' ? String(courseCode).toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    const targetDateStr = date ? String(date) : getTodayDateString();

    // Map to hold unique present students: enrollment -> { date, name, enrollment }
    const presentStudentsMap = new Map<string, { date: string; name: string; enrollment: string; department?: string }>();

    // 1. If caller provided records directly in request body (e.g. from active screen roster)
    if (Array.isArray(req.body?.records) && req.body.records.length > 0) {
      for (const r of req.body.records) {
        if (r.isPresent) {
          const enroll = (r.studentEnrollment || '').toUpperCase().trim();
          if (enroll) {
            presentStudentsMap.set(enroll, {
              date: r.date || targetDateStr,
              name: r.studentName || 'Student',
              enrollment: r.studentEnrollment,
              department: r.department || r.dept,
            });
          }
        }
      }
    } else {
      // 2. Query AttendanceReport for saved finalized reports matching course/date/session
      const reportQuery: any = {};
      if (sessionId) reportQuery.sessionId = sessionId;
      if (cleanTarget) reportQuery.courseCode = { $regex: new RegExp(`^${cleanTarget}$`, 'i') };
      reportQuery.dateString = targetDateStr;

      const savedReports = await AttendanceReport.find(reportQuery).sort({ sessionDate: -1, createdAt: -1 });
      for (const rep of savedReports) {
        if (Array.isArray(rep.records)) {
          for (const r of rep.records) {
            if (r.isPresent) {
              const enroll = (r.studentEnrollment || '').toUpperCase().trim();
              if (enroll && !presentStudentsMap.has(enroll)) {
                presentStudentsMap.set(enroll, {
                  date: rep.dateString || targetDateStr,
                  name: r.studentName || 'Student',
                  enrollment: r.studentEnrollment,
                  department: r.department,
                });
              }
            }
          }
        }
      }

      // 3. Query AttendanceRecord for verified present students
      const recQuery: any = { isPresent: true };
      if (cleanTarget) recQuery.courseCode = cleanTarget;
      if (sessionId) recQuery.sessionId = sessionId;
      const markedRecords = await AttendanceRecord.find(recQuery).sort({ markedAt: -1, createdAt: -1 });

      for (const rec of markedRecords) {
        const enroll = (rec.studentEnrollment || '').toUpperCase().trim();
        if (enroll && !presentStudentsMap.has(enroll)) {
          const recDate = rec.markedAt ? getTodayDateString(new Date(rec.markedAt)) : targetDateStr;
          // Match the requested date or session
          if (sessionId || recDate === targetDateStr) {
            presentStudentsMap.set(enroll, {
              date: recDate,
              name: rec.studentName || 'Student',
              enrollment: rec.studentEnrollment,
              department: rec.department,
            });
          }
        }
      }
    }

    const COURSE_NAMES: Record<string, string> = {
      CIUCMJT2: 'Operating Systems',
      CIUCMJT1: 'Relational Database Management System',
      SECC13: 'DBMS (Database Management Systems)',
      VOCCILO03: 'Lab Based on Python',
      CAUCMJT2: 'Principals of Operating Systems',
      HIUCAET1: 'Hindi Bhasha Aur Sahitya',
    };

    let resolvedCourseName = (req.body?.courseName || req.query.courseName) as string | undefined;
    if (!resolvedCourseName && cleanTarget) {
      resolvedCourseName = COURSE_NAMES[cleanTarget];
    }
    if (!resolvedCourseName) {
      const anyRep = await AttendanceReport.findOne(cleanTarget ? { courseCode: { $regex: new RegExp(`^${cleanTarget}$`, 'i') } } : {}).sort({ sessionDate: -1 });
      if (anyRep && anyRep.courseName) resolvedCourseName = anyRep.courseName;
    }
    if (!resolvedCourseName) {
      resolvedCourseName = cleanTarget ? `Class ${cleanTarget}` : 'All Classes';
    }

    const classHeader = cleanTarget && !resolvedCourseName.toUpperCase().includes(cleanTarget)
      ? `Class: ${resolvedCourseName} (${cleanTarget})`
      : `Class: ${resolvedCourseName}`;

    let presentList = Array.from(presentStudentsMap.values());

    if (department && department !== 'All') {
      presentList = presentList.filter((r) => r.department === department);
    }

    // Excel CSV with UTF-8 BOM - Class Name at Top, then Date, Student Name, Enrollment Number
    const headers = ['Date', 'Student Name', 'Enrollment Number'];

    const rows = presentList.map((r) => [
      `"${r.date}"`,
      `"${r.name}"`,
      `"${r.enrollment}"`,
    ]);

    const BOM = '\uFEFF';
    const csvLines = [
      `"${classHeader}"`,
      '',
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ];
    const csvContent = BOM + csvLines.join('\r\n');

    const cleanFilename = `Attendance_Present_${titleCourse.replace(/[^A-Z0-9_-]/gi, '')}_${targetDateStr}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// Save / finalize comprehensive attendance report in database
export const saveAttendanceReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      sessionId,
      courseCode,
      courseName,
      teacherFacultyId,
      teacherName,
      classroom,
      department,
      totalPresent,
      totalAbsent,
      totalEnrolled,
      physicalHeadcount,
      hasDiscrepancy,
      records,
      status = 'FINALIZED',
      sendEmail = false,
    } = req.body;

    if (!courseCode) {
      res.status(400).json({ success: false, message: 'Course Code is required to save report.' });
      return;
    }

    const todayStr = getTodayDateString();

    let teacherEmail = req.body.teacherEmail;
    if (!teacherEmail) {
      const teacherUser = await User.findOne({
        $or: [{ facultyId: teacherFacultyId }, { name: teacherName }, { role: 'TEACHER' }],
      });
      if (teacherUser && teacherUser.email) {
        teacherEmail = teacherUser.email;
      }
    }

    let report;
    if (sessionId) {
      report = await AttendanceReport.findOneAndUpdate(
        { sessionId },
        {
          courseCode,
          courseName: courseName || 'University Lecture',
          teacherFacultyId: teacherFacultyId || 'EMP/2026/8042',
          teacherName: teacherName || 'Faculty',
          teacherEmail,
          classroom: classroom || 'CSIT Room FB',
          department: department || 'CSIT',
          totalPresent: totalPresent || 0,
          totalAbsent: totalAbsent || 0,
          totalEnrolled: totalEnrolled || (records ? records.length : 0),
          physicalHeadcount: physicalHeadcount || 0,
          hasDiscrepancy: !!hasDiscrepancy,
          records: records || [],
          status,
          dateString: todayStr,
          sessionDate: new Date(),
        },
        { new: true, upsert: true }
      );
    } else {
      report = await AttendanceReport.create({
        courseCode,
        courseName: courseName || 'University Lecture',
        teacherFacultyId: teacherFacultyId || 'EMP/2026/8042',
        teacherName: teacherName || 'Faculty',
        teacherEmail,
        classroom: classroom || 'CSIT Room FB',
        department: department || 'CSIT',
        totalPresent: totalPresent || 0,
        totalAbsent: totalAbsent || 0,
        totalEnrolled: totalEnrolled || (records ? records.length : 0),
        physicalHeadcount: physicalHeadcount || 0,
        hasDiscrepancy: !!hasDiscrepancy,
        records: records || [],
        status,
        dateString: todayStr,
        sessionDate: new Date(),
      });
    }

    // Sync individual AttendanceRecord isPresent status if modified
    if (Array.isArray(records) && records.length > 0) {
      for (const rec of records) {
        if (rec.id || rec.studentEnrollment) {
          const filter: any = rec.id ? { _id: rec.id } : { studentEnrollment: rec.studentEnrollment.toUpperCase(), courseCode };
          await AttendanceRecord.updateOne(filter, {
            $set: {
              isPresent: rec.isPresent,
              verifiedVia: rec.isPresent ? 'PIN_AND_GEOFENCE' : 'MANUAL_TEACHER',
            },
          });
        }
      }
    }

    // Optionally dispatch email upon save
    let emailDispatched = false;
    if (sendEmail && teacherEmail) {
      try {
        emailDispatched = await sendAttendanceReportEmail({
          toEmail: teacherEmail,
          teacherName: teacherName || 'Faculty',
          courseCode,
          courseName: courseName || 'University Lecture Course',
          classroom: classroom || 'CSIT Room FB',
          sessionDate: new Date(),
          totalPresent: totalPresent || 0,
          totalAbsent: totalAbsent || 0,
          totalEnrolled: totalEnrolled || (records ? records.length : 0),
          records: records || [],
        });
        if (emailDispatched && report) {
          await AttendanceReport.findByIdAndUpdate(report._id, {
            $set: { emailSent: true, emailSentTo: teacherEmail },
          });
        }
      } catch (emailErr) {
        console.warn('Manual email dispatch error:', emailErr);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Attendance report saved successfully in database',
      report,
      emailSent: emailDispatched,
      emailSentTo: teacherEmail,
    });
  } catch (error) {
    next(error);
  }
};

// Manually / explicitly send attendance report to teacher email
export const emailAttendanceReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseCode, sessionId, email, teacherName, classroom, records } = req.body;

    let targetEmail = email;
    let targetReport: any = null;

    if (sessionId) {
      targetReport = await AttendanceReport.findOne({ sessionId });
    } else if (courseCode) {
      targetReport = await AttendanceReport.findOne({ courseCode }).sort({ sessionDate: -1, createdAt: -1 });
    }

    if (!targetEmail) {
      targetEmail = targetReport?.teacherEmail;
    }

    if (!targetEmail) {
      const teacherUser = await User.findOne({ role: 'TEACHER' });
      targetEmail = teacherUser?.email || 'prasadvishwanath09@gmail.com';
    }

    const reportRecords = records && records.length > 0 ? records : targetReport?.records || [];
    const totalEnrolled = reportRecords.length;
    const totalPresent = reportRecords.filter((r: any) => r.isPresent).length;
    const totalAbsent = totalEnrolled - totalPresent;

    const sent = await sendAttendanceReportEmail({
      toEmail: targetEmail,
      teacherName: teacherName || targetReport?.teacherName || 'Dr. Rajesh Kumar Singh',
      courseCode: courseCode || targetReport?.courseCode || 'CIUCMJT2',
      courseName: targetReport?.courseName || 'University Lecture Course',
      classroom: classroom || targetReport?.classroom || 'CSIT Room FB',
      sessionDate: targetReport?.sessionDate || new Date(),
      totalPresent,
      totalAbsent,
      totalEnrolled,
      records: reportRecords,
    });

    if (sent && targetReport) {
      await AttendanceReport.findByIdAndUpdate(targetReport._id, {
        $set: { emailSent: true, emailSentTo: targetEmail },
      });
    }

    res.status(200).json({
      success: sent,
      message: sent
        ? `Official daily attendance report sent successfully to ${targetEmail}!`
        : `Could not send email to ${targetEmail}. Please check email service configuration.`,
      emailSentTo: targetEmail,
    });
  } catch (error) {
    next(error);
  }
};

// Get list of saved reports
export const getSavedReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseCode, teacherFacultyId, department, date } = req.query;
    const query: any = {};
    if (courseCode && courseCode !== 'All') query.courseCode = { $regex: new RegExp(`^${courseCode}$`, 'i') };
    if (teacherFacultyId) query.teacherFacultyId = teacherFacultyId;
    if (department && department !== 'All') query.department = department;
    if (date) query.dateString = String(date);

    const reports = await AttendanceReport.find(query).sort({ sessionDate: -1, createdAt: -1 }).limit(100);
    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};
