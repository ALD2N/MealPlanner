import mongoose, { Schema, Document } from 'mongoose';
import { IInviteLink } from '@dndmeal/shared';
import crypto from 'crypto';

export interface IInviteLinkDocument extends Omit<IInviteLink, '_id'>, Document {}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const inviteLinkSchema = new Schema<IInviteLinkDocument>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      default: generateToken,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for quick expiration check
inviteLinkSchema.index({ expiresAt: 1 });

export const InviteLink = mongoose.model<IInviteLinkDocument>(
  'InviteLink',
  inviteLinkSchema
);
