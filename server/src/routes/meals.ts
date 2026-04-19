import { Router, Response, NextFunction } from 'express';
import { MealService } from '../services/MealService';
import { DiscordService } from '../services/DiscordService';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /meals/current
 * Get current meal (today's meal) (auth required)
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
 * Select a meal for tomorrow (auth required)
 */
router.post('/select', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { recipeId } = req.body;

    // Validate required fields
    if (!recipeId) {
      throw new AppError('MISSING_FIELDS', 400, 'recipeId is required');
    }

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Select the meal
    const meal = await MealService.selectMeal(recipeId, req.userId as string, tomorrow);

    // Notify Discord
    await DiscordService.notifyMealSelected(
      { _id: req.userId as string, name: req.user.name },
      meal.recipe
    );

    // TODO: broadcastMealSelected(io, { recipe: meal.recipe, selectedBy: meal.selectedBy, date: meal.date });

    res.status(201).json({ meal });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /meals/history
 * Get meal history (auth required)
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const history = await MealService.getMealHistory();
    res.status(200).json({ history });
  } catch (error) {
    next(error);
  }
});

export default router;
