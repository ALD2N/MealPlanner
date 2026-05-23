import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMealSelection } from '../hooks/useMealSelection';
import { useRecipes } from '../hooks/useRecipes';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { IRecipeResponse, IMealSelectionResponse, IUserResponse } from '@dndmeal/shared';
import RecipeModal from '../components/RecipeModal';
import { ChangeUserModal } from '../components/ChangeUserModal';
import api from '../services/api';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { currentMeal, history, selectMeal, getHistory, updateMealSelectedBy } = useMealSelection();
  const { deleteRecipe, addRating } = useRecipes();
  const { on, off } = useWebSocket();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useThemeContext();

  const [selectedRecipe, setSelectedRecipe] = useState<IRecipeResponse | null>(null);
  const [isLoadingMeal, setIsLoadingMeal] = useState<string | null>(null);
  const [localHistory, setLocalHistory] = useState<IMealSelectionResponse[]>([]);
  const [allUsers, setAllUsers] = useState<IUserResponse[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [mealToChangeId, setMealToChangeId] = useState<string | null>(null);
  const [isChangingUser, setIsChangingUser] = useState(false);

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

  // Fetch all users on mount
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

  // WebSocket listener for meal updates
  useEffect(() => {
    const handleMealUpdated = () => {
      getHistory();
    };

    on('meal:updated', handleMealUpdated);

    return () => {
      off('meal:updated', handleMealUpdated);
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
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <header className="bg-theme-elevated border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-display font-semibold text-theme-text">
            Meal<span className="italic font-light text-theme-accent">Planner</span>
          </div>
          <div className="flex gap-3 items-center">
            {user?.isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 rounded-lg font-medium bg-theme-hover text-theme-text hover:bg-theme-surface transition"
                title="Accéder au panneau d'administration"
              >
                ⚙️ Admin
              </button>
            )}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-lg hover:bg-theme-hover transition"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg font-medium bg-theme-hover text-theme-text hover:bg-theme-surface transition"
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
          onAddRating={(rating) => addRating(selectedRecipe._id, rating)}
          onDeleteRecipe={(id) => deleteRecipe(id)}
          currentUserId={user?._id}
          hasPendingMeal={!!currentMeal}
        />
      )}

      <ChangeUserModal
        isOpen={mealToChangeId !== null}
        onClose={() => setMealToChangeId(null)}
        onConfirm={handleChangeUser}
        currentUserId={localHistory.find(m => m._id === mealToChangeId)?.selectedBy._id || ''}
        users={allUsers}
        isLoading={isChangingUser}
      />
    </div>
  );
}
