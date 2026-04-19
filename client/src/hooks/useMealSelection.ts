import { useState, useCallback, useEffect } from 'react';
import { IMealSelectionResponse } from '@dndmeal/shared';
import api from '../services/api';

export function useMealSelection() {
  const [currentMeal, setCurrentMeal] = useState<IMealSelectionResponse | null>(null);
  const [history, setHistory] = useState<IMealSelectionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentMeal = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/meals/current');
      setCurrentMeal(res.data.meal);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch current meal');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getHistory = useCallback(async () => {
    try {
      const res = await api.get('/meals/history');
      setHistory(res.data.history);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch history');
    }
  }, []);

  const selectMeal = useCallback(async (recipeId: string) => {
    const res = await api.post('/meals/select', { recipeId });
    setCurrentMeal(res.data.meal);
    return res.data.meal;
  }, []);

  const deselectMeal = useCallback(async () => {
    await api.delete('/meals/current');
    setCurrentMeal(null);
  }, []);

  const confirmMeal = useCallback(async () => {
    await api.post('/meals/confirm');
    setCurrentMeal(null);
    await getHistory();
  }, [getHistory]);

  useEffect(() => {
    getCurrentMeal();
    getHistory();
  }, [getCurrentMeal, getHistory]);

  return {
    currentMeal,
    history,
    isLoading,
    error,
    getCurrentMeal,
    selectMeal,
    deselectMeal,
    confirmMeal,
    getHistory,
  };
}
