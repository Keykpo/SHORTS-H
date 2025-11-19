'use client';

import { useForm } from 'react-hook-form';
import { playlistService } from '@/services/playlist.service';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PlaylistForm {
  name: string;
  description?: string;
  isPublic: boolean;
}

export default function CreatePlaylistModal({ isOpen, onClose, onSuccess }: CreatePlaylistModalProps) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PlaylistForm>({
    defaultValues: {
      isPublic: true,
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: PlaylistForm) => {
    try {
      await playlistService.createPlaylist(data);
      toast.success('Lista creada exitosamente');
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear la lista');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md border border-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <h2 className="text-2xl font-bold text-white">Nueva Lista</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">
              Nombre de la lista *
            </label>
            <input
              type="text"
              {...register('name', { required: true, maxLength: 100 })}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="Ej: Mis favoritos de acción"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">
              Descripción (opcional)
            </label>
            <textarea
              {...register('description', { maxLength: 500 })}
              rows={3}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
              placeholder="Describe tu lista..."
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-dark-300 text-sm font-medium mb-3">
              Privacidad
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors">
                <input
                  type="radio"
                  {...register('isPublic')}
                  value="true"
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="text-white font-medium">Pública</p>
                  <p className="text-dark-400 text-xs">Cualquiera puede ver esta lista</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 transition-colors">
                <input
                  type="radio"
                  {...register('isPublic')}
                  value="false"
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="text-white font-medium">Privada</p>
                  <p className="text-dark-400 text-xs">Solo tú puedes ver esta lista</p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-dark-700 text-white rounded-lg font-semibold hover:bg-dark-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creando...' : 'Crear Lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
