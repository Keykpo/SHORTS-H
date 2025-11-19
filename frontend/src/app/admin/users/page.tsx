'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService } from '@/services/admin.service';
import Navigation from '@/components/Navigation';
import { FiSearch, FiShield, FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState<number>(7);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', searchQuery, statusFilter],
    queryFn: () =>
      AdminService.getUsers({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 50,
      }),
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, reason, duration }: { userId: string; reason: string; duration?: number }) =>
      AdminService.toggleUserBan(userId, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('Estado del usuario actualizado');
      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
    },
  });

  const handleBanClick = (user: any) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const submitBan = () => {
    if (!banReason.trim()) {
      toast.error('Debes proporcionar una razón');
      return;
    }
    banMutation.mutate({
      userId: selectedUser.id,
      reason: banReason,
      duration: banDuration,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Gestión de Usuarios</h1>
                <p className="text-dark-400">Administra usuarios y permisos</p>
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
              >
                Volver al Panel
              </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por username o email..."
                  className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="all">Todos los usuarios</option>
                <option value="active">Activos</option>
                <option value="banned">Baneados</option>
                <option value="verified">Verificados</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : usersData && usersData.length > 0 ? (
            <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Registrado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Videos
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {usersData.map((user: any) => (
                      <tr key={user.id} className="hover:bg-dark-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatarUrl || '/default-avatar.png'}
                              alt={user.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="text-white font-medium">{user.username}</p>
                              {user.isPremium && (
                                <span className="inline-block mt-1 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">
                                  PRO
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-dark-300 text-sm">{user.email}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-dark-300 text-sm">{formatDate(user.createdAt)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-white">{user.videosCount || 0}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isBanned ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 bg-opacity-20 text-red-500 rounded-full text-xs font-semibold">
                              <FiAlertCircle className="w-3 h-3" />
                              Baneado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 bg-opacity-20 text-green-500 rounded-full text-xs font-semibold">
                              <FiCheckCircle className="w-3 h-3" />
                              Activo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${user.username}`}
                              target="_blank"
                              className="p-2 text-dark-400 hover:text-primary-500 transition-colors"
                              title="Ver perfil"
                            >
                              <FiShield className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleBanClick(user)}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                user.isBanned
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              {user.isBanned ? 'Desbanear' : 'Banear'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-dark-800 rounded-lg border border-dark-700">
              <FiSearch className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-dark-400">
                Intenta con otros filtros de búsqueda
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Ban/Unban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
          <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md border border-dark-700">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                {selectedUser.isBanned ? 'Desbanear Usuario' : 'Banear Usuario'}
              </h2>
              <p className="text-dark-300 mb-4">
                Usuario: <span className="text-white font-semibold">@{selectedUser.username}</span>
              </p>

              {!selectedUser.isBanned && (
                <>
                  <div className="mb-4">
                    <label className="block text-dark-300 text-sm font-medium mb-2">
                      Duración del ban (días)
                    </label>
                    <select
                      value={banDuration}
                      onChange={(e) => setBanDuration(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value={1}>1 día</option>
                      <option value={3}>3 días</option>
                      <option value={7}>7 días</option>
                      <option value={14}>14 días</option>
                      <option value={30}>30 días</option>
                      <option value={0}>Permanente</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-dark-300 text-sm font-medium mb-2">
                      Razón del ban *
                    </label>
                    <textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none"
                      placeholder="Explica por qué se banea a este usuario..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setBanReason('');
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-3 bg-dark-700 text-white rounded-lg font-semibold hover:bg-dark-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitBan}
                  disabled={banMutation.isPending || (!selectedUser.isBanned && !banReason.trim())}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedUser.isBanned
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {banMutation.isPending
                    ? 'Procesando...'
                    : selectedUser.isBanned
                    ? 'Confirmar Desbaneo'
                    : 'Confirmar Ban'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
