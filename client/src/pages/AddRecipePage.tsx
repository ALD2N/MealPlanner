import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { useToast } from '../contexts/ToastContext';
import { useThemeContext } from '../contexts/ThemeContext';
import api from '../services/api';

interface RecipeFormState {
  title: string;
  image: string | null;
  ingredients: string[];
  steps: string[];
  tags: string[];
  errors: Record<string, string | undefined>;
  isLoading: boolean;
  globalError: string | null;
}

const AVAILABLE_TAGS = ['vege', 'rapide', 'transport'];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

export default function AddRecipePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addRecipe, updateRecipe } = useRecipes();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useThemeContext();

  const [form, setForm] = useState<RecipeFormState>({
    title: '',
    image: null,
    ingredients: [''],
    steps: [''],
    tags: [],
    errors: {},
    isLoading: false,
    globalError: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);

  // Check for recipeId in URL and fetch if editing
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setRecipeId(id);
      setIsEditing(true);
      fetchRecipe(id);
    }
  }, [searchParams]);

  const fetchRecipe = async (id: string) => {
    setIsLoadingInitial(true);
    try {
      const res = await api.get(`/recipes/${id}`);
      const recipe = res.data.recipe;
      setForm((prev) => ({
        ...prev,
        title: recipe.title || '',
        image: recipe.image || null,
        ingredients: recipe.ingredients || [''],
        steps: recipe.steps || [''],
        tags: recipe.tags || [],
      }));
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to load recipe';
      setForm((prev) => ({
        ...prev,
        globalError: message,
      }));
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setForm((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          image: 'Format accepté: JPG, PNG, WebP',
        },
      }));
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      setForm((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          image: 'Taille maximale: 5MB',
        },
      }));
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        image: reader.result as string,
        errors: {
          ...prev.errors,
          image: undefined,
        },
      }));
    };
    reader.onerror = () => {
      setForm((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          image: 'Erreur lors de la lecture du fichier',
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddIngredient = () => {
    if (form.ingredients.length < 20) {
      setForm((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, ''],
      }));
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleIngredientChange = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => (i === index ? value : ing)),
    }));
  };

  const handleAddStep = () => {
    if (form.steps.length < 20) {
      setForm((prev) => ({
        ...prev,
        steps: [...prev.steps, ''],
      }));
    }
  };

  const handleRemoveStep = (index: number) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const handleStepChange = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) => (i === index ? value : step)),
    }));
  };

  const handleToggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    setForm((prev) => ({
      ...prev,
      errors: newErrors,
    }));

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      isLoading: true,
      globalError: null,
    }));

    try {
      const payload = {
        title: form.title.trim(),
        image: form.image,
        ingredients: form.ingredients.filter((ing) => ing.trim()),
        steps: form.steps.filter((step) => step.trim()),
        tags: form.tags,
      };

      if (isEditing && recipeId) {
        await updateRecipe(recipeId, payload);
        addToast('Recette modifiée avec succès!', 'success');
      } else {
        await addRecipe(payload);
        addToast('Recette créée avec succès!', 'success');
      }

      navigate('/');
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Une erreur est survenue';
      addToast(message, 'error');
      setForm((prev) => ({
        ...prev,
        globalError: message,
      }));
    } finally {
      setForm((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-theme-bg">
        <header className="bg-theme-elevated border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="text-2xl font-display font-semibold text-theme-text">
              Meal<span className="italic font-light text-theme-accent">Planner</span>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center text-theme-muted">Chargement...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <header className="bg-theme-elevated border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-display font-semibold text-theme-text">
            Meal<span className="italic font-light text-theme-accent">Planner</span>
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
}
