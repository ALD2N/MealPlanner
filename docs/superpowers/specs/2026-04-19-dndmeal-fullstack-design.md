# DnDMeal — Full-Stack Meal Planning App

**Date:** 2026-04-19  
**Purpose:** Collaborative meal planning for D&D/TTRPGs sessions with friends  
**Tech Stack:** React (frontend) | Node.js + Express + TypeScript (backend) | MongoDB | WebSocket | Docker

---

## 1. Overview

DnDMeal is a shared recipe management and meal planning app designed for gaming groups. Users can:
- Browse a communal recipe library
- Select "next meal" in real-time (visible to all players)
- View meal history with full audit trail (who selected what, when)
- Rate recipes with optional smileys (😞 → 😄)
- Get Discord notifications when meals are selected

**Key constraint:** Only invited users can join via time-limited invite links (1 week).

---

## 2. Architecture

### 2.1 Monorepo Structure

```
dndmeal/
  ├── client/                    # React frontend
  │   ├── src/
  │   │   ├── pages/
  │   │   │   ├── LoginPage.tsx
  │   │   │   ├── HomePage.tsx
  │   │   │   ├── HistoryPage.tsx
  │   │   │   └── AddRecipePage.tsx
  │   │   ├── components/
  │   │   │   ├── RecipeCard.tsx
  │   │   │   ├── RecipeModal.tsx
  │   │   │   ├── NextMealBanner.tsx
  │   │   │   ├── FilterPills.tsx
  │   │   │   └── RatingBar.tsx
  │   │   ├── hooks/
  │   │   │   ├── useAuth.ts
  │   │   │   ├── useRecipes.ts
  │   │   │   ├── useWebSocket.ts
  │   │   │   └── useMealSelection.ts
  │   │   ├── services/
  │   │   │   ├── api.ts          # HTTP client
  │   │   │   └── websocket.ts    # WebSocket client
  │   │   ├── types/
  │   │   │   └── index.ts        # Shared types
  │   │   └── styles/
  │   ├── Dockerfile
  │   ├── .dockerignore
  │   ├── package.json
  │   ├── tsconfig.json
  │   └── vite.config.ts
  │
  ├── server/                    # Node.js + Express backend
  │   ├── src/
  │   │   ├── routes/
  │   │   │   ├── auth.ts
  │   │   │   ├── recipes.ts
  │   │   │   ├── meals.ts
  │   │   │   └── invites.ts
  │   │   ├── models/
  │   │   │   ├── User.ts
  │   │   │   ├── Recipe.ts
  │   │   │   ├── MealSelection.ts
  │   │   │   └── InviteLink.ts
  │   │   ├── services/
  │   │   │   ├── AuthService.ts
  │   │   │   ├── RecipeService.ts
  │   │   │   ├── MealService.ts
  │   │   │   ├── DiscordService.ts
  │   │   │   └── WebSocketService.ts
  │   │   ├── middleware/
  │   │   │   ├── auth.ts
  │   │   │   └── errorHandler.ts
  │   │   ├── websocket/
  │   │   │   └── handlers.ts
  │   │   ├── index.ts            # Express app + WebSocket setup
  │   │   └── config.ts
  │   ├── Dockerfile
  │   ├── .dockerignore
  │   ├── package.json
  │   └── tsconfig.json
  │
  ├── shared/                    # Shared types
  │   ├── types.ts
  │   └── package.json
  │
  ├── docker-compose.yml         # Local dev (hot-reload)
  ├── docker-compose.prod.yml    # Production
  ├── .env.example
  └── README.md
```

### 2.2 Docker Setup

**docker-compose.yml (dev):**
- Frontend (React dev server, port 3000, volume mount for hot-reload)
- Backend (Node dev, port 5000, volume mount, nodemon)
- MongoDB (port 27017)
- Network bridge between services

**docker-compose.prod.yml:**
- Frontend (production build, nginx reverse proxy)
- Backend (production Node image, no volumes)
- MongoDB
- Environment-based config

