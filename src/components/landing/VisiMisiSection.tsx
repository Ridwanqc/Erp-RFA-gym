import React, { useState } from 'react';
import {
  Compass,
  Target,
  Sparkles,
  CheckCircle2,
  Shield,
  Heart,
  TrendingUp,
  Award
} from 'lucide-react';

export const VisiMisiSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visi' | 'misi' | 'values'>('visi');

  return (
    <section id="visi-misi" className="py-20 bg-zinc-950 border-t border-zinc-900 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Compass className="w-3.5 h-3.5" />
            <span>Fondasi & Nilai Utama</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            VISI, MISI & NILAI BUDAYA RFA
          </h2>
          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            Komitmen kami tidak pernah berhenti pada fasilitas fisik. Kami berpegang teguh pada nilai-nilai yang menumbuhkan disiplin, respek, dan pencapaian tanpa batas bagi setiap member.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setActiveTab('visi')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'visi'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Visi Utama
            </button>
            <button
              onClick={() => setActiveTab('misi')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'misi'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Misi Strategis
            </button>
            <button
              onClick={() => setActiveTab('values')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'values'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              R-F-A Core Values
            </button>
          </div>
        </div>

        {/* Dynamic Card Display */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'visi' && (
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-orange-500/30 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-6">
                <Target className="w-7 h-7" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-orange-400">
                Visi Jangka Panjang RFA Gym
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-snug">
                "Menjadi ekosistem kebugaran urban nomor satu di Indonesia yang memadukan fasilitas fisik kelas dunia dengan kemudahan teknologi digital, guna melahirkan generasi yang bugar, disiplin, dan berdaya saing tinggi."
              </h3>
              <div className="mt-8 pt-6 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Kebugaran Berkelanjutan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Inovasi Digital ERP & Reservasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Komunitas yang Saling Mendukung</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'misi' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
              {[
                {
                  no: '01',
                  title: 'Akses Fasilitas & Alat Berstandar Internasional',
                  desc: 'Menyediakan peralatan biomekanik modern dan zona fungsional yang selalu terawat dan terkalibrasi aman.'
                },
                {
                  no: '02',
                  title: 'Pelatihan Ilmiah Bersama Coach Tersertifikasi',
                  desc: 'Menghadirkan bimbingan latihan berbasis bukti sains yang aman bagi pemula hingga atlet berpengalaman.'
                },
                {
                  no: '03',
                  title: 'Komunitas Inklusif Tanpa Diskriminasi',
                  desc: 'Menciptakan lingkungan gym yang ramah, bebas intimidasi, dan saling menginspirasi setiap hari.'
                },
                {
                  no: '04',
                  title: 'Kemudahan Ekosistem Digital Terintegrasi',
                  desc: 'Mempermudah proses booking slot kelas, pantauan progres keanggotaan, serta transparansi operasional.'
                }
              ].map((m) => (
                <div
                  key={m.no}
                  className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 transition-colors"
                >
                  <span className="text-xl font-black text-orange-500">{m.no}</span>
                  <h4 className="text-base font-bold text-white mt-2 mb-2">{m.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'values' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="p-8 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-orange-500/40 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-3xl font-black mb-4">
                  R
                </div>
                <h4 className="text-xl font-black text-white">RESPECT</h4>
                <p className="text-xs text-orange-400 font-bold uppercase mt-1 tracking-wider">
                  Saling Menghargai
                </p>
                <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
                  Menghormati setiap individu terlepas dari titik awal kebugarannya, menjaga etika pemakaian alat, dan saling menyemangati.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/40 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl font-black mb-4">
                  F
                </div>
                <h4 className="text-xl font-black text-white">FOCUS</h4>
                <p className="text-xs text-amber-400 font-bold uppercase mt-1 tracking-wider">
                  Fokus pada Tujuan
                </p>
                <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
                  Disiplin menjalani setiap sesi latihan, konsisten menjaga pola nutrisi, dan fokus melampaui batasan diri sendiri.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-emerald-500/40 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl font-black mb-4">
                  A
                </div>
                <h4 className="text-xl font-black text-white">ACHIEVE</h4>
                <p className="text-xs text-emerald-400 font-bold uppercase mt-1 tracking-wider">
                  Mencapai Prestasi
                </p>
                <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
                  Merayakan setiap progres kecil, menembus rekor pribadi, dan menikmati transformasi fisik serta kesehatan jangka panjang.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
