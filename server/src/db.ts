import mongoose from 'mongoose';
import { config } from './config.js';

let mongoServer: any = null;

export async function connectDB() {
  try {
    // Skip MongoMemoryServer if MONGODB_URI is explicitly set (Docker/production)
    // or if running on Alpine Linux (MongoMemoryServer incompatible)
    const useMongoMemory =
      config.NODE_ENV === 'development' &&
      !process.env.MONGODB_URI &&
      !isAlpineLinux();

    if (useMongoMemory) {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('✓ In-memory MongoDB started (development mode)');
        return;
      } catch (error) {
        console.log('⚠ In-memory MongoDB unavailable, trying configured URI...');
      }
    }

    await mongoose.connect(config.MONGODB_URI);
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
}

function isAlpineLinux(): boolean {
  try {
    // Check if running on Alpine Linux
    const fs = require('fs');
    return fs.existsSync('/etc/alpine-release');
  } catch {
    return false;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}
