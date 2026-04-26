# Dark Mode Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full design system from `dndmeal/project/index.html` — polices Fraunces/DM Sans, palette organique chaude, toggle thème clair/sombre mémorisé en `localStorage`.

**Architecture:** CSS custom properties (`:root` + `[data-theme="dark"]`) définissent les tokens couleur ; Tailwind est étendu avec des couleurs `theme-*` qui référencent ces vars. Un hook `useTheme` + context `ThemeContext` gèrent l'état et le toggle. Chaque composant remplace ses classes Tailwind de couleur par les nouvelles classes `theme-*`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3, Vite, Vitest

---

### Task 1: Foundation — CSS variables, Tailwind tokens, Google Fonts

**Files:**
- Modify: `client/index.html`
- Modify: `client/src/index.css`
- Modify: `client/tailwind.config.js`

- [ ] **Step 1: Add Google Fonts to `client/index.html`**

Replace the entire file content:

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DnDMeal - Repas Collaboratifs</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Replace `client/src/index.css` with CSS tokens + body styles**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ===== Design tokens — light (default) ===== */
:root {
  --color-bg:           #faf6f0;
  --color-bg-elevated:  #fff8f0;
  --color-bg-hover:     #f2ece3;
  --color-surface:      #fff8f0;
  --color-border:       #e8ddd4;
  --color-text:         #2d1f15;
  --color-text-muted:   #9a7c6b;
  --color-text-subtle:  #b8a090;
  --color-accent:       #d4a017;
  --color-accent-hover: #b8880f;
  --color-accent-text:  #2d1f15;
  --color-accent-pale:  #fdf4d0;
}

/* ===== Design tokens — dark ===== */
[data-theme="dark"] {
  --color-bg:           #1c1712;
  --color-bg-elevated:  #241f18;
  --color-bg-hover:     #2e271e;
  --color-surface:      #221d16;
  --color-border:       #3a3028;
  --color-text:         #f0e8dc;
  --color-text-muted:   #b09a86;
  --color-text-subtle:  #8a7464;
}

html {
  transition: background-color 0.3s;
}

body {
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  transition: background-color 0.3s, color 0.3s;
}

