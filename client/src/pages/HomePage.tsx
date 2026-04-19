import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { useMealSelection } from '../hooks/useMealSelection';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { IRecipeResponse } from '@dndmeal/shared';
import RecipeCard from '../components/RecipeCard';
import RecipeModal from '../components/RecipeModal';
import FilterPills from '../components/FilterPills';
import SortBar from '../components/SortBar';

const FILTERS = [
  { id: 'vege', label: '🌿 Végétarien' },
  { id: 'rapide', label: '⚡ Recette rapide' },
  { id: 'transport', label: '🎒 Transport facile' },
];

const SORT_OPTIONS: Array<{ id: string; label: string; field: string | null; dir: -1 | 0 | 1 }> = [
  { id: 'magic', label: '✦ Magique', field: null, dir: 0 },
  { id: 'chosen-desc', label: 'Plus choisi', field: 'timesChosen', dir: -1 },
  { id: 'chosen-asc', label: 'Moins choisi', field: 'timesChosen', dir: 1 },
  { id: 'rating-desc', label: 'Mieux noté', field: 'avg', dir: -1 },
  { id: 'rating-asc', label: 'Moins bien noté', field: 'avg', dir: 1 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { recipes, addRating } = useRecipes();
  const { currentMeal, selectMeal, deselectMeal, confirmMeal, getCurrentMeal } = useMealSelection();
  const { on, off } = useWebSocket();
  const { user } = useAuth();
  const { addToast } = useToast();

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

    const handleMealDeselected = () => {
      getCurrentMeal();
    };

    const handleMealConfirmed = () => {
      getCurrentMeal();
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
    on('meal:deselected', handleMealDeselected);
    on('meal:confirmed', handleMealConfirmed);
    on('recipe:added', handleRecipeAdded);
    on('recipe:updated', handleRecipeUpdated);
    on('recipe:deleted', handleRecipeDeleted);
    on('rating:added', handleRatingAdded);

    return () => {
      off('meal:selected', handleMealSelected);
      off('meal:deselected', handleMealDeselected);
      off('meal:confirmed', handleMealConfirmed);
      off('recipe:added', handleRecipeAdded);
      off('recipe:updated', handleRecipeUpdated);
      off('recipe:deleted', handleRecipeDeleted);
      off('rating:added', handleRatingAdded);
    };
  }, [on, off, getCurrentMeal]);

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSelectMeal = async (recipeId: string) => {
    try {
      await selectMeal(recipeId);
      addToast('Repas sélectionné pour demain!', 'success');
      setSelectedRecipe(null);
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Une erreur est survenue';
      addToast(message, 'error');
    }
  };

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
          <FilterPills
            filters={FILTERS}
            activeFilters={activeFilters}
            onToggle={toggleFilter}
          />
        </div>

        {/* Sort */}
        <div className="mb-6">
          <SortBar
            options={SORT_OPTIONS}
            activeSort={activeSort}
            onSortChange={setActiveSort}
          />
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
        <RecipeModal
          recipe={selectedRecipe}
          isOpen={true}
          onClose={() => setSelectedRecipe(null)}
          onSelectMeal={handleSelectMeal}
          onAddRating={(rating) => addRating(selectedRecipe._id, rating)}
          currentUserId={user?._id}
          hasPendingMeal={!!currentMeal}
        />
      )}
    </div>
  );
}
