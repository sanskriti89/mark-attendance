import { Request, Response, NextFunction } from 'express';
import { Schedule } from '../models/Schedule.js';

// Get Teacher Daily Schedule
export const getTeacherSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawId = req.params.facultyId || (req.params as any)[0] || req.query.facultyId;
    const { dayOfWeek = 'Today' } = req.query;

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = daysOfWeek[new Date().getDay()];

    const cleanId = String(rawId || '').trim();
    const idVariants = [
      cleanId,
      cleanId.toUpperCase(),
      cleanId.replace(/^GGV\//i, ''),
      cleanId.replace(/^GGV\//i, '').toUpperCase(),
      `GGV/${cleanId}`.toUpperCase(),
    ];

    let dayQuery: any = {};
    if (dayOfWeek === 'Today') {
      dayQuery = { $in: ['Today', currentDay, currentDay.toUpperCase(), currentDay.toLowerCase()] };
    } else if (dayOfWeek && dayOfWeek !== 'All') {
      dayQuery = new RegExp(`^${dayOfWeek}$`, 'i');
    }

    const query: any = {
      targetRole: 'TEACHER',
      targetId: { $in: idVariants },
    };

    if (dayOfWeek !== 'All') {
      query.dayOfWeek = dayQuery;
    }

    let schedules = await Schedule.find(query).sort({ timeSlot: 1 });

    // Deduplicate in case multiple targetId variants matched
    const seen = new Set<string>();
    const uniqueSchedules = schedules.filter((item: any) => {
      const key = `${item.courseCode}_${item.dayOfWeek}_${item.timeSlot}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.status(200).json({
      success: true,
      count: uniqueSchedules.length,
      schedules: uniqueSchedules,
    });
  } catch (error) {
    next(error);
  }
};

// Get Student Daily Schedule
export const getStudentSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawEnrollment = req.params.enrollmentNo || (req.params as any)[0] || req.query.enrollmentNo;
    const { dayOfWeek = 'Today' } = req.query;

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = daysOfWeek[new Date().getDay()];

    const cleanId = String(rawEnrollment || '').trim();
    const idVariants = [
      cleanId,
      cleanId.toUpperCase(),
      cleanId.replace(/^GGV\//i, ''),
      cleanId.replace(/^GGV\//i, '').toUpperCase(),
      `GGV/${cleanId}`.toUpperCase(),
    ];

    let dayQuery: any = {};
    if (dayOfWeek === 'Today') {
      dayQuery = { $in: ['Today', currentDay, currentDay.toUpperCase(), currentDay.toLowerCase()] };
    } else if (dayOfWeek && dayOfWeek !== 'All') {
      dayQuery = new RegExp(`^${dayOfWeek}$`, 'i');
    }

    const query: any = {
      targetRole: 'STUDENT',
      targetId: { $in: idVariants },
    };

    if (dayOfWeek !== 'All') {
      query.dayOfWeek = dayQuery;
    }

    let schedules = await Schedule.find(query).sort({ timeSlot: 1 });

    const seenStudent = new Set<string>();
    const uniqueStudentSchedules = schedules.filter((item: any) => {
      const key = `${item.courseCode}_${item.dayOfWeek}_${item.timeSlot}`;
      if (seenStudent.has(key)) return false;
      seenStudent.add(key);
      return true;
    });

    res.status(200).json({
      success: true,
      count: uniqueStudentSchedules.length,
      schedules: uniqueStudentSchedules,
    });
  } catch (error) {
    next(error);
  }
};

// Upload or Sync Schedule Batch
export const uploadScheduleBatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetRole, targetId, schedules } = req.body;

    if (!targetRole || !targetId || !Array.isArray(schedules)) {
      res.status(400).json({
        success: false,
        message: 'targetRole, targetId, and schedules array are required.',
      });
      return;
    }

    // Remove older schedule for this target
    await Schedule.deleteMany({ targetRole, targetId });

    const formatted = schedules.map((item: any) => ({
      targetRole,
      targetId,
      courseCode: item.courseCode,
      courseName: item.courseName,
      timeSlot: item.timeSlot,
      dayOfWeek: item.dayOfWeek || 'Today',
      classroom: item.classroom || 'Room FB',
      teacherName: item.teacherName || 'Faculty',
      department: item.department || 'CSIT',
      courseType: item.courseType || 'Major',
      credits: item.credits || 3,
      isOngoing: !!item.isOngoing,
      isAttendanceActive: !!item.isAttendanceActive,
    }));

    const inserted = await Schedule.insertMany(formatted);

    res.status(201).json({
      success: true,
      message: `Successfully synchronized ${inserted.length} schedule slots`,
      schedules: inserted,
    });
  } catch (error) {
    next(error);
  }
};
