import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceReportRecord {
  sNo: string;
  studentName: string;
  studentEnrollment: string;
  department: string;
  courseType: string;
  isPresent: boolean;
  checkInTime: string;
  verificationMethod: string;
}

export interface IAttendanceReport extends Document {
  sessionId?: mongoose.Types.ObjectId;
  courseCode: string;
  courseName: string;
  teacherFacultyId: string;
  teacherName: string;
  teacherEmail?: string;
  classroom: string;
  department: string;
  sessionDate: Date;
  dateString: string; // e.g. "2026-10-24" (IST YYYY-MM-DD)
  totalPresent: number;
  totalAbsent: number;
  totalEnrolled: number;
  physicalHeadcount: number;
  hasDiscrepancy: boolean;
  records: IAttendanceReportRecord[];
  status: 'FINALIZED' | 'DRAFT';
  emailSent?: boolean;
  emailSentTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceReportRecordSchema = new Schema<IAttendanceReportRecord>(
  {
    sNo: { type: String, required: true },
    studentName: { type: String, required: true },
    studentEnrollment: { type: String, required: true },
    department: { type: String, default: 'CSIT' },
    courseType: { type: String, default: 'Major' },
    isPresent: { type: Boolean, default: true },
    checkInTime: { type: String, default: 'Verified' },
    verificationMethod: { type: String, default: 'GGU GPS + PIN' },
  },
  { _id: false }
);

const AttendanceReportSchema = new Schema<IAttendanceReport>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      index: true,
    },
    courseCode: {
      type: String,
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    teacherFacultyId: {
      type: String,
      required: true,
      index: true,
    },
    teacherName: {
      type: String,
      required: true,
    },
    teacherEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    classroom: {
      type: String,
      default: 'CSIT Room FB',
    },
    department: {
      type: String,
      default: 'CSIT',
      index: true,
    },
    sessionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dateString: {
      type: String,
      required: true,
      index: true,
    },
    totalPresent: {
      type: Number,
      default: 0,
    },
    totalAbsent: {
      type: Number,
      default: 0,
    },
    totalEnrolled: {
      type: Number,
      default: 0,
    },
    physicalHeadcount: {
      type: Number,
      default: 0,
    },
    hasDiscrepancy: {
      type: Boolean,
      default: false,
    },
    records: [AttendanceReportRecordSchema],
    status: {
      type: String,
      enum: ['FINALIZED', 'DRAFT'],
      default: 'FINALIZED',
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentTo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize daily class lookups
AttendanceReportSchema.index({ courseCode: 1, dateString: 1 });
AttendanceReportSchema.index({ teacherFacultyId: 1, dateString: 1 });

export const AttendanceReport = mongoose.model<IAttendanceReport>(
  'AttendanceReport',
  AttendanceReportSchema
);
