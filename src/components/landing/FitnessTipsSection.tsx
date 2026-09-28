import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  Heart,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { SafeImage } from '../common/SafeImage';
import { FITNESS_TIPS } from '../../data/landingData';
import { FitnessTip } from '../../types/landingTypes';

export const FitnessTipsSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTip, setSelectedTip] = useState<FitnessTip | null>(null);
  const [likedTips, setLikedTips] = useState<Record<string, number>>({});

  const categories = [
    { id: 'all', label: 'Semua Artikel' },
    { id: 'nutrition', label: 'Nutrisi & Diet' },
    { id: 'workout', label: 'Latihan Beban' },
    { id: 'recovery', label: 'Recovery & Tidur' },
    { id: 'beginner', label: 'Tips Pemula' }
  ];

  const filtered = activeCategory === 'all'
    ? FITNESS_TIPS
    : FITNESS_TIPS.filter((t) => t.category === activeCategory);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedTips((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  return (
    <section id="tips" className="py-24 bg-zinc-950 border-t border-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Edukasi & Tips Kebugaran</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            PANDUAN KESEHATAN DARI COACH BERPENGALAMAN
          </h2>
          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            Tingkatkan wawasan fitness Anda seputar nutrisi tepat, biomekanik angkatan, serta pemulihan optimal agar hasil latihan konsisten meningkat.
          </p>
        </div>

        {/* Filter Categories */}
        <div className="flex justify-center mb-10 overflow-x-auto pb-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activeCategory === c.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((tip) => {
            const currentLikes = tip.likes + (likedTips[tip.id] || 0);
            return (
              <div
                key={tip.id}
                onClick={() => setSelectedTip(tip)}
                className="group rounded-3xl overflow-hidden bg-zinc-900/80 border border-zinc-800 hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1 shadow-md"
              >
                <div>
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <SafeImage
                      src={tip.image}
                      alt={tip.title}
                      fallbackType="tip"
                      fallbackText={tip.title}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-orange-400 border border-zinc-700">
                        {tip.category.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {tip.readTime}
                      </span>
                      <span>Oleh {tip.author}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                      {tip.title}
                    </h3>

                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                      {tip.summary}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-zinc-800/80 mt-3 pt-3">
                  <span className="text-xs font-bold text-orange-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Baca Selengkapnya</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>

                  <button
                    onClick={(e) => handleLike(tip.id, e)}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-rose-400 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>{currentLikes}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Detail Baca Tips */}
      {selectedTip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="relative aspect-[16/9]">
              <SafeImage
                src={selectedTip.image}
                alt={selectedTip.title}
                fallbackType="tip"
                fallbackText={selectedTip.title}
                className="w-full h-full"
              />
              <button
                onClick={() => setSelectedTip(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-zinc-950/80 hover:bg-zinc-900 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold uppercase">
                  {selectedTip.category}
                </span>
                <span>•</span>
                <span>{selectedTip.readTime}</span>
                <span>•</span>
                <span>Ditulis oleh {selectedTip.author}</span>
              </div>

              <h3 className="text-xl font-black text-white leading-snug">
                {selectedTip.title}
              </h3>

              <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line border-t border-zinc-800 pt-4">
                {selectedTip.content}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setSelectedTip(null)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
                >
                  Tutup Panduan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
