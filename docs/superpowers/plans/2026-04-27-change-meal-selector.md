# Change Meal Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow any authenticated user to change who selected a meal in the history, with modal confirmation and real-time updates to all connected users.

**Architecture:** Backend adds two new endpoints (GET users list, PUT to change selector) and a WebSocket event. Frontend adds a modal component for user selection, integrates it into HistoryPage, and listens for real-time updates.

**Tech Stack:** Express.js (backend), React (frontend), WebSocket (real-time), TypeScript, Vitest (testing)

---

## File Structure

### Backend Files

**Modified:**
- `/server/src/routes/auth.ts` - Add GET /auth/users endpoint
- `/server/src/routes/meals.ts` - Add PUT /meals/:id/selectedBy endpoint
- `/server/src/services/MealService.ts` - Add updateMealSelectedBy method
- `/server/src/websocket/handlers.ts` - Add broadcastMealUpdated function

### Frontend Files

**Created:**
- `/client/src/components/ChangeUserModal.tsx` - New modal component
- `/client/src/components/__tests__/ChangeUserModal.test.tsx` - Component tests

**Modified:**
- `/client/src/pages/HistoryPage.tsx` - Add button and modal integration
- `/client/src/hooks/useMealSelection.ts` - Add updateMealSelectedBy method
- `/client/src/components/__tests__/HistoryPage.test.tsx` - Update tests (if exists)

---

## Backend Tasks

### Task 1: MealService - Add updateMealSelectedBy method

**Files:**
- Modify: `/server/src/services/MealService.ts`

- [ ] **Step 1: Write the failing test**

Create `/server/src/__tests__/MealService.test.ts` if it doesn't exist, and add:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MealService } from '../services/MealService';
import { MealModel } from '../models/MealModel';

