import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceRecord extends Document {
  sessionId: mongoose.Types.ObjectId;
  courseCode: string;
  courseName: string;
  teacherFacultyId: string;
  studentEnrollment: string;
  studentName: string;
  department: string;
  courseType: string;
  isPresent: boolean;
  geofenceVerified: boolean;
  latitude?: number;
  longitude?: number;
  verifiedVia: 'PIN_AND_GEOFENCE' | 'MANUAL_TEACHER';
  markedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
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
    studentEnrollment: {
      type: String,
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    courseType: {
      type: String,
      default: 'Major',
    },
    isPresent: {
      type: Boolean,
      default: true,
    },
    geofenceVerified: {
      type: Boolean,
      default: true,
    },
    latitude: Number,
    longitude: Number,
    verifiedVia: {
      type: String,
      enum: ['PIN_AND_GEOFENCE', 'MANUAL_TEACHER'],
      default: 'PIN_AND_GEOFENCE',
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance for the same student in the same session
AttendanceRecordSchema.index({ sessionId: 1, studentEnrollment: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model<IAttendanceRecord>(
  'AttendanceRecord',
  AttendanceRecordSchema
);
