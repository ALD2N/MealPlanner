import { describe, it, expect, beforeEach } from '@jest/globals';
import { MealService } from '../MealService';
import { MealSelection } from '../../models/MealSelection';
import { Recipe } from '../../models/Recipe';
import { Types } from 'mongoose';

jest.mock('../../models/MealSelection');
jest.mock('../../models/Recipe');

describe('MealService', () => {
  const mockRecipeId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  const mockRecipeDoc = {
    _id: new Types.ObjectId(mockRecipeId),
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
    save: jest.fn().mockResolvedValue(undefined),
  };

  const mockUserDoc = {
    _id: new Types.ObjectId(mockUserId),
    email: 'user@test.com',
    name: 'User',
    isAdmin: false,
    createdAt: new Date(),
  };

  const mockPendingDoc = {
    _id: new Types.ObjectId(),
    recipe: mockRecipeDoc,
    selectedBy: mockUserDoc,
    status: 'pending' as const,
    date: null,
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
  };

  // Helper: mock a chained .populate().populate() query that resolves to `value`
  const mockPopulateChain = (value: any) => {
    const q = { populate: jest.fn() };
    q.populate.mockReturnValueOnce(q).mockResolvedValueOnce(value);
    return q;
  };

  // Helper: mock a chained .sort().populate().populate() query that resolves to `value`
  const mockSortPopulateChain = (value: any) => {
    const q = { sort: jest.fn().mockReturnThis(), populate: jest.fn() };
    q.populate.mockReturnValueOnce(q).mockResolvedValueOnce(value);
    return q;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPendingDoc.save.mockResolvedValue(undefined);
    mockRecipeDoc.save.mockResolvedValue(undefined);
  });

  // ── selectMeal ──────────────────────────────────────────────────────────────

  describe('selectMeal', () => {
    it('throws NOT_FOUND if recipe does not exist', async () => {
      (Recipe.findById as any) = jest.fn().mockResolvedValue(null);
      await expect(MealService.selectMeal(mockRecipeId, mockUserId)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });

    it('throws CONFLICT if a pending selection already exists', async () => {
      (Recipe.findById as any) = jest.fn().mockResolvedValue(mockRecipeDoc);
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(mockPendingDoc);
      await expect(MealService.selectMeal(mockRecipeId, mockUserId)).rejects.toMatchObject({
        code: 'CONFLICT',
        statusCode: 409,
      });
    });

    it('creates a selection with status pending and date null', async () => {
      (Recipe.findById as any) = jest.fn().mockResolvedValue(mockRecipeDoc);
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(null);
      (MealSelection.create as any) = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });
      (MealSelection.findById as any) = jest.fn().mockReturnValue(mockPopulateChain(mockPendingDoc));

      await MealService.selectMeal(mockRecipeId, mockUserId);

      expect(MealSelection.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending', date: null })
      );
    });

    it('does NOT increment timesChosen on select', async () => {
      (Recipe.findById as any) = jest.fn().mockResolvedValue(mockRecipeDoc);
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(null);
      (MealSelection.create as any) = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });
      (MealSelection.findById as any) = jest.fn().mockReturnValue(mockPopulateChain(mockPendingDoc));

      await MealService.selectMeal(mockRecipeId, mockUserId);

      expect(mockRecipeDoc.save).not.toHaveBeenCalled();
    });
  });

  // ── deselectMeal ────────────────────────────────────────────────────────────

  describe('deselectMeal', () => {
    it('throws NOT_FOUND if no pending selection', async () => {
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(null);
      await expect(MealService.deselectMeal()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });

    it('deletes the pending selection', async () => {
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(mockPendingDoc);
      (MealSelection.deleteOne as any) = jest.fn().mockResolvedValue({});

      await MealService.deselectMeal();

      expect(MealSelection.findOne).toHaveBeenCalledWith({ status: 'pending' });
      expect(MealSelection.deleteOne).toHaveBeenCalledWith({ _id: mockPendingDoc._id });
    });
  });

  // ── confirmMeal ─────────────────────────────────────────────────────────────

  describe('confirmMeal', () => {
    it('throws NOT_FOUND if no pending selection', async () => {
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(null);
      await expect(MealService.confirmMeal()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });

    it('sets status to confirmed and date to today', async () => {
      const savablePending = { ...mockPendingDoc, status: 'pending' as any, date: null as any, save: jest.fn().mockResolvedValue(undefined) };
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(savablePending);
      (Recipe.findById as any) = jest.fn().mockResolvedValue({ ...mockRecipeDoc, save: jest.fn().mockResolvedValue(undefined) });
      (MealSelection.findById as any) = jest.fn().mockReturnValue(mockPopulateChain({
        ...savablePending,
        status: 'confirmed',
        date: new Date(),
      }));

      await MealService.confirmMeal();

      expect(savablePending.status).toBe('confirmed');
      expect(savablePending.date).toBeInstanceOf(Date);
      expect(savablePending.save).toHaveBeenCalled();
    });

    it('increments timesChosen on confirm', async () => {
      const savablePending = { ...mockPendingDoc, save: jest.fn().mockResolvedValue(undefined) };
      const savableRecipe = { ...mockRecipeDoc, timesChosen: 2, save: jest.fn().mockResolvedValue(undefined) };
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(savablePending);
      (Recipe.findById as any) = jest.fn().mockResolvedValue(savableRecipe);
      (MealSelection.findById as any) = jest.fn().mockReturnValue(mockPopulateChain({
        ...savablePending,
        status: 'confirmed',
        date: new Date(),
      }));

      await MealService.confirmMeal();

      expect(savableRecipe.timesChosen).toBe(3);
      expect(savableRecipe.save).toHaveBeenCalled();
    });
  });

  // ── getCurrentMeal ──────────────────────────────────────────────────────────

  describe('getCurrentMeal', () => {
    it('queries by status pending', async () => {
      (MealSelection.findOne as any) = jest.fn().mockReturnValue(mockPopulateChain(null));

      await MealService.getCurrentMeal();

      expect(MealSelection.findOne).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('returns null when no pending meal', async () => {
      (MealSelection.findOne as any) = jest.fn().mockReturnValue(mockPopulateChain(null));

      const result = await MealService.getCurrentMeal();

      expect(result).toBeNull();
    });
  });

  // ── getMealHistory ──────────────────────────────────────────────────────────

  describe('getMealHistory', () => {
    it('queries by status confirmed', async () => {
      (MealSelection.find as any) = jest.fn().mockReturnValue(mockSortPopulateChain([]));

      await MealService.getMealHistory();

      expect(MealSelection.find).toHaveBeenCalledWith({ status: 'confirmed' });
    });

    it('sorts by date descending', async () => {
      const sortSpy = jest.fn().mockReturnThis();
      const populateSpy = jest.fn();
      populateSpy.mockReturnValueOnce({ populate: jest.fn().mockResolvedValueOnce([]) });
      (MealSelection.find as any) = jest.fn().mockReturnValue({
        sort: sortSpy,
        populate: populateSpy,
      });

      await MealService.getMealHistory();

      expect(sortSpy).toHaveBeenCalledWith({ date: -1 });
    });

    it('returns empty array when no confirmed meals', async () => {
      (MealSelection.find as any) = jest.fn().mockReturnValue(mockSortPopulateChain([]));

      const result = await MealService.getMealHistory();

      expect(result).toEqual([]);
    });
  });
});
