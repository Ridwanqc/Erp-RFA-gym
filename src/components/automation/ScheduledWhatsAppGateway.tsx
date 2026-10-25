import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Calendar,
  Clock,
  Cake,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Edit3,
  CheckCheck,
  Copy,
  ChevronRight
} from 'lucide-react';
import { Member, Schedule, ScheduledWhatsAppTask, ScheduledNotificationType } from '../../types';
import { formatIndonesianWhatsAppNumber } from '../../utils/whatsappHelper';

interface ScheduledWhatsAppGatewayProps {
  members: Member[];
  schedules: Schedule[];
  showToast?: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ScheduledWhatsAppGateway: React.FC<ScheduledWhatsAppGatewayProps> = ({
  members,
  schedules,
  showToast
}) => {
  const [filterType, setFilterType] = useState<'ALL' | ScheduledNotificationType>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'SENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<ScheduledWhatsAppTask[]>(() => {
    try {
      const saved = localStorage.getItem('gympro_scheduled_wa_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [activeTemplateType, setActiveTemplateType] = useState<ScheduledNotificationType | null>(null);
  const [templates, setTemplates] = useState<Record<ScheduledNotificationType, string>>(() => {
    try {
      const saved = localStorage.getItem('gympro_wa_custom_templates');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      EXPIRY_H7: `Halo kak {nama}! 🙌\n\nKami ingin menginfokan bahwa masa aktif membership gym kamu di *{gym_name}* akan berakhir dalam *7 hari lagi* ({tanggal_expired}).\n\nYuk perpanjang sekarang untuk mengunci promo renewal spesial hemat 10% dan latihan tanpa terputus! 🏋️‍♂️💪\n\nHubungi resepsionis kami untuk perpanjangan langsung. Salam bugar!`,
      EXPIRY_H1: `🚨 Peringatan Penting Membership {gym_name}!\n\nHalo kak {nama}, masa aktif keanggotaan gym kamu *berakhir BESOK* ({tanggal_expired})!\n\nAyo segera perpanjang hari ini agar loker dan akses gate tap kamu tetap aktif lancar. Nikmati bonus voucher fitness shake gratis untuk renewal hari ini! 🥤⚡`,
      PT_REMINDER_H2: `⏰ Pengingat Sesi Personal Training {gym_name}\n\nHalo kak {nama}! Sesi latihan bersama Coach *{trainer_name}* dijadwalkan *2 JAM LAGI* hari ini pukul *{waktu_sesi}*.\n\nJangan lupa bawa handuk & botol minum ya. Kami tunggu di fitness area! 🔥`,
      BIRTHDAY_VOUCHER: `🎂 Selamat Ulang Tahun kak {nama}! 🎉🎁\n\nKeluarga besar *{gym_name}* mengucapkan selamat bertambah usia, sehat & sukses selalu! Sebagai kado spesial dari kami, nikmati:\n\n🎟️ *VOUCHER DISKON 25% RENEWAL*\nKode Promo: *{kode_voucher}*\n(Berlaku hingga 7 hari ke depan)\n\nTunjukkan pesan ini ke front desk saat kedatangan. Have a blessed day! ✨`,
      CUSTOM: `Halo kak {nama},\n\nTerima kasih telah menjadi bagian dari komunitas {gym_name}. Salam sehat selalu!`
    };
  });

  // Save tasks and templates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gympro_scheduled_wa_tasks', JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('gympro_wa_custom_templates', JSON.stringify(templates));
    } catch {}
  }, [templates]);

  // Scan & Generate scheduled tasks based on current member/schedule data
  const handleGenerateScheduledQueue = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const generated: ScheduledWhatsAppTask[] = [];

