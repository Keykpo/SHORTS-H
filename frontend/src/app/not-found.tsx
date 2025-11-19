import Link from 'next/link';
import { FiHome } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-white mb-2">
            Página no encontrada
          </h2>
          <p className="text-dark-400">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            <FiHome className="w-5 h-5" />
            <span>Volver al Inicio</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-dark-800 text-white rounded-lg font-semibold hover:bg-dark-700 transition-colors"
          >
            Página Anterior
          </button>
        </div>

        <div className="mt-12">
          <p className="text-dark-500 text-sm mb-4">¿Buscabas algo específico?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/discover"
              className="px-4 py-2 bg-dark-800 text-dark-300 rounded-lg text-sm hover:bg-dark-700 hover:text-white transition-colors"
            >
              Descubrir
            </Link>
            <Link
              href="/trending"
              className="px-4 py-2 bg-dark-800 text-dark-300 rounded-lg text-sm hover:bg-dark-700 hover:text-white transition-colors"
            >
              Tendencias
            </Link>
            <Link
              href="/for-you"
              className="px-4 py-2 bg-dark-800 text-dark-300 rounded-lg text-sm hover:bg-dark-700 hover:text-white transition-colors"
            >
              Para Ti
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
