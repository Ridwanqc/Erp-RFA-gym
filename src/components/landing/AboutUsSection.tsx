import React, { useState } from 'react';
import {
  Building2,
  Award,
  Users,
  Flame,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Calendar,
  Sparkles,
  Dumbbell
} from 'lucide-react';
import { SafeImage } from '../common/SafeImage';
import {
  TRAINER_PROFILES,
  FACILITY_GALLERY,
  RFA_MILESTONES
} from '../../data/landingData';
import { FacilityGalleryItem, TrainerProfile } from '../../types/landingTypes';

interface AboutUsSectionProps {
  onSelectTrainerForBooking: (trainerName: string) => void;
}

export const AboutUsSection: React.FC<AboutUsSectionProps> = ({
  onSelectTrainerForBooking
}) => {
  const [activeGalleryTab, setActiveGalleryTab] = useState<'all' | 'gym' | 'studio' | 'recovery' | 'lounge'>('all');
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerProfile | null>(null);

  const filteredGallery = activeGalleryTab === 'all'
    ? FACILITY_GALLERY
    : FACILITY_GALLERY.filter((item) => item.category === activeGalleryTab);

  return (
    <section id="about-us" className="py-24 bg-zinc-950 border-t border-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Building2 className="w-3.5 h-3.5" />
            <span>Tentang RFA Gym</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            DEDIKASI KAMI UNTUK PERFORMA TERBAIK ANDA
          </h2>
          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            Berawal dari sebuah studio latihan intensif pada 2018, RFA Gym kini berkembang menjadi ekosistem kebugaran urban terpadu dengan standar fasilitas internasional dan pelatih profesional.
          </p>
        </div>

        {/* Story & Milestones Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-2xl font-black text-white">
              Mengubah Cara Masyarakat Urban Memandang Kebugaran
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Di RFA Gym, kami percaya bahwa kebugaran bukan sekadar mengangkat beban atau membakar kalori. Kebugaran adalah fondasi kepercayaan diri, ketahanan mental menghadapi tekanan hidup, dan energi berkelanjutan untuk meraih impian Anda setiap hari.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Dengan memadukan sains biomekanik, bimbingan nutrisi praktis, dan teknologi manajemen modern berbasis cloud, kami memastikan setiap menit yang Anda investasikan di gym berbuah hasil nyata yang tahan lama.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-2xl font-black text-orange-400">8+ Tahun</span>
                <p className="text-xs text-zinc-400 mt-1">Eksistensi & Pengalaman</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-2xl font-black text-amber-400">98.4%</span>
                <p className="text-xs text-zinc-400 mt-1">Kepuasan Member & Klien</p>
              </div>
            </div>
          </div>

          {/* Timeline Milestones */}
          <div className="lg:col-span-6 space-y-4">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">
              Perjalanan & Tonggak Sejarah RFA
            </h4>
            <div className="space-y-3">
              {RFA_MILESTONES.map((m) => (
                <div
                  key={m.year}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-orange-500/30 transition-colors"
                >
                  <div className="px-3 py-1.5 rounded-xl bg-orange-500/15 text-orange-400 font-black text-xs shrink-0 border border-orange-500/25">
                    {m.year}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">{m.title}</h5>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Facility Gallery */}
        <div className="mb-20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-2xl font-black text-white">Galeri Fasilitas Premium</h3>
              <p className="text-xs text-zinc-400 mt-1">Jelajahi sudut kenyamanan dan kelengkapan peralatan RFA Gym</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'gym', label: 'Gym Zone' },
                { id: 'studio', label: 'Studio Class' },
                { id: 'recovery', label: 'Recovery & Sauna' },
                { id: 'lounge', label: 'Lounge' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGalleryTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    activeGalleryTab === tab.id
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 transition-all duration-300 shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    fallbackType="facility"
                    fallbackText={item.title}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                    {item.category === 'gym' ? 'Weight & Cardio' : item.category === 'studio' ? 'Aerobic & Yoga' : item.category === 'recovery' ? 'Relaxation' : 'Healthy Fuel'}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1 group-hover:text-orange-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tim Trainer Profesional */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl sm:text-3xl font-black text-white">Tim Personal Trainer Bersertifikasi</h3>
            <p className="text-sm text-zinc-400 mt-2">
              Didampingi oleh para coach terbaik dengan lisensi kebugaran internasional yang siap memandu latihan Anda dengan aman dan terukur.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRAINER_PROFILES.map((tr) => (
              <div
                key={tr.id}
                className="group rounded-3xl overflow-hidden bg-zinc-900/80 border border-zinc-800 hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[3/3.8] overflow-hidden relative">
                    <SafeImage
                      src={tr.photo}
                      alt={tr.name}
                      fallbackType="trainer"
                      fallbackText={tr.name}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-900/90 text-amber-400 border border-amber-500/30">
                        {tr.experience}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="text-base font-extrabold text-white group-hover:text-orange-400 transition-colors">
                        {tr.name}
                      </h4>
                      <p className="text-xs text-orange-400/90 font-medium">{tr.role}</p>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                      {tr.bio}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {tr.specialty.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => onSelectTrainerForBooking(tr.name)}
                    className="w-full py-2.5 rounded-xl bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Pilih Trainer Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