@layer components {
  .toast-base {
    @apply bg-theme-elevated border-l-4 rounded-lg shadow-lg p-4 mb-3 animate-slideInRight;
  }
}
```

- [ ] **Step 3: Replace `client/tailwind.config.js` with extended colors + fontFamily**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        'theme-bg':           'var(--color-bg)',
        'theme-elevated':     'var(--color-bg-elevated)',
        'theme-hover':        'var(--color-bg-hover)',
        'theme-surface':      'var(--color-surface)',
        'theme-border':       'var(--color-border)',
        'theme-text':         'var(--color-text)',
        'theme-muted':        'var(--color-text-muted)',
        'theme-subtle':       'var(--color-text-subtle)',
        'theme-accent':       'var(--color-accent)',
        'theme-accent-hover': 'var(--color-accent-hover)',
        'theme-accent-text':  'var(--color-accent-text)',
        'theme-accent-pale':  'var(--color-accent-pale)',
      },
      borderColor: {
        DEFAULT: 'var(--color-border)',
      },
      animation: {
        slideInRight: 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(1rem)' },
          'to':   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Verify the build compiles**

```bash
cd client && npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add client/index.html client/src/index.css client/tailwind.config.js
git commit -m "feat: add CSS design tokens, Tailwind theme-* colors, and Google Fonts"
```

---

### Task 2: useTheme hook + ThemeContext + main.tsx

**Files:**
- Create: `client/src/hooks/useTheme.ts`
- Create: `client/src/hooks/__tests__/useTheme.test.ts`
- Create: `client/src/contexts/ThemeContext.tsx`
- Modify: `client/src/main.tsx`

- [ ] **Step 1: Write failing tests for `useTheme`**

Create `client/src/hooks/__tests__/useTheme.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useTheme } from '../useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to light theme when localStorage is empty', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('reads saved theme from localStorage', () => {
    localStorage.setItem('dndmeal-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggles from light to dark and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('dndmeal-theme')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggles back from dark to light', () => {
    localStorage.setItem('dndmeal-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('dndmeal-theme')).toBe('light');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd client && npx vitest run src/hooks/__tests__/useTheme.test.ts
```

Expected: FAIL — `useTheme` module not found.

- [ ] **Step 3: Implement `client/src/hooks/useTheme.ts`**

```typescript
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'dndmeal-theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return { theme, toggleTheme };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd client && npx vitest run src/hooks/__tests__/useTheme.test.ts
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Create `client/src/contexts/ThemeContext.tsx`**

```typescript
import { createContext, useContext } from 'react';
import { useTheme } from '../hooks/useTheme';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useTheme();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 6: Update `client/src/main.tsx` to wrap with ThemeProvider**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ToastContainer />
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
```

- [ ] **Step 7: Commit**

```bash
git add client/src/hooks/useTheme.ts client/src/hooks/__tests__/useTheme.test.ts client/src/contexts/ThemeContext.tsx client/src/main.tsx
git commit -m "feat: add useTheme hook, ThemeContext, and wire into app"
```

---

### Task 3: Update HomePage

**Files:**
- Modify: `client/src/pages/HomePage.tsx`

- [ ] **Step 1: Replace `client/src/pages/HomePage.tsx` header section and main bg**

At the top of the file, add the import:
```typescript
import { useThemeContext } from '../contexts/ThemeContext';
```

Inside the `HomePage` function body, add after the existing hooks:
```typescript
const { theme, toggleTheme } = useThemeContext();
```

Replace the outer wrapper div and header:
```tsx
return (
  <div className="min-h-screen bg-theme-bg">
    {/* Header */}
    <header className="bg-theme-elevated border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-display font-semibold text-theme-text">
          DnD<span className="italic font-light text-theme-accent">Meal</span>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-lg hover:bg-theme-hover transition"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => navigate('/history')}
            className="border border-theme-accent text-theme-accent px-4 py-2 rounded-full font-medium hover:bg-theme-accent-pale transition"
          >
            Historique
          </button>
          <button
            onClick={() => navigate('/add-recipe')}
            className="bg-theme-accent text-theme-accent-text px-4 py-2 rounded-full font-medium hover:bg-theme-accent-hover transition"
          >
            + Ajouter une recette
          </button>
        </div>
      </div>
    </header>
```

- [ ] **Step 2: Update the meal banner and empty state**

Replace the banner with meal selected:
```tsx
{currentMeal ? (
  <div className="bg-theme-accent text-theme-accent-text rounded-lg p-8 mb-8 flex gap-8 items-center">
    <div className="flex-1">
      <div className="text-sm opacity-75 uppercase tracking-wide mb-2">Ce soir on mange</div>
      <h2 className="text-4xl font-display font-semibold mb-2">{currentMeal.recipe.title}</h2>
      <p className="mb-6 opacity-90">
        par {currentMeal.selectedBy.name} · choisi {currentMeal.recipe.timesChosen}×
      </p>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setSelectedRecipe(currentMeal.recipe)}
          className="bg-theme-accent-text text-theme-accent px-6 py-2 rounded-full font-bold hover:opacity-90 transition"
        >
          Voir la recette
        </button>
        <button
          onClick={handleDeselectMeal}
          className="bg-white/20 text-theme-accent-text px-6 py-2 rounded-full hover:bg-white/30 transition"
        >
          Déselectionner
        </button>
        <button
          onClick={handleConfirmMeal}
          className="bg-theme-accent-text text-green-700 px-6 py-2 rounded-full font-bold hover:opacity-90 transition"
        >
          On a mangé ça !
        </button>
      </div>
    </div>
    {currentMeal.recipe.image && (
      <img
        src={currentMeal.recipe.image}
        alt=""
        className="w-48 h-48 object-cover rounded-lg flex-shrink-0"
      />
    )}
  </div>
) : (
  <div className="bg-theme-accent-pale text-theme-text rounded-lg p-8 mb-8">
    <div className="text-sm uppercase tracking-wide mb-2 text-theme-muted">Ce soir on mange</div>
    <h2 className="text-3xl font-display font-semibold mb-3">Aucun repas sélectionné</h2>
    <p className="text-theme-muted">Choisissez une recette ci-dessous</p>
  </div>
)}
```

- [ ] **Step 3: Verify the app renders in both themes**

```bash
cd client && npm run dev
```

Open http://localhost:5173, click the toggle, confirm background and text switch correctly.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/HomePage.tsx
git commit -m "feat: update HomePage with theme tokens and toggle button"
```

---

### Task 4: Update RecipeCard

**Files:**
- Modify: `client/src/components/RecipeCard.tsx`

- [ ] **Step 1: Replace color classes in `client/src/components/RecipeCard.tsx`**

Replace the entire file content:

```typescript
import { IRecipeResponse } from '@dndmeal/shared';

interface RecipeCardProps {
  recipe: IRecipeResponse;
  isNextMeal?: boolean;
  onClick: () => void;
}

const SMILEYS = ['😞', '😕', '😐', '🙂', '😄'];

function getRatingStats(ratings: any[]) {
  if (ratings.length === 0) return { total: 0, dominant: null, avg: 0 };
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let weightedSum = 0;
  ratings.forEach((r) => {
    counts[r.rating]++;
    weightedSum += r.rating;
  });
  let maxCount = 0, dominant = 1;
  for (let i = 1; i <= 5; i++) {
    if (counts[i] > maxCount) { maxCount = counts[i]; dominant = i; }
  }
  return { total: ratings.length, dominant, avg: weightedSum / ratings.length };
}

export default function RecipeCard({ recipe, isNextMeal, onClick }: RecipeCardProps) {
  const stats = getRatingStats(recipe.ratings);

  return (
    <div
      onClick={onClick}
      className="bg-theme-elevated rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative pt-[66.67%] bg-theme-hover overflow-hidden">
        {isNextMeal && (
          <div className="absolute top-2 right-2 bg-theme-accent text-theme-accent-text px-3 py-1 rounded-full text-xs font-bold z-10">
            Ce soir ✦
          </div>
        )}
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-theme-subtle font-mono">
            [photo recette]
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-display font-semibold text-lg text-theme-text mb-1 line-clamp-2">{recipe.title}</h3>
        <p className="text-sm text-theme-muted mb-3">par {recipe.author.name}</p>

        {recipe.ingredients.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3 text-xs">
            <span className="bg-theme-hover text-theme-subtle px-2 py-1 rounded-full">
              {recipe.ingredients.length} ingrédients
            </span>
            {recipe.steps.length > 0 && (
              <span className="bg-theme-hover text-theme-subtle px-2 py-1 rounded-full">
                {recipe.steps.length} étapes
              </span>
            )}
          </div>
        )}

        <div className="flex gap-3 text-xs text-theme-muted mt-auto pt-3 border-t border-theme-border">
          {stats.total > 0 ? (
            <>
              <span className="flex items-center gap-1">
                <span className="text-base">{SMILEYS[(stats.dominant ?? 1) - 1]}</span>
                {stats.total} avis
              </span>
              <span className="flex items-center gap-1">◎ {recipe.timesChosen}×</span>
            </>
          ) : (
            <span className="flex items-center gap-1">◎ {recipe.timesChosen}×</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify cards render in both themes**

With the dev server running, confirm cards show correct background and text in light and dark modes.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/RecipeCard.tsx
git commit -m "feat: update RecipeCard with theme tokens"
```

---

### Task 5: Update FilterPills and SortBar

**Files:**
- Modify: `client/src/components/FilterPills.tsx`
- Modify: `client/src/components/SortBar.tsx`

- [ ] **Step 1: Replace `client/src/components/FilterPills.tsx`**

```typescript
interface FilterPillsProps {
  filters: Array<{ id: string; label: string }>;
  activeFilters: string[];
  onToggle: (filterId: string) => void;
}

export default function FilterPills({ filters, activeFilters, onToggle }: FilterPillsProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onToggle(filter.id)}
          className={`px-4 py-2 rounded-full transition ${
            activeFilters.includes(filter.id)
              ? 'bg-theme-accent text-theme-accent-text'
              : 'bg-theme-elevated border border-theme-border text-theme-muted hover:border-theme-accent hover:text-theme-text'
          }`}
        >
          {filter.label} {activeFilters.includes(filter.id) && '×'}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Replace `client/src/components/SortBar.tsx`**

```typescript
interface SortOption {
  id: string;
  label: string;
  field: string | null;
  dir: -1 | 0 | 1;
}

interface SortBarProps {
  options: SortOption[];
  activeSort: string;
  onSortChange: (sortId: string) => void;
}

export default function SortBar({ options, activeSort, onSortChange }: SortBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-theme-muted">Trier par</span>
      <select
        value={activeSort}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-4 py-2 border border-theme-border rounded-lg bg-theme-elevated text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/FilterPills.tsx client/src/components/SortBar.tsx
git commit -m "feat: update FilterPills and SortBar with theme tokens"
```

---

### Task 6: Update RecipeModal

**Files:**
- Modify: `client/src/components/RecipeModal.tsx`

- [ ] **Step 1: Replace color classes in `client/src/components/RecipeModal.tsx`**

Replace the entire return block's JSX (keep all logic/handlers identical, only change Tailwind classes):

```tsx
return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-theme-elevated rounded-lg max-w-2xl w-full max-h-screen overflow-auto relative">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-theme-muted hover:text-theme-text text-2xl font-bold z-10"
      >
        ×
      </button>

      {/* Content */}
      <div className="p-8">
        {recipe.image && (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <h1 className="text-3xl font-display font-semibold text-theme-text mb-2">{recipe.title}</h1>
        <p className="text-theme-muted mb-6">par {recipe.author.name}</p>

        {recipe.ingredients.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-display font-semibold text-theme-text mb-4">Ingrédients</h2>
            <div className="grid grid-cols-2 gap-4">
              {recipe.ingredients.map((ingredient, idx) => (
                <li key={idx} className="text-theme-muted">
                  {ingredient}
                </li>
              ))}
            </div>
          </div>
        )}

        {recipe.steps.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-display font-semibold text-theme-text mb-4">Étapes</h2>
            <ol className="space-y-3">
              {recipe.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-theme-accent text-theme-accent-text rounded-full flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-theme-muted pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {recipe.tags.length > 0 && (
          <div className="mb-8 flex gap-2 flex-wrap">
            {recipe.tags.map((tag) => (
              <span key={tag} className="bg-theme-hover text-theme-subtle rounded-full px-3 py-1 text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-display font-semibold text-theme-text mb-4">Notations des joueurs</h2>
          {recipe.ratings.length === 0 ? (
            <p className="text-theme-muted">Aucune notation</p>
          ) : (
            <div className="space-y-2">
              {SMILEYS.map((smiley, idx) => {
                const rating = idx + 1;
                const count = ratingCounts[rating as 1 | 2 | 3 | 4 | 5];
                const barWidth = (count / maxRatingCount) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-2xl w-8 text-center">{smiley}</span>
                    <div className="flex-1 bg-theme-hover rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-theme-accent h-full flex items-center justify-center text-theme-accent-text text-xs font-medium transition-all duration-200"
                        style={{ width: `${barWidth}%` }}
                      >
                        {count > 0 && count}
                      </div>
                    </div>
                    <span className="text-theme-muted text-sm w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-display font-semibold text-theme-text mb-4">Noter cette recette</h2>
          <div className="flex justify-center gap-4">
            {SMILEYS.map((smiley, idx) => {
              const rating = (idx + 1) as 1 | 2 | 3 | 4 | 5;
              return (
                <button
                  key={idx}
                  onClick={() => handleAddRating(rating)}
                  disabled={isDisabled}
                  className="text-4xl hover:scale-125 hover:text-theme-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {smiley}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={handleSelectMeal}
            disabled={isDisabled || hasPendingMeal}
            title={hasPendingMeal ? 'Un repas est déjà sélectionné' : undefined}
            className={`flex-1 px-6 py-2 rounded-lg font-medium transition ${
              isDisabled || hasPendingMeal
                ? 'bg-theme-accent text-theme-accent-text opacity-50 cursor-not-allowed'
                : 'bg-theme-accent text-theme-accent-text hover:bg-theme-accent-hover'
            }`}
          >
            {hasPendingMeal ? 'Repas déjà sélectionné' : 'Sélectionner pour ce soir'}
          </button>

          {isAuthor && (
            <button
              disabled={isDisabled}
              className={`flex-1 px-6 py-2 rounded-lg font-medium transition ${
                isDisabled
                  ? 'bg-theme-hover text-theme-text opacity-50 cursor-not-allowed'
                  : 'bg-theme-hover text-theme-text hover:bg-theme-surface'
              }`}
            >
              Modifier
            </button>
          )}

          <button
            onClick={onClose}
            disabled={isDisabled}
            className={`flex-1 px-6 py-2 rounded-lg font-medium transition ${
              isDisabled
                ? 'bg-theme-hover text-theme-text opacity-50 cursor-not-allowed'
                : 'bg-theme-hover text-theme-text hover:bg-theme-surface'
            }`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
);
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/RecipeModal.tsx
git commit -m "feat: update RecipeModal with theme tokens"
```

---

### Task 7: Update HistoryPage

**Files:**
- Modify: `client/src/pages/HistoryPage.tsx`

- [ ] **Step 1: Add `useThemeContext` import and hook call in `HistoryPage`**

At the top of the file, add:
```typescript
import { useThemeContext } from '../contexts/ThemeContext';
```

Inside `HistoryPage()` function body, after the existing hooks:
```typescript
const { theme, toggleTheme } = useThemeContext();
```

- [ ] **Step 2: Replace the wrapper div, header, and all color classes**

```tsx
return (
  <div className="min-h-screen bg-theme-bg">
    {/* Header */}
    <header className="bg-theme-elevated border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-display font-semibold text-theme-text">
          DnD<span className="italic font-light text-theme-accent">Meal</span>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-lg hover:bg-theme-hover transition"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-theme-muted hover:text-theme-text transition"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </header>

    {/* Main Content */}
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-semibold text-theme-text mb-2">
          🍽️ Historique des repas
        </h1>
        <p className="text-theme-muted">Les repas sélectionnés par le groupe</p>
      </div>

      {localHistory.length === 0 ? (
        <div className="bg-theme-elevated rounded-lg border border-theme-border p-12 text-center">
          <p className="text-theme-muted text-lg mb-6">
            Aucun repas n'a été sélectionné pour le moment
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-theme-accent hover:text-theme-accent-hover font-medium transition"
          >
            Retourner à l'accueil
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {localHistory.map((item) => (
            <div
              key={item._id}
              className="bg-theme-elevated rounded-lg border border-theme-border p-6 hover:shadow-md transition"
            >
              <div className="flex gap-6 items-start">
                {item.recipe.image && (
                  <img
                    src={item.recipe.image}
                    alt={item.recipe.title}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-theme-muted uppercase font-medium mb-2">
                    {formatDate(item.date)}
                  </p>
                  <h3 className="text-lg font-display font-semibold text-theme-text mb-2">
                    {item.recipe.title}
                  </h3>
                  <p className="text-theme-muted text-sm mb-4">
                    Choisi par <span className="font-medium">{item.selectedBy.name}</span>
                  </p>
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
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>

    {selectedRecipe && (
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={true}
        onClose={() => setSelectedRecipe(null)}
        onSelectMeal={handleSelectMeal}
        onAddRating={async () => { setSelectedRecipe(null); }}
        currentUserId={user?._id}
        hasPendingMeal={!!currentMeal}
      />
    )}
  </div>
);
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/HistoryPage.tsx
git commit -m "feat: update HistoryPage with theme tokens and toggle button"
```

---

### Task 8: Update AddRecipePage

**Files:**
- Modify: `client/src/pages/AddRecipePage.tsx`

- [ ] **Step 1: Add `useThemeContext` import and hook call**

At the top of the file, add:
```typescript
import { useThemeContext } from '../contexts/ThemeContext';
```

Inside `AddRecipePage()` function body:
```typescript
const { theme, toggleTheme } = useThemeContext();
```

- [ ] **Step 2: Replace color classes in the loading state JSX**

```tsx
if (isLoadingInitial) {
  return (
    <div className="min-h-screen bg-theme-bg">
      <header className="bg-theme-elevated border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-display font-semibold text-theme-text">
            DnD<span className="italic font-light text-theme-accent">Meal</span>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center text-theme-muted">Chargement...</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Replace the full return JSX with theme-aware classes**

```tsx
return (
  <div className="min-h-screen bg-theme-bg">
    {/* Header */}
    <header className="bg-theme-elevated border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-display font-semibold text-theme-text">
          DnD<span className="italic font-light text-theme-accent">Meal</span>
        </div>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-lg hover:bg-theme-hover transition"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>

    {/* Main Content */}
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-semibold text-theme-text">
          {isEditing ? 'Modifier une recette' : 'Ajouter une recette'}
        </h1>
      </div>

      {form.globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {form.globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipe Title */}
        <div>
          <label className="block text-sm font-semibold text-theme-text mb-2">
            Nom de la recette <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value, errors: { ...prev.errors, title: undefined } }))}
            placeholder="Nom de la recette"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent bg-theme-elevated text-theme-text ${
              form.errors.title ? 'border-red-300' : 'border-theme-border'
            }`}
            disabled={form.isLoading}
          />
          {form.errors.title && <p className="text-red-600 text-sm mt-1">{form.errors.title}</p>}
        </div>

        {/* Recipe Image */}
        <div>
          <label className="block text-sm font-semibold text-theme-text mb-2">
            Image de la recette
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent bg-theme-elevated text-theme-text"
            disabled={form.isLoading}
          />
          {form.errors.image && <p className="text-red-600 text-sm mt-1">{form.errors.image}</p>}
          {form.image && (
            <div className="mt-4">
              <img src={form.image} alt="Preview" className="max-h-48 rounded-lg" />
            </div>
          )}
          {!form.image && <p className="text-theme-muted text-sm mt-2">Aucune image sélectionnée</p>}
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-semibold text-theme-text mb-2">
            Ingrédients <span className="text-red-600">*</span>
          </label>
          <div className="space-y-2 mb-3">
            {form.ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => handleIngredientChange(index, e.target.value)}
                  placeholder={`Ingrédient ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent bg-theme-elevated text-theme-text"
                  disabled={form.isLoading}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="px-3 py-2 text-theme-muted hover:text-red-600 transition"
                  disabled={form.isLoading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {form.errors.ingredients && <p className="text-red-600 text-sm mb-2">{form.errors.ingredients}</p>}
          {form.ingredients.length < 20 && (
            <button
              type="button"
              onClick={handleAddIngredient}
              className="text-theme-accent hover:underline cursor-pointer text-sm font-medium"
              disabled={form.isLoading}
            >
              + Ajouter un ingrédient
            </button>
          )}
        </div>

        {/* Steps */}
        <div>
          <label className="block text-sm font-semibold text-theme-text mb-2">
            Étapes <span className="text-red-600">*</span>
          </label>
          <div className="space-y-2 mb-3">
            {form.steps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <span className="flex-shrink-0 w-8 py-2 text-theme-muted text-sm font-medium">{index + 1}.</span>
                <textarea
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  placeholder={`Étape ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-theme-border rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-accent bg-theme-elevated text-theme-text resize-none"
                  rows={2}
                  disabled={form.isLoading}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="px-3 py-2 text-theme-muted hover:text-red-600 transition flex-shrink-0"
                  disabled={form.isLoading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {form.errors.steps && <p className="text-red-600 text-sm mb-2">{form.errors.steps}</p>}
          {form.steps.length < 20 && (
            <button
              type="button"
              onClick={handleAddStep}
              className="text-theme-accent hover:underline cursor-pointer text-sm font-medium"
              disabled={form.isLoading}
            >
              + Ajouter une étape
            </button>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-theme-text mb-3">Catégories</label>
          <div className="flex gap-2 flex-wrap">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  form.tags.includes(tag)
                    ? 'bg-theme-accent text-theme-accent-text'
                    : 'bg-theme-hover text-theme-text hover:bg-theme-surface'
                }`}
                disabled={form.isLoading}
              >
                {tag === 'vege' && '🌿 Végétarien'}
                {tag === 'rapide' && '⚡ Rapide'}
                {tag === 'transport' && '🎒 Transport facile'}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-theme-border">
          <button
            type="submit"
            disabled={form.isLoading}
            className="flex-1 bg-theme-accent text-theme-accent-text py-2 rounded-lg font-medium hover:bg-theme-accent-hover disabled:opacity-50 transition"
          >
            {form.isLoading
              ? isEditing ? 'Modification en cours...' : 'Sauvegarde en cours...'
              : isEditing ? 'Modifier la recette' : 'Sauvegarder la recette'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={form.isLoading}
            className="flex-1 bg-theme-hover text-theme-text py-2 rounded-lg font-medium hover:bg-theme-surface disabled:opacity-50 transition"
          >
            Annuler
          </button>
        </div>
      </form>
    </main>
  </div>
);
```

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/AddRecipePage.tsx
git commit -m "feat: update AddRecipePage with theme tokens and toggle button"
```

---

### Task 9: Update LoginPage

**Files:**
- Modify: `client/src/pages/LoginPage.tsx`

- [ ] **Step 1: Replace color classes in `client/src/pages/LoginPage.tsx`**

Replace the return JSX (keep all imports, state, and handlers unchanged):

```tsx
return (
  <div className="min-h-screen bg-theme-bg flex items-center justify-center">
    <div className="bg-theme-elevated rounded-lg shadow-lg p-8 w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="text-3xl font-display font-semibold text-theme-text">
          DnD<span className="italic font-light text-theme-accent">Meal</span>
        </div>
        <p className="text-theme-muted mt-2">Le carnet de recettes partagé</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('login')}
          className={`flex-1 py-2 px-4 rounded font-medium transition ${
            tab === 'login'
              ? 'bg-theme-accent text-theme-accent-text'
              : 'bg-theme-hover text-theme-muted hover:bg-theme-surface'
          }`}
        >
          Se connecter
        </button>
        <button
          onClick={() => setTab('register')}
          className={`flex-1 py-2 px-4 rounded font-medium transition ${
            tab === 'register'
              ? 'bg-theme-accent text-theme-accent-text'
              : 'bg-theme-hover text-theme-muted hover:bg-theme-surface'
          }`}
        >
          S'inscrire
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-text mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              className="w-full px-4 py-2 border border-theme-border rounded-lg focus:outline-none focus:border-theme-accent bg-theme-elevated text-theme-text"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-text mb-1">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-theme-border rounded-lg focus:outline-none focus:border-theme-accent bg-theme-elevated text-theme-text"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-theme-muted"
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-theme-accent text-theme-accent-text py-2 rounded-lg font-medium hover:bg-theme-accent-hover disabled:opacity-50 transition"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-text mb-1">Prénom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Marie, Thomas..."
              className="w-full px-4 py-2 border border-theme-border rounded-lg focus:outline-none focus:border-theme-accent bg-theme-elevated text-theme-text"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-text mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              className="w-full px-4 py-2 border border-theme-border rounded-lg focus:outline-none focus:border-theme-accent bg-theme-elevated text-theme-text"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-theme-text mb-1">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-theme-border rounded-lg focus:outline-none focus:border-theme-accent bg-theme-elevated text-theme-text"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-theme-muted"
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          {inviteToken && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">
              ✓ Lien d'invitation valide
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-theme-accent text-theme-accent-text py-2 rounded-lg font-medium hover:bg-theme-accent-hover disabled:opacity-50 transition"
          >
            {isLoading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>
      )}
    </div>
  </div>
);
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/LoginPage.tsx
git commit -m "feat: update LoginPage with theme tokens"
```

---

### Task 10: Update ToastContainer

**Files:**
- Modify: `client/src/components/ToastContainer.tsx`

- [ ] **Step 1: Replace `bg-white` with `bg-theme-elevated` and close button color in `ToastContainer.tsx`**

Replace only these two parts of the file:

In the toast `div`, change `bg-white border-l-4 rounded-lg shadow-lg p-4 mb-3` to `bg-theme-elevated border-l-4 rounded-lg shadow-lg p-4 mb-3`.

Replace the close button classes `text-gray-400 hover:text-gray-600` with `text-theme-subtle hover:text-theme-muted`.

Full updated `ToastContainer.tsx`:

```typescript
import React from 'react';
import { useToast, ToastType } from '../contexts/ToastContext';

function getIcon(type: ToastType): string {
  switch (type) {
    case 'success': return '✓';
    case 'error':   return '✕';
    case 'warning': return '⚠';
    case 'info':    return 'ℹ';
    default:        return '○';
  }
}

function getColorClasses(type: ToastType): string {
  switch (type) {
    case 'success': return 'border-l-green-500 text-green-700';
    case 'error':   return 'border-l-red-500 text-red-700';
    case 'warning': return 'border-l-yellow-500 text-yellow-700';
    case 'info':    return 'border-l-blue-500 text-blue-700';
    default:        return 'border-l-gray-500 text-gray-700';
  }
}

function getIconColorClasses(type: ToastType): string {
  switch (type) {
    case 'success': return 'text-green-500';
    case 'error':   return 'text-red-500';
    case 'warning': return 'text-yellow-500';
    case 'info':    return 'text-blue-500';
    default:        return 'text-gray-500';
  }
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-50 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            bg-theme-elevated border-l-4 rounded-lg shadow-lg p-4 mb-3
            animate-slideInRight pointer-events-auto
            ${getColorClasses(toast.type)}
          `}
          role="alert"
          aria-label={`${toast.type}: ${toast.message}`}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex gap-3 items-start flex-1">
              <span className={`text-lg font-bold flex-shrink-0 ${getIconColorClasses(toast.type)}`}>
                {getIcon(toast.type)}
              </span>
              <p className="text-sm font-medium text-theme-text">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-theme-subtle hover:text-theme-muted cursor-pointer flex-shrink-0 text-xl leading-none"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Run all tests to confirm nothing is broken**

```bash
cd client && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Final visual check**

```bash
cd client && npm run dev
```

Verify in browser:
- Light mode: warm cream background, gold accents, Fraunces font on titles
- Dark mode: dark brown background, same gold accents, text is warm white
- Toggle persists after page refresh
- All pages (home, history, add recipe, login) respect the theme
- Toasts appear correctly in both modes

- [ ] **Step 4: Final commit**

```bash
git add client/src/components/ToastContainer.tsx
git commit -m "feat: update ToastContainer with theme tokens — complete design system migration"
```
