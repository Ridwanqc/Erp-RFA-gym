import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  Share2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Palette,
  Sliders,
  QrCode,
  Barcode as BarcodeIcon,
  Layers,
  User,
  Shield,
  Tag,
  Eye,
  RotateCcw,
  Image as ImageIcon,
  Upload,
  Trash2,
  CheckCircle2,
  Save,
  Link as LinkIcon,
  SlidersHorizontal,
  Crown,
  Gem,
  UserCheck,
  LogOut,
  Camera,
  Clock
} from 'lucide-react';
import { Member, Attendance } from '../types';
import { APP_TODAY, getTimestamp } from '../utils/formatters';
import { generateBarcodeSVGPaths } from '../utils/barcodeGenerator';
import {
  PassBackgroundConfig,
  PRESET_BACKGROUND_TEMPLATES,
  getPassBackgroundConfig,
  savePassBackgroundConfig,
  resetPassBackgroundConfig,
  PASS_BG_UPDATE_EVENT,
  BackgroundPreset
} from '../utils/memberPassConfig';

declare global {
  interface Window {
    QRious?: any;
    html2canvas?: any;
  }
}

interface IDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  attendances?: Attendance[];
  onAddAttendance?: (newAtt: Attendance, memberToUpdate?: Member) => void;
  onCheckoutMember?: (attId: string) => void;
  showToast?: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onOpenScanner?: () => void;
}

// Generate deterministic 8-character hex code for any member
export function getMemberPassCode(memberId: string, memberName?: string): string {
  if (memberName?.toUpperCase().includes('AHMAD TAJUDIN') || memberId === 'M001') {
    return '97B6B347';
  }
  let hash = 0;
  const str = `${memberId}_${memberName || ''}_RFA_GYM`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = (Math.abs(hash) + 0x10000000).toString(16).toUpperCase().padStart(8, '0').slice(-8);
  return hex;
}

// Available Color Themes for Pass Customization
export interface PassTheme {
  id: string;
  name: string;
  primaryColor: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  glowColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

export const PASS_THEMES: PassTheme[] = [
  {
    id: 'gold',
    name: 'Royal VIP Gold 24K',
    primaryColor: '#eab308',
    gradientFrom: '#ca8a04',
    gradientVia: '#eab308',
    gradientTo: '#fef08a',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    badgeBg: 'bg-yellow-500/20',
    badgeText: 'text-yellow-400',
    borderColor: 'border-yellow-500/40'
  },
  {
    id: 'orange',
    name: 'RFA Flame Orange',
    primaryColor: '#f95700',
    gradientFrom: '#ea580c',
    gradientVia: '#f97316',
    gradientTo: '#fbbf24',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-400',
    borderColor: 'border-orange-500/40'
  },
  {
    id: 'titanium',
    name: 'Platinum Titanium Elite',
    primaryColor: '#cbd5e1',
    gradientFrom: '#475569',
    gradientVia: '#cbd5e1',
    gradientTo: '#ffffff',
    glowColor: 'rgba(203, 213, 225, 0.45)',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-200',
    borderColor: 'border-slate-400/40'
  },
  {
    id: 'cyan',
    name: 'Cyber Electric Cyan',
    primaryColor: '#06b6d4',
    gradientFrom: '#0891b2',
    gradientVia: '#06b6d4',
    gradientTo: '#67e8f9',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-400',
    borderColor: 'border-cyan-500/40'
  },
  {
    id: 'lime',
    name: 'Neon Toxic Lime',
    primaryColor: '#10b981',
    gradientFrom: '#059669',
    gradientVia: '#10b981',
    gradientTo: '#6ee7b7',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    borderColor: 'border-emerald-500/40'
  },
  {
    id: 'crimson',
    name: 'Crimson Power Red',
    primaryColor: '#ef4444',
    gradientFrom: '#dc2626',
    gradientVia: '#ef4444',
    gradientTo: '#fca5a5',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-400',
    borderColor: 'border-red-500/40'
  },
  {
    id: 'violet',
    name: 'Ultra Violet Purple',
    primaryColor: '#a855f7',
    gradientFrom: '#9333ea',
    gradientVia: '#a855f7',
    gradientTo: '#d8b4fe',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400',
    borderColor: 'border-purple-500/40'
  }
];

export type BarcodeDataSource = 'username' | 'username_id' | 'rfa_protocol' | 'member_id' | 'passcode' | 'custom';
export type BarcodeFormat = 'qr_only' | 'barcode_1d' | 'dual_hybrid';
export type CenterBannerMode = 'passcode' | 'username' | 'barcode_1d' | 'member_id';

export const IDCardModal: React.FC<IDCardModalProps> = ({
  isOpen,
  onClose,
  member,
  attendances = [],
  onAddAttendance,
  onCheckoutMember,
  showToast,
  onOpenScanner
}) => {
  const qrRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Customization drawer toggle & active tab
  const [showCostumePanel, setShowCostumePanel] = useState(true);
  const [activeCostumeTab, setActiveCostumeTab] = useState<'barcode' | 'text' | 'background' | 'theme'>('barcode');

  // Dynamic Background Configuration state (Persisted in localStorage)
  const [bgConfig, setBgConfig] = useState<PassBackgroundConfig>(() => getPassBackgroundConfig());
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Interactive 3D Card Tilt & Holographic Specular Highlight
  const [tilt, setTilt] = useState({
    rotateX: 0,
    rotateY: 0,
    sheenX: 50,
    sheenY: 50,
    isHovering: false
  });

  // Customization States
  const [customName, setCustomName] = useState('');
  const [customPassCode, setCustomPassCode] = useState('');
  const [membershipLabel, setMembershipLabel] = useState(() =>
    bgConfig.presetId === 'obsidian_gold'
      ? 'ROYAL VIP MEMBER'
      : bgConfig.presetId === 'platinum_titanium'
      ? 'PLATINUM ELITE'
      : 'MEMBERSHIP'
  );
  const [selectedThemeId, setSelectedThemeId] = useState(() =>
    bgConfig.presetId === 'obsidian_gold'
      ? 'gold'
      : bgConfig.presetId === 'platinum_titanium'
      ? 'titanium'
      : 'orange'
  );
  const [barcodeDataSource, setBarcodeDataSource] = useState<BarcodeDataSource>('username');
  const [customBarcodeValue, setCustomBarcodeValue] = useState('');
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('dual_hybrid');
  const [centerBannerMode, setCenterBannerMode] = useState<CenterBannerMode>('barcode_1d');
  const [showExpiryDate, setShowExpiryDate] = useState(true);
  const [showBranchTag, setShowBranchTag] = useState(true);

  // Actions state
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testScanFeedback, setTestScanFeedback] = useState<string | null>(null);
  const [isProcessingAttendance, setIsProcessingAttendance] = useState(false);

