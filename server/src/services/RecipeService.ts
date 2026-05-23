import { Recipe } from '../models/Recipe.js';
import { AppError } from '../middleware/errorHandler.js';
import { IRecipeResponse, IUserResponse } from '@dndmeal/shared';
import { Types } from 'mongoose';

export class RecipeService {
  static async createRecipe(
    data: {
      title: string;
      image?: string;
      ingredients: string[];
      steps: string[];
      tags: string[];
    },
    authorId: string
  ): Promise<IRecipeResponse> {
    const recipe = await Recipe.create({
      title: data.title,
      image: data.image,
      ingredients: data.ingredients,
      steps: data.steps,
      author: new Types.ObjectId(authorId),
      tags: data.tags,
      ratings: [],
      timesChosen: 0,
    });

    return this.toResponse(await recipe.populate('author'));
  }

  static async getRecipes(): Promise<IRecipeResponse[]> {
    const recipes = await Recipe.find().populate('author').lean();
    return recipes.map(recipe => this.toResponse(recipe));
  }

  static async getRecipeById(id: string): Promise<IRecipeResponse> {
    const recipe = await Recipe.findById(id).populate('author');
    if (!recipe) {
      throw new AppError('NOT_FOUND', 404, 'Recipe not found');
    }
    return this.toResponse(recipe);
  }

  static async updateRecipe(
    id: string,
    data: {
      title?: string;
      image?: string;
      ingredients?: string[];
      steps?: string[];
      tags?: string[];
    },
    userId: string
  ): Promise<IRecipeResponse> {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      throw new AppError('NOT_FOUND', 404, 'Recipe not found');
    }

    if (data.title !== undefined) recipe.title = data.title;
    if (data.image !== undefined) recipe.image = data.image;
    if (data.ingredients !== undefined) recipe.ingredients = data.ingredients;
    if (data.steps !== undefined) recipe.steps = data.steps;
    if (data.tags !== undefined) recipe.tags = data.tags;

    await recipe.save();
    return this.toResponse(await recipe.populate('author'));
  }

  static async deleteRecipe(id: string, userId: string): Promise<void> {
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      throw new AppError('NOT_FOUND', 404, 'Recipe not found');
    }

    await Recipe.findByIdAndDelete(id);
  }

  static async addRating(
    recipeId: string,
    userId: string,
    rating: 1 | 2 | 3 | 4 | 5
  ): Promise<IRecipeResponse> {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new AppError('NOT_FOUND', 404, 'Recipe not found');
    }

    // Remove existing rating from this user if present
    recipe.ratings = recipe.ratings.filter(
      r => r.userId.toString() !== userId
    );

    // Add new rating
    recipe.ratings.push({
      userId: new Types.ObjectId(userId) as any,
      rating,
    });

    await recipe.save();
    return this.toResponse(await recipe.populate('author'));
  }

  static toResponse(recipe: any): IRecipeResponse {
    const author = recipe.author as any;

    const authorResponse: IUserResponse = {
      _id: author._id.toString(),
      email: author.email,
      name: author.name,
      isAdmin: author.isAdmin,
      createdAt: author.createdAt,
    };

    return {
      _id: recipe._id.toString(),
      title: recipe.title,
      image: recipe.image,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      author: authorResponse,
      tags: recipe.tags,
      ratings: recipe.ratings.map((r: any) => ({
        userId: r.userId.toString(),
        rating: r.rating,
      })),
      timesChosen: recipe.timesChosen,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }
}
