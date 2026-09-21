import React, { useState, useMemo } from 'react';
import { UserCheck, Clock, LogOut, CheckCircle2, AlertCircle, QrCode, Sparkles, Camera } from 'lucide-react';
import { Member, User, Attendance, StaffAttendance } from '../types';
import { getTimestamp, APP_TODAY } from '../utils/formatters';
import { SearchableMemberSelect } from './SearchableMemberSelect';
import { SearchableStaffSelect } from './SearchableStaffSelect';
import { QRCodeScannerModal } from './QRCodeScannerModal';

interface AttendanceViewProps {
  members: Member[];
  staffUsers: User[];
  attendances: Attendance[];
  staffAttendances: StaffAttendance[];
  onAddAttendance: (newAtt: Attendance, memberToUpdate?: Member) => void;
  onCheckoutMember: (attId: string) => void;
  onStaffClock: (record: StaffAttendance) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  members,
  staffUsers,
  attendances,
  staffAttendances,
  onAddAttendance,
  onCheckoutMember,
  onStaffClock,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'member' | 'staff'>('member');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Member form state
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [visitType, setVisitType] = useState<'Reguler' | 'PT'>('Reguler');

  // Staff form state
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const selectedMemberObj = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  const activeSelectedMemberSession = useMemo(() => {
    if (!selectedMemberObj) return null;
    return attendances.find(
      (a) =>
        (a.memberId === selectedMemberObj.id || a.memberName === selectedMemberObj.name) &&
        a.date === APP_TODAY &&
        !a.timeOut
    );
  }, [selectedMemberObj, attendances]);

