import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows / Wi-Fi SRV query ECONNREFUSED issues with MongoDB Atlas clusters
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr: any) {
  console.warn('[DNS] Could not set custom DNS servers:', dnsErr.message);
}

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendiq';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ [MongoDB Atlas] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: any) {
    console.error(`⚠️ [MongoDB] Connection error: ${error.message}`);
    console.warn(`💡 Tip: Check your network connection or MONGODB_URI in backend/.env.`);
  }
};
