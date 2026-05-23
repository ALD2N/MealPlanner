import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IRecipeResponse } from '@dndmeal/shared';
import { useToast } from '../contexts/ToastContext';

const SMILEYS = ['😞', '😕', '😐', '🙂', '😄'];

interface RecipeModalProps {
  recipe: IRecipeResponse;
  isOpen: boolean;
  onClose: () => void;
  onSelectMeal: (recipeId: string) => Promise<void>;
  onAddRating: (rating: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  currentUserId?: string;
  hasPendingMeal?: boolean;
}

function getRatingCounts(ratings: any[]): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => {
    counts[r.rating]++;
  });
  return counts;
}

export default function RecipeModal({
  recipe,
  isOpen,
  onClose,
  onSelectMeal,
  onAddRating,
  currentUserId,
  hasPendingMeal = false,
}: RecipeModalProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSelectingMeal, setIsSelectingMeal] = useState(false);
  const [isRating, setIsRating] = useState(false);

  if (!isOpen) {
    return null;
  }

  const ratingCounts = getRatingCounts(recipe.ratings);
  const maxRatingCount = Math.max(...Object.values(ratingCounts), 1);
  const isAuthor = currentUserId === recipe.author._id;

  const handleSelectMeal = async () => {
    setIsSelectingMeal(true);
    try {
      await onSelectMeal(recipe._id);
      onClose();
    } finally {
      setIsSelectingMeal(false);
    }
  };

  const handleEditRecipe = () => {
    navigate(`/add-recipe?id=${recipe._id}`);
    onClose();
  };

  const handleAddRating = async (rating: 1 | 2 | 3 | 4 | 5) => {
    setIsRating(true);
    try {
      await onAddRating(rating);
      addToast('Notation enregistrée!', 'success');
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Une erreur est survenue';
      addToast(message, 'error');
    } finally {
      setIsRating(false);
    }
  };

  const isDisabled = isSelectingMeal || isRating;

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
          {/* Header with Image and Title */}
          {recipe.image && (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}

          <h1 className="text-3xl font-display font-semibold text-theme-text mb-2">{recipe.title}</h1>
          <p className="text-theme-muted mb-6">par {recipe.author.name}</p>

          {/* Ingredients Section */}
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

          {/* Steps Section */}
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

          {/* Tags Section */}
          {recipe.tags.length > 0 && (
            <div className="mb-8 flex gap-2 flex-wrap">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-theme-hover text-theme-subtle rounded-full px-3 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Rating Distribution Section */}
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

          {/* Rating Input Section */}
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

          {/* Action Buttons */}
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
                onClick={handleEditRecipe}
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
}
