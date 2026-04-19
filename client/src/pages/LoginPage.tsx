import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, register, error, isLoading } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const inviteToken = searchParams.get('token');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      addToast('Bienvenue!', 'success');
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erreur lors de la connexion';
      addToast(message, 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, name, inviteToken || undefined);
      addToast('Compte créé! Bienvenue!', 'success');
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erreur lors de l\'inscription';
      addToast(message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
      {/* Main card */}
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-gray-900">
            DnD<span className="italic text-amber-600">Meal</span>
          </div>
          <p className="text-gray-500 mt-2">Le carnet de recettes partagé</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 px-4 rounded font-medium transition ${
              tab === 'login'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Se connecter
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 px-4 rounded font-medium transition ${
              tab === 'register'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            S'inscrire
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Forms */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-600"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marie, Thomas..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-600"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            {inviteToken && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">
                ✓ Lien d'invitation valide
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 text-white py-2 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {isLoading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
