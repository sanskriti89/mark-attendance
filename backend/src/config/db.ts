import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendiq';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ [MongoDB Atlas] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: any) {
    console.warn(`⚠️ [MongoDB] System DNS connection failed: ${error.message}. Retrying with public DNS...`);
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`✅ [MongoDB Atlas] Connected successfully via fallback DNS: ${conn.connection.host}/${conn.connection.name}`);
    } catch (fallbackErr: any) {
      console.error(`⚠️ [MongoDB] Connection error: ${fallbackErr.message}`);
      console.warn(`💡 Tip: Check your network connection or MONGODB_URI in backend/.env.`);
    }
  }
};

