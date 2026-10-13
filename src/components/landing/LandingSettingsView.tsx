import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Check,
  CheckCircle2,
  Trash2,
  Plus,
  Building2,
  Phone,
  Instagram,
  Youtube,
  Megaphone,
  Layers,
  ExternalLink,
  Info,
  Flame,
  ArrowRight,
  Eye,
  Star,
  Users,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { LandingGalleryItem, LandingPageConfig } from '../../types';
import { DEFAULT_LANDING_CONFIG } from '../../data/settingsData';

interface LandingSettingsViewProps {
  onClose?: () => void;
  onPreviewLanding?: () => void;
  showToast?: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

// Curated high-resolution fitness presets for quick one-click replacement
const FITNESS_IMAGE_PRESETS = [
  {
    label: 'Dark Modern Gym Arena',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
    desc: 'Lantai fitness elegan dengan pencahayaan neon'
  },
  {
    label: 'Strength & Powerlifting Zone',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
    desc: 'Area barbell & dumbbell intensif'
  },
  {
    label: 'Olympic Barbell & Free Weights',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
    desc: 'Nuansa atlet angkat beban profesional'
  },
  {
    label: 'Bright Athletic Performance Studio',
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1000&auto=format&fit=crop',
    desc: 'Fasilitas premium dengan alat modern LifeFitness'
  },
  {
    label: 'Cardio & Conditioning Theater',
    url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1000&auto=format&fit=crop',
    desc: 'Treadmill, rowing, & stair climbers'
  },
  {
    label: 'Functional & Crossfit Turf',
    url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop',
    desc: 'Area rumput turf untuk conditioning dan sled push'
  }
];

export const LandingSettingsView: React.FC<LandingSettingsViewProps> = ({
  onClose,
  onPreviewLanding,
  showToast
}) => {
  const { settings, updateLandingConfig, resetLandingConfigToDefault } = useSettings();
  const currentLanding = settings.landing || DEFAULT_LANDING_CONFIG;

  const [activeTab, setActiveTab] = useState<'hero' | 'announcement' | 'about' | 'gallery' | 'social'>('hero');
  const [formConfig, setFormConfig] = useState<LandingPageConfig>(() => JSON.parse(JSON.stringify(currentLanding)));
  const [isSaved, setIsSaved] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Gallery item add form modal/state
  const [isAddingGallery, setIsAddingGallery] = useState(false);
  const [newGalleryItem, setNewGalleryItem] = useState<Omit<LandingGalleryItem, 'id'>>({
    title: '',
    category: 'gym',
    image: '',
    description: ''
  });

  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const notify = (title: string, msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    if (showToast) {
      showToast(title, msg, type);
    }
  };

  const handleSave = () => {
    updateLandingConfig(formConfig);
    setIsSaved(true);
    notify('Pengaturan Berhasil Disimpan', 'Seluruh kustomisasi landing page telah diperbarui seketika.', 'success');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan semua isi landing page ke pengaturan default resmi?')) {
      resetLandingConfigToDefault();
      setFormConfig(JSON.parse(JSON.stringify(DEFAULT_LANDING_CONFIG)));
      notify('Reset Selesai', 'Pengaturan landing page dikembalikan ke versi bawaan resmi.', 'info');
    }
  };

  // Upload Hero Image from computer
  const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Format Tidak Sesuai', 'Harap pilih file gambar (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      notify('Ukuran Terlalu Besar', 'Maksimal ukuran file foto adalah 8MB.', 'error');
      return;
    }

