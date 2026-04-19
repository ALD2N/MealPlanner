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
    if (counts[i] > maxCount) {
      maxCount = counts[i];
      dominant = i;
    }
  }
  return { total: ratings.length, dominant, avg: weightedSum / ratings.length };
}

export default function RecipeCard({ recipe, isNextMeal, onClick }: RecipeCardProps) {
  const stats = getRatingStats(recipe.ratings);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition cursor-pointer hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative pt-[66.67%] bg-gray-100 overflow-hidden">
        {isNextMeal && (
          <div className="absolute top-2 right-2 bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
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
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-mono">
            [photo recette]
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{recipe.title}</h3>
        <p className="text-sm text-gray-500 mb-3">par {recipe.author.name}</p>

        {/* Tags */}
        {recipe.ingredients.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3 text-xs">
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {recipe.ingredients.length} ingrédients
            </span>
            {recipe.steps.length > 0 && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {recipe.steps.length} étapes
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-3 text-xs text-gray-600 mt-auto pt-3 border-t">
          {stats.total > 0 ? (
            <>
              <span className="flex items-center gap-1">
                <span className="text-base">{SMILEYS[stats.dominant - 1]}</span>
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
