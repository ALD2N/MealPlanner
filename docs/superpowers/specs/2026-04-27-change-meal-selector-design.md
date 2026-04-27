# Change Meal Selector Feature Design

**Date:** 2026-04-27  
**Feature:** Allow users to change who selected a meal in the history  
**Scope:** Add UI component, new API endpoints, and real-time updates  

## Overview

Currently, the History page displays who selected each meal but provides no way to change it. This feature adds a "Changer" button to each history item, allowing any authenticated user to change the selectedBy person to any other user in the system.

## Requirements

- Any authenticated user can change who selected a meal
- User selection via modal dialog with scrollable user list
- Confirmation required before saving the change
- Change persists to database
- Other users see the update in real-time via WebSocket

## Architecture

### Backend

#### New Endpoints

**1. GET /auth/users**
- **Purpose:** Return list of all registered users for the modal dropdown
- **Auth:** Required (any authenticated user)
- **Response:**
  ```json
  {
    "users": [
      { "_id": "user1", "name": "Alice", "email": "alice@example.com" },
      { "_id": "user2", "name": "Bob", "email": "bob@example.com" }
    ]
  }
  ```
- **Implementation:** Add to `/server/src/routes/auth.ts`

**2. PUT /meals/:id/selectedBy**
- **Purpose:** Update which user selected a specific meal
- **Auth:** Required (any authenticated user)
- **Request Body:**
  ```json
  {
    "userId": "user-id-string"
  }
  ```
- **Response:** Updated `IMealSelectionResponse` object
- **Implementation:** Add to `/server/src/routes/meals.ts`
- **Side Effects:**
  - Updates the meal's `selectedBy` field in database
  - Broadcasts `meal:updated` WebSocket event to all connected clients

#### WebSocket Event

**meal:updated**
- **Trigger:** When PUT /meals/:id/selectedBy is called
- **Payload:**
  ```json
  {
    "meal": { /* full IMealSelectionResponse object */ }
  }
  ```
- **Handler:** Add to `/server/src/websocket/handlers.ts`

### Frontend

#### New Component: ChangeUserModal

**Location:** `/client/src/components/ChangeUserModal.tsx`

**Props:**
```typescript
interface ChangeUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
  currentUserId: string;
  users: IUserResponse[];
  isLoading?: boolean;
}
```

**Behavior:**
- Modal dialog with scrollable user list
- Current selectedBy user is visually highlighted/indicated
- "Confirmer" button (enabled only when different user selected)
- "Annuler" button to close without changes
- Shows loading state during API call
- Disables buttons while loading

#### Updated Component: HistoryPage

**Changes:**
1. Add "Changer" button next to "Voir la recette" for each history item
2. On click, opens ChangeUserModal
3. Passes current meal's selectedBy user as `currentUserId`
4. On confirm, calls `updateMealSelectedBy(mealId, userId)`
5. On success: shows toast "Personne changée!", refreshes history, closes modal
6. On error: shows error toast, keeps modal open

#### Updated Hook: useMealSelection

**New Method:**
```typescript
const updateMealSelectedBy = useCallback(async (mealId: string, userId: string) => {
  const res = await api.put(`/meals/${mealId}/selectedBy`, { userId });
  await getHistory(); // Refresh history after update
  return res.data.meal;
}, [getHistory]);
```

**Return Value:** Add `updateMealSelectedBy` to hook's return object

#### Updated Hook: useWebSocket

**New Listener in HistoryPage:**
- Listen for `meal:updated` event
- On received: call `getHistory()` to refresh the list
- Ensures real-time updates from other users' changes

## Data Flow

```
User clicks "Changer" button
  ↓
ChangeUserModal opens with user list
  ↓
User selects different person and clicks "Confirmer"
  ↓
API call: PUT /meals/:id/selectedBy { userId }
  ↓
Backend updates database + broadcasts meal:updated event
  ↓
Frontend receives WebSocket event
  ↓
History refreshes, displays new selectedBy user
  ↓
Modal closes, success toast shown
```

## Error Handling

**API Errors:**
- Invalid mealId → 404 error from backend
- Invalid userId → 400 error from backend
- User displays error toast with backend message

**Validation:**
- Modal disables confirm if same user selected
- Backend validates userId exists
- Backend validates mealId exists

## Testing

### Backend
- Test GET /auth/users returns all users
- Test PUT /meals/:id/selectedBy updates the meal
- Test WebSocket broadcast fires on meal update
- Test invalid mealId/userId returns appropriate errors

### Frontend
- Test ChangeUserModal renders user list correctly
- Test confirm button disabled when same user selected
- Test API call fires with correct payload
- Test history refreshes after successful update
- Test error toast on API failure
- Test WebSocket listener updates UI

## Future Considerations

- Could add audit log of who changed what and when
- Could restrict changes to admins only
- Could add undo functionality

