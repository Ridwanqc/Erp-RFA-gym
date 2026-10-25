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
  User,
  Handshake,
  Tag,
  DollarSign,
  X,
  Send,
  Check
} from 'lucide-react';
import { Attendance, Member, LandingPromoPlan } from '../../types';
import { BRANCH_CONTACTS, getDynamicBranchContacts } from '../../data/landingData';
import { useSettings } from '../../context/SettingsContext';
import { DEFAULT_PROMO_CONFIG } from '../../data/settingsData';
import { formatRp } from '../../utils/formatters';

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

  // Dynamic CMS Promo Config synced with Settings
  const { settings } = useSettings();
  const promoConfig = settings?.landing?.promos || DEFAULT_PROMO_CONFIG;
  const promoPlans =
    promoConfig?.plans && promoConfig.plans.length > 0
      ? promoConfig.plans
      : DEFAULT_PROMO_CONFIG.plans;

  // Member Negotiation / Tawar Modal State
  const [isNegoModalOpen, setIsNegoModalOpen] = useState(false);
  const [selectedPlanForNego, setSelectedPlanForNego] = useState<LandingPromoPlan | null>(null);
  const [negoProposedPrice, setNegoProposedPrice] = useState<number>(0);
  const [negoBranchId, setNegoBranchId] = useState<string>('BR-001');
  const [negoMemberName, setNegoMemberName] = useState<string>('');
  const [negoPhone, setNegoPhone] = useState<string>('');
  const [negoMemberId, setNegoMemberId] = useState<string>('');
  const [negoNotes, setNegoNotes] = useState<string>('');
  const [negoSuccessMessage, setNegoSuccessMessage] = useState<string | null>(null);

  // Dynamic branch contacts synced with Settings
  const branchContacts = getDynamicBranchContacts();

  const handleOpenNegotiation = (plan: LandingPromoPlan) => {
    setSelectedPlanForNego(plan);
    const initialNego = plan.memberSpecialPrice || Math.round(plan.price * 0.9);
    setNegoProposedPrice(initialNego);
    setNegoMemberName(loggedInMember?.name || '');
    setNegoPhone(loggedInMember?.phone || '');
    setNegoMemberId(loggedInMember?.id || '');
    setNegoNotes('');
    setNegoSuccessMessage(null);
    setIsNegoModalOpen(true);
  };

  const handleSendNegotiationToWhatsApp = () => {
    if (!selectedPlanForNego) return;
    const branch = branchContacts.find((b) => b.id === negoBranchId) || branchContacts[0];
    const customerIdentifier = loggedInMember
      ? `Member Resmi: ${loggedInMember.name} (ID: ${loggedInMember.id})`
      : negoMemberId
      ? `Member: ${negoMemberName || 'Tamu'} (ID: ${negoMemberId})`
      : `Calon Member: ${negoMemberName || 'Prospek'}`;

    const text = encodeURIComponent(
      `*PENGAJUAN TAWAR & NEGO PAKET MEMBER - RFA GYM*\n\n` +
      `🏢 Cabang Tujuan: *${branch.name}*\n` +
      `👤 Pemohon: *${customerIdentifier}*\n` +
      `📱 No. WhatsApp: *${negoPhone || 'Sesuai chat ini'}*\n` +
      `📦 Paket Dipilih: *${selectedPlanForNego.name} (${selectedPlanForNego.durationLabel || selectedPlanForNego.durationMonths + ' Bulan'})*\n` +
      `💵 Harga Katalog Normal: *${formatRp(selectedPlanForNego.price)}*\n` +
      `🏷️ Harga Khusus Member: *${formatRp(selectedPlanForNego.memberSpecialPrice || Math.round(selectedPlanForNego.price * 0.9))}*\n` +
      `🤝 *HARGA PENAWARAN SAYA*: *${formatRp(negoProposedPrice)}*\n\n` +
      `📝 Catatan / Rencana Latihan:\n"${negoNotes.trim() || 'Siap komitmen aktif jika pengajuan harga disetujui.'}"\n\n` +
      `Mohon approval dari Branch Manager / Supervisor Front Desk. Terima kasih!`
    );

    window.open(`https://wa.me/${branch.whatsapp}?text=${text}`, '_blank');
    setNegoSuccessMessage(`Penawaran ${formatRp(negoProposedPrice)} berhasil diteruskan ke WhatsApp resmi ${branch.name}. Supervisor unit kami akan segera meninjau proposal Anda!`);
  };

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
        {/* PROMINENT "JOIN NOW" CALL-TO-ACTION BANNER & DYNAMIC PROMO PLANS         */}
        {/* ========================================================================= */}
        <div id="join-now" className="scroll-mt-28 mb-16 relative">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-orange-500/40 p-6 sm:p-10 lg:p-12 shadow-2xl shadow-orange-500/10">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Standard & Fast Activation Pill or Member Active Status */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Fasilitas Standar Internasional & Higienis</span>
                </div>
                <span className="text-xs text-zinc-400 hidden sm:inline">• Suasana Nyaman & Bebas Antre</span>
              </div>

              {loggedInMember ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Member Terverifikasi: {loggedInMember.name} ({loggedInMember.id})</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black tracking-wider uppercase">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Aktivasi Instan & WA Resmi Unit</span>
                </div>
              )}
            </div>

            {/* Member Welcome Banner (If Logged In) */}
            {loggedInMember && (
              <div className="relative z-10 mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Tarif Spesial & Fitur Tawar Khusus Member Aktif
                    </h4>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Halo <strong className="text-amber-400">{loggedInMember.name}</strong>, Anda berhak menikmati harga hemat member di bawah ini serta dapat mengajukan tawar / nego langsung ke Supervisor cabang.
                    </p>
                  </div>
                </div>

                {onOpenMemberArea && (
                  <button
                    type="button"
                    onClick={onOpenMemberArea}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Kartu Digital Saya</span>
                  </button>
                )}
              </div>
            )}

            {/* Headline and Value Proposition (Configurable from CMS) */}
            <div className="relative z-10 my-8 text-center lg:text-left max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-400 mb-3">
                <Sparkles className="w-4 h-4" />
                <span>{promoConfig.sectionBadge || 'Pendaftaran Membership & Chat WA Resmi RFA Gym'}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                {promoConfig.sectionTitle || 'SIAP MERAIH GOAL KEBUGARAN ANDA? JOIN NOW DI RFA GYM'}
              </h2>

              <p className="mt-4 text-zinc-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
                {promoConfig.sectionSubtitle ||
                  'Nikmati akses ke 3 cabang strategis, peralatan biometrik berstandar dunia, puluhan studio classes, dan bimbingan pelatih bersertifikasi. Saat mendaftar, tiket dan konfirmasi akan langsung terkirim ke WhatsApp resmi kantor cabang pilihan Anda.'}
              </p>
            </div>

            {/* Dynamic Membership Promo Plan Cards */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 my-8">
              {promoPlans.map((plan) => {
                const memberPrice = plan.memberSpecialPrice || Math.round(plan.price * 0.88);
                const isPopular = plan.isPopular;
                const allowNego = plan.allowNegotiate && (promoConfig.allowMemberOffer ?? true);

                return (
                  <div
                    key={plan.id}
                    className={`p-6 rounded-2xl transition-all flex flex-col justify-between group relative ${
                      isPopular
                        ? 'bg-gradient-to-b from-orange-950/40 via-zinc-950 to-zinc-950 border-2 border-orange-500 shadow-xl shadow-orange-500/10 scale-100 lg:scale-[1.03]'
                        : 'bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                        {plan.badge || 'Paling Populer & Rekomendasi'}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isPopular ? 'text-orange-400 font-black' : 'text-zinc-400'
                          }`}
                        >
                          {isPopular && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                          {plan.tagline || 'Pilihan Favorit'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPopular
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {plan.durationLabel || `${plan.durationMonths} Bulan`}
                        </span>
                      </div>

                      <h4
                        className={`text-xl font-black transition-colors ${
                          isPopular ? 'text-white' : 'text-white group-hover:text-orange-400'
                        }`}
                      >
                        {plan.name}
                      </h4>

                      {/* Pricing Display (With Member Highlight if Logged In or Teaser if Guest) */}
                      <div className="mt-3">
                        {loggedInMember ? (
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                                {formatRp(memberPrice)}
                              </span>
                              <span className="text-xs text-zinc-400">{plan.billingPeriod || '/bulan'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500 line-through">
                                Normal: {formatRp(plan.price)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                Tarif Member
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl sm:text-3xl font-black text-white">
                                {formatRp(plan.price)}
                              </span>
                              <span className="text-xs text-zinc-400">{plan.billingPeriod || '/bulan'}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold">
                              <Tag className="w-3 h-3 text-amber-400" />
                              <span>Tarif Member: {formatRp(memberPrice)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                        {plan.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2">
                            <CheckCircle2
                              className={`w-4 h-4 shrink-0 ${
                                isPopular ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions: Join Button + Tawar Button */}
                    <div className="mt-6 space-y-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleJoinClick(`${plan.name} (${plan.durationLabel || plan.durationMonths + ' Bulan'})`)
                        }
                        className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isPopular
                            ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                        }`}
                      >
                        {isPopular && <Sparkles className="w-3.5 h-3.5 text-amber-200" />}
                        <span>{plan.ctaLabel || 'Pilih Paket • Join Now'}</span>
                        <ArrowRight className={`w-3.5 h-3.5 ${isPopular ? 'text-white' : 'text-orange-400'}`} />
                      </button>

                      {/* Tawar / Nego Button */}
                      {allowNego && (
                        <button
                          type="button"
                          onClick={() => handleOpenNegotiation(plan)}
                          className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Handshake className="w-3.5 h-3.5 text-amber-400" />
                          <span>Tawar / Nego Harga Member</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct Action Hub Buttons */}
            <div className="relative z-10 mt-8 pt-8 border-t border-zinc-800/80 flex flex-col lg:flex-row items-center justify-between gap-5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => handleJoinClick(promoPlans[0]?.name || 'All-Access Pro')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Flame className="w-5 h-5 text-amber-200" />
                  <span>Join Now • Pendaftaran Member Baru</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleInquiryClick('Klaim Free 1-Day Trial Pass')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold text-sm border border-zinc-700 flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
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
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shrink-0 active:scale-95 shadow-md shadow-emerald-600/30 cursor-pointer"
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
        </div>

        {/* Modal Tawar / Nego Paket Member */}
        {isNegoModalOpen && selectedPlanForNego && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Handshake className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white">
                      Tawar / Nego Harga Paket Member
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Ajukan penawaran harga Anda langsung ke General Manager / Front Desk unit
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNegoModalOpen(false)}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {negoSuccessMessage ? (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Proposal Tawar Berhasil Dikirim!</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{negoSuccessMessage}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNegoModalOpen(false);
                      setNegoSuccessMessage(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Plan Summary Box */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                        Paket Yang Ditawar
                      </span>
                      <h4 className="text-base font-extrabold text-white mt-0.5">
                        {selectedPlanForNego.name} ({selectedPlanForNego.durationLabel || selectedPlanForNego.durationMonths + ' Bulan'})
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Harga Normal: <span className="line-through">{formatRp(selectedPlanForNego.price)}</span> • Member: <span className="text-amber-400 font-bold">{formatRp(selectedPlanForNego.memberSpecialPrice || Math.round(selectedPlanForNego.price * 0.88))}</span>
                      </p>
                    </div>
                  </div>

                  {/* Identification inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={negoMemberName}
                        onChange={(e) => setNegoMemberName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Nomor WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={negoPhone}
                        onChange={(e) => setNegoPhone(e.target.value)}
                        placeholder="0812xxxxxxx"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        ID Member (Opsional jika sudah join)
                      </label>
                      <input
                        type="text"
                        value={negoMemberId}
                        onChange={(e) => setNegoMemberId(e.target.value)}
                        placeholder="MBR-00123"
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Pilih Cabang Unit
                      </label>
                      <select
                        value={negoBranchId}
                        onChange={(e) => setNegoBranchId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                      >
                        {branchContacts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Proposed Price with Quick Percentage Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-300">
                        Harga Penawaran Anda (Rp)
                      </label>
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        {formatRp(negoProposedPrice)}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-zinc-500">Rp</span>
                      <input
                        type="number"
                        value={negoProposedPrice || ''}
                        onChange={(e) => setNegoProposedPrice(Number(e.target.value))}
                        step="10000"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-amber-500/50 text-sm font-black text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Quick percentage adjustment chips */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-zinc-400 font-semibold mr-1">Rekomendasi Nego:</span>
                      {[
                        { label: '-5%', factor: 0.95 },
                        { label: '-10%', factor: 0.9 },
                        { label: '-15%', factor: 0.85 },
                        { label: '-20%', factor: 0.8 }
                      ].map((item) => {
                        const target = Math.round((selectedPlanForNego.price * item.factor) / 10000) * 10000;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setNegoProposedPrice(target)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-bold transition cursor-pointer"
                          >
                            {item.label} ({formatRp(target)})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes / Rencana Latihan */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Alasan Penawaran / Komitmen Latihan
                    </label>
                    <textarea
                      rows={2}
                      value={negoNotes}
                      onChange={(e) => setNegoNotes(e.target.value)}
                      placeholder="Contoh: Saya siap bayar langsung 6 bulan di muka, atau bundling dengan sesi PT..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsNegoModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSendNegotiationToWhatsApp}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-zinc-950" />
                      <span>Kirim Penawaran ke WhatsApp Cabang</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
