import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Clock,
  LogOut,
  Calendar,
  Download,
  Printer,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  Edit2,
  BarChart3
} from 'lucide-react';
import { User, StaffAttendance, ShiftType } from '../../types';
import { APP_TODAY, getTimestamp } from '../../utils/formatters';

interface AttendanceReportTabProps {
  staffUsers: User[];
  staffAttendance: StaffAttendance[];
  onStaffClock: (record: StaffAttendance) => void;
  onDeleteAttendance?: (id: string) => void;
  onOpenDashboard?: () => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const AttendanceReportTab: React.FC<AttendanceReportTabProps> = ({
  staffUsers,
  staffAttendance,
  onStaffClock,
  onDeleteAttendance,
  onOpenDashboard,
  showToast
}) => {
  // Filter states
  const [periodFilter, setPeriodFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('month');
  const [filterStaffId, setFilterStaffId] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick Clock In/Out state
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [quickClockNotes, setQuickClockNotes] = useState<string>('');

  // Modal manual attendance record
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingAtt, setEditingAtt] = useState<StaffAttendance | null>(null);

  const [formStaffId, setFormStaffId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(APP_TODAY);
  const [formShift, setFormShift] = useState<string>('Pagi');
  const [formTimeIn, setFormTimeIn] = useState<string>('06:00 WIB');
  const [formTimeOut, setFormTimeOut] = useState<string>('14:00 WIB');
  const [formStatus, setFormStatus] = useState<'Hadir' | 'Terlambat' | 'Izin' | 'Sakit' | 'Cuti' | 'Alpa' | 'Lembur'>('Hadir');
  const [formLateMinutes, setFormLateMinutes] = useState<number>(0);
  const [formOvertimeHours, setFormOvertimeHours] = useState<number>(0);
  const [formNotes, setFormNotes] = useState<string>('');

  // Check active session for selected staff today
  const activeStaffSession = useMemo(() => {
    if (!selectedStaffId) return null;
    return staffAttendance.find(
      (s) => (s.staffId === selectedStaffId || s.staffName === selectedStaffId) && s.date === APP_TODAY && !s.timeOut
    );
  }, [selectedStaffId, staffAttendance]);

  // Handle Quick Clock In / Out
  const handleQuickClock = (type: 'IN' | 'OUT') => {
    if (!selectedStaffId) {
      showToast('Peringatan', 'Silakan pilih karyawan terlebih dahulu.', 'warning');
      return;
    }

    const staff = staffUsers.find((s) => s.id === selectedStaffId);
    if (!staff) return;

    const timeNow = getTimestamp();

    if (type === 'IN') {
      if (activeStaffSession) {
        showToast('Peringatan', `${staff.name} sudah melakukan Clock IN hari ini (${activeStaffSession.timeIn}).`, 'warning');
        return;
      }

      // Check punctuality based on typical shift start
      const shift = staff.shift || 'Pagi';
      let isLate = false;
      let lateMin = 0;

      const [hours, minutes] = [new Date().getHours(), new Date().getMinutes()];
      const currentMinOfDay = hours * 60 + minutes;

      // Shift starts: Pagi 06:00 (360 min), Siang 10:00 (600 min), Malam 14:00 (840 min)
      const shiftStartMin = shift === 'Pagi' ? 360 : shift === 'Siang' ? 600 : 840;
      if (currentMinOfDay > shiftStartMin + 5) {
        isLate = true;
        lateMin = currentMinOfDay - shiftStartMin;
      }

      const newClock: StaffAttendance = {
        id: `SA-${Date.now().toString().slice(-6)}`,
        date: APP_TODAY,
        timeIn: timeNow,
        timeOut: '',
        staffId: staff.id,
        staffName: staff.name,
        shift: shift,
        status: isLate ? 'Terlambat' : 'Hadir',
        lateMinutes: lateMin,
        overtimeHours: 0,
        notes: quickClockNotes || (isLate ? `Terlambat ${lateMin} menit` : 'Tepat waktu'),
        location: 'Lobi Utama RFA Gym'
      };

      onStaffClock(newClock);
      showToast(
        'Clock IN Berhasil',
        `${staff.name} berhasil Clock IN pada ${timeNow} (${isLate ? `Terlambat ${lateMin} mnt` : 'Tepat waktu'}).`,
        isLate ? 'warning' : 'success'
      );
      setQuickClockNotes('');
    } else {
      if (!activeStaffSession) {
        showToast('Peringatan', `Tidak ditemukan sesi Clock IN aktif untuk ${staff.name} hari ini.`, 'warning');
        return;
      }

      // Check overtime
      const updated: StaffAttendance = {
        ...activeStaffSession,
        timeOut: timeNow,
        notes: quickClockNotes ? `${activeStaffSession.notes || ''} [Out: ${quickClockNotes}]`.trim() : activeStaffSession.notes
      };

      onStaffClock(updated);
      showToast('Clock OUT Berhasil', `${staff.name} telah Clock OUT pada ${timeNow}. Terima kasih atas dedikasinya!`, 'success');
      setQuickClockNotes('');
    }
  };

  // Filter attendance data
  const filteredAttendance = useMemo(() => {
    return staffAttendance.filter((att) => {
      // Period filter
      if (periodFilter === 'today' && att.date !== APP_TODAY) return false;
      if (periodFilter === 'yesterday') {
        const d = new Date(APP_TODAY + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        const yest = d.toISOString().split('T')[0];
        if (att.date !== yest) return false;
      }
      if (periodFilter === 'week') {
        const d = new Date(APP_TODAY + 'T00:00:00');
        d.setDate(d.getDate() - 7);
        const weekAgo = d.toISOString().split('T')[0];
        if (att.date < weekAgo || att.date > APP_TODAY) return false;
      }
      if (periodFilter === 'month') {
        const monthPrefix = APP_TODAY.substring(0, 7); // e.g. "2026-09"
        if (!att.date.startsWith(monthPrefix)) return false;
      }

      // Staff filter
      if (filterStaffId !== 'all') {
        if (att.staffId !== filterStaffId && att.staffName !== filterStaffId) return false;
      }

      // Shift filter
      if (filterShift !== 'all') {
        if (att.shift !== filterShift) return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        if ((att.status || 'Hadir') !== filterStatus) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = att.staffName.toLowerCase().includes(q);
        const matchDate = att.date.includes(q);
        const matchNotes = (att.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchDate && !matchNotes) return false;
      }

      return true;
    });
  }, [staffAttendance, periodFilter, filterStaffId, filterShift, filterStatus, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = filteredAttendance.length;
    const hadir = filteredAttendance.filter((a) => a.status === 'Hadir' || !a.status).length;
    const terlambat = filteredAttendance.filter((a) => a.status === 'Terlambat').length;
    const lembur = filteredAttendance.filter((a) => a.status === 'Lembur' || (a.overtimeHours && a.overtimeHours > 0)).length;
    const totalLateMinutes = filteredAttendance.reduce((acc, curr) => acc + (curr.lateMinutes || 0), 0);
    const totalOvertimeHours = filteredAttendance.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);

    const onTimeRate = total > 0 ? Math.round((hadir / total) * 100) : 100;

    return {
      total,
      hadir,
      terlambat,
      lembur,
      totalLateMinutes,
      totalOvertimeHours,
      onTimeRate
    };
  }, [filteredAttendance]);

  // Open manual add/edit modal
  const handleOpenManual = (att?: StaffAttendance) => {
    if (att) {
      setEditingAtt(att);
      setFormStaffId(att.staffId || '');
      setFormDate(att.date);
      setFormShift(att.shift || 'Pagi');
      setFormTimeIn(att.timeIn);
      setFormTimeOut(att.timeOut || '');
      setFormStatus((att.status as any) || 'Hadir');
      setFormLateMinutes(att.lateMinutes || 0);
      setFormOvertimeHours(att.overtimeHours || 0);
      setFormNotes(att.notes || '');
    } else {
      setEditingAtt(null);
      setFormStaffId(staffUsers[0]?.id || '');
      setFormDate(APP_TODAY);
      setFormShift('Pagi');
      setFormTimeIn('06:00 WIB');
      setFormTimeOut('14:00 WIB');
      setFormStatus('Hadir');
      setFormLateMinutes(0);
      setFormOvertimeHours(0);
      setFormNotes('');
    }
    setIsManualModalOpen(true);
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffUsers.find((s) => s.id === formStaffId);
    if (!staff) {
      showToast('Peringatan', 'Pilih karyawan.', 'warning');
      return;
    }

    const record: StaffAttendance = {
      id: editingAtt?.id || `SA-MANUAL-${Date.now().toString().slice(-5)}`,
      date: formDate,
      staffId: staff.id,
      staffName: staff.name,
      shift: formShift,
      timeIn: formTimeIn,
      timeOut: formTimeOut,
      status: formStatus,
      lateMinutes: Number(formLateMinutes) || 0,
      overtimeHours: Number(formOvertimeHours) || 0,
      notes: formNotes
    };

    onStaffClock(record);
    showToast('Tersimpan', `Data presensi ${staff.name} berhasil disimpan.`, 'success');
    setIsManualModalOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredAttendance.length === 0) {
      showToast('Peringatan', 'Tidak ada data presensi untuk diekspor.', 'warning');
      return;
    }

    const headers = [
      'ID Presensi',
      'Tanggal',
      'Nama Karyawan',
      'Posisi / Role',
      'Shift',
      'Jam Masuk (Clock In)',
      'Jam Pulang (Clock Out)',
      'Status Kehadiran',
      'Terlambat (Menit)',
      'Lembur (Jam)',
      'Catatan / Lokasi'
    ];

    const rows = filteredAttendance.map((a) => {
      const staff = staffUsers.find((s) => s.id === a.staffId || s.name === a.staffName);
      return [
        `"${a.id}"`,
        `"${a.date}"`,
        `"${a.staffName}"`,
        `"${staff?.roleName || '-'}"`,
        `"${a.shift}"`,
        `"${a.timeIn}"`,
        `"${a.timeOut || 'Belum Clock Out'}"`,
        `"${a.status || 'Hadir'}"`,
        `"${a.lateMinutes || 0}"`,
        `"${a.overtimeHours || 0}"`,
        `"${(a.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Presensi_Karyawan_${periodFilter}_${APP_TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export Berhasil', 'Laporan presensi karyawan berhasil diunduh format CSV.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. QUICK CLOCK-IN / CLOCK-OUT PANEL */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Presensi Cepat Karyawan (Live Clock IN / OUT)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pencatatan real-time kehadiran operasional dengan deteksi keterlambatan otomatis
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-zinc-950 px-3.5 py-1.5 rounded-xl border border-zinc-800 text-orange-400 font-bold">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Hari Ini: {APP_TODAY}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-4 items-end">
          {/* Staff selector */}
          <div className="md:col-span-4">
            <label className="block text-zinc-400 font-bold text-xs mb-1.5">Pilih Karyawan</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-medium"
            >
              <option value="">-- Pilih Nama Karyawan --</option>
              {staffUsers.map((s) => {
                const isClockedIn = staffAttendance.some(
                  (a) => (a.staffId === s.id || a.staffName === s.name) && a.date === APP_TODAY && !a.timeOut
                );
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.roleName}) {isClockedIn ? '🟢 Sedang Bertugas' : '⚪ Belum Masuk'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Notes / Tugas */}
          <div className="md:col-span-4">
            <label className="block text-zinc-400 font-bold text-xs mb-1.5">Catatan / Posisi Tugas (Opsional)</label>
            <input
              type="text"
              value={quickClockNotes}
              onChange={(e) => setQuickClockNotes(e.target.value)}
              placeholder="Contoh: Lobi Utama / Standby Kasir"
              className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Action buttons */}
          <div className="md:col-span-4 flex items-center gap-2">
            <button
              onClick={() => handleQuickClock('IN')}
              disabled={Boolean(activeStaffSession)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                activeStaffSession
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Clock IN
            </button>

            <button
              onClick={() => handleQuickClock('OUT')}
              disabled={!activeStaffSession}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                !activeStaffSession
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                  : 'bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black'
              }`}
            >
              <LogOut className="w-4 h-4" /> Clock OUT
            </button>
          </div>
        </div>

        {/* Selected staff live status notification */}
        {selectedStaffId && (
          <div className="mt-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeStaffSession ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'
                }`}
              />
              <span className="text-zinc-300">
                Status Hari Ini:{' '}
                <strong className={activeStaffSession ? 'text-emerald-400' : 'text-zinc-400'}>
                  {activeStaffSession ? `Aktif Bertugas (Clock IN: ${activeStaffSession.timeIn})` : 'Belum Melakukan Clock IN'}
                </strong>
              </span>
            </div>
            {activeStaffSession && (
              <span className="text-[11px] font-mono text-zinc-400">Shift: {activeStaffSession.shift}</span>
            )}
          </div>
        )}
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Total Kehadiran</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-white">{stats.total}</span>
            <span className="text-xs text-zinc-500">Record</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {stats.hadir} Hadir Normal
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Tingkat Disiplin</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{stats.onTimeRate}%</span>
            <span className="text-xs text-zinc-500">Tepat Waktu</span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-400 font-mono">
            {stats.terlambat} Kali Terlambat
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Keterlambatan</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-rose-400">{stats.totalLateMinutes}</span>
            <span className="text-xs text-zinc-500">Menit Total</span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-400 font-mono">
            Kompensasi toleransi 5 mnt
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Lembur (Overtime)</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-black text-purple-400">
              {stats.totalOvertimeHours.toFixed(1)}
            </span>
            <span className="text-xs text-zinc-500">Jam Total</span>
          </div>
          <div className="mt-2 text-[10px] text-purple-400/90 font-mono">
            Terekam dalam slip gaji
          </div>
        </div>
      </div>

      {/* BANNER SHORTCUT TO RECHARTS DASHBOARD */}
      {onOpenDashboard && (
        <div className="bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-zinc-900 border border-orange-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                Dashboard Visualisasi Performa & Jam Lembur Karyawan
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  Recharts
                </span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Tersedia grafik batang interaktif untuk membandingkan rasio ketepatan waktu hadir dan total akumulasi lembur staf.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDashboard}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-zinc-950 transition shrink-0 shadow-md font-black"
          >
            <BarChart3 className="w-4 h-4" />
            Buka Dashboard Grafik
          </button>
        </div>
      )}

      {/* 3. FILTERS & CONTROLS */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Period Selector */}
        <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setPeriodFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              periodFilter === 'today' ? 'bg-orange-500 text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriodFilter('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              periodFilter === 'yesterday' ? 'bg-orange-500 text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Kemarin
          </button>
          <button
            onClick={() => setPeriodFilter('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              periodFilter === 'week' ? 'bg-orange-500 text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setPeriodFilter('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              periodFilter === 'month' ? 'bg-orange-500 text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Bulan Ini (Sep 2026)
          </button>
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              periodFilter === 'all' ? 'bg-orange-500 text-zinc-950 shadow-md font-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Semua
          </button>
        </div>

        {/* Search & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Staff filter */}
          <select
            value={filterStaffId}
            onChange={(e) => setFilterStaffId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="all">Semua Karyawan</option>
            {staffUsers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="all">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Terlambat">Terlambat</option>
            <option value="Lembur">Lembur</option>
            <option value="Izin">Izin / Cuti</option>
          </select>

          <button
            onClick={() => handleOpenManual()}
            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Koreksi Presensi
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </button>

          <button
            onClick={() => {
              window.print();
              showToast('Cetak Laporan', 'Laporan rekap presensi siap dicetak.', 'info');
            }}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
            title="Cetak Laporan"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" /> Print
          </button>
        </div>
      </div>

      {/* 4. ATTENDANCE REPORT TABLE */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <table className="w-full text-left whitespace-nowrap min-w-[850px]">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Nama Karyawan</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Keterlambatan</th>
                <th className="py-3 px-4">Catatan / Lokasi</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((att) => {
                  const staff = staffUsers.find((s) => s.id === att.staffId || s.name === att.staffName);
                  const isLate = (att.lateMinutes && att.lateMinutes > 0) || att.status === 'Terlambat';
                  const isOvertime = att.status === 'Lembur' || (att.overtimeHours && att.overtimeHours > 0);

                  return (
                    <tr key={att.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4 font-mono text-zinc-300">{att.date}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-white text-xs">{att.staffName}</p>
                        <p className="text-[10px] text-zinc-500">{staff?.roleName || 'Staf Operasional'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          {att.shift}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold font-mono">{att.timeIn}</td>
                      <td className="py-3 px-4 font-mono">
                        {att.timeOut ? (
                          <span className="text-zinc-300 font-semibold">{att.timeOut}</span>
                        ) : (
                          <span className="text-orange-400 font-bold animate-pulse">Sedang Bertugas</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isLate
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : isOvertime
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {att.status || 'Hadir'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {att.lateMinutes && att.lateMinutes > 0 ? (
                          <span className="text-rose-400 font-bold">+{att.lateMinutes} mnt</span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px] max-w-[200px] truncate" title={att.notes}>
                        {att.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenManual(att)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
                            title="Koreksi Data"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {onDeleteAttendance && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus catatan presensi ${att.staffName} pada ${att.date}?`)) {
                                  onDeleteAttendance(att.id);
                                }
                              }}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500 text-xs italic">
                    Tidak ada catatan presensi yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: MANUAL ATTENDANCE / KOREKSI PRESENSI */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 my-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-orange-500" />
                {editingAtt ? 'Koreksi Data Presensi Karyawan' : 'Input Manual Presensi Karyawan'}
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-4 pt-4 text-xs">
              {/* Karyawan */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Nama Karyawan</label>
                <select
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500"
                  required
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.roleName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Shift */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Shift</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Pagi">Pagi (06:00 - 14:00)</option>
                    <option value="Siang">Siang (10:00 - 18:00)</option>
                    <option value="Malam">Malam (14:00 - 22:00)</option>
                  </select>
                </div>
              </div>

              {/* Clock In & Clock Out */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Jam Masuk (Clock In)</label>
                  <input
                    type="text"
                    value={formTimeIn}
                    onChange={(e) => setFormTimeIn(e.target.value)}
                    placeholder="06:00 WIB"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Jam Pulang (Clock Out)</label>
                  <input
                    type="text"
                    value={formTimeOut}
                    onChange={(e) => setFormTimeOut(e.target.value)}
                    placeholder="14:00 WIB"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Status & Keterlambatan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Status Presensi</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Lembur">Lembur</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Cuti">Cuti</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Keterlambatan (Menit)</label>
                  <input
                    type="number"
                    min={0}
                    value={formLateMinutes}
                    onChange={(e) => setFormLateMinutes(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Lembur & Catatan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Lembur (Jam)</label>
                  <input
                    type="number"
                    step="0.25"
                    min={0}
                    value={formOvertimeHours}
                    onChange={(e) => setFormOvertimeHours(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Catatan Koreksi</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Contoh: Koreksi lupa clock in"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black rounded-xl shadow-md transition"
                >
                  {editingAtt ? 'Simpan Koreksi' : 'Tambahkan Log Presensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