    setIsUploadingHero(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormConfig((prev) => ({
          ...prev,
          hero: {
            ...prev.hero,
            heroImageUrl: dataUrl
          }
        }));
        notify('Foto Berhasil Diunggah', 'Gambar visual Hero berhasil dimuat ke editor.', 'success');
      }
      setIsUploadingHero(false);
    };
    reader.onerror = () => {
      setIsUploadingHero(false);
      notify('Gagal Membaca File', 'Terjadi kesalahan teknis saat membaca file foto.', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Upload New Gallery Item Image
  const handleGalleryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Format Tidak Sesuai', 'Harap pilih file gambar (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      notify('Ukuran Terlalu Besar', 'Maksimal ukuran file foto adalah 8MB.', 'error');
      return;
    }

    setIsUploadingGallery(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setNewGalleryItem((prev) => ({ ...prev, image: dataUrl }));
        notify('Foto Fasilitas Diunggah', 'Gambar berhasil dipilih.', 'success');
      }
      setIsUploadingGallery(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add Gallery Item
  const handleAddGalleryItem = () => {
    if (!newGalleryItem.title.trim()) {
      notify('Nama Fasilitas Kosong', 'Harap masukkan nama atau judul fasilitas.', 'warning');
      return;
    }
    if (!newGalleryItem.image.trim()) {
      notify('Foto Belum Dipilih', 'Harap unggah foto atau masukkan URL gambar fasilitas.', 'warning');
      return;
    }

    const newItem: LandingGalleryItem = {
      id: `fg-${Date.now()}`,
      title: newGalleryItem.title.trim(),
      category: newGalleryItem.category,
      image: newGalleryItem.image.trim(),
      description: newGalleryItem.description.trim() || 'Fasilitas premium standar internasional RFA Gym.'
    };

    setFormConfig((prev) => ({
      ...prev,
      galleryItems: [newItem, ...(prev.galleryItems || [])]
    }));

    setNewGalleryItem({
      title: '',
      category: 'gym',
      image: '',
      description: ''
    });
    setIsAddingGallery(false);
    notify('Fasilitas Ditambahkan', 'Item galeri fasilitas baru telah berhasil dimasukkan.', 'success');
  };

  // Delete Gallery Item
  const handleDeleteGalleryItem = (id: string) => {
    setFormConfig((prev) => ({
      ...prev,
      galleryItems: (prev.galleryItems || []).filter((item) => item.id !== id)
    }));
    notify('Foto Dihapus', 'Item galeri fasilitas telah dihapus.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Action Toolbar */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Pengaturan & CMS Landing Page</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Kustomisasi teks, visual hero, banner promo, galeri foto, dan kontak tanpa perlu coding.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onPreviewLanding && (
            <button
              type="button"
              onClick={onPreviewLanding}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition active:scale-95 shadow-sm"
              title="Lihat Pratinjau Tampilan Landing Page Langsung"
            >
              <Eye className="w-4 h-4 text-orange-400" />
              <span>Pratinjau Landing Page</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-rose-300 text-xs font-semibold border border-zinc-700 transition active:scale-95"
            title="Kembalikan semua teks & gambar ke bawaan"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Bawaan</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 transition active:scale-95"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 overflow-x-auto">
        {[
          { id: 'hero', label: 'Hero & Visual Utama', icon: Sparkles },
          { id: 'announcement', label: 'Banner Promo & Info', icon: Megaphone },
          { id: 'about', label: 'Tentang Kami & Cerita', icon: Building2 },
          { id: 'gallery', label: 'Galeri Fasilitas (Foto)', icon: ImageIcon },
          { id: 'social', label: 'Kontak & Sosmed', icon: Phone }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HERO & VISUAL UTAMA */}
      {activeTab === 'hero' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Text & Badges Editor */}
            <div className="lg:col-span-7 space-y-5 p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Teks Headline & Slogan Hero
                </h3>
              </div>

              {/* Badge Teks */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Badge Teks Atas (Pill Keunggulan)
                </label>
                <input
                  type="text"
                  value={formConfig.hero.badgeText}
                  onChange={(e) =>
                    setFormConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, badgeText: e.target.value }
                    }))
                  }
                  placeholder="Contoh: Pusat Kebugaran Premium & Komunitas Atlet"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              {/* Headline (3 Parts for Gradient Effect) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-zinc-300">
                  Judul Utama / Headline Hero
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-semibold block mb-1">Teks Awal (Putih)</span>
                    <input
                      type="text"
                      value={formConfig.hero.headlineStart}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, headlineStart: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-orange-400 font-semibold block mb-1">Teks Gradient (Highlight)</span>
                    <input
                      type="text"
                      value={formConfig.hero.headlineGradient}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, headlineGradient: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-orange-500/40 text-xs text-orange-300 font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-semibold block mb-1">Teks Akhir (Putih)</span>
                    <input
                      type="text"
                      value={formConfig.hero.headlineEnd}
                      onChange={(e) =>
                        setFormConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, headlineEnd: e.target.value }
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Subheadline Description */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Subheadline / Deskripsi Singkat Hero
                </label>
                <textarea
                  rows={3}
                  value={formConfig.hero.subheadline}
                  onChange={(e) =>
                    setFormConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, subheadline: e.target.value }
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition leading-relaxed"
                />
              </div>

              {/* Tombol CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Label Tombol Utama (CTA 1)
                  </label>
                  <input
                    type="text"
                    value={formConfig.hero.primaryCtaText}
                    onChange={(e) =>
                      setFormConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, primaryCtaText: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Label Tombol Kedua (CTA 2)
                  </label>
                  <input
                    type="text"
                    value={formConfig.hero.secondaryCtaText}
                    onChange={(e) =>
                      setFormConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, secondaryCtaText: e.target.value }
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* 3 Highlights */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  3 Poin Keunggulan Bawah Hero
                </label>
                <div className="space-y-2">
                  {(formConfig.hero.highlights || []).map((hl, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={hl}
                        onChange={(e) => {
                          const updated = [...formConfig.hero.highlights];
                          updated[idx] = e.target.value;
                          setFormConfig((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, highlights: updated }
                          }));
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Visual Image & Floating Badges */}
            <div className="lg:col-span-5 space-y-5 p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Foto Visual Utama Hero
                  </h3>
                </div>
              </div>

              {/* Image Preview Box */}
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-zinc-950 border border-zinc-800 group shadow-inner">
                <img
                  src={formConfig.hero.heroImageUrl}
                  alt={formConfig.hero.heroImageAlt || 'Hero Preview'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent flex items-end p-3 pointer-events-none">
                  <span className="text-[10px] font-bold text-orange-400 bg-zinc-950/90 px-2 py-0.5 rounded-md border border-zinc-700/60">
                    Pratinjau Foto Hero
                  </span>
                </div>
              </div>

              {/* Upload Button & File Input */}
              <div className="space-y-3">
                <input
                  type="file"
                  ref={heroFileInputRef}
                  onChange={handleHeroFileUpload}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={isUploadingHero}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-orange-500/20"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploadingHero ? 'Mengunggah...' : 'Unggah Foto dari Perangkat'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormConfig((prev) => ({
                        ...prev,
                        hero: {
                          ...prev.hero,
                          heroImageUrl: DEFAULT_LANDING_CONFIG.hero.heroImageUrl
                        }
                      }));
                      notify('Foto Direset', 'Kembali ke foto standar.', 'info');
                    }}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                    title="Reset ke foto awal"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Paste URL directly */}
                <div>
                  <span className="text-[10px] text-zinc-400 font-semibold block mb-1">
                    Atau Masukkan Tautan / URL Gambar Online:
                  </span>
                  <input
                    type="url"
                    value={formConfig.hero.heroImageUrl}
                    onChange={(e) =>
                      setFormConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, heroImageUrl: e.target.value }
                      }))
                    }
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Curated Preset Library */}
              <div className="pt-2 border-t border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-300 block mb-2">
                  Pilih dari Pustaka Foto Fitness Berkualitas Tinggi (1-Klik):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {FITNESS_IMAGE_PRESETS.map((pst, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setFormConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, heroImageUrl: pst.url }
                        }));
                        notify('Preset Terpilih', pst.label, 'info');
                      }}
                      className="group relative rounded-xl overflow-hidden aspect-[16/10] border border-zinc-800 hover:border-orange-500 transition shadow-sm text-left"
                      title={pst.label}
                    >
                      <img src={pst.url} alt={pst.label} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition" />
                      <span className="absolute bottom-1 left-1 right-1 text-[8px] font-bold text-white truncate px-1 bg-black/60 rounded">
                        {pst.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Overlay Hub Card Settings */}
              <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                <span className="text-[11px] font-bold text-zinc-300 block">
                  Kartu Overlay di Bawah Foto Hero:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tag (Flagship Hub)"
                    value={formConfig.hero.hubTag}
                    onChange={(e) =>
                      setFormConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, hubTag: e.target.value }
                      }))
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Status (Open Now)"
                    value={formConfig.hero.hubStatus}
                    onChange={(e) =>
                      setFormConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, hubStatus: e.target.value }
                      }))
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-emerald-400 font-bold"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nama Lokasi / Lantai (Menara Sudirman Lantai 2)"
                  value={formConfig.hero.hubTitle}
                  onChange={(e) =>
                    setFormConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, hubTitle: e.target.value }
                    }))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white font-semibold"
                />
                <input
                  type="text"
                  placeholder="Keterangan Peralatan"
                  value={formConfig.hero.hubDesc}
                  onChange={(e) =>
                    setFormConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, hubDesc: e.target.value }
                    }))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BANNER PROMO & INFO */}
      {activeTab === 'announcement' && (
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Banner Pengumuman & Promo Puncak (Top Banner)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pita notifikasi yang tampil tepat di bagian teratas sebelum header navigasi landing page.
              </p>
            </div>

            {/* Toggle Switch */}
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-xs font-bold text-zinc-300">
                {formConfig.announcement.enabled ? 'Aktif' : 'Nonaktif'}
              </span>
              <div
                onClick={() =>
                  setFormConfig((prev) => ({
                    ...prev,
                    announcement: {
                      ...prev.announcement,
                      enabled: !prev.announcement.enabled
                    }
                  }))
                }
                className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                  formConfig.announcement.enabled ? 'bg-orange-500 justify-end' : 'bg-zinc-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </div>
            </label>
          </div>

          {/* Banner Live Preview */}
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1.5">
              Pratinjau Tampilan Banner:
            </span>
            {formConfig.announcement.enabled ? (
              <div className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-black/30 border border-white/20 text-[10px] font-black uppercase">
                    {formConfig.announcement.badgeText || 'HOT PROMO'}
                  </span>
                  <span className="font-bold underline decoration-amber-300">
                    {formConfig.announcement.highlightText || 'FLASH SALE'}
                  </span>
                  <span>{formConfig.announcement.text}</span>
                </div>
                {formConfig.announcement.ctaText && (
                  <span className="px-3 py-1 rounded-lg bg-black hover:bg-zinc-900 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1 cursor-pointer">
                    <span>{formConfig.announcement.ctaText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-900/50 text-center text-xs text-zinc-500 italic">
                Banner pengumuman saat ini berstatus Nonaktif (tidak akan muncul di website).
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Teks Badge Pill (Kiri)
              </label>
              <input
                type="text"
                value={formConfig.announcement.badgeText}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    announcement: { ...prev.announcement, badgeText: e.target.value }
                  }))
                }
                placeholder="HOT PROMO / INFO RESMI"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Kata Sorotan / Highlight (Kuning Emas)
              </label>
              <input
                type="text"
                value={formConfig.announcement.highlightText}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    announcement: { ...prev.announcement, highlightText: e.target.value }
                  }))
                }
                placeholder="FLASH SALE / HANYA BULAN INI"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-amber-300 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Isi Teks Pengumuman Lengkap
            </label>
            <input
              type="text"
              value={formConfig.announcement.text}
              onChange={(e) =>
                setFormConfig((prev) => ({
                  ...prev,
                  announcement: { ...prev.announcement, text: e.target.value }
                }))
              }
              placeholder="Masukkan pesan promo atau pengumuman event..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Teks Tombol Aksi (CTA)
              </label>
              <input
                type="text"
                value={formConfig.announcement.ctaText || ''}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    announcement: { ...prev.announcement, ctaText: e.target.value }
                  }))
                }
                placeholder="Daftar Sekarang / Klaim Promo"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Tautan Tujuan (Opsional)
              </label>
              <input
                type="text"
                value={formConfig.announcement.targetUrl || ''}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    announcement: { ...prev.announcement, targetUrl: e.target.value }
                  }))
                }
                placeholder="#programs atau https://..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TENTANG KAMI & CERITA */}
      {activeTab === 'about' && (
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Profil & Cerita Tentang Gym (About Us)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ubah deskripsi visi dan tonggak sejarah untuk membangun kepercayaan pengunjung.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Badge Atas</label>
              <input
                type="text"
                value={formConfig.about.badge}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, badge: e.target.value }
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Judul Utama About Us</label>
              <input
                type="text"
                value={formConfig.about.title}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, title: e.target.value }
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">Deskripsi Singkat</label>
            <textarea
              rows={2}
              value={formConfig.about.description}
              onChange={(e) =>
                setFormConfig((prev) => ({
                  ...prev,
                  about: { ...prev.about, description: e.target.value }
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <label className="block text-xs font-bold text-zinc-300">
              Cerita & Filosofi Pelatihan
            </label>
            <input
              type="text"
              placeholder="Judul Cerita"
              value={formConfig.about.storyTitle}
              onChange={(e) =>
                setFormConfig((prev) => ({
                  ...prev,
                  about: { ...prev.about, storyTitle: e.target.value }
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-semibold"
            />
            <textarea
              rows={3}
              placeholder="Paragraf 1"
              value={formConfig.about.storyP1}
              onChange={(e) =>
                setFormConfig((prev) => ({
                  ...prev,
                  about: { ...prev.about, storyP1: e.target.value }
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
            />
            <textarea
              rows={3}
              placeholder="Paragraf 2"
              value={formConfig.about.storyP2}
              onChange={(e) =>
                setFormConfig((prev) => ({
                  ...prev,
                  about: { ...prev.about, storyP2: e.target.value }
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
            />
          </div>

          {/* 2 Stat Cards */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-orange-400">Statistik Kotak 1</span>
              <input
                type="text"
                placeholder="Nilai (8+ Tahun)"
                value={formConfig.about.stat1Value}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, stat1Value: e.target.value }
                  }))
                }
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-black text-white"
              />
              <input
                type="text"
                placeholder="Keterangan (Eksistensi & Pengalaman)"
                value={formConfig.about.stat1Label}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, stat1Label: e.target.value }
                  }))
                }
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400"
              />
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="text-xs font-bold text-amber-400">Statistik Kotak 2</span>
              <input
                type="text"
                placeholder="Nilai (98.4%)"
                value={formConfig.about.stat2Value}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, stat2Value: e.target.value }
                  }))
                }
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-black text-white"
              />
              <input
                type="text"
                placeholder="Keterangan (Kepuasan Member & Klien)"
                value={formConfig.about.stat2Label}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, stat2Label: e.target.value }
                  }))
                }
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GALERI FOTO FASILITAS (CMS MEDIA) */}
      {activeTab === 'gallery' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Manajemen Galeri Foto Fasilitas
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Unggah dan kelola foto fasilitas resmi gym untuk ditampilkan di section Galeri Fasilitas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingGallery(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Foto Fasilitas</span>
            </button>
          </div>

          {/* Form Modal / Dropdown to Add New Gallery Photo */}
          {isAddingGallery && (
            <div className="p-6 rounded-3xl bg-zinc-900 border-2 border-orange-500/50 shadow-2xl space-y-4 animate-in slide-in-from-top-3">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Tambah Foto Fasilitas Baru
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingGallery(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Nama Fasilitas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Olympic Barbell & Squat Racks"
                    value={newGalleryItem.title}
                    onChange={(e) => setNewGalleryItem((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Kategori Fasilitas</label>
                  <select
                    value={newGalleryItem.category}
                    onChange={(e) =>
                      setNewGalleryItem((prev) => ({ ...prev, category: e.target.value as any }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                  >
                    <option value="gym">Gym Zone (Free Weight & Cardio)</option>
                    <option value="studio">Studio Class (Aerobik & Yoga)</option>
                    <option value="recovery">Recovery & Sauna (Relaksasi)</option>
                    <option value="lounge">Lounge & Protein Bar (Cafe)</option>
                  </select>
                </div>
              </div>

              {/* Upload Foto or Paste URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300">Pilih / Unggah Foto</label>
                <input
                  type="file"
                  ref={galleryFileInputRef}
                  onChange={handleGalleryFileUpload}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => galleryFileInputRef.current?.click()}
                    disabled={isUploadingGallery}
                    className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2 border border-zinc-700"
                  >
                    <Upload className="w-4 h-4 text-orange-400" />
                    <span>{isUploadingGallery ? 'Membaca...' : 'Unggah File Foto dari Perangkat'}</span>
                  </button>

                  <input
                    type="url"
                    placeholder="Atau tempel URL gambar (https://...)"
                    value={newGalleryItem.image}
                    onChange={(e) => setNewGalleryItem((prev) => ({ ...prev, image: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-mono"
                  />
                </div>

                {newGalleryItem.image && (
                  <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-zinc-700">
                    <img src={newGalleryItem.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Deskripsi peralatan atau fasilitas..."
                  value={newGalleryItem.description}
                  onChange={(e) => setNewGalleryItem((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingGallery(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddGalleryItem}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold shadow-md shadow-orange-500/20"
                >
                  Simpan ke Galeri
                </button>
              </div>
            </div>
          )}

          {/* Gallery Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(formConfig.galleryItems || []).map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition shadow-md flex flex-col"
              >
                <div className="aspect-[16/10] overflow-hidden relative bg-zinc-950">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-orange-400 uppercase tracking-wider backdrop-blur-md">
                    {item.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteGalleryItem(item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/30 transition shadow-md"
                    title="Hapus foto ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-white truncate">{item.title}</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: KONTAK & SOSMED */}
      {activeTab === 'social' && (
        <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6 animate-in fade-in duration-200">
          <div className="pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Kontak Resmi & Tautan Media Sosial
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Hubungkan akun WhatsApp dan media sosial resmi untuk mempermudah calon member menghubungi front desk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Front Desk
              </label>
              <input
                type="text"
                value={formConfig.social.whatsapp}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    social: { ...prev.social, whatsapp: e.target.value }
                  }))
                }
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-400" /> Username Instagram
              </label>
              <input
                type="text"
                value={formConfig.social.instagram}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    social: { ...prev.social, instagram: e.target.value }
                  }))
                }
                placeholder="@rfagym"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Akun TikTok</label>
              <input
                type="text"
                value={formConfig.social.tiktok}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    social: { ...prev.social, tiktok: e.target.value }
                  }))
                }
                placeholder="@rfagym_official"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-rose-500" /> Channel YouTube
              </label>
              <input
                type="text"
                value={formConfig.social.youtube}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    social: { ...prev.social, youtube: e.target.value }
                  }))
                }
                placeholder="RFA Gym Indonesia"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Email Resmi</label>
              <input
                type="email"
                value={formConfig.social.email}
                onChange={(e) =>
                  setFormConfig((prev) => ({
                    ...prev,
                    social: { ...prev.social, email: e.target.value }
                  }))
                }
                placeholder="info@rfagym.com"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Jam Hari Kerja</label>
                <input
                  type="text"
                  value={formConfig.social.operationalWeekday}
                  onChange={(e) =>
                    setFormConfig((prev) => ({
                      ...prev,
                      social: { ...prev.social, operationalWeekday: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Jam Akhir Pekan</label>
                <input
                  type="text"
                  value={formConfig.social.operationalWeekend}
                  onChange={(e) =>
                    setFormConfig((prev) => ({
                      ...prev,
                      social: { ...prev.social, operationalWeekend: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Reminder Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Info className="w-4 h-4 text-orange-400 shrink-0" />
          <span>Semua perubahan langsung tersinkronisasi ke tampilan web saat Anda menekan tombol simpan.</span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition"
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
        </button>
      </div>
    </div>
  );
};
