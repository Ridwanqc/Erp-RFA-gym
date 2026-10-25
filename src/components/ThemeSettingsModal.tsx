import React from 'react';
import {
  X,
  Palette,
  Moon,
  Sun,
  Sparkles,
  Monitor,
  Check,
  RotateCcw,
  Sliders,
  Eye,
  Layers,
  Grid,
  CheckCircle2,
  TrendingUp,
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react';
import {
  useTheme,
  THEME_MODE_OPTIONS,
  ACCENT_OPTIONS,
  THEME_PRESETS,
  ThemeMode,
  AccentColor,
  ContentDensity,
  BackgroundPattern
} from '../context/ThemeContext';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const {
    theme,
    setMode,
    setAccent,
    setDensity,
    setPattern,
    applyPreset,
    resetTheme,
    currentAccent
  } = useTheme();

  if (!isOpen) return null;

  const handleReset = () => {
    resetTheme();
    if (showToast) {
      showToast('Tema Direset', 'Tema berhasil dikembalikan ke pengaturan default GymPro Classic Dark.', 'info');
    }
  };

  const handleSelectMode = (m: ThemeMode) => {
    setMode(m);
  };

  const handleSelectAccent = (a: AccentColor) => {
    setAccent(a);
  };

  const handleClose = () => {
    onClose();
    if (showToast) {
      showToast(
        'Pengaturan Tema Disimpan',
        `Mode ${theme.mode.toUpperCase()} dengan aksen ${currentAccent.name} aktif.`,
        'success'
      );
    }
  };

  const getModeIcon = (iconType: string, id?: string) => {
    if (id === 'claymorphism-light') {
      return <Layers className="w-5 h-5" style={{ color: currentAccent.hex }} />;
    }
    switch (iconType) {
      case 'moon':
        return <Moon className="w-5 h-5" style={{ color: currentAccent.hex }} />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'monitor':
        return <Monitor className="w-5 h-5 text-cyan-400" />;
      case 'sun':
        return <Sun className="w-5 h-5 text-yellow-400" />;
      case 'layers':
        return <Layers className="w-5 h-5 text-indigo-400" />;
      default:
        return <Palette className="w-5 h-5" style={{ color: currentAccent.hex }} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div
        className="bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner"
              style={{
                backgroundColor: `rgba(${currentAccent.rgb}, 0.15)`,
                borderColor: `rgba(${currentAccent.rgb}, 0.35)`,
                color: currentAccent.hex
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 id="theme-modal-title" className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Pengaturan Tema & Tampilan</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase"
                  style={{
                    backgroundColor: `rgba(${currentAccent.rgb}, 0.15)`,
                    borderColor: `rgba(${currentAccent.rgb}, 0.35)`,
                    color: currentAccent.hex
                  }}
                >
                  GymPro Customizer
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Sesuaikan mode visual, warna aksen, dan kepadatan untuk ruang kerja Backoffice ERP. Halaman publik Landing Page tetap terjaga dalam desain resmi gym.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Tutup pengaturan tema"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 0: PRESET INSTAN CEPAT */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: currentAccent.hex }} />
                <span>Koleksi Preset Siap Pakai (1-Klik)</span>
              </label>
              <span className="text-[11px] text-zinc-500">Pilih skema instan</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEME_PRESETS.map((p) => {
                const isPresetActive =
                  theme.mode === p.config.mode &&
                  theme.accent === p.config.accent &&
                  theme.density === p.config.density &&
                  theme.pattern === p.config.pattern;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      applyPreset(p.config);
                      if (showToast) {
                        showToast('Preset Diterapkan', `Preset ${p.name} berhasil diaktifkan.`, 'info');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                      isPresetActive
                        ? 'bg-zinc-800/90 shadow-md ring-1'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                    style={{
                      borderColor: isPresetActive ? currentAccent.hex : undefined,
                      boxShadow: isPresetActive ? `0 0 12px rgba(${currentAccent.rgb}, 0.25)` : undefined
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-white truncate">{p.name}</span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0"
                        style={{
                          backgroundColor: isPresetActive ? currentAccent.hex : '#27272a',
                          color: isPresetActive ? '#ffffff' : '#a1a1aa'
                        }}
                      >
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 1: MODE TAMPILAN */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: currentAccent.hex }} />
                <span>1. Mode Tampilan Utama (Base Appearance)</span>
              </label>
              <span className="text-[11px] text-zinc-400 font-mono">
                Aktif: <strong className="text-white uppercase">{theme.mode}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_MODE_OPTIONS.map((modeOpt) => {
                const isSelected = theme.mode === modeOpt.id;
                return (
                  <button
                    key={modeOpt.id}
                    type="button"
                    onClick={() => handleSelectMode(modeOpt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition relative flex flex-col justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/80 shadow-lg ring-1'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                    }`}
                    style={{
                      borderColor: isSelected ? currentAccent.hex : undefined,
                      boxShadow: isSelected ? `0 4px 14px rgba(${currentAccent.rgb}, 0.2)` : undefined
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                          {getModeIcon(modeOpt.iconType, modeOpt.id)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{modeOpt.name}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: currentAccent.hex }} />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mini Visual Color Badge */}
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                        <span className={`w-3.5 h-3.5 rounded-md ${modeOpt.bgPreview} border border-zinc-700`} title="Latar Belakang" />
                        <span className={`w-3.5 h-3.5 rounded-md ${modeOpt.cardPreview} border border-zinc-700`} title="Kartu Panel" />
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {modeOpt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: PILIHAN WARNA AKSEN */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Palette className="w-4 h-4" style={{ color: currentAccent.hex }} />
                <span>2. Warna Aksen Utama (Brand Accent)</span>
              </label>
              <span className="text-[11px] font-bold" style={{ color: currentAccent.hex }}>
                Aktif: {currentAccent.name} ({currentAccent.hex})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ACCENT_OPTIONS.map((accentOpt) => {
                const isSelected = theme.accent === accentOpt.id;
                return (
                  <button
                    key={accentOpt.id}
                    type="button"
                    onClick={() => handleSelectAccent(accentOpt.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/80 ring-2 shadow-md'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30'
                    }`}
                    style={{
                      borderColor: isSelected ? accentOpt.hex : undefined,
                      boxShadow: isSelected ? `0 0 12px rgba(${accentOpt.rgb}, 0.3)` : undefined
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md relative"
                      style={{ backgroundColor: accentOpt.hex }}
                    >
                      {isSelected && (
                        <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{accentOpt.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{accentOpt.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: KEPADATAN & POLA LATAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Density */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4" style={{ color: currentAccent.hex }} />
                <span>3. Kepadatan Tampilan (Density)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDensity('comfortable')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    theme.density === 'comfortable'
                      ? 'bg-zinc-800 text-white font-bold ring-1'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  style={{
                    borderColor: theme.density === 'comfortable' ? currentAccent.hex : undefined
                  }}
                >
                  <p className="text-xs font-bold">Nyaman</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Spasi Luwes</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                    theme.density === 'compact'
                      ? 'bg-zinc-800 text-white font-bold ring-1'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  style={{
                    borderColor: theme.density === 'compact' ? currentAccent.hex : undefined
                  }}
                >
                  <p className="text-xs font-bold">Ringkas</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Optimal Kasir/POS</p>
                </button>
              </div>
            </div>

            {/* Pattern */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2 mb-2">
                <Grid className="w-4 h-4" style={{ color: currentAccent.hex }} />
                <span>4. Tekstur Latar Belakang (Pattern)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'grid', 'dots'] as BackgroundPattern[]).map((pat) => (
                  <button
                    key={pat}
                    type="button"
                    onClick={() => setPattern(pat)}
                    className={`py-3 px-2 rounded-xl border text-center transition cursor-pointer text-xs font-bold capitalize ${
                      theme.pattern === pat
                        ? 'bg-zinc-800 text-white ring-1'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    style={{
                      borderColor: theme.pattern === pat ? currentAccent.hex : undefined
                    }}
                  >
                    {pat === 'none' ? 'Polos' : pat === 'grid' ? 'Grid' : 'Bintik'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: LIVE PREVIEW CONTAINER DENGAN SIMULASI MODE TERPILIH */}
          <div
            className={`border rounded-2xl p-4 space-y-3 transition-colors ${
              theme.mode === 'claymorphism-light'
                ? 'bg-white border-slate-200 text-slate-900 shadow-md'
                : theme.mode === 'light'
                ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-sm'
                : theme.mode === 'midnight'
                ? 'bg-black border-zinc-900 text-zinc-100'
                : theme.mode === 'slate'
                ? 'bg-[#0b1120] border-[#1e293b] text-slate-100'
                : theme.mode === 'claymorphism'
                ? 'bg-[#1e202e] border-white/10 text-slate-100'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                <Eye className="w-3.5 h-3.5" style={{ color: currentAccent.hex }} />
                Pratinjau Langsung Mode: {theme.mode.toUpperCase()}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                style={{
                  backgroundColor: `rgba(${currentAccent.rgb}, 0.15)`,
                  color: currentAccent.hex
                }}
              >
                {theme.accent} • {theme.density}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Preview Stat Card */}
              <div
                className={`border rounded-xl p-3.5 flex items-center justify-between ${
                  theme.mode === 'claymorphism-light'
                    ? 'bg-white border-slate-200 shadow-md text-black'
                    : theme.mode === 'light'
                    ? 'bg-white border-slate-200 text-slate-900 shadow-xs'
                    : theme.mode === 'claymorphism'
                    ? 'bg-[#282b3d] border-white/10 shadow-lg text-white'
                    : 'bg-zinc-900/90 border-zinc-800 text-white'
                }`}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Total Check-In Hari Ini</p>
                  <p className="text-lg font-black mt-0.5">148 Member</p>
                  <p className="text-[10px] font-bold flex items-center gap-1 mt-1" style={{ color: currentAccent.hex }}>
                    <TrendingUp className="w-3 h-3" /> +14% dari kemarin
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    backgroundColor: `rgba(${currentAccent.rgb}, 0.15)`,
                    borderColor: `rgba(${currentAccent.rgb}, 0.35)`,
                    color: currentAccent.hex
                  }}
                >
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              {/* Preview Actions & Badges */}
              <div
                className={`border rounded-xl p-3.5 flex flex-col justify-between gap-2.5 ${
                  theme.mode === 'claymorphism-light'
                    ? 'bg-white border-slate-200 shadow-md'
                    : theme.mode === 'light'
                    ? 'bg-white border-slate-200 shadow-xs'
                    : theme.mode === 'claymorphism'
                    ? 'bg-[#282b3d] border-white/10 shadow-lg'
                    : 'bg-zinc-900/90 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                    style={{
                      backgroundColor: `rgba(${currentAccent.rgb}, 0.15)`,
                      borderColor: `rgba(${currentAccent.rgb}, 0.35)`,
                      color: currentAccent.hex
                    }}
                  >
                    Aksen Aktif
                  </span>
                  <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    Lunas
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      theme.mode === 'light' || theme.mode === 'claymorphism-light'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    Badge
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 py-1.5 px-3 text-white rounded-lg text-xs font-black transition shadow-sm active:scale-95 cursor-pointer"
                    style={{ backgroundColor: currentAccent.hex }}
                  >
                    Tombol Utama
                  </button>
                  <button
                    type="button"
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition border ${
                      theme.mode === 'light' || theme.mode === 'claymorphism-light'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    Sekunder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2.5 text-zinc-400 hover:text-zinc-200 text-xs font-bold rounded-xl hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
            title="Kembalikan ke tema default GymPro"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset ke Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              style={{
                backgroundColor: currentAccent.hex,
                boxShadow: `0 4px 14px rgba(${currentAccent.rgb}, 0.35)`
              }}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Terapkan Tema ({currentAccent.name})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
