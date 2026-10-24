import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  identifier: string;
  email: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-delete when expired
    },
  },
  {
    timestamps: true,
  }
);

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);
