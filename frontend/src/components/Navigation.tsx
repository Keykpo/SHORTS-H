'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { FiHome, FiCompass, FiUser, FiTrendingUp, FiList, FiLogIn, FiLogOut } from 'react-icons/fi';
import AuthModal from './AuthModal';

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Bottom Navigation Bar (Mobile) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900 border-t border-dark-700 md:hidden"
        role="navigation"
        aria-label="Navegación principal móvil"
      >
        <div className="flex justify-around items-center h-16">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-dark-400 hover:text-primary-500 transition-colors"
            aria-label="Ir a inicio"
          >
            <FiHome className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs">Inicio</span>
          </Link>

          <Link
            href="/discover"
            className="flex flex-col items-center gap-1 text-dark-400 hover:text-primary-500 transition-colors"
            aria-label="Descubrir videos"
          >
            <FiCompass className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs">Descubrir</span>
          </Link>

          <Link
            href="/trending"
            className="flex flex-col items-center gap-1 text-dark-400 hover:text-primary-500 transition-colors"
            aria-label="Ver tendencias"
          >
            <FiTrendingUp className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs">Tendencias</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/playlists"
                className="flex flex-col items-center gap-1 text-dark-400 hover:text-primary-500 transition-colors"
                aria-label="Mis listas de reproducción"
              >
                <FiList className="w-6 h-6" aria-hidden="true" />
                <span className="text-xs">Listas</span>
              </Link>

              <Link
                href={`/profile/${user?.username}`}
                className="flex flex-col items-center gap-1 text-dark-400 hover:text-primary-500 transition-colors"
                aria-label={`Ver perfil de ${user?.username}`}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-6 h-6 rounded-full"
                    aria-hidden="true"
                  />
                ) : (
                  <FiUser className="w-6 h-6" aria-hidden="true" />
                )}
                <span className="text-xs">Perfil</span>
              </Link>
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex flex-col items-center gap-1 text-dark-400 hover:text-primary-500 transition-colors"
              aria-label="Iniciar sesión"
            >
              <FiLogIn className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs">Entrar</span>
            </button>
          )}
        </div>
      </nav>

      {/* Sidebar Navigation (Desktop) */}
      <nav
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-dark-900 border-r border-dark-700 flex-col z-40"
        role="navigation"
        aria-label="Navegación principal"
      >
        <div className="p-6">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="AnimeShorts - Ir a inicio"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-bold text-xl">AS</span>
            </div>
            <span className="text-white font-bold text-xl">AnimeShorts</span>
          </Link>
        </div>

        <div className="flex-1 px-3 space-y-1" role="menu">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            role="menuitem"
            aria-label="Ir a inicio"
          >
            <FiHome className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">Inicio</span>
          </Link>

          <Link
            href="/discover"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            role="menuitem"
            aria-label="Descubrir videos"
          >
            <FiCompass className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">Descubrir</span>
          </Link>

          <Link
            href="/trending"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            role="menuitem"
            aria-label="Ver tendencias"
          >
            <FiTrendingUp className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">Tendencias</span>
          </Link>

          {isAuthenticated && (
            <>
              <div className="border-t border-dark-700 my-3" role="separator" aria-hidden="true"></div>

              <Link
                href="/playlists"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                role="menuitem"
                aria-label="Mis listas de reproducción"
              >
                <FiList className="w-5 h-5" aria-hidden="true" />
                <span className="font-medium">Mis Listas</span>
              </Link>

              <Link
                href="/watch-history"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                role="menuitem"
                aria-label="Historial de reproducción"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Historial</span>
              </Link>

              <Link
                href="/for-you"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                role="menuitem"
                aria-label="Recomendaciones para ti"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="font-medium">Para Ti</span>
              </Link>

              <Link
                href="/analytics"
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                role="menuitem"
                aria-label="Ver analytics"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="font-medium">Analytics</span>
              </Link>
            </>
          )}
        </div>

        <div className="p-3 border-t border-dark-700">
          {isAuthenticated ? (
            <div className="space-y-3">
              <Link
                href={`/profile/${user?.username}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={`Ver perfil de ${user?.username}`}
              >
                <img
                  src={user?.avatarUrl || '/default-avatar.png'}
                  alt=""
                  className="w-10 h-10 rounded-full"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user?.displayName || user?.username}</p>
                  <p className="text-dark-400 text-sm truncate">@{user?.username}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Cerrar sesión"
              >
                <FiLogOut className="w-5 h-5" aria-hidden="true" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Iniciar sesión"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
