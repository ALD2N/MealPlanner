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
    status: {
      type: String,
      enum: ['pending', 'confirmed'],
      default: 'pending',
      required: true,
    },
    date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

mealSelectionSchema.index({ status: 1 });
mealSelectionSchema.index({ date: -1 });

export const MealSelection = mongoose.model<IMealSelectionDocument>(
  'MealSelection',
  mealSelectionSchema
);
