import { Router, Request, Response, NextFunction } from 'express';
import { InviteService } from '../services/InviteService.js';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * POST /admin/invite-links/generate
 * Generate a new invite link (auth + admin required)
 */
router.post(
  '/invite-links/generate',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const link = await InviteService.generateInviteLink(req.userId!);
      res.status(201).json({ link });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /admin/invite-links
 * List all invite links (auth + admin required)
 */
router.get(
  '/invite-links',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const links = await InviteService.listInviteLinks(req.userId!);
      res.status(200).json({ links });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /admin/invite-links/:token
 * Revoke an invite link (auth + admin required)
 */
router.delete(
  '/invite-links/:token',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;

      // Validate token param
      if (!token) {
        throw new AppError('MISSING_FIELDS', 400, 'Token is required');
      }

      await InviteService.revokeInviteLink(token);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
