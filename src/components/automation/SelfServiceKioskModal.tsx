import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Smartphone,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Delete,
  X,
  Volume2,
  KeyRound,
  ShieldAlert,
  Clock,
  UserCheck
} from 'lucide-react';
import { Member, LockerSlot, Attendance } from '../../types';
import { playSuccessBeep, playErrorBuzz, speakAccessVoice } from '../../utils/audioAlerts';
import { getMemberStatus } from '../../utils/memberStatus';

interface SelfServiceKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  lockers: LockerSlot[];
  onAddAttendance?: (attendance: Attendance) => void;
  onUpdateLockers?: (lockers: LockerSlot[]) => void;
}

export const SelfServiceKioskModal: React.FC<SelfServiceKioskModalProps> = ({
  isOpen,
  onClose,
  members,
  lockers,
  onAddAttendance,
  onUpdateLockers
}) => {
  const [inputMode, setInputMode] = useState<'KEYPAD' | 'QR'>('KEYPAD');
  const [digits, setDigits] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    member: Member;
    lockerNumber: number | string;
    checkedInAt: string;
  } | null>(null);

  // Security Exit PIN modal
  const [isExitPinOpen, setIsExitPinOpen] = useState(false);
  const [exitPinInput, setExitPinInput] = useState('');
  const [exitPinError, setExitPinError] = useState(false);

  // Auto-reset countdown after check-in success
  const [resetTimer, setResetTimer] = useState<number>(0);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Focus QR input when in QR mode
  useEffect(() => {
    if (isOpen && inputMode === 'QR') {
      setTimeout(() => qrInputRef.current?.focus(), 100);
    }
  }, [isOpen, inputMode]);

  // Handle countdown back to idle
  useEffect(() => {
    let interval: any = null;
    if (resetTimer > 0) {
      interval = setInterval(() => {
        setResetTimer((t) => t - 1);
      }, 1000);
    } else if (resetTimer === 0 && successData) {
      handleResetIdle();
    }
    return () => clearInterval(interval);
  }, [resetTimer, successData]);

  const handleResetIdle = () => {
    setSuccessData(null);
    setDigits('');
    setErrorMsg(null);
  };

  // Find and assign next available locker
  const assignNextAvailableLocker = (gender?: 'L' | 'P') => {
    const availableLockers = lockers.filter((l) => !l.isOccupied && l.status !== 'Perbaikan');
    if (availableLockers.length === 0) {
      return 'Loker Penuh (Hubungi Kasir)';
    }

    // Try gender match if available
    let chosen = availableLockers[0];
    if (gender) {
      const genderMatch = availableLockers.find((l) =>
        gender === 'L' ? (l.gender as any) === 'M' || l.gender === 'Pria' : (l.gender as any) === 'F' || l.gender === 'Wanita'
      );
      if (genderMatch) chosen = genderMatch;
    }

    // Mark as occupied if locker update callback exists
    if (onUpdateLockers) {
      const updated: LockerSlot[] = lockers.map((l) =>
        l.number === chosen.number ? { ...l, isOccupied: true, status: 'Terpakai' } : l
      );
      onUpdateLockers(updated);
    }

    return chosen.number;
  };

  // Execute check in
  const processCheckIn = (searchValue: string) => {
    setErrorMsg(null);
    const trimmed = searchValue.trim();
    if (!trimmed) return;

    // Search by 4 last phone digits, member ID, or barcode
    const found = members.find((m) => {
      const phoneDigits = m.phone ? m.phone.replace(/\D/g, '') : '';
      const matchPhoneEnd = phoneDigits.endsWith(trimmed) || phoneDigits.includes(trimmed);
      const matchId = m.id.toLowerCase() === trimmed.toLowerCase();
      const matchBarcode = (m as any).barcode && String((m as any).barcode).toLowerCase() === trimmed.toLowerCase();
      const matchName = m.name.toLowerCase().includes(trimmed.toLowerCase());
      return matchPhoneEnd || matchId || matchBarcode || (trimmed.length > 3 && matchName);
    });

    if (!found) {
      playErrorBuzz();
      setErrorMsg('Member tidak ditemukan. Periksa kembali 4 digit HP atau scan QR Anda.');
      return;
    }

    // Validate Membership using system-wide getMemberStatus
    const statusInfo = getMemberStatus(found);
    const isExpired = statusInfo.status === 'EXPIRED';
    const isGracePeriod = statusInfo.status === 'MASA TENGGANG';
    const isFrozen = statusInfo.status === 'FREEZE' || found.isFrozen;

    if (isExpired) {
      speakAccessVoice('EXPIRED');
      setErrorMsg(`Membership ${found.name} telah EXPIRED (${found.expired}). Silakan lakukan perpanjangan di kasir.`);
      return;
    }

    if (isFrozen) {
      speakAccessVoice('EXPIRED');
      setErrorMsg(`Membership ${found.name} sedang CUTI/FREEZE. Silakan hubungi kasir.`);
      return;
    }

    // Success Check-in with Indonesian Voice Announcement
    if (isGracePeriod) {
      speakAccessVoice('MASA TENGGANG');
    } else {
      speakAccessVoice('AKTIF');
    }
    const assignedLocker = assignNextAvailableLocker(found.gender);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Record attendance if handler exists
    if (onAddAttendance) {
      const newAtt: Attendance = {
        id: `ATT-KIOSK-${Date.now()}`,
        memberId: found.id,
        memberName: found.name,
        date: now.toISOString().split('T')[0],
        timeIn: timeStr,
        type: 'Reguler',
        badge: 'Kios Mandiri',
        lockerNumber: typeof assignedLocker === 'number' ? assignedLocker : undefined
      };
      onAddAttendance(newAtt);
    }

    setSuccessData({
      member: found,
      lockerNumber: assignedLocker,
      checkedInAt: timeStr
    });

    setResetTimer(6); // 6 seconds display before auto-reset
  };

  // Keypad Actions
  const handleKeypadPress = (val: string) => {
    if (digits.length < 4) {
      const next = digits + val;
      setDigits(next);
      if (next.length === 4) {
        processCheckIn(next);
      }
    }
  };

  const handleKeypadDelete = () => {
    setDigits((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  // Exit PIN Check
  const handleExitPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (exitPinInput === '1234' || exitPinInput === 'admin' || exitPinInput === '8888') {
      setIsExitPinOpen(false);
      setExitPinInput('');
      setExitPinError(false);
      onClose();
    } else {
      setExitPinError(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header / Receptionist Brand Bar */}
      <header className="px-8 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/40">
            GP
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wide text-white flex items-center gap-2">
              KIOS CHECK-IN MANDIRI
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Self-Service Kiosk
              </span>
            </h1>
            <p className="text-xs text-slate-400">Sentuh layar untuk check-in dan ambil loker secara otomatis</p>
          </div>
        </div>

        {/* Security Staff Exit Button */}
        <button
          onClick={() => setIsExitPinOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold transition-all"
        >
          <Lock className="w-3.5 h-3.5" />
          Keluar Mode Kios
        </button>
      </header>

      {/* Main Kiosk Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-center items-center">
        {successData ? (
          /* SUCCESS SCREEN DISPLAY */
          <div className="w-full max-w-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                CHECK-IN BERHASIL • {successData.checkedInAt} WIB
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                Selamat Datang, {successData.member.name}!
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Paket: <strong className="text-white">{successData.member.membershipType || 'All Club'}</strong> • Masa Aktif s/d{' '}
                <strong className="text-emerald-300">{successData.member.expired || 'Aktif'}</strong>
              </p>
            </div>

            {/* BIG LOCKER NUMBER CARD */}
            <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border border-emerald-500/50 rounded-2xl p-6 shadow-inner">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
                NOMOR LOKER ANDA
              </span>
              <div className="text-6xl font-black text-emerald-400 tracking-tight">
                #{successData.lockerNumber}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Kunci loker telah dipersiapkan. Harap kembalikan kunci ke resepsionis saat check-out.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
              Layar akan kembali otomatis dalam <strong className="text-white">{resetTimer} detik</strong>...
            </div>

            <button
              onClick={handleResetIdle}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
            >
              Selesai / Member Berikutnya
            </button>
          </div>
        ) : (
          /* IDLE / INPUT SCREEN */
          <div className="w-full max-w-xl space-y-6">
            {/* Mode Selector Tabs */}
            <div className="flex rounded-2xl bg-slate-900 p-1.5 border border-slate-800">
              <button
                onClick={() => {
                  setInputMode('KEYPAD');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  inputMode === 'KEYPAD'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                4 Digit Terakhir No. HP
              </button>

              <button
                onClick={() => {
                  setInputMode('QR');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  inputMode === 'QR'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                Scan Kartu / QR Code
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-sm font-semibold flex items-center gap-3">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {inputMode === 'KEYPAD' ? (
              /* TOUCH NUMPAD INTERFACE */
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="text-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Masukkan 4 Digit Terakhir Nomor HP Anda:
                  </label>
                  <div className="flex justify-center gap-4 mt-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black font-mono transition-all ${
                          digits[idx]
                            ? 'border-emerald-400 text-emerald-400 bg-emerald-950/30 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                            : 'border-slate-700 text-slate-500 bg-slate-950/50'
                        }`}
                      >
                        {digits[idx] || '•'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Large Touch Keypad (0-9) */}
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleKeypadPress(num)}
                      className="h-16 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-2xl font-bold text-white border border-slate-700/80 shadow transition-all flex items-center justify-center"
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    onClick={() => setDigits('')}
                    className="h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider border border-slate-800 flex items-center justify-center"
                  >
                    Clear
                  </button>

                  <button
                    onClick={() => handleKeypadPress('0')}
                    className="h-16 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-2xl font-bold text-white border border-slate-700/80 shadow transition-all flex items-center justify-center"
                  >
                    0
                  </button>

                  <button
                    onClick={handleKeypadDelete}
                    className="h-16 rounded-2xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 flex items-center justify-center active:scale-95"
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ) : (
              /* QR CODE SCANNER VIEW */
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
                <div className="w-48 h-48 mx-auto rounded-3xl border-2 border-dashed border-emerald-400 flex flex-col items-center justify-center bg-slate-950/60 p-4 relative">
                  <div className="absolute inset-0 border-2 border-emerald-400 animate-pulse rounded-3xl pointer-events-none" />
                  <QrCode className="w-20 h-20 text-emerald-400 opacity-90" />
                  <span className="text-[11px] text-slate-400 font-mono mt-2">Arahkan QR ke Kamera / Scanner</span>
                </div>

                <div className="max-w-xs mx-auto">
                  <input
                    ref={qrInputRef}
                    type="text"
                    placeholder="Input scanner otomatis..."
                    className="w-full text-center p-3 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        processCheckIn((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Mendukung pemindai USB barcode/QR fisik maupun kartu RFID gym.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
        <span>Butuh bantuan? Silakan panggil petugas front desk kami.</span>
        <span>•</span>
        <span>Loker otomatis dialokasikan sesuai ketersediaan.</span>
      </footer>

      {/* Staff Exit Security PIN Modal */}
      {isExitPinOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                PIN Keamanan Resepsionis
              </h3>
              <button
                onClick={() => {
                  setIsExitPinOpen(false);
                  setExitPinInput('');
                  setExitPinError(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Masukkan PIN staf untuk keluar dari layar Kios Mandiri dan kembali ke Dashboard ERP:
            </p>

            <form onSubmit={handleExitPinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={8}
                autoFocus
                placeholder="Default PIN: 1234"
                value={exitPinInput}
                onChange={(e) => setExitPinInput(e.target.value)}
                className="w-full text-center text-2xl tracking-widest p-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {exitPinError && (
                <p className="text-xs text-rose-400 text-center font-semibold">
                  PIN Salah! Gunakan PIN default 1234.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExitPinOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Konfirmasi Keluar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
