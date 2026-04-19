# Meal Selection Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a two-step meal selection flow: select (pending) → confirm (history entry created) or deselect (cancelled).

**Architecture:** Add a `status: 'pending' | 'confirmed'` field to `MealSelection`. The current meal is always the pending one. History only shows confirmed. `timesChosen` increments and `date` is set only on confirmation.

**Tech Stack:** TypeScript, Express, Mongoose, React, Socket.IO

---

## File Map

| File | Change |
|------|--------|
| `shared/src/types.ts` | Add `status`, make `date: Date \| null` on `IMealSelection` + `IMealSelectionResponse`, add WS events |
| `server/src/models/MealSelection.ts` | Add `status` field, make `date` optional |
| `server/src/services/__tests__/MealService.test.ts` | New file — unit tests for MealService |
| `server/src/services/MealService.ts` | Update `selectMeal`, add `deselectMeal` + `confirmMeal`, filter by status |
| `server/src/routes/meals.ts` | Add `DELETE /meals/current`, `POST /meals/confirm`, update `POST /meals/select` |
| `server/src/websocket/handlers.ts` | Add `broadcastMealConfirmed`, `broadcastMealDeselected` |
| `client/src/hooks/useMealSelection.ts` | Add `deselectMeal()`, `confirmMeal()` |
| `client/src/components/RecipeModal.tsx` | Add `hasPendingMeal` prop, disable select button |
| `client/src/pages/HomePage.tsx` | Replace "Changer" with "Déselectionner" + "On a mangé ça!" |

---

## Task 1: Update shared types

**Files:**
- Modify: `shared/src/types.ts`

- [ ] **Step 1: Update `IMealSelection` and `IMealSelectionResponse`**

Replace the `IMealSelection` and `IMealSelectionResponse` interfaces and the `IWebSocketPayloads` interface in `shared/src/types.ts`:

```ts
// ===== MealSelection =====
export interface IMealSelection {
  _id?: ObjectId;
  recipe: ObjectId;
  selectedBy: ObjectId;
  status: 'pending' | 'confirmed';
  date: Date | null;
  createdAt?: Date;
}

export interface IMealSelectionResponse {
  _id: string;
  recipe: IRecipeResponse;
  selectedBy: IUserResponse;
  status: 'pending' | 'confirmed';
  date: Date | null;
  createdAt: Date;
}
```

Replace `IWebSocketPayloads` with:

```ts
export interface IWebSocketPayloads {
  'meal:selected': {
    recipe: IRecipeResponse;
    selectedBy: IUserResponse;
    date: Date | null;
  };
  'meal:confirmed': {
    meal: IMealSelectionResponse;
  };
  'meal:deselected': Record<string, never>;
  'recipe:added': {
    recipe: IRecipeResponse;
  };
  'recipe:updated': {
    recipe: IRecipeResponse;
  };
  'recipe:deleted': {
    recipeId: string;
  };
  'rating:added': {
    recipeId: string;
    userId: string;
    rating: 1 | 2 | 3 | 4 | 5;
  };
}
```

- [ ] **Step 2: Build shared package to verify no type errors**

```bash
cd /home/ald2n/Kod/MealPlanner/shared && npm run build
```

Expected: exits 0 with no errors.

- [ ] **Step 3: Commit**

```bash
git add shared/src/types.ts
git commit -m "feat(shared): add status and nullable date to MealSelection types"
```

---

## Task 2: Update MealSelection Mongoose model

**Files:**
- Modify: `server/src/models/MealSelection.ts`

- [ ] **Step 1: Add `status` and make `date` optional**

Replace the full content of `server/src/models/MealSelection.ts`:

```ts
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
```

- [ ] **Step 2: Build server to verify no type errors**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npm run build 2>&1 | head -30
```

Expected: exits 0 or only pre-existing errors unrelated to MealSelection.

- [ ] **Step 3: Commit**

```bash
git add server/src/models/MealSelection.ts
git commit -m "feat(server): add status field and nullable date to MealSelection model"
```

---

## Task 3: Write failing MealService tests

**Files:**
- Create: `server/src/services/__tests__/MealService.test.ts`

- [ ] **Step 1: Create the test file**

```ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { MealService } from '../MealService';
import { MealSelection } from '../../models/MealSelection';
import { Recipe } from '../../models/Recipe';
import { Types } from 'mongoose';

jest.mock('../../models/MealSelection');
jest.mock('../../models/Recipe');

