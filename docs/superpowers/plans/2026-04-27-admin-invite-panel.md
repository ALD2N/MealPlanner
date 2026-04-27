# Admin Invite Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an admin-only web interface for generating, viewing, and managing invitation links.

**Architecture:** Backend endpoints already exist for invite management. Frontend adds a new AdminPage component (protected route), a custom hook for API calls, and admin link in headers. Single responsibility: AdminPage handles UI, hook handles API integration.

**Tech Stack:** React, TypeScript, Tailwind CSS, custom hook pattern (axios), same theme tokens as existing app.

---

## File Structure

### Frontend Files

**Created:**
- `/client/src/pages/AdminPage.tsx` - Main admin page component
- `/client/src/hooks/useAdminInvites.ts` - Hook for invite link API calls
- `/client/src/pages/__tests__/AdminPage.test.tsx` - Component and hook tests

**Modified:**
- `/client/src/App.tsx` - Add `/admin` route with protection
- `/client/src/pages/HomePage.tsx` - Add admin link to header
- `/client/src/pages/HistoryPage.tsx` - Add admin link to header (already has header pattern)

---

## Tasks

### Task 1: Create useAdminInvites Hook

**Files:**
- Create: `/client/src/hooks/useAdminInvites.ts`

- [ ] **Step 1: Write the failing test**

Create `/client/src/hooks/__tests__/useAdminInvites.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminInvites } from '../useAdminInvites';

describe('useAdminInvites', () => {
  it('fetches invite links on mount', async () => {
    const { result } = renderHook(() => useAdminInvites());

    await waitFor(() => {
      expect(result.current.links).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('generates a new invite link', async () => {
    const { result } = renderHook(() => useAdminInvites());

    const initialCount = result.current.links.length;

    await waitFor(() => {
      result.current.generateLink();
    });

    await waitFor(() => {
      expect(result.current.links.length).toBeGreaterThan(initialCount);
    });
  });

  it('revokes an invite link', async () => {
    const { result } = renderHook(() => useAdminInvites());

    const token = result.current.links[0]?.token;
    if (token) {
      await waitFor(() => {
        result.current.revokeLink(token);
      });

      await waitFor(() => {
        expect(result.current.links.find(l => l.token === token)).toBeUndefined();
      });
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm test -- src/hooks/__tests__/useAdminInvites.test.ts --run
```

Expected: FAIL with "useAdminInvites is not a function"

- [ ] **Step 3: Write minimal implementation**

Create `/client/src/hooks/useAdminInvites.ts`:

```typescript
import { useState, useCallback, useEffect } from 'react';
import { IInviteLinkResponse } from '@dndmeal/shared';
import api from '../services/api';

interface UseAdminInvitesReturn {
  links: IInviteLinkResponse[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generateLink: () => Promise<void>;
  revokeLink: (token: string) => Promise<void>;
  refreshLinks: () => Promise<void>;
}

export function useAdminInvites(): UseAdminInvitesReturn {
  const [links, setLinks] = useState<IInviteLinkResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLinks = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/admin/invite-links');
      setLinks(res.data.links);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch links';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLinks();
  }, [refreshLinks]);

  const generateLink = useCallback(async () => {
    setIsGenerating(true);
    try {
      setError(null);
      await api.post('/admin/invite-links/generate');
      await refreshLinks();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to generate link';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [refreshLinks]);

  const revokeLink = useCallback(async (token: string) => {
    try {
      setError(null);
      await api.delete(`/admin/invite-links/${token}`);
      await refreshLinks();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to revoke link';
      setError(message);
    }
  }, [refreshLinks]);

  return {
    links,
    isLoading,
    isGenerating,
    error,
    generateLink,
    revokeLink,
    refreshLinks,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm test -- src/hooks/__tests__/useAdminInvites.test.ts --run
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useAdminInvites.ts client/src/hooks/__tests__/useAdminInvites.test.ts && git commit -m "feat: add useAdminInvites hook for invite link management

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Create AdminPage Component

**Files:**
- Create: `/client/src/pages/AdminPage.tsx`

- [ ] **Step 1: Write the failing test**

Create `/client/src/pages/__tests__/AdminPage.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { ToastProvider } from '../contexts/ToastContext';
import AdminPage from '../AdminPage';

