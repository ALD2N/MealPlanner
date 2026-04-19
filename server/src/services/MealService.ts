import { MealSelection } from '../models/MealSelection';
import { Recipe } from '../models/Recipe';
import { AppError } from '../middleware/errorHandler';
import { IMealSelectionResponse, IRecipeResponse, IUserResponse } from '@dndmeal/shared';
import { Types } from 'mongoose';

export class MealService {
  static async selectMeal(
    recipeId: string,
    userId: string,
    date: Date
  ): Promise<IMealSelectionResponse> {
    // Verify recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new AppError('NOT_FOUND', 404, 'Recipe not found');
    }

    // Normalize date to start of day (00:00:00)
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Create meal selection
    const mealSelection = await MealSelection.create({
      recipe: new Types.ObjectId(recipeId),
      selectedBy: new Types.ObjectId(userId),
      date: normalizedDate,
    });

    // Increment timesChosen
    recipe.timesChosen = (recipe.timesChosen || 0) + 1;
    await recipe.save();

    // Populate and return
    const populated = await mealSelection.populate('recipe').populate('selectedBy');
    return this.toResponse(populated);
  }

  static async getCurrentMeal(): Promise<IMealSelectionResponse | null> {
    // Get today at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get tomorrow at 00:00:00
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find meal where date is between today 00:00 and tomorrow 00:00
    const mealSelection = await MealSelection.findOne({
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate('recipe')
      .populate('selectedBy');

    if (!mealSelection) {
      return null;
    }

    return this.toResponse(mealSelection);
  }

  static async getMealHistory(): Promise<IMealSelectionResponse[]> {
    // Get all past meals sorted by date DESC
    const mealSelections = await MealSelection.find()
      .sort({ date: -1 })
      .populate('recipe')
      .populate('selectedBy');

    return mealSelections.map(meal => this.toResponse(meal));
  }

  static toResponse(meal: any): IMealSelectionResponse {
    const recipe = meal.recipe as any;
    const selectedBy = meal.selectedBy as any;

    // Convert recipe to IRecipeResponse
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

    // Convert selectedBy to IUserResponse
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
      date: meal.date,
      createdAt: meal.createdAt,
    };
  }
}
