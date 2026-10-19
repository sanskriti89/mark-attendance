import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
  targetRole: 'TEACHER' | 'STUDENT';
  targetId: string; // facultyId or enrollmentNo or department
  courseCode: string;
  courseName: string;
  timeSlot: string;
  dayOfWeek: string;
  classroom: string;
  teacherName: string;
  department: string;
  courseType: string;
  credits: number;
  isOngoing?: boolean;
  isAttendanceActive?: boolean;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    targetRole: {
      type: String,
      enum: ['TEACHER', 'STUDENT'],
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    courseCode: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    dayOfWeek: {
      type: String,
      default: 'Today',
    },
    classroom: {
      type: String,
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    courseType: {
      type: String,
      default: 'Major',
    },
    credits: {
      type: Number,
      default: 3,
    },
    isOngoing: {
      type: Boolean,
      default: false,
    },
    isAttendanceActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Schedule = mongoose.model<ISchedule>('Schedule', ScheduleSchema);
