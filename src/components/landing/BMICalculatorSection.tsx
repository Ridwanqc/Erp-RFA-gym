import React, { useState } from 'react';
import {
  Calculator,
  Activity,
  Heart,
  Flame,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info,
  Scale
} from 'lucide-react';
import { LandingProgram } from '../../types/landingTypes';
import { RFA_PROGRAMS } from '../../data/landingData';

interface BMICalculatorSectionProps {
  onSelectRecommendedProgram: (program: LandingProgram) => void;
}

export const BMICalculatorSection: React.FC<BMICalculatorSectionProps> = ({
  onSelectRecommendedProgram
}) => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(26);
  const [height, setHeight] = useState<number>(172); // cm
  const [weight, setWeight] = useState<number>(70); // kg
  const [activityLevel, setActivityLevel] = useState<number>(1.375); // Sedang

  // Calculations
  const heightInMeters = height / 100;
  const bmiValue = heightInMeters > 0 ? parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1)) : 0;

  // Category
  let category = 'Normal & Ideal';
  let categoryColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let recommendedSlug = 'weight-training';

  if (bmiValue < 18.5) {
    category = 'Berat Badan Kurang (Underweight)';
    categoryColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    recommendedSlug = 'weight-training'; // Bulking & strength
  } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
    category = 'Normal & Ideal (Healthy Weight)';
    categoryColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    recommendedSlug = 'functional-training';
  } else if (bmiValue >= 25 && bmiValue <= 29.9) {
    category = 'Kelebihan Berat Badan (Overweight)';
    categoryColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    recommendedSlug = 'hiit-cardio'; // Fat loss
  } else {
    category = 'Obesitas (Perlu Pendampingan)';
    categoryColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    recommendedSlug = 'personal-trainer'; // 1-on-1 coaching
  }

  // Broca Ideal Weight
  const brocaFactor = gender === 'male' ? 0.1 : 0.15;
  const idealWeight = Math.max(35, Math.round((height - 100) - (height - 100) * brocaFactor));

  // Mifflin-St Jeor BMR
  const bmr = Math.round(
    gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161
  );

  // TDEE
  const tdee = Math.round(bmr * activityLevel);

  const recommendedProgram = RFA_PROGRAMS.find((p) => p.slug === recommendedSlug) || RFA_PROGRAMS[0];

  return (
    <section id="bmi-calc" className="py-24 bg-zinc-950 border-t border-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Calculator className="w-3.5 h-3.5" />
            <span>Smart Body Health Tool</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            KALKULATOR BMI & BERAT BADAN IDEAL
          </h2>
          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            Hitung Body Mass Index (BMI), estimasi kebutuhan kalori harian (TDEE), dan dapatkan rekomendasi program latihan terbaik yang dipersonalisasi untuk tubuh Anda.
          </p>
        </div>

        {/* Interactive Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          {/* Input Form Column */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-orange-400" />
              <span>Masukkan Data Tubuh Anda</span>
            </h3>

            {/* Gender Toggle */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-2">
                Jenis Kelamin
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                    gender === 'male'
                      ? 'bg-orange-500/20 border-orange-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Pria
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                    gender === 'female'
                      ? 'bg-orange-500/20 border-orange-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Wanita
                </button>
              </div>
            </div>

            {/* Sliders: Height, Weight, Age */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                  <span>Tinggi Badan</span>
                  <span className="text-orange-400 font-black">{height} cm</span>
                </div>
                <input
                  type="range"
                  min="130"
                  max="210"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                  <span>Berat Badan</span>
                  <span className="text-orange-400 font-black">{weight} kg</span>
                </div>
                <input
                  type="range"
                  min="35"
                  max="150"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                  <span>Usia</span>
                  <span className="text-orange-400 font-black">{age} Tahun</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="80"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                  Tingkat Aktivitas Fisik
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-orange-500"
                >
                  <option value={1.2}>Sedentary (Jarang bergerak / kerja duduk)</option>
                  <option value={1.375}>Ringan (Olahraga 1-3 hari/minggu)</option>
                  <option value={1.55}>Sedang (Olahraga aktif 3-5 hari/minggu)</option>
                  <option value={1.725}>Sangat Aktif (Latihan intensif 6-7 hari/minggu)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Nilai BMI Anda
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-white mt-1 font-mono tabular-nums">
                    {bmiValue}{' '}
                    <span className="text-sm font-semibold text-zinc-400 font-sans">kg/m²</span>
                  </div>
                </div>

                <div className={`px-4 py-2 rounded-2xl border text-xs font-extrabold ${categoryColor}`}>
                  {category}
                </div>
              </div>

              {/* BMI Bar Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                  <span>Kurus (&lt;18.5)</span>
                  <span>Ideal (18.5 - 24.9)</span>
                  <span>Gemuk (25 - 29.9)</span>
                  <span>Obesitas (&ge;30)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-800 flex overflow-hidden">
                  <div className="w-1/4 bg-blue-500/80" />
                  <div className="w-1/4 bg-emerald-500/80" />
                  <div className="w-1/4 bg-amber-500/80" />
                  <div className="w-1/4 bg-rose-500/80" />
                </div>
              </div>

              {/* Broca & TDEE Badges */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Berat Ideal (Broca)</div>
                  <div className="text-2xl font-black text-white mt-1 font-mono tabular-nums">
                    {idealWeight} <span className="text-xs font-bold text-zinc-400 font-sans">kg</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Selisih: {weight - idealWeight > 0 ? `+${weight - idealWeight} kg` : `${weight - idealWeight} kg`}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Kebutuhan Kalori (TDEE)</div>
                  <div className="text-2xl font-black text-orange-400 mt-1 font-mono tabular-nums">
                    {tdee} <span className="text-xs font-bold text-zinc-400 font-sans">kkal/hari</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 font-mono">
                    BMR basal: {bmr} kkal
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Program Highlight */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rekomendasi Program Terbaik:</span>
                </div>
                <h4 className="text-base font-extrabold text-white">
                  {recommendedProgram.name}
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm">
                  {recommendedProgram.tagline}
                </p>
              </div>

              <button
                onClick={() => onSelectRecommendedProgram(recommendedProgram)}
                className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs whitespace-nowrap flex items-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 transition-all shrink-0"
              >
                <span>Daftar Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
