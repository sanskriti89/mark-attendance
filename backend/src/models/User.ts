import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'TEACHER' | 'STUDENT';

export interface IUser extends Document {
  role: UserRole;
  name: string;
  email: string;
  password?: string;
  department: string;
  // Student Specific
  enrollmentNo?: string;
  courseLevel?: string;
  major?: string;
  programmeName?: string;
  enrolledCourses?: any[];
  // Teacher Specific
  facultyId?: string;
  designation?: string;
  phone?: string;
  officeRoom?: string;
  coursesTaught?: string[];
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    role: {
      type: String,
      enum: ['TEACHER', 'STUDENT'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 4,
      select: false,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    // Student fields
    enrollmentNo: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    courseLevel: {
      type: String,
      trim: true,
    },
    major: {
      type: String,
      trim: true,
    },
    programmeName: {
      type: String,
      trim: true,
    },
    enrolledCourses: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    // Teacher fields
    facultyId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    officeRoom: {
      type: String,
      trim: true,
    },
    coursesTaught: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
