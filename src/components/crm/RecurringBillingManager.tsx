import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  RefreshCw,
  Play,
  Pause,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Wallet,
  Building,
  Smartphone,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Member, RecurringBillingPlan, RecurringPaymentMethod, RecurringStatus } from '../../types';

interface RecurringBillingManagerProps {
  members: Member[];
  showToast?: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const RecurringBillingManager: React.FC<RecurringBillingManagerProps> = ({
  members,
  showToast
}) => {
  const [plans, setPlans] = useState<RecurringBillingPlan[]>(() => {
    try {
      const saved = localStorage.getItem('gympro_recurring_plans');
      if (saved) return JSON.parse(saved);
    } catch {}

    // Seed realistic recurring billing plans
    const today = new Date();
    const nextMonthStr = new Date(today.getFullYear(), today.getMonth() + 1, 15).toISOString().split('T')[0];

    return [
      {
        id: 'REC-001',
        memberId: members[0]?.id || 'M-001',
        memberName: members[0]?.name || 'Alexander Pratama',
        memberPhone: members[0]?.phone || '081288889999',
        planName: 'VIP All Club Unlimited (Bulanan)',
        amount: 450000,
        paymentMethod: 'BCA_AUTODEBIT',
        frequency: 'MONTHLY',
        billingDayOfMonth: 15,
        nextBillingDate: nextMonthStr,
        lastBillingDate: '2026-10-15',
        status: 'ACTIVE',
        failedAttempts: 0,
        autoRenew: true,
        cardOrAccountMasked: 'BCA •••• 9812',
        createdAt: '2026-08-15'
      },
      {
        id: 'REC-002',
        memberId: members[1]?.id || 'M-002',
        memberName: members[1]?.name || 'Jessica Iskandar',
        memberPhone: members[1]?.phone || '081377772222',
        planName: 'Regular Gym Access + Locker',
        amount: 350000,
        paymentMethod: 'CREDIT_CARD_VISA_MC',
        frequency: 'MONTHLY',
        billingDayOfMonth: 1,
        nextBillingDate: '2026-11-01',
        lastBillingDate: '2026-10-01',
        status: 'ACTIVE',
        failedAttempts: 0,
        autoRenew: true,
        cardOrAccountMasked: 'VISA •••• 4421',
        createdAt: '2026-07-01'
      },
      {
        id: 'REC-003',
        memberId: members[2]?.id || 'M-003',
        memberName: members[2]?.name || 'Kevin Sanjaya',
        memberPhone: members[2]?.phone || '081900112233',
        planName: 'Student Gym Pass',
        amount: 250000,
        paymentMethod: 'GOPAY_AUTOPAY',
        frequency: 'MONTHLY',
        billingDayOfMonth: 20,
        nextBillingDate: '2026-10-20',
        lastBillingDate: '2026-09-20',
        status: 'FAILED_RETRY',
        failedAttempts: 1,
        autoRenew: true,
        cardOrAccountMasked: 'GoPay •••• 2233',
        createdAt: '2026-09-20'
      },
      {
        id: 'REC-004',
        memberId: members[3]?.id || 'M-004',
        memberName: members[3]?.name || 'Dian Kusuma',
        memberPhone: members[3]?.phone || '085711223344',
        planName: 'VIP Platinum + PT Bundle',
        amount: 850000,
        paymentMethod: 'MANDIRI_AUTODEBIT',
        frequency: 'MONTHLY',
        billingDayOfMonth: 25,
        nextBillingDate: '2026-10-25',
        lastBillingDate: '2026-09-25',
        status: 'ACTIVE',
        failedAttempts: 0,
        autoRenew: true,
        cardOrAccountMasked: 'Mandiri •••• 1109',
        createdAt: '2026-06-25'
      }
    ];
  });

  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | RecurringStatus>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Subscription Form State
  const [newSub, setNewSub] = useState({
    memberId: '',
    planName: 'VIP All Club Unlimited (Bulanan)',
    amount: 450000,
    paymentMethod: 'BCA_AUTODEBIT' as RecurringPaymentMethod,
    billingDayOfMonth: 1
  });

  // Save to storage
  useEffect(() => {
    try {
      localStorage.setItem('gympro_recurring_plans', JSON.stringify(plans));
    } catch {}
  }, [plans]);

  // Aggregate Metrics
  const activePlans = plans.filter((p) => p.status === 'ACTIVE');
  const totalMRR = activePlans.reduce((acc, curr) => acc + curr.amount, 0);

  // Execute Batch Auto-Debit
  const handleExecuteBatchAutoDebit = () => {
    setIsProcessingBatch(true);
    setTimeout(() => {
      setIsProcessingBatch(false);
      const todayStr = new Date().toISOString().split('T')[0];

      setPlans((prev) =>
        prev.map((p) => {
          if (p.status === 'ACTIVE' || p.status === 'FAILED_RETRY') {
            return {
              ...p,
              status: 'ACTIVE',
              failedAttempts: 0,
              lastBillingDate: todayStr
            };
          }
          return p;
        })
      );

      showToast?.(
        'Batch Auto-Debit Selesai',
        `Berhasil menagih ${activePlans.length} rekening member aktif (Total: Rp ${totalMRR.toLocaleString('id-ID')}).`,
        'success'
      );
    }, 1200);
  };

  const handleToggleStatus = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          const nextStatus: RecurringStatus = p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
    showToast?.('Status Diperbarui', 'Status langganan bulanan diubah.', 'info');
  };

