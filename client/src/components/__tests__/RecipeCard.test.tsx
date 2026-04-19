import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeCard from '../RecipeCard';
import { IRecipeResponse } from '@dndmeal/shared';

describe('RecipeCard', () => {
  const mockRecipe: IRecipeResponse = {
    _id: '1',
    title: 'Pasta Carbonara',
    image: 'https://example.com/pasta.jpg',
    ingredients: ['pasta', 'eggs', 'bacon'],
    steps: ['Boil pasta', 'Cook bacon', 'Mix and serve'],
    author: { _id: 'author1', name: 'Chef Mario', email: 'mario@example.com', isAdmin: false, createdAt: new Date().toISOString() },
    tags: ['rapide', 'transport'],
    ratings: [
      { userId: 'user1', rating: 5 },
      { userId: 'user2', rating: 5 },
    ],
    timesChosen: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders recipe title', () => {
    render(<RecipeCard recipe={mockRecipe} isNextMeal={false} onClick={() => {}} />);
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(<RecipeCard recipe={mockRecipe} isNextMeal={false} onClick={() => {}} />);
    expect(screen.getByText('par Chef Mario')).toBeInTheDocument();
  });

  it('displays times chosen', () => {
    render(<RecipeCard recipe={mockRecipe} isNextMeal={false} onClick={() => {}} />);
    expect(screen.getByText(/3×/)).toBeInTheDocument();
  });

  it('shows "Ce soir" badge when isNextMeal is true', () => {
    render(<RecipeCard recipe={mockRecipe} isNextMeal={true} onClick={() => {}} />);
    expect(screen.getByText(/Ce soir/)).toBeInTheDocument();
  });

  it('does not show "Ce soir" badge when isNextMeal is false', () => {
    render(<RecipeCard recipe={mockRecipe} isNextMeal={false} onClick={() => {}} />);
    expect(screen.queryByText(/Ce soir/)).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<RecipeCard recipe={mockRecipe} isNextMeal={false} onClick={handleClick} />);

    await user.click(screen.getByText('Pasta Carbonara'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('displays ingredient count', () => {
    render(<RecipeCard recipe={mockRecipe} isNextMeal={false} onClick={() => {}} />);
    expect(screen.getByText('3 ingrédients')).toBeInTheDocument();
  });

  it('displays steps count', () => {
    render(<RecipeCard recipe={mockRecipe} isNextMeal={false} onClick={() => {}} />);
    expect(screen.getByText('3 étapes')).toBeInTheDocument();
  });

  it('displays average rating emoji', () => {
    render(<RecipeCard recipe={mockRecipe} isNextMeal={false} onClick={() => {}} />);
    // ratings: 5, 4 -> avg 4.5 -> dominant 4 -> emoji 😄
    expect(screen.getByText(/avis/)).toBeInTheDocument();
    const statsSpan = screen.getByText(/avis/).parentElement;
    expect(statsSpan?.textContent).toContain('😄');
  });

  it('displays rating count', () => {
    render(<RecipeCard recipe={mockRecipe} isNextMeal={false} onClick={() => {}} />);
    expect(screen.getByText('2 avis')).toBeInTheDocument();
  });

  it('renders without ratings', () => {
    const recipeNoRatings = { ...mockRecipe, ratings: [] };
    render(<RecipeCard recipe={recipeNoRatings} isNextMeal={false} onClick={() => {}} />);
    expect(screen.queryByText(/avis/)).not.toBeInTheDocument();
    expect(screen.getByText(/3×/)).toBeInTheDocument();
  });

  it('renders without image', () => {
    const recipeNoImage = { ...mockRecipe, image: undefined };
    render(<RecipeCard recipe={recipeNoImage} isNextMeal={false} onClick={() => {}} />);
    expect(screen.getByText('[photo recette]')).toBeInTheDocument();
  });

  it('renders without ingredients', () => {
    const recipeNoIngredients = { ...mockRecipe, ingredients: [] };
    render(<RecipeCard recipe={recipeNoIngredients} isNextMeal={false} onClick={() => {}} />);
    expect(screen.queryByText(/ingrédients/)).not.toBeInTheDocument();
  });
});
