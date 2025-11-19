'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService } from '@/services/admin.service';
import Navigation from '@/components/Navigation';
import { FiFlag, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveAction, setResolveAction] = useState<'dismiss' | 'action_taken'>('dismiss');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['adminReports', statusFilter],
    queryFn: () =>
      AdminService.getReports({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 50,
      }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ reportId, action, notes }: { reportId: string; action: 'dismiss' | 'action_taken'; notes?: string }) =>
      AdminService.resolveReport(reportId, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      toast.success('Reporte resuelto');
      setShowResolveModal(false);
      setResolveNotes('');
      setSelectedReport(null);
    },
  });

  const handleResolveClick = (report: any) => {
    setSelectedReport(report);
    setShowResolveModal(true);
  };

  const submitResolve = () => {
    resolveMutation.mutate({
      reportId: selectedReport.id,
      action: resolveAction,
      notes: resolveNotes || undefined,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-ES');
  };

  const getReasonBadgeColor = (reason: string) => {
    const colors: { [key: string]: string } = {
      spam: 'bg-yellow-600',
      inappropriate: 'bg-red-600',
      copyright: 'bg-purple-600',
      harassment: 'bg-orange-600',
      violence: 'bg-red-700',
      other: 'bg-gray-600',
    };
    return colors[reason.toLowerCase()] || colors.other;
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
                <h1 className="text-3xl font-bold text-white mb-2">Gestión de Reportes</h1>
                <p className="text-dark-400">Revisa y resuelve reportes de usuarios</p>
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors"
              >
                Volver al Panel
              </Link>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'resolved'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                Resueltos
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                Todos
              </button>
            </div>
          </div>

          {/* Reports List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report: any) => (
                <div
                  key={report.id}
                  className="bg-dark-800 rounded-lg border border-dark-700 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-red-600 bg-opacity-20 rounded-lg">
                        <FiFlag className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{report.reason}</h3>
                          <span className={`px-3 py-1 ${getReasonBadgeColor(report.reason)} bg-opacity-20 text-white rounded-full text-xs font-semibold`}>
                            {report.type}
                          </span>
                          {report.status === 'pending' ? (
                            <span className="px-3 py-1 bg-yellow-600 bg-opacity-20 text-yellow-500 rounded-full text-xs font-semibold">
                              Pendiente
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-600 bg-opacity-20 text-green-500 rounded-full text-xs font-semibold flex items-center gap-1">
                              <FiCheck className="w-3 h-3" />
                              Resuelto
                            </span>
                          )}
                        </div>

                        <p className="text-dark-300 mb-3">{report.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-dark-400 text-sm">Reportado por</p>
                            <p className="text-white">@{report.reporter.username}</p>
                          </div>
                          <div>
                            <p className="text-dark-400 text-sm">Fecha</p>
                            <p className="text-white text-sm">{formatDate(report.createdAt)}</p>
                          </div>
                          {report.reportedUser && (
                            <div>
                              <p className="text-dark-400 text-sm">Usuario reportado</p>
                              <p className="text-white">@{report.reportedUser.username}</p>
                            </div>
                          )}
                          {report.video && (
                            <div>
                              <p className="text-dark-400 text-sm">Video</p>
                              <Link
                                href={`/video/${report.video.id}`}
                                target="_blank"
                                className="text-primary-400 hover:underline"
                              >
                                Ver video
                              </Link>
                            </div>
                          )}
                        </div>

                        {report.resolvedAt && (
                          <div className="p-3 bg-dark-700 rounded-lg">
                            <p className="text-dark-400 text-sm mb-1">Resolución</p>
                            <p className="text-white">
                              Resuelto el {formatDate(report.resolvedAt)} por @{report.resolvedBy?.username || 'Admin'}
                            </p>
                            {report.resolutionNotes && (
                              <p className="text-dark-300 text-sm mt-2">{report.resolutionNotes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {report.status === 'pending' && (
                      <button
                        onClick={() => handleResolveClick(report)}
                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        Resolver
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-dark-800 rounded-lg border border-dark-700">
              <FiFlag className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay reportes {statusFilter === 'pending' ? 'pendientes' : ''}
              </h3>
              <p className="text-dark-400">
                {statusFilter === 'pending'
                  ? 'Todos los reportes han sido resueltos'
                  : 'No se encontraron reportes con los filtros seleccionados'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Resolve Modal */}
      {showResolveModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
          <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md border border-dark-700">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Resolver Reporte</h2>
              <p className="text-dark-300 mb-4">
                Reporte: <span className="text-white font-semibold">{selectedReport.reason}</span>
              </p>

              <div className="mb-4">
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Acción
                </label>
                <select
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value as 'dismiss' | 'action_taken')}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="dismiss">Desestimar (sin fundamento)</option>
                  <option value="action_taken">Acción tomada</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Agrega notas sobre la resolución..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setResolveNotes('');
                    setSelectedReport(null);
                  }}
                  className="flex-1 px-4 py-3 bg-dark-700 text-white rounded-lg font-semibold hover:bg-dark-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitResolve}
                  disabled={resolveMutation.isPending}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resolveMutation.isPending ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
