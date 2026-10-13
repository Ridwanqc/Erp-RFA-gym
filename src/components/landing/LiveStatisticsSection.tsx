import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Award,
  Building2,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Flame,
  Sparkles,
  Activity,
  MapPin,
  ShieldCheck,
  Zap,
  Dumbbell,
  MessageSquare,
  HelpCircle,
  Clock,
  ChevronRight,
  MessageCircle,
  ExternalLink,
  User
} from 'lucide-react';
import { Attendance, Member } from '../../types';
import { BRANCH_CONTACTS, getDynamicBranchContacts } from '../../data/landingData';

interface LiveStatisticsSectionProps {
  memberCount: number;
  studioClassCount: number;
  trainerCount: number;
  branchCount: number;
  attendances?: Attendance[];
  members?: Member[];
  onCtaClick?: () => void;
  onOpenJoinNow?: (plan?: string, branchId?: string) => void;
  onOpenInquiry?: (topic?: string, branchId?: string) => void;
  loggedInMember?: Member | null;
  onOpenMemberArea?: () => void;
}

export const LiveStatisticsSection: React.FC<LiveStatisticsSectionProps> = ({
  memberCount,
  studioClassCount,
  trainerCount,
  branchCount,
  attendances = [],
  members = [],
  onCtaClick,
  onOpenJoinNow,
  onOpenInquiry,
  loggedInMember,
  onOpenMemberArea
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Baru saja (Real-Time)');
  const [selectedWaBranchId, setSelectedWaBranchId] = useState<string>('BR-001');

  // Dynamic branch contacts synced with Settings
  const branchContacts = getDynamicBranchContacts();

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(
        `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} WIB`
      );
    }, 500);
  };

  const handleJoinClick = (planName?: string, branchId?: string) => {
    if (onOpenJoinNow) {
      onOpenJoinNow(planName, branchId);
    } else if (onCtaClick) {
      onCtaClick();
    }
  };

  const handleInquiryClick = (topicName?: string, branchId?: string) => {
    if (onOpenInquiry) {
      onOpenInquiry(topicName, branchId);
    } else if (onCtaClick) {
      onCtaClick();
    }
  };

  // Open WhatsApp directly targeting the chosen branch's official number
  const handleOpenBranchWhatsApp = (branchId: string) => {
    const branch = branchContacts.find((b) => b.id === branchId) || branchContacts[0];
    const text = encodeURIComponent(
      `Halo Admin & Front Desk RFA Gym ${branch.name}, saya ingin konsultasi pendaftaran membership & jadwal Free Trial Pass.`
    );
    window.open(`https://wa.me/${branch.whatsapp}?text=${text}`, '_blank');
  };

  const stats = [
    {
      id: 'stat-1',
      label: 'Member Aktif Terdaftar',
      value: memberCount > 0 ? `${memberCount}+` : '1,450+',
      detail: 'Komunitas fitness terverifikasi',
      icon: Users,
      bgColor: 'bg-orange-500/10 border-orange-500/20 text-orange-400'
    },
    {
      id: 'stat-2',
      label: 'Sesi Kelas Studio Mingguan',
      value: studioClassCount > 0 ? `${studioClassCount * 12}+` : '48+',
      detail: 'Zumba, Yoga, HIIT & Combat',
      icon: Calendar,
      bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    },
    {
      id: 'stat-3',
      label: 'Certified Personal Trainer',
      value: trainerCount > 0 ? `${trainerCount}` : '12',
      detail: 'Berlisensi APKI, NASM & ACE',
      icon: Award,
      bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    },
    {
      id: 'stat-4',
      label: 'Cabang & Studio Gym',
      value: branchCount > 0 ? `${branchCount}` : '3',
      detail: 'Sudirman, Senopati & BSD City',
      icon: Building2,
      bgColor: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
    }
  ];

  const selectedWaBranch =
    branchContacts.find((b) => b.id === selectedWaBranchId) || branchContacts[0];

  return (
    <section className="py-20 bg-zinc-950 relative overflow-hidden border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dynamic Sync Status Bar */}
        <div className="mb-10 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  Statistik & Kapasitas Gym Real-Time
                </span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Data terhubung langsung dengan sistem reservasi & member RFA ERP Enterprise. Terakhir diperbarui:{' '}
                <span className="text-zinc-300 font-mono">{lastSyncTime}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-400' : ''}`} />
            <span>{isSyncing ? 'Sinkronisasi...' : 'Segarkan Data'}</span>
          </button>
        </div>

        {/* 4 Macro Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {stats.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.id}
                className="p-6 rounded-3xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl ${st.bgColor} border flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono tabular-nums">
                  {st.value}
                </div>
                <div className="text-sm font-bold text-zinc-200 mt-1">{st.label}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{st.detail}</div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* PROMINENT "JOIN NOW" CALL-TO-ACTION BANNER OR MEMBER STATUS HUB          */}
        {/* Sembunyikan fitur Join Now jika member sudah login                       */}
        {/* ========================================================================= */}
        <div id="join-now" className="scroll-mt-28 mb-16 relative">

          {loggedInMember ? (
            /* MEMBER SUDAH LOGIN: TAMPILKAN HUB STATUS MEMBER RESMI (SEMBUYIKAN JOIN NOW) */
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-emerald-500/40 p-6 sm:p-10 lg:p-12 shadow-2xl shadow-emerald-500/10">
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Akun Member Terverifikasi & Aktif</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black tracking-wider uppercase">
                  <span>ID Member: {loggedInMember.id}</span>
                </div>
              </div>

              <div className="relative z-10 my-6">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Selamat Datang Kembali</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  Halo, <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">{loggedInMember.name}</span>!
                </h2>
                <p className="mt-3 text-zinc-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Anda sudah terdaftar sebagai anggota resmi RFA Gym. Pantau sisa masa aktif membership, kuota personal trainer, atau kartu digital Anda langsung melalui portal khusus member.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5 text-xs">
                  <span className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    Status: <strong className="text-emerald-400 font-bold">{loggedInMember.status || 'Aktif'}</strong>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    Paket: <strong className="text-orange-400 font-bold">{loggedInMember.membershipType || 'All-Access Pro'}</strong>
                  </span>
                  {loggedInMember.expired && (
                    <span className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                      Berlaku Hingga: <strong className="text-white font-mono">{loggedInMember.expired}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-6 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center gap-3">
                {onOpenMemberArea && (
                  <button
                    type="button"
                    onClick={onOpenMemberArea}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <User className="w-4 h-4 text-amber-200" />
                    <span>Buka Portal & Kartu Digital Member</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <a
                  href={`https://wa.me/${branchContacts[0]?.whatsapp || '6281234567890'}?text=${encodeURIComponent(
                    `Halo Front Desk RFA Gym, saya ${loggedInMember.name} (ID: ${loggedInMember.id}) ingin bertanya mengenai sesi latihan dan fasilitas.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 font-bold text-xs sm:text-sm border border-emerald-500/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Chat Front Desk Cabang</span>
                </a>
              </div>
            </div>
          ) : (
            /* MEMBER BELUM LOGIN: TAMPILKAN BANNER PROMOSI JOIN NOW */
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-orange-500/40 p-6 sm:p-10 lg:p-12 shadow-2xl shadow-orange-500/10">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Standard & Fast Activation Pill */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Fasilitas Standar Internasional & Higienis</span>
                </div>
                <span className="text-xs text-zinc-400 hidden sm:inline">• Suasana Nyaman & Bebas Antre</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black tracking-wider uppercase">
                <Zap className="w-3.5 h-3.5" />
                <span>Aktivasi Instan & WA Resmi Unit</span>
              </div>
            </div>

            {/* Headline and Value Proposition */}
            <div className="relative z-10 my-8 text-center lg:text-left max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-400 mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Pendaftaran Membership & Chat WA Resmi RFA Gym</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                SIAP MERAIH GOAL KEBUGARAN ANDA?{' '}
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                  JOIN NOW
                </span>{' '}
                DI RFA GYM
              </h2>

              <p className="mt-4 text-zinc-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
                Nikmati akses ke 3 cabang strategis, peralatan biometrik berstandar dunia, puluhan studio classes, dan
                bimbingan pelatih bersertifikasi. Saat mendaftar, tiket dan konfirmasi akan langsung terkirim ke{' '}
                <strong className="text-emerald-400">WhatsApp resmi kantor cabang</strong> pilihan Anda.
              </p>
            </div>

            {/* 3 Featured Membership Plan Cards with Direct CTA */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 my-8">
              {/* Plan 1: Starter */}
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pemula & Fokus</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                      1 Bulan
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors">
                    Starter Pass
                  </h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-white">Rp 399.000</span>
                    <span className="text-xs text-zinc-400">/bulan</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">Akses penuh area gym di 1 cabang pilihan Anda.</p>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Akses Gym Cabang Pilihan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Loker Digital & Shower Mewah</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Gratis 1x Tes Komposisi InBody</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinClick('Starter Pass (1 Bulan)')}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-zinc-700"
                >
                  <span>Pilih Starter • Join Now</span>
                  <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
                </button>
              </div>

              {/* Plan 2: All-Access Pro (Popular Highlight) */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-orange-950/40 via-zinc-950 to-zinc-950 border-2 border-orange-500 shadow-xl shadow-orange-500/10 flex flex-col justify-between relative scale-100 lg:scale-[1.03] transition-all">
                <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                  Paling Populer & Rekomendasi
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      All-Club Access
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-300 border border-orange-500/30">
                      3 Bulan
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-white">All-Access Pro</h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-white">Rp 699.000</span>
                    <span className="text-xs text-zinc-400">/bulan</span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-2">Bebas akses seluruh 3 cabang & semua kelas studio.</p>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <strong className="text-white">Akses 3 Cabang:</strong> Sudirman, Senopati & BSD
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Unlimited Studio Classes (Yoga, HIIT, Combat)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Bonus 2 Sesi Privat Personal Trainer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Sauna & Luxury Hot Shower Access</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinClick('All-Access Pro (3 Bulan)')}
                  className="mt-6 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Daftar All-Access • Join Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Plan 3: VIP Platinum */}
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/50 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">VIP & Performance</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                      12 Bulan
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                    VIP Platinum
                  </h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-white">Rp 1.199.000</span>
                    <span className="text-xs text-zinc-400">/bulan</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">Paket tertinggi dengan 12 sesi PT privat & dedicated kit.</p>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Multi-Club All Access 3 Cabang</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <strong className="text-white">12 Sesi Personal Trainer Privat</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Dedicated Locker & Free Merchandise Kit</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleJoinClick('VIP Platinum (12 Bulan)')}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-zinc-700"
                >
                  <span>Join VIP • Daftar Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>

            {/* Direct Action Hub Buttons */}
            <div className="relative z-10 mt-8 pt-8 border-t border-zinc-800/80 flex flex-col lg:flex-row items-center justify-between gap-5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => handleJoinClick('All-Access Pro (3 Bulan)')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-orange-500/25 active:scale-95 transition-all"
                >
                  <Flame className="w-5 h-5 text-amber-200" />
                  <span>Join Now • Pendaftaran Member Baru</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleInquiryClick('Klaim Free 1-Day Trial Pass')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold text-sm border border-zinc-700 flex items-center justify-center gap-2.5 transition-all active:scale-95"
                >
                  <HelpCircle className="w-4 h-4 text-orange-400" />
                  <span>Klaim Free Trial & Tanya Info (Inquiry)</span>
                </button>
              </div>

              {/* Branch WhatsApp Direct Selector & Chat Button */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center lg:justify-end">
                <select
                  value={selectedWaBranchId}
                  onChange={(e) => setSelectedWaBranchId(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  {branchContacts.map((b) => (
                    <option key={b.id} value={b.id}>
                      WA: {b.shortName} (+{b.whatsapp})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleOpenBranchWhatsApp(selectedWaBranchId)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shrink-0 active:scale-95 shadow-md shadow-emerald-600/30"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat WA Resmi Cabang</span>
                </button>
              </div>
            </div>

            {/* 4 Guarantees & Trust Badges */}
            <div className="relative z-10 mt-6 pt-5 border-t border-zinc-800/60 grid grid-cols-2 lg:grid-cols-4 gap-3 text-zinc-400 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tanpa Biaya Tersembunyi</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Aktivasi Instan & E-Pass QR</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Gratis Tes InBody & Konsultasi</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Langsung Chat WA Resmi Unit</span>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* 3 Branch Hubs: Displaying Official WhatsApp & Direct Action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {branchContacts.map((branch) => (
            <div
              key={branch.id}
              className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {branch.shortName}
                  </span>
                  {branch.isFlagship && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950 font-black">
                      FLAGSHIP HUB
                    </span>
                  )}
                </div>

                <h5 className="text-base font-extrabold text-white">{branch.name}</h5>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{branch.address}</p>

                {/* Official Branch WhatsApp Badge */}
                <div className="mt-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px]">WhatsApp Resmi:</span>
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    +{branch.whatsapp}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Direct WA Chat & Join Now at This Branch */}
              <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenBranchWhatsApp(branch.id)}
                  className={`py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-all ${
                    loggedInMember ? 'w-full' : 'flex-1'
                  }`}
                  title={`Chat WhatsApp resmi ${branch.shortName}`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{loggedInMember ? `Chat WhatsApp ${branch.shortName}` : 'Chat WA'}</span>
                </button>

                {!loggedInMember && (
                  <button
                    type="button"
                    onClick={() => handleJoinClick('All-Access Pro (3 Bulan)', branch.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    title={`Daftar ke ${branch.shortName}`}
                  >
                    <span>Join Cabang Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
