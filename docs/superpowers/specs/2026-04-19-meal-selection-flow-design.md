# Meal Selection Flow — Design

**Date:** 2026-04-19

## Overview

Redesign the meal selection flow to introduce a two-step process: **select** (pending) then **confirm** (validated, added to history). Deselecting cancels without creating a history entry.

## User-Facing Behavior

When a recipe is selected, the "Ce soir on mange" banner shows three buttons:

1. **Voir la recette** — opens the recipe modal (existing behavior)
2. **Déselectionner** — cancels the pending selection, no history entry created
3. **On a mangé ça !** — confirms the meal was eaten, adds to history with today's date

Rules:
- Only one pending selection allowed at a time. The "Sélectionner" button in the recipe modal is disabled while a pending selection exists.
- Any authenticated user can deselect or confirm.
- The person recorded in history is the one who originally selected the recipe.
- `timesChosen` is incremented only on confirmation, not on selection.
- The date stored in history is the date of confirmation, not selection.

## Data Model

### `MealSelection` (updated)

Add `status: 'pending' | 'confirmed'` field (default: `'pending'`).
`date` becomes `Date | null` — `null` while pending, set to `new Date()` on confirmation.

```ts
{
  recipe: ObjectId,        // ref: Recipe
  selectedBy: ObjectId,    // ref: User (whoever clicked "Sélectionner")
  status: 'pending' | 'confirmed',
  date: Date | null,
  createdAt: Date,
}
```

### Shared types (`shared/src/types.ts`)

Both `IMealSelection` and `IMealSelectionResponse` gain:
- `status: 'pending' | 'confirmed'`
- `date: Date | null`

## API

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/meals/select` | Create pending selection. Returns 409 if one already exists. |
| `DELETE` | `/meals/current` | Remove the pending selection (deselect). Returns 404 if none. |
| `POST` | `/meals/confirm` | Confirm pending → confirmed, set date = now, increment timesChosen. Returns 404 if none. |
| `GET` | `/meals/current` | Returns the pending selection or null. |
| `GET` | `/meals/history` | Returns confirmed selections only, sorted by date DESC. |

## Frontend

### `useMealSelection` hook

Add two new functions:
- `deselectMeal()` — `DELETE /meals/current`, clears `currentMeal` state
- `confirmMeal()` — `POST /meals/confirm`, clears `currentMeal` state, refreshes history

### `HomePage`

- Banner buttons: **Voir la recette** / **Déselectionner** / **On a mangé ça !**
- Pass `deselectMeal` and `confirmMeal` down from the hook

### `RecipeModal`

- "Sélectionner" button is disabled (with tooltip) when `currentMeal` is not null

## WebSocket Events

- `meal:selected` — emitted on `POST /meals/select` (existing, keep as-is)
- `meal:confirmed` — new event emitted on `POST /meals/confirm`, payload: `{ meal: IMealSelectionResponse }`
- `meal:deselected` — new event emitted on `DELETE /meals/current`
