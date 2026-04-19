import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { useMealSelection } from '../hooks/useMealSelection';
import { useWebSocket } from '../hooks/useWebSocket';
import { IRecipeResponse } from '@dndmeal/shared';
import RecipeCard from '../components/RecipeCard';

const FILTERS = [
  { id: 'vege', label: '🌿 Végétarien' },
  { id: 'rapide', label: '⚡ Recette rapide' },
  { id: 'transport', label: '🎒 Transport facile' },
];

const SORT_OPTIONS = [
  { id: 'magic', label: '✦ Magique', field: null, dir: 0 },
  { id: 'chosen-desc', label: 'Plus choisi', field: 'timesChosen', dir: -1 },
  { id: 'chosen-asc', label: 'Moins choisi', field: 'timesChosen', dir: 1 },
  { id: 'rating-desc', label: 'Mieux noté', field: 'avg', dir: -1 },
  { id: 'rating-asc', label: 'Moins bien noté', field: 'avg', dir: 1 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { recipes, addRating } = useRecipes();
  const { currentMeal, selectMeal } = useMealSelection();
  const { on, off } = useWebSocket();

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeSort, setActiveSort] = useState('magic');
  const [selectedRecipe, setSelectedRecipe] = useState<IRecipeResponse | null>(null);

  // Filter recipes
  const filtered = useMemo(() => {
    if (activeFilters.length === 0) return recipes;
    return recipes.filter((r) =>
      activeFilters.every((f) => (r.tags || []).includes(f))
    );
  }, [recipes, activeFilters]);

  // Sort recipes
  const sorted = useMemo(() => {
    const sortOpt = SORT_OPTIONS.find((o) => o.id === activeSort);
    if (!sortOpt || sortOpt.id === 'magic') {
      return [...filtered].sort(() => Math.random() - 0.5);
    }
    return [...filtered].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      if (sortOpt.field === 'avg') {
        const aRatings = a.ratings.reduce((s, r) => s + r.rating, 0) / (a.ratings.length || 1);
        const bRatings = b.ratings.reduce((s, r) => s + r.rating, 0) / (b.ratings.length || 1);
        aVal = aRatings;
        bVal = bRatings;
      } else {
        aVal = (a[sortOpt.field as keyof IRecipeResponse] as number) ?? 0;
        bVal = (b[sortOpt.field as keyof IRecipeResponse] as number) ?? 0;
      }
      return (aVal - bVal) * sortOpt.dir;
    });
  }, [filtered, activeSort]);

  // WebSocket listeners
  useEffect(() => {
    const handleMealSelected = (data: any) => {
      // Meal selection updates are handled by useMealSelection hook
    };

    const handleRecipeAdded = (data: any) => {
      // Recipe additions are handled by useRecipes hook
    };

    const handleRecipeUpdated = (data: any) => {
      // Recipe updates are handled by useRecipes hook
    };

    const handleRecipeDeleted = (data: any) => {
      // Recipe deletions are handled by useRecipes hook
    };

    const handleRatingAdded = (data: any) => {
      // Rating updates are handled by useRecipes hook
    };

    on('meal:selected', handleMealSelected);
    on('recipe:added', handleRecipeAdded);
    on('recipe:updated', handleRecipeUpdated);
    on('recipe:deleted', handleRecipeDeleted);
    on('rating:added', handleRatingAdded);

    return () => {
      off('meal:selected');
      off('recipe:added');
      off('recipe:updated');
      off('recipe:deleted');
      off('rating:added');
    };
  }, [on, off]);

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">
            DnD<span className="italic text-amber-600">Meal</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/add-recipe')}
              className="bg-amber-600 text-white px-4 py-2 rounded-full font-medium hover:bg-amber-700 transition"
            >
              + Ajouter une recette
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Next Meal Banner */}
        {currentMeal ? (
          <div className="bg-amber-600 text-white rounded-lg p-8 mb-8 flex gap-8 items-center">
            <div className="flex-1">
              <div className="text-sm opacity-75 uppercase tracking-wide mb-2">Ce soir on mange</div>
              <h2 className="text-4xl font-bold mb-2">{currentMeal.recipe.title}</h2>
              <p className="mb-6 opacity-90">
                par {currentMeal.selectedBy.name} · choisi {currentMeal.recipe.timesChosen}×
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedRecipe(currentMeal.recipe)}
                  className="bg-white text-amber-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition"
                >
                  Voir la recette
                </button>
                <button
                  onClick={() => navigate('/history')}
                  className="bg-white bg-opacity-20 text-white px-6 py-2 rounded-full hover:bg-opacity-30 transition"
                >
                  Changer
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
          <div className="bg-amber-100 text-amber-900 rounded-lg p-8 mb-8">
            <div className="text-sm uppercase tracking-wide mb-2">Ce soir on mange</div>
            <h2 className="text-3xl font-bold mb-3">Aucun repas sélectionné</h2>
            <p>Choisissez une recette ci-dessous</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-3 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => toggleFilter(f.id)}
                className={`px-4 py-2 rounded-full transition ${
                  activeFilters.includes(f.id)
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-amber-600'
                }`}
              >
                {f.label} {activeFilters.includes(f.id) && '×'}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-gray-600">Trier par</span>
          <select
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              Aucune recette ne correspond à ces filtres.
            </div>
          ) : (
            sorted.map((recipe) => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
                isNextMeal={currentMeal?.recipe._id === recipe._id}
                onClick={() => setSelectedRecipe(recipe)}
              />
            ))
          )}
        </div>
      </main>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedRecipe.title}</h2>
            <p className="text-gray-600 mb-4">par {selectedRecipe.author.name}</p>

            {/* Ingredients */}
            {selectedRecipe.ingredients.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-2">Ingrédients</h3>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <li key={idx}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Steps */}
            {selectedRecipe.steps.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-2">Étapes</h3>
                <ol className="list-decimal list-inside text-sm text-gray-700">
                  {selectedRecipe.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tags */}
            {selectedRecipe.tags.length > 0 && (
              <div className="mb-4 flex gap-2 flex-wrap">
                {selectedRecipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={async () => {
                  await selectMeal(selectedRecipe._id);
                  setSelectedRecipe(null);
                }}
                className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 transition flex-1"
              >
                Sélectionner pour demain
              </button>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition flex-1"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
