import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  Clock,
  QrCode,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Printer,
  Share2,
  Trash2,
  LogOut,
  Sparkles,
  ArrowRight,
  Filter,
  PlusCircle,
  CreditCard,
  Building2,
  Award
} from 'lucide-react';
import { Member } from '../../types';
import { OnlineReservation } from '../../types/landingTypes';
import { APP_TODAY } from '../../utils/formatters';

interface MemberPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  loggedInMember: Member | null;
  onLoginMember: (member: Member) => void;
  onLogoutMember: () => void;
  reservations: OnlineReservation[];
  onCancelReservation: (resId: string) => void;
  onOpenNewReservation: () => void;
}

export const MemberPortalModal: React.FC<MemberPortalModalProps> = ({
  isOpen,
  onClose,
  members,
  loggedInMember,
  onLoginMember,
  onLogoutMember,
  reservations,
  onCancelReservation,
  onOpenNewReservation
}) => {
  // Login input
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Tab in Member Area
  const [activeTab, setActiveTab] = useState<'profile' | 'active-tickets' | 'history'>('profile');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Selected ticket for enlarged QR view
  const [viewTicketModal, setViewTicketModal] = useState<OnlineReservation | null>(null);
  const passQrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ticketQrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const clean = loginInput.trim().toLowerCase();
    if (!clean) {
      setLoginError('Silakan masukkan No. HP atau ID Member Anda.');
      return;
    }

    const matched = members.find((m) => {
      const matchId = m.id.toLowerCase() === clean;
      const matchPhone = m.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '');
      const matchName = m.name.toLowerCase() === clean;
      return matchId || matchPhone || matchName;
    });

    if (matched) {
      onLoginMember(matched);
      setLoginInput('');
    } else {
      setLoginError('Member tidak ditemukan. Periksa kembali ID Member (cth: M001) atau No. HP Anda.');
    }
  };

  // Member reservations
  const memberReservations = reservations.filter((r) => {
    if (!loggedInMember) return false;
    const matchId = r.memberId === loggedInMember.id;
    const matchPhone = r.customerPhone.replace(/[^0-9]/g, '') === loggedInMember.phone.replace(/[^0-9]/g, '');
    const matchName = r.customerName.toLowerCase() === loggedInMember.name.toLowerCase();
    return matchId || matchPhone || matchName;
  });

  const activeTickets = memberReservations.filter((r) => r.status === 'CONFIRMED');

  const filteredHistory = memberReservations.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  // Render QR Code for Member Pass
  useEffect(() => {
    if (loggedInMember && passQrCanvasRef.current && (window as any).QRious) {
      try {
        new (window as any).QRious({
          element: passQrCanvasRef.current,
          value: `RFA-MEMBER|${loggedInMember.id}|${loggedInMember.name}|${loggedInMember.status}`,
          size: 140,
          level: 'H'
        });
      } catch (e) {
        console.error('Error drawing member QR', e);
      }
    }
  }, [loggedInMember, activeTab]);

  // Render QR Code for Ticket Modal
  useEffect(() => {
    if (viewTicketModal && ticketQrCanvasRef.current && (window as any).QRious) {
      try {
        new (window as any).QRious({
          element: ticketQrCanvasRef.current,
          value: viewTicketModal.qrCodeData,
          size: 160,
          level: 'H'
        });
      } catch (e) {
        console.error('Error drawing ticket QR', e);
      }
    }
  }, [viewTicketModal]);

  const handleShareWhatsAppTicket = (ticket: OnlineReservation) => {
    const msg = `*TIKET RESERVASI RFA GYM*%0A` +
      `No. Booking: *${ticket.id}*%0A` +
      `Passcode: *${ticket.ticketPassCode}*%0A` +
      `Program: *${ticket.programName}*%0A` +
      `Waktu: *${ticket.targetDate} (${ticket.timeSlot})*%0A` +
      `Cabang: *${ticket.branchName}*%0A` +
      `Status: *TERKONFIRMASI*`;

    const waUrl = `https://wa.me/?text=${msg}`;
    try {
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {loggedInMember ? `Dashboard Member RFA` : 'Autentikasi & Area Member'}
              </h3>
              <p className="text-xs text-zinc-400">
                {loggedInMember
                  ? `Selamat datang kembali, ${loggedInMember.name}`
                  : 'Masuk dengan No. HP atau ID Member untuk cek tiket & status'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-200">
          {/* STATE 1: MEMBER NOT LOGGED IN -> LOGIN FORM */}
          {!loggedInMember ? (
            <div className="max-w-md mx-auto py-4 space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-black text-white">Login Member RFA Gym</h4>
                <p className="text-xs text-zinc-400">
                  Akses instan tanpa password ribet. Masukkan ID Member atau nomor WhatsApp terdaftar Anda.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                    Nomor WhatsApp atau ID Member
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: M001 atau 081234567890"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* STATE 2: MEMBER LOGGED IN -> DASHBOARD MEMBER */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Profile Top Card */}
              <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-center sm:text-left">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 font-black text-xl flex items-center justify-center shrink-0">
                    {loggedInMember.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <h4 className="text-base font-extrabold text-white">{loggedInMember.name}</h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                        {loggedInMember.status || 'AKTIF'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ID: <span className="font-mono text-zinc-200">{loggedInMember.id}</span> • {loggedInMember.phone}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Cabang: <span className="text-zinc-300">{loggedInMember.branchName || 'RFA Gym Central'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenNewReservation}
                    className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Booking Slot</span>
                  </button>

                  <button
                    onClick={onLogoutMember}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs flex items-center gap-1"
                    title="Logout dari Area Member"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                {[
                  { id: 'profile', label: 'Profil & Status Pass' },
                  { id: 'active-tickets', label: `Tiket Aktif (${activeTickets.length})` },
                  { id: 'history', label: `Riwayat Reservasi (${memberReservations.length})` }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === t.id
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: Profil & Digital Member Pass */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Membership Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Status Member</span>
                      <span className="text-sm font-extrabold text-emerald-400 mt-1 block">
                        {loggedInMember.status === 'AKTIF' ? 'Aktif Penuh' : loggedInMember.status || 'Aktif'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Paket Utama</span>
                      <span className="text-xs font-extrabold text-white mt-1 block truncate">
                        {loggedInMember.classPackageName || 'Reguler All-Access'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sisa Kuota PT</span>
                      <span className="text-sm font-extrabold text-orange-400 mt-1 block">
                        {loggedInMember.ptQuota ?? 0} Sesi
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Berlaku Hingga</span>
                      <span className="text-xs font-extrabold text-zinc-200 mt-1 block">
                        {loggedInMember.expired || '2026-12-31'}
                      </span>
                    </div>
                  </div>

                  {/* Digital Turnstile Pass Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-orange-500/30 text-center flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">
                      SMART DIGITAL TURNSTILE PASS
                    </span>
                    <h5 className="text-base font-extrabold text-white mb-4">
                      {loggedInMember.name} • {loggedInMember.id}
                    </h5>

                    <div className="p-3 bg-white rounded-2xl shadow-inner mb-3">
                      <canvas ref={passQrCanvasRef} width={130} height={130} className="w-28 h-28" />
                    </div>

                    <p className="text-[11px] text-zinc-400 max-w-sm">
                      Pindai QR Code ini pada scanner gerbang turnstile otomatis untuk check-in presensi masuk gym tanpa antre.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Tiket Reservasi Aktif */}
              {activeTab === 'active-tickets' && (
                <div className="space-y-4">
                  {activeTickets.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
                      <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
                      <h5 className="text-sm font-bold text-zinc-300">Belum Ada Tiket Reservasi Aktif</h5>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Anda belum memiliki jadwal reservasi kelas studio atau sesi latihan yang akan datang.
                      </p>
                      <button
                        onClick={onOpenNewReservation}
                        className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs"
                      >
                        Pesan Slot Latihan Sekarang
                      </button>
                    </div>
                  ) : (
                    activeTickets.map((t) => (
                      <div
                        key={t.id}
                        className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                      >
                        <div className="space-y-1 text-center sm:text-left">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <span className="text-xs font-mono font-bold text-orange-400">{t.id}</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                              {t.status}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white">{t.programName}</h4>
                          <p className="text-xs text-zinc-400">
                            {t.targetDate} ({t.timeSlot}) • {t.branchName}
                          </p>
                          {t.trainerName && (
                            <p className="text-xs text-zinc-400">Coach: {t.trainerName}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setViewTicketModal(t)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5 text-orange-400" />
                            <span>Lihat QR</span>
                          </button>

                          <button
                            onClick={() => handleShareWhatsAppTicket(t)}
                            className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                            title="Kirim ke WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onCancelReservation(t.id)}
                            className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                            title="Batalkan Reservasi"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: Riwayat Reservasi (Filter Status) */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {/* Status Filter Buttons */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold overflow-x-auto">
                    {[
                      { id: 'ALL', label: 'Semua' },
                      { id: 'CONFIRMED', label: 'Terkonfirmasi' },
                      { id: 'COMPLETED', label: 'Selesai' },
                      { id: 'CANCELLED', label: 'Dibatalkan' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setStatusFilter(f.id as any)}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                          statusFilter === f.id
                            ? 'bg-orange-500 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {filteredHistory.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center text-zinc-500 text-xs">
                      Tidak ada data reservasi untuk filter ini.
                    </div>
                  ) : (
                    filteredHistory.map((h) => (
                      <div
                        key={h.id}
                        className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-400">{h.id}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                h.status === 'CONFIRMED'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : h.status === 'CANCELLED'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {h.status}
                            </span>
                          </div>
                          <h5 className="font-bold text-white mt-1">{h.programName}</h5>
                          <p className="text-zinc-400">
                            {h.targetDate} ({h.timeSlot}) • {h.branchName}
                          </p>
                        </div>

                        <span className="text-[11px] text-zinc-500 font-mono">
                          {h.bookingDate}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enlarged QR Ticket View Popup */}
        {viewTicketModal && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-orange-400">
                  {viewTicketModal.id}
                </span>
                <button
                  onClick={() => setViewTicketModal(null)}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-lg font-black text-white">{viewTicketModal.programName}</h4>
              <p className="text-xs text-zinc-400">{viewTicketModal.timeSlot}</p>

              <div className="p-4 bg-white rounded-2xl inline-block mx-auto">
                <canvas ref={ticketQrCanvasRef} width={150} height={150} className="w-36 h-36" />
              </div>

              <p className="text-xs font-mono font-bold text-zinc-300">
                PASSCODE: {viewTicketModal.ticketPassCode}
              </p>

              <button
                onClick={() => setViewTicketModal(null)}
                className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs"
              >
                Tutup Tampilan QR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
