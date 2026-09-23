import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SystemSettings,
  PrinterConfig,
  GymBusinessProfile,
  PaymentAndTaxConfig,
  WhatsAppTemplateConfig,
  RoleDefinition,
  RoleActionPermissions,
  UserRole
} from '../types';
import {
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_PRINTER_CONFIG,
  DEFAULT_GYM_PROFILE,
  DEFAULT_PAYMENT_AND_TAX,
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_ROLE_DEFINITIONS,
  SYSTEM_MODULES
} from '../data/settingsData';

const SETTINGS_STORAGE_KEY = 'gympro_system_settings';
const ROLES_STORAGE_KEY = 'gympro_role_definitions';

interface SettingsContextType {
  settings: SystemSettings;
  roles: Record<UserRole, RoleDefinition>;
  updatePrinterConfig: (newPrinter: Partial<PrinterConfig>) => void;
  updateProfileConfig: (newProfile: Partial<GymBusinessProfile>) => void;
  updatePaymentAndTaxConfig: (newConfig: Partial<PaymentAndTaxConfig>) => void;
  updateTemplatesConfig: (newTemplates: Partial<WhatsAppTemplateConfig>) => void;
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
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load System Settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          printer: { ...DEFAULT_PRINTER_CONFIG, ...parsed.printer },
          profile: { ...DEFAULT_GYM_PROFILE, ...parsed.profile },
          paymentAndTax: { ...DEFAULT_PAYMENT_AND_TAX, ...parsed.paymentAndTax },
          templates: { ...DEFAULT_WHATSAPP_TEMPLATES, ...parsed.templates },
          updatedAt: parsed.updatedAt || new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Gagal memuat system settings dari storage:', e);
    }
    return DEFAULT_SYSTEM_SETTINGS;
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
    const widthStyle = printer.paperWidth === '58mm' ? 'max-width: 58mm;' : 'max-width: 80mm;';

    const printWindow = window.open('', '_blank', 'width=450,height=650');
    if (!printWindow) {
      alert('Pop-up terblokir oleh browser. Izinkan pop-up untuk mencetak struk thermal uji coba.');
      return;
    }

    const testContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Print Struk - ${printer.storeName}</title>
          <style>
            @page {
              margin: 0;
              size: ${printer.paperWidth === '58mm' ? '58mm auto' : '80mm auto'};
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: ${printer.paperWidth === '58mm' ? '11px' : '13px'};
              line-height: 1.35;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 10px 8px;
              ${widthStyle}
              margin-left: auto;
              margin-right: auto;
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
            ${printer.headerNote}
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
            <span>Ukuran Kertas:</span>
            <span class="bold">${printer.paperWidth.toUpperCase()}</span>
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
          ${printer.autoCutPaper ? '<div style="margin-top: 24px; text-align: center; font-size: 8px;">[Auto Cut Position]</div>' : ''}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(testContent);
    printWindow.document.close();
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        roles,
        updatePrinterConfig,
        updateProfileConfig,
        updatePaymentAndTaxConfig,
        updateTemplatesConfig,
        updateRolePermission,
        resetRolePermissionsToDefault,
        resetSettingsToDefault,
        hasPermission,
        executeTestPrint
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
