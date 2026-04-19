import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast, Toast } from '../ToastContext';

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function TestComponent() {
    const { addToast, toasts, removeToast } = useToast();
    return (
      <div>
        <button onClick={() => addToast('Test message', 'success')}>Add Success Toast</button>
        <button onClick={() => addToast('Error message', 'error')}>Add Error Toast</button>
        <button onClick={() => addToast('Warning', 'warning', 2000)}>Add Warning Toast</button>
        <button onClick={() => addToast('Persistent', 'info', 0)}>Add Persistent Toast</button>
        <div data-testid="toast-count">{toasts.length}</div>
        <div data-testid="toasts-list">
          {toasts.map((toast) => (
            <div key={toast.id} data-testid={`toast-${toast.id}`}>
              {toast.message} - {toast.type}
              <button onClick={() => removeToast(toast.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  it('provides useToast hook via context', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    expect(screen.getByTestId('toast-count')).toBeInTheDocument();
  });

  it('throws error when useToast is used outside ToastProvider', () => {
    function BadComponent() {
      useToast();
      return null;
    }

    // Suppress error logs for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<BadComponent />);
    }).toThrow('useToast must be used within a ToastProvider');

    spy.mockRestore();
  });

  it('adds a toast when addToast is called', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    await user.click(screen.getByRole('button', { name: 'Add Success Toast' }));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
  });

  it('adds toast with correct type', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Add Error Toast' }));
    expect(screen.getByText(/Error message - error/)).toBeInTheDocument();
  });

  it('adds multiple toasts', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Add Success Toast' }));
    await user.click(screen.getByRole('button', { name: 'Add Error Toast' }));

    expect(screen.getByTestId('toast-count')).toHaveTextContent('2');
  });

  it('removes a toast after duration expires', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Add Warning Toast' }));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    vi.advanceTimersByTime(2100);
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('removes toast when removeToast is called manually', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Add Success Toast' }));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    const removeButton = screen.getAllByRole('button', { name: 'Remove' })[0];
    await user.click(removeButton);

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('does not remove persistent toast (duration 0) automatically', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Add Persistent Toast' }));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    vi.advanceTimersByTime(10000);
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
  });

  it('uses default duration of 4000ms', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Add Success Toast' }));
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    vi.advanceTimersByTime(3999);
    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    vi.advanceTimersByTime(1);
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('gives each toast a unique id', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Add Success Toast' }));
    await user.click(screen.getByRole('button', { name: 'Add Success Toast' }));

    const toastCount = screen.getByTestId('toast-count');
    expect(toastCount).toHaveTextContent('2');

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    expect(removeButtons.length).toBe(2);
  });
});