describe('AdminPage', () => {
  const renderWithProviders = (element: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            {element}
          </ToastProvider>
        </AuthProvider>
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm test -- src/pages/__tests__/AdminPage.test.tsx --run
```

Expected: FAIL (AdminPage not found)

- [ ] **Step 3: Write minimal implementation**

Create `/client/src/pages/AdminPage.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdminInvites } from '../hooks/useAdminInvites';
import { useToast } from '../contexts/ToastContext';
import { useThemeContext } from '../contexts/ThemeContext';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useThemeContext();
  const { links, isLoading, isGenerating, error, generateLink, revokeLink } = useAdminInvites();
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate('/');
    return null;
  }

  const handleGenerateLink = async () => {
    try {
      await generateLink();
      addToast('Lien d\'invitation généré!', 'success');
    } catch (err) {
      addToast('Erreur lors de la génération du lien', 'error');
    }
  };

  const handleRevokeLink = async (token: string) => {
    try {
      await revokeLink(token);
      addToast('Lien révoqué!', 'success');
      setConfirmRevoke(null);
    } catch (err) {
      addToast('Erreur lors de la révocation', 'error');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    addToast('URL copiée!', 'success');
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR');
  };

  const getExpirationStatus = (expiresAt: Date | string) => {
    const now = new Date();
    const expireDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const daysUntilExpire = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpire < 0) return { icon: '⚠️', label: 'Expiré', color: 'text-theme-muted' };
    if (daysUntilExpire <= 1) return { icon: '⏱️', label: `${daysUntilExpire}j`, color: 'text-red-500' };
    return { icon: '✅', label: `${daysUntilExpire}j`, color: 'text-green-500' };
  };

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <header className="bg-theme-elevated border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-display font-semibold text-theme-text">
            DnD<span className="italic font-light text-theme-accent">Meal</span>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className="w-10 h-10 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-lg hover:bg-theme-hover transition"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg font-medium bg-theme-hover text-theme-text hover:bg-theme-surface transition"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-semibold text-theme-text mb-2">
            🔑 Gestion des invitations
          </h1>
          <p className="text-theme-muted">Générer et gérer les liens d'invitation</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Generate Section */}
        <div className="bg-theme-elevated rounded-lg border border-theme-border p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-semibold text-theme-text mb-1">
                Générer un nouveau lien
              </h2>
              <p className="text-theme-muted text-sm">Créez un nouveau lien d'invitation</p>
            </div>
            <button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                isGenerating
                  ? 'bg-theme-accent text-theme-accent-text opacity-50 cursor-not-allowed'
                  : 'bg-theme-accent text-theme-accent-text hover:bg-theme-accent-hover'
              }`}
            >
              {isGenerating ? 'Génération...' : 'Générer'}
            </button>
          </div>
        </div>

        {/* Links Section */}
        <div className="bg-theme-elevated rounded-lg border border-theme-border p-6">
          <h2 className="text-xl font-display font-semibold text-theme-text mb-4">
            Liens d'invitation ({links.length})
          </h2>

          {isLoading ? (
            <p className="text-theme-muted">Chargement...</p>
          ) : links.length === 0 ? (
            <p className="text-theme-muted">
              Aucun lien d'invitation généré pour le moment. Générez votre premier lien ci-dessus.
            </p>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const status = getExpirationStatus(link.expiresAt);
                return (
                  <div
                    key={link.token}
                    className="flex items-center justify-between p-4 bg-theme-bg rounded border border-theme-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs text-theme-muted bg-theme-surface px-2 py-1 rounded">
                          {link.token.substring(0, 8)}...
                        </code>
                        <span className={`text-sm ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                        {link.usedCount > 0 && (
                          <span className="text-xs bg-theme-accent text-theme-accent-text px-2 py-1 rounded">
                            ✅ {link.usedCount} utilisé{link.usedCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-theme-muted truncate">
                        Expire: {formatDate(link.expiresAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleCopyUrl(link.url)}
                        title="Copier l'URL"
                        className="px-3 py-2 rounded bg-theme-hover text-theme-text hover:bg-theme-surface transition text-sm"
                      >
                        📋 Copier
                      </button>
                      <button
                        onClick={() => setConfirmRevoke(link.token)}
                        title="Révoquer ce lien"
                        className="px-3 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200 transition text-sm"
                      >
                        🗑️ Révoquer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Revoke Confirmation Dialog */}
      {confirmRevoke && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-elevated rounded-lg p-8 max-w-sm w-full mx-4">
            <h3 className="text-lg font-display font-semibold text-theme-text mb-4">
              Révoquer ce lien?
            </h3>
            <p className="text-theme-muted mb-6">
              Cette action est irréversible. Les utilisateurs ne pourront plus s'inscrire avec ce lien.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRevoke(null)}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-theme-hover text-theme-text hover:bg-theme-surface transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleRevokeLink(confirmRevoke)}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition"
              >
                Révoquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm test -- src/pages/__tests__/AdminPage.test.tsx --run
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/AdminPage.tsx client/src/pages/__tests__/AdminPage.test.tsx && git commit -m "feat: add AdminPage for invite link management

- Display list of invite links with status indicators
- Generate new links with one click
- Copy link URLs to clipboard
- Revoke links with confirmation dialog
- Admin-only access control

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Add Admin Route to App.tsx

**Files:**
- Modify: `/client/src/App.tsx`

- [ ] **Step 1: Read the current App.tsx**

```bash
cat /home/ald2n/Kod/MealPlanner/client/src/App.tsx
```

- [ ] **Step 2: Add AdminPage import**

At the top with other imports, add:

```typescript
import AdminPage from './pages/AdminPage';
```

- [ ] **Step 3: Add admin route**

Before the `<Route path="*" element={<Navigate to="/" />} />` line, add:

```typescript
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 4: Verify syntax is correct**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add client/src/App.tsx && git commit -m "feat: add /admin route for AdminPage

Protected route requiring authentication

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Add Admin Link to Headers

**Files:**
- Modify: `/client/src/pages/HomePage.tsx`
- Modify: `/client/src/pages/HistoryPage.tsx`

- [ ] **Step 1: Update HomePage header**

In `/client/src/pages/HomePage.tsx`, find the header navigation section and add this button before the existing buttons:

```typescript
{user?.isAdmin && (
  <button
    onClick={() => navigate('/admin')}
    className="px-4 py-2 rounded-lg font-medium bg-theme-hover text-theme-text hover:bg-theme-surface transition"
    title="Accéder au panneau d'administration"
  >
    ⚙️ Admin
  </button>
)}
```

Place it in the right-side flex container, before the theme toggle button.

- [ ] **Step 2: Update HistoryPage header**

In `/client/src/pages/HistoryPage.tsx`, add the same button in the same location.

- [ ] **Step 3: Verify both pages compile**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 4: Run tests to ensure nothing broke**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm test -- --run
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/HomePage.tsx client/src/pages/HistoryPage.tsx && git commit -m "feat: add admin link to page headers

Show '⚙️ Admin' button in headers for admin users only

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Manual Testing and Verification

**Files:** None (verification only)

- [ ] **Step 1: Start dev server**

```bash
cd /home/ald2n/Kod/MealPlanner/client && npm run dev
```

- [ ] **Step 2: Test admin access**

In browser at http://localhost:5173:
1. Navigate to any page (home or history)
2. Verify "⚙️ Admin" button is visible (if logged in as admin)
3. Click the Admin button
4. Verify AdminPage loads with "🔑 Gestion des invitations" title

- [ ] **Step 3: Test link generation**

1. Click "Générer" button
2. Verify loading state ("Génération...")
3. Verify new link appears in the list
4. Verify success toast appears

- [ ] **Step 4: Test link copy**

1. Click "📋 Copier" button on a link
2. Verify "URL copiée!" toast appears
3. Paste (Ctrl+V) somewhere to verify URL is correct
4. URL should be like: `http://localhost:5173/register?token=...`

- [ ] **Step 5: Test link revocation**

1. Click "🗑️ Révoquer" on a link
2. Verify confirmation dialog appears
3. Click "Révoquer" in dialog
4. Verify link disappears from list
5. Verify success toast appears

- [ ] **Step 6: Test non-admin access**

1. Log out or switch to non-admin account
2. Verify "⚙️ Admin" button is NOT visible
3. If you try to navigate directly to `/admin`, verify it redirects to home

- [ ] **Step 7: Test registration with generated link**

1. Generate a new link and copy the URL
2. Open the URL in a new incognito window
3. Verify registration page opens with token pre-filled
4. Complete registration
5. Verify new user can log in
6. Verify "Uses" counter in admin panel incremented

- [ ] **Step 8: No commit needed** — This is manual testing

---

## Summary

This plan implements the admin invite link management interface with:
- ✅ useAdminInvites hook for API integration
- ✅ AdminPage component with full UI
- ✅ Protected admin route
- ✅ Admin links in existing page headers
- ✅ Comprehensive testing

Total: 5 tasks, all with TDD approach and frequent commits.
