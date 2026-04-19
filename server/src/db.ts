import mongoose from 'mongoose';
import { config } from './config';

export async function connectDB() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
