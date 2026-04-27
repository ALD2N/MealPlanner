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
            Meal<span className="italic font-light text-theme-accent">Planner</span>
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
