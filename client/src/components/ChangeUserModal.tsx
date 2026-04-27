import { useState } from 'react';
import { IUserResponse } from '@dndmeal/shared';

export interface ChangeUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
  currentUserId: string;
  users: IUserResponse[];
  isLoading?: boolean;
}

export function ChangeUserModal({
  isOpen,
  onClose,
  onConfirm,
  currentUserId,
  users,
  isLoading = false,
}: ChangeUserModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) {
    return null;
  }

  const canConfirm = selectedUserId !== null && selectedUserId !== currentUserId && !isConfirming;
  const isDisabled = isConfirming || isLoading;

  const handleConfirm = async () => {
    if (!selectedUserId || selectedUserId === currentUserId) return;

    setIsConfirming(true);
    try {
      await onConfirm(selectedUserId);
      onClose();
    } finally {
      setIsConfirming(false);
      setSelectedUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-theme-elevated rounded-lg max-w-md w-full max-h-screen overflow-auto relative">
        <button
          onClick={onClose}
          disabled={isDisabled}
          className="absolute top-4 right-4 text-theme-muted hover:text-theme-text text-2xl font-bold z-10"
        >
          ×
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-display font-semibold text-theme-text mb-6">
            Changer la personne
          </h2>

          <div className="mb-6">
            <label htmlFor="user-select" className="text-sm font-medium text-theme-text mb-3 block">
              Sélectionnez un utilisateur
            </label>
            <select
              id="user-select"
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isDisabled}
              className="w-full px-4 py-2 rounded-lg border border-theme-border bg-theme-bg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent disabled:opacity-50"
            >
              <option value="">-- Sélectionnez --</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDisabled}
              className="flex-1 px-4 py-2 rounded-lg font-medium bg-theme-hover text-theme-text hover:bg-theme-surface disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                canConfirm
                  ? 'bg-theme-accent text-theme-accent-text hover:bg-theme-accent-hover'
                  : 'bg-theme-accent text-theme-accent-text opacity-50 cursor-not-allowed'
              }`}
            >
              {isConfirming ? 'Changement...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
