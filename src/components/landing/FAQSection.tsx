import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { RFA_FAQS } from '../../data/landingData';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Semua Pertanyaan' },
    { id: 'booking', label: 'Reservasi & Booking' },
    { id: 'membership', label: 'Membership & Freeze' },
    { id: 'facility', label: 'Fasilitas & Locker' }
  ];

  const filtered = activeCategory === 'all'
    ? RFA_FAQS
    : RFA_FAQS.filter((f) => f.category === activeCategory);

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-24 bg-zinc-950 border-t border-zinc-900 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Paling Sering Ditanyakan</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            FREQUENTLY ASKED QUESTIONS (FAQ)
          </h2>
          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            Temukan jawaban lengkap seputar tata cara bergabung, aturan reservasi slot studio, panduan untuk pemula, hingga fasilitas premium RFA Gym.
          </p>
        </div>

        {/* Categories */}
        <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === c.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filtered.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-white hover:text-orange-400 transition-colors"
                >
                  <span className="text-sm font-bold">{faq.question}</span>
                  <div className="p-1 rounded-lg bg-zinc-800 text-zinc-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 mt-1 animate-in fade-in duration-200">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Help Notice */}
        <div className="mt-12 p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Masih punya pertanyaan lain?</h4>
              <p className="text-xs text-zinc-400">Tim Customer Support kami siap membantu Anda 7 hari seminggu.</p>
            </div>
          </div>

          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20RFA%20Gym,%20saya%20ingin%20bertanya%20seputar%20membership"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shrink-0 transition-all shadow-md"
          >
            <span>Tanya via WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
