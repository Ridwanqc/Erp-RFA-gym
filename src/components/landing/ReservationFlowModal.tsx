import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Printer,
  Share2,
  Sparkles,
  ShieldCheck,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Member, StudioClass } from '../../types';
import { BRANCH_CONTACTS, RFA_PROGRAMS, TRAINER_PROFILES } from '../../data/landingData';
import { OnlineReservation, LandingProgram } from '../../types/landingTypes';
import { APP_TODAY } from '../../utils/formatters';

interface ReservationFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledProgram?: LandingProgram | null;
  prefilledClass?: StudioClass | null;
  prefilledTrainer?: string | null;
  members: Member[];
  onCompleteReservation: (reservation: OnlineReservation) => void;
  onOpenMemberDashboard: (member: Member) => void;
}

export const ReservationFlowModal: React.FC<ReservationFlowModalProps> = ({
  isOpen,
  onClose,
  prefilledProgram,
  prefilledClass,
  prefilledTrainer,
  members,
  onCompleteReservation,
  onOpenMemberDashboard
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [reservationType, setReservationType] = useState<'class' | 'pt' | 'daypass'>('class');
  const [selectedProgram, setSelectedProgram] = useState<string>('Weight Training & Bodybuilding');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('BR-001');
  const [targetDate, setTargetDate] = useState<string>(APP_TODAY);
  const [timeSlot, setTimeSlot] = useState<string>('08:00 - 09:30 WIB');
  const [selectedTrainer, setSelectedTrainer] = useState<string>('Bima Pratama');

  // Customer Form
  const [isExistingMember, setIsExistingMember] = useState<boolean>(false);
  const [memberSearchId, setMemberSearchId] = useState<string>('');
  const [foundMember, setFoundMember] = useState<Member | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [fitnessGoal, setFitnessGoal] = useState<string>('Fat Loss & Muscle Tone');
  const [notes, setNotes] = useState<string>('');

  // Generated Ticket Result
  const [createdReservation, setCreatedReservation] = useState<OnlineReservation | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-fill from incoming props
  useEffect(() => {
    if (prefilledProgram) {
      if (prefilledProgram.category === 'personal') {
        setReservationType('pt');
      } else {
        setReservationType('class');
      }
      setSelectedProgram(prefilledProgram.name);
      setCurrentStep(2); // Jump to slot selection
    } else if (prefilledClass) {
      setReservationType('class');
      setSelectedProgram(prefilledClass.name);
      setTimeSlot(`${prefilledClass.time} WIB`);
      if (prefilledClass.trainer) {
        setSelectedTrainer(prefilledClass.trainer);
      }
      setCurrentStep(2);
    } else if (prefilledTrainer) {
      setReservationType('pt');
      setSelectedProgram('1-on-1 Personal Trainer Coaching');
      setSelectedTrainer(prefilledTrainer);
      setCurrentStep(2);
    }
  }, [prefilledProgram, prefilledClass, prefilledTrainer]);

  // Lookup member if existing
  const handleMemberLookup = (query: string) => {
    setMemberSearchId(query);
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setFoundMember(null);
      return;
    }
    const matched = members.find(
      (m) =>
        m.id.toLowerCase() === clean ||
        m.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '') ||
        m.name.toLowerCase().includes(clean)
    );
    if (matched) {
      setFoundMember(matched);
      setCustomerName(matched.name);
      setCustomerPhone(matched.phone);
      setCustomerEmail(matched.email || '');
    } else {
      setFoundMember(null);
    }
  };

  // Generate QR code when reaching step 4
  useEffect(() => {
    if (currentStep === 4 && createdReservation && qrCanvasRef.current) {
      try {
        if ((window as any).QRious) {
          new (window as any).QRious({
            element: qrCanvasRef.current,
            value: createdReservation.qrCodeData,
            size: 160,
            level: 'H'
          });
        }
      } catch (err) {
        console.error('Error drawing QR code', err);
      }
    }
  }, [currentStep, createdReservation]);

  const handleConfirmReservation = () => {
    const randomTicketNumber = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `RFA-BK-${new Date().getFullYear()}-${randomTicketNumber}`;
    const passCode = `PASS-${Math.floor(1000 + Math.random() * 9000)}`;

    const targetBranch = BRANCH_CONTACTS.find((b) => b.id === selectedBranchId) || BRANCH_CONTACTS[0];

    const newRes: OnlineReservation = {
      id: bookingId,
      bookingDate: APP_TODAY,
      targetDate,
      timeSlot,
      programName: selectedProgram,
      programCategory:
        reservationType === 'class'
          ? 'Studio Class'
          : reservationType === 'pt'
          ? 'Personal Trainer'
          : 'Gym Day Pass',
      branchId: targetBranch.id,
      branchName: targetBranch.name,
      memberId: foundMember?.id || (isExistingMember ? memberSearchId : undefined),
      customerName: customerName || 'Pengunjung RFA',
      customerPhone: customerPhone || '081234567890',
      customerEmail: customerEmail || 'member@rfagym.com',
      trainerName: reservationType === 'pt' ? selectedTrainer : undefined,
      notes: notes ? `${notes} (Tujuan: ${fitnessGoal})` : `Tujuan: ${fitnessGoal}`,
      status: 'CONFIRMED',
      qrCodeData: `RFA-PASS|${bookingId}|${customerName}|${targetBranch.shortName}|${targetDate}|${timeSlot}`,
      ticketPassCode: passCode,
      type: reservationType
    };

    setCreatedReservation(newRes);
    onCompleteReservation(newRes);
    setCurrentStep(4);
  };

  const handleShareToWhatsApp = () => {
    if (!createdReservation) return;
    const msg = `*TIKET RESERVASI RESMI RFA GYM PLATFORM*%0A` +
      `No. Booking: *${createdReservation.id}*%0A` +
      `Passcode: *${createdReservation.ticketPassCode}*%0A` +
      `Nama: *${createdReservation.customerName}*%0A` +
      `Program: *${createdReservation.programName}*%0A` +
      `Cabang: *${createdReservation.branchName}*%0A` +
      `Tanggal: *${createdReservation.targetDate}*%0A` +
      `Waktu: *${createdReservation.timeSlot}*%0A` +
      `Status: *TERKONFIRMASI*%0A%0A` +
      `Tunjukkan pesan atau QR Code tiket ini ke resepsionis Front Desk saat tiba di gym.`;

    const phoneClean = createdReservation.customerPhone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean}?text=${msg}`;
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

  const handlePrintTicket = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl shadow-orange-500/10 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Reservasi Online RFA Gym
              </h3>
              <p className="text-xs text-zinc-400">
                Pemesanan slot latihan cepat & instan dengan tiket digital QR Code
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

        {/* Step Progress Bar */}
        {currentStep < 4 && (
          <div className="px-6 py-3 bg-zinc-900/50 border-b border-zinc-800/80">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span className={currentStep >= 1 ? 'text-orange-400' : ''}>1. Jenis & Program</span>
              <span>&rarr;</span>
              <span className={currentStep >= 2 ? 'text-orange-400' : ''}>2. Slot & Cabang</span>
              <span>&rarr;</span>
              <span className={currentStep >= 3 ? 'text-orange-400' : ''}>3. Data Pemesan</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-200">
          {/* STEP 1: Pilih Jenis & Program */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                  Pilih Kategori Reservasi
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'class', label: 'Studio Class', desc: 'Zumba, Yoga, HIIT, Combat' },
                    { id: 'pt', label: '1-on-1 PT', desc: 'Privat Coaching Personal' },
                    { id: 'daypass', label: 'Gym Day Pass', desc: 'Akses Gym Bebas Seharian' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setReservationType(t.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        reservationType === t.id
                          ? 'bg-orange-500/15 border-orange-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white mb-1">{t.label}</div>
                      <div className="text-[10px] text-zinc-400 line-clamp-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Program */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                  Pilih Program Latihan
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {RFA_PROGRAMS.map((prog) => (
                    <div
                      key={prog.id}
                      onClick={() => setSelectedProgram(prog.name)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        selectedProgram === prog.name
                          ? 'bg-zinc-900 border-orange-500 text-white'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{prog.name}</div>
                        <div className="text-[11px] text-zinc-400">{prog.tagline}</div>
                      </div>
                      <span className="text-[10px] font-semibold text-orange-400 px-2 py-0.5 rounded bg-zinc-800">
                        {prog.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Pilih Cabang & Jadwal / Jam Slot */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Branch */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                  Pilih Cabang RFA Gym
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {BRANCH_CONTACTS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedBranchId === b.id
                          ? 'bg-orange-500/15 border-orange-500 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{b.shortName}</div>
                      <div className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{b.hours}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                    Tanggal Latihan
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    min={APP_TODAY}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                    Pilihan Slot Waktu
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="07:00 - 08:30 WIB">Pagi (07:00 - 08:30 WIB)</option>
                    <option value="08:30 - 10:00 WIB">Pagi (08:30 - 10:00 WIB)</option>
                    <option value="12:00 - 13:30 WIB">Siang (12:00 - 13:30 WIB)</option>
                    <option value="17:00 - 18:30 WIB">Sore (17:00 - 18:30 WIB)</option>
                    <option value="19:00 - 20:30 WIB">Malam (19:00 - 20:30 WIB)</option>
                  </select>
                </div>
              </div>

              {/* Coach Selection if PT */}
              {reservationType === 'pt' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                    Pilih Personal Trainer
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TRAINER_PROFILES.map((tr) => (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => setSelectedTrainer(tr.name)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          selectedTrainer === tr.name
                            ? 'bg-orange-500/20 border-orange-500 text-white font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-white truncate">{tr.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{tr.specialty[0]}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Data Pemesan & Member Verification */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Toggle Existing Member */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-xs font-semibold text-zinc-300">
                  Apakah Anda sudah menjadi Member terdaftar di RFA Gym?
                </span>
                <button
                  type="button"
                  onClick={() => setIsExistingMember(!isExistingMember)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    isExistingMember
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isExistingMember ? 'Ya, Saya Member' : 'Belum (Pengunjung Baru)'}
                </button>
              </div>

              {/* If existing member, lookup field */}
              {isExistingMember && (
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-orange-500/30 space-y-2">
                  <label className="block text-xs font-bold text-orange-400">
                    Masukkan No. HP atau ID Member Anda:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: M001 atau 08123456789"
                    value={memberSearchId}
                    onChange={(e) => handleMemberLookup(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                  {foundMember ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                      <div>
                        <strong>{foundMember.name}</strong> ({foundMember.id}) - Status: {foundMember.status}
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  ) : memberSearchId.trim() ? (
                    <div className="text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Data belum cocok. Silakan lengkapi form manual di bawah.</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Manual Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Anda"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    No. WhatsApp (Aktif) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Target / Gol Kebugaran
                  </label>
                  <select
                    value={fitnessGoal}
                    onChange={(e) => setFitnessGoal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Fat Loss & Muscle Tone">Fat Loss & Pengencangan</option>
                    <option value="Hypertrophy & Bulking">Pembentukan Otot (Hypertrophy)</option>
                    <option value="Kardio & Stamina">Peningkatan Stamina & Daya Tahan</option>
                    <option value="Fleksibilitas & Postur">Perbaikan Postur & Mobilitas</option>
                    <option value="Persiapan Lomba/Event">Persiapan Event / Olahraga Khusus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: ada riwayat cedera lutut, request posisi baris depan, dll."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Konfirmasi & Tiket Digital Sukses */}
          {currentStep === 4 && createdReservation && (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-black text-white">RESERVASI BERHASIL DIKONFIRMASI!</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Tiket reservasi digital Anda telah terbit dan tersimpan di sistem RFA Gym.
                </p>
              </div>

              {/* Digital Pass Ticket Card */}
              <div
                id="digital-reservation-ticket"
                className="max-w-md mx-auto p-6 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-orange-500/40 shadow-2xl text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />

                {/* Ticket Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                      RFA GYM DIGITAL PASS
                    </span>
                    <h5 className="text-base font-extrabold text-white">
                      {createdReservation.programName}
                    </h5>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                    CONFIRMED
                  </span>
                </div>

                {/* Ticket Details */}
                <div className="py-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Kode Booking:</span>
                    <span className="font-mono font-bold text-white">{createdReservation.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Nama Tamu/Member:</span>
                    <span className="font-bold text-white">{createdReservation.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cabang Latihan:</span>
                    <span className="font-bold text-orange-300">{createdReservation.branchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tanggal & Jam:</span>
                    <span className="font-bold text-white">
                      {createdReservation.targetDate} ({createdReservation.timeSlot})
                    </span>
                  </div>
                  {createdReservation.trainerName && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Personal Trainer:</span>
                      <span className="font-bold text-white">{createdReservation.trainerName}</span>
                    </div>
                  )}
                </div>

                {/* QR Code Canvas */}
                <div className="pt-4 border-t border-zinc-800 flex flex-col items-center justify-center">
                  <div className="p-3 bg-white rounded-2xl shadow-inner">
                    <canvas ref={qrCanvasRef} width={140} height={140} className="w-28 h-28" />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2 font-mono">
                    PASSCODE: <strong className="text-zinc-200">{createdReservation.ticketPassCode}</strong>
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Scan pada turnstile atau tunjukkan ke resepsionis Front Desk
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleShareToWhatsApp}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim ke WhatsApp</span>
                </button>

                <button
                  onClick={handlePrintTicket}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak E-Ticket</span>
                </button>

                {foundMember && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMemberDashboard(foundMember);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Lihat di Dashboard Member</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {currentStep < 4 && (
          <div className="p-4 sm:p-5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20"
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!customerName.trim() || !customerPhone.trim()}
                onClick={handleConfirmReservation}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi & Terbitkan Tiket</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
