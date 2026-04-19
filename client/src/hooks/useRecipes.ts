import { useState, useCallback, useEffect } from 'react';
import { IRecipeResponse } from '@dndmeal/shared';
import api from '../services/api';

export function useRecipes() {
  const [recipes, setRecipes] = useState<IRecipeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/recipes');
      setRecipes(res.data.recipes);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch recipes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addRecipe = useCallback(
    async (data: any) => {
      try {
        const res = await api.post('/recipes', data);
        setRecipes((prev) => [res.data.recipe, ...prev]);
        return res.data.recipe;
      } catch (err: any) {
        throw new Error(err.response?.data?.error || 'Failed to add recipe');
      }
    },
    []
  );

  const updateRecipe = useCallback(
    async (id: string, data: any) => {
      try {
        const res = await api.patch(`/recipes/${id}`, data);
        setRecipes((prev) =>
          prev.map((r) => (r._id === id ? res.data.recipe : r))
        );
        return res.data.recipe;
      } catch (err: any) {
        throw new Error(err.response?.data?.error || 'Failed to update recipe');
      }
    },
    []
  );

  const deleteRecipe = useCallback(async (id: string) => {
    try {
      await api.delete(`/recipes/${id}`);
      setRecipes((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to delete recipe');
    }
  }, []);

  const addRating = useCallback(
    async (recipeId: string, rating: number) => {
      try {
        const res = await api.patch(`/recipes/${recipeId}/rating`, { rating });
        setRecipes((prev) =>
          prev.map((r) => (r._id === recipeId ? res.data.recipe : r))
        );
      } catch (err: any) {
        throw new Error(err.response?.data?.error || 'Failed to add rating');
      }
    },
    []
  );

  // Fetch recipes on mount
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return {
    recipes,
    isLoading,
    error,
    fetchRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    addRating,
  };
}
