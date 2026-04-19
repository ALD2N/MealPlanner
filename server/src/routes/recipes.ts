import { Router, Response, NextFunction } from 'express';
import { RecipeService } from '../services/RecipeService';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /recipes
 * Get all recipes (auth required)
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recipes = await RecipeService.getRecipes();
    res.status(200).json({ recipes });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /recipes
 * Create a new recipe (auth required)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, image, ingredients, steps, tags } = req.body;

    // Validate required fields
    if (!title || !ingredients || !steps) {
      throw new AppError('MISSING_FIELDS', 400, 'Title, ingredients, and steps are required');
    }

    const recipe = await RecipeService.createRecipe(
      {
        title,
        image,
        ingredients,
        steps,
        tags: tags || [],
      },
      req.userId as string
    );

    // TODO: broadcastRecipeAdded(io, { recipe });

    res.status(201).json({ recipe });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /recipes/:id
 * Get a recipe by ID (auth required)
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const recipe = await RecipeService.getRecipeById(id);
    res.status(200).json({ recipe });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /recipes/:id
 * Update a recipe (auth required)
 */
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, image, ingredients, steps, tags } = req.body;

    const recipe = await RecipeService.updateRecipe(
      id,
      {
        title,
        image,
        ingredients,
        steps,
        tags,
      },
      req.userId as string
    );

    // TODO: broadcastRecipeUpdated(io, { recipe });

    res.status(200).json({ recipe });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /recipes/:id
 * Delete a recipe (auth required)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await RecipeService.deleteRecipe(id, req.userId as string);

    // TODO: broadcastRecipeDeleted(io, { recipeId: id });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /recipes/:id/rating
 * Add or update a rating for a recipe (auth required)
 */
router.patch('/:id/rating', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    // Validate rating
    if (rating === undefined || rating === null) {
      throw new AppError('MISSING_FIELDS', 400, 'Rating is required');
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError('INVALID_RATING', 400, 'Rating must be an integer between 1 and 5');
    }

    const recipe = await RecipeService.addRating(id, req.userId as string, rating);

    // TODO: broadcastRatingAdded(io, { recipeId: id, userId: req.userId, rating });

    res.status(200).json({ recipe });
  } catch (error) {
    next(error);
  }
});

export default router;
