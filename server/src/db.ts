import mongoose from 'mongoose';
import { config } from './config';

let mongoServer: any = null;

export async function connectDB() {
  try {
    // Use in-memory MongoDB for development if real MongoDB is unavailable
    if (config.NODE_ENV === 'development') {
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

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}
