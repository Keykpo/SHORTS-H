'use client';

import { Component, ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component to catch React errors
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to monitoring service (Sentry, etc.)
    console.error('Error Boundary caught an error:', error, errorInfo);

    // You can also log to an external service here
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-dark-800 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-600 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Algo salió mal
            </h2>
            <p className="text-dark-400 mb-6">
              Lo sentimos, ocurrió un error inesperado. Por favor intenta recargar la página.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Recargar Página
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-3 bg-dark-700 text-white rounded-lg font-semibold hover:bg-dark-600 transition-colors"
              >
                Volver
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-dark-400 text-sm cursor-pointer mb-2">
                  Detalles del error (dev only)
                </summary>
                <pre className="text-xs text-red-400 bg-dark-900 p-3 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Smaller error boundary for individual components
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-dark-800 rounded-lg border border-dark-700">
          <div className="flex items-center gap-3 mb-2">
            <FiAlertTriangle className="w-5 h-5 text-yellow-500" />
            <p className="text-white font-semibold">Error al cargar componente</p>
          </div>
          <p className="text-dark-400 text-sm">
            Este componente no pudo cargarse correctamente.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
