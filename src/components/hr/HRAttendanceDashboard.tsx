import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  BarChart3,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Download,
  Filter,
  Users,
  Calendar,
  Award,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Flame,
  Briefcase,
  HelpCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { User, StaffAttendance, WorkSchedule, LeaveRequest } from '../../types';
import { formatRp, APP_TODAY, formatDateIndo } from '../../utils/formatters';

interface HRAttendanceDashboardProps {
  staffUsers: User[];
  staffAttendance: StaffAttendance[];
  workSchedules?: WorkSchedule[];
  leaveRequests?: LeaveRequest[];
  onNavigateTab?: (tab: 'roster' | 'attendance' | 'directory' | 'leave' | 'payroll') => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const HRAttendanceDashboard: React.FC<HRAttendanceDashboardProps> = ({
  staffUsers,
  staffAttendance,
  workSchedules = [],
  leaveRequests = [],
  onNavigateTab,
  showToast
}) => {
  // Filters
  const [periodFilter, setPeriodFilter] = useState<'month' | '14days' | '7days' | 'all'>('month');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [chartType, setChartType] = useState<'stacked' | 'grouped'>('stacked');
  const [overtimeSort, setOvertimeSort] = useState<'highest' | 'name'>('highest');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Rate lembur per jam standar
  const OVERTIME_RATE_PER_HOUR = 25000;

  // Filter attendance data by period
  const filteredAttendance = useMemo(() => {
    return staffAttendance.filter((att) => {
      // Period filter
      if (periodFilter === '7days') {
        const d = new Date(att.date);
        const ref = new Date(APP_TODAY);
        const diffDays = Math.floor((ref.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (periodFilter === '14days') {
        const d = new Date(att.date);
        const ref = new Date(APP_TODAY);
        const diffDays = Math.floor((ref.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > 14) return false;
      } else if (periodFilter === 'month') {
        // Current month (same YYYY-MM as APP_TODAY)
        const currentMonth = APP_TODAY.substring(0, 7);
        if (!att.date.startsWith(currentMonth)) return false;
      }

      // Staff filter
      if (selectedStaffId !== 'all') {
        if (att.staffId !== selectedStaffId && att.staffName !== selectedStaffId) {
          return false;
        }
      }

      // Role filter
      if (selectedRole !== 'all') {
        const staff = staffUsers.find((s) => s.id === att.staffId || s.name === att.staffName);
        if (!staff || staff.role !== selectedRole) {
          return false;
        }
      }

      return true;
    });
  }, [staffAttendance, periodFilter, selectedStaffId, selectedRole, staffUsers]);

  // Aggregate Metrics per Staff
  const staffPerformanceData = useMemo(() => {
    // Map of all active staff
    const map = new Map<string, {
      staffId: string;
      name: string;
      role: string;
      roleName: string;
      shift: string;
      photo?: string;
      totalRecords: number;
      onTimeCount: number;
      lateCount: number;
      overtimeCount: number;
      totalLateMinutes: number;
      totalOvertimeHours: number;
      permissionCount: number;
      absentCount: number;
    }>();

    // Initialize with all relevant staff
    staffUsers.forEach((staff) => {
      if (selectedRole !== 'all' && staff.role !== selectedRole) return;
      if (selectedStaffId !== 'all' && staff.id !== selectedStaffId && staff.name !== selectedStaffId) return;

      map.set(staff.id, {
        staffId: staff.id,
        name: staff.name,
        role: staff.role,
        roleName: staff.roleName || staff.role,
        shift: staff.shift || 'Pagi',
        photo: staff.photo,
        totalRecords: 0,
        onTimeCount: 0,
        lateCount: 0,
        overtimeCount: 0,
        totalLateMinutes: 0,
        totalOvertimeHours: 0,
        permissionCount: 0,
        absentCount: 0
      });
    });

    // Populate with attendance records
    filteredAttendance.forEach((att) => {
      // Match staff
      let key = att.staffId;
      if (!key || !map.has(key)) {
        const found = staffUsers.find((s) => s.name === att.staffName);
        if (found) key = found.id;
      }

      if (!key || !map.has(key)) return;

      const record = map.get(key)!;
      record.totalRecords += 1;

      const status = att.status || (att.lateMinutes && att.lateMinutes > 0 ? 'Terlambat' : 'Hadir');
      const ot = att.overtimeHours || 0;
      const late = att.lateMinutes || 0;

      record.totalOvertimeHours += ot;
      if (ot > 0) record.overtimeCount += 1;

      record.totalLateMinutes += late;

      if (status === 'Terlambat' || late > 0) {
        record.lateCount += 1;
      } else if (status === 'Izin' || status === 'Sakit' || status === 'Cuti') {
        record.permissionCount += 1;
      } else if (status === 'Alpa') {
        record.absentCount += 1;
      } else {
        // Hadir atau Lembur yang tidak terlambat
        record.onTimeCount += 1;
      }
    });

    return Array.from(map.values()).map((item) => {
      const punctualityRate = item.totalRecords > 0
        ? Math.round((item.onTimeCount / item.totalRecords) * 100)
        : 100;
      const overtimePayEst = Math.round(item.totalOvertimeHours * OVERTIME_RATE_PER_HOUR);

      let disciplineGrade: 'A+' | 'A' | 'B' | 'C' = 'A+';
      if (punctualityRate >= 95 && item.totalLateMinutes <= 15) disciplineGrade = 'A+';
      else if (punctualityRate >= 85) disciplineGrade = 'A';
      else if (punctualityRate >= 70) disciplineGrade = 'B';
      else disciplineGrade = 'C';

      return {
        ...item,
        punctualityRate,
        overtimePayEst,
        disciplineGrade,
        displayName: item.name.length > 12 ? item.name.split(' ')[0] + ' ' + (item.name.split(' ')[1]?.charAt(0) || '') + '.' : item.name
      };
    });
  }, [staffUsers, filteredAttendance, selectedRole, selectedStaffId]);

  // Overall KPI Summaries
  const kpiTotals = useMemo(() => {
    const totalStaffCount = staffPerformanceData.length;
    const totalAttendanceDays = filteredAttendance.length;
    const totalOvertimeHours = Number(
      staffPerformanceData.reduce((acc, curr) => acc + curr.totalOvertimeHours, 0).toFixed(2)
    );
    const totalOvertimeCost = totalOvertimeHours * OVERTIME_RATE_PER_HOUR;
    const totalLateMinutes = staffPerformanceData.reduce((acc, curr) => acc + curr.totalLateMinutes, 0);

    const totalOnTime = staffPerformanceData.reduce((acc, curr) => acc + curr.onTimeCount, 0);
    const totalLates = staffPerformanceData.reduce((acc, curr) => acc + curr.lateCount, 0);
    const overallPunctuality = totalAttendanceDays > 0
      ? Math.round((totalOnTime / totalAttendanceDays) * 100)
      : 100;

    // Find top performer and top overtime staff
    const sortedByPunctuality = [...staffPerformanceData]
      .filter((s) => s.totalRecords > 0)
      .sort((a, b) => b.punctualityRate - a.punctualityRate || a.totalLateMinutes - b.totalLateMinutes);
    const topPunctualStaff = sortedByPunctuality[0] || null;

    const sortedByOvertime = [...staffPerformanceData].sort((a, b) => b.totalOvertimeHours - a.totalOvertimeHours);
    const topOvertimeStaff = sortedByOvertime[0]?.totalOvertimeHours > 0 ? sortedByOvertime[0] : null;

    return {
      totalStaffCount,
      totalAttendanceDays,
      totalOvertimeHours,
      totalOvertimeCost,
      totalLateMinutes,
      totalOnTime,
      totalLates,
      overallPunctuality,
      topPunctualStaff,
      topOvertimeStaff
    };
  }, [staffPerformanceData, filteredAttendance]);

  // Chart Data: Attendance Performance by Staff
  const chartAttendanceData = useMemo(() => {
    return staffPerformanceData.map((s) => ({
      staffId: s.staffId,
      name: s.displayName,
      fullName: s.name,
      role: s.roleName,
      'Tepat Waktu': s.onTimeCount,
      'Terlambat': s.lateCount,
      'Izin/Cuti': s.permissionCount,
      'Alpa': s.absentCount,
      total: s.totalRecords,
      rate: s.punctualityRate,
      lateMinutes: s.totalLateMinutes
    }));
  }, [staffPerformanceData]);

  // Chart Data: Overtime Hours by Staff (Sorted according to user selection)
  const chartOvertimeData = useMemo(() => {
    const data = staffPerformanceData.map((s) => ({
      staffId: s.staffId,
      name: s.displayName,
      fullName: s.name,
      role: s.roleName,
      hours: Number(s.totalOvertimeHours.toFixed(2)),
      cost: s.overtimePayEst,
      overtimeDays: s.overtimeCount,
      rate: s.punctualityRate
    }));

    if (overtimeSort === 'highest') {
      return data.sort((a, b) => b.hours - a.hours);
    }
    return data.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [staffPerformanceData, overtimeSort]);

  // Chart Data: Daily Overtime & Late Minutes Trend
  const chartDailyTrendData = useMemo(() => {
    const dateMap = new Map<string, { date: string; label: string; overtime: number; late: number; count: number }>();

    // Collect dates in chronological order
    const sortedRecords = [...filteredAttendance].sort((a, b) => a.date.localeCompare(b.date));
    sortedRecords.forEach((att) => {
      if (!dateMap.has(att.date)) {
        const parts = att.date.split('-');
        const shortLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : att.date;
        dateMap.set(att.date, {
          date: att.date,
          label: shortLabel,
          overtime: 0,
          late: 0,
          count: 0
        });
      }
      const entry = dateMap.get(att.date)!;
      entry.overtime += att.overtimeHours || 0;
      entry.late += att.lateMinutes || 0;
      entry.count += 1;
    });

    return Array.from(dateMap.values()).map((d) => ({
      ...d,
      overtime: Number(d.overtime.toFixed(2)),
      late: d.late
    }));
  }, [filteredAttendance]);

  // Filtered table rows
  const filteredTableData = useMemo(() => {
    return staffPerformanceData.filter((s) => {
      if (!tableSearch) return true;
      const q = tableSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.roleName.toLowerCase().includes(q) ||
        s.shift.toLowerCase().includes(q)
      );
    });
  }, [staffPerformanceData, tableSearch]);

  // Export CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'ID Staf',
        'Nama Karyawan',
        'Jabatan',
        'Shift Default',
        'Total Hari Presensi',
        'Tepat Waktu',
        'Terlambat',
        'Total Menit Terlambat',
        'Total Jam Lembur',
        'Estimasi Uang Lembur (Rp)',
        'Tingkat Disiplin (%)',
        'Grade'
      ];

      const rows = staffPerformanceData.map((s) => [
        s.staffId,
        `"${s.name}"`,
        `"${s.roleName}"`,
        s.shift,
        s.totalRecords,
        s.onTimeCount,
        s.lateCount,
        s.totalLateMinutes,
        s.totalOvertimeHours.toFixed(2),
        s.overtimePayEst,
        `${s.punctualityRate}%`,
        s.disciplineGrade
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Laporan_Performa_Absensi_Lembur_${APP_TODAY}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Export Berhasil', 'Berkas CSV analitik absensi dan lembur berhasil diunduh.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Gagal Export', 'Terjadi kesalahan saat mengekspor data CSV.', 'error');
    }
  };

  // Custom Tooltip for Attendance Chart
  const CustomAttendanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px]">
          <div className="font-bold text-white border-b border-zinc-800 pb-1.5 flex justify-between items-center">
            <span>{data.fullName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-semibold">
              {data.role}
            </span>
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-emerald-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Tepat Waktu:
              </span>
              <span className="font-bold">{data['Tepat Waktu']} Hari</span>
            </div>
            <div className="flex justify-between items-center text-amber-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Terlambat:
              </span>
              <span className="font-bold">{data['Terlambat']} Hari ({data.lateMinutes} mnt)</span>
            </div>
            {data['Izin/Cuti'] > 0 && (
              <div className="flex justify-between items-center text-sky-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  Izin / Cuti:
                </span>
                <span className="font-bold">{data['Izin/Cuti']} Hari</span>
              </div>
            )}
            {data['Alpa'] > 0 && (
              <div className="flex justify-between items-center text-rose-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Alpa:
                </span>
                <span className="font-bold">{data['Alpa']} Hari</span>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-[11px]">
            <span className="text-zinc-400">Skor Ketepatan:</span>
            <span className={`font-black ${data.rate >= 90 ? 'text-emerald-400' : data.rate >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
              {data.rate}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Overtime Chart
  const CustomOvertimeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[210px]">
          <div className="font-bold text-white border-b border-zinc-800 pb-1.5 flex justify-between items-center">
            <span>{data.fullName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-semibold">
              {data.role}
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-purple-300">
              <span>Total Jam Lembur:</span>
              <span className="font-black text-sm text-purple-400">{data.hours} Jam</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Frekuensi Lembur:</span>
              <span className="font-semibold text-white">{data.overtimeDays} Hari Bertugas</span>
            </div>
            <div className="flex justify-between items-center text-emerald-400 pt-1 border-t border-zinc-800/80">
              <span>Estimasi Uang Lembur:</span>
              <span className="font-black text-emerald-400">{formatRp(data.cost)}</span>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 italic pt-1">
            *Dihitung tarif Rp 25.000 / jam
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER CONTROLS & FILTER BAR */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Dashboard Analitik Presensi & Jam Lembur Karyawan
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Visualisasi performa kedisiplinan absensi, rasio ketepatan waktu, dan akumulasi jam kerja lembur
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition shadow-sm"
              title="Unduh Rekap CSV"
            >
              <Download className="w-3.5 h-3.5 text-orange-400" />
              Export CSV
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('attendance')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-zinc-950 transition shadow-md shadow-orange-500/20"
              >
                <Eye className="w-3.5 h-3.5" />
                Buka Rekap Presensi
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-zinc-800">
          {/* Period Filter */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-orange-400" />
              Periode Laporan
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="month">Bulan Ini ({formatDateIndo(APP_TODAY).split(' ').slice(1).join(' ')})</option>
              <option value="14days">14 Hari Terakhir</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="all">Semua Riwayat Data</option>
            </select>
          </div>

          {/* Role / Division Filter */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-orange-400" />
              Divisi / Jabatan
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">Semua Divisi & Jabatan</option>
              <option value="kasir">Divisi Kasir & Front Desk (Layanan & POS)</option>
              <option value="trainer">Divisi Pelatihan - Personal Trainer (PT)</option>
              <option value="leader_pt">Divisi Pelatihan - Leader PT & Coach</option>
              <option value="admin">Divisi Manajemen - Admin & Operasional</option>
              <option value="manager">Divisi Manajemen - Manager</option>
            </select>
          </div>

          {/* Specific Staff Filter */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block flex items-center gap-1">
              <Users className="w-3 h-3 text-orange-400" />
              Karyawan Tertentu
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">Semua Karyawan ({staffUsers.length})</option>
              {staffUsers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.roleName || s.role})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Info / Reset */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setPeriodFilter('month');
                setSelectedRole('all');
                setSelectedStaffId('all');
                showToast('Filter Direset', 'Menampilkan data default bulan ini.', 'info');
              }}
              className="w-full bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 rounded-xl px-3 py-2 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Punctuality Rate */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tingkat Disiplin</p>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {kpiTotals.overallPunctuality}%
            </span>
            <span className="text-xs font-bold text-emerald-400">Tepat Waktu</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {kpiTotals.totalOnTime} hadir on-time dari {kpiTotals.totalAttendanceDays} catatan presensi
          </p>
          <div className="mt-3 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpiTotals.overallPunctuality)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Total Overtime Hours */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Jam Lembur</p>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-400 tracking-tight">
              {kpiTotals.totalOvertimeHours}
            </span>
            <span className="text-xs font-bold text-zinc-300">Jam Terakumulasi</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            Biaya upah: <span className="text-emerald-400 font-bold">{formatRp(kpiTotals.totalOvertimeCost)}</span>
          </p>
          <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
            <span>Tarif Dasar:</span>
            <span className="font-semibold text-zinc-300">Rp 25.000 / jam</span>
          </div>
        </div>

        {/* Card 3: Total Late Minutes */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Keterlambatan</p>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
              {kpiTotals.totalLateMinutes}
            </span>
            <span className="text-xs font-bold text-zinc-300">Menit Total</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Terjadi pada {kpiTotals.totalLates} sesi kerja karyawan
          </p>
          <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
            <span>Rata-rata terlambat:</span>
            <span className="font-semibold text-zinc-300">
              {kpiTotals.totalLates > 0 ? Math.round(kpiTotals.totalLateMinutes / kpiTotals.totalLates) : 0} mnt / kejadian
            </span>
          </div>
        </div>

        {/* Card 4: Top Performer & Lembur */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex justify-between items-start">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Top Performer</p>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Paling Disiplin:</span>
              <span className="font-bold text-white truncate max-w-[130px]" title={kpiTotals.topPunctualStaff?.name || '-'}>
                {kpiTotals.topPunctualStaff?.name || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Jam Lembur Tertinggi:</span>
              <span className="font-bold text-purple-400 truncate max-w-[130px]" title={kpiTotals.topOvertimeStaff?.name || '-'}>
                {kpiTotals.topOvertimeStaff ? `${kpiTotals.topOvertimeStaff.name} (${kpiTotals.topOvertimeStaff.totalOvertimeHours}j)` : '-'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
            <span>Total Karyawan Aktif:</span>
            <span className="font-bold text-white">{kpiTotals.totalStaffCount} Personel</span>
          </div>
        </div>
      </div>

      {/* 3. DUAL BAR CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: ATTENDANCE PERFORMANCE BAR CHART */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Performa Kehadiran Karyawan
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Perbandingan kehadiran tepat waktu vs keterlambatan per staf
              </p>
            </div>

            {/* Chart Mode Toggle */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setChartType('stacked')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  chartType === 'stacked'
                    ? 'bg-orange-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Stacked
              </button>
              <button
                onClick={() => setChartType('grouped')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  chartType === 'grouped'
                    ? 'bg-orange-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Grouped
              </button>
            </div>
          </div>

          {/* Recharts Container */}
          <div className="h-72 sm:h-80 w-full mt-2">
            {chartAttendanceData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
                <AlertTriangle className="w-8 h-8 text-zinc-600 mb-2" />
                Tidak ada data absensi untuk filter yang dipilih
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartAttendanceData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomAttendanceTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                  />
                  <Bar
                    dataKey="Tepat Waktu"
                    name="Tepat Waktu"
                    fill="#10b981"
                    stackId={chartType === 'stacked' ? 'a' : undefined}
                    radius={chartType === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Terlambat"
                    name="Terlambat"
                    fill="#f59e0b"
                    stackId={chartType === 'stacked' ? 'a' : undefined}
                    radius={chartType === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                  />
                  {chartAttendanceData.some((d) => d['Izin/Cuti'] > 0) && (
                    <Bar
                      dataKey="Izin/Cuti"
                      name="Izin / Cuti"
                      fill="#38bdf8"
                      stackId={chartType === 'stacked' ? 'a' : undefined}
                      radius={chartType === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Hijau: Kehadiran tepat waktu
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Kuning: Terlambat hadir
            </span>
          </div>
        </div>

        {/* CHART 2: OVERTIME HOURS (TOTAL JAM LEMBUR) BAR CHART */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Total Jam Kerja Lembur (Overtime)
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Akumulasi jam lembur per staf dan estimasi beban biaya lembur
              </p>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setOvertimeSort('highest')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  overtimeSort === 'highest'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tertinggi
              </button>
              <button
                onClick={() => setOvertimeSort('name')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  overtimeSort === 'name'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Nama
              </button>
            </div>
          </div>

          {/* Recharts Container */}
          <div className="h-72 sm:h-80 w-full mt-2">
            {chartOvertimeData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
                <AlertTriangle className="w-8 h-8 text-zinc-600 mb-2" />
                Tidak ada data lembur untuk filter yang dipilih
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartOvertimeData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit=" jam"
                  />
                  <Tooltip content={<CustomOvertimeTooltip />} />
                  <ReferenceLine
                    y={3}
                    stroke="#a855f7"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Batas 3 Jam',
                      fill: '#c084fc',
                      fontSize: 10,
                      position: 'top'
                    }}
                  />
                  <Bar
                    dataKey="hours"
                    name="Jam Lembur"
                    fill="#a855f7"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartOvertimeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.hours >= 3 ? '#a855f7' : entry.hours > 0 ? '#8b5cf6' : '#3f3f46'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Ungu: Jam kerja lembur staf
            </span>
            <span className="text-zinc-400">
              Total Lembur: <strong className="text-purple-400">{kpiTotals.totalOvertimeHours} Jam</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 4. DAILY OVERTIME & LATE MINUTES TREND CHART */}
      {chartDailyTrendData.length > 1 && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                Tren Harian Jam Lembur & Menit Keterlambatan
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pola persebaran waktu lembur dan jam kedatangan staf per tanggal
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
              {chartDailyTrendData.length} Hari Terdata
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDailyTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'Jam Lembur' ? `${value} Jam` : `${value} Menit`,
                    name
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload[0]?.payload;
                    return item ? `Tanggal: ${formatDateIndo(item.date)}` : label;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />
                <Bar
                  dataKey="overtime"
                  name="Jam Lembur"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="late"
                  name="Menit Terlambat"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 5. DETAILED LEADERBOARD & PERFORMANCE TABLE */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              Matriks Kinerja Absensi & Rincian Lembur Karyawan
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tabel rekapitulasi individual kedisiplinan, jam kerja lembur, dan hak uang lembur
            </p>
          </div>

          {/* Table Search */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari staf / jabatan..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800 scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800">
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Jabatan & Shift</th>
                <th className="py-3 px-3 text-center">Presensi</th>
                <th className="py-3 px-3 text-center">Tepat Waktu</th>
                <th className="py-3 px-3 text-center">Terlambat</th>
                <th className="py-3 px-3 text-center">Jam Lembur</th>
                <th className="py-3 px-4 text-right">Uang Lembur (Rp)</th>
                <th className="py-3 px-4 text-center">Skor Disiplin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredTableData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    Tidak ditemukan data karyawan sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredTableData.map((staff) => (
                  <tr key={staff.staffId} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-black text-orange-400 overflow-hidden shrink-0">
                          {staff.photo ? (
                            <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            staff.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{staff.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">ID: {staff.staffId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-xs text-zinc-200 font-medium">{staff.roleName}</p>
                      <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        staff.shift === 'Pagi'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : staff.shift === 'Siang'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : staff.shift === 'Malam'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        Shift: {staff.shift}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-white">
                      {staff.totalRecords} Hari
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-400">
                      {staff.onTimeCount}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {staff.lateCount > 0 ? (
                        <span className="text-amber-400 font-bold">
                          {staff.lateCount} ({staff.totalLateMinutes}m)
                        </span>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {staff.totalOvertimeHours > 0 ? (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-400 font-black border border-purple-500/30">
                          {staff.totalOvertimeHours} Jam
                        </span>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-emerald-400">
                      {staff.overtimePayEst > 0 ? formatRp(staff.overtimePayEst) : '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                          staff.disciplineGrade === 'A+'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : staff.disciplineGrade === 'A'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                            : staff.disciplineGrade === 'B'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        }`}>
                          {staff.punctualityRate}% ({staff.disciplineGrade})
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
