import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterPills from '../FilterPills';

describe('FilterPills', () => {
  const filters = [
    { id: 'vege', label: '🌿 Végétarien' },
    { id: 'rapide', label: '⚡ Rapide' },
    { id: 'sain', label: '💪 Sain' },
  ];

  it('renders all filter pills', () => {
    render(
      <FilterPills
        filters={filters}
        activeFilters={[]}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText(/Végétarien/)).toBeInTheDocument();
    expect(screen.getByText(/Rapide/)).toBeInTheDocument();
    expect(screen.getByText(/Sain/)).toBeInTheDocument();
  });

  it('shows × symbol on active filters', () => {
    const { container } = render(
      <FilterPills
        filters={filters}
        activeFilters={['vege']}
        onToggle={() => {}}
      />
    );
    const buttons = Array.from(container.querySelectorAll('button'));
    const vegeButton = buttons.find(btn => btn.textContent?.includes('Végétarien'));
    expect(vegeButton?.textContent).toContain('×');
  });

  it('does not show × symbol on inactive filters', () => {
    const { container } = render(
      <FilterPills
        filters={filters}
        activeFilters={['vege']}
        onToggle={() => {}}
      />
    );
    const buttons = Array.from(container.querySelectorAll('button'));
    const rapideButton = buttons.find(btn => btn.textContent?.includes('Rapide'));
    expect(rapideButton?.textContent).not.toContain('×');
  });

  it('calls onToggle with correct filter id when inactive filter is clicked', async () => {
    const handleToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterPills
        filters={filters}
        activeFilters={[]}
        onToggle={handleToggle}
      />
    );

    await user.click(screen.getByText(/Végétarien/));
    expect(handleToggle).toHaveBeenCalledWith('vege');
  });

  it('calls onToggle with correct filter id when active filter is clicked', async () => {
    const handleToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterPills
        filters={filters}
        activeFilters={['vege']}
        onToggle={handleToggle}
      />
    );

    await user.click(screen.getByText(/Végétarien/));
    expect(handleToggle).toHaveBeenCalledWith('vege');
  });

  it('applies amber-600 background to active filters', () => {
    const { container } = render(
      <FilterPills
        filters={filters}
        activeFilters={['vege']}
        onToggle={() => {}}
      />
    );
    const buttons = container.querySelectorAll('button');
    const vegeButton = Array.from(buttons).find(btn => btn.textContent?.includes('Végétarien'));
    expect(vegeButton).toHaveClass('bg-amber-600', 'text-white');
  });

  it('applies border styles to inactive filters', () => {
    const { container } = render(
      <FilterPills
        filters={filters}
        activeFilters={['vege']}
        onToggle={() => {}}
      />
    );
    const buttons = container.querySelectorAll('button');
    const rapideButton = Array.from(buttons).find(btn => btn.textContent?.includes('Rapide'));
    expect(rapideButton).toHaveClass('bg-white', 'border', 'border-gray-300');
  });

  it('handles multiple active filters', () => {
    const { container } = render(
      <FilterPills
        filters={filters}
        activeFilters={['vege', 'rapide']}
        onToggle={() => {}}
      />
    );
    const buttons = Array.from(container.querySelectorAll('button'));
    const vegeButton = buttons.find(btn => btn.textContent?.includes('Végétarien'));
    const rapideButton = buttons.find(btn => btn.textContent?.includes('Rapide'));

    expect(vegeButton?.textContent).toContain('×');
    expect(rapideButton?.textContent).toContain('×');
  });

  it('renders empty when filters list is empty', () => {
    const { container } = render(
      <FilterPills
        filters={[]}
        activeFilters={[]}
        onToggle={() => {}}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});