**Run:** `docker-compose up` for dev, `docker-compose -f docker-compose.prod.yml up` for prod.

---

## 3. Database Schema (MongoDB)

### User
```typescript
{
  _id: ObjectId
  email: string (unique)
  passwordHash: string (bcrypt)
  name: string
  isAdmin: boolean (first user = true, others = false)
  createdAt: Date
}
```

### Recipe
```typescript
{
  _id: ObjectId
  title: string
  image?: string (URL or base64)
  ingredients: string[]
  steps: string[]
  author: ObjectId → User
  tags: string[] (e.g., "vege", "rapide", "transport")
  ratings: {
    userId: ObjectId
    rating: 1-5 (smiley index: 1=😞, 5=😄)
  }[]
  timesChosen: number (incremented on each selection)
  createdAt: Date
  updatedAt: Date
}
```

### MealSelection
```typescript
{
  _id: ObjectId
  recipe: ObjectId → Recipe
  selectedBy: ObjectId → User (this user will prepare it)
  date: Date (the date this meal is for, e.g., "2026-04-20")
  createdAt: Date
}
```

### InviteLink
```typescript
{
  _id: ObjectId
  token: string (unique, random, URL-safe)
  createdBy: ObjectId → User (the admin who generated it)
  expiresAt: Date (createdAt + 7 days)
  usedCount: number
  createdAt: Date
}
```

---

## 4. Authentication & Authorization

### Registration Flow

**First user (bootstrap):**
1. App starts, no users in DB
2. User goes to `/register`
3. Register form shows (no invite token required)
4. Submit email + password → `POST /auth/register`
5. Backend: if no users exist, allow. Hash password. Create User with `isAdmin: true`
6. Return JWT (exp: 7 days)
7. Store JWT in localStorage
8. Redirect to `/admin/invites`

**Subsequent users:**
1. Admin generates invite link via `/admin/invites`
2. Admin shares link (e.g., `https://dndmeal.com/invite/abc123xyz`)
3. User clicks link → redirected to `/register?token=abc123xyz`
4. Register form pre-fills token
5. Submit email + password → `POST /auth/register-with-invite`
6. Backend: verify token valid + not expired. If OK, create User with `isAdmin: false`
7. Increment `InviteLink.usedCount`
8. Return JWT, store in localStorage, redirect to `/` (home)

### Invite Link Management

**Generate (admin only):**
- `POST /auth/invite-links/generate` → returns `{ token, url, expiresAt, usedCount }`
- Token TTL: 7 days from creation
- No usage limit per link

**Validate (public):**
- `GET /auth/invite-links/:token/valid` → returns `{ isValid, expiresAt }`
- Checks: token exists, not expired

**List (admin only):**
- `GET /admin/invite-links` → returns all links with usage stats
- Includes: token, expiresAt, usedCount, createdBy

**Revoke (admin only):**
- `DELETE /admin/invite-links/:token`
- Removes link immediately; future register attempts with this token fail

### JWT & Protected Routes

- JWT stored in localStorage (client-side)
- Sent in `Authorization: Bearer <token>` header on all API requests
- Middleware `authMiddleware` on protected routes verifies signature + expiry
- Expired token → 401, client redirects to `/login`

---

## 5. API Routes

### Auth

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register` | None | Register first user (no token required) |
| POST | `/auth/register-with-invite` | None | Register with invite link |
| POST | `/auth/login` | None | Login, return JWT |
| GET | `/auth/me` | JWT | Get current user profile |
| GET | `/auth/invite-links/:token/valid` | None | Verify invite link validity |

### Recipes (CRUD)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/recipes` | JWT | List all recipes (with filters) |
| POST | `/recipes` | JWT | Create recipe |
| GET | `/recipes/:id` | JWT | Get recipe details |
| PATCH | `/recipes/:id` | JWT | Update recipe (author only) |
| DELETE | `/recipes/:id` | JWT | Delete recipe (author only) |
| PATCH | `/recipes/:id/rating` | JWT | Add rating (smiley) |

