import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows / Wi-Fi SRV query ECONNREFUSED issues with MongoDB Atlas clusters
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr: any) {
  console.warn('[DNS] Could not set custom DNS servers:', dnsErr.message);
}

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  const envUri = process.env.MONGODB_URI?.trim();

  // 1. Try MONGODB_URI if provided in .env
  if (envUri) {
    try {
      console.log('🔄 Connecting to MongoDB from MONGODB_URI...');
      const conn = await mongoose.connect(envUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ [MongoDB Atlas/Remote] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
      await autoSeed();
      return;
    } catch (error: any) {
      console.warn(`⚠️ [MongoDB Remote] Connection failed: ${error.message}`);
    }
  }

  // 2. Try Local MongoDB on port 27017
  try {
    const conn = await mongoose.connect('mongodb://127.0.0.1:27017/attendiq', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`✅ [MongoDB Local] Connected to local service on 127.0.0.1:27017`);
    await autoSeed();
    return;
  } catch (_localErr) {
    // Local MongoDB is not running, proceed to embedded Mongo
  }

  // 3. Fallback to zero-config in-memory MongoDB engine
  try {
    console.log('⚡ [MongoDB] Starting embedded in-memory database engine...');
    mongod = await MongoMemoryServer.create({
      instance: { dbName: 'attendiq' },
    });
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`✅ [MongoDB Memory Server] Embedded database ready! Zero external setup required.`);
    await autoSeed();
  } catch (memErr: any) {
    console.error(`⚠️ [MongoDB] Embedded database could not be started: ${memErr.message}`);
    console.warn(`💡 Tip: Provide a free MongoDB Atlas URI in backend/.env if needed.`);
  }
};

async function autoSeed() {
  try {
    const { seedIfEmpty } = await import('../utils/seedData.js');
    if (typeof seedIfEmpty === 'function') {
      await seedIfEmpty();
    }
  } catch (err: any) {
    console.warn('[Seed] Notice:', err.message);
  }
}
