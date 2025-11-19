'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { VideoService } from '@/services/video.service';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/navigation';
import { FiUpload, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface UploadForm {
  title: string;
  description?: string;
  tags: string;
  isNsfw: boolean;
  nsfwLevel: 'SOFT' | 'MODERATE' | 'EXPLICIT';
  contentWarnings: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<UploadForm>({
    defaultValues: {
      isNsfw: false,
      nsfwLevel: 'SOFT',
    },
  });

  const isNsfw = watch('isNsfw');

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const result = await VideoService.uploadVideo(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      return result;
    },
    onSuccess: (data) => {
      toast.success('Video subido exitosamente! Procesando...');
      setTimeout(() => {
        router.push(`/video/${data.id}`);
      }, 2000);
    },
    onError: (error: any) => {
      setIsUploading(false);
      setUploadProgress(0);
      toast.error(error.response?.data?.error || 'Error al subir el video');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast.error('Por favor selecciona un archivo de video válido');
        return;
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('El video es demasiado grande. Máximo 500MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona una imagen válida');
        return;
      }
      setThumbnail(file);
    }
  };

  const onSubmit = (data: UploadForm) => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un video para subir');
      return;
    }

    const formData = new FormData();
    formData.append('video', selectedFile);
    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('isNsfw', String(data.isNsfw));
    if (data.isNsfw) {
      formData.append('nsfwLevel', data.nsfwLevel);
      if (data.contentWarnings) {
        formData.append('contentWarnings', data.contentWarnings);
      }
    }
    if (data.tags) {
      // Split tags by comma and trim
      const tagsArray = data.tags.split(',').map(t => t.trim()).filter(t => t);
      formData.append('tags', JSON.stringify(tagsArray));
    }

    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Subir Video</h1>
            <p className="text-dark-400">Comparte tu contenido con la comunidad</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload */}
            <div className="bg-dark-800 rounded-lg p-6 border-2 border-dashed border-dark-600">
              {!selectedFile ? (
                <label className="flex flex-col items-center justify-center py-12 cursor-pointer group">
                  <FiUpload className="w-16 h-16 text-dark-400 group-hover:text-primary-500 transition-colors mb-4" />
                  <p className="text-white font-semibold mb-2">
                    Haz clic para seleccionar un video
                  </p>
                  <p className="text-dark-400 text-sm mb-4">
                    o arrastra y suelta aquí
                  </p>
                  <p className="text-dark-500 text-xs">
                    MP4, MOV, AVI (máx. 500MB)
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                      <FiCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{selectedFile.name}</p>
                      <p className="text-dark-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-2 text-dark-400 hover:text-red-500 transition-colors"
                    >
                      <FiX className="w-6 h-6" />
                    </button>
                  )}
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">Subiendo...</span>
                    <span className="text-primary-400 text-sm font-semibold">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-white font-medium mb-2">
                Miniatura (opcional)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-dark-400 hover:border-primary-500 transition-colors cursor-pointer">
                  {thumbnail ? thumbnail.name : 'Seleccionar miniatura personalizada'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                {thumbnail && (
                  <button
                    type="button"
                    onClick={() => setThumbnail(null)}
                    className="p-3 text-dark-400 hover:text-red-500 transition-colors"
                    disabled={isUploading}
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-dark-500 text-xs mt-1">
                Si no subes una miniatura, se generará automáticamente
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-white font-medium mb-2">
                Título *
              </label>
              <input
                type="text"
                {...register('title', {
                  required: 'El título es requerido',
                  maxLength: { value: 200, message: 'Máximo 200 caracteres' },
                })}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="Escribe un título llamativo..."
                disabled={isUploading}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-medium mb-2">
                Descripción
              </label>
              <textarea
                {...register('description', {
                  maxLength: { value: 5000, message: 'Máximo 5000 caracteres' },
                })}
                rows={4}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                placeholder="Describe tu video..."
                disabled={isUploading}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-white font-medium mb-2">
                Tags (separados por comas)
              </label>
              <input
                type="text"
                {...register('tags')}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="ej: anime, acción, romance"
                disabled={isUploading}
              />
            </div>

            {/* NSFW Settings */}
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  {...register('isNsfw')}
                  className="mt-1 w-5 h-5 rounded border-dark-600 text-primary-600 focus:ring-primary-500"
                  disabled={isUploading}
                />
                <div className="flex-1">
                  <label className="text-white font-medium block mb-1">
                    Contenido NSFW (18+)
                  </label>
                  <p className="text-dark-400 text-sm">
                    Marca esta opción si tu video contiene contenido para adultos
                  </p>
                </div>
              </div>

              {isNsfw && (
                <div className="space-y-4 mt-4 pt-4 border-t border-dark-700">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Nivel NSFW *
                    </label>
                    <select
                      {...register('nsfwLevel')}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                      disabled={isUploading}
                    >
                      <option value="SOFT">Suave (Ecchi, Fanservice)</option>
                      <option value="MODERATE">Moderado (Contenido Sugestivo)</option>
                      <option value="EXPLICIT">Explícito (Contenido Sexual)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Advertencias de Contenido (separadas por comas)
                    </label>
                    <input
                      type="text"
                      {...register('contentWarnings')}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                      placeholder="ej: violencia, lenguaje fuerte"
                      disabled={isUploading}
                    />
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-yellow-900 bg-opacity-20 rounded-lg">
                    <FiAlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-200 text-sm">
                      El contenido NSFW será verificado por nuestro equipo de moderación antes de ser publicado.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isUploading}
                className="px-8 py-3 bg-dark-800 text-white rounded-lg font-semibold hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="flex-1 px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Subiendo...' : 'Publicar Video'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
