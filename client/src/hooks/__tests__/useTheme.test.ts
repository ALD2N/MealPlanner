import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useTheme } from '../useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to light theme when localStorage is empty', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('reads saved theme from localStorage', () => {
    localStorage.setItem('dndmeal-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggles from light to dark and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('dndmeal-theme')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggles back from dark to light', () => {
    localStorage.setItem('dndmeal-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('dndmeal-theme')).toBe('light');
  });
});
