'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriptionService } from '@/services/subscription.service';
import { FiCreditCard, FiCalendar, FiDollarSign, FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function SubscriptionDashboard() {
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: () => SubscriptionService.getMySubscription(),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, immediate }: { id: string; immediate: boolean }) =>
      SubscriptionService.cancelSubscription(id, immediate),
    onSuccess: () => {
      toast.success('Suscripción cancelada');
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] });
      setShowCancelModal(false);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => SubscriptionService.reactivateSubscription(id),
    onSuccess: () => {
      toast.success('Suscripción reactivada');
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  }

  if (!subscription) {
    return <div className="max-w-4xl mx-auto p-6"><div className="bg-dark-800 rounded-lg p-8 text-center"><p className="text-dark-300 mb-4">No tienes una suscripción activa</p><a href="/premium" className="text-primary-500 hover:underline">Ver planes premium</a></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Mi Suscripción</h1>

      {/* Current Plan */}
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Plan {subscription.plan === 'MONTHLY' ? 'Mensual' : 'Anual'}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${subscription.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{subscription.status}</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <FiDollarSign className="w-5 h-5 text-primary-500" />
            <div><p className="text-dark-400 text-sm">Monto</p><p className="text-white font-semibold">${subscription.amount}/{subscription.plan === 'MONTHLY' ? 'mes' : 'año'}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <FiCalendar className="w-5 h-5 text-primary-500" />
            <div><p className="text-dark-400 text-sm">Próxima factura</p><p className="text-white font-semibold">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <FiCreditCard className="w-5 h-5 text-primary-500" />
            <div><p className="text-dark-400 text-sm">Método de pago</p><p className="text-white font-semibold">●●●● 4242</p></div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Acciones</h2>
        <div className="flex flex-wrap gap-3">
          {subscription.cancelAtPeriodEnd ? (
            <button onClick={() => reactivateMutation.mutate(subscription.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><FiCheck className="inline mr-2" />Reactivar Suscripción</button>
          ) : (
            <button onClick={() => setShowCancelModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><FiX className="inline mr-2" />Cancelar Suscripción</button>
          )}
        </div>
        {subscription.cancelAtPeriodEnd && (<p className="text-yellow-500 text-sm mt-3">Tu suscripción se cancelará el {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>)}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Cancelar Suscripción</h3>
            <p className="text-dark-300 mb-6">¿Estás seguro de que deseas cancelar? Perderás todos los beneficios premium.</p>
            <div className="flex gap-3">
              <button onClick={() => cancelMutation.mutate({ id: subscription.id, immediate: false })} className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Cancelar al final del período</button>
              <button onClick={() => setShowCancelModal(false)} className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600">Mantener Suscripción</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
