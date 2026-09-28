import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Filter,
  Sparkles,
  MapPin
} from 'lucide-react';
import { StudioClass } from '../../types';
import { APP_TODAY } from '../../utils/formatters';

interface ScheduleSectionProps {
  studioClasses: StudioClass[];
  onBookClassSlot: (sc: StudioClass) => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  studioClasses,
  onBookClassSlot
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('Hari Ini');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const days = [
    'Hari Ini',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu'
  ];

  const categories = [
    { id: 'all', label: 'Semua Kelas' },
    { id: 'zumba', label: 'Zumba & Dance' },
    { id: 'combat', label: 'Combat & HIIT' },
    { id: 'yoga', label: 'Yoga & Pilates' }
  ];

  // Map studioClasses to daily schedule display
  const displayClasses = studioClasses.map((sc, idx) => {
    const bookedCount = (sc.bookedMembers || sc.booked || []).length;
    const remainingSlots = Math.max(0, sc.capacity - bookedCount);
    let status: 'AVAILABLE' | 'LIMITED' | 'FULL' = 'AVAILABLE';
    if (remainingSlots === 0) status = 'FULL';
    else if (remainingSlots <= 3) status = 'LIMITED';

    return {
      ...sc,
      bookedCount,
      remainingSlots,
      status,
      roomName: idx % 2 === 0 ? 'Studio Utama (Lt. 2)' : 'Zen Mind & Body Studio (Lt. 3)'
    };
  });

  const filtered = displayClasses.filter((item) => {
    if (selectedCategory === 'zumba' && !item.name.toLowerCase().includes('zumba')) return false;
    if (selectedCategory === 'combat' && !item.name.toLowerCase().includes('combat') && !item.name.toLowerCase().includes('hiit')) return false;
    if (selectedCategory === 'yoga' && !item.name.toLowerCase().includes('yoga') && !item.name.toLowerCase().includes('pilates')) return false;
    return true;
  });

  return (
    <section id="schedule" className="py-24 bg-zinc-950 border-t border-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>Kalender Latihan & Kuota Slot</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            JADWAL KELAS STUDIO & KALENDER SLOT TERBARU
          </h2>
          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            Pantau ketersediaan slot kelas secara real-time. Amankan tempat Anda sebelum kuota penuh demi kenyamanan latihan maksimal di studio.
          </p>
        </div>

        {/* Day Selector */}
        <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 max-w-3xl mx-auto mb-6 overflow-x-auto">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedDay === d
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex justify-center gap-2 mb-10">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === c.id
                  ? 'bg-zinc-800 text-orange-400 border border-orange-500/30'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Schedule Slot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    {item.time} WIB
                  </span>

                  {/* Status Badge */}
                  {item.status === 'AVAILABLE' && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Tersedia ({item.remainingSlots} Slot)
                    </span>
                  )}
                  {item.status === 'LIMITED' && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Sisa {item.remainingSlots} Slot!
                    </span>
                  )}
                  {item.status === 'FULL' && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Slot Penuh
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                <p className="text-xs text-orange-400 font-medium flex items-center gap-1.5 mb-3">
                  <User className="w-3.5 h-3.5" />
                  Instruktur: <span className="text-zinc-200">{item.trainer}</span>
                </p>

                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{item.roomName}</span>
                </div>

                {/* Slot Capacity Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Kapasitas Terisi</span>
                    <span className="font-bold text-zinc-300">
                      {item.bookedCount} / {item.capacity} Peserta
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.status === 'FULL'
                          ? 'bg-rose-500'
                          : item.status === 'LIMITED'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (item.bookedCount / item.capacity) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => onBookClassSlot(item)}
                  disabled={item.status === 'FULL'}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    item.status === 'FULL'
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 active:scale-95'
                  }`}
                >
                  <span>{item.status === 'FULL' ? 'Slot Kelas Penuh' : 'Reservasi Slot Kelas'}</span>
                  {item.status !== 'FULL' && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