### Meals

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/meals/current` | JWT | Get current "next meal" + who selected it |
| POST | `/meals/select` | JWT | Select meal for next day |
| GET | `/meals/history` | JWT | List past meals (with selecter info) |

### Admin

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/admin/invite-links/generate` | JWT + Admin | Generate new invite link |
| GET | `/admin/invite-links` | JWT + Admin | List all invite links |
| DELETE | `/admin/invite-links/:token` | JWT + Admin | Revoke invite link |

---

## 6. Real-Time Communication (WebSocket)

**Transport:** Socket.io (runs alongside Express)

**Events broadcast to all connected clients:**

| Event | Payload | Trigger |
|-------|---------|---------|
| `meal:selected` | `{ recipe: Recipe, selectedBy: User, date: Date }` | User selects meal |
| `recipe:added` | `{ recipe: Recipe }` | New recipe created |
| `recipe:updated` | `{ recipe: Recipe }` | Recipe edited |
| `recipe:deleted` | `{ recipeId: string }` | Recipe deleted |
| `rating:added` | `{ recipeId: string, userId: string, rating: 1-5 }` | User rates recipe |

**Connection:**
- Client connects on page load
- Sends JWT in handshake
- Server verifies JWT, associates socket to user
- Client listens for all events above
- Updates UI in real-time (no page refresh needed)

---

## 7. Discord Integration

**Webhook trigger:** User selects a meal

**Flow:**
1. User selects recipe → `POST /meals/select` completes
2. Backend calls `DiscordService.notifyMealSelected(user, recipe)`
3. If Discord webhook URL configured in env → send embed

**Discord Embed:**
```
Title: 🍽️ Repas sélectionné!
Image: [recipe.image]
Fields:
  Recette: [recipe.title]
  Sélectionné et préparé par: [@user.name]
  Link: [dndmeal.com/recipe/{recipeId}]
Color: [accentColor from design system]
```

**Config:**
- `DISCORD_WEBHOOK_URL` in `.env` (optional; if empty, webhook skipped)

---

## 8. Frontend Features

### Pages

**LoginPage**
- Email + password inputs
- Register tab (with optional token param)
- Login tab
- Error messages
- Loading state

**HomePage**
- NextMealBanner (current selection + who selected)
  - Button: "Changer" (change meal)
  - Link: "Séances passées" (go to history)
- Filter pills (vege, rapide, transport)
- Sort dropdown (magic, most/least chosen, best/worst rated)
- Recipe grid (cards with image, title, author, stats)
- Click card → RecipeModal

**HistoryPage**
- Timeline of past MealSelections (sorted DESC by date)
- For each: recipe image, title, selected by, date
- Button on each: "Changer" (select that recipe for tomorrow)
- Optional: show ratings from that session

**AddRecipePage**
- Form: title, image upload, ingredients (dynamic list), steps (numbered), tags
- Submit: create/update recipe
- Redirect to home on success

### Components

**RecipeCard**
- Image (with hover scale)
- Title + author
- Ingredient count + step count
- Rating summary (dominant smiley + count)
- Times chosen badge
- Hover: slight lift, shadow

**RecipeModal**
- Full recipe details
- Image (large)
- Ingredients (2-column grid)
- Steps (numbered circles)
- Rating distribution (bar chart with smileys)
- Smiley buttons to rate
- "Sélectionner pour demain" button
- "Modifier" button (if author)
- "Fermer" button

**NextMealBanner**
- Large accent background
- Recipe image on right
- "Ce soir on mange: [Title]" headline
- "par [User] · choisi X fois" subtext
- Two buttons: "Voir la recette" (modal), "Changer"
- If no meal selected: empty state with "Aucun repas sélectionné"

