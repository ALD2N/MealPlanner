import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { AuthService } from '../../services/AuthService';
import { Server } from 'http';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import http from 'http';
import authRoutes from '../../routes/auth';

let testApp: express.Application;
let server: Server;
let validToken: string;

beforeEach(async () => {
  // Create a clean app instance for testing
  testApp = express();
  testApp.use(cors());
  testApp.use(express.json({ limit: '20mb' }));
  testApp.use('/auth', authRoutes);

  // Ensure mongoose is connected to test database
  if (mongoose.connection.readyState === 0) {
    // Not connected, connect to test db
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-dndmeal';
    await mongoose.connect(mongoUri);
  }

  // Clear users collection
  await User.deleteMany({});

  // Create a test user
  const passwordHash = await AuthService.hashPassword('password123');
  const user = await User.create({
    email: 'test@example.com',
    passwordHash,
    name: 'Test User',
    isAdmin: false,
  });

  // Generate a valid token
  validToken = AuthService.generateToken(user._id.toString());
});

afterEach(async () => {
  // Clear users collection
  await User.deleteMany({});
});

describe('GET /auth/users', () => {
  it('returns list of all users', async () => {
    // Create additional test users
    const passwordHash = await AuthService.hashPassword('password456');
    await User.create({
      email: 'user2@example.com',
      passwordHash,
      name: 'User Two',
      isAdmin: false,
    });

    const response = await request(testApp)
      .get('/auth/users')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toBeInstanceOf(Array);
    expect(response.body.users.length).toBe(2);
    expect(response.body.users[0]).toHaveProperty('_id');
    expect(response.body.users[0]).toHaveProperty('name');
    expect(response.body.users[0]).toHaveProperty('email');
    expect(response.body.users[0]).not.toHaveProperty('passwordHash');
  });

  it('returns 401 if not authenticated', async () => {
    const response = await request(testApp).get('/auth/users');

    expect(response.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const response = await request(testApp)
      .get('/auth/users')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });
});
