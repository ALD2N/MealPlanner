import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMealSelection } from '../hooks/useMealSelection';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { IRecipeResponse, IMealSelectionResponse } from '@dndmeal/shared';
import RecipeModal from '../components/RecipeModal';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { currentMeal, history, selectMeal, getHistory } = useMealSelection();
  const { on, off } = useWebSocket();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [selectedRecipe, setSelectedRecipe] = useState<IRecipeResponse | null>(null);
  const [isLoadingMeal, setIsLoadingMeal] = useState<string | null>(null);
  const [localHistory, setLocalHistory] = useState<IMealSelectionResponse[]>([]);

  // Initialize history on mount
  useEffect(() => {
    getHistory();
  }, [getHistory]);

  // Sync local history with hook state
  useEffect(() => {
    setLocalHistory([...history].sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()));
  }, [history]);

  // WebSocket listener for new meal confirmations
  useEffect(() => {
    const handleMealConfirmed = () => {
      getHistory();
    };

    on('meal:confirmed', handleMealConfirmed);

    return () => {
      off('meal:confirmed', handleMealConfirmed);
    };
  }, [on, off, getHistory]);

  const handleSelectMeal = async (recipeId: string) => {
    setIsLoadingMeal(recipeId);
    try {
      await selectMeal(recipeId);
      addToast('Repas changé!', 'success');
      setSelectedRecipe(null);
      await getHistory();
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Une erreur est survenue';
      addToast(message, 'error');
    } finally {
      setIsLoadingMeal(null);
    }
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'Date inconnue';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return dateObj.toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">
            DnD<span className="italic text-amber-600">Meal</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🍽️ Historique des repas
          </h1>
          <p className="text-gray-600">Les repas sélectionnés par le groupe</p>
        </div>

        {/* Empty State */}
        {localHistory.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg mb-6">
              Aucun repas n'a été sélectionné pour le moment
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-amber-600 hover:text-amber-700 font-medium transition"
            >
              Retourner à l'accueil
            </button>
          </div>
        ) : (
          /* History List */
          <div className="space-y-4">
            {localHistory.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex gap-6 items-start">
                  {/* Recipe Image */}
                  {item.recipe.image && (
                    <img
                      src={item.recipe.image}
                      alt={item.recipe.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Date */}
                    <p className="text-sm text-gray-500 uppercase font-medium mb-2">
                      {formatDate(item.date)}
                    </p>

                    {/* Recipe Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {item.recipe.title}
                    </h3>

                    {/* Selected By */}
                    <p className="text-gray-600 text-sm mb-4">
                      Choisi par <span className="font-medium">{item.selectedBy.name}</span>
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => handleSelectMeal(item.recipe._id)}
                        disabled={isLoadingMeal === item.recipe._id || !!currentMeal}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          isLoadingMeal === item.recipe._id || !!currentMeal
                            ? 'bg-amber-600 text-white opacity-50 cursor-not-allowed'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        }`}
                      >
                        {isLoadingMeal === item.recipe._id ? 'Sélection...' : 'Changer'}
                      </button>

                      <button
                        onClick={() => setSelectedRecipe(item.recipe)}
                        disabled={isLoadingMeal !== null}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          isLoadingMeal !== null
                            ? 'bg-gray-200 text-gray-700 opacity-50 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          isOpen={true}
          onClose={() => setSelectedRecipe(null)}
          onSelectMeal={handleSelectMeal}
          onAddRating={async () => {
            // Rating is handled by the hook, just close the modal
            setSelectedRecipe(null);
          }}
          currentUserId={user?._id}
          hasPendingMeal={!!currentMeal}
        />
      )}
    </div>
  );
}
