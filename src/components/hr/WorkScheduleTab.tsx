import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  ArrowLeftRight,
  Printer,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Coffee,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Info
} from 'lucide-react';
import { User, WorkSchedule, ShiftType } from '../../types';
import { APP_TODAY } from '../../utils/formatters';
import { DEFAULT_SHIFTS } from '../../data/initialData';

interface WorkScheduleTabProps {
  staffUsers: User[];
  workSchedules: WorkSchedule[];
  onSaveSchedule: (schedule: WorkSchedule, isNew: boolean) => void;
  onDeleteSchedule: (id: string) => void;
  onSwapSchedule: (staffId1: string, staffId2: string, date: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const WorkScheduleTab: React.FC<WorkScheduleTabProps> = ({
  staffUsers,
  workSchedules,
  onSaveSchedule,
  onDeleteSchedule,
  onSwapSchedule,
  showToast
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [filterStaffId, setFilterStaffId] = useState<string>('all');
  const [filterShift, setFilterShift] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);

  // Swap modal states
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapStaff1, setSwapStaff1] = useState<string>('');
  const [swapStaff2, setSwapStaff2] = useState<string>('');
  const [swapDate, setSwapDate] = useState<string>(APP_TODAY);

  // Form states for Add/Edit
  const [formStaffId, setFormStaffId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(APP_TODAY);
  const [formShift, setFormShift] = useState<ShiftType>('Pagi');
  const [formStartTime, setFormStartTime] = useState<string>('06:00');
  const [formEndTime, setFormEndTime] = useState<string>('14:00');
  const [formNotes, setFormNotes] = useState<string>('');

  // Calculate 7 days of the active week (Monday to Sunday) based on APP_TODAY + weekOffset
  const weekDays = useMemo(() => {
    const baseDate = new Date(APP_TODAY + 'T00:00:00');
    // Day of week: 0 is Sun, 1 is Mon, ..., 5 is Fri
    const currentDay = baseDate.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + distanceToMonday + weekOffset * 7);

    const days = [];
    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('id-ID', { month: 'short' }),
        isToday: dateStr === APP_TODAY
      });
    }
    return days;
  }, [weekOffset]);

  // Today's who's on duty summary
  const todaySchedules = useMemo(() => {
    return workSchedules.filter((s) => s.date === APP_TODAY);
  }, [workSchedules]);

  const onDutyPagi = useMemo(() => todaySchedules.filter((s) => s.shift === 'Pagi'), [todaySchedules]);
  const onDutySiang = useMemo(() => todaySchedules.filter((s) => s.shift === 'Siang'), [todaySchedules]);
  const onDutyMalam = useMemo(() => todaySchedules.filter((s) => s.shift === 'Malam'), [todaySchedules]);
  const onDutyOff = useMemo(() => todaySchedules.filter((s) => s.shift === 'Off'), [todaySchedules]);

  // Filtered staff list for the table
  const displayedStaff = useMemo(() => {
    if (filterStaffId === 'all') return staffUsers;
    return staffUsers.filter((s) => s.id === filterStaffId);
  }, [staffUsers, filterStaffId]);

  // Open modal for new schedule on a specific staff and date
  const handleOpenNew = (staffId?: string, date?: string) => {
    const staff = staffUsers.find((s) => s.id === staffId) || staffUsers[0];
    const initialShift: ShiftType = (staff?.shift as ShiftType) || 'Pagi';
    const def = DEFAULT_SHIFTS.find((ds) => ds.id === initialShift);

    setEditingSchedule(null);
    setFormStaffId(staff?.id || '');
    setFormDate(date || APP_TODAY);
    setFormShift(initialShift);
    setFormStartTime(def?.startTime || '06:00');
    setFormEndTime(def?.endTime || '14:00');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for editing existing schedule
  const handleOpenEdit = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule);
    setFormStaffId(schedule.staffId);
    setFormDate(schedule.date);
    setFormShift(schedule.shift);
    setFormStartTime(schedule.startTime);
    setFormEndTime(schedule.endTime);
    setFormNotes(schedule.notes || '');
    setIsModalOpen(true);
  };

  // When shift selection changes, auto-populate typical start & end time
  const handleShiftChange = (s: ShiftType) => {
    setFormShift(s);
    const def = DEFAULT_SHIFTS.find((d) => d.id === s);
    if (def) {
      setFormStartTime(def.startTime);
      setFormEndTime(def.endTime);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStaffId) {
      showToast('Peringatan', 'Silakan pilih karyawan terlebih dahulu.', 'warning');
      return;
    }

    const staff = staffUsers.find((s) => s.id === formStaffId);
    if (!staff) return;

    const newSchedule: WorkSchedule = {
      id: editingSchedule?.id || `WS-${formDate.replace(/-/g, '')}-${formStaffId}-${Date.now().toString().slice(-4)}`,
      staffId: staff.id,
      staffName: staff.name,
      role: staff.roleName,
      date: formDate,
      shift: formShift,
      startTime: formStartTime,
      endTime: formEndTime,
      notes: formNotes,
      status: formShift === 'Off' ? 'Off' : 'Scheduled'
    };

    onSaveSchedule(newSchedule, !editingSchedule);
    setIsModalOpen(false);
  };

  const handleExecuteSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapStaff1 || !swapStaff2) {
      showToast('Peringatan', 'Pilih dua karyawan untuk menukar jadwal.', 'warning');
      return;
    }
    if (swapStaff1 === swapStaff2) {
      showToast('Peringatan', 'Karyawan yang ditukar harus berbeda.', 'warning');
      return;
    }

    onSwapSchedule(swapStaff1, swapStaff2, swapDate);
    setIsSwapModalOpen(false);
  };

  const getShiftBadgeClass = (shift: ShiftType) => {
    switch (shift) {
      case 'Pagi':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Siang':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Malam':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'Off':
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP CARDS: WHO IS ON DUTY TODAY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pagi */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Shift Pagi</h4>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">06:00 - 14:00</span>
          </div>
          <div className="mt-3 space-y-1.5 min-h-[56px]">
            {onDutyPagi.length > 0 ? (
              onDutyPagi.map((sch) => (
                <div key={sch.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">{sch.staffName}</span>
                  <span className="text-[10px] text-zinc-500">{sch.role}</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-zinc-500 italic pt-2">Belum ada staf terjadwal</p>
            )}
          </div>
        </div>

        {/* Siang */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Shift Siang</h4>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">10:00 - 18:00</span>
          </div>
          <div className="mt-3 space-y-1.5 min-h-[56px]">
            {onDutySiang.length > 0 ? (
              onDutySiang.map((sch) => (
                <div key={sch.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">{sch.staffName}</span>
                  <span className="text-[10px] text-zinc-500">{sch.role}</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-zinc-500 italic pt-2">Belum ada staf terjadwal</p>
            )}
          </div>
        </div>

        {/* Malam */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Shift Malam</h4>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">14:00 - 22:00</span>
          </div>
          <div className="mt-3 space-y-1.5 min-h-[56px]">
            {onDutyMalam.length > 0 ? (
              onDutyMalam.map((sch) => (
                <div key={sch.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">{sch.staffName}</span>
                  <span className="text-[10px] text-zinc-500">{sch.role}</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-zinc-500 italic pt-2">Belum ada staf terjadwal</p>
            )}
          </div>
        </div>

        {/* Off */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Coffee className="w-3.5 h-3.5 text-zinc-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Libur / Day Off</h4>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">Istirahat</span>
          </div>
          <div className="mt-3 space-y-1.5 min-h-[56px]">
            {onDutyOff.length > 0 ? (
              onDutyOff.map((sch) => (
                <div key={sch.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300">{sch.staffName}</span>
                  <span className="text-[10px] text-zinc-500">{sch.notes || 'Day Off'}</span>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-zinc-500 italic pt-2">Semua staf bertugas hari ini</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. CONTROLS & NAVIGATION BAR */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition"
            title="Minggu Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-white flex items-center gap-2 min-w-[200px] justify-center">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            <span>
              {weekDays[0].dayNumber} {weekDays[0].monthName} — {weekDays[6].dayNumber} {weekDays[6].monthName}{' '}
              {weekOffset === 0 && <span className="text-[10px] text-orange-400 font-semibold">(Minggu Ini)</span>}
            </span>
          </div>
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition"
            title="Minggu Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 px-2 py-1"
            >
              Reset ke Minggu Ini
            </button>
          )}
        </div>

        {/* Filter and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filterStaffId}
            onChange={(e) => setFilterStaffId(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="all">Semua Karyawan ({staffUsers.length})</option>
            {staffUsers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.roleName})
              </option>
            ))}
          </select>

          <button
            onClick={() => handleOpenNew()}
            className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Atur Shift Baru
          </button>

          <button
            onClick={() => {
              setSwapStaff1(staffUsers[0]?.id || '');
              setSwapStaff2(staffUsers[1]?.id || '');
              setSwapDate(APP_TODAY);
              setIsSwapModalOpen(true);
            }}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" /> Tukar Shift
          </button>

          <button
            onClick={() => {
              window.print();
              showToast('Cetak Roster', 'Jadwal kerja mingguan siap dicetak.', 'info');
            }}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
            title="Cetak Jadwal Mingguan"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" /> Print Roster
          </button>
        </div>
      </div>

      {/* 3. WEEKLY ROSTER GRID TABLE */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="md:hidden flex items-center justify-between px-3.5 py-1.5 bg-zinc-950/70 border-b border-zinc-800 text-[10px] text-zinc-400 select-none">
          <span className="text-orange-400 font-semibold flex items-center gap-1">↔ Geser tabel ke samping untuk melihat jadwal 7 hari</span>
          <span className="font-mono text-zinc-500">Nama staf terkunci</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[11px] uppercase font-bold">
              <tr>
                <th className="py-3 px-4 w-[200px] sticky left-0 bg-zinc-950 z-10 border-r border-zinc-800">
                  Nama Karyawan
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.dateStr}
                    className={`py-3 px-3 text-center border-r border-zinc-800/60 last:border-r-0 ${
                      day.isToday ? 'bg-orange-500/10 text-orange-400' : ''
                    }`}
                  >
                    <div className="font-black text-xs text-white">{day.dayName}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {day.dayNumber} {day.monthName}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
              {displayedStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-zinc-800/20 transition">
                  {/* Staff Info Column */}
                  <td className="py-3 px-4 sticky left-0 bg-zinc-950 z-10 border-r border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      {staff.photo ? (
                        <img
                          src={staff.photo}
                          alt={staff.name}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-xs">
                          {staff.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white text-xs">{staff.name}</p>
                        <p className="text-[10px] text-zinc-400">{staff.roleName}</p>
                      </div>
                    </div>
                  </td>

                  {/* 7 Day Shift Slots */}
                  {weekDays.map((day) => {
                    const schedule = workSchedules.find(
                      (s) => (s.staffId === staff.id || s.staffName === staff.name) && s.date === day.dateStr
                    );

                    return (
                      <td
                        key={day.dateStr}
                        className={`p-2 text-center border-r border-zinc-800/50 last:border-r-0 align-top ${
                          day.isToday ? 'bg-orange-500/5' : ''
                        }`}
                      >
                        {schedule ? (
                          <div
                            onClick={() => handleOpenEdit(schedule)}
                            className={`p-2 rounded-xl border cursor-pointer hover:scale-[1.02] active:scale-95 transition text-left group relative ${getShiftBadgeClass(
                              schedule.shift
                            )}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-[11px] block">{schedule.shift}</span>
                              <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition text-zinc-300" />
                            </div>
                            <div className="text-[9px] font-mono opacity-80 mt-0.5">
                              {schedule.shift === 'Off' ? 'Libur' : `${schedule.startTime} - ${schedule.endTime}`}
                            </div>
                            {schedule.notes && (
                              <p className="text-[9px] text-zinc-400 truncate mt-1 italic" title={schedule.notes}>
                                {schedule.notes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenNew(staff.id, day.dateStr)}
                            className="w-full h-12 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40 text-zinc-600 hover:text-zinc-300 text-[10px] font-bold transition flex items-center justify-center gap-1 group"
                          >
                            <Plus className="w-3 h-3 group-hover:scale-110 transition" />
                            <span>Shift</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: ADD / EDIT WORK SCHEDULE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 my-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                {editingSchedule ? 'Ubah Jadwal Shift Karyawan' : 'Tambah Jadwal Shift Karyawan'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 pt-4 text-xs">
              {/* Karyawan */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Karyawan</label>
                <select
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500"
                  required
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.roleName} (Default: Shift {s.shift})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Tanggal Tugas</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                  required
                />
              </div>

              {/* Pilihan Shift */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Jenis Shift</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Pagi', 'Siang', 'Malam', 'Off'] as ShiftType[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleShiftChange(st)}
                      className={`py-2 px-3 rounded-xl font-bold text-center border transition ${
                        formShift === st
                          ? 'bg-orange-500 text-zinc-950 border-orange-500 shadow-md font-black'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jam Mulai & Selesai */}
              {formShift !== 'Off' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1.5">Jam Mulai</label>
                    <input
                      type="text"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      placeholder="06:00"
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-bold mb-1.5">Jam Selesai</label>
                    <input
                      type="text"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      placeholder="14:00"
                      className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono text-center"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Catatan / Tugas Khusus */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Catatan / Tugas Khusus (Opsional)</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Tanggung jawab opening kasir & cek AC"
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                {editingSchedule && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus jadwal ${editingSchedule.staffName} pada ${editingSchedule.date}?`)) {
                        onDeleteSchedule(editingSchedule.id);
                        setIsModalOpen(false);
                      }
                    }}
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition"
                    title="Hapus Jadwal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black rounded-xl shadow-md transition"
                >
                  {editingSchedule ? 'Simpan Perubahan' : 'Tetapkan Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: SHIFT SWAP (TUKAR SHIFT) */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 my-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                Tukar Shift Karyawan (Shift Swap)
              </h3>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteSwap} className="space-y-4 pt-4 text-xs">
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-300 leading-relaxed">
                  Fitur ini akan menukar jadwal shift kedua karyawan pada tanggal yang dipilih secara otomatis tanpa perlu mengubah satu per satu.
                </p>
              </div>

              {/* Tanggal Penukaran */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Tanggal Penukaran</label>
                <input
                  type="date"
                  value={swapDate}
                  onChange={(e) => setSwapDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                  required
                />
              </div>

              {/* Karyawan A */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Karyawan Pertama (A)</label>
                <select
                  value={swapStaff1}
                  onChange={(e) => setSwapStaff1(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500"
                  required
                >
                  <option value="">-- Pilih Karyawan A --</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.roleName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Karyawan B */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Karyawan Kedua (B)</label>
                <select
                  value={swapStaff2}
                  onChange={(e) => setSwapStaff2(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500"
                  required
                >
                  <option value="">-- Pilih Karyawan B --</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.roleName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Konfirmasi Tukar Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
