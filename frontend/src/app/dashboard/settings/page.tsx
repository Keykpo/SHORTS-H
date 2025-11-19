'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { FiDownload, FiTrash2, FiShield, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportData = async () => {
    try {
      // In production, this would call the GDPR export API
      toast.success('Solicitando exportación de datos...');
      toast.info('Recibirás un email con un enlace de descarga en las próximas 24 horas');
      setShowExportModal(false);
    } catch (error) {
      toast.error('Error al solicitar exportación de datos');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In production, this would call the GDPR delete API
      toast.success('Cuenta marcada para eliminación');
      toast.info('Tu cuenta será eliminada en 30 días. Puedes cancelar antes si cambias de opinión.');
      setShowDeleteModal(false);
    } catch (error) {
      toast.error('Error al eliminar cuenta');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Configuración y Privacidad</h1>

      {/* Security Section */}
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiShield className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-semibold text-white">Seguridad</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-dark-700">
            <div>
              <p className="text-white font-medium">Autenticación de Dos Factores (2FA)</p>
              <p className="text-dark-400 text-sm">Agrega una capa extra de seguridad a tu cuenta</p>
            </div>
            <button className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors">
              Configurar
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-dark-700">
            <div>
              <p className="text-white font-medium">Cambiar Contraseña</p>
              <p className="text-dark-400 text-sm">Actualiza tu contraseña regularmente</p>
            </div>
            <button className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors">
              Cambiar
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Sesiones Activas</p>
              <p className="text-dark-400 text-sm">Gestiona dispositivos con acceso a tu cuenta</p>
            </div>
            <button className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors">
              Ver Sesiones
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Data Section */}
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiDownload className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-semibold text-white">Privacidad y Datos</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-dark-700">
            <div>
              <p className="text-white font-medium">Descargar Mis Datos</p>
              <p className="text-dark-400 text-sm">Exporta toda tu información personal (GDPR)</p>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <FiDownload /> Exportar
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-dark-700">
            <div>
              <p className="text-white font-medium">Preferencias de Cookies</p>
              <p className="text-dark-400 text-sm">Gestiona tus preferencias de cookies</p>
            </div>
            <button
              onClick={() => localStorage.removeItem('cookieConsent')}
              className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
            >
              Modificar
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Política de Privacidad</p>
              <p className="text-dark-400 text-sm">Lee nuestra política de privacidad</p>
            </div>
            <a
              href="/privacy"
              className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
            >
              Ver Política
            </a>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-dark-800 rounded-lg p-6 border-2 border-red-900/50">
        <div className="flex items-center gap-2 mb-4">
          <FiAlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-semibold text-white">Zona de Peligro</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Eliminar Cuenta</p>
            <p className="text-dark-400 text-sm">Elimina permanentemente tu cuenta y todos tus datos</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FiTrash2 /> Eliminar Cuenta
          </button>
        </div>
      </div>

      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Exportar Datos</h3>
            <p className="text-dark-300 mb-6">
              Recibirás un archivo ZIP con toda tu información:
            </p>
            <ul className="list-disc list-inside space-y-2 text-dark-300 mb-6">
              <li>Información de perfil</li>
              <li>Videos subidos</li>
              <li>Comentarios</li>
              <li>Listas de reproducción</li>
              <li>Historial de interacciones</li>
              <li>Datos de suscripción y pagos</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={handleExportData}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Solicitar Exportación
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full border-2 border-red-900/50">
            <div className="flex items-center gap-3 mb-4">
              <FiAlertTriangle className="w-8 h-8 text-red-500" />
              <h3 className="text-xl font-bold text-white">¿Eliminar Cuenta?</h3>
            </div>
            <p className="text-dark-300 mb-4">
              Esta acción es <strong className="text-red-500">permanente e irreversible</strong>.
            </p>
            <p className="text-dark-300 mb-6">Se eliminará:</p>
            <ul className="list-disc list-inside space-y-2 text-dark-300 mb-6">
              <li>Tu perfil y toda tu información personal</li>
              <li>Todos tus videos subidos</li>
              <li>Comentarios, likes, y listas</li>
              <li>Suscripción premium (si tienes)</li>
              <li>Historial de donaciones y revenue pendiente</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                Sí, Eliminar Mi Cuenta
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
