import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'claymorphism-light' | 'claymorphism' | 'dark' | 'midnight' | 'slate' | 'light';
export type AccentColor = 'orange' | 'emerald' | 'cyan' | 'violet' | 'red' | 'amber';
export type ContentDensity = 'comfortable' | 'compact';
export type BackgroundPattern = 'none' | 'grid' | 'dots';

export interface ThemeConfig {
  mode: ThemeMode;
  accent: AccentColor;
  density: ContentDensity;
  pattern: BackgroundPattern;
}

export interface AccentOption {
  id: AccentColor;
  name: string;
  label: string;
  hex: string;
  hoverHex: string;
  rgb: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export interface ThemeModeOption {
  id: ThemeMode;
  name: string;
  desc: string;
  iconType: 'moon' | 'sparkles' | 'monitor' | 'sun' | 'layers';
  bgPreview: string;
  cardPreview: string;
}

export const THEME_MODE_OPTIONS: ThemeModeOption[] = [
  {
    id: 'claymorphism-light',
    name: 'Claymorphism 3D Terang',
    desc: 'Desain 3D clay taktil & empuk dengan latar putih polos bersih, bayangan timbul lembut, dan teks hitam pekat kontras tinggi agar sangat jelas terbaca.',
    iconType: 'layers',
    bgPreview: 'bg-[#ffffff]',
    cardPreview: 'bg-[#ffffff]'
  },
  {
    id: 'claymorphism',
    name: 'Claymorphism 3D Gelap',
    desc: 'Desain 3D clay taktil & empuk dengan bayangan timbul ganda dan permukaan halus pada latar gelap modern.',
    iconType: 'layers',
    bgPreview: 'bg-[#1e202e]',
    cardPreview: 'bg-[#292c3d]'
  },
  {
    id: 'dark',
    name: 'Obsidian Dark',
    desc: 'Tema gelap zinc standar dengan atmosfer gym modern & elegan.',
    iconType: 'moon',
    bgPreview: 'bg-[#09090b]',
    cardPreview: 'bg-[#18181b]'
  },
  {
    id: 'midnight',
    name: 'Midnight OLED',
    desc: 'Hitam pekat 100% murni, hemat daya baterai & kontras maksimal di tablet.',
    iconType: 'sparkles',
    bgPreview: 'bg-[#000000]',
    cardPreview: 'bg-[#0b0b0e]'
  },
  {
    id: 'slate',
    name: 'Cyber Slate',
    desc: 'Nuansa biru navy futuristik khas dashboard ERP enterprise modern.',
    iconType: 'monitor',
    bgPreview: 'bg-[#0b1120]',
    cardPreview: 'bg-[#111827]'
  },
  {
    id: 'light',
    name: 'Daylight Clean',
    desc: 'Tampilan terang bersih & ramah mata untuk pencahayaan ruang kasir pagi/siang.',
    iconType: 'sun',
    bgPreview: 'bg-[#f8fafc]',
    cardPreview: 'bg-[#ffffff]'
  }
];

export const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: 'orange',
    name: 'Gym Orange',
    label: 'Semangat GymPro (Default)',
    hex: '#f97316',
    hoverHex: '#ea580c',
    rgb: '249, 115, 22',
    badgeBg: 'bg-orange-500/20',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-400'
  },
  {
    id: 'emerald',
    name: 'Electric Emerald',
    label: 'Health, Wellness & Vitalitas',
    hex: '#10b981',
    hoverHex: '#059669',
    rgb: '16, 185, 129',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400'
  },
  {
    id: 'cyan',
    name: 'Cyber Cyan',
    label: 'High-Tech & Modern Digital',
    hex: '#06b6d4',
    hoverHex: '#0891b2',
    rgb: '6, 182, 212',
    badgeBg: 'bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-400'
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    label: 'Kelas Mewah & VIP Club',
    hex: '#8b5cf6',
    hoverHex: '#7c3aed',
    rgb: '139, 92, 246',
    badgeBg: 'bg-purple-500/20',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-400'
  },
  {
    id: 'red',
    name: 'Power Crimson',
    label: 'Intensitas & Powerlifting',
    hex: '#ef4444',
    hoverHex: '#dc2626',
    rgb: '239, 68, 68',
    badgeBg: 'bg-rose-500/20',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-400'
  },
  {
    id: 'amber',
    name: 'Golden Amber',
    label: 'Eksklusif & Emas Tropis',
    hex: '#f59e0b',
    hoverHex: '#d97706',
    rgb: '245, 158, 11',
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-400'
  }
];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'dark',
  accent: 'orange',
  density: 'comfortable',
  pattern: 'none'
};

