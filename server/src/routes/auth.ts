import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { InviteService } from '../services/InviteService.js';
import { AppError } from '../middleware/errorHandler.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

/**
 * POST /auth/register
 * Register the first user (no auth required)
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      throw new AppError('MISSING_FIELDS', 400, 'Email, password, and name are required');
    }

    const result = await AuthService.registerFirstUser(email, password, name);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/register-with-invite
 * Register a new user with an invite link (no auth required)
 */
router.post('/register-with-invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, token } = req.body;

    // Validate required fields
    if (!email || !password || !name || !token) {
      throw new AppError('MISSING_FIELDS', 400, 'Email, password, name, and token are required');
    }

    // Validate and use the invite link
    await InviteService.useInviteLink(token);

    // Register the user with invite
    const result = await AuthService.registerWithInvite(email, password, name);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 * Login user (no auth required)
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new AppError('MISSING_FIELDS', 400, 'Email and password are required');
    }

    const result = await AuthService.login(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current user (auth required)
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = AuthService.userToResponse(req.user);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/invite-links/:token/valid
 * Validate an invite link (no auth required)
 */
router.get(
  '/invite-links/:token/valid',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;

      const result = await InviteService.validateInviteLink(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /auth/users
 * Returns all registered users (auth required)
 */
router.get('/users', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find({}, { passwordHash: 0 }).lean();
    const userResponses = users.map(user => AuthService.userToResponse(user));
    res.status(200).json({ users: userResponses });
  } catch (error) {
    next(error);
  }
});

export default router;
