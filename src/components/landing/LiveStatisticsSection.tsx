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
  Clock,
  MapPin,
  UserCheck,
  Filter
} from 'lucide-react';
import { Attendance } from '../../types';
import { APP_TODAY } from '../../utils/formatters';

interface LiveStatisticsSectionProps {
  memberCount: number;
  studioClassCount: number;
  trainerCount: number;
  branchCount: number;
  attendances?: Attendance[];
  onCtaClick: () => void;
}

export const LiveStatisticsSection: React.FC<LiveStatisticsSectionProps> = ({
  memberCount,
  studioClassCount,
  trainerCount,
  branchCount,
  attendances = [],
  onCtaClick
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Baru saja (Real-Time)');
  const [branchFilter, setBranchFilter] = useState<'ALL' | 'BR-001' | 'BR-002' | 'BR-003'>('ALL');

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
    }, 600);
  };

  // Calculations for real-time gym attendance
  const todayAttendances = attendances.filter((a) => a.date === APP_TODAY);
  const activeInGymMembers = todayAttendances.filter((a) => !a.timeOut || a.timeOut.trim() === '');
  const activeCount = activeInGymMembers.length;

  // Branch statistics
  const sudirmanActive = activeInGymMembers.filter(
    (a) => !a.branchId || a.branchId === 'BR-001' || a.branchName?.includes('Sudirman')
  );
  const senopatiActive = activeInGymMembers.filter(
    (a) => a.branchId === 'BR-002' || a.branchName?.includes('Senopati')
  );
  const bsdActive = activeInGymMembers.filter(
    (a) => a.branchId === 'BR-003' || a.branchName?.includes('BSD')
  );

  // Branch occupancy capacity estimations
  const sudirmanCap = 35;
  const senopatiCap = 30;
  const bsdCap = 25;
  const totalMaxCap = sudirmanCap + senopatiCap + bsdCap;
  const overallOccupancyPct = Math.min(100, Math.round((activeCount / totalMaxCap) * 100));

  // Determine overall vibe / crowd density
  let crowdStatusText = 'Suasana Sangat Nyaman & Lengang';
  let crowdStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (overallOccupancyPct > 70) {
    crowdStatusText = 'Kapasitas Ramai & Energik';
    crowdStatusColor = 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  } else if (overallOccupancyPct > 35) {
    crowdStatusText = 'Suasana Nyaman & Kondusif';
    crowdStatusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  }

  // Filtered attendance feed
  const filteredFeed = todayAttendances.filter((a) => {
    if (branchFilter === 'ALL') return true;
    if (branchFilter === 'BR-001') return !a.branchId || a.branchId === 'BR-001' || a.branchName?.includes('Sudirman');
    if (branchFilter === 'BR-002') return a.branchId === 'BR-002' || a.branchName?.includes('Senopati');
    if (branchFilter === 'BR-003') return a.branchId === 'BR-003' || a.branchName?.includes('BSD');
    return true;
  });

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
                  Sinkronisasi Database Presensi & ERP Real-Time
                </span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Statistik terhubung dinamis dengan data keanggotaan dan jadwal reservasi RFA ERP Enterprise. Terakhir diperbarui: <span className="text-zinc-300 font-mono">{lastSyncTime}</span>
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
        {/* LIVE GYM OCCUPANCY & ATTENDANCE MONITOR (INFO MEMBER SEDANG LATIHAN)      */}
        {/* ========================================================================= */}
        <div id="live-occupancy" className="scroll-mt-28 mb-16">
          <div className="rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header of Live Occupancy */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-zinc-800">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Live Crowd & Attendance Tracker</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  STATUS PRESENSI & KEPADATAN DI GYM HARI INI
                </h3>
                <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                  Pantau jumlah member yang sedang aktif latihan atau absen masuk di seluruh cabang RFA Gym secara transparan. Rencanakan jam latihan terbaik Anda agar tidak perlu antre peralatan.
                </p>
              </div>

              {/* Total Live Meter */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-5 shrink-0 shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
                      {activeCount}
                    </span>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Orang di Gym
                    </span>
                  </div>
                  <div className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold mt-1 ${crowdStatusColor}`}>
                    {crowdStatusText}
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Branch Density Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              {/* Branch 1: Sudirman */}
              <div className="p-6 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 hover:border-orange-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Flagship Hub
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] text-zinc-300 font-mono font-semibold">
                      Max {sudirmanCap}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">RFA Central Sudirman</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Menara Sudirman Lt. 2 (Jakarta Pusat)</p>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono tabular-nums">
                      {sudirmanActive.length}
                    </span>
                    <span className="text-xs text-zinc-400">Member Sedang Latihan</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Kepadatan Studio & Gym</span>
                      <span className="font-mono font-bold text-zinc-200">
                        {Math.round((sudirmanActive.length / sudirmanCap) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (sudirmanActive.length / sudirmanCap) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Area Aktif: Free Weight, Boxing</span>
                  <span className="text-emerald-400 font-semibold">Kondusif</span>
                </div>
              </div>

              {/* Branch 2: Senopati */}
              <div className="p-6 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 hover:border-orange-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Lifestyle Studio
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] text-zinc-300 font-mono font-semibold">
                      Max {senopatiCap}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">RFA Senopati Lifestyle</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Jl. Senopati No. 42 (Jakarta Selatan)</p>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono tabular-nums">
                      {senopatiActive.length}
                    </span>
                    <span className="text-xs text-zinc-400">Member Sedang Latihan</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Kepadatan Studio & Gym</span>
                      <span className="font-mono font-bold text-zinc-200">
                        {Math.round((senopatiActive.length / senopatiCap) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (senopatiActive.length / senopatiCap) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Area Aktif: Yoga, Pilates Reformer</span>
                  <span className="text-emerald-400 font-semibold">Sangat Lengang</span>
                </div>
              </div>

              {/* Branch 3: BSD City */}
              <div className="p-6 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 hover:border-orange-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Express Performance
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] text-zinc-300 font-mono font-semibold">
                      Max {bsdCap}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">RFA Express BSD City</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Ruko Foresta Business Loft 3 (BSD)</p>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono tabular-nums">
                      {bsdActive.length}
                    </span>
                    <span className="text-xs text-zinc-400">Member Sedang Latihan</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Kepadatan Studio & Gym</span>
                      <span className="font-mono font-bold text-zinc-200">
                        {Math.round((bsdActive.length / bsdCap) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (bsdActive.length / bsdCap) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Area Aktif: Turf Track, Sled Push</span>
                  <span className="text-emerald-400 font-semibold">Nyaman</span>
                </div>
              </div>
            </div>

            {/* Live Attendance Feed Section */}
            <div className="mt-8 pt-8 border-t border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    <span>Daftar Presensi & Absen Check-In Terkini di Gym</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Total kunjungan tercatat hari ini: <span className="font-mono font-bold text-zinc-200">{todayAttendances.length} sesi latihan</span>
                  </p>
                </div>

                {/* Filter Tabs by Branch */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800 self-start sm:self-auto overflow-x-auto">
                  <button
                    onClick={() => setBranchFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      branchFilter === 'ALL'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Semua Cabang
                  </button>
                  <button
                    onClick={() => setBranchFilter('BR-001')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      branchFilter === 'BR-001'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sudirman
                  </button>
                  <button
                    onClick={() => setBranchFilter('BR-002')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      branchFilter === 'BR-002'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Senopati
                  </button>
                  <button
                    onClick={() => setBranchFilter('BR-003')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      branchFilter === 'BR-003'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    BSD City
                  </button>
                </div>
              </div>

              {/* Attendance Table / Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredFeed.slice(0, 12).map((item) => {
                  const isStillInGym = !item.timeOut || item.timeOut.trim() === '';
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-zinc-700">
                          {item.memberName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate">{item.memberName}</h5>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span className="text-orange-400 font-semibold">{item.badge || item.type}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              {item.timeIn}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {isStillInGym ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Di Gym
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-medium border border-zinc-700">
                            Keluar ({item.timeOut})
                          </span>
                        )}
                        {item.lockerNumber && (
                          <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                            Loker #{item.lockerNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Banner */}
        <div className="mt-16 relative rounded-3xl overflow-hidden p-8 sm:p-12 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 shadow-2xl shadow-orange-500/20 text-white">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="text-xs font-bold tracking-widest uppercase text-amber-200 mb-2">
              Penawaran Khusus Member Baru
            </div>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              SIAP MENEMBUS BATAS ANDA HARI INI?
            </h3>
            <p className="mt-3 text-orange-100 text-sm sm:text-base leading-relaxed">
              Daftar online sekarang untuk klaim <strong>Free 1-Day All-Access Pass</strong> + Konsultasi Komposisi Tubuh InBody gratis bersama Master Coach RFA Gym.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={onCtaClick}
                className="px-8 py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-white font-extrabold text-sm flex items-center gap-2.5 shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <span>Klaim Free Pass & Reservasi</span>
                <ArrowRight className="w-4 h-4 text-orange-400" />
              </button>
              <span className="text-xs text-orange-100 font-medium">
                *Tanpa biaya tersembunyi & tanpa komitmen kartu kredit
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
