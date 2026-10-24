import mongoose, { Document, Schema } from 'mongoose';

export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'ENDED';

export interface ISession extends Document {
  teacherFacultyId: string;
  teacherName: string;
  teacherEmail?: string;
  courseCode: string;
  courseName: string;
  classroom: string;
  department: string;
  broadcastPin: string;
  durationSeconds: number;
  startedAt: Date;
  expiresAt: Date;
  status: SessionStatus;
  currentAttendanceCount: number;
  totalTarget: number;
  physicalHeadcount: number;
  recentJoins: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
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
    courseCode: {
      type: String,
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    classroom: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    broadcastPin: {
      type: String,
      required: true,
      length: 2,
    },
    durationSeconds: {
      type: Number,
      default: 180,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'ENDED'],
      default: 'ACTIVE',
      index: true,
    },
    currentAttendanceCount: {
      type: Number,
      default: 0,
    },
    totalTarget: {
      type: Number,
      default: 72,
    },
    physicalHeadcount: {
      type: Number,
      default: 0,
    },
    recentJoins: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Session = mongoose.model<ISession>('Session', SessionSchema);
