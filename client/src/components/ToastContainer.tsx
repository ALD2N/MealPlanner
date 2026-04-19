import React from 'react';
import { useToast, ToastType } from '../contexts/ToastContext';

function getIcon(type: ToastType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return '○';
  }
}

function getColorClasses(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'border-l-green-500 text-green-700';
    case 'error':
      return 'border-l-red-500 text-red-700';
    case 'warning':
      return 'border-l-yellow-500 text-yellow-700';
    case 'info':
      return 'border-l-blue-500 text-blue-700';
    default:
      return 'border-l-gray-500 text-gray-700';
  }
}

function getIconColorClasses(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'info':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-50 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            bg-white border-l-4 rounded-lg shadow-lg p-4 mb-3
            animate-slideInRight pointer-events-auto
            ${getColorClasses(toast.type)}
          `}
          role="alert"
          aria-label={`${toast.type}: ${toast.message}`}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex gap-3 items-start flex-1">
              <span className={`text-lg font-bold flex-shrink-0 ${getIconColorClasses(toast.type)}`}>
                {getIcon(toast.type)}
              </span>
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0 text-xl leading-none"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