describe('MealService.updateMealSelectedBy', () => {
  it('updates selectedBy for an existing meal', async () => {
    const mealId = 'meal123';
    const newUserId = 'user456';
    
    vi.spyOn(MealModel, 'findByIdAndUpdate').mockResolvedValue({
      _id: mealId,
      recipe: 'recipe123',
      selectedBy: newUserId,
      status: 'confirmed',
      date: new Date(),
      createdAt: new Date(),
    });

    const result = await MealService.updateMealSelectedBy(mealId, newUserId);

    expect(result.selectedBy).toBe(newUserId);
    expect(MealModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mealId,
      { selectedBy: newUserId },
      { new: true }
    );
  });

  it('throws error if meal not found', async () => {
    vi.spyOn(MealModel, 'findByIdAndUpdate').mockResolvedValue(null);

    expect(() => MealService.updateMealSelectedBy('invalid', 'user123')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npm test -- src/__tests__/MealService.test.ts --run
```

Expected: FAIL with "updateMealSelectedBy is not a function"

- [ ] **Step 3: Write minimal implementation**

In `/server/src/services/MealService.ts`, add this method to the MealService class:

```typescript
static async updateMealSelectedBy(mealId: string, userId: string): Promise<IMealSelection> {
  const meal = await MealModel.findByIdAndUpdate(
    mealId,
    { selectedBy: userId },
    { new: true }
  );

  if (!meal) {
    throw new AppError('MEAL_NOT_FOUND', 404, 'Meal not found');
  }

  return meal;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npm test -- src/__tests__/MealService.test.ts --run
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /home/ald2n/Kod/MealPlanner && git add server/src/services/MealService.ts server/src/__tests__/MealService.test.ts && git commit -m "feat: add updateMealSelectedBy method to MealService

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Auth Route - Add GET /auth/users endpoint

**Files:**
- Modify: `/server/src/routes/auth.ts`

- [ ] **Step 1: Write the failing test**

Add to the auth route tests (create `/server/src/__tests__/routes/auth.test.ts` if needed):

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index';

describe('GET /auth/users', () => {
  it('returns list of all users', async () => {
    const response = await request(app)
      .get('/auth/users')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toBeInstanceOf(Array);
    expect(response.body.users[0]).toHaveProperty('_id');
    expect(response.body.users[0]).toHaveProperty('name');
    expect(response.body.users[0]).toHaveProperty('email');
  });

  it('returns 401 if not authenticated', async () => {
    const response = await request(app).get('/auth/users');

    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npm test -- src/__tests__/routes/auth.test.ts --run
```

Expected: FAIL (endpoint doesn't exist)

- [ ] **Step 3: Write minimal implementation**

In `/server/src/routes/auth.ts`, add this route at the end, before `export default router`:

```typescript
/**
 * GET /auth/users
 * Returns all registered users (auth required)
 */
router.get('/users', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await UserModel.find({}, { passwordHash: 0 }).lean();
    const userResponses = users.map(user => AuthService.userToResponse(user));
    res.status(200).json({ users: userResponses });
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npm test -- src/__tests__/routes/auth.test.ts --run
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /home/ald2n/Kod/MealPlanner && git add server/src/routes/auth.ts && git commit -m "feat: add GET /auth/users endpoint to list all users

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Meals Route - Add PUT /meals/:id/selectedBy endpoint

**Files:**
- Modify: `/server/src/routes/meals.ts`

- [ ] **Step 1: Write the failing test**

Add to meals route tests (create `/server/src/__tests__/routes/meals.test.ts` if needed):

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../index';

describe('PUT /meals/:id/selectedBy', () => {
  it('updates selectedBy user for a meal', async () => {
    const mealId = 'meal123';
    const newUserId = 'user456';

    const response = await request(app)
      .put(`/meals/${mealId}/selectedBy`)
      .set('Authorization', `Bearer ${validToken}`)
      .send({ userId: newUserId });

    expect(response.status).toBe(200);
    expect(response.body.meal.selectedBy._id).toBe(newUserId);
  });

  it('returns 400 if userId is missing', async () => {
    const response = await request(app)
      .put('/meals/meal123/selectedBy')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('returns 401 if not authenticated', async () => {
    const response = await request(app)
      .put('/meals/meal123/selectedBy')
      .send({ userId: 'user456' });

    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npm test -- src/__tests__/routes/meals.test.ts --run
```

Expected: FAIL (endpoint doesn't exist)

- [ ] **Step 3: Write minimal implementation**

In `/server/src/routes/meals.ts`, add this route at the end, before `export default router`:

```typescript
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
    const mealWithUser = await MealService.getMealWithUser(meal._id as string);

    broadcastMealUpdated(io, { meal: mealWithUser });

    res.status(200).json({ meal: mealWithUser });
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npm test -- src/__tests__/routes/meals.test.ts --run
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /home/ald2n/Kod/MealPlanner && git add server/src/routes/meals.ts && git commit -m "feat: add PUT /meals/:id/selectedBy endpoint to change meal selector

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: WebSocket - Add broadcastMealUpdated handler

**Files:**
- Modify: `/server/src/websocket/handlers.ts`

- [ ] **Step 1: Write the failing test**

Add to WebSocket handler tests (create `/server/src/__tests__/websocket/handlers.test.ts` if needed):

```typescript
import { describe, it, expect, vi } from 'vitest';
import { broadcastMealUpdated } from '../websocket/handlers';

describe('broadcastMealUpdated', () => {
  it('broadcasts meal:updated event to all clients', () => {
    const mockIo = {
      emit: vi.fn(),
    };

    const meal = {
      _id: 'meal123',
      recipe: {},
      selectedBy: { _id: 'user456', name: 'Alice' },
      status: 'confirmed',
      date: new Date(),
    };

    broadcastMealUpdated(mockIo as any, { meal });

    expect(mockIo.emit).toHaveBeenCalledWith('meal:updated', { meal });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npm test -- src/__tests__/websocket/handlers.test.ts --run
```

Expected: FAIL (function doesn't exist)

- [ ] **Step 3: Write minimal implementation**

In `/server/src/websocket/handlers.ts`, add this function:

```typescript
export function broadcastMealUpdated(io: Server, payload: { meal: IMealSelectionResponse }): void {
  io.emit('meal:updated', payload);
}
```

Also add the import at the top if not present:

```typescript
import { IMealSelectionResponse } from '@dndmeal/shared';
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/ald2n/Kod/MealPlanner/server && npm test -- src/__tests__/websocket/handlers.test.ts --run
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /home/ald2n/Kod/MealPlanner && git add server/src/websocket/handlers.ts && git commit -m "feat: add broadcastMealUpdated WebSocket handler

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Frontend Tasks

### Task 5: Create ChangeUserModal component

**Files:**
- Create: `/client/src/components/ChangeUserModal.tsx`
- Create: `/client/src/components/__tests__/ChangeUserModal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `/client/src/components/__tests__/ChangeUserModal.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangeUserModal } from '../ChangeUserModal';
import { IUserResponse } from '@dndmeal/shared';

describe('ChangeUserModal', () => {
  const mockUsers: IUserResponse[] = [
    { _id: 'user1', name: 'Alice', email: 'alice@example.com', isAdmin: false, createdAt: new Date() },
    { _id: 'user2', name: 'Bob', email: 'bob@example.com', isAdmin: false, createdAt: new Date() },
  ];

  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  it('renders user list when open', () => {
    render(
      <ChangeUserModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentUserId="user1"
        users={mockUsers}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <ChangeUserModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentUserId="user1"
        users={mockUsers}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onConfirm with selected userId', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <ChangeUserModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentUserId="user1"
        users={mockUsers}
      />
    );

    const bobOption = screen.getByRole('option', { name: 'Bob' });
    await user.click(bobOption);

    const confirmButton = screen.getByRole('button', { name: /Confirmer/ });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith('user2');
  });

  it('disables confirm when same user selected', () => {
    render(
      <ChangeUserModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentUserId="user1"
        users={mockUsers}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirmer/ });
    expect(confirmButton).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm test -- src/components/__tests__/ChangeUserModal.test.tsx --run
```

Expected: FAIL (component doesn't exist)

- [ ] **Step 3: Write minimal implementation**

Create `/client/src/components/ChangeUserModal.tsx`:

```typescript
import { useState } from 'react';
import { IUserResponse } from '@dndmeal/shared';

export interface ChangeUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
  currentUserId: string;
  users: IUserResponse[];
  isLoading?: boolean;
}

export function ChangeUserModal({
  isOpen,
  onClose,
  onConfirm,
  currentUserId,
  users,
  isLoading = false,
}: ChangeUserModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) {
    return null;
  }

  const canConfirm = selectedUserId !== null && selectedUserId !== currentUserId && !isConfirming;
  const isDisabled = isConfirming || isLoading;

  const handleConfirm = async () => {
    if (!selectedUserId || selectedUserId === currentUserId) return;

    setIsConfirming(true);
    try {
      await onConfirm(selectedUserId);
      onClose();
    } finally {
      setIsConfirming(false);
      setSelectedUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-theme-elevated rounded-lg max-w-md w-full max-h-screen overflow-auto relative">
        <button
          onClick={onClose}
          disabled={isDisabled}
          className="absolute top-4 right-4 text-theme-muted hover:text-theme-text text-2xl font-bold z-10"
        >
          ×
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-display font-semibold text-theme-text mb-6">
            Changer la personne
          </h2>

          <div className="mb-6">
            <label className="text-sm font-medium text-theme-text mb-3 block">
              Sélectionnez un utilisateur
            </label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isDisabled}
              className="w-full px-4 py-2 rounded-lg border border-theme-border bg-theme-bg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent disabled:opacity-50"
            >
              <option value="">-- Sélectionnez --</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDisabled}
              className="flex-1 px-4 py-2 rounded-lg font-medium bg-theme-hover text-theme-text hover:bg-theme-surface disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                canConfirm
                  ? 'bg-theme-accent text-theme-accent-text hover:bg-theme-accent-hover'
                  : 'bg-theme-accent text-theme-accent-text opacity-50 cursor-not-allowed'
              }`}
            >
              {isConfirming ? 'Changement...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm test -- src/components/__tests__/ChangeUserModal.test.tsx --run
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /home/ald2n/Kod/MealPlanner && git add client/src/components/ChangeUserModal.tsx client/src/components/__tests__/ChangeUserModal.test.tsx && git commit -m "feat: add ChangeUserModal component for selecting meal selector

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Update useMealSelection hook with updateMealSelectedBy method

**Files:**
- Modify: `/client/src/hooks/useMealSelection.ts`

- [ ] **Step 1: Add new method to hook**

In `/client/src/hooks/useMealSelection.ts`, add this method to the hook after the `confirmMeal` function:

```typescript
const updateMealSelectedBy = useCallback(async (mealId: string, userId: string) => {
  const res = await api.put(`/meals/${mealId}/selectedBy`, { userId });
  await getHistory();
  return res.data.meal;
}, [getHistory]);
```

- [ ] **Step 2: Add to return object**

Update the return statement to include the new method:

```typescript
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
  updateMealSelectedBy,  // Add this line
};
```

- [ ] **Step 3: Run existing tests to ensure nothing broke**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm test -- src/hooks -r --run
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
cd /home/ald2n/Kod/MealPlanner && git add client/src/hooks/useMealSelection.ts && git commit -m "feat: add updateMealSelectedBy method to useMealSelection hook

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Update HistoryPage to add change user functionality

**Files:**
- Modify: `/client/src/pages/HistoryPage.tsx`

- [ ] **Step 1: Import ChangeUserModal and fetch users**

At the top of the file, add imports:

```typescript
import { useState, useEffect } from 'react';
import { ChangeUserModal } from '../components/ChangeUserModal';
import { IUserResponse } from '@dndmeal/shared';
import api from '../services/api';
```

- [ ] **Step 2: Add state for modal and users**

Add these state declarations after the existing state variables:

```typescript
const [allUsers, setAllUsers] = useState<IUserResponse[]>([]);
const [isLoadingUsers, setIsLoadingUsers] = useState(false);
const [mealToChangeId, setMealToChangeId] = useState<string | null>(null);
const [isChangingUser, setIsChangingUser] = useState(false);
```

- [ ] **Step 3: Add effect to fetch users**

Add this effect after the existing useEffect hooks:

```typescript
useEffect(() => {
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.get('/auth/users');
      setAllUsers(res.data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      addToast('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  fetchUsers();
}, [addToast]);
```

- [ ] **Step 4: Add handler for change user**

Add this handler function after the other handlers:

```typescript
const handleChangeUser = async (userId: string) => {
  if (!mealToChangeId) return;

  setIsChangingUser(true);
  try {
    await updateMealSelectedBy(mealToChangeId, userId);
    addToast('Personne changée!', 'success');
    setMealToChangeId(null);
  } catch (err: any) {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Une erreur est survenue';
    addToast(message, 'error');
  } finally {
    setIsChangingUser(false);
  }
};
```

- [ ] **Step 5: Add button to history items**

Find the section with `"Voir la recette"` button and add a new button next to it. Update the button group (around line 148-160):

```typescript
<div className="flex gap-3 flex-wrap">
  <button
    onClick={() => setSelectedRecipe(item.recipe)}
    disabled={isLoadingMeal !== null}
    className={`px-4 py-2 rounded-lg font-medium transition ${
      isLoadingMeal !== null
        ? 'bg-theme-hover text-theme-text opacity-50 cursor-not-allowed'
        : 'bg-theme-hover text-theme-text hover:bg-theme-surface'
    }`}
  >
    Voir la recette
  </button>
  <button
    onClick={() => setMealToChangeId(item._id)}
    disabled={isLoadingMeal !== null || isChangingUser}
    className={`px-4 py-2 rounded-lg font-medium transition ${
      isLoadingMeal !== null || isChangingUser
        ? 'bg-theme-hover text-theme-text opacity-50 cursor-not-allowed'
        : 'bg-theme-hover text-theme-text hover:bg-theme-surface'
    }`}
  >
    Changer
  </button>
</div>
```

- [ ] **Step 6: Add modal to page**

Add this before the closing `</main>` tag (after the RecipeModal):

```typescript
<ChangeUserModal
  isOpen={mealToChangeId !== null}
  onClose={() => setMealToChangeId(null)}
  onConfirm={handleChangeUser}
  currentUserId={localHistory.find(m => m._id === mealToChangeId)?.selectedBy._id || ''}
  users={allUsers}
  isLoading={isChangingUser}
/>
```

Don't forget to import `updateMealSelectedBy` from the hook:

```typescript
const { currentMeal, history, selectMeal, getHistory, updateMealSelectedBy } = useMealSelection();
```

- [ ] **Step 7: Add WebSocket listener for meal updates**

Add this effect to listen for real-time updates:

```typescript
useEffect(() => {
  const handleMealUpdated = () => {
    getHistory();
  };

  on('meal:updated', handleMealUpdated);

  return () => {
    off('meal:updated', handleMealUpdated);
  };
}, [on, off, getHistory]);
```

- [ ] **Step 8: Run tests to ensure nothing broke**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm test -- src/pages -r --run
```

Expected: All tests pass (or update if necessary)

- [ ] **Step 9: Commit**

```bash
cd /home/ald2n/Kod/MealPlanner && git add client/src/pages/HistoryPage.tsx && git commit -m "feat: add change meal selector button and modal to HistoryPage

- Add 'Changer' button next to each history item
- Fetch all users on page load
- Open modal to select new user
- Handle real-time updates via WebSocket

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Manual testing and verification

**Files:** None (verification only)

- [ ] **Step 1: Start dev server**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm run dev
```

- [ ] **Step 2: Test the feature**

In the browser at http://localhost:5173:
1. Navigate to the History page
2. Click "Changer" button on any history item
3. Verify modal opens with user list
4. Select a different user
5. Click "Confirmer"
6. Verify success toast appears
7. Verify the "Choisi par" text updates to the new user
8. Open browser dev tools → Application → WebSockets
9. Open another browser tab, make a change there
10. Verify the first tab updates in real-time

Expected: All steps pass without errors

- [ ] **Step 3: No commit needed** — This is manual testing

---

## Summary

This plan implements the change meal selector feature with:
- ✅ Backend API endpoints for users list and meal updates
- ✅ WebSocket real-time broadcasts
- ✅ Frontend modal component for user selection
- ✅ Integration into HistoryPage with button and listeners
- ✅ Comprehensive tests throughout
- ✅ Proper error handling and user feedback

Total: 8 tasks, all with TDD approach and frequent commits.
