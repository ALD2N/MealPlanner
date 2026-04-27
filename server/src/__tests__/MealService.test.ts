import { describe, it, expect, beforeEach } from '@jest/globals';
import { MealService } from '../services/MealService';
import { MealSelection } from '../models/MealSelection';
import { Types } from 'mongoose';

jest.mock('../models/MealSelection');

describe('MealService.updateMealSelectedBy', () => {
  const mockMealId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  const mockRecipeDoc = {
    _id: new Types.ObjectId(),
    title: 'Pasta',
    image: undefined,
    ingredients: ['pasta'],
    steps: ['boil'],
    author: {
      _id: new Types.ObjectId(),
      email: 'a@b.com',
      name: 'Author',
      isAdmin: false,
      createdAt: new Date(),
    },
    tags: [],
    ratings: [],
    timesChosen: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserDoc = {
    _id: new Types.ObjectId(mockUserId),
    email: 'user@test.com',
    name: 'User',
    isAdmin: false,
    createdAt: new Date(),
  };

  const mockMealDoc = {
    _id: new Types.ObjectId(mockMealId),
    recipe: mockRecipeDoc,
    selectedBy: mockUserDoc,
    status: 'confirmed' as const,
    date: new Date(),
    createdAt: new Date(),
  };

  // Helper: mock a chained .populate().populate() query that resolves to `value`
  const mockPopulateChain = (value: any) => {
    const q = { populate: jest.fn() };
    q.populate.mockReturnValueOnce(q).mockResolvedValueOnce(value);
    return q;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates selectedBy for an existing meal', async () => {
    (MealSelection.findByIdAndUpdate as any) = jest
      .fn()
      .mockReturnValue(mockPopulateChain(mockMealDoc));

    const result = await MealService.updateMealSelectedBy(mockMealId, mockUserId);

    expect(result.selectedBy.name).toBe('User');
    expect(MealSelection.findByIdAndUpdate).toHaveBeenCalledWith(
      mockMealId,
      { selectedBy: expect.any(Types.ObjectId) },
      { new: true }
    );
  });

  it('throws error if meal not found', async () => {
    (MealSelection.findByIdAndUpdate as any) = jest.fn().mockReturnValue(mockPopulateChain(null));

    await expect(MealService.updateMealSelectedBy(mockMealId, mockUserId)).rejects.toMatchObject({
      code: 'MEAL_NOT_FOUND',
      statusCode: 404,
    });
  });
});
