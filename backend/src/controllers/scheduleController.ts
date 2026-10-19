import { Request, Response, NextFunction } from 'express';
import { Schedule } from '../models/Schedule.js';

// Get Teacher Daily Schedule
export const getTeacherSchedule = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { facultyId } = req.params;
    const { dayOfWeek = 'Today' } = req.query;

    const schedules = await Schedule.find({
      targetRole: 'TEACHER',
      targetId: facultyId ? facultyId.toUpperCase() : 'FAC-CS-8924',
      ...(dayOfWeek !== 'All' ? { dayOfWeek } : {}),
    }).sort({ timeSlot: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      schedules,
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
    const { enrollmentNo } = req.params;
    const { dayOfWeek = 'Today' } = req.query;

    const schedules = await Schedule.find({
      targetRole: 'STUDENT',
      targetId: enrollmentNo ? enrollmentNo.toUpperCase() : 'GGV/22/0892',
      ...(dayOfWeek !== 'All' ? { dayOfWeek } : {}),
    }).sort({ timeSlot: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      schedules,
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