const STORAGE_KEY = 'gympro_theme_config';

interface ThemeContextType {
  theme: ThemeConfig;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setDensity: (density: ContentDensity) => void;
  setPattern: (pattern: BackgroundPattern) => void;
  resetTheme: () => void;
  isThemeModalOpen: boolean;
  openThemeModal: () => void;
  closeThemeModal: () => void;
  currentAccent: AccentOption;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyThemeToDOM(config: ThemeConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) return;

  const safeConfig = config || DEFAULT_THEME_CONFIG;

  // Set data attributes
  root.setAttribute('data-theme', safeConfig.mode || DEFAULT_THEME_CONFIG.mode);
  root.setAttribute('data-accent', safeConfig.accent || DEFAULT_THEME_CONFIG.accent);
  root.setAttribute('data-density', safeConfig.density || DEFAULT_THEME_CONFIG.density);
  root.setAttribute('data-pattern', safeConfig.pattern || DEFAULT_THEME_CONFIG.pattern);

  // Set dark class for Tailwind if needed
  if (safeConfig.mode === 'light' || safeConfig.mode === 'claymorphism-light') {
    root.classList.remove('dark');
    body.classList.remove('dark');
  } else {
    root.classList.add('dark');
    body.classList.add('dark');
  }

  // Set CSS variables for accent
  const accentOpt = ACCENT_OPTIONS.find((a) => a.id === safeConfig.accent) || ACCENT_OPTIONS[0];
  root.style.setProperty('--primary-accent', accentOpt.hex);
  root.style.setProperty('--primary-accent-hover', accentOpt.hoverHex);
  root.style.setProperty('--primary-accent-rgb', accentOpt.rgb);
  root.style.setProperty('--primary-accent-soft', `rgba(${accentOpt.rgb}, 0.15)`);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            return {
              mode: parsed.mode || DEFAULT_THEME_CONFIG.mode,
              accent: parsed.accent || DEFAULT_THEME_CONFIG.accent,
              density: parsed.density || DEFAULT_THEME_CONFIG.density,
              pattern: parsed.pattern || DEFAULT_THEME_CONFIG.pattern
            };
          }
        }
      }
    } catch (e) {
      console.warn('Gagal memuat pengaturan tema:', e);
    }
    return DEFAULT_THEME_CONFIG;
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Apply on mount and state change
  useEffect(() => {
    applyThemeToDOM(theme);
    console.log(`[GymPro Lifecycle] 2. ThemeProvider active (mode: ${theme.mode}, accent: ${theme.accent})`);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
      console.warn('Gagal menyimpan tema ke localStorage:', e);
    }
  }, [theme]);

  const setMode = (mode: ThemeMode) => {
    setTheme((prev) => ({ ...prev, mode }));
  };

  const setAccent = (accent: AccentColor) => {
    setTheme((prev) => ({ ...prev, accent }));
  };

  const setDensity = (density: ContentDensity) => {
    setTheme((prev) => ({ ...prev, density }));
  };

  const setPattern = (pattern: BackgroundPattern) => {
    setTheme((prev) => ({ ...prev, pattern }));
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME_CONFIG);
  };

  const currentAccent = ACCENT_OPTIONS.find((a) => a.id === theme.accent) || ACCENT_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setMode,
        setAccent,
        setDensity,
        setPattern,
        resetTheme,
        isThemeModalOpen,
        openThemeModal: () => setIsThemeModalOpen(true),
        closeThemeModal: () => setIsThemeModalOpen(false),
        currentAccent
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
