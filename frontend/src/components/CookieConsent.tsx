'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import Link from 'next/link';

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    setShow(false);
  };

  const acceptSelected = () => {
    const selected = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(selected));
    setShow(false);
  };

  const rejectAll = () => {
    const rejected = {
      necessary: true, // Necessary cookies cannot be rejected
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(rejected));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-dark-800 rounded-lg max-w-2xl w-full p-6 shadow-2xl border border-dark-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">🍪 Uso de Cookies</h3>
            <p className="text-dark-300 text-sm">
              Utilizamos cookies y tecnologías similares para mejorar tu experiencia, analizar el tráfico del sitio, y personalizar contenido.
            </p>
          </div>
          <button
            onClick={rejectAll}
            className="text-dark-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Cookie Categories */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between py-2 border-b border-dark-700">
            <div className="flex-1">
              <p className="text-white font-medium">Cookies Necesarias</p>
              <p className="text-dark-400 text-xs">Requeridas para el funcionamiento básico del sitio</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-400">Siempre activas</span>
              <div className="w-10 h-6 bg-primary-600 rounded-full flex items-center justify-end px-1">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-dark-700">
            <div className="flex-1">
              <p className="text-white font-medium">Cookies Funcionales</p>
              <p className="text-dark-400 text-xs">Mejoran la funcionalidad y personalización</p>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, functional: !prev.functional }))}
              className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                preferences.functional ? 'bg-primary-600 justify-end' : 'bg-dark-600 justify-start'
              } px-1`}
            >
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-dark-700">
            <div className="flex-1">
              <p className="text-white font-medium">Cookies de Análisis</p>
              <p className="text-dark-400 text-xs">Nos ayudan a entender cómo usas el sitio</p>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
              className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                preferences.analytics ? 'bg-primary-600 justify-end' : 'bg-dark-600 justify-start'
              } px-1`}
            >
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <p className="text-white font-medium">Cookies de Marketing</p>
              <p className="text-dark-400 text-xs">Personalizan anuncios y contenido patrocinado</p>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, marketing: !prev.marketing }))}
              className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                preferences.marketing ? 'bg-primary-600 justify-end' : 'bg-dark-600 justify-start'
              } px-1`}
            >
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={acceptAll}
            className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <FiCheck /> Aceptar Todo
          </button>
          <button
            onClick={acceptSelected}
            className="flex-1 px-4 py-3 bg-dark-700 text-white rounded-lg font-semibold hover:bg-dark-600 transition-colors"
          >
            Guardar Preferencias
          </button>
          <button
            onClick={rejectAll}
            className="px-4 py-3 text-dark-300 hover:text-white transition-colors"
          >
            Rechazar Todo
          </button>
        </div>

        <p className="text-dark-400 text-xs mt-4 text-center">
          Al continuar navegando, aceptas nuestras{' '}
          <Link href="/privacy" className="text-primary-500 hover:underline">
            Políticas de Privacidad
          </Link>{' '}
          y{' '}
          <Link href="/terms" className="text-primary-500 hover:underline">
            Términos de Servicio
          </Link>
        </p>
      </div>
    </div>
  );
}