**FilterPills & SortBar**
- Pills with toggle state (active = highlighted)
- Sort dropdown with options

**RatingBar**
- 5 smiley buttons (😞 😕 😐 🙂 😄)
- Hover: enlarge + highlight
- Click: submit rating

### Hooks

**useAuth()**
- `login(email, password)` → JWT
- `register(email, password, token?)` → JWT
- `logout()` → clear localStorage
- `user` → current user or null
- `isLoading`, `error`

**useRecipes()**
- `recipes` → list of recipes
- `addRecipe(data)` → POST
- `updateRecipe(id, data)` → PATCH
- `deleteRecipe(id)` → DELETE
- `isLoading`, `error`

**useWebSocket()**
- Establishes connection on mount
- Listens for: `meal:selected`, `recipe:added`, `recipe:updated`, `recipe:deleted`, `rating:added`
- Provides callback: `onEvent(eventName, handler)`
- Auto-reconnect on disconnect

**useMealSelection()**
- `currentMeal` → current MealSelection
- `selectMeal(recipeId)` → POST
- `history` → list of past meals
- Subscribes to `meal:selected` WebSocket event
- Auto-updates on new selection

---

## 9. Error Handling

**Backend:**
- All errors returned as JSON: `{ error: "message", code: "ERROR_CODE", statusCode: 400 }`
- Common codes: `INVALID_TOKEN`, `RECIPE_NOT_FOUND`, `UNAUTHORIZED`, `INVITE_EXPIRED`, `INVALID_PASSWORD`
- Error middleware catches all thrown errors

**Frontend:**
- API calls catch errors, display toast/banner
- WebSocket disconnect → shows warning, auto-retries
- Auth errors → redirect to login
- Form validation → inline field errors

---

## 10. Testing Strategy

**Backend:**
- Unit tests: services (AuthService, RecipeService, MealService)
- Integration tests: routes with real MongoDB (test containers)
- WebSocket tests: event broadcasts

**Frontend:**
- Component tests (React Testing Library): RecipeCard, RecipeModal, FilterPills
- Hook tests: useAuth, useRecipes, useMealSelection
- E2E tests (Cypress): login → select meal → check banner updates in real-time

---

## 11. Deployment

**Development:**
```bash
docker-compose up
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# MongoDB: localhost:27017
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml up
# Requires: DISCORD_WEBHOOK_URL, MongoDB Atlas URI, JWT_SECRET, NODE_ENV=production
```

**Hosting options:**
- Docker Swarm / Kubernetes
- Heroku + MongoDB Atlas
- Self-hosted VPS

---

## 12. Success Criteria

- ✅ First user can register and become admin
- ✅ Admin can generate invite links (visible on admin page)
- ✅ Invited users can register with valid link
- ✅ Users can browse shared recipes with filters/sorting
- ✅ Users can select "next meal" in real-time (WebSocket)
- ✅ All clients see selection instantly (no refresh needed)
- ✅ Users can view meal history
- ✅ Users can rate recipes (optional smileys)
- ✅ Discord notification sent on meal selection (if webhook configured)
- ✅ Docker setup works: `docker-compose up` → everything runs
- ✅ All routes protected with JWT where required
- ✅ Tests pass (unit + integration)

---

## 13. Out of Scope (for v1)

- User profiles / avatars
- Comments on recipes
- Meal plan for multiple upcoming days
- Mobile app (responsive web only)
- Real-time typing indicators
- Recipe search (basic filtering only)
- Analytics dashboard

---

## 14. Dependencies (npm packages)

**Frontend:**
- react, react-dom, react-router-dom
- axios (HTTP client)
- socket.io-client
- typescript, vite
- tailwindcss (or any CSS framework)

**Backend:**
- express, typescript
- mongoose (MongoDB ODM)
- socket.io
- jsonwebtoken, bcrypt
- dotenv
- axios (for Discord webhook)
- nodemon (dev)

**Both:**
- Shared types published to npm or symlinked locally
