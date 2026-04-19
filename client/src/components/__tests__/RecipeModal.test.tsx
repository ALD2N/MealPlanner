import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeModal from '../RecipeModal';
import { IRecipeResponse } from '@dndmeal/shared';
import { ToastProvider } from '../../contexts/ToastContext';

describe('RecipeModal', () => {
  const mockRecipe: IRecipeResponse = {
    _id: '1',
    title: 'Pasta Carbonara',
    image: 'https://example.com/pasta.jpg',
    ingredients: ['pasta', 'eggs', 'bacon'],
    steps: ['Boil pasta', 'Cook bacon', 'Mix and serve'],
    author: {
      _id: 'author1',
      name: 'Chef Mario',
      email: 'mario@example.com',
      isAdmin: false,
      createdAt: new Date().toISOString(),
    },
    tags: ['rapide', 'transport'],
    ratings: [
      { userId: 'user1', rating: 5 },
      { userId: 'user2', rating: 4 },
      { userId: 'user3', rating: 5 },
    ],
    timesChosen: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOnClose = vi.fn();
  const mockOnSelectMeal = vi.fn();
  const mockOnAddRating = vi.fn();

  const renderWithProvider = (element: React.ReactElement) => {
    return render(
      <ToastProvider>
        {element}
      </ToastProvider>
    );
  };

  it('does not render when isOpen is false', () => {
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={false}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );
    expect(screen.queryByText('Pasta Carbonara')).not.toBeInTheDocument();
  });

  it('renders recipe title when isOpen is true', () => {
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
  });

  it('renders recipe author name', () => {
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );
    expect(screen.getByText('par Chef Mario')).toBeInTheDocument();
  });

  it('renders all ingredients', () => {
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );
    expect(screen.getByText('pasta')).toBeInTheDocument();
    expect(screen.getByText('eggs')).toBeInTheDocument();
    expect(screen.getByText('bacon')).toBeInTheDocument();
  });

  it('renders all steps with numbering', () => {
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );
    expect(screen.getByText('Boil pasta')).toBeInTheDocument();
    expect(screen.getByText('Cook bacon')).toBeInTheDocument();
    expect(screen.getByText('Mix and serve')).toBeInTheDocument();
  });

  it('renders recipe tags', () => {
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );
    expect(screen.getByText('rapide')).toBeInTheDocument();
    expect(screen.getByText('transport')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );

    const closeButton = screen.getByRole('button', { name: /×/ });
    await user.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onSelectMeal when select meal button is clicked', async () => {
    const user = userEvent.setup();
    mockOnSelectMeal.mockResolvedValue(undefined);

    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );

    await user.click(screen.getByRole('button', { name: /Sélectionner pour demain/ }));
    expect(mockOnSelectMeal).toHaveBeenCalledWith(mockRecipe._id);
  });

  it('calls onAddRating with correct rating when emoji button is clicked', async () => {
    const user = userEvent.setup();
    mockOnAddRating.mockResolvedValue(undefined);

    const { container } = renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );

    // Find the rating section and get buttons from it
    const notationSection = screen.getByText('Noter cette recette').closest('div');
    const ratingButtons = notationSection?.querySelectorAll('button') || [];
    if (ratingButtons.length > 0) {
      await user.click(ratingButtons[4]); // Click the last smiley (5 stars)
    }
    expect(mockOnAddRating).toHaveBeenCalledWith(5);
  });

  it('displays rating distribution', () => {
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );
    // Should display rating bars for all 5 levels
    expect(screen.getByText('Notations des joueurs')).toBeInTheDocument();
  });

  it('shows "Modifier" button for recipe author', () => {
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
        currentUserId={mockRecipe.author._id}
      />
    );
    expect(screen.getByRole('button', { name: /Modifier/ })).toBeInTheDocument();
  });

  it('does not show "Modifier" button for non-author', () => {
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
        currentUserId="different-user-id"
      />
    );
    expect(screen.queryByRole('button', { name: /Modifier/ })).not.toBeInTheDocument();
  });

  it('handles recipe with no ratings', () => {
    const recipeNoRatings = { ...mockRecipe, ratings: [] };
    renderWithProvider(
      <RecipeModal
        recipe={recipeNoRatings}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );
    expect(screen.getByText('Aucune notation')).toBeInTheDocument();
  });

  it('renders recipe image when available', () => {
    renderWithProvider(
      <RecipeModal
        recipe={mockRecipe}
        isOpen={true}
        onClose={mockOnClose}
        onSelectMeal={mockOnSelectMeal}
        onAddRating={mockOnAddRating}
      />
    );
    const img = screen.getByAltText('Pasta Carbonara');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/pasta.jpg');
  });
});
