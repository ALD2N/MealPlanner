import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../hooks/useAuth';
import { ToastProvider } from '../../contexts/ToastContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import AdminPage from '../AdminPage';

describe('AdminPage', () => {
  const renderWithProviders = (element: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {element}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('displays admin title', () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByText(/Gestion des invitations/)).toBeInTheDocument();
  });

  it('shows generate button', () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByRole('button', { name: /Générer/ })).toBeInTheDocument();
  });

  it('displays invite links list', () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByText(/Liens d'invitation/)).toBeInTheDocument();
  });
});
