import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  AlertCircle,
  Check,
  X,
  User,
  Info
} from 'lucide-react';
import { User as StaffUser, LeaveRequest } from '../../types';
import { APP_TODAY, formatDateIndo } from '../../utils/formatters';

interface LeaveManagementTabProps {
  staffUsers: StaffUser[];
  leaveRequests: LeaveRequest[];
  onSaveLeaveRequest: (leave: LeaveRequest, isNew: boolean) => void;
  onApproveLeaveRequest: (id: string, status: 'Approved' | 'Rejected', notes?: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const LeaveManagementTab: React.FC<LeaveManagementTabProps> = ({
  staffUsers,
  leaveRequests,
  onSaveLeaveRequest,
  onApproveLeaveRequest,
  showToast
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStaffId, setFilterStaffId] = useState<string>('all');

  // Modal create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStaffId, setFormStaffId] = useState('');
  const [formType, setFormType] = useState('Cuti Tahunan');
  const [formStart, setFormStart] = useState(APP_TODAY);
  const [formEnd, setFormEnd] = useState(APP_TODAY);
  const [formReason, setFormReason] = useState('');

  // Calculate day count
  const dayCount = useMemo(() => {
    if (!formStart || !formEnd) return 1;
    const s = new Date(formStart + 'T00:00:00');
    const e = new Date(formEnd + 'T00:00:00');
    const diffTime = e.getTime() - s.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 1;
  }, [formStart, formEnd]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter((l) => {
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;
      if (filterStaffId !== 'all' && l.staffId !== filterStaffId) return false;
      return true;
    });
  }, [leaveRequests, filterStatus, filterStaffId]);

  const handleOpenAdd = () => {
    setFormStaffId(staffUsers[0]?.id || '');
    setFormType('Cuti Tahunan');
    setFormStart(APP_TODAY);
    setFormEnd(APP_TODAY);
    setFormReason('');
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffUsers.find((s) => s.id === formStaffId);
    if (!staff) {
      showToast('Peringatan', 'Silakan pilih karyawan.', 'warning');
      return;
    }

    if (formType === 'Cuti Tahunan' && (staff.leaveQuota ?? 12) < dayCount) {
      showToast(
        'Peringatan Kuota Cuti',
        `Sisa kuota cuti ${staff.name} (${staff.leaveQuota ?? 12} hari) tidak mencukupi untuk pengajuan ${dayCount} hari.`,
        'warning'
      );
    }

    const newLeave: LeaveRequest = {
      id: `LV-${Date.now().toString().slice(-5)}`,
      staffId: staff.id,
      staffName: staff.name,
      type: formType,
      start: formStart,
      end: formEnd,
      daysCount: dayCount,
      reason: formReason,
      status: 'Pending'
    };

    onSaveLeaveRequest(newLeave, true);
    showToast('Pengajuan Terkirim', `Pengajuan ${formType} untuk ${staff.name} berhasil diajukan.`, 'success');
    setIsModalOpen(false);
  };

  const pendingCount = useMemo(() => leaveRequests.filter((l) => l.status === 'Pending').length, [leaveRequests]);

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Menunggu Persetujuan</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-orange-400">{pendingCount}</span>
            <span className="text-xs text-zinc-500">Pengajuan Pending</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">Persetujuan wewenang HR & Manajer</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Telah Disetujui (Approved)</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-400">
              {leaveRequests.filter((l) => l.status === 'Approved').length}
            </span>
            <span className="text-xs text-zinc-500">Pengajuan</span>
          </div>
          <p className="text-[10px] text-emerald-400/90 mt-2 font-semibold">Tercatat dalam kalender roster</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Standar Kuota Cuti</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-white">12 Hari</span>
            <span className="text-xs text-zinc-500">Per Tahun</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">Dihitung dari tanggal join karyawan</p>
        </div>
      </div>

      {/* 2. FILTER & ACTION BAR */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === 'all' ? 'bg-orange-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua ({leaveRequests.length})
            </button>
            <button
              onClick={() => setFilterStatus('Pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === 'Pending' ? 'bg-orange-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('Approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === 'Approved' ? 'bg-orange-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Disetujui
            </button>
            <button
              onClick={() => setFilterStatus('Rejected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === 'Rejected' ? 'bg-orange-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ditolak
            </button>
          </div>

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
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Ajukan Cuti / Izin / Lembur
        </button>
      </div>

      {/* 3. TABLE OF LEAVE REQUESTS */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <table className="w-full text-left whitespace-nowrap min-w-[850px]">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Nama Karyawan</th>
                <th className="py-3 px-4">Jenis Pengajuan</th>
                <th className="py-3 px-4">Tanggal Mulai</th>
                <th className="py-3 px-4">Tanggal Selesai</th>
                <th className="py-3 px-4 text-center">Durasi</th>
                <th className="py-3 px-4">Alasan / Keterangan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Tindakan HR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((l) => {
                  const staff = staffUsers.find((s) => s.id === l.staffId || s.name === l.staffName);
                  const isApproved = l.status === 'Approved';
                  const isRejected = l.status === 'Rejected';
                  const isPending = l.status === 'Pending';

                  return (
                    <tr key={l.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-white text-xs">{l.staffName}</p>
                        <p className="text-[10px] text-zinc-500">{staff?.roleName || 'Staf Operasional'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
                          {l.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-300">{formatDateIndo(l.start)}</td>
                      <td className="py-3 px-4 font-mono text-zinc-300">{formatDateIndo(l.end)}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white">
                        {l.daysCount || 1} Hari
                      </td>
                      <td className="py-3 px-4 text-zinc-300 max-w-[220px] truncate" title={l.reason}>
                        {l.reason}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isApproved
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : isRejected
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-orange-500/15 text-orange-400 border-orange-500/30 animate-pulse'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                onApproveLeaveRequest(l.id, 'Approved', 'Disetujui HR');
                                showToast(
                                  'Disetujui',
                                  `Pengajuan cuti ${l.staffName} telah disetujui dan kuota telah disesuaikan.`,
                                  'success'
                                );
                              }}
                              className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold text-[10px] transition flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Setujui
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Masukkan alasan penolakan (opsional):') || 'Tidak disetujui HR';
                                onApproveLeaveRequest(l.id, 'Rejected', reason);
                                showToast('Ditolak', `Pengajuan cuti ${l.staffName} telah ditolak.`, 'info');
                              }}
                              className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg font-bold text-[10px] transition flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-500 italic">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500 text-xs italic">
                    Tidak ada permohonan cuti atau izin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: AJUKAN CUTI / IZIN / LEMBUR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 my-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Pengajuan Cuti, Izin, atau Lembur
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
                <label className="block text-zinc-400 font-bold mb-1.5">Nama Karyawan</label>
                <select
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-bold"
                  required
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {staffUsers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.roleName}) — Sisa Cuti: {s.leaveQuota ?? 12} Hari
                    </option>
                  ))}
                </select>
              </div>

              {/* Jenis Pengajuan */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Jenis Pengajuan</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-bold"
                >
                  <option value="Cuti Tahunan">Cuti Tahunan (Potong Kuota)</option>
                  <option value="Sakit">Sakit (Dengan Surat Dokter)</option>
                  <option value="Izin Pribadi">Izin Pribadi / Keperluan Mendesak</option>
                  <option value="Libur Rutin / Day Off">Libur Rutin Mingguan (Day Off)</option>
                  <option value="Lembur Khusus">Lembur Khusus Event / Stock Opname</option>
                </select>
              </div>

              {/* Tanggal Mulai & Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1.5">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Durasi Info */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-zinc-400">Total Durasi Pengajuan:</span>
                <span className="font-mono font-black text-orange-400 text-sm">{dayCount} Hari Kerja</span>
              </div>

              {/* Alasan */}
              <div>
                <label className="block text-zinc-400 font-bold mb-1.5">Alasan / Keterangan</label>
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Tuliskan keterangan detail alasan pengajuan..."
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-orange-500 h-20"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
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
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
