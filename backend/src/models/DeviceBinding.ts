import mongoose, { Document, Schema } from 'mongoose';

export interface IDeviceBinding extends Document {
  deviceId: string;
  boundUserId: mongoose.Types.ObjectId;
  boundEnrollmentNo: string;
  boundUserName: string;
  loginDate: string; // Format: YYYY-MM-DD (IST)
  boundAt: Date;
  expiresAt: Date;
}

const DeviceBindingSchema = new Schema<IDeviceBinding>(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    boundUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    boundEnrollmentNo: {
      type: String,
      required: true,
      trim: true,
    },
    boundUserName: {
      type: String,
      required: true,
      trim: true,
    },
    loginDate: {
      type: String,
      required: true,
      index: true,
    },
    boundAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: auto delete at midnight
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so one device has at most one student entry per day
DeviceBindingSchema.index({ deviceId: 1, loginDate: 1 }, { unique: true });

export const DeviceBinding = mongoose.model<IDeviceBinding>(
  'DeviceBinding',
  DeviceBindingSchema
);
