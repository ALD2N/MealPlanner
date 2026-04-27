import { Router, Response, NextFunction } from 'express';
import { MealService } from '../services/MealService';
import { DiscordService } from '../services/DiscordService';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { io } from '../index';
import {
  broadcastMealSelected,
  broadcastMealConfirmed,
  broadcastMealDeselected,
  broadcastMealUpdated,
} from '../websocket/handlers';

const router = Router();

/**
 * GET /meals/current
 * Returns the pending meal selection, or null.
 */
router.get('/current', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const meal = await MealService.getCurrentMeal();
    res.status(200).json({ meal });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /meals/select
 * Create a pending meal selection. Fails with 409 if one already exists.
 */
router.post('/select', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recipeId } = req.body;

    if (!recipeId) {
      throw new AppError('MISSING_FIELDS', 400, 'recipeId is required');
    }

    const meal = await MealService.selectMeal(recipeId, req.userId as string);

    await DiscordService.notifyMealSelected(
      { _id: req.userId as string, name: req.user.name },
      meal.recipe
    );

    broadcastMealSelected(io, { recipe: meal.recipe, selectedBy: meal.selectedBy, date: meal.date });

    res.status(201).json({ meal });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /meals/current
 * Remove the pending meal selection (deselect).
 */
router.delete('/current', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await MealService.deselectMeal();
    broadcastMealDeselected(io);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /meals/confirm
 * Confirm the pending meal (mark as eaten). Adds to history with today's date.
 */
router.post('/confirm', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const meal = await MealService.confirmMeal();
    broadcastMealConfirmed(io, { meal });
    res.status(200).json({ meal });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /meals/history
 * Returns confirmed meal selections sorted by date DESC.
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const history = await MealService.getMealHistory();
    res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /meals/:id/selectedBy
 * Update who selected a meal (auth required, any user can call)
 */
router.put('/:id/selectedBy', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      throw new AppError('MISSING_FIELDS', 400, 'userId is required');
    }

    const meal = await MealService.updateMealSelectedBy(id, userId);

    broadcastMealUpdated(io, { meal });

    res.status(200).json({ meal });
  } catch (error) {
    next(error);
  }
});

export default router;
