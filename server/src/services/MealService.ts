import { MealSelection } from '../models/MealSelection';
import { Recipe } from '../models/Recipe';
import { AppError } from '../middleware/errorHandler';
import { IMealSelectionResponse, IRecipeResponse, IUserResponse } from '@dndmeal/shared';
import { Types } from 'mongoose';

export class MealService {
  static async selectMeal(
    recipeId: string,
    userId: string
  ): Promise<IMealSelectionResponse> {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new AppError('NOT_FOUND', 404, 'Recipe not found');
    }

    const existing = await MealSelection.findOne({ status: 'pending' });
    if (existing) {
      throw new AppError('CONFLICT', 409, 'A meal is already selected');
    }

    const mealSelection = await MealSelection.create({
      recipe: new Types.ObjectId(recipeId),
      selectedBy: new Types.ObjectId(userId),
      status: 'pending',
      date: null,
    });

    const populated = await MealSelection.findById(mealSelection._id)
      .populate('recipe')
      .populate('selectedBy');
    return this.toResponse(populated as any);
  }

  static async deselectMeal(): Promise<void> {
    const pending = await MealSelection.findOne({ status: 'pending' });
    if (!pending) {
      throw new AppError('NOT_FOUND', 404, 'No pending meal selection');
    }
    await MealSelection.deleteOne({ _id: pending._id });
  }

  static async confirmMeal(): Promise<IMealSelectionResponse> {
    const pending = await MealSelection.findOne({ status: 'pending' });
    if (!pending) {
      throw new AppError('NOT_FOUND', 404, 'No pending meal selection');
    }

    (pending as any).status = 'confirmed';
    (pending as any).date = new Date();
    await pending.save();

    const recipe = await Recipe.findById(pending.recipe);
    if (recipe) {
      recipe.timesChosen = (recipe.timesChosen || 0) + 1;
      await recipe.save();
    }

    const populated = await MealSelection.findById(pending._id)
      .populate('recipe')
      .populate('selectedBy');
    return this.toResponse(populated as any);
  }

  static async getCurrentMeal(): Promise<IMealSelectionResponse | null> {
    const mealSelection = await MealSelection.findOne({ status: 'pending' })
      .populate('recipe')
      .populate('selectedBy');

    if (!mealSelection) {
      return null;
    }

    return this.toResponse(mealSelection);
  }

  static async getMealHistory(): Promise<IMealSelectionResponse[]> {
    const mealSelections = await MealSelection.find({ status: 'confirmed' })
      .sort({ date: -1 })
      .populate('recipe')
      .populate('selectedBy');

    return mealSelections.map(meal => this.toResponse(meal));
  }

  static toResponse(meal: any): IMealSelectionResponse {
    const recipe = meal.recipe as any;
    const selectedBy = meal.selectedBy as any;

    const recipeResponse: IRecipeResponse = {
      _id: recipe._id.toString(),
      title: recipe.title,
      image: recipe.image,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      author: {
        _id: recipe.author._id.toString(),
        email: recipe.author.email,
        name: recipe.author.name,
        isAdmin: recipe.author.isAdmin,
        createdAt: recipe.author.createdAt,
      },
      tags: recipe.tags,
      ratings: recipe.ratings.map((r: any) => ({
        userId: r.userId.toString(),
        rating: r.rating,
      })),
      timesChosen: recipe.timesChosen,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };

    const selectedByResponse: IUserResponse = {
      _id: selectedBy._id.toString(),
      email: selectedBy.email,
      name: selectedBy.name,
      isAdmin: selectedBy.isAdmin,
      createdAt: selectedBy.createdAt,
    };

    return {
      _id: meal._id.toString(),
      recipe: recipeResponse,
      selectedBy: selectedByResponse,
      status: meal.status,
      date: meal.date,
      createdAt: meal.createdAt,
    };
  }
}
