import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SystemSettings,
  PrinterConfig,
  GymBusinessProfile,
  GymBranch,
  PaymentAndTaxConfig,
  WhatsAppTemplateConfig,
  RoleDefinition,
  RoleActionPermissions,
  PicProtectionConfig,
  UserRole,
  User,
  StockTransferRecord,
  ALL_BRANCHES_ID
} from '../types';
import {
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_PRINTER_CONFIG,
  DEFAULT_GYM_PROFILE,
  DEFAULT_BRANCHES,
  DEFAULT_PAYMENT_AND_TAX,
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_PIC_PROTECTION,
  DEFAULT_ROLE_DEFINITIONS,
  SYSTEM_MODULES
} from '../data/settingsData';
import {
  saveBranchToFirestore,
  deleteBranchFromFirestore,
  subscribeBranches
} from '../lib/firestoreService';
import { auth, onAuthStateChanged } from '../lib/firebase';

const SETTINGS_STORAGE_KEY = 'gympro_system_settings';
const ROLES_STORAGE_KEY = 'gympro_role_definitions';
const BRANCHES_STORAGE_KEY = 'gympro_branches';
const ACTIVE_BRANCH_STORAGE_KEY = 'gympro_active_branch_id';
const STOCK_TRANSFERS_STORAGE_KEY = 'gympro_stock_transfers';

interface SettingsContextType {
  settings: SystemSettings;
  roles: Record<UserRole, RoleDefinition>;
  branches: GymBranch[];
  activeBranchId: string;
  activeBranch: GymBranch;
  isAllBranches: boolean;
  updatePrinterConfig: (newPrinter: Partial<PrinterConfig>) => void;
  updateProfileConfig: (newProfile: Partial<GymBusinessProfile>) => void;
  updatePaymentAndTaxConfig: (newConfig: Partial<PaymentAndTaxConfig>) => void;
  updateTemplatesConfig: (newTemplates: Partial<WhatsAppTemplateConfig>) => void;
  updatePicProtectionConfig: (newConfig: Partial<PicProtectionConfig>) => void;
  verifyPicPassword: (inputPassword: string) => boolean;
  updateRolePermission: (
    role: UserRole,
    moduleId: string,
    action: keyof RoleActionPermissions,
    value: boolean
  ) => void;
  resetRolePermissionsToDefault: (role?: UserRole) => void;
  resetSettingsToDefault: () => void;
  hasPermission: (
    userRole: UserRole | undefined,
    moduleId: string,
    action?: keyof RoleActionPermissions
  ) => boolean;
  executeTestPrint: () => void;
  // Multi-branch actions
  addBranch: (newBranch: Omit<GymBranch, 'id' | 'createdAt'> & { id?: string }) => GymBranch;
  updateBranch: (id: string, updatedData: Partial<GymBranch>) => void;
  deleteBranch: (id: string) => { success: boolean; message: string };
  setActiveBranchId: (id: string) => void;
  setMainBranch: (id: string) => void;
  filterByBranch: <T extends { branchId?: string }>(items: T[], customBranchId?: string) => T[];
  canUserAccessBranch: (user: User | null, targetBranchId: string) => boolean;
  stockTransfers: StockTransferRecord[];
  recordStockTransfer: (transfer: Omit<StockTransferRecord, 'id' | 'createdAt'>) => StockTransferRecord;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load System Settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isLegacyProfile = !parsed.profile?.gymName || parsed.profile?.gymName === 'GymPro Fitness & Wellness Center';
        const isLegacyPrinter = !parsed.printer?.storeName || parsed.printer?.storeName === 'GYMPRO FITNESS & WELLNESS';