  const handleToggleAutoRenew = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, autoRenew: !p.autoRenew } : p))
    );
  };

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const mem = members.find((m) => m.id === newSub.memberId);
    if (!mem) {
      showToast?.('Pilih Member', 'Harap pilih member untuk langganan auto-debit.', 'error');
      return;
    }

    const today = new Date();
    const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, newSub.billingDayOfMonth).toISOString().split('T')[0];

    const plan: RecurringBillingPlan = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      memberId: mem.id,
      memberName: mem.name,
      memberPhone: mem.phone || '',
      planName: newSub.planName,
      amount: Number(newSub.amount),
      paymentMethod: newSub.paymentMethod,
      frequency: 'MONTHLY',
      billingDayOfMonth: newSub.billingDayOfMonth,
      nextBillingDate: nextDate,
      status: 'ACTIVE',
      failedAttempts: 0,
      autoRenew: true,
      cardOrAccountMasked: `${newSub.paymentMethod.split('_')[0]} •••• ${mem.phone?.slice(-4) || '8888'}`,
      createdAt: today.toISOString().split('T')[0]
    };

    setPlans([plan, ...plans]);
    setIsAddModalOpen(false);
    showToast?.('Langganan Aktif', `Auto-debit bulanan untuk ${mem.name} berhasil didaftarkan.`, 'success');
  };

  const filteredPlans = useMemo(() => {
    if (filterStatus === 'ALL') return plans;
    return plans.filter((p) => p.status === filterStatus);
  }, [plans, filterStatus]);

  const getMethodIcon = (method: RecurringPaymentMethod) => {
    switch (method) {
      case 'CREDIT_CARD_VISA_MC':
        return CreditCard;
      case 'GOPAY_AUTOPAY':
      case 'OVO_AUTOPAY':
        return Smartphone;
      default:
        return Building;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & MRR Metrics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Recurring Billing / Langganan Otomatis Bulanan
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold border border-blue-300 dark:border-blue-700">
                    Auto-Debit Cash Flow
                  </span>
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Meniru model bisnis gym modern dengan perpanjangan debit otomatis setiap bulan untuk menjaga kestabilan cash flow.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              Daftar Langganan Baru
            </button>

            <button
              onClick={handleExecuteBatchAutoDebit}
              disabled={isProcessingBatch}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessingBatch ? 'animate-spin' : ''}`} />
              {isProcessingBatch ? 'Memproses Debit...' : 'Proses Batch Auto-Debit Hari Ini'}
            </button>
          </div>
        </div>

        {/* 4 Cards: MRR, Subscribers, Retries, Renewal Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Monthly Recurring Revenue (MRR)
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Rp {totalMRR.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Prediksi pemasukan stabil bulanan
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Pelanggan Aktif
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {activePlans.length} / {plans.length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Tingkat retensi auto-renew 92%
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Gagal &amp; Menunggu Retry
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {plans.filter((p) => p.status === 'FAILED_RETRY').length} Rekening
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Saldo tidak cukup / limit kartu
            </p>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Rata-rata Tagihan (ARPU)
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Rp {activePlans.length ? Math.round(totalMRR / activePlans.length).toLocaleString('id-ID') : 0}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Per member per bulan
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Subscription Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Daftar Langganan Recurring ({filteredPlans.length} Kontrak)
          </span>

          <div className="flex items-center gap-2">
            {(['ALL', 'ACTIVE', 'PAUSED', 'FAILED_RETRY'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {st === 'ALL'
                  ? 'Semua'
                  : st === 'ACTIVE'
                  ? 'Aktif'
                  : st === 'PAUSED'
                  ? 'Di-pause'
                  : 'Gagal / Retry'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3.5 pl-5">Member &amp; Paket</th>
                <th className="p-3.5">Metode Pembayaran</th>
                <th className="p-3.5">Biaya / Bulan</th>
                <th className="p-3.5">Tanggal Debit Berikutnya</th>
                <th className="p-3.5 text-center">Auto-Renew</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPlans.map((plan) => {
                const MethodIcon = getMethodIcon(plan.paymentMethod);
                return (
                  <tr
                    key={plan.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 pl-5">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {plan.memberName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {plan.planName}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <MethodIcon className="w-4 h-4 text-blue-500" />
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {plan.cardOrAccountMasked}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      Rp {plan.amount.toLocaleString('id-ID')}
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-mono">
                      {plan.nextBillingDate} (Tgl {plan.billingDayOfMonth})
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleAutoRenew(plan.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-all ${
                          plan.autoRenew
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {plan.autoRenew ? 'ON (Otomatis)' : 'OFF (Manual)'}
                      </button>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          plan.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : plan.status === 'FAILED_RETRY'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {plan.status === 'ACTIVE'
                          ? 'Aktif'
                          : plan.status === 'FAILED_RETRY'
                          ? 'Gagal (Retry)'
                          : 'Di-pause'}
                      </span>
                    </td>

                    <td className="p-3.5 pr-5 text-right">
                      <button
                        onClick={() => handleToggleStatus(plan.id)}
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                        title={plan.status === 'ACTIVE' ? 'Pause Auto-Debit' : 'Resume Auto-Debit'}
                      >
                        {plan.status === 'ACTIVE' ? (
                          <Pause className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subscription Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Daftar Langganan Auto-Debit Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                  Pilih Member:
                </label>
                <select
                  required
                  value={newSub.memberId}
                  onChange={(e) => setNewSub({ ...newSub, memberId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="">-- Pilih Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.phone || 'No HP'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                  Nama Paket Langganan:
                </label>
                <input
                  type="text"
                  required
                  value={newSub.planName}
                  onChange={(e) => setNewSub({ ...newSub, planName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                    Tagihan Bulanan (Rp):
                  </label>
                  <input
                    type="number"
                    required
                    min={50000}
                    step={10000}
                    value={newSub.amount}
                    onChange={(e) => setNewSub({ ...newSub, amount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                    Tanggal Debit Tiap Bulan:
                  </label>
                  <select
                    value={newSub.billingDayOfMonth}
                    onChange={(e) => setNewSub({ ...newSub, billingDayOfMonth: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                      <option key={day} value={day}>
                        Tanggal {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                  Kanal Pembayaran Auto-Debit:
                </label>
                <select
                  value={newSub.paymentMethod}
                  onChange={(e) => setNewSub({ ...newSub, paymentMethod: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="BCA_AUTODEBIT">BCA Auto-Debit</option>
                  <option value="MANDIRI_AUTODEBIT">Mandiri Auto-Debit</option>
                  <option value="GOPAY_AUTOPAY">GoPay AutoPay</option>
                  <option value="OVO_AUTOPAY">OVO Recurring</option>
                  <option value="CREDIT_CARD_VISA_MC">Kartu Kredit Visa / Mastercard</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Simpan Kontrak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