    // 1. Expiry H-7 and H-1
    members.forEach((m) => {
      if (!m.expired || m.status === 'EXPIRED') return;
      const expDate = new Date(m.expired + 'T00:00:00');
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // H-7 check
      if (diffDays >= 6 && diffDays <= 7) {
        const taskId = `EXP-H7-${m.id}-${m.expired}`;
        const existing = tasks.find((t) => t.id === taskId);
        if (!existing) {
          const msg = templates.EXPIRY_H7
            .replace(/{nama}/g, m.name)
            .replace(/{gym_name}/g, 'GymPro Fitness')
            .replace(/{tanggal_expired}/g, m.expired);
          generated.push({
            id: taskId,
            type: 'EXPIRY_H7',
            recipientId: m.id,
            recipientName: m.name,
            recipientPhone: m.phone || '',
            scheduledFor: todayStr,
            message: msg,
            status: 'PENDING',
            metadata: { daysRemaining: diffDays }
          });
        }
      }

      // H-1 check
      if (diffDays >= 0 && diffDays <= 1) {
        const taskId = `EXP-H1-${m.id}-${m.expired}`;
        const existing = tasks.find((t) => t.id === taskId);
        if (!existing) {
          const msg = templates.EXPIRY_H1
            .replace(/{nama}/g, m.name)
            .replace(/{gym_name}/g, 'GymPro Fitness')
            .replace(/{tanggal_expired}/g, m.expired);
          generated.push({
            id: taskId,
            type: 'EXPIRY_H1',
            recipientId: m.id,
            recipientName: m.name,
            recipientPhone: m.phone || '',
            scheduledFor: todayStr,
            message: msg,
            status: 'PENDING',
            metadata: { daysRemaining: diffDays }
          });
        }
      }

      // Birthday check: check if birthDate matches today's month & day
      if (m.birthDate) {
        try {
          const bday = new Date(m.birthDate);
          if (bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate()) {
            const bdayTaskId = `BDAY-${m.id}-${today.getFullYear()}`;
            const existing = tasks.find((t) => t.id === bdayTaskId);
            if (!existing) {
              const voucherCode = `HBD-${m.name.slice(0, 3).toUpperCase()}${today.getFullYear()}`;
              const msg = templates.BIRTHDAY_VOUCHER
                .replace(/{nama}/g, m.name)
                .replace(/{gym_name}/g, 'GymPro Fitness')
                .replace(/{kode_voucher}/g, voucherCode);
              generated.push({
                id: bdayTaskId,
                type: 'BIRTHDAY_VOUCHER',
                recipientId: m.id,
                recipientName: m.name,
                recipientPhone: m.phone || '',
                scheduledFor: todayStr,
                message: msg,
                status: 'PENDING',
                metadata: { voucherCode, voucherDiscount: '25%' }
              });
            }
          }
        } catch {}
      }
    });

    // 2. PT Sessions Reminder H-2 Hours
    schedules.forEach((sch) => {
      const coachName = (sch as any).trainerName || sch.trainer || 'Coach Personal Trainer';
      if (sch.date === todayStr && sch.status !== 'Selesai' && sch.status !== 'Batal') {
        const ptTaskId = `PT-H2-${sch.id}`;
        const existing = tasks.find((t) => t.id === ptTaskId);
        if (!existing) {
          const msg = templates.PT_REMINDER_H2
            .replace(/{nama}/g, sch.memberName)
            .replace(/{gym_name}/g, 'GymPro Fitness')
            .replace(/{trainer_name}/g, coachName)
            .replace(/{waktu_sesi}/g, `${sch.time} WIB`);
          
          // Find member phone
          const targetMember = members.find((m) => m.id === sch.memberId || m.name.toLowerCase() === sch.memberName.toLowerCase());
          const phone = targetMember?.phone || '081234567890';

          generated.push({
            id: ptTaskId,
            type: 'PT_REMINDER_H2',
            recipientId: sch.memberId || sch.id,
            recipientName: sch.memberName,
            recipientPhone: phone,
            scheduledFor: todayStr,
            message: msg,
            status: 'PENDING',
            metadata: { ptSessionTime: sch.time, ptTrainerName: coachName }
          });
        }
      }
    });

    // If no real data triggered (e.g. freshly seeded DB), add demo seed tasks for quick testing
    if (generated.length === 0 && tasks.length === 0) {
      const demoMember = members[0] || { id: 'M-DEMO', name: 'Budi Pratama', phone: '081288889999', expiryDate: '2026-10-29' };
      generated.push(
        {
          id: `DEMO-EXP-H7-${demoMember.id}`,
          type: 'EXPIRY_H7',
          recipientId: demoMember.id,
          recipientName: demoMember.name,
          recipientPhone: demoMember.phone || '081288889999',
          scheduledFor: todayStr,
          message: templates.EXPIRY_H7.replace(/{nama}/g, demoMember.name).replace(/{gym_name}/g, 'GymPro Fitness').replace(/{tanggal_expired}/g, '7 Hari Lagi'),
          status: 'PENDING',
          metadata: { daysRemaining: 7 }
        },
        {
          id: `DEMO-EXP-H1-02`,
          type: 'EXPIRY_H1',
          recipientId: 'M-002',
          recipientName: 'Siti Rahmawati',
          recipientPhone: '081377772222',
          scheduledFor: todayStr,
          message: templates.EXPIRY_H1.replace(/{nama}/g, 'Siti Rahmawati').replace(/{gym_name}/g, 'GymPro Fitness').replace(/{tanggal_expired}/g, 'Besok Pagi'),
          status: 'PENDING',
          metadata: { daysRemaining: 1 }
        },
        {
          id: `DEMO-PT-H2-01`,
          type: 'PT_REMINDER_H2',
          recipientId: 'M-003',
          recipientName: 'Kevin Wijaya',
          recipientPhone: '081900112233',
          scheduledFor: todayStr,
          message: templates.PT_REMINDER_H2.replace(/{nama}/g, 'Kevin Wijaya').replace(/{gym_name}/g, 'GymPro Fitness').replace(/{trainer_name}/g, 'Coach Denny').replace(/{waktu_sesi}/g, '15:00 WIB'),
          status: 'PENDING',
          metadata: { ptSessionTime: '15:00', ptTrainerName: 'Coach Denny' }
        },
        {
          id: `DEMO-BDAY-01`,
          type: 'BIRTHDAY_VOUCHER',
          recipientId: 'M-004',
          recipientName: 'Dian Sastro',
          recipientPhone: '085711223344',
          scheduledFor: todayStr,
          message: templates.BIRTHDAY_VOUCHER.replace(/{nama}/g, 'Dian Sastro').replace(/{gym_name}/g, 'GymPro Fitness').replace(/{kode_voucher}/g, 'HBD-DIA2026'),
          status: 'PENDING',
          metadata: { voucherCode: 'HBD-DIA2026', voucherDiscount: '25%' }
        }
      );
    }

