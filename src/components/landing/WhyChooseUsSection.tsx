import React from 'react';
import {
  Dumbbell,
  Award,
  Activity,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { WHY_CHOOSE_US_ITEMS } from '../../data/landingData';

interface WhyChooseUsSectionProps {
  onLearnMore?: () => void;
}

export const WhyChooseUsSection: React.FC<WhyChooseUsSectionProps> = ({ onLearnMore }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Dumbbell':
        return <Dumbbell className="w-6 h-6 text-orange-400" />;
      case 'Award':
        return <Award className="w-6 h-6 text-amber-400" />;
      case 'Activity':
        return <Activity className="w-6 h-6 text-orange-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-emerald-400" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-cyan-400" />;
      case 'Layers':
        return <Layers className="w-6 h-6 text-indigo-400" />;
      default:
        return <Dumbbell className="w-6 h-6 text-orange-400" />;
    }
  };

  return (
    <section id="why-us" className="py-20 bg-zinc-950 relative border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">
            Keunggulan Eksklusif
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            STANDAR KEBUGARAN TINGGI UNTUK HASIL YANG NYATA
          </h2>
          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            Kami merancang setiap detail di RFA Gym untuk memberikan pengalaman berolahraga yang bertenaga, higienis, dan terbukti secara ilmiah membantu Anda mencapai bentuk tubuh impian.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {WHY_CHOOSE_US_ITEMS.map((item) => (
            <div
              key={item.id}
              className="group relative p-6 sm:p-8 rounded-3xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-orange-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/90 flex items-center justify-center border border-zinc-700/60 group-hover:border-orange-500/40 transition-colors">
                    {getIcon(item.icon)}
                  </div>
                  <span className="text-xs font-medium text-zinc-400">
                    {item.highlight}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors mb-2.5">
                  {item.title}
                </h3>

                <p className="text-sm text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center gap-2 text-xs font-medium text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Terstandarisasi Mutu RFA</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
