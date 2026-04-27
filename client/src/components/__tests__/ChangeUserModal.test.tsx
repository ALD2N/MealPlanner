import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangeUserModal } from '../ChangeUserModal';
import { IUserResponse } from '@dndmeal/shared';

describe('ChangeUserModal', () => {
  const mockUsers: IUserResponse[] = [
    { _id: 'user1', name: 'Alice', email: 'alice@example.com', isAdmin: false, createdAt: new Date() },
    { _id: 'user2', name: 'Bob', email: 'bob@example.com', isAdmin: false, createdAt: new Date() },
  ];

  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  it('renders user list when open', () => {
    render(
      <ChangeUserModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentUserId="user1"
        users={mockUsers}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <ChangeUserModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentUserId="user1"
        users={mockUsers}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onConfirm with selected userId', async () => {
    const user = userEvent.setup();
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <ChangeUserModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentUserId="user1"
        users={mockUsers}
      />
    );

    const select = screen.getByLabelText('Sélectionnez un utilisateur') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'user2' } });

    const confirmButton = screen.getByRole('button', { name: /Confirmer/ });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith('user2');
  });

  it('disables confirm when same user selected', () => {
    render(
      <ChangeUserModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        currentUserId="user1"
        users={mockUsers}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirmer/ });
    expect(confirmButton).toBeDisabled();
  });
});
