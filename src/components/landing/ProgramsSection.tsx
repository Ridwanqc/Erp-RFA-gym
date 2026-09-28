import React, { useState } from 'react';
import {
  Dumbbell,
  Flame,
  Clock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Filter,
  Sparkles
} from 'lucide-react';
import { SafeImage } from '../common/SafeImage';
import { RFA_PROGRAMS } from '../../data/landingData';
import { LandingProgram } from '../../types/landingTypes';

interface ProgramsSectionProps {
  onSelectProgramForBooking: (program: LandingProgram) => void;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({
  onSelectProgramForBooking
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Semua Program' },
    { id: 'strength', label: 'Strength & Muscle' },
    { id: 'cardio', label: 'HIIT & Fat Loss' },
    { id: 'mindbody', label: 'Yoga & Pilates' },
    { id: 'combat', label: 'Boxing & Muaythai' },
    { id: 'personal', label: '1-on-1 Private PT' }
  ];

  const filteredPrograms = activeCategory === 'all'
    ? RFA_PROGRAMS
    : RFA_PROGRAMS.filter((p) => p.category === activeCategory);

  return (
    <section id="programs" className="py-24 bg-zinc-950 border-t border-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Flame className="w-3.5 h-3.5" />
            <span>Pilihan Program Unggulan</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            6 PROGRAM LATIHAN UTAMA BERSTANDAR ATLET
          </h2>
          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            Pilih program yang paling sesuai dengan target fisik Anda, mulai dari pembentukan massa otot, pembakaran lemak cepat, hingga fleksibilitas dan ketahanan tubuh holistik.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex justify-center mb-12 overflow-x-auto pb-2">
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((prog) => (
            <div
              key={prog.id}
              className="group rounded-3xl overflow-hidden bg-zinc-900/90 border border-zinc-800 hover:border-orange-500/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-xl hover:shadow-orange-500/10"
            >
              <div>
                {/* Program Header Image & Badges */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <SafeImage
                    src={prog.image}
                    alt={prog.name}
                    fallbackType="program"
                    fallbackText={prog.name}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent pointer-events-none" />

                  {prog.popular && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-orange-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Terfavorit</span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-bold text-white">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      {prog.duration}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 flex items-center gap-1.5 text-amber-400">
                      <Flame className="w-3.5 h-3.5" />
                      {prog.caloriesBurned}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-orange-400 transition-colors">
                      {prog.name}
                    </h3>
                    <p className="text-xs font-semibold text-orange-400/90 mt-1">
                      {prog.tagline}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {prog.description}
                  </p>

                  {/* Program Features Bullet Points */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    {prog.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-[11px] text-zinc-500 font-medium">
                    Pelatih: <span className="text-zinc-300 font-semibold">{prog.trainerName}</span>
                  </div>
                </div>
              </div>

              {/* Bottom CTA with Auto-fill Trigger */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => onSelectProgramForBooking(prog)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/30 transition-all active:scale-95"
                >
                  <span>Daftar Program Ini</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