describe('MealService', () => {
  const mockRecipeId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  const mockRecipeDoc = {
    _id: new Types.ObjectId(mockRecipeId),
    title: 'Pasta',
    image: undefined,
    ingredients: ['pasta'],
    steps: ['boil'],
    author: {
      _id: new Types.ObjectId(),
      email: 'a@b.com',
      name: 'Author',
      isAdmin: false,
      createdAt: new Date(),
    },
    tags: [],
    ratings: [],
    timesChosen: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
  };

  const mockUserDoc = {
    _id: new Types.ObjectId(mockUserId),
    email: 'user@test.com',
    name: 'User',
    isAdmin: false,
    createdAt: new Date(),
  };

  const mockPendingDoc = {
    _id: new Types.ObjectId(),
    recipe: mockRecipeDoc,
    selectedBy: mockUserDoc,
    status: 'pending' as const,
    date: null,
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
  };

  // Helper: mock a chained .populate().populate() query that resolves to `value`
  const mockPopulateChain = (value: any) => {
    const q = { populate: jest.fn() };
    q.populate.mockReturnValueOnce(q).mockResolvedValueOnce(value);
    return q;
  };

  // Helper: mock a chained .sort().populate().populate() query that resolves to `value`
  const mockSortPopulateChain = (value: any) => {
    const q = { sort: jest.fn().mockReturnThis(), populate: jest.fn() };
    q.populate.mockReturnValueOnce(q).mockResolvedValueOnce(value);
    return q;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPendingDoc.save.mockResolvedValue(undefined);
    mockRecipeDoc.save.mockResolvedValue(undefined);
  });

  // ── selectMeal ──────────────────────────────────────────────────────────────

  describe('selectMeal', () => {
    it('throws NOT_FOUND if recipe does not exist', async () => {
      (Recipe.findById as any) = jest.fn().mockResolvedValue(null);
      await expect(MealService.selectMeal(mockRecipeId, mockUserId)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });

    it('throws CONFLICT if a pending selection already exists', async () => {
      (Recipe.findById as any) = jest.fn().mockResolvedValue(mockRecipeDoc);
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(mockPendingDoc);
      await expect(MealService.selectMeal(mockRecipeId, mockUserId)).rejects.toMatchObject({
        code: 'CONFLICT',
        statusCode: 409,
      });
    });

    it('creates a selection with status pending and date null', async () => {
      (Recipe.findById as any) = jest.fn().mockResolvedValue(mockRecipeDoc);
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(null);
      (MealSelection.create as any) = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });
      (MealSelection.findById as any) = jest.fn().mockReturnValue(mockPopulateChain(mockPendingDoc));

      await MealService.selectMeal(mockRecipeId, mockUserId);

      expect(MealSelection.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending', date: null })
      );
    });

    it('does NOT increment timesChosen on select', async () => {
      (Recipe.findById as any) = jest.fn().mockResolvedValue(mockRecipeDoc);
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(null);
      (MealSelection.create as any) = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });
      (MealSelection.findById as any) = jest.fn().mockReturnValue(mockPopulateChain(mockPendingDoc));

      await MealService.selectMeal(mockRecipeId, mockUserId);

      expect(mockRecipeDoc.save).not.toHaveBeenCalled();
    });
  });

  // ── deselectMeal ────────────────────────────────────────────────────────────

  describe('deselectMeal', () => {
    it('throws NOT_FOUND if no pending selection', async () => {
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(null);
      await expect(MealService.deselectMeal()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });

    it('deletes the pending selection', async () => {
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(mockPendingDoc);
      (MealSelection.deleteOne as any) = jest.fn().mockResolvedValue({});

      await MealService.deselectMeal();

      expect(MealSelection.deleteOne).toHaveBeenCalledWith({ _id: mockPendingDoc._id });
    });
  });

  // ── confirmMeal ─────────────────────────────────────────────────────────────

  describe('confirmMeal', () => {
    it('throws NOT_FOUND if no pending selection', async () => {
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(null);
      await expect(MealService.confirmMeal()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });

    it('sets status to confirmed and date to today', async () => {
      const savablePending = { ...mockPendingDoc, status: 'pending' as any, date: null as any, save: jest.fn().mockResolvedValue(undefined) };
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(savablePending);
      (Recipe.findById as any) = jest.fn().mockResolvedValue({ ...mockRecipeDoc, save: jest.fn().mockResolvedValue(undefined) });
      (MealSelection.findById as any) = jest.fn().mockReturnValue(mockPopulateChain({
        ...savablePending,
        status: 'confirmed',
        date: new Date(),
      }));

      await MealService.confirmMeal();

      expect(savablePending.status).toBe('confirmed');
      expect(savablePending.date).toBeInstanceOf(Date);
      expect(savablePending.save).toHaveBeenCalled();
    });

    it('increments timesChosen on confirm', async () => {
      const savablePending = { ...mockPendingDoc, save: jest.fn().mockResolvedValue(undefined) };
      const savableRecipe = { ...mockRecipeDoc, timesChosen: 2, save: jest.fn().mockResolvedValue(undefined) };
      (MealSelection.findOne as any) = jest.fn().mockResolvedValue(savablePending);
      (Recipe.findById as any) = jest.fn().mockResolvedValue(savableRecipe);
      (MealSelection.findById as any) = jest.fn().mockReturnValue(mockPopulateChain({
        ...savablePending,
        status: 'confirmed',
        date: new Date(),
      }));

      await MealService.confirmMeal();

      expect(savableRecipe.timesChosen).toBe(3);
      expect(savableRecipe.save).toHaveBeenCalled();
    });
  });

  // ── getCurrentMeal ──────────────────────────────────────────────────────────

  describe('getCurrentMeal', () => {
    it('queries by status pending', async () => {
      (MealSelection.findOne as any) = jest.fn().mockReturnValue(mockPopulateChain(null));

      await MealService.getCurrentMeal();

      expect(MealSelection.findOne).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('returns null when no pending meal', async () => {
      (MealSelection.findOne as any) = jest.fn().mockReturnValue(mockPopulateChain(null));

      const result = await MealService.getCurrentMeal();

      expect(result).toBeNull();
    });
  });

  // ── getMealHistory ──────────────────────────────────────────────────────────

  describe('getMealHistory', () => {
    it('queries by status confirmed', async () => {
      (MealSelection.find as any) = jest.fn().mockReturnValue(mockSortPopulateChain([]));

      await MealService.getMealHistory();

      expect(MealSelection.find).toHaveBeenCalledWith({ status: 'confirmed' });
    });

    it('returns empty array when no confirmed meals', async () => {
      (MealSelection.find as any) = jest.fn().mockReturnValue(mockSortPopulateChain([]));

      const result = await MealService.getMealHistory();

      expect(result).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npx jest src/services/__tests__/MealService.test.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL — methods `deselectMeal`, `confirmMeal` not found, and existing tests fail because signatures changed.

- [ ] **Step 3: Commit the failing tests**

```bash
git add server/src/services/__tests__/MealService.test.ts
git commit -m "test(server): add failing MealService tests for new selection flow"
```

---

## Task 4: Implement MealService changes

**Files:**
- Modify: `server/src/services/MealService.ts`

- [ ] **Step 1: Replace MealService.ts with the updated implementation**

```ts
import { MealSelection } from '../models/MealSelection';
import { Recipe } from '../models/Recipe';
import { AppError } from '../middleware/errorHandler';
import { IMealSelectionResponse, IRecipeResponse, IUserResponse } from '@dndmeal/shared';
import { Types } from 'mongoose';

export class MealService {
  static async selectMeal(
    recipeId: string,
    userId: string
  ): Promise<IMealSelectionResponse> {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new AppError('NOT_FOUND', 404, 'Recipe not found');
    }

    const existing = await MealSelection.findOne({ status: 'pending' });
    if (existing) {
      throw new AppError('CONFLICT', 409, 'A meal is already selected');
    }

    const mealSelection = await MealSelection.create({
      recipe: new Types.ObjectId(recipeId),
      selectedBy: new Types.ObjectId(userId),
      status: 'pending',
      date: null,
    });

    const populated = await MealSelection.findById(mealSelection._id)
      .populate('recipe')
      .populate('selectedBy');
    return this.toResponse(populated as any);
  }

  static async deselectMeal(): Promise<void> {
    const pending = await MealSelection.findOne({ status: 'pending' });
    if (!pending) {
      throw new AppError('NOT_FOUND', 404, 'No pending meal selection');
    }
    await MealSelection.deleteOne({ _id: pending._id });
  }

  static async confirmMeal(): Promise<IMealSelectionResponse> {
    const pending = await MealSelection.findOne({ status: 'pending' });
    if (!pending) {
      throw new AppError('NOT_FOUND', 404, 'No pending meal selection');
    }

    (pending as any).status = 'confirmed';
    (pending as any).date = new Date();
    await pending.save();

    const recipe = await Recipe.findById(pending.recipe);
    if (recipe) {
      recipe.timesChosen = (recipe.timesChosen || 0) + 1;
      await recipe.save();
    }

    const populated = await MealSelection.findById(pending._id)
      .populate('recipe')
      .populate('selectedBy');
    return this.toResponse(populated as any);
  }

  static async getCurrentMeal(): Promise<IMealSelectionResponse | null> {
    const mealSelection = await MealSelection.findOne({ status: 'pending' })
      .populate('recipe')
      .populate('selectedBy');

    if (!mealSelection) {
      return null;
    }

    return this.toResponse(mealSelection);
  }

  static async getMealHistory(): Promise<IMealSelectionResponse[]> {
    const mealSelections = await MealSelection.find({ status: 'confirmed' })
      .sort({ date: -1 })
      .populate('recipe')
      .populate('selectedBy');

    return mealSelections.map(meal => this.toResponse(meal));
  }

  static toResponse(meal: any): IMealSelectionResponse {
    const recipe = meal.recipe as any;
    const selectedBy = meal.selectedBy as any;

    const recipeResponse: IRecipeResponse = {
      _id: recipe._id.toString(),
      title: recipe.title,
      image: recipe.image,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      author: {
        _id: recipe.author._id.toString(),
        email: recipe.author.email,
        name: recipe.author.name,
        isAdmin: recipe.author.isAdmin,
        createdAt: recipe.author.createdAt,
      },
      tags: recipe.tags,
      ratings: recipe.ratings.map((r: any) => ({
        userId: r.userId.toString(),
        rating: r.rating,
      })),
      timesChosen: recipe.timesChosen,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };

    const selectedByResponse: IUserResponse = {
      _id: selectedBy._id.toString(),
      email: selectedBy.email,
      name: selectedBy.name,
      isAdmin: selectedBy.isAdmin,
      createdAt: selectedBy.createdAt,
    };

    return {
      _id: meal._id.toString(),
      recipe: recipeResponse,
      selectedBy: selectedByResponse,
      status: meal.status,
      date: meal.date,
      createdAt: meal.createdAt,
    };
  }
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npx jest src/services/__tests__/MealService.test.ts --no-coverage 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add server/src/services/MealService.ts
git commit -m "feat(server): implement pending/confirmed meal selection flow in MealService"
```

---

## Task 5: Update routes and WebSocket handlers

**Files:**
- Modify: `server/src/routes/meals.ts`
- Modify: `server/src/websocket/handlers.ts`

- [ ] **Step 1: Add `broadcastMealConfirmed` and `broadcastMealDeselected` to handlers**

Append to `server/src/websocket/handlers.ts`:

```ts
export function broadcastMealConfirmed(
  io: SocketIOServer,
  payload: IWebSocketPayloads['meal:confirmed']
) {
  io.emit('meal:confirmed', payload);
}

export function broadcastMealDeselected(io: SocketIOServer) {
  io.emit('meal:deselected', {});
}
```

- [ ] **Step 2: Replace `server/src/routes/meals.ts`**

```ts
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

export default router;
```

- [ ] **Step 3: Build server to verify no TypeScript errors**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npm run build 2>&1 | head -30
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/meals.ts server/src/websocket/handlers.ts
git commit -m "feat(server): add deselect and confirm routes, broadcast new WS events"
```

---

## Task 6: Update useMealSelection hook

**Files:**
- Modify: `client/src/hooks/useMealSelection.ts`

- [ ] **Step 1: Replace hook with updated version**

```ts
import { useState, useCallback, useEffect } from 'react';
import { IMealSelectionResponse } from '@dndmeal/shared';
import api from '../services/api';

export function useMealSelection() {
  const [currentMeal, setCurrentMeal] = useState<IMealSelectionResponse | null>(null);
  const [history, setHistory] = useState<IMealSelectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentMeal = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/meals/current');
      setCurrentMeal(res.data.meal);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch current meal');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getHistory = useCallback(async () => {
    try {
      const res = await api.get('/meals/history');
      setHistory(res.data.history);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch history');
    }
  }, []);

  const selectMeal = useCallback(async (recipeId: string) => {
    const res = await api.post('/meals/select', { recipeId });
    setCurrentMeal(res.data.meal);
    return res.data.meal;
  }, []);

  const deselectMeal = useCallback(async () => {
    await api.delete('/meals/current');
    setCurrentMeal(null);
  }, []);

  const confirmMeal = useCallback(async () => {
    await api.post('/meals/confirm');
    setCurrentMeal(null);
    await getHistory();
  }, [getHistory]);

  useEffect(() => {
    getCurrentMeal();
    getHistory();
  }, [getCurrentMeal, getHistory]);

  return {
    currentMeal,
    history,
    isLoading,
    error,
    getCurrentMeal,
    selectMeal,
    deselectMeal,
    confirmMeal,
    getHistory,
  };
}
```

- [ ] **Step 2: Build client to check for errors**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors related to `useMealSelection`.

- [ ] **Step 3: Commit**

```bash
git add client/src/hooks/useMealSelection.ts
git commit -m "feat(client): add deselectMeal and confirmMeal to useMealSelection hook"
```

---

## Task 7: Update RecipeModal — disable select when pending meal exists

**Files:**
- Modify: `client/src/components/RecipeModal.tsx`

- [ ] **Step 1: Add `hasPendingMeal` prop and disable the select button**

Update the `RecipeModalProps` interface (add one field):

```ts
interface RecipeModalProps {
  recipe: IRecipeResponse;
  isOpen: boolean;
  onClose: () => void;
  onSelectMeal: (recipeId: string) => Promise<void>;
  onAddRating: (rating: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  currentUserId?: string;
  hasPendingMeal?: boolean;
}
```

Update the destructuring in the function signature:

```ts
export default function RecipeModal({
  recipe,
  isOpen,
  onClose,
  onSelectMeal,
  onAddRating,
  currentUserId,
  hasPendingMeal = false,
}: RecipeModalProps) {
```

Replace the "Sélectionner pour demain" button with:

```tsx
<button
  onClick={handleSelectMeal}
  disabled={isDisabled || hasPendingMeal}
  title={hasPendingMeal ? 'Un repas est déjà sélectionné' : undefined}
  className={`flex-1 px-6 py-2 rounded-lg font-medium transition ${
    isDisabled || hasPendingMeal
      ? 'bg-amber-600 text-white opacity-50 cursor-not-allowed'
      : 'bg-amber-600 text-white hover:bg-amber-700'
  }`}
>
  {hasPendingMeal ? 'Repas déjà sélectionné' : 'Sélectionner pour ce soir'}
</button>
```

- [ ] **Step 2: Build client to check for errors**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/RecipeModal.tsx
git commit -m "feat(client): disable meal select button when a pending meal already exists"
```

---

## Task 8: Update HomePage banner

**Files:**
- Modify: `client/src/pages/HomePage.tsx`

- [ ] **Step 1: Import new hook functions and wire up handlers**

In `HomePage.tsx`, update the hook destructuring:

```ts
const { currentMeal, selectMeal, deselectMeal, confirmMeal } = useMealSelection();
```

Add two handlers (below `handleSelectMeal`):

```ts
const handleDeselectMeal = async () => {
  try {
    await deselectMeal();
    addToast('Repas déselectionné.', 'success');
  } catch (err: any) {
    addToast(err.response?.data?.error || 'Une erreur est survenue', 'error');
  }
};

const handleConfirmMeal = async () => {
  try {
    await confirmMeal();
    addToast('Bon appétit ! Repas ajouté à l\'historique.', 'success');
  } catch (err: any) {
    addToast(err.response?.data?.error || 'Une erreur est survenue', 'error');
  }
};
```

- [ ] **Step 2: Replace the banner buttons**

Replace the `<div className="flex gap-3">` block inside the current meal banner with:

```tsx
<div className="flex gap-3 flex-wrap">
  <button
    onClick={() => setSelectedRecipe(currentMeal.recipe)}
    className="bg-white text-amber-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition"
  >
    Voir la recette
  </button>
  <button
    onClick={handleDeselectMeal}
    className="bg-white bg-opacity-20 text-white px-6 py-2 rounded-full hover:bg-opacity-30 transition"
  >
    Déselectionner
  </button>
  <button
    onClick={handleConfirmMeal}
    className="bg-white text-green-700 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition"
  >
    On a mangé ça !
  </button>
</div>
```

- [ ] **Step 3: Pass `hasPendingMeal` to `RecipeModal`**

In the `<RecipeModal>` component rendered at the bottom of `HomePage`, add:

```tsx
hasPendingMeal={!!currentMeal}
```

- [ ] **Step 4: Build client to check for type errors**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/HomePage.tsx
git commit -m "feat(client): add deselect and confirm buttons to meal banner"
```