        return {
          printer: isLegacyPrinter ? DEFAULT_PRINTER_CONFIG : { ...DEFAULT_PRINTER_CONFIG, ...parsed.printer },
          profile: isLegacyProfile ? DEFAULT_GYM_PROFILE : { ...DEFAULT_GYM_PROFILE, ...parsed.profile },
          paymentAndTax: { ...DEFAULT_PAYMENT_AND_TAX, ...parsed.paymentAndTax },
          templates: { ...DEFAULT_WHATSAPP_TEMPLATES, ...parsed.templates },
          picProtection: { ...DEFAULT_PIC_PROTECTION, ...parsed.picProtection },
          updatedAt: parsed.updatedAt || new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Gagal memuat system settings dari storage:', e);
    }
    return DEFAULT_SYSTEM_SETTINGS;
  });

  // Load Branches
  const [branches, setBranches] = useState<GymBranch[]>(() => {
    try {
      const saved = localStorage.getItem(BRANCHES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((b: GymBranch) => {
            if (b.id === 'BR-001' && (b.name?.includes('Sudirman') || b.address?.includes('Sudirman') || b.address?.includes('Boulevard'))) {
              return {
                ...b,
                name: DEFAULT_BRANCHES[0].name,
                code: DEFAULT_BRANCHES[0].code,
                address: DEFAULT_BRANCHES[0].address,
                city: DEFAULT_BRANCHES[0].city,
                phone: DEFAULT_BRANCHES[0].phone,
                whatsapp: DEFAULT_BRANCHES[0].whatsapp,
                email: DEFAULT_BRANCHES[0].email,
                notes: DEFAULT_BRANCHES[0].notes
              };
            }
            return b;
          });
        }
      }
    } catch (e) {
      console.warn('Gagal memuat cabang dari storage:', e);
    }
    return DEFAULT_BRANCHES;
  });

  // Load Active Branch ID
  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY);
      if (saved) {
        return saved;
      }
    } catch (e) {}
    return 'BR-001';
  });

  // Load Role Definitions
  const [roles, setRoles] = useState<Record<UserRole, RoleDefinition>>(() => {
    try {
      const saved = localStorage.getItem(ROLES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_ROLE_DEFINITIONS, ...parsed };
      }
    } catch (e) {
      console.warn('Gagal memuat roles dari storage:', e);
    }
    return DEFAULT_ROLE_DEFINITIONS;
  });

  // Load Stock Transfers
  const [stockTransfers, setStockTransfers] = useState<StockTransferRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STOCK_TRANSFERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'TRF-20260915-001',
        date: '2026-09-15',
        productId: 'P03',
        productName: 'Whey Protein Isolate Sachet',
        fromBranchId: 'BR-001',
        fromBranchName: 'GymPro Flagship Kelapa Gading',
        toBranchId: 'BR-002',
        toBranchName: 'GymPro Hub Senopati Lifestyle',
        quantity: 10,
        transferredBy: 'Budi Santoso (Admin)',
        notes: 'Penyeimbangan stok suplemen untuk member Senopati',
        status: 'COMPLETED',
        createdAt: '2026-09-15T10:30:00Z'
      }
    ];
  });

  // Persist Stock Transfers
  useEffect(() => {
    try {
      localStorage.setItem(STOCK_TRANSFERS_STORAGE_KEY, JSON.stringify(stockTransfers));
    } catch (e) {
      console.warn('Gagal menyimpan mutasi stok:', e);
    }
  }, [stockTransfers]);

  // Persist Settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Gagal menyimpan settings:', e);
    }
  }, [settings]);

  // Persist Roles
  useEffect(() => {
    try {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
    } catch (e) {
      console.warn('Gagal menyimpan roles:', e);
    }
  }, [roles]);

  // Persist Branches
  useEffect(() => {
    try {
      localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(branches));
    } catch (e) {
      console.warn('Gagal menyimpan branches:', e);
    }
  }, [branches]);

  // Subscribe to Branches in Firestore if user is authenticated
  useEffect(() => {
    let unsubscribeBranchListener: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        try {
          unsubscribeBranchListener = subscribeBranches((cloudBranches) => {
            if (cloudBranches && cloudBranches.length > 0) {
              setBranches((prev) => {
                const map = new Map(prev.map((b) => [b.id, b]));
                cloudBranches.forEach((cb) => map.set(cb.id, { ...map.get(cb.id), ...cb }));
                return Array.from(map.values());
              });
            }
          });
        } catch (e) {
          console.warn('Branches subscription error:', e);
        }
      } else if (unsubscribeBranchListener) {
        unsubscribeBranchListener();
        unsubscribeBranchListener = undefined;
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribeBranchListener) unsubscribeBranchListener();
    };
  }, []);

  // Persist Active Branch ID
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, activeBranchId);
    } catch (e) {
      console.warn('Gagal menyimpan active branch id:', e);
    }
  }, [activeBranchId]);

  // Consolidated Holding virtual branch object
  const ALL_BRANCHES_OBJECT: GymBranch = {
    id: ALL_BRANCHES_ID,
    name: 'Semua Cabang (Konsolidasi Pusat)',
    code: 'ALL',
    address: 'Seluruh Outlet & Cabang Terpadu GymPro',
    city: 'Konsolidasi Multi-Unit',
    phone: 'Pusat Operasional Holding',
    whatsapp: '-',
    email: 'hq@gympro.id',
    openHoursWeekday: '05:30 - 22:30 WIB',
    openHoursWeekend: '06:30 - 21:00 WIB',
    status: 'Aktif',
    isMainBranch: false,
    facilities: ['Multi-Branch Centralized ERP', 'Konsolidasi Laporan Laba Rugi', 'Sentralisasi Member & Aset'],
    createdAt: '2024-01-01',
    notes: 'Mode Konsolidasi Seluruh Outlet Gym'
  };

  const isAllBranches = activeBranchId === ALL_BRANCHES_ID;

  // Current active branch object
  const activeBranch: GymBranch =
    activeBranchId === ALL_BRANCHES_ID
      ? ALL_BRANCHES_OBJECT
      : branches.find((b) => b.id === activeBranchId) || branches[0] || DEFAULT_BRANCHES[0];

  const setActiveBranchId = (id: string) => {
    if (id === ALL_BRANCHES_ID) {
      setActiveBranchIdState(ALL_BRANCHES_ID);
      setSettings((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          branchName: ALL_BRANCHES_OBJECT.name,
          address: ALL_BRANCHES_OBJECT.address,
          city: ALL_BRANCHES_OBJECT.city
        },
        printer: {
          ...prev.printer,
          storeAddress: ALL_BRANCHES_OBJECT.address,
          storeCity: ALL_BRANCHES_OBJECT.city
        },
        updatedAt: new Date().toISOString()
      }));
      return;
    }

    const targetBranch = branches.find((b) => b.id === id);
    if (!targetBranch) return;

    setActiveBranchIdState(id);
    // Keep gym profile and POS receipt in sync with active branch
    setSettings((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        branchName: targetBranch.name,
        address: targetBranch.address,
        city: targetBranch.city,
        phone: targetBranch.phone,
        whatsapp: targetBranch.whatsapp,
        email: targetBranch.email,
        openHoursWeekday: targetBranch.openHoursWeekday,
        openHoursWeekend: targetBranch.openHoursWeekend
      },
      printer: {
        ...prev.printer,
        storeAddress: targetBranch.address,
        storeCity: targetBranch.city,
        storePhone: targetBranch.phone
      },
      updatedAt: new Date().toISOString()
    }));
  };

  const addBranch = (newBranchData: Omit<GymBranch, 'id' | 'createdAt'> & { id?: string }): GymBranch => {
    const nextNumber = branches.length + 1;
    const generatedId = newBranchData.id || `BR-${String(nextNumber).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const branchToCreate: GymBranch = {
      ...newBranchData,
      id: generatedId,
      createdAt: todayStr,
      facilities: newBranchData.facilities || ['Locker Room', 'Cardio Area', 'Free Weights'],
      capacity: newBranchData.capacity || 100,
      totalMembers: newBranchData.totalMembers || 0,
      status: newBranchData.status || 'Aktif',
      isMainBranch: Boolean(newBranchData.isMainBranch)
    };

    setBranches((prev) => {
      let updated = [...prev];
      if (branchToCreate.isMainBranch) {
        updated = updated.map((b) => ({ ...b, isMainBranch: false }));
      }
      return [...updated, branchToCreate];
    });

    // Cloud Firestore synchronization (non-blocking)
    saveBranchToFirestore(branchToCreate).catch((err) => {
      console.warn('Cloud save branch notice:', err);
    });

    return branchToCreate;
  };

  const updateBranch = (id: string, updatedData: Partial<GymBranch>) => {
    let fullUpdatedBranch: GymBranch | undefined;
    setBranches((prev) => {
      let updated = prev.map((b) => {
        if (b.id === id) {
          fullUpdatedBranch = { ...b, ...updatedData };
          return fullUpdatedBranch;
        }
        if (updatedData.isMainBranch) {
          return { ...b, isMainBranch: false };
        }
        return b;
      });
      return updated;
    });

    if (fullUpdatedBranch) {
      saveBranchToFirestore(fullUpdatedBranch).catch((err) => {
        console.warn('Cloud update branch notice:', err);
      });
    }

    // If active branch was updated, sync profile
    if (id === activeBranchId) {
      setSettings((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...(updatedData.name ? { branchName: updatedData.name } : {}),
          ...(updatedData.address ? { address: updatedData.address } : {}),
          ...(updatedData.city ? { city: updatedData.city } : {}),
          ...(updatedData.phone ? { phone: updatedData.phone } : {}),
          ...(updatedData.whatsapp ? { whatsapp: updatedData.whatsapp } : {}),
          ...(updatedData.email ? { email: updatedData.email } : {}),
          ...(updatedData.openHoursWeekday ? { openHoursWeekday: updatedData.openHoursWeekday } : {}),
          ...(updatedData.openHoursWeekend ? { openHoursWeekend: updatedData.openHoursWeekend } : {})
        },
        printer: {
          ...prev.printer,
          ...(updatedData.address ? { storeAddress: updatedData.address } : {}),
          ...(updatedData.city ? { storeCity: updatedData.city } : {}),
          ...(updatedData.phone ? { storePhone: updatedData.phone } : {})
        },
        updatedAt: new Date().toISOString()
      }));
    }
  };

  const deleteBranch = (id: string): { success: boolean; message: string } => {
    if (branches.length <= 1) {
      return {
        success: false,
        message: 'Tidak dapat menghapus cabang terakhir. Sistem membutuhkan minimal satu cabang operasional.'
      };
    }

    const target = branches.find((b) => b.id === id);
    if (target?.isMainBranch) {
      return {
        success: false,
        message: 'Cabang Utama tidak dapat dihapus langsung. Tetapkan cabang lain sebagai Cabang Utama terlebih dahulu.'
      };
    }

    const remaining = branches.filter((b) => b.id !== id);
    setBranches(remaining);

    // Delete from Firestore (non-blocking)
    deleteBranchFromFirestore(id).catch((err) => {
      console.warn('Cloud delete branch notice:', err);
    });

    if (activeBranchId === id) {
      const nextActiveId = remaining[0]?.id || 'BR-001';
      setActiveBranchId(nextActiveId);
    }

    return {
      success: true,
      message: `Cabang ${target?.name || id} berhasil dihapus dari sistem.`
    };
  };

  const setMainBranch = (id: string) => {
    setBranches((prev) =>
      prev.map((b) => ({
        ...b,
        isMainBranch: b.id === id
      }))
    );
  };

  const filterByBranch = <T extends { branchId?: string }>(items: T[], customBranchId?: string): T[] => {
    const targetId = customBranchId !== undefined ? customBranchId : activeBranchId;
    if (targetId === ALL_BRANCHES_ID) return items;
    return items.filter((item) => item.branchId === targetId || (!item.branchId && targetId === 'BR-001'));
  };

  const canUserAccessBranch = (user: User | null, targetBranchId: string): boolean => {
    if (!user) return true;
    // Hanya Super Admin (Admin Utama) yang memiliki hak akses lintas cabang dan konsolidasi pusat
    if (user.role === 'admin') return true;
    // Semua peran selain Admin Utama TIDAK BISA mengakses holding / semua cabang
    if (targetBranchId === ALL_BRANCHES_ID) return false;
    // Terkunci strictly pada unit cabang yang ditugaskan
    const userBranch = user.branchId || 'BR-001';
    return targetBranchId === userBranch || Boolean(user.allowedBranchIds && user.allowedBranchIds.includes(targetBranchId));
  };

  const recordStockTransfer = (transferData: Omit<StockTransferRecord, 'id' | 'createdAt'>): StockTransferRecord => {
    const nextNumber = stockTransfers.length + 1;
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: StockTransferRecord = {
      ...transferData,
      id: `TRF-${todayStr.replace(/-/g, '')}-${String(nextNumber).padStart(3, '0')}`,
      createdAt: new Date().toISOString()
    };
    setStockTransfers((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const updatePrinterConfig = (newPrinter: Partial<PrinterConfig>) => {
    setSettings((prev) => ({
      ...prev,
      printer: { ...prev.printer, ...newPrinter },
      updatedAt: new Date().toISOString()
    }));
  };

  const updateProfileConfig = (newProfile: Partial<GymBusinessProfile>) => {
    setSettings((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...newProfile },
      updatedAt: new Date().toISOString()
    }));
  };

  const updatePaymentAndTaxConfig = (newConfig: Partial<PaymentAndTaxConfig>) => {
    setSettings((prev) => ({
      ...prev,
      paymentAndTax: { ...prev.paymentAndTax, ...newConfig },
      updatedAt: new Date().toISOString()
    }));
  };

  const updateTemplatesConfig = (newTemplates: Partial<WhatsAppTemplateConfig>) => {
    setSettings((prev) => ({
      ...prev,
      templates: { ...prev.templates, ...newTemplates },
      updatedAt: new Date().toISOString()
    }));
  };

  const updatePicProtectionConfig = (newConfig: Partial<PicProtectionConfig>) => {
    setSettings((prev) => ({
      ...prev,
      picProtection: {
        ...(prev.picProtection || DEFAULT_PIC_PROTECTION),
        ...newConfig
      },
      updatedAt: new Date().toISOString()
    }));
  };

  const verifyPicPassword = (inputPassword: string): boolean => {
    const activePass = settings.picProtection?.picChangePassword ?? DEFAULT_PIC_PROTECTION.picChangePassword;
    return inputPassword.trim() === activePass.trim();
  };

  const updateRolePermission = (
    role: UserRole,
    moduleId: string,
    action: keyof RoleActionPermissions,
    value: boolean
  ) => {
    setRoles((prev) => {
      const roleDef = prev[role] || DEFAULT_ROLE_DEFINITIONS[role];
      const currentModulePerms = roleDef.permissions[moduleId] || {
        view: false,
        create: false,
        edit: false,
        delete: false,
        voidRefund: false,
        export: false
      };

      return {
        ...prev,
        [role]: {
          ...roleDef,
          permissions: {
            ...roleDef.permissions,
            [moduleId]: {
              ...currentModulePerms,
              [action]: value
            }
          }
        }
      };
    });
  };

  const resetRolePermissionsToDefault = (role?: UserRole) => {
    if (role) {
      setRoles((prev) => ({
        ...prev,
        [role]: DEFAULT_ROLE_DEFINITIONS[role]
      }));
    } else {
      setRoles(DEFAULT_ROLE_DEFINITIONS);
    }
  };

  const resetSettingsToDefault = () => {
    setSettings(DEFAULT_SYSTEM_SETTINGS);
  };

  const hasPermission = (
    userRole: UserRole | undefined,
    moduleId: string,
    action: keyof RoleActionPermissions = 'view'
  ): boolean => {
    if (!userRole) return false;
    if (userRole === 'admin') return true; // Super admin always has access
    const roleDef = roles[userRole];
    if (!roleDef) return false;
    const modPerm = roleDef.permissions[moduleId];
    if (!modPerm) return false;
    return Boolean(modPerm[action]);
  };

  const executeTestPrint = () => {
    const printer = settings.printer;
    const isThermal58 = printer.paperWidth === '58mm';
    const isThermal80 = printer.paperWidth === '80mm';
    const isLetter = (printer.paperWidth as any) === 'letter';

    const pageSize = isThermal58
      ? '58mm auto'
      : isThermal80
      ? '80mm auto'
      : isLetter
      ? 'letter portrait'
      : 'A4 portrait';

    const widthStyle = isThermal58
      ? 'max-width: 52mm; font-size: 11px;'
      : isThermal80
      ? 'max-width: 74mm; font-size: 12.5px;'
      : 'max-width: 185mm; font-size: 13px;';

    const pageMargin = isThermal58 || isThermal80 ? '0' : '10mm 15mm';

    let iframe = document.getElementById('silent-test-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'silent-test-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const testContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Print Struk - ${printer.storeName}</title>
          <style>
            @page {
              margin: ${pageMargin};
              size: ${pageSize};
            }
            body {
              font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
              line-height: 1.35;
              color: #000;
              background: #fff;
              margin: 0;
              padding: ${isThermal58 || isThermal80 ? '8px 4px' : '20px 24px'};
              ${widthStyle}
              margin-left: auto;
              margin-right: auto;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .dashed { border-bottom: 1px dashed #000; margin: 8px 0; }
            .flex-between { display: flex; justify-content: space-between; }
            .logo-box {
              width: 32px; height: 32px; border: 2px solid #000;
              margin: 0 auto 4px auto; font-size: 16px; font-weight: bold;
              display: flex; align-items: center; justify-content: center;
            }
          </style>
        </head>
        <body>
          <div class="text-center">
            ${printer.showLogo ? '<div class="logo-box">R</div>' : ''}
            <div class="bold" style="font-size: 14px;">${printer.storeName}</div>
            <div style="font-size: 10px;">${printer.storeTagline}</div>
            <div>${printer.storeAddress}</div>
            <div>${printer.storeCity} • Telp: ${printer.storePhone}</div>
          </div>

          <div class="dashed"></div>

          <div class="text-center bold" style="font-size: 11px;">
            ${printer.headerNote || 'STRUK UJI COBA PRINTER RESMI'}
          </div>

          <div class="dashed"></div>

          <div class="flex-between">
            <span>Tgl/Waktu:</span>
            <span>${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</span>
          </div>
          <div class="flex-between">
            <span>No. Struk:</span>
            <span class="bold">TRX-TEST-001</span>
          </div>
          ${printer.showCashierName ? `
          <div class="flex-between">
            <span>Kasir / Operator:</span>
            <span>Administrator (Test Mode)</span>
          </div>` : ''}
          <div class="flex-between">
            <span>Target Printer:</span>
            <span class="bold">${isThermal58 ? 'Thermal Roll 58mm' : isThermal80 ? 'Thermal Roll 80mm' : isLetter ? 'Standar Letter' : 'Standar A4 (Inkjet/Laser)'}</span>
          </div>
          <div class="flex-between">
            <span>Mode Koneksi:</span>
            <span>${printer.connectionType.toUpperCase()}</span>
          </div>

          <div class="dashed"></div>

          <div class="bold flex-between">
            <span>ITEM TRANSAKSI</span>
            <span>TOTAL</span>
          </div>
          <div class="dashed"></div>

          <div class="flex-between">
            <span>1x Membership VIP (1 Bulan)</span>
            <span>Rp 450.000</span>
          </div>
          <div class="flex-between">
            <span>2x Whey Protein Isolate RTD</span>
            <span>Rp 70.000</span>
          </div>
          <div class="flex-between">
            <span>1x Sewa Loker Gym Premium</span>
            <span>Rp 50.000</span>
          </div>

          <div class="dashed"></div>

          <div class="flex-between">
            <span>Subtotal:</span>
            <span>Rp 570.000</span>
          </div>
          <div class="flex-between">
            <span>Diskon Promosi:</span>
            <span>- Rp 20.000</span>
          </div>
          <div class="flex-between bold" style="font-size: 14px; margin-top: 4px;">
            <span>TOTAL BAYAR:</span>
            <span>Rp 550.000</span>
          </div>
          <div class="flex-between">
            <span>Metode:</span>
            <span class="bold">TUNAI / CASH</span>
          </div>
          <div class="flex-between">
            <span>Uang Diterima:</span>
            <span>Rp 600.000</span>
          </div>
          <div class="flex-between">
            <span>Kembalian:</span>
            <span>Rp 50.000</span>
          </div>

          <div class="dashed"></div>

          ${printer.showBarcode ? `
          <div class="text-center" style="margin: 8px 0;">
            <div style="letter-spacing: 4px; font-weight: bold; font-size: 14px;">|||| | ||||| || |||||| |</div>
            <div style="font-size: 9px;">*TRX-TEST-001*</div>
          </div>
          ` : ''}

          <div class="text-center" style="font-size: 10px; margin-top: 6px;">
            ${printer.footerNote}
          </div>

          <div class="text-center bold" style="font-size: 9px; margin-top: 8px;">
            *** PRINTER TEST BERHASIL ***
          </div>
          ${printer.autoCutPaper && (isThermal58 || isThermal80) ? '<div style="margin-top: 24px; text-align: center; font-size: 8px;">[Auto Cut Position]</div>' : ''}
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(testContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 200);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        roles,
        branches,
        activeBranchId,
        activeBranch,
        isAllBranches,
        updatePrinterConfig,
        updateProfileConfig,
        updatePaymentAndTaxConfig,
        updateTemplatesConfig,
        updatePicProtectionConfig,
        verifyPicPassword,
        updateRolePermission,
        resetRolePermissionsToDefault,
        resetSettingsToDefault,
        hasPermission,
        executeTestPrint,
        addBranch,
        updateBranch,
        deleteBranch,
        setActiveBranchId,
        setMainBranch,
        filterByBranch,
        canUserAccessBranch,
        stockTransfers,
        recordStockTransfer
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
