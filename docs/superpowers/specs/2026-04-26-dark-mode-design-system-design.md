# Design System & Dark Mode — DnDMeal

## Contexte

La maquette (`dndmeal/project/index.html`) définit un système de design complet : palette organique chaude, polices Fraunces/DM Sans, toggle thème clair/sombre. L'objectif est d'implémenter ce système dans l'app React/Tailwind existante, avec mémorisation de la préférence thème via `localStorage`.

## Décisions

- **Scope** : migration complète du design system (couleurs, polices, cartes)
- **Intégration** : CSS Variables + Tailwind étendu (pas de réécriture en inline styles)
- **Persistance** : `localStorage` clé `dndmeal-theme`, défaut `light`

## Tokens de couleur

### Mode clair

| Token CSS | Valeur | Usage |
|-----------|--------|-------|
| `--color-bg` | `#faf6f0` | Fond de page |
| `--color-bg-elevated` | `#fff8f0` | Header, cartes |
| `--color-bg-hover` | `#f2ece3` | Hover, placeholder image |
| `--color-surface` | `#fff8f0` | Surfaces interactives |
| `--color-border` | `#e8ddd4` | Bordures |
| `--color-text` | `#2d1f15` | Texte principal |
| `--color-text-muted` | `#9a7c6b` | Texte secondaire |
| `--color-text-subtle` | `#b8a090` | Texte tertiaire |
| `--color-accent` | `#d4a017` | Accent doré (remplace amber-600) |
| `--color-accent-hover` | `#b8880f` | Accent survol |
| `--color-accent-text` | `#2d1f15` | Texte sur accent |
| `--color-accent-pale` | `#fdf4d0` | Fond accent pâle |

### Mode sombre (`[data-theme="dark"]`)

| Token CSS | Valeur |
|-----------|--------|
| `--color-bg` | `#1c1712` |
| `--color-bg-elevated` | `#241f18` |
| `--color-bg-hover` | `#2e271e` |
| `--color-surface` | `#221d16` |
| `--color-border` | `#3a3028` |
| `--color-text` | `#f0e8dc` |
| `--color-text-muted` | `#b09a86` |
| `--color-text-subtle` | `#8a7464` |
| *(accent inchangé)* | |

## Typographie

- **Polices** : `Fraunces` (display/titres, italic disponible) + `DM Sans` (corps)
- **Import** : Google Fonts dans `client/index.html`
- **Tailwind config** : `fontFamily.display` → `['Fraunces', 'serif']`, `fontFamily.body` → `['DM Sans', 'sans-serif']`
- **Body** : `font-family: 'DM Sans', sans-serif` dans `index.css`
- **Titres** (DnDMeal logo, h1/h2 pages, titres recettes) : classe `font-display`

## Architecture

### Nouveaux fichiers

- `client/src/hooks/useTheme.ts` — lit/écrit `localStorage['dndmeal-theme']`, applique `document.documentElement.dataset.theme`
- `client/src/contexts/ThemeContext.tsx` — provider exposant `{ theme, toggleTheme }`

### Fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `client/index.html` | Lien Google Fonts |
| `client/src/index.css` | CSS vars light/dark + `body { font-family }` + `transition background/color` |
| `client/tailwind.config.js` | Étendre `colors` avec tokens `theme-*`, `fontFamily` |
| `client/src/main.tsx` | Wrapper `ThemeProvider` |
| `client/src/pages/HomePage.tsx` | Classes couleur → `theme-*`, toggle dans header |
| `client/src/pages/HistoryPage.tsx` | Classes couleur → `theme-*` |
| `client/src/pages/AddRecipePage.tsx` | Classes couleur → `theme-*` |
| `client/src/pages/LoginPage.tsx` | Classes couleur → `theme-*` |
| `client/src/components/RecipeCard.tsx` | Classes couleur → `theme-*` |
| `client/src/components/RecipeModal.tsx` | Classes couleur → `theme-*` |
| `client/src/components/FilterPills.tsx` | Classes couleur → `theme-*` |
| `client/src/components/SortBar.tsx` | Classes couleur → `theme-*` |
| `client/src/components/ToastContainer.tsx` | Classes couleur → `theme-*` |

## Header final

```
[ DnDMeal ]                    [ 🌙 ] [ Historique ] [ + Ajouter une recette ]
```

- Toggle thème : bouton rond 40×40px, `bg-theme-surface border-theme-border`
- Historique : outlined `border-theme-accent text-theme-accent hover:bg-theme-accent-pale`
- Ajouter : plein `bg-theme-accent text-theme-accent-text hover:bg-theme-accent-hover`

## Mapping des classes existantes

| Avant | Après |
|-------|-------|
| `bg-gray-50` | `bg-theme-bg` |
| `bg-white` | `bg-theme-elevated` |
| `text-gray-900` | `text-theme-text` |
| `text-gray-500` / `text-gray-600` | `text-theme-muted` |
| `border-gray-200` | `border-theme-border` |
| `bg-amber-600` | `bg-theme-accent` |
| `text-amber-600` | `text-theme-accent` |
| `hover:bg-amber-700` | `hover:bg-theme-accent-hover` |
| `bg-amber-100` | `bg-theme-accent-pale` |
| `text-amber-900` | `text-theme-text` |

## Comportement du toggle

1. Au chargement : lire `localStorage['dndmeal-theme']` → si absent, `'light'`
2. Appliquer `document.documentElement.dataset.theme = theme`
3. Au clic toggle : basculer, sauvegarder dans `localStorage`, mettre à jour l'attribut
4. Transition CSS fluide : `transition: background 0.3s, color 0.3s` sur `body` et éléments clés
