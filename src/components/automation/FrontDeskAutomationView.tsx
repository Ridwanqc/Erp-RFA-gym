import React, { useState } from 'react';
import {
  Zap,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Member, Schedule, LockerSlot, Attendance } from '../../types';
import { ScheduledWhatsAppGateway } from './ScheduledWhatsAppGateway';
import { BarrierGateController } from './BarrierGateController';
import { SelfServiceKioskModal } from './SelfServiceKioskModal';

interface FrontDeskAutomationViewProps {
  members: Member[];
  schedules: Schedule[];
  lockers: LockerSlot[];
  onAddAttendance?: (attendance: Attendance) => void;
  onUpdateLockers?: (lockers: LockerSlot[]) => void;
  showToast?: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const FrontDeskAutomationView: React.FC<FrontDeskAutomationViewProps> = ({
  members,
  schedules,
  lockers,
  onAddAttendance,
  onUpdateLockers,
  showToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'whatsapp' | 'gate' | 'kiosk'>('whatsapp');
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Zap className="w-6 h-6 text-emerald-500" />
              Otomasi Operasional &amp; Front Desk
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Pusat kendali WhatsApp Gateway terjadwal, integrasi barrier gate putar, dan mode kios check-in mandiri.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsKioskModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              Buka Kios Mandiri (Layar Penuh)
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('whatsapp')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            1. WhatsApp Gateway Terjadwal (H-7, H-1, PT H-2, Ulang Tahun)
          </button>

          <button
            onClick={() => setActiveSubTab('gate')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'gate'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            2. Integrasi Barrier Gate / Turnstile Otomatis
          </button>

          <button
            onClick={() => setActiveSubTab('kiosk')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'kiosk'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            3. Panduan &amp; Pengaturan Kios Tablet
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeSubTab === 'whatsapp' && (
        <ScheduledWhatsAppGateway
          members={members}
          schedules={schedules}
          showToast={showToast}
        />
      )}

      {activeSubTab === 'gate' && (
        <BarrierGateController
          members={members}
          showToast={showToast}
        />
      )}

      {activeSubTab === 'kiosk' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Mode Kios Check-In Mandiri (Self-Service Tablet)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Pasang tablet iPad / Android di meja resepsionis lobby gym. Member dapat check-in mandiri tanpa perlu antre di kasir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Input Ramah Sentuh</h4>
              <p className="text-xs text-slate-500">
                Pilihan pemindaian kartu QR atau memasukkan 4 digit terakhir nomor HP dengan keypad sentuh besar.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Alokasi Loker Otomatis</h4>
              <p className="text-xs text-slate-500">
                Sistem otomatis memilih loker yang tersedia dan menampilkannya di layar tablet dengan nomor tebal.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">PIN Pengunci Staf</h4>
              <p className="text-xs text-slate-500">
                Layar dikunci dalam mode kios aman. Pengunjung tidak dapat mengakses sistem kasir / data member tanpa PIN (default: 1234).
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Ketersediaan Loker Saat Ini: {lockers.filter((l) => !l.isOccupied && l.status !== 'Perbaikan').length} Kosong / {lockers.length} Total
            </span>
            <button
              onClick={() => setIsKioskModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              Uji Coba Tampilan Kios Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Kiosk Overlay */}
      <SelfServiceKioskModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
        members={members}
        lockers={lockers}
        onAddAttendance={onAddAttendance}
        onUpdateLockers={onUpdateLockers}
      />
    </div>
  );
};
