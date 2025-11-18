'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AgeGate() {
  const [isVisible, setIsVisible] = useState(false);
  const { user, ageGateShown, setAgeGateShown } = useAuthStore();

  useEffect(() => {
    // Show age gate if:
    // 1. User is not logged in OR not age verified
    // 2. Age gate hasn't been shown this session
    // 3. No localStorage flag set
    const hasSeenAgeGate = localStorage.getItem('ageGateShown');

    if (!hasSeenAgeGate && !ageGateShown) {
      // If not logged in, or logged in but not age verified
      if (!user || !user.isAgeVerified) {
        setIsVisible(true);
      }
    }
  }, [user, ageGateShown]);

  const handleConfirm = () => {
    setAgeGateShown(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Redirect to a safe page or show alternative content
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95">
      <div className="max-w-md w-full mx-4 bg-dark-800 rounded-lg shadow-2xl p-8 border border-primary-600">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
            <svg
              className="h-10 w-10 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            Contenido para Adultos
          </h2>

          {/* Message */}
          <div className="text-dark-300 mb-6 space-y-3">
            <p>
              Este sitio web contiene material exclusivamente para adultos (+18).
            </p>
            <p className="font-semibold text-primary-400">
              Al continuar, confirmas que:
            </p>
            <ul className="text-left space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                <span>Tienes al menos 18 años de edad</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                <span>Aceptas ver contenido de naturaleza sexual explícita</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                <span>No te ofende el contenido para adultos</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-500 mr-2">•</span>
                <span>Es legal ver este contenido en tu jurisdicción</span>
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleDecline}
              className="flex-1 px-6 py-3 bg-dark-600 text-white rounded-lg hover:bg-dark-700 transition-colors font-semibold"
            >
              Soy menor de 18
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Tengo 18+ años
            </button>
          </div>

          {/* Footer */}
          <p className="text-xs text-dark-400 mt-6">
            Al ingresar, aceptas nuestros{' '}
            <a href="/terms" className="text-primary-400 hover:underline">
              Términos de Servicio
            </a>{' '}
            y{' '}
            <a href="/privacy" className="text-primary-400 hover:underline">
              Política de Privacidad
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
