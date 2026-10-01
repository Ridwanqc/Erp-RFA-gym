/**
 * Member Pass Dynamic Background Configuration
 * Allows Admins to customize and swap background designs dynamically
 * without modifying any application code.
 */

export interface PassBackgroundConfig {
  type: 'default' | 'preset' | 'custom_image' | 'gradient';
  presetId?: string;
  customImageUrl?: string;
  customImageName?: string;
  opacity: number; // 0.1 - 1.0
  darkOverlay: number; // 0 - 90 (%)
  showArmorPanels: boolean;
  showHexMesh: boolean;
  backgroundColor: string;
  blendMode: 'normal' | 'multiply' | 'overlay' | 'screen' | 'luminosity';
}

export interface BackgroundPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  previewColor: string;
  backgroundStyle: string; // CSS background value or SVG data URL
}

export const PRESET_BACKGROUND_TEMPLATES: BackgroundPreset[] = [
  {
    id: 'cyber_armor',
    name: 'Cyber Armor Titanium RFA (Official Default)',
    description: 'Desain template resmi RFA GYM: Matte titanium, microchip cerdas, guilloche rosette, beveled 3D armor & speed slashes',
    category: 'Official Default',
    previewColor: '#f95700',
    backgroundStyle: "url('/assets/rfa-card-default-bg.svg') center / cover no-repeat"
  },
  {
    id: 'obsidian_gold',
    name: 'Royal Obsidian 24K Gold (VIP Premium)',
    description: 'Edisi kartu sultan eksekutif dengan smart chip emas 24K, guilloche rosette, dan emblem hot-stamp',
    category: 'Ultra Premium',
    previewColor: '#eab308',
    backgroundStyle: "url('/assets/rfa-card-obsidian-gold.svg') center / cover no-repeat"
  },
  {
    id: 'platinum_titanium',
    name: 'Platinum Titanium Elite (Executive)',
    description: 'Bahan titanium kedirgantaraan modern, microchip perak, dan diamond lattice minimalis berkelas',
    category: 'Ultra Premium',
    previewColor: '#e2e8f0',
    backgroundStyle: "url('/assets/rfa-card-platinum-titanium.svg') center / cover no-repeat"
  },
  {
    id: 'carbon_fiber',
    name: 'Carbon Fiber Weave',
    description: 'Tekstur anyaman serat karbon motorsport premium tahan banting',
    category: 'Sport',
    previewColor: '#38bdf8',
    backgroundStyle: `
      radial-gradient(black 15%, transparent 16%) 0 0,
      radial-gradient(black 15%, transparent 16%) 8px 8px,
      radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 0 1px,
      radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 8px 9px,
      #131519
    `
  },
  {
    id: 'iron_gym_mesh',
    name: 'Heavy Iron Steel Mesh',
    description: 'Pola perforated plate baja kokoh khas ruang beban fitness pro',
    category: 'Fitness',
    previewColor: '#10b981',
    backgroundStyle: `
      radial-gradient(circle, #27272a 20%, transparent 20%) 0 0 / 12px 12px,
      radial-gradient(circle, #27272a 20%, transparent 20%) 6px 6px / 12px 12px,
      linear-gradient(180deg, #18181b 0%, #09090b 100%)
    `
  },
  {
    id: 'dark_gold_marble',
    name: 'Dark Obsidian & Gold Luxury',
    description: 'Gradasi mewah marmer hitam dengan aura kemewahan VIP member',
    category: 'VIP Luxury',
    previewColor: '#eab308',
    backgroundStyle: `
      radial-gradient(circle at 80% 20%, rgba(234, 179, 8, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 20% 80%, rgba(202, 138, 4, 0.12) 0%, transparent 50%),
      linear-gradient(145deg, #12100e 0%, #1c1917 50%, #0c0a09 100%)
    `
  },
  {
    id: 'neon_cyber_grid',
    name: 'Neon Laser Grid Matrix',
    description: 'Garis grid geometris futuristik dengan pencahayaan neon digital',
    category: 'Cyberpunk',
    previewColor: '#06b6d4',
    backgroundStyle: `
      linear-gradient(to right, rgba(6, 182, 212, 0.08) 1px, transparent 1px) 0 0 / 24px 24px,
      linear-gradient(to bottom, rgba(6, 182, 212, 0.08) 1px, transparent 1px) 0 0 / 24px 24px,
      radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 70%),
      #090d16
    `
  },
  {
    id: 'crimson_beast',
    name: 'Crimson Power Beast',
    description: 'Energi tinggi membakar kalori dengan gradasi merah padam atletis',
    category: 'Power',
    previewColor: '#ef4444',
    backgroundStyle: `
      radial-gradient(circle at 100% 0%, rgba(239, 68, 68, 0.25) 0%, transparent 55%),
      radial-gradient(circle at 0% 100%, rgba(185, 28, 28, 0.2) 0%, transparent 55%),
      linear-gradient(160deg, #180909 0%, #0d0404 100%)
    `
  },
  {
    id: 'stealth_obsidian',
    name: 'Minimalist Stealth Matte',
    description: 'Gaya monokrom minimalis bersih, fokus pada kontras barcode & teks',
    category: 'Minimalist',
    previewColor: '#a1a1aa',
    backgroundStyle: 'linear-gradient(180deg, #121214 0%, #09090b 100%)'
  }
];

export const DEFAULT_PASS_BACKGROUND_CONFIG: PassBackgroundConfig = {
  type: 'default',
  presetId: 'cyber_armor',
  customImageUrl: '/assets/rfa-card-default-bg.svg',
  customImageName: 'Professional Company ID Card.png (Default Resmi RFA)',
  opacity: 1.0,
  darkOverlay: 0,
  showArmorPanels: false,
  showHexMesh: false,
  backgroundColor: '#0a0b0e',
  blendMode: 'normal'
};

const STORAGE_KEY = 'rfa_member_pass_background_config';
export const PASS_BG_UPDATE_EVENT = 'rfa_pass_background_updated';

// In-memory fallback storage for non-browser / test environments
const memoryStorage: Record<string, string> = {};

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key: string) => memoryStorage[key] || null,
    setItem: (key: string, val: string) => {
      memoryStorage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      for (const k in memoryStorage) delete memoryStorage[k];
    }
  };
}

/**
 * Load persisted background configuration
 */
export function getPassBackgroundConfig(): PassBackgroundConfig {
  try {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PASS_BACKGROUND_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PASS_BACKGROUND_CONFIG, ...parsed };
  } catch (err) {
    console.warn('[PassConfig] Error loading background configuration:', err);
    return { ...DEFAULT_PASS_BACKGROUND_CONFIG };
  }
}

/**
 * Save background configuration and dispatch broadcast event
 */
export function savePassBackgroundConfig(config: PassBackgroundConfig): void {
  try {
    const storage = getStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Broadcast change if in browser
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(PASS_BG_UPDATE_EVENT, { detail: config }));
    }
  } catch (err) {
    console.error('[PassConfig] Error saving background configuration:', err);
  }
}

/**
 * Reset to default official RFA background design
 */
export function resetPassBackgroundConfig(): PassBackgroundConfig {
  savePassBackgroundConfig(DEFAULT_PASS_BACKGROUND_CONFIG);
  return { ...DEFAULT_PASS_BACKGROUND_CONFIG };
}
