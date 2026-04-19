import mongoose, { Schema, Document } from 'mongoose';
import { IMealSelection } from '@dndmeal/shared';

export interface IMealSelectionDocument extends Omit<IMealSelection, '_id'>, Document {}

const mealSelectionSchema = new Schema<IMealSelectionDocument>(
  {
    recipe: {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    selectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Index to find current meal quickly
mealSelectionSchema.index({ date: -1 });

export const MealSelection = mongoose.model<IMealSelectionDocument>(
  'MealSelection',
  mealSelectionSchema
);
