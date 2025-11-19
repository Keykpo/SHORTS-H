'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SubscriptionService } from '@/services/subscription.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { FiCheck, FiStar, FiZap, FiShield, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PremiumPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Fetch pricing
  const { data: pricing, isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => SubscriptionService.getPricing(),
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: (plan: 'MONTHLY' | 'YEARLY') => SubscriptionService.createSubscription(plan),
    onSuccess: () => {
      toast.success('¡Suscripción activada exitosamente!');
      router.push('/dashboard/subscription');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al crear suscripción');
    },
  });

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para suscribirte');
      router.push('/');
      return;
    }

    if (user?.isPremium) {
      toast.error('Ya tienes una suscripción activa');
      router.push('/dashboard/subscription');
      return;
    }

    subscribeMutation.mutate(selectedPlan);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const monthlyPlan = pricing?.monthly;
  const yearlyPlan = pricing?.yearly;

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-black py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 border border-primary-500 rounded-full mb-6">
            <FiStar className="w-5 h-5 text-primary-500" />
            <span className="text-primary-500 font-semibold">AnimeShorts Premium</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Desbloquea la Experiencia Completa
          </h1>
          <p className="text-dark-300 text-xl max-w-2xl mx-auto">
            Disfruta de contenido sin límites, sin anuncios, y con acceso exclusivo a funciones premium
          </p>
        </div>

        {/* Plan Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedPlan('MONTHLY')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                selectedPlan === 'MONTHLY'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setSelectedPlan('YEARLY')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all relative ${
                selectedPlan === 'YEARLY'
                  ? 'bg-primary-600 text-white'
                  : 'text-dark-300 hover:text-white'
              }`}
            >
              Anual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Monthly Plan */}
          {selectedPlan === 'MONTHLY' && monthlyPlan && (
            <div className="bg-dark-800 rounded-2xl p-8 border-2 border-primary-500 relative">
              <div className="absolute top-4 right-4 bg-primary-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Plan Mensual</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">${monthlyPlan.amount}</span>
                <span className="text-dark-300 text-lg">/mes</span>
              </div>
              <ul className="space-y-4 mb-8">
                {monthlyPlan.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <FiCheck className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-dark-200">{benefit}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleSubscribe}
                disabled={subscribeMutation.isPending}
                className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribeMutation.isPending ? 'Procesando...' : 'Suscribirse Ahora'}
              </button>
            </div>
          )}

          {/* Yearly Plan */}
          {selectedPlan === 'YEARLY' && yearlyPlan && (
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 border-2 border-primary-400 relative md:col-span-2 md:max-w-2xl md:mx-auto">
              <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                MEJOR VALOR
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Plan Anual</h3>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white">${yearlyPlan.amount}</span>
                <span className="text-white/80 text-lg">/año</span>
              </div>
              <p className="text-white/80 mb-6">
                Ahorra ${yearlyPlan.savings?.toFixed(2)} al año (2 meses gratis)
              </p>
              <ul className="space-y-4 mb-8">
                {yearlyPlan.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <FiCheck className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-white">{benefit}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleSubscribe}
                disabled={subscribeMutation.isPending}
                className="w-full bg-white text-primary-600 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribeMutation.isPending ? 'Procesando...' : 'Suscribirse Ahora'}
              </button>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-dark-800 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiZap className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin Límites</h3>
            <p className="text-dark-300">
              Sube videos ilimitados sin restricciones de tamaño o duración
            </p>
          </div>

          <div className="bg-dark-800 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShield className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin Anuncios</h3>
            <p className="text-dark-300">Disfruta de contenido sin interrupciones publicitarias</p>
          </div>

          <div className="bg-dark-800 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTrendingUp className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Prioridad</h3>
            <p className="text-dark-300">
              Acceso prioritario a nuevas funciones y soporte técnico
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-dark-800 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Preguntas Frecuentes</h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">¿Puedo cancelar en cualquier momento?</h3>
              <p className="text-dark-300">
                Sí, puedes cancelar tu suscripción en cualquier momento desde tu dashboard. Mantendrás acceso hasta el final del período pagado.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">¿Qué métodos de pago aceptan?</h3>
              <p className="text-dark-300">
                Aceptamos tarjetas de crédito y débito a través de Stripe. Pagos 100% seguros y encriptados.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">¿Hay reembolsos?</h3>
              <p className="text-dark-300">
                Ofrecemos reembolso completo dentro de los primeros 7 días si no estás satisfecho con el servicio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
