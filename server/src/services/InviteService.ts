import { InviteLink, IInviteLinkDocument } from '../models/InviteLink';
import { AppError } from '../middleware/errorHandler';
import { IInviteLinkResponse } from '@dndmeal/shared';
import { config } from '../config';
import { User } from '../models/User';

export class InviteService {
  static async generateInviteLink(
    createdByUserId: string
  ): Promise<IInviteLinkResponse> {
    const link = await InviteLink.create({
      createdBy: createdByUserId,
    });

    return this.toResponse(link);
  }

  static async validateInviteLink(
    token: string
  ): Promise<{ isValid: boolean; expiresAt?: Date }> {
    const link = await InviteLink.findOne({ token });

    if (!link) {
      return { isValid: false };
    }

    const now = new Date();
    if (link.expiresAt < now) {
      return { isValid: false };
    }

    return { isValid: true, expiresAt: link.expiresAt };
  }

  static async useInviteLink(token: string): Promise<void> {
    const link = await InviteLink.findOne({ token });

    if (!link) {
      throw new AppError(
        'INVITE_NOT_FOUND',
        404,
        'Invite link not found'
      );
    }

    const now = new Date();
    if (link.expiresAt < now) {
      throw new AppError(
        'INVITE_EXPIRED',
        400,
        'Invite link has expired'
      );
    }

    link.usedCount += 1;
    await link.save();
  }

  static async listInviteLinks(
    createdByUserId: string
  ): Promise<IInviteLinkResponse[]> {
    const links = await InviteLink.find({ createdBy: createdByUserId })
      .populate('createdBy')
      .exec();

    return links.map((link) => this.toResponse(link));
  }

  static async revokeInviteLink(token: string): Promise<void> {
    const result = await InviteLink.deleteOne({ token });

    if (result.deletedCount === 0) {
      throw new AppError(
        'INVITE_NOT_FOUND',
        404,
        'Invite link not found'
      );
    }
  }

  static toResponse(link: IInviteLinkDocument): IInviteLinkResponse {
    const createdByUser = link.createdBy as any;

    return {
      token: link.token,
      url: `${config.CORS_ORIGIN}/register?token=${link.token}`,
      expiresAt: link.expiresAt,
      usedCount: link.usedCount,
      createdBy: createdByUser._id
        ? {
            _id: createdByUser._id.toString(),
            email: createdByUser.email,
            name: createdByUser.name,
            isAdmin: createdByUser.isAdmin,
            createdAt: createdByUser.createdAt,
          }
        : undefined,
      createdAt: link.createdAt,
    };
  }
}
