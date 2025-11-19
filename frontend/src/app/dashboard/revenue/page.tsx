'use client';

import { useQuery } from '@tanstack/react-query';
import { RevenueService } from '@/services/revenue.service';
import { DonationService } from '@/services/donation.service';
import { FiDollarSign, FiTrendingUp, FiDownload, FiGift } from 'react-icons/fi';

export default function RevenueDashboard() {
  const { data: summary } = useQuery({
    queryKey: ['revenueSummary'],
    queryFn: () => RevenueService.getSummary(),
  });

  const { data: analytics } = useQuery({
    queryKey: ['revenueAnalytics'],
    queryFn: () => RevenueService.getAnalytics(),
  });

  const { data: withdrawalInfo } = useQuery({
    queryKey: ['withdrawalInfo'],
    queryFn: () => RevenueService.getWithdrawalInfo(),
  });

  const { data: donationStats } = useQuery({
    queryKey: ['donationStats'],
    queryFn: () => DonationService.getDonationStats(),
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Ingresos</h1>
        <button disabled={!withdrawalInfo?.canWithdraw} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          <FiDownload /> Retirar Fondos
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center gap-2 text-dark-400 mb-2"><FiDollarSign className="w-4 h-4" /><span className="text-sm">Total Ganado</span></div>
          <p className="text-3xl font-bold text-white">${summary?.totalRevenue.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center gap-2 text-dark-400 mb-2"><FiTrendingUp className="w-4 h-4" /><span className="text-sm">Este Mes</span></div>
          <p className="text-3xl font-bold text-white">${analytics?.thisMonth.toFixed(2) || '0.00'}</p>
          {analytics && analytics.growth !== 0 && (<p className={`text-sm mt-1 ${analytics.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>{analytics.growth > 0 ? '+' : ''}{analytics.growth.toFixed(1)}% vs mes anterior</p>)}
        </div>
        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center gap-2 text-dark-400 mb-2"><FiGift className="w-4 h-4" /><span className="text-sm">Donaciones</span></div>
          <p className="text-3xl font-bold text-white">${donationStats?.totalAmount.toFixed(2) || '0.00'}</p>
          <p className="text-sm text-dark-400 mt-1">{donationStats?.totalCount || 0} donaciones</p>
        </div>
        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center gap-2 text-dark-400 mb-2"><FiDownload className="w-4 h-4" /><span className="text-sm">Disponible</span></div>
          <p className="text-3xl font-bold text-white">${withdrawalInfo?.availableAmount.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-dark-400 mt-1">Mínimo: ${withdrawalInfo?.minimumWithdrawal || 50}</p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Desglose por Tipo</h2>
        <div className="space-y-3">
          {summary?.revenueByType.map((type) => (
            <div key={type.type} className="flex items-center justify-between">
              <span className="text-dark-300">{type.type.replace('_', ' ')}</span>
              <span className="text-white font-semibold">${type._sum.amount?.toFixed(2) || '0.00'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Donation */}
      {donationStats?.topDonation && (
        <div className="bg-dark-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Mayor Donación</h2>
          <div className="flex items-center justify-between">
            <div><p className="text-dark-300">{donationStats.topDonation.isAnonymous ? 'Anónimo' : donationStats.topDonation.sender.username}</p>{donationStats.topDonation.message && (<p className="text-sm text-dark-400 mt-1">{donationStats.topDonation.message}</p>)}</div>
            <p className="text-2xl font-bold text-primary-500">${donationStats.topDonation.amount}</p>
          </div>
        </div>
      )}
    </div>
  );
}
