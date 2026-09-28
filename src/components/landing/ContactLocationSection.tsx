import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Send,
  MessageCircle,
  Building2,
  CheckCircle2,
  Flame,
  ArrowRight,
  ShieldCheck,
  Instagram,
  Facebook,
  Youtube
} from 'lucide-react';
import { BRANCH_CONTACTS } from '../../data/landingData';

interface ContactLocationSectionProps {
  onOpenStaffLogin: () => void;
  onOpenMemberArea: () => void;
  onOpenReservation: () => void;
}

export const ContactLocationSection: React.FC<ContactLocationSectionProps> = ({
  onOpenStaffLogin,
  onOpenMemberArea,
  onOpenReservation
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('BR-001');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const activeBranch = BRANCH_CONTACTS.find((b) => b.id === selectedBranchId) || BRANCH_CONTACTS[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setContactName('');
      setContactPhone('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <section id="contact" className="py-24 bg-zinc-950 border-t border-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span>Lokasi & Kontak Kami</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            TEMUKAN CABANG RFA GYM TERDEKAT
          </h2>
          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            Kunjungi pusat kebugaran kami di lokasi-lokasi paling strategis di Jakarta & Tangerang Selatan. Siap menyambut Anda dengan fasilitas prima setiap hari.
          </p>
        </div>

        {/* Branch Selector Tabs */}
        <div className="flex justify-center mb-10 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            {BRANCH_CONTACTS.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  selectedBranchId === branch.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{branch.shortName}</span>
                {branch.isFlagship && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-zinc-950 font-black">
                    FLAGSHIP
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Branch Detail & Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
          {/* Left: Active Branch Info */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                <span>Profil Cabang</span>
                {activeBranch.isFlagship && <span>• Flagship Hub</span>}
              </div>
              <h3 className="text-2xl font-black text-white">{activeBranch.name}</h3>
            </div>

            <div className="space-y-4 text-xs text-zinc-300">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">Alamat Lengkap</span>
                  <span className="text-zinc-400 leading-relaxed">{activeBranch.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Jam Operasional</span>
                    <span className="text-zinc-400 leading-relaxed">{activeBranch.hours}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Telepon & WhatsApp</span>
                    <span className="text-zinc-400 block">{activeBranch.phone}</span>
                    <a
                      href={`https://wa.me/${activeBranch.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Chat WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Facilities Chips */}
              <div>
                <span className="font-bold text-zinc-400 block mb-2">Fasilitas Utama di Cabang Ini:</span>
                <div className="flex flex-wrap gap-2">
                  {activeBranch.facilities.map((fac, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-700/60 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenReservation}
                className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 transition-all"
              >
                <span>Reservasi di Cabang Ini</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Quick Inquiry Form */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Hubungi Tim RFA</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Kirim pesan cepat atau konsultasi gratis mengenai kebutuhan latihan Anda.
              </p>
            </div>

            {messageSent ? (
              <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-2 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-300">Pesan Berhasil Terkirim!</h4>
                <p className="text-xs text-zinc-300">
                  Konsultan kebugaran kami akan menghubungi Anda via WhatsApp dalam waktu maksimal 15 menit.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Anda"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    No. WhatsApp Aktif *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Pesan / Pertanyaan
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan pertanyaan seputar biaya paket, bimbingan personal trainer, jadwal kelas..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Pesan Konsultasi</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Global Footer */}
        <footer className="pt-12 border-t border-zinc-900 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-zinc-400">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-white">
                RFA <span className="text-orange-500">GYM</span> PLATFORM
              </span>
            </div>
            <p className="leading-relaxed text-zinc-400">
              Pusat kebugaran premium berstandar internasional dengan manajemen modern terintegrasi cloud dan reservasi online instan.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#programs" className="hover:text-orange-400 transition-colors">Program Latihan</a>
              </li>
              <li>
                <a href="#schedule" className="hover:text-orange-400 transition-colors">Jadwal & Kuota Slot</a>
              </li>
              <li>
                <a href="#bmi-calc" className="hover:text-orange-400 transition-colors">Kalkulator BMI & Berat Ideal</a>
              </li>
              <li>
                <a href="#about-us" className="hover:text-orange-400 transition-colors">Tentang Kami & Trainer</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-orange-400 transition-colors">FAQ & Bantuan</a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Akses Portal & Member
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={onOpenMemberArea}
                  className="hover:text-orange-400 transition-colors text-left"
                >
                  Area Member (Tiket QR & Kuota)
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenReservation}
                  className="hover:text-orange-400 transition-colors text-left"
                >
                  Reservasi Single Day Pass
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenStaffLogin}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-left font-medium"
                >
                  Portal Login Staf & ERP Kasir
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Media Sosial & Komunitas
            </h4>
            <p className="leading-relaxed mb-3">
              Ikuti konten harian latihan, workout challenge, dan tips nutrisi dari coach RFA.
            </p>
            <div className="flex items-center gap-3 text-zinc-400">
              <a href="#" className="p-2 rounded-xl bg-zinc-900 hover:text-orange-400 hover:bg-zinc-800 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-zinc-900 hover:text-orange-400 hover:bg-zinc-800 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-zinc-900 hover:text-orange-400 hover:bg-zinc-800 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </footer>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-zinc-900/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
          <span>&copy; {new Date().getFullYear()} RFA GYM PLATFORM. All rights reserved.</span>
          <span>Powered by GymPro ERP Enterprise Cloud</span>
        </div>
      </div>
    </section>
  );
};