    if (generated.length > 0) {
      setTasks((prev) => [...generated, ...prev]);
      showToast?.('Antrian WhatsApp Diperbarui', `${generated.length} pesan otomatis berhasil dijadwalkan hari ini.`, 'success');
    } else {
      showToast?.('Sudah Tersinkronisasi', 'Semua pesan otomatis hari ini telah ada di daftar antrian.', 'info');
    }
  };

  // Run initial scan on mount if empty
  useEffect(() => {
    if (tasks.length === 0) {
      handleGenerateScheduledQueue();
    }
  }, []);

  const handleSendWhatsApp = (task: ScheduledWhatsAppTask) => {
    const formattedPhone = formatIndonesianWhatsAppNumber(task.recipientPhone);
    const encodedMsg = encodeURIComponent(task.message);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;

    // Mark as sent in state
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: 'SENT', sentAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } : t
      )
    );

    // Open WhatsApp Web or App
    window.open(waUrl, '_blank');
    showToast?.('WhatsApp Terbuka', `Membuka dialog kirim untuk ${task.recipientName}.`, 'success');
  };

  const handleBatchSendPending = () => {
    const pendingList = tasks.filter((t) => t.status === 'PENDING');
    if (pendingList.length === 0) {
      showToast?.('Tidak Ada Antrian', 'Semua pesan sudah terkirim.', 'info');
      return;
    }

    // Mark all as sent and open first one
    const first = pendingList[0];
    handleSendWhatsApp(first);

    // Simulate batch dispatch
    setTasks((prev) =>
      prev.map((t) => (t.status === 'PENDING' ? { ...t, status: 'SENT', sentAt: new Date().toLocaleTimeString('id-ID') } : t))
    );

    showToast?.('Batch Dispatch Berhasil', `${pendingList.length} pesan otomatis ditandai terkirim ke WhatsApp Gateway.`, 'success');
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchType = filterType === 'ALL' || task.type === filterType;
      const matchStatus = filterStatus === 'ALL' || task.status === filterStatus;
      const matchSearch =
        task.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.recipientPhone.includes(searchQuery) ||
        task.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
  }, [tasks, filterType, filterStatus, searchQuery]);

  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const sentCount = tasks.filter((t) => t.status === 'SENT').length;

  const getTypeBadge = (type: ScheduledNotificationType) => {
    switch (type) {
      case 'EXPIRY_H7':
        return {
          label: 'Masa Habis H-7',
          color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/50',
          icon: Calendar
        };
      case 'EXPIRY_H1':
        return {
          label: 'Masa Habis H-1 (Besok)',
          color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700/50',
          icon: AlertTriangle
        };
      case 'PT_REMINDER_H2':
        return {
          label: 'Pengingat Sesi PT (H-2 Jam)',
          color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700/50',
          icon: Clock
        };
      case 'BIRTHDAY_VOUCHER':
        return {
          label: 'Ulang Tahun & Voucher Promo',
          color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-700/50',
          icon: Cake
        };
      default:
        return {
          label: 'Notifikasi',
          color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
          icon: MessageSquare
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Otomasi WhatsApp Gateway Terjadwal
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700">
                    Auto-Trigger Active
                  </span>
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  Notifikasi otomatis H-7 & H-1 kedaluwarsa membership, pengingat sesi PT H-2 jam, dan voucher ulang tahun member.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerateScheduledQueue}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              Scan & Sinkron Antrian Hari Ini
            </button>

            <button
              onClick={handleBatchSendPending}
              disabled={pendingCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              Kirim Semua ({pendingCount} Pending)
            </button>
          </div>
        </div>

        {/* 4 Feature Triggers Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Membership H-7</span>
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {tasks.filter((t) => t.type === 'EXPIRY_H7').length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Pengingat perpanjangan awal (hemat 10%)</p>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Membership H-1</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {tasks.filter((t) => t.type === 'EXPIRY_H1').length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Masa aktif habis besok (urgent alert)</p>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Sesi PT H-2 Jam</span>
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {tasks.filter((t) => t.type === 'PT_REMINDER_H2').length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Konfirmasi & jadwal hadir personal trainer</p>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Ulang Tahun Hari Ini</span>
              <Cake className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {tasks.filter((t) => t.type === 'BIRTHDAY_VOUCHER').length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Ucapan selamat + voucher diskon 25%</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari member, nomor HP, atau isi pesan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {(['ALL', 'EXPIRY_H7', 'EXPIRY_H1', 'PT_REMINDER_H2', 'BIRTHDAY_VOUCHER'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filterType === t
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t === 'ALL'
                  ? 'Semua'
                  : t === 'EXPIRY_H7'
                  ? 'H-7'
                  : t === 'EXPIRY_H1'
                  ? 'H-1'
                  : t === 'PT_REMINDER_H2'
                  ? 'PT H-2'
                  : 'Ulang Tahun'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end">
          <button
            onClick={() => setFilterStatus(filterStatus === 'ALL' ? 'PENDING' : filterStatus === 'PENDING' ? 'SENT' : 'ALL')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <Filter className="w-3.5 h-3.5" />
            Status: {filterStatus === 'ALL' ? 'Semua' : filterStatus === 'PENDING' ? 'Pending Saja' : 'Terkirim Saja'}
          </button>

          <button
            onClick={() => setActiveTemplateType('EXPIRY_H7')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
            Kelola Template Pesan
          </button>
        </div>
      </div>

      {/* Task Queue List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Daftar Antrian Pesan ({filteredTasks.length} Pesan)
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {pendingCount} Pending • {sentCount} Terkirim
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-80" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">Tidak ada antrian pesan yang cocok.</p>
            <p className="text-xs mt-1">Klik tombol &ldquo;Scan &amp; Sinkron Antrian Hari Ini&rdquo; di atas untuk memperbarui.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTasks.map((task) => {
              const badge = getTypeBadge(task.type);
              const IconComp = badge.icon;
              const isSent = task.status === 'SENT';

              return (
                <div
                  key={task.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>

                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {task.recipientName}
                      </span>

                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {task.recipientPhone || 'No Phone'}
                      </span>

                      {isSent ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          <CheckCheck className="w-3.5 h-3.5" />
                          Terkirim ({task.sentAt || 'Hari Ini'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                          <Clock className="w-3.5 h-3.5" />
                          Menunggu Kirim
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 font-mono whitespace-pre-line leading-relaxed">
                      {task.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleSendWhatsApp(task)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isSent
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSent ? 'Kirim Ulang' : 'Kirim Sekarang'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {activeTemplateType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                Kelola Template Notifikasi WhatsApp
              </h3>
              <button
                onClick={() => setActiveTemplateType(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto">
              {(['EXPIRY_H7', 'EXPIRY_H1', 'PT_REMINDER_H2', 'BIRTHDAY_VOUCHER'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTemplateType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    activeTemplateType === t
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t === 'EXPIRY_H7'
                    ? 'Expiry H-7'
                    : t === 'EXPIRY_H1'
                    ? 'Expiry H-1'
                    : t === 'PT_REMINDER_H2'
                    ? 'PT H-2 Jam'
                    : 'Ulang Tahun'}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Isi Template Pesan (Mendukung parameter dinamis):
              </label>
              <textarea
                rows={7}
                value={templates[activeTemplateType]}
                onChange={(e) =>
                  setTemplates({ ...templates, [activeTemplateType]: e.target.value })
                }
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Variabel tersedia: <code className="text-emerald-600">{"{nama}"}</code>, <code className="text-emerald-600">{"{gym_name}"}</code>, <code className="text-emerald-600">{"{tanggal_expired}"}</code>, <code className="text-emerald-600">{"{trainer_name}"}</code>, <code className="text-emerald-600">{"{waktu_sesi}"}</code>, <code className="text-emerald-600">{"{kode_voucher}"}</code>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveTemplateType(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Simpan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