  // Handle member check-in with automatic IN / OUT toggle logic
  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      showToast('Peringatan', 'Pilih member terlebih dahulu.', 'warning');
      return;
    }

    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) {
      showToast('Error', 'Data member tidak ditemukan.', 'error');
      return;
    }

    // Check freeze status (Membership Freeze blocks access to gym)
    if (member.isFrozen || member.status === 'FREEZE') {
      showToast(
        'Akses Ditolak (Membership Freeze)',
        `Keanggotaan ${member.name} saat ini berstatus FREEZE / DIBEKUKAN (Alasan: ${member.freezeReason || 'Cuti'}). Masa aktif sedang ditangguhkan, silakan unfreeze terlebih dahulu.`,
        'error'
      );
      return;
    }

    // Check expiry
    const isExpired = new Date(member.expired + 'T00:00:00') < new Date(APP_TODAY + 'T00:00:00');
    if (isExpired) {
      showToast('Akses Ditolak', `Membership ${member.name} telah kadaluarsa (${member.expired})! Silakan renewal terlebih dahulu.`, 'error');
      return;
    }

    // Check if member already checked-in today and hasn't checked out yet (Toggle logic!)
    const activeSession = attendances.find(
      (a) => (a.memberId === member.id || a.memberName === member.name) && a.date === APP_TODAY && !a.timeOut
    );

    if (activeSession) {
      // Auto Checkout
      onCheckoutMember(activeSession.id);
      showToast('Checkout Berhasil', `Sampai jumpa lagi, ${member.name}! Sesi latihan selesai.`, 'success');
      setSelectedMemberId('');
      return;
    }

    // Check PT Quota if visitType === 'PT'
    let updatedMember = undefined;
    if (visitType === 'PT') {
      if ((member.ptQuota || 0) <= 0) {
        showToast('Kuota Habis', `Member ${member.name} tidak memiliki sisa kuota sesi PT. Silakan beli paket PT terlebih dahulu.`, 'warning');
        return;
      }
      // Deduct quota
      updatedMember = { ...member, ptQuota: member.ptQuota - 1 };
    }

    const newAttendance: Attendance = {
      id: 'ATT-' + Date.now(),
      date: APP_TODAY,
      timeIn: getTimestamp(),
      timeOut: '',
      memberId: member.id,
      memberName: member.name,
      type: visitType,
      badge: visitType === 'PT' ? 'Sesi PT' : 'Gym Reguler'
    };

    onAddAttendance(newAttendance, updatedMember);
    showToast('Check-In Berhasil', `Selamat berlatih, ${member.name}!`, 'success');
    setSelectedMemberId('');
  };

  // Handle staff clock in / out
  const handleStaffClockAction = (action: 'IN' | 'OUT') => {
    if (!selectedStaffId) {
      showToast('Peringatan', 'Pilih staf terlebih dahulu.', 'warning');
      return;
    }

    const staff = staffUsers.find((s) => s.id === selectedStaffId);
    if (!staff) {
      showToast('Error', 'Data staf tidak ditemukan.', 'error');
      return;
    }

    const existingActive = staffAttendances.find(
      (s) => (s.staffId === staff.id || s.staffName === staff.name) && s.date === APP_TODAY && !s.timeOut
    );

    if (action === 'IN') {
      if (existingActive) {
        showToast('Peringatan', `Staf ${staff.name} sudah melakukan Clock IN sebelumnya.`, 'warning');
        return;
      }

      const newClock: StaffAttendance = {
        id: 'SA-' + Date.now(),
        date: APP_TODAY,
        timeIn: getTimestamp(),
        timeOut: '',
        staffId: staff.id,
        staffName: staff.name,
        shift: staff.shift || 'Pagi'
      };
      onStaffClock(newClock);
      showToast('Clock IN Berhasil', `Selamat bertugas, ${staff.name}! Shift ${staff.shift}.`, 'success');
      setSelectedStaffId('');
    } else {
      if (!existingActive) {
        showToast('Peringatan', `Tidak ditemukan sesi Clock IN aktif untuk ${staff.name} hari ini.`, 'warning');
        return;
      }

      const updated = { ...existingActive, timeOut: getTimestamp() };
      onStaffClock(updated);
      showToast('Clock OUT Berhasil', `Terima kasih atas kerja kerasnya, ${staff.name}!`, 'success');
      setSelectedStaffId('');
    }
  };

  const todayMemberAttendances = attendances.filter((a) => a.date === APP_TODAY);
  const activeInGymCount = todayMemberAttendances.filter((a) => !a.timeOut).length;

  const todayStaffAttendances = staffAttendances.filter((s) => s.date === APP_TODAY);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Tab switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Presensi & Kehadiran</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Pencatatan live check-in member dan clock in/out staf operasional</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'member' && (
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-lg shadow-orange-500/25 transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-4 h-4" /> Scan QR Card Member
            </button>
          )}

          <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('member')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'member' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Presensi Member ({activeInGymCount} Aktif)
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'staff' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Clock In Staf ({todayStaffAttendances.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MEMBER ATTENDANCE */}
      {activeTab === 'member' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner / Check-in Form */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm h-fit">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white">Scanner Check-In</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/30 transition"
              >
                <Camera className="w-3.5 h-3.5" /> Kamera Langsung
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Sistem akan memvalidasi masa aktif, kuota sesi PT, dan <strong>otomatis checkout</strong> jika member discan untuk kedua kalinya.
            </p>

            {/* Quick Camera Launcher Banner */}
            <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/15 via-orange-950/20 to-zinc-900/60 border border-orange-500/30 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-zinc-950 flex items-center justify-center font-black shadow-md shadow-orange-500/30 shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Scan QR ID Card</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-emerald-500/30">Instan</span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Arahkan kamera HP ke kartu digital member
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold px-3 py-1.5 rounded-xl text-[11px] shadow transition flex items-center gap-1 shrink-0"
              >
                <QrCode className="w-3.5 h-3.5" /> Buka
              </button>
            </div>

            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div>
                <SearchableMemberSelect
                  members={members}
                  selectedMemberId={selectedMemberId}
                  onSelectMember={(id) => setSelectedMemberId(id)}
                  attendances={attendances}
                  placeholder="Ketik nama atau ID member (contoh: M001)..."
                  label="Pilih / Scan Member"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                  Tujuan Kunjungan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`cursor-pointer text-center p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      visitType === 'Reguler'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visitType"
                      value="Reguler"
                      checked={visitType === 'Reguler'}
                      onChange={() => setVisitType('Reguler')}
                      className="sr-only"
                    />
                    <span>Gym Reguler</span>
                  </label>
                  <label
                    className={`cursor-pointer text-center p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      visitType === 'PT'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visitType"
                      value="PT"
                      checked={visitType === 'PT'}
                      onChange={() => setVisitType('PT')}
                      className="sr-only"
                    />
                    <span>Sesi PT (-1 Kuota)</span>
                  </label>
                </div>
              </div>

              {/* Freeze Banner Alert */}
              {selectedMemberObj && (selectedMemberObj.isFrozen || selectedMemberObj.status === 'FREEZE') && (
                <div className="p-3 bg-sky-950/40 border border-sky-500/40 rounded-2xl flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 shrink-0 animate-pulse" />
                  <div className="text-xs">
                    <p className="font-bold text-sky-300">Status Member: FREEZE (Dibekukan)</p>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Alasan: <strong className="text-white">{selectedMemberObj.freezeReason || 'Cuti'}</strong>. Akses gate masuk gym ditolak sampai member di-unfreeze.
                    </p>
                  </div>
                </div>
              )}

              {activeSelectedMemberSession ? (
                <button
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-3.5 rounded-xl shadow-lg shadow-rose-500/20 transition text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Proses Checkout ({selectedMemberObj?.name || 'Keluar Gym'})
                </button>
              ) : selectedMemberObj && (selectedMemberObj.isFrozen || selectedMemberObj.status === 'FREEZE') ? (
                <button
                  type="submit"
                  className="w-full bg-sky-900/60 border border-sky-500/50 text-sky-300 font-black py-3.5 rounded-xl shadow-lg shadow-sky-500/10 transition text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-sky-400" /> Akses Ditolak (Member Freeze)
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!selectedMemberId}
                  className={`w-full py-3.5 rounded-xl transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 ${
                    selectedMemberId
                      ? 'bg-orange-500 hover:bg-orange-600 text-zinc-950 font-black shadow-lg shadow-orange-500/20 cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <UserCheck className="w-4 h-4" /> {selectedMemberObj ? `Proses Check-In (${selectedMemberObj.name})` : 'Proses (Pilih Member Dahulu)'}
                </button>
              )}
            </form>
          </div>

          {/* Live Attendance Log List */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl lg:col-span-2 flex flex-col h-[520px] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" /> Log Live Kunjungan Member Hari Ini
              </h3>
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-xs font-bold border border-emerald-500/30 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>{activeInGymCount} Sedang Latihan</span>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
              {todayMemberAttendances.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs py-10">
                  <UserCheck className="w-8 h-8 opacity-20 mb-2" />
                  <p>Belum ada member yang check-in hari ini.</p>
                </div>
              ) : (
                todayMemberAttendances.map((att) => (
                  <div
                    key={att.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-white text-xs border border-zinc-700 shrink-0">
                        {att.memberName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white leading-tight truncate">{att.memberName}</h4>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                            att.type === 'PT'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {att.badge}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/70">
                      <div className="text-left sm:text-right">
                        <p className="text-xs font-bold text-white">Masuk: {att.timeIn}</p>
                        <p className={`text-[10px] font-semibold mt-0.5 ${att.timeOut ? 'text-zinc-500' : 'text-emerald-400 animate-pulse'}`}>
                          Keluar: {att.timeOut || 'Masih Di Dalam'}
                        </p>
                      </div>

                      {!att.timeOut ? (
                        <button
                          onClick={() => onCheckoutMember(att.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition flex items-center gap-1 shrink-0"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Checkout
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-500 px-2 py-1 bg-zinc-900 rounded-lg shrink-0">
                          SELESAI
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF CLOCK IN / OUT */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm h-fit">
            <h3 className="text-base font-bold text-white mb-2">Presensi Shift Staf</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Catat waktu masuk (Clock IN) dan waktu selesai kerja (Clock OUT) staf dan trainer gym.
            </p>

            <div className="space-y-4">
              <div>
                <SearchableStaffSelect
                  staffUsers={staffUsers}
                  selectedStaffId={selectedStaffId}
                  onSelectStaff={(id) => setSelectedStaffId(id)}
                  staffAttendances={staffAttendances}
                  placeholder="Ketik nama, role, atau shift staf..."
                  label="Pilih Staf"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleStaffClockAction('IN')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Clock IN
                </button>
                <button
                  type="button"
                  onClick={() => handleStaffClockAction('OUT')}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> Clock OUT
                </button>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl lg:col-span-2 flex flex-col h-[520px] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40 shrink-0">
              <h3 className="text-sm font-bold text-white">Log Kehadiran Staf Hari Ini</h3>
              <span className="text-xs text-zinc-400 font-medium">Shift Pagi / Siang</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
              {todayStaffAttendances.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs py-10">
                  <p>Belum ada staf yang Clock IN hari ini.</p>
                </div>
              ) : (
                todayStaffAttendances.map((sAtt) => (
                  <div
                    key={sAtt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-white text-xs border border-zinc-700 shrink-0">
                        {sAtt.staffName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{sAtt.staffName}</h4>
                        <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          Shift {sAtt.shift}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-zinc-800/70">
                      <p className="text-xs font-bold text-emerald-400">IN: {sAtt.timeIn}</p>
                      <p className={`text-xs font-semibold ${sAtt.timeOut ? 'text-rose-400' : 'text-zinc-500'}`}>
                        OUT: {sAtt.timeOut || 'Aktif Bekerja'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* QR CODE SCANNER OVERLAY MODAL */}
      <QRCodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        members={members}
        attendances={attendances}
        onAddAttendance={onAddAttendance}
        onCheckoutMember={onCheckoutMember}
        showToast={showToast}
      />
    </div>
  );
};
