import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Award,
  Sparkles
} from 'lucide-react';
import { Member, Attendance, Schedule, User } from '../../types';
import { SmartChurnPredictionView } from './SmartChurnPredictionView';
import { RecurringBillingManager } from './RecurringBillingManager';
import { TieredCommissionCalculator } from './TieredCommissionCalculator';

interface SmartCrmBillingViewProps {
  members: Member[];
  attendances: Attendance[];
  schedules: Schedule[];
  staffUsers: User[];
  showToast?: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const SmartCrmBillingView: React.FC<SmartCrmBillingViewProps> = ({
  members,
  attendances,
  schedules,
  staffUsers,
  showToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'churn' | 'recurring' | 'tiered-comm'>('churn');

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              Keuangan, CRM &amp; Business Intelligence
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Smart churn retention, manajemen langganan auto-debit bulanan, dan akselerator komisi bertingkat PT.
            </p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('churn')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'churn'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            1. Prediksi Risiko Member Berhenti (AI Churn Alert 14–21 Hari)
          </button>

          <button
            onClick={() => setActiveSubTab('recurring')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'recurring'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            2. Recurring Billing Bulanan (Auto-Debit Langganan)
          </button>

          <button
            onClick={() => setActiveSubTab('tiered-comm')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'tiered-comm'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            3. Skema Komisi Bertingkat (Tiered Incentive PT)
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'churn' && (
        <SmartChurnPredictionView
          members={members}
          attendances={attendances}
          showToast={showToast}
        />
      )}

      {activeSubTab === 'recurring' && (
        <RecurringBillingManager
          members={members}
          showToast={showToast}
        />
      )}

      {activeSubTab === 'tiered-comm' && (
        <TieredCommissionCalculator
          staffUsers={staffUsers}
          schedules={schedules}
          showToast={showToast}
        />
      )}
    </div>
  );
};
