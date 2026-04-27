// Mock io before importing routes
jest.mock('../../index', () => ({
  io: {
    emit: jest.fn(),
  },
}));

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { User } from '../../models/User';
import { Recipe } from '../../models/Recipe';
import { MealSelection } from '../../models/MealSelection';
import { AuthService } from '../../services/AuthService';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import mealsRoutes from '../../routes/meals';

let testApp: express.Application;
let validToken: string;
let testUserId: string;
let secondUserId: string;
let recipeId: string;
let mealId: string;

beforeEach(async () => {
  // Create a clean app instance for testing
  testApp = express();
  testApp.use(cors());
  testApp.use(express.json({ limit: '20mb' }));
  testApp.use('/meals', mealsRoutes);

  // Ensure mongoose is connected to test database
  if (mongoose.connection.readyState === 0) {
    // Not connected, connect to test db
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost/test';
    await mongoose.connect(mongoUri);
  }

  // Clear collections
  await User.deleteMany({});
  await Recipe.deleteMany({});
  await MealSelection.deleteMany({});

  // Create first test user
  const passwordHash1 = await AuthService.hashPassword('password123');
  const user1 = await User.create({
    email: 'test@example.com',
    passwordHash: passwordHash1,
    name: 'Test User',
    isAdmin: false,
  });
  testUserId = user1._id.toString();

  // Create second test user
  const passwordHash2 = await AuthService.hashPassword('password456');
  const user2 = await User.create({
    email: 'test2@example.com',
    passwordHash: passwordHash2,
    name: 'Test User 2',
    isAdmin: false,
  });
  secondUserId = user2._id.toString();

  // Generate a valid token for first user
  validToken = AuthService.generateToken(testUserId);

  // Create a test recipe
  const recipe = await Recipe.create({
    title: 'Test Recipe',
    ingredients: ['ingredient1'],
    steps: ['step1'],
    author: testUserId,
    tags: [],
    ratings: [],
    timesChosen: 0,
  });
  recipeId = recipe._id.toString();

  // Create a test meal
  const meal = await MealSelection.create({
    recipe: new mongoose.Types.ObjectId(recipeId),
    selectedBy: new mongoose.Types.ObjectId(testUserId),
    status: 'confirmed',
    date: new Date(),
  });
  mealId = meal._id.toString();
});

afterEach(async () => {
  // Clear collections
  await User.deleteMany({});
  await Recipe.deleteMany({});
  await MealSelection.deleteMany({});
});

describe('PUT /meals/:id/selectedBy', () => {
  it('updates selectedBy user for a meal', async () => {
    const response = await request(testApp)
      .put(`/meals/${mealId}/selectedBy`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ userId: secondUserId });

    expect(response.status).toBe(200);
    expect(response.body.meal.selectedBy._id).toBe(secondUserId);
  });

  it('returns 400 if userId is missing', async () => {
    const response = await request(testApp)
      .put(`/meals/${mealId}/selectedBy`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('returns 401 if not authenticated', async () => {
    const response = await request(testApp)
      .put(`/meals/${mealId}/selectedBy`)
      .send({ userId: secondUserId });

    expect(response.status).toBe(401);
  });
});
