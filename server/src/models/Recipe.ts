import mongoose, { Schema, Document } from 'mongoose';
import { IRecipe, IRecipeRating } from '@dndmeal/shared';

export interface IRecipeDocument extends IRecipe, Document {}

const ratingSchema = new Schema<IRecipeRating>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
  },
  { _id: false }
);

const recipeSchema = new Schema<IRecipeDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    image: String,
    ingredients: [String],
    steps: [String],
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [String],
    ratings: [ratingSchema],
    timesChosen: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Recipe = mongoose.model<IRecipeDocument>('Recipe', recipeSchema);