  // Audio synthesizer beep for tactile feedback
  const playBeep = (isError = false) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (isError) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
      }
    } catch {
      // Audio context might fail before gesture; fail quietly
    }
  };

  // Check active attendance session today for this member
  const activeAttendanceSession = useMemo(() => {
    if (!member || !attendances) return null;
    return attendances.find(
      (a) =>
        (a.memberId === member.id || a.memberName.toLowerCase() === member.name.toLowerCase()) &&
        a.date === APP_TODAY &&
        !a.timeOut
    );
  }, [member, attendances]);

  // Directly check in or check out this member from the digital pass
  const handleDirectAttendance = () => {
    if (!member) return;
    setIsProcessingAttendance(true);

    if (activeAttendanceSession && onCheckoutMember) {
      onCheckoutMember(activeAttendanceSession.id);
      playBeep(false);
      if ('vibrate' in navigator) navigator.vibrate?.([50, 50, 50]);
      showToast?.(
        'Check-Out Berhasil',
        `Presensi Check-Out untuk ${member.name} berhasil dicatat pada ${getTimestamp()}. Sampai jumpa lagi!`,
        'success'
      );
    } else if (onAddAttendance) {
      const newAtt: Attendance = {
        id: 'ATT-' + Date.now(),
        date: APP_TODAY,
        timeIn: getTimestamp(),
        timeOut: '',
        memberId: member.id,
        memberName: member.name,
        type: 'Reguler',
        badge: 'Gym Reguler',
        hasTowel: true
      };
      onAddAttendance(newAtt);
      playBeep(false);
      if ('vibrate' in navigator) navigator.vibrate?.(100);
      showToast?.(
        'Check-In Berhasil',
        `Presensi Check-In untuk ${member.name} berhasil dicatat pada ${getTimestamp()}. Selamat berlatih!`,
        'success'
      );
    }
    setTimeout(() => setIsProcessingAttendance(false), 500);
  };

  // Sync background config from localStorage or broadcast events
  useEffect(() => {
    setBgConfig(getPassBackgroundConfig());

    const handleBgUpdate = (e: any) => {
      if (e.detail) {
        setBgConfig(e.detail);
      }
    };

    window.addEventListener(PASS_BG_UPDATE_EVENT, handleBgUpdate);
    return () => window.removeEventListener(PASS_BG_UPDATE_EVENT, handleBgUpdate);
  }, [isOpen]);

  // Initialize defaults when member changes
  useEffect(() => {
    if (member) {
      setCustomName(member.name.toUpperCase());
      const defaultPass = getMemberPassCode(member.id, member.name);
      setCustomPassCode(defaultPass);
      // Default to "username" as explicitly requested by user!
      setBarcodeDataSource('username');
      setBarcodeFormat('dual_hybrid');
      setCenterBannerMode('barcode_1d');
    }
  }, [member]);

  // Derived effective member name
  const displayName = customName.trim() || (member?.name.toUpperCase() || 'AT AHMAD TAJUDIN');
  const displayPassCode = customPassCode.trim() || (member ? getMemberPassCode(member.id, displayName) : '97B6B347');
  const currentTheme = PASS_THEMES.find((t) => t.id === selectedThemeId) || PASS_THEMES[0];

  // Calculate what exact text is encoded into the Barcode / QR Code
  const encodedBarcodeData = useMemo(() => {
    if (!member) return displayName;

    switch (barcodeDataSource) {
      case 'username':
        // Specifically requested by user: isi data barcode ini nama pengguna!
        return displayName;
      case 'username_id':
        return `${displayName} - ${member.id}`;
      case 'rfa_protocol':
        return `RFA-MEMBER:${member.id}:${displayPassCode}`;
      case 'member_id':
        return member.id;
      case 'passcode':
        return displayPassCode;
      case 'custom':
        return customBarcodeValue.trim() || displayName;
      default:
        return displayName;
    }
  }, [barcodeDataSource, displayName, member, displayPassCode, customBarcodeValue]);

  // Render 2D QR code onto canvas
  useEffect(() => {
    if (!isOpen || !qrRef.current) return;

    const renderQR = () => {
      if (window.QRious && qrRef.current) {
        new window.QRious({
          element: qrRef.current,
          value: encodedBarcodeData,
          size: 76,
          background: '#ffffff',
          foreground: '#000000',
          level: 'H'
        });
      }
    };

    const timer = setTimeout(renderQR, 50);
    return () => clearTimeout(timer);
  }, [isOpen, encodedBarcodeData, barcodeFormat]);

  // Generate 1D Barcode SVG Paths
  const barcode1DData = useMemo(() => {
    return generateBarcodeSVGPaths(encodedBarcodeData, 220, 36);
  }, [encodedBarcodeData]);

  // Dedicated SVG backgrounds that include complete, hyper-premium artwork
  const isDedicatedSvgBg =
    bgConfig.type === 'default' ||
    (bgConfig.type === 'preset' &&
      (bgConfig.presetId === 'cyber_armor' ||
        bgConfig.presetId === 'obsidian_gold' ||
        bgConfig.presetId === 'platinum_titanium'));

  const isObsidianGoldEdition = bgConfig.presetId === 'obsidian_gold';
  const isPlatinumTitaniumEdition = bgConfig.presetId === 'platinum_titanium';
  const isCyberArmorEdition = bgConfig.type === 'default' || bgConfig.presetId === 'cyber_armor';

  // Background style computation for card element
  const cardBackgroundStyle = useMemo(() => {
    if (
      bgConfig.type === 'custom_image' &&
      bgConfig.customImageUrl &&
      !bgConfig.customImageUrl.includes('/assets/rfa-card-')
    ) {
      return {
        backgroundImage: `url(${bgConfig.customImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: bgConfig.opacity,
        mixBlendMode: bgConfig.blendMode
      };
    }

    if (bgConfig.presetId === 'obsidian_gold') {
      return {
        backgroundImage: `url('/assets/rfa-card-obsidian-gold.svg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: bgConfig.opacity
      };
    }

    if (bgConfig.presetId === 'platinum_titanium') {
      return {
        backgroundImage: `url('/assets/rfa-card-platinum-titanium.svg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: bgConfig.opacity
      };
    }

    if (bgConfig.type === 'preset' && bgConfig.presetId && bgConfig.presetId !== 'cyber_armor') {
      const preset = PRESET_BACKGROUND_TEMPLATES.find((p) => p.id === bgConfig.presetId);
      if (preset) {
        return {
          background: preset.backgroundStyle,
          opacity: bgConfig.opacity,
          mixBlendMode: bgConfig.blendMode
        };
      }
    }

    // Default style: uses official RFA GYM Cyber Armor
    return {
      backgroundImage: `url('/assets/rfa-card-default-bg.svg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: bgConfig.opacity
    };
  }, [bgConfig]);

  if (!isOpen || !member) return null;

  // Interactive 3D Card Tilt Handlers
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -11;
    const rotateY = ((x - centerX) / centerX) * 11;
    const sheenX = (x / rect.width) * 100;
    const sheenY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, sheenX, sheenY, isHovering: true });
  };

  const handleCardMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, sheenX: 50, sheenY: 50, isHovering: false });
  };

  // Background Management Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas gambar maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updated: PassBackgroundConfig = {
        ...bgConfig,
        type: 'custom_image',
        customImageUrl: base64,
        customImageName: file.name
      };
      setBgConfig(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrlImage = () => {
    if (!customUrlInput.trim()) return;
    const updated: PassBackgroundConfig = {
      ...bgConfig,
      type: 'custom_image',
      customImageUrl: customUrlInput.trim(),
      customImageName: 'online-image'
    };
    setBgConfig(updated);
    setCustomUrlInput('');
  };

  const handleSelectPreset = (preset: BackgroundPreset) => {
    const updated: PassBackgroundConfig = {
      ...bgConfig,
      type: preset.id === 'cyber_armor' ? 'default' : 'preset',
      presetId: preset.id
    };
    setBgConfig(updated);

    // Auto-adjust theme and labels for premium editions
    if (preset.id === 'obsidian_gold') {
      setSelectedThemeId('gold');
      setMembershipLabel('ROYAL VIP MEMBER');
    } else if (preset.id === 'platinum_titanium') {
      setSelectedThemeId('titanium');
      setMembershipLabel('PLATINUM ELITE');
    } else if (preset.id === 'cyber_armor') {
      setSelectedThemeId('orange');
      setMembershipLabel('MEMBERSHIP');
    }
  };

  const handleRemoveCustomImage = () => {
    const updated: PassBackgroundConfig = {
      ...bgConfig,
      type: 'default',
      presetId: 'cyber_armor',
      customImageUrl: '',
      customImageName: ''
    };
    setBgConfig(updated);
  };

  const handleSaveBackgroundAsGlobalDefault = () => {
    savePassBackgroundConfig(bgConfig);
    setSaveSuccessMsg('✅ Desain background berhasil disimpan permanen untuk semua kartu member!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleResetBackgroundToDefault = () => {
    const reset = resetPassBackgroundConfig();
    setBgConfig(reset);
    setSelectedThemeId('orange');
    setMembershipLabel('MEMBERSHIP');
    setSaveSuccessMsg('🔄 Desain background dikembalikan ke Cyber Armor bawaan resmi.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // 1-Click Premium Presets Handlers
  const handleApplyPresetRoyalGold = () => {
    setBgConfig({
      ...bgConfig,
      type: 'preset',
      presetId: 'obsidian_gold',
      opacity: 1,
      darkOverlay: 0,
      showArmorPanels: false,
      showHexMesh: false
    });
    setSelectedThemeId('gold');
    setMembershipLabel('ROYAL VIP MEMBER');
    setCenterBannerMode('barcode_1d');
    setBarcodeDataSource('username');
  };

  const handleApplyPresetPlatinumTitanium = () => {
    setBgConfig({
      ...bgConfig,
      type: 'preset',
      presetId: 'platinum_titanium',
      opacity: 1,
      darkOverlay: 0,
      showArmorPanels: false,
      showHexMesh: false
    });
    setSelectedThemeId('titanium');
    setMembershipLabel('PLATINUM ELITE');
    setCenterBannerMode('barcode_1d');
    setBarcodeDataSource('username');
  };

  const handleApplyPresetOfficialCyber = () => {
    setBgConfig({
      ...bgConfig,
      type: 'default',
      presetId: 'cyber_armor',
      opacity: 1,
      darkOverlay: 0,
      showArmorPanels: false,
      showHexMesh: false
    });
    setSelectedThemeId('orange');
    setMembershipLabel('MEMBERSHIP');
    setCenterBannerMode('barcode_1d');
    setBarcodeDataSource('username');
  };

  const handleApplyPresetUsername = () => {
    setBarcodeDataSource('username');
    setCustomName(member.name.toUpperCase());
    setBarcodeFormat('dual_hybrid');
    setCenterBannerMode('barcode_1d');
  };

  const handleResetToDefault = () => {
    setCustomName(member.name.toUpperCase());
    setCustomPassCode(getMemberPassCode(member.id, member.name));
    setMembershipLabel('MEMBERSHIP');
    setSelectedThemeId('orange');
    setBarcodeDataSource('username');
    setBarcodeFormat('dual_hybrid');
    setCenterBannerMode('barcode_1d');
    setShowExpiryDate(true);
    setShowBranchTag(true);
    handleResetBackgroundToDefault();
  };

  // Test scan simulation
  const handleTestScan = () => {
    playBeep(false);
    setTestScanFeedback(`✅ Terverifikasi: Data Barcode "${encodedBarcodeData}" cocok 100% dengan Member ${member.name} (${member.id}) untuk sistem presensi gym.`);
    setTimeout(() => setTestScanFeedback(null), 5000);
  };

  // Copy encoded barcode content
  const handleCopyBarcodeData = () => {
    navigator.clipboard.writeText(encodedBarcodeData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download high-resolution PNG
  const handleDownloadPNG = () => {
    if (!cardRef.current || !window.html2canvas) return;
    setIsGenerating(true);
    // Flatten tilt during image capture for high definition render
    setTilt({ rotateX: 0, rotateY: 0, sheenX: 50, sheenY: 50, isHovering: false });

    setTimeout(() => {
      window.html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      })
        .then((canvas: HTMLCanvasElement) => {
          const link = document.createElement('a');
          const editionName = isObsidianGoldEdition ? 'VIP_Gold' : isPlatinumTitaniumEdition ? 'Platinum' : 'Pass';
          link.download = `RFA_${editionName}_${displayPassCode}_${displayName.replace(/\s+/g, '_')}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          setIsGenerating(false);
        })
        .catch((err: any) => {
          console.error('Error generating card image:', err);
          setIsGenerating(false);
        });
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const edition = isObsidianGoldEdition ? 'Royal Obsidian 24K Gold VIP' : isPlatinumTitaniumEdition ? 'Platinum Titanium Elite' : 'Digital Member Pass';
    const text = `Halo Kak ${member.name},\nBerikut adalah ${edition} RFA GYM kamu:\n\n*Nama Pengguna:* ${displayName}\n*Kode Barcode:* ${encodedBarcodeData}\n*Kode Akses Pass:* ${displayPassCode}\n*Member ID:* ${member.id}\n*Kategori:* ${membershipLabel}\n*Masa Berlaku:* s/d ${member.expired}\n\nTunjukkan kartu digital ini saat scan akses gym & presensi harian. Tetap semangat latihan! 💪🏋️`;
    const phone = member.phone ? member.phone.replace(/^0/, '62').replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl p-4 sm:p-6 my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-lg"
              style={{
                backgroundColor: `${currentTheme.primaryColor}22`,
                borderColor: `${currentTheme.primaryColor}55`,
                borderWidth: 1,
                color: currentTheme.primaryColor
              }}
            >
              {isObsidianGoldEdition ? <Crown className="w-5 h-5" /> : isPlatinumTitaniumEdition ? <Gem className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  Digital Member Pass Premium • RFA GYM
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1"
                  style={{
                    backgroundColor: `${currentTheme.primaryColor}25`,
                    color: currentTheme.primaryColor,
                    border: `1px solid ${currentTheme.primaryColor}40`
                  }}
                >
                  {isObsidianGoldEdition ? '👑 24K Gold VIP' : isPlatinumTitaniumEdition ? '💎 Platinum' : currentTheme.name}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Kartu akses mewah kelas eksekutif dengan smart chip emas, barcode nama pengguna, dan efek hologram 3D
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCostumePanel(!showCostumePanel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                showCostumePanel
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Buka / Tutup Panel Kustomisasi"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Costume Studio</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Premium Edition Switcher Bar */}
        <div className="mt-3 py-2 px-3 bg-zinc-950/90 border border-zinc-800/90 rounded-2xl flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1 mr-1">
              <Shield className="w-3.5 h-3.5 text-orange-400" /> Desain Kartu:
            </span>

            {/* PRESET 1: DEFAULT OFFICIAL CYBER ARMOR (USER EXPLICIT: SAYA MAU BACKGROUND DEFAULT) */}
            <button
              onClick={handleApplyPresetOfficialCyber}
              className={`px-3 py-1 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 shadow-sm ${
                isCyberArmorEdition
                  ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 text-zinc-950 shadow-orange-500/25 ring-1 ring-orange-300'
                  : 'bg-zinc-800 text-orange-400 hover:bg-zinc-700 border border-orange-500/30'
              }`}
              title="Background Default Resmi RFA GYM: Titanium matte, microchip cerdas, guilloche & speed slashes"
            >
              <Shield className="w-3.5 h-3.5" /> 🛡️ Background Default (Resmi)
            </button>

            {/* PRESET 2: ROYAL OBSIDIAN 24K GOLD VIP */}
            <button
              onClick={handleApplyPresetRoyalGold}
              className={`px-3 py-1 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 shadow-sm ${
                isObsidianGoldEdition
                  ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-zinc-950 shadow-yellow-500/25 ring-1 ring-yellow-300'
                  : 'bg-zinc-800 text-yellow-300 hover:bg-zinc-700 border border-yellow-500/30'
              }`}
              title="Edisi Sultan: Smart Chip Emas 24K, Guilloche Rosette & Hot-Stamp Logo"
            >
              <Crown className="w-3.5 h-3.5" /> 👑 Royal 24K Gold VIP
            </button>

            {/* PRESET 3: PLATINUM TITANIUM ELITE */}
            <button
              onClick={handleApplyPresetPlatinumTitanium}
              className={`px-3 py-1 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 shadow-sm ${
                isPlatinumTitaniumEdition
                  ? 'bg-gradient-to-r from-slate-200 via-white to-slate-300 text-zinc-950 shadow-slate-300/20 ring-1 ring-white'
                  : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700 border border-slate-600/40'
              }`}
              title="Edisi Modern Minimalis: Titanium Brushed & Silver Microchip"
            >
              <Gem className="w-3.5 h-3.5" /> 💎 Platinum Titanium
            </button>

            {/* PRESET 4: BARCODE NAMA PENGGUNA */}
            <button
              onClick={handleApplyPresetUsername}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
                barcodeDataSource === 'username'
                  ? 'bg-zinc-800 text-orange-300 border border-orange-500/40'
                  : 'bg-zinc-850 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Isi data barcode dengan Nama Pengguna"
            >
              <User className="w-3 h-3 text-orange-400" /> Barcode: Nama Pengguna
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyPresetOfficialCyber}
              className="text-[11px] text-orange-400 hover:text-orange-300 font-bold transition flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20"
              title="Kembalikan Desain ke Background Default Resmi RFA"
            >
              <RotateCcw className="w-3 h-3" /> Background Default
            </button>
            <button
              onClick={handleResetToDefault}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 transition flex items-center gap-1"
              title="Reset ke pengaturan awal"
            >
              <RotateCcw className="w-3 h-3" /> Reset Semua
            </button>
          </div>
        </div>

        {/* Global Save Success Notification Banner */}
        {saveSuccessMsg && (
          <div className="mt-2.5 px-3.5 py-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-in fade-in shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {saveSuccessMsg}
            </span>
            <button
              onClick={() => setSaveSuccessMsg(null)}
              className="text-emerald-400 hover:text-emerald-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area: Split View (Costume Controls on Left, Live Card on Right) */}
        <div className="flex-1 overflow-y-auto mt-3 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* LEFT: Costume Controls Panel */}
          {showCostumePanel && (
            <div className="lg:col-span-6 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 space-y-4">
              
              {/* Costume Sub-tabs */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setActiveCostumeTab('barcode')}
                  className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    activeCostumeTab === 'barcode'
                      ? 'bg-yellow-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <BarcodeIcon className="w-3 h-3" /> Data Barcode
                </button>
                <button
                  onClick={() => setActiveCostumeTab('text')}
                  className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    activeCostumeTab === 'text'
                      ? 'bg-yellow-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3" /> Identitas
                </button>
                <button
                  onClick={() => setActiveCostumeTab('background')}
                  className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    activeCostumeTab === 'background'
                      ? 'bg-yellow-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Galeri Desain & Unggah Latar Belakang"
                >
                  <ImageIcon className="w-3 h-3" /> Desain BG
                </button>
                <button
                  onClick={() => setActiveCostumeTab('theme')}
                  className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 ${
                    activeCostumeTab === 'theme'
                      ? 'bg-yellow-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Palette className="w-3 h-3" /> Aksen
                </button>
              </div>

              {/* TAB 1: DATA BARCODE & FORMAT */}
              {activeCostumeTab === 'barcode' && (
                <div className="space-y-3.5 animate-in fade-in">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 flex items-center justify-between mb-1.5">
                      <span>Isi Data Barcode / QR Code:</span>
                      <span className="text-[11px] font-mono text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                        {encodedBarcodeData.length} Karakter
                      </span>
                    </label>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* OPTION 1: NAMA PENGGUNA (HIGHLIGHTED FOR USER REQUEST) */}
                      <button
                        onClick={() => setBarcodeDataSource('username')}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 relative overflow-hidden ${
                          barcodeDataSource === 'username'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1 text-white text-xs">
                            <User className="w-3.5 h-3.5 text-yellow-400" /> Nama Pengguna
                          </span>
                          {barcodeDataSource === 'username' && (
                            <Check className="w-3.5 h-3.5 text-yellow-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate">
                          "{displayName}"
                        </span>
                        <div className="text-[9px] font-semibold text-yellow-400/90 mt-0.5">
                          ⭐ Sesuai Permintaan
                        </div>
                      </button>

                      {/* OPTION 2: NAMA + ID */}
                      <button
                        onClick={() => setBarcodeDataSource('username_id')}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          barcodeDataSource === 'username_id'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">Nama + ID</span>
                          {barcodeDataSource === 'username_id' && (
                            <Check className="w-3.5 h-3.5 text-yellow-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate">
                          "{displayName} - {member.id}"
                        </span>
                      </button>

                      {/* OPTION 3: PROTOKOL RFA */}
                      <button
                        onClick={() => setBarcodeDataSource('rfa_protocol')}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          barcodeDataSource === 'rfa_protocol'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">Protokol RFA</span>
                          {barcodeDataSource === 'rfa_protocol' && (
                            <Check className="w-3.5 h-3.5 text-yellow-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate">
                          "RFA-MEMBER:{member.id}:{displayPassCode}"
                        </span>
                      </button>

                      {/* OPTION 4: KODE PASS HEX */}
                      <button
                        onClick={() => setBarcodeDataSource('passcode')}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                          barcodeDataSource === 'passcode'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">Pass Code Hex</span>
                          {barcodeDataSource === 'passcode' && (
                            <Check className="w-3.5 h-3.5 text-yellow-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate">
                          "{displayPassCode}"
                        </span>
                      </button>
                    </div>

                    {/* Custom Data Input (Optional) */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-zinc-400">Atau Teks Manual Bebas:</span>
                        {barcodeDataSource === 'custom' && (
                          <span className="text-[10px] text-yellow-400 font-bold">Mode Kustom Aktif</span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Contoh: AHMAD_TAJUDIN atau USER-VIP"
                        value={customBarcodeValue}
                        onChange={(e) => {
                          setCustomBarcodeValue(e.target.value);
                          setBarcodeDataSource('custom');
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Format Barcode: QR Code vs Barcode Garis 1D vs Dual */}
                  <div className="pt-2 border-t border-zinc-800/80">
                    <label className="text-xs font-bold text-zinc-300 mb-1.5 block">
                      Tipe Tampilan Barcode di Kartu:
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        onClick={() => setBarcodeFormat('dual_hybrid')}
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          barcodeFormat === 'dual_hybrid'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span className="font-bold text-[11px]">Dual / Hybrid</span>
                        <span className="text-[9px] text-zinc-500">QR + Barcode Garis</span>
                      </button>

                      <button
                        onClick={() => setBarcodeFormat('qr_only')}
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          barcodeFormat === 'qr_only'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="font-bold text-[11px]">QR Code Saja</span>
                        <span className="text-[9px] text-zinc-500">2D Camera Scanner</span>
                      </button>

                      <button
                        onClick={() => setBarcodeFormat('barcode_1d')}
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          barcodeFormat === 'barcode_1d'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <BarcodeIcon className="w-4 h-4" />
                        <span className="font-bold text-[11px]">Barcode Garis</span>
                        <span className="text-[9px] text-zinc-500">1D Laser Scanner</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Barcode Preview Card */}
                  <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        Data Terenkripsi di Barcode:
                      </div>
                      <div className="font-mono text-yellow-400 font-bold truncate text-xs mt-0.5">
                        {encodedBarcodeData}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={handleCopyBarcodeData}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold transition flex items-center gap-1"
                        title="Salin Data Barcode"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                      </button>
                      <button
                        onClick={handleTestScan}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1"
                        title="Uji coba kecocokan scanner presensi"
                      >
                        <Eye className="w-3 h-3" /> Uji Scan
                      </button>
                    </div>
                  </div>

                  {testScanFeedback && (
                    <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs animate-in fade-in">
                      {testScanFeedback}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TEKS & IDENTITAS */}
              {activeCostumeTab === 'text' && (
                <div className="space-y-3 animate-in fade-in">
                  {/* Nama Pengguna Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-300">
                        Nama Pengguna di Kartu:
                      </label>
                      <button
                        onClick={() => setCustomName('AT AHMAD TAJUDIN')}
                        className="text-[10px] text-yellow-400 hover:underline"
                      >
                        Gunakan "AT AHMAD TAJUDIN"
                      </button>
                    </div>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                      placeholder="Masukkan nama pengguna..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 uppercase font-bold"
                    />
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => setCustomName(member.name.toUpperCase())}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                      >
                        Reset ke Nama Member Asli ({member.name})
                      </button>
                    </div>
                  </div>

                  {/* Kategori Membership */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Label Keanggotaan (Badge):
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {['ROYAL VIP MEMBER', 'PLATINUM ELITE', 'FOUNDER CIRCLE', 'MEMBERSHIP'].map((lbl) => (
                        <button
                          key={lbl}
                          onClick={() => setMembershipLabel(lbl)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left transition ${
                            membershipLabel === lbl
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={membershipLabel}
                      onChange={(e) => setMembershipLabel(e.target.value.toUpperCase())}
                      placeholder="Atau ketik kustom..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 uppercase font-semibold"
                    />
                  </div>

                  {/* Konten Banner Tengah */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      Tampilan di Banner Tengah Kartu:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setCenterBannerMode('barcode_1d')}
                        className={`p-2 rounded-xl border text-left transition ${
                          centerBannerMode === 'barcode_1d'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-white flex items-center gap-1">
                          <BarcodeIcon className="w-3.5 h-3.5 text-yellow-400" /> Garis Barcode 1D
                        </div>
                        <div className="text-[10px] text-zinc-400">Laser Scanner Standar</div>
                      </button>

                      <button
                        onClick={() => setCenterBannerMode('passcode')}
                        className={`p-2 rounded-xl border text-left transition ${
                          centerBannerMode === 'passcode'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-white">Kode Pass Hex</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{displayPassCode}</div>
                      </button>

                      <button
                        onClick={() => setCenterBannerMode('username')}
                        className={`p-2 rounded-xl border text-left transition ${
                          centerBannerMode === 'username'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-white">Nama Pengguna</div>
                        <div className="text-[10px] text-zinc-400 truncate">{displayName}</div>
                      </button>

                      <button
                        onClick={() => setCenterBannerMode('member_id')}
                        className={`p-2 rounded-xl border text-left transition ${
                          centerBannerMode === 'member_id'
                            ? 'bg-yellow-500/15 border-yellow-500 text-yellow-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-white">ID Member</div>
                        <div className="text-[10px] text-zinc-400">{member.id}</div>
                      </button>
                    </div>
                  </div>

                  {/* Passcode Field */}
                  <div className="pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-300">
                        Kode Akses Pass (8-Hex):
                      </label>
                      <button
                        onClick={() => setCustomPassCode(getMemberPassCode(member.id, displayName))}
                        className="text-[10px] text-yellow-400 hover:underline"
                      >
                        Generate Acak
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={12}
                      value={customPassCode}
                      onChange={(e) => setCustomPassCode(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-yellow-400 font-mono font-black focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: DESAIN BACKGROUND DINAMIS (ADMIN FEATURE) */}
              {activeCostumeTab === 'background' && (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* Info Header */}
                  <div className="p-3 bg-yellow-950/30 border border-yellow-500/30 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-yellow-300 mb-1">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Koleksi Latar Belakang Kartu Eksekutif (Admin)
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Pilih dari edisi kartu sultan mewah, unggah desain branding kustom, atau simpan sebagai latar belakang resmi seluruh member gym.
                    </p>
                  </div>

                  {/* PRESET BACKGROUND GALLERY (INCLUDING PREMIUM EDITIONS) */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      Pilih Edisi Desain Kartu Siap Pakai:
                    </label>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {PRESET_BACKGROUND_TEMPLATES.map((preset) => {
                        const isSelected =
                          (bgConfig.type === 'preset' && bgConfig.presetId === preset.id) ||
                          (bgConfig.type === 'default' && preset.id === 'cyber_armor');

                        return (
                          <button
                            key={preset.id}
                            onClick={() => handleSelectPreset(preset)}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1.5 relative overflow-hidden ${
                              isSelected
                                ? 'bg-yellow-950/40 border-yellow-500 text-yellow-200 shadow-md shadow-yellow-500/10 ring-1 ring-yellow-500/40'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-[11px] truncate flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: preset.previewColor }}
                                />
                                {preset.name}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                            </div>
                            <span className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                              {preset.description}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 self-start font-medium">
                              {preset.category}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* UPLOAD CUSTOM BACKGROUND IMAGE */}
                  <div className="pt-2 border-t border-zinc-800">
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      Atau Unggah Gambar Desain Sendiri:
                    </label>

                    <div className="p-3 border-2 border-dashed border-zinc-800 hover:border-yellow-500/60 rounded-2xl bg-zinc-900/60 text-center transition">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {bgConfig.type === 'custom_image' && bgConfig.customImageUrl ? (
                        <div className="space-y-2">
                          <div className="w-full h-24 rounded-xl overflow-hidden relative border border-zinc-700">
                            <img
                              src={bgConfig.customImageUrl}
                              alt="Custom Background"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                              <span className="text-[11px] text-white font-bold bg-black/60 px-2 py-1 rounded-lg">
                                {bgConfig.customImageName || 'Gambar Kustom Aktif'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" /> Ganti Gambar
                            </button>
                            <button
                              onClick={handleRemoveCustomImage}
                              className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800/40 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer py-3 flex flex-col items-center justify-center gap-1.5 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 text-yellow-400 flex items-center justify-center transition">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-yellow-300 transition">
                            Klik atau Seret Gambar ke Sini
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Format JPG, PNG, WebP, atau SVG (Maks. 5MB)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* URL Input Alternative */}
                    <div className="mt-2 flex gap-1.5">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                        <input
                          type="url"
                          placeholder="Atau tempel URL gambar (https://...)"
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                      <button
                        onClick={handleApplyUrlImage}
                        disabled={!customUrlInput.trim()}
                        className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 rounded-xl text-xs font-bold disabled:opacity-40 transition"
                      >
                        Pasang
                      </button>
                    </div>
                  </div>

                  {/* BACKGROUND FINE-TUNING SLIDERS */}
                  <div className="pt-2 border-t border-zinc-800 space-y-3">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-yellow-400" />
                      Penyesuaian Visual & Keterbacaan:
                    </label>

                    {/* Opacity Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400 text-[11px]">Transparansi Latar (Opacity):</span>
                        <span className="font-mono text-yellow-300 font-bold text-[11px]">
                          {Math.round(bgConfig.opacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={Math.round(bgConfig.opacity * 100)}
                        onChange={(e) =>
                          setBgConfig({ ...bgConfig, opacity: parseInt(e.target.value, 10) / 100 })
                        }
                        className="w-full accent-yellow-500 cursor-pointer"
                      />
                    </div>

                    {/* Dark Tint Overlay Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400 text-[11px]">Overlay Gelap (Kontras Teks & Barcode):</span>
                        <span className="font-mono text-yellow-300 font-bold text-[11px]">
                          {bgConfig.darkOverlay}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="85"
                        step="5"
                        value={bgConfig.darkOverlay}
                        onChange={(e) =>
                          setBgConfig({ ...bgConfig, darkOverlay: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-yellow-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* ADMIN SAVE BUTTONS */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={handleResetBackgroundToDefault}
                      className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Default RFA
                    </button>

                    <button
                      onClick={handleSaveBackgroundAsGlobalDefault}
                      className="flex-1 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/20"
                    >
                      <Save className="w-4 h-4" /> Simpan Sebagai Desain Utama Gym
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: TEMA WARNA AKSEN */}
              {activeCostumeTab === 'theme' && (
                <div className="space-y-3.5 animate-in fade-in">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 mb-2 block">
                      Pilih Tema Warna Aksen Kartu:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {PASS_THEMES.map((th) => (
                        <button
                          key={th.id}
                          onClick={() => setSelectedThemeId(th.id)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                            selectedThemeId === th.id
                              ? 'bg-zinc-900 border-white text-white shadow-md'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-full shrink-0 shadow-sm"
                            style={{
                              backgroundColor: th.primaryColor,
                              boxShadow: `0 0 10px ${th.glowColor}`
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-[11px] truncate text-white">{th.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Toggles */}
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Elemen Visual Tambahan:
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs cursor-pointer hover:bg-zinc-850">
                      <span className="text-zinc-300">Tampilkan Masa Berlaku (Expired)</span>
                      <input
                        type="checkbox"
                        checked={showExpiryDate}
                        onChange={(e) => setShowExpiryDate(e.target.checked)}
                        className="rounded text-yellow-500 focus:ring-0 bg-zinc-800 border-zinc-700 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs cursor-pointer hover:bg-zinc-850">
                      <span className="text-zinc-300">Badge Cabang RFA Central</span>
                      <input
                        type="checkbox"
                        checked={showBranchTag}
                        onChange={(e) => setShowBranchTag(e.target.checked)}
                        className="rounded text-yellow-500 focus:ring-0 bg-zinc-800 border-zinc-700 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RIGHT: Live Interactive 3D Digital Member Pass Card Preview */}
          <div className={`${showCostumePanel ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col items-center justify-center p-2`}>
            
            {/* Live Indicator Banner */}
            <div className="mb-3 px-3 py-1.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-zinc-400 text-xs flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Efek 3D Gyro Aktif • Arahkan kursor ke kartu</span>
            </div>

            {/* The Actual Digital Pass Card Element with Interactive 3D Perspective Tilt */}
            <div
              ref={cardRef}
              id="digital-member-pass-card"
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="relative w-[320px] h-[560px] rounded-[26px] overflow-hidden shadow-2xl select-none shrink-0 transition-transform duration-150 ease-out cursor-pointer"
              style={{
                backgroundColor: bgConfig.backgroundColor || '#0a0b0e',
                boxShadow: `0 30px 60px -12px rgba(0, 0, 0, 0.95), 0 0 30px ${currentTheme.glowColor}`,
                transform: tilt.isHovering
                  ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(1.02)`
                  : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* DYNAMIC BACKGROUND LAYER (Admin Custom Image, Royal Gold, Platinum, or Cyber Armor) */}
              <div
                className="absolute inset-0 z-0 pointer-events-none transition-all duration-300"
                style={cardBackgroundStyle}
              />

              {/* HOLOGRAPHIC SPECULAR SHEEN (Simulating metallic rainbow reflection upon tilt) */}
              <div
                className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-200"
                style={{
                  background: `radial-gradient(circle at ${tilt.sheenX}% ${tilt.sheenY}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 215, 0, 0.12) 30%, transparent 65%)`,
                  opacity: tilt.isHovering ? 1 : 0.25,
                  mixBlendMode: 'screen'
                }}
              />

              {/* DYNAMIC DARK OVERLAY (Ensures barcode and text readability) */}
              {bgConfig.darkOverlay > 0 && (
                <div
                  className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
                  style={{
                    backgroundColor: `rgba(0, 0, 0, ${bgConfig.darkOverlay / 100})`
                  }}
                />
              )}

              {/* HTML LOGO & HEADER: Only rendered for custom non-dedicated backgrounds */}
              {!isDedicatedSvgBg && (
                <div className="relative pt-6 px-6 z-10 flex items-center gap-3">
                  <div
                    className="w-12 h-12 shrink-0 relative flex items-center justify-center filter"
                    style={{ filter: `drop-shadow(0 0 8px ${currentTheme.glowColor})` }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        <linearGradient id={`rfaFlame_${selectedThemeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={currentTheme.gradientTo} />
                          <stop offset="50%" stopColor={currentTheme.gradientVia} />
                          <stop offset="100%" stopColor={currentTheme.gradientFrom} />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 18,32 C 30,12 70,8 88,14 C 74,22 55,24 45,28 C 65,28 85,38 82,54 C 80,66 65,72 50,72 L 40,72 L 58,92 C 50,92 42,90 32,80 L 22,66 L 26,45 Z"
                        fill={`url(#rfaFlame_${selectedThemeId})`}
                      />
                      <path
                        d="M 38,36 C 45,34 62,35 64,48 C 65,56 55,60 44,60 L 32,60 Z"
                        fill="#0a0b0e"
                      />
                      <path
                        d="M 12,32 C 26,18 52,14 76,14 C 54,20 34,26 18,38 Z"
                        fill={currentTheme.gradientTo}
                      />
                    </svg>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5 leading-none">
                      <span className="text-white font-black text-xl tracking-wider font-sans">
                        RFA
                      </span>
                      <span
                        className="font-black text-xl tracking-wider font-sans"
                        style={{ color: currentTheme.primaryColor }}
                      >
                        GYM
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1 mt-1 text-[8.5px] font-bold tracking-[0.25em] uppercase"
                      style={{ color: currentTheme.primaryColor }}
                    >
                      <span className="w-2.5 h-[1px] bg-current opacity-70" />
                      <span>FITNESS CENTER</span>
                      <span className="w-2.5 h-[1px] bg-current opacity-70" />
                    </div>
                    {showBranchTag && (
                      <span className="text-[7.5px] text-zinc-300 tracking-wider uppercase font-semibold mt-0.5">
                        RFA CENTRAL BRANCH
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 7. QR CODE TAB PILL (Protruding from Right Edge) */}
              {barcodeFormat !== 'barcode_1d' && (
                <div
                  className={`absolute right-0 top-[192px] z-20 flex flex-col items-center ${
                    isDedicatedSvgBg
                      ? 'pr-3.5 pl-2 py-2'
                      : 'pl-3 pr-2.5 py-2.5 rounded-l-[22px] bg-[#0c0d12] shadow-xl border-t border-l border-b border-yellow-500/40'
                  }`}
                  style={isDedicatedSvgBg ? undefined : { boxShadow: '-4px 6px 14px rgba(0,0,0,0.7)' }}
                >
                  <div className="p-1 bg-white rounded-xl shadow-xs">
                    <canvas ref={qrRef} className="w-[72px] h-[72px] block" />
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider mt-1 ${isObsidianGoldEdition ? 'text-yellow-400' : isPlatinumTitaniumEdition ? 'text-slate-300' : 'text-zinc-700'}`}>
                    {barcodeDataSource === 'username' ? 'USER QR' : 'ACCESS QR'}
                  </span>
                </div>
              )}

              {/* 8. CENTER HIGHLIGHT BAR (Pass Code Banner OR Barcode 1D Strip) */}
              <div
                className={`absolute left-0 top-[278px] z-20 flex flex-col justify-center min-h-[58px] ${
                  isDedicatedSvgBg
                    ? 'w-[255px] py-3 pl-4 pr-3'
                    : 'w-[275px] py-3 pl-5 pr-4 rounded-r-[32px] bg-[#0c0d12] shadow-2xl border-t border-r border-b border-yellow-500/40'
                }`}
                style={isDedicatedSvgBg ? undefined : { boxShadow: '0 8px 24px rgba(0,0,0,0.7)' }}
              >
                {/* MODE A: 1D LINEAR BARCODE (Code 128) */}
                {centerBannerMode === 'barcode_1d' || barcodeFormat === 'barcode_1d' ? (
                  <div className="flex flex-col items-center justify-center w-full pr-2">
                    {/* Barcode SVG Stripes */}
                    <div className="w-[210px] h-[34px] overflow-hidden flex items-center justify-center relative">
                      <svg
                        viewBox={`0 0 ${barcode1DData.width} ${barcode1DData.height}`}
                        className="w-full h-full block"
                        preserveAspectRatio="none"
                      >
                        <path d={barcode1DData.paths} fill={isObsidianGoldEdition ? '#f5e08c' : isPlatinumTitaniumEdition ? '#e2e8f0' : '#0d1322'} />
                      </svg>
                      {/* Laser scanner effect line */}
                      <div
                        className="absolute inset-x-0 h-[1.5px] top-1/2 opacity-80 pointer-events-none animate-pulse"
                        style={{
                          backgroundColor: currentTheme.primaryColor,
                          boxShadow: `0 0 6px ${currentTheme.primaryColor}`
                        }}
                      />
                    </div>
                    {/* Human readable label beneath barcode */}
                    <span className={`font-mono text-[9.5px] font-black tracking-[0.14em] uppercase truncate max-w-[210px] mt-0.5 ${isObsidianGoldEdition ? 'text-yellow-400' : isPlatinumTitaniumEdition ? 'text-slate-300' : 'text-[#0d1322]'}`}>
                      *{encodedBarcodeData}*
                    </span>
                  </div>
                ) : centerBannerMode === 'username' ? (
                  /* MODE B: BIG USERNAME DISPLAY */
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black tracking-wider uppercase text-zinc-400">
                      NAMA PENGGUNA:
                    </span>
                    <span className={`font-black text-[20px] tracking-wide font-sans leading-none truncate max-w-[220px] ${isObsidianGoldEdition ? 'text-yellow-300' : isPlatinumTitaniumEdition ? 'text-white' : 'text-[#0d1322]'}`}>
                      {displayName}
                    </span>
                  </div>
                ) : centerBannerMode === 'member_id' ? (
                  /* MODE C: MEMBER ID DISPLAY */
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black tracking-wider uppercase text-zinc-400">
                      MEMBER ID:
                    </span>
                    <span className={`font-black text-[26px] tracking-wider font-mono leading-none ${isObsidianGoldEdition ? 'text-yellow-300' : isPlatinumTitaniumEdition ? 'text-white' : 'text-[#0d1322]'}`}>
                      {member.id}
                    </span>
                  </div>
                ) : (
                  /* MODE D: DEFAULT 8-HEX PASSCODE */
                  <span
                    className={`font-black text-[27px] tracking-[0.08em] font-sans leading-none select-all ${isObsidianGoldEdition ? 'text-yellow-300' : isPlatinumTitaniumEdition ? 'text-white' : 'text-[#0d1322]'}`}
                  >
                    {displayPassCode}
                  </span>
                )}
              </div>

              {/* 9. BOTTOM RIGHT IDENTITY & MEMBERSHIP SECTION */}
              <div
                className={`absolute right-[28px] z-20 text-right max-w-[210px] ${
                  isDedicatedSvgBg ? 'bottom-[76px]' : 'bottom-[28px]'
                }`}
              >
                {/* Member / User Name */}
                <h2
                  className="font-black text-white text-[19px] sm:text-[20px] uppercase leading-tight font-sans tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  style={{
                    wordBreak: 'break-word'
                  }}
                >
                  {displayName}
                </h2>

                {/* Membership Category Tag */}
                {(!isDedicatedSvgBg || (membershipLabel !== 'MEMBERSHIP' && membershipLabel !== 'ROYAL VIP MEMBER')) && (
                  <p
                    className="text-[11.5px] font-bold tracking-[0.2em] uppercase mt-2.5 font-sans"
                    style={{ color: currentTheme.primaryColor }}
                  >
                    {membershipLabel}
                  </p>
                )}

                {/* Expiry Date & ID Sub-info */}
                {showExpiryDate && (
                  <div className="mt-1 text-[9.5px] font-semibold text-zinc-300 font-mono tracking-wider drop-shadow-md">
                    ID: {member.id} • EXP: {member.expired || 'ACTIVE'}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Attendance / Absen Card directly linked with Gym Attendance System */}
            <div className="w-[320px] mt-3 p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-2 select-none shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" /> Presensi Hari Ini:
                </span>
                {activeAttendanceSession ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Aktif di Gym
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Belum Hadir
                  </span>
                )}
              </div>

              {activeAttendanceSession ? (
                <div className="text-[11px] text-zinc-300">
                  Check-In pukul <strong className="text-white">{activeAttendanceSession.timeIn}</strong> ({activeAttendanceSession.badge || 'Gym Reguler'})
                </div>
              ) : (
                <div className="text-[11px] text-zinc-400">
                  Kartu digital siap untuk absensi gym atau tekan tombol presensi langsung:
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleDirectAttendance}
                  disabled={isProcessingAttendance}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow ${
                    activeAttendanceSession
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  {activeAttendanceSession ? (
                    <>
                      <LogOut className="w-3.5 h-3.5" /> Check-Out Presensi
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" /> Check-In Presensi
                    </>
                  )}
                </button>

                {onOpenScanner && (
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    title="Buka Kamera Scanner Presensi"
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition border border-zinc-700"
                  >
                    <Camera className="w-4 h-4 text-orange-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-zinc-400" /> Cetak Pass
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" /> Kirim WhatsApp
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
            >
              Tutup
            </button>
            <button
              onClick={handleDownloadPNG}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 shadow-lg disabled:opacity-50 text-zinc-950"
              style={{
                backgroundColor: currentTheme.primaryColor,
                boxShadow: `0 8px 20px ${currentTheme.glowColor}`
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Menyiapkan...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Unduh Pass (PNG)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
