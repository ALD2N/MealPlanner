import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RecipeService } from '../RecipeService';
import { Recipe } from '../../models/Recipe';
import { Types } from 'mongoose';

// Mock the Recipe model
vi.mock('../../models/Recipe');

describe('RecipeService', () => {
  const mockUserId = new Types.ObjectId().toString();
  const mockAuthorId = new Types.ObjectId().toString();

  const mockRecipeData = {
    title: 'Spaghetti',
    image: 'https://example.com/pasta.jpg',
    ingredients: ['pasta', 'tomato sauce'],
    steps: ['Boil pasta', 'Add sauce'],
    tags: ['rapide'],
  };

  const createMockRecipe = (overrides = {}) => ({
    _id: new Types.ObjectId(),
    title: 'Spaghetti',
    image: 'https://example.com/pasta.jpg',
    ingredients: ['pasta', 'tomato sauce'],
    steps: ['Boil pasta', 'Add sauce'],
    author: new Types.ObjectId(mockAuthorId),
    tags: ['rapide'],
    ratings: [],
    timesChosen: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    populate: vi.fn(),
    save: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRecipe', () => {
    it('creates a recipe with correct data', async () => {
      const mockRecipe = createMockRecipe();
      (Recipe.create as any) = vi.fn().mockResolvedValue(mockRecipe);
      mockRecipe.populate.mockResolvedValue(mockRecipe);

      const result = await RecipeService.createRecipe(mockRecipeData, mockAuthorId);

      expect(Recipe.create).toHaveBeenCalledWith({
        title: mockRecipeData.title,
        image: mockRecipeData.image,
        ingredients: mockRecipeData.ingredients,
        steps: mockRecipeData.steps,
        author: expect.any(Types.ObjectId),
        tags: mockRecipeData.tags,
        ratings: [],
        timesChosen: 0,
      });
      expect(result).toBeDefined();
    });

    it('creates recipe without image', async () => {
      const dataNoImage = { ...mockRecipeData };
      delete dataNoImage.image;

      const mockRecipe = createMockRecipe({ image: undefined });
      (Recipe.create as any) = vi.fn().mockResolvedValue(mockRecipe);
      mockRecipe.populate.mockResolvedValue(mockRecipe);

      await RecipeService.createRecipe(dataNoImage, mockAuthorId);

      expect(Recipe.create).toHaveBeenCalled();
    });
  });

  describe('getRecipes', () => {
    it('retrieves all recipes', async () => {
      const mockRecipes = [
        createMockRecipe({ title: 'Recipe 1' }),
        createMockRecipe({ title: 'Recipe 2' }),
      ];

      (Recipe.find as any) = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockRecipes),
        }),
      });

      const result = await RecipeService.getRecipes();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('returns empty array when no recipes exist', async () => {
      (Recipe.find as any) = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await RecipeService.getRecipes();

      expect(result).toEqual([]);
    });
  });

  describe('getRecipeById', () => {
    it('retrieves recipe by id', async () => {
      const mockRecipe = createMockRecipe();
      const recipeId = mockRecipe._id.toString();

      (Recipe.findById as any) = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockRecipe),
      });

      const result = await RecipeService.getRecipeById(recipeId);

      expect(Recipe.findById).toHaveBeenCalledWith(recipeId);
      expect(result).toBeDefined();
    });

    it('throws error when recipe not found', async () => {
      const recipeId = 'non-existent-id';

      (Recipe.findById as any) = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      await expect(RecipeService.getRecipeById(recipeId)).rejects.toThrow();
    });
  });

  describe('updateRecipe', () => {
    it('updates recipe data', async () => {
      const mockRecipe = createMockRecipe();
      const recipeId = mockRecipe._id.toString();
      const updateData = { title: 'Updated Spaghetti' };

      (Recipe.findById as any) = vi.fn().mockResolvedValue(mockRecipe);
      mockRecipe.populate.mockResolvedValue(mockRecipe);

      const result = await RecipeService.updateRecipe(recipeId, updateData, mockAuthorId);

      expect(mockRecipe.save).toHaveBeenCalled();
    });

    it('throws error when user is not author', async () => {
      const mockRecipe = createMockRecipe();
      const recipeId = mockRecipe._id.toString();
      const differentUserId = new Types.ObjectId().toString();

      (Recipe.findById as any) = vi.fn().mockResolvedValue(mockRecipe);

      await expect(
        RecipeService.updateRecipe(recipeId, { title: 'Updated' }, differentUserId)
      ).rejects.toThrow();
    });

    it('throws error when recipe not found', async () => {
      const recipeId = 'non-existent-id';

      (Recipe.findById as any) = vi.fn().mockResolvedValue(null);

      await expect(
        RecipeService.updateRecipe(recipeId, { title: 'Updated' }, mockAuthorId)
      ).rejects.toThrow();
    });
  });

  describe('deleteRecipe', () => {
    it('deletes recipe successfully', async () => {
      const mockRecipe = createMockRecipe();
      const recipeId = mockRecipe._id.toString();

      (Recipe.findById as any) = vi.fn().mockResolvedValue(mockRecipe);
      (Recipe.findByIdAndDelete as any) = vi.fn().mockResolvedValue(mockRecipe);

      await RecipeService.deleteRecipe(recipeId, mockAuthorId);

      expect(Recipe.findByIdAndDelete).toHaveBeenCalledWith(recipeId);
    });

    it('throws error when user is not author', async () => {
      const mockRecipe = createMockRecipe();
      const recipeId = mockRecipe._id.toString();
      const differentUserId = new Types.ObjectId().toString();

      (Recipe.findById as any) = vi.fn().mockResolvedValue(mockRecipe);

      await expect(RecipeService.deleteRecipe(recipeId, differentUserId)).rejects.toThrow();
    });

    it('throws error when recipe not found', async () => {
      const recipeId = 'non-existent-id';

      (Recipe.findById as any) = vi.fn().mockResolvedValue(null);

      await expect(RecipeService.deleteRecipe(recipeId, mockAuthorId)).rejects.toThrow();
    });
  });

  describe('addRating', () => {
    it('adds a rating to recipe', async () => {
      const mockRecipe = createMockRecipe({ ratings: [] });
      const recipeId = mockRecipe._id.toString();
      const raterId = new Types.ObjectId().toString();

      (Recipe.findById as any) = vi.fn().mockResolvedValue(mockRecipe);
      mockRecipe.populate.mockResolvedValue(mockRecipe);

      const result = await RecipeService.addRating(recipeId, raterId, 5);

      expect(mockRecipe.save).toHaveBeenCalled();
    });

    it('updates existing rating from same user', async () => {
      const raterId = new Types.ObjectId().toString();
      const mockRecipe = createMockRecipe({
        ratings: [{ userId: new Types.ObjectId(raterId), rating: 3 }],
      });
      const recipeId = mockRecipe._id.toString();

      (Recipe.findById as any) = vi.fn().mockResolvedValue(mockRecipe);
      mockRecipe.populate.mockResolvedValue(mockRecipe);

      await RecipeService.addRating(recipeId, raterId, 5);

      expect(mockRecipe.save).toHaveBeenCalled();
    });

    it('throws error when recipe not found', async () => {
      const recipeId = 'non-existent-id';
      const raterId = new Types.ObjectId().toString();

      (Recipe.findById as any) = vi.fn().mockResolvedValue(null);

      await expect(RecipeService.addRating(recipeId, raterId, 5)).rejects.toThrow();
    });

    it('accepts all valid rating values', async () => {
      const mockRecipe = createMockRecipe({ ratings: [] });
      const recipeId = mockRecipe._id.toString();
      const raterId = new Types.ObjectId().toString();

      (Recipe.findById as any) = vi.fn().mockResolvedValue(mockRecipe);
      mockRecipe.populate.mockResolvedValue(mockRecipe);

      for (const rating of [1, 2, 3, 4, 5] as const) {
        await RecipeService.addRating(recipeId, raterId, rating);
        expect(mockRecipe.save).toHaveBeenCalled();
      }
    });
  });

  describe('toResponse', () => {
    it('converts recipe to response format', () => {
      const mockRecipe = {
        _id: { toString: () => 'recipe123' },
        title: 'Test Recipe',
        image: 'https://example.com/image.jpg',
        ingredients: ['ing1', 'ing2'],
        steps: ['step1', 'step2'],
        author: {
          _id: { toString: () => 'author123' },
          email: 'author@example.com',
          name: 'Author Name',
          isAdmin: false,
          createdAt: new Date(),
        },
        tags: ['tag1'],
        ratings: [{ userId: { toString: () => 'user1' }, rating: 5 }],
        timesChosen: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = RecipeService.toResponse(mockRecipe);

      expect(response._id).toBe('recipe123');
      expect(response.title).toBe('Test Recipe');
      expect(response.author.name).toBe('Author Name');
      expect(response.ratings[0].rating).toBe(5);
      expect(response.timesChosen).toBe(10);
    });
  });
});
