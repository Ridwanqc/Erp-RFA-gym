import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  IdCard,
  UserCheck,
  CalendarDays,
  ShoppingBag,
  Crown,
  Target,
  Users,
  UsersRound,
  BookOpen,
  FileText,
  Lock,
  LogOut,
  X,
  CreditCard,
  CircleDollarSign,
  Activity,
  Award,
  Dumbbell,
  Boxes,
  Gift,
  Wrench,
  Snowflake,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Settings
} from 'lucide-react';
import { User, UserRole } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useTheme } from '../context/ThemeContext';

export type ActiveTab =
  | 'dashboard'
  | 'leader-pt'
  | 'pt-package-performance'
  | 'trainer-portal'
  | 'absen'
  | 'jadwal-pt'
  | 'freeze'
  | 'pos'
  | 'products'
  | 'membership'
  | 'bundling-reports'
  | 'crm'
  | 'master-data'
  | 'inventaris'
  | 'hr-payroll'
  | 'piutang'
  | 'laporan'
  | 'tutup-toko'
  | 'settings'
  | 'settings-printer'
  | 'settings-roles'
  | 'settings-profile'
  | 'settings-finance'
  | 'settings-backup';

interface SubItem {
  id: ActiveTab;
  label: string;
  badge?: number;
  roles: UserRole[];
}

interface NavItem {
  id: ActiveTab | string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: number;
  subItems?: SubItem[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface SidebarProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
  piutangCount?: number;
  freezeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  isCollapsed = false,
  onToggleCollapse,
  isOpenMobile = false,
  onCloseMobile,
  onLogout,
  piutangCount = 0,
  freezeCount = 0
}) => {
  const role: UserRole = currentUser?.role || 'admin';
  const { openThemeModal, currentAccent, theme } = useTheme();

  const canAccess = (requiredRoles: UserRole[]) => {
    return requiredRoles.includes(role);
  };

  // State for expanded submenus in expanded sidebar mode
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    membership: true,
    pt: true,
    pos: true,
    keuangan: true
  });

  // State for active flyout in collapsed desktop mode
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);
  const flyoutTimeoutRef = useRef<any>(null);

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Navigation Items with Support for Submenus
  const navItems: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Dashboard Admin',
          icon: LayoutDashboard,
          roles: ['admin'] as UserRole[]
        },
        {
          id: 'absen' as ActiveTab,
          label: 'Absensi & Presensi',
          icon: UserCheck,
          roles: ['admin', 'kasir', 'leader_pt', 'pt'] as UserRole[]
        }
      ]
    },
    {
      group: 'Membership & Member',
      items: [
        {
          id: 'membership-group',
          label: 'Keanggotaan',
          icon: Crown,
          roles: ['admin', 'kasir', 'leader_pt'] as UserRole[],
          badge: freezeCount > 0 ? freezeCount : undefined,
          subItems: [
            {
              id: 'membership',
              label: 'Paket & Pembelian',
              roles: ['admin', 'kasir']
            },
            {
              id: 'freeze',
              label: 'Freeze & Cuti Member',
              badge: freezeCount > 0 ? freezeCount : undefined,
              roles: ['admin', 'kasir', 'leader_pt']
            },
            {
              id: 'master-data',
              label: 'Direktori Member 360',
              roles: ['admin', 'leader_pt', 'kasir']
            },
            {
              id: 'bundling-reports',
              label: 'Paket Bundling & Komisi',
              roles: ['admin', 'leader_pt', 'kasir']
            },
            {
              id: 'crm',
              label: 'CRM & Leads Kanban',
              roles: ['admin', 'leader_pt', 'kasir']
            }
          ]
        }
      ]
    },
    {
      group: 'Personal Trainer & Kelas',
      items: [
        {
          id: 'pt-group',
          label: 'Personal Training',
          icon: Dumbbell,
          roles: ['admin', 'leader_pt', 'pt'] as UserRole[],
          subItems: [
            {
              id: 'jadwal-pt',
              label: 'Jadwal & Sesi PT',
              roles: ['admin', 'leader_pt', 'pt']
            },
            {
              id: 'trainer-portal',
              label: 'Portal Fokus Trainer',
              roles: ['admin', 'leader_pt', 'pt']
            },
            {
              id: 'pt-package-performance',
              label: 'Performa Trainer × Paket',
              roles: ['admin', 'leader_pt']
            },
            {
              id: 'leader-pt',
              label: 'Dashboard Leader PT',
              roles: ['admin', 'leader_pt']
            }
          ]
        }
      ]
    },
    {
      group: 'Kasir & Retail',
      items: [
        {
          id: 'pos-group',
          label: 'Kasir POS & Produk',
          icon: ShoppingBag,
          roles: ['admin', 'kasir'] as UserRole[],
          subItems: [
            {
              id: 'pos',
              label: 'Kasir POS FnB & Retail',
              roles: ['admin', 'kasir']
            },
            {
              id: 'products',
              label: 'Katalog Produk & Stok',
              roles: ['admin', 'kasir']
            }
          ]
        }
      ]
    },
    {
      group: 'Fasilitas & Aset',
      items: [
        {
          id: 'inventaris' as ActiveTab,
          label: 'Inventaris & Servis Alat',
          icon: Wrench,
          roles: ['admin', 'manager', 'teknisi', 'kasir', 'leader_pt'] as UserRole[]
        }
      ]
    },
    {
      group: 'Keuangan & Kas',
      items: [
        {
          id: 'keuangan-group',
          label: 'Keuangan & Akuntansi',
          icon: CircleDollarSign,
          roles: ['admin', 'kasir'] as UserRole[],
          badge: piutangCount > 0 ? piutangCount : undefined,
          subItems: [
            {
              id: 'piutang',
              label: 'Buku Piutang & Cicilan',
              badge: piutangCount > 0 ? piutangCount : undefined,
              roles: ['admin', 'kasir']
            },
            {
              id: 'laporan',
              label: 'Buku Besar Transaksi',
              roles: ['admin', 'kasir']
            },
            {
              id: 'tutup-toko',
              label: 'Daily Closing Kas',
              roles: ['admin', 'kasir']
            }
          ]
        }
      ]
    },
    {
      group: 'Sumber Daya Manusia',
      items: [
        {
          id: 'hr-payroll' as ActiveTab,
          label: 'HR, Jadwal & Presensi',
          icon: UsersRound,
          roles: ['admin', 'manager', 'leader_pt'] as UserRole[]
        }
      ]
    },
    {
      group: 'Sistem & Konfigurasi',
      items: [
        {
          id: 'settings-group',
          label: 'Pengaturan Sistem',
          icon: Settings,
          roles: ['admin', 'manager', 'kasir'] as UserRole[],
          subItems: [
            {
              id: 'settings-printer',
              label: 'Setting Printer & Struk',
              roles: ['admin', 'manager', 'kasir']
            },
            {
              id: 'settings-roles',
              label: 'Manajemen Role & Akses',
              roles: ['admin', 'manager']
            },
            {
              id: 'settings-profile',
              label: 'Profil Usaha & Cabang',
              roles: ['admin', 'manager']
            },
            {
              id: 'settings-finance',
              label: 'Pajak & Rekening Kas',
              roles: ['admin', 'manager']
            },
            {
              id: 'settings-backup',
              label: 'Backup & Database',
              roles: ['admin']
            },
            {
              id: 'settings',
              label: 'Semua Pengaturan',
              roles: ['admin', 'manager', 'kasir']
            }
          ]
        }
      ]
    }
  ];

  // Auto-expand submenu if activeTab matches any subItem
  useEffect(() => {
    navItems.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems && item.subItems.some((s) => s.id === activeTab)) {
          setOpenSubmenus((prev) => ({
            ...prev,
            [item.id]: true
          }));
        }
      });
    });
  }, [activeTab]);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setActiveFlyout(null);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleMouseEnter = (itemId: string) => {
    if (!isCollapsed) return;
    if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
    setActiveFlyout(itemId);
  };

  const handleMouseLeave = () => {
    if (!isCollapsed) return;
    flyoutTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 200);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        id="app-sidebar"
        className={`bg-[#09090b] border-r border-zinc-800/90 flex flex-col z-40 transition-all duration-300 ease-in-out shrink-0 select-none
          ${/* Mobile Drawer positioning */ ''}
          fixed inset-y-0 left-0 lg:static
          ${isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${/* Desktop Collapsed vs Expanded width */ ''}
          ${isCollapsed ? 'w-72 max-w-[85vw] lg:w-[72px]' : 'w-72 max-w-[85vw] lg:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black italic text-lg tracking-tighter shrink-0">
              R
            </div>
            {/* Show title when not collapsed on desktop, or always on mobile */}
            <div className={`flex flex-col truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <span className="text-sm font-black text-white tracking-wider leading-none">RFA GYM</span>
              <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-1">
                Enterprise ERP
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            className="lg:hidden text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition min-w-[40px] min-h-[40px] flex items-center justify-center"
            onClick={onCloseMobile}
            aria-label="Tutup sidebar"
          >
            <X className="w-5 h-5 text-zinc-300" />
          </button>

          {/* Desktop Toggle Button inside sidebar header (only when expanded) */}
          {onToggleCollapse && !isCollapsed && (
            <button
              type="button"
              className="hidden lg:flex text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
              onClick={onToggleCollapse}
              title="Ciutkan Sidebar"
              aria-label="Ciutkan Sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-zinc-400" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav
          className="flex-1 py-3 px-2 sm:px-3 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-800"
          aria-label="Menu navigasi aplikasi"
        >
          {navItems.map((group, idx) => {
            const visibleItems = group.items.filter((item) => {
              if (item.subItems) {
                return item.subItems.some((s) => canAccess(s.roles));
              }
              return canAccess(item.roles);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {/* Group Heading (Hidden when collapsed on desktop) */}
                <div
                  className={`text-[10px] font-black text-zinc-500 uppercase tracking-wider px-3 mb-1.5 ${
                    isCollapsed ? 'lg:hidden' : 'block'
                  }`}
                >
                  {group.group}
                </div>

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
                  const isSubOpen = Boolean(openSubmenus[item.id]);
                  const isAnyChildActive = hasSubItems && item.subItems?.some((s) => s.id === activeTab);
                  const isItemActive = activeTab === item.id || isAnyChildActive;

                  return (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => handleMouseEnter(item.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Parent Item Button */}
                      <button
                        type="button"
                        id={`nav-${item.id}`}
                        aria-label={item.label}
                        onClick={() => {
                          if (hasSubItems) {
                            if (isCollapsed && window.innerWidth >= 1024) {
                              setActiveFlyout(activeFlyout === item.id ? null : item.id);
                            } else {
                              toggleSubmenu(item.id);
                            }
                          } else {
                            handleSelectTab(item.id as ActiveTab);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] group ${
                          isItemActive && !hasSubItems
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 font-bold'
                            : isItemActive && hasSubItems
                            ? 'bg-zinc-800/90 text-orange-400 font-bold border border-zinc-700/60'
                            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                        } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                              isItemActive && !hasSubItems
                                ? 'text-white'
                                : isItemActive && hasSubItems
                                ? 'text-orange-400'
                                : 'text-zinc-400 group-hover:text-zinc-200'
                            }`}
                          />
                          <span
                            className={`truncate text-left ${
                              isCollapsed ? 'lg:hidden' : 'block'
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>

                        {/* Badges and Submenu Chevron */}
                        <div
                          className={`flex items-center gap-1.5 shrink-0 ${
                            isCollapsed ? 'lg:hidden' : 'flex'
                          }`}
                        >
                          {item.badge !== undefined && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isItemActive && !hasSubItems
                                  ? 'bg-white text-orange-600'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {hasSubItems && (
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                                isSubOpen ? 'rotate-180 text-orange-400' : ''
                              }`}
                            />
                          )}
                        </div>
                      </button>

                      {/* Expanded Submenu Accordion (Desktop Expanded & Mobile) */}
                      {hasSubItems && (
                        <div
                          className={`space-y-1 mt-1 pl-4 pr-1 border-l-2 border-zinc-800/80 ml-5 ${
                            isCollapsed ? 'lg:hidden' : 'block'
                          } ${isSubOpen ? 'block animate-in fade-in duration-150' : 'hidden'}`}
                        >
                          {item.subItems
                            ?.filter((s) => canAccess(s.roles))
                            .map((sub) => {
                              const isSubActive = activeTab === sub.id;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  id={`nav-sub-${sub.id}`}
                                  onClick={() => handleSelectTab(sub.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition min-h-[38px] ${
                                    isSubActive
                                      ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30'
                                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                                  }`}
                                >
                                  <span className="truncate text-left">{sub.label}</span>
                                  {sub.badge !== undefined && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 ml-2">
                                      {sub.badge}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      )}

                      {/* Collapsed Desktop Tooltip & Submenu Flyout */}
                      {isCollapsed && activeFlyout === item.id && (
                        <div
                          className="hidden lg:block absolute left-full top-0 ml-2 z-50 bg-zinc-900 border border-zinc-700/90 rounded-2xl p-2.5 min-w-[220px] shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                          role="menu"
                        >
                          <div className="px-3 py-1.5 border-b border-zinc-800/80 mb-1.5 flex items-center justify-between">
                            <span className="text-xs font-extrabold text-white">{item.label}</span>
                            {item.badge !== undefined && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          {hasSubItems ? (
                            <div className="space-y-1">
                              {item.subItems
                                ?.filter((s) => canAccess(s.roles))
                                .map((sub) => {
                                  const isSubActive = activeTab === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() => handleSelectTab(sub.id)}
                                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition text-left ${
                                        isSubActive
                                          ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20'
                                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                                      }`}
                                    >
                                      <span className="truncate">{sub.label}</span>
                                      {sub.badge !== undefined && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 ml-2">
                                          {sub.badge}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectTab(item.id as ActiveTab)}
                              className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-orange-400 hover:bg-zinc-800"
                            >
                              Buka {item.label}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* PWA App Install Action */}
        <div className="px-3 pt-2 pb-1 border-t border-zinc-800/60 shrink-0">
          <div className={isCollapsed ? 'lg:hidden' : 'block'}>
            <PWAInstallButton variant="sidebar" />
          </div>
          <div className={`hidden ${isCollapsed ? 'lg:flex lg:justify-center' : ''}`}>
            <PWAInstallButton variant="compact" />
          </div>
        </div>

        {/* Theme Settings Quick Action */}
        <div className="px-3 py-1 shrink-0">
          <button
            type="button"
            id="btn-sidebar-theme-toggle"
            onClick={openThemeModal}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/70 border border-transparent hover:border-zinc-800/80 transition active:scale-98 cursor-pointer ${
              isCollapsed ? 'lg:justify-center' : ''
            }`}
            title={`Pengaturan Tema (${theme.mode} • Aksen ${currentAccent.name})`}
            aria-label="Buka Pengaturan Tema"
          >
            <div className="relative shrink-0">
              <Palette className="w-4 h-4 text-orange-400" />
              <span
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-zinc-950"
                style={{ backgroundColor: currentAccent.hex }}
              />
            </div>
            <span className={`text-xs font-bold truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              Setting Tema
            </span>
          </button>
        </div>

        {/* Sidebar Footer: User Profile Card & Quick Logout */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/40 shrink-0">
          <div
            className={`flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/70 transition group ${
              isCollapsed ? 'lg:justify-center lg:p-1' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={
                  currentUser?.photo ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
                }
                alt={currentUser?.name || 'User'}
                className="w-9 h-9 rounded-xl object-cover border border-zinc-700 shrink-0"
              />
              <div className={`truncate ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {currentUser?.name || 'Guest'}
                </p>
                <p className="text-[10px] text-orange-400 uppercase font-medium mt-0.5 truncate">
                  {currentUser?.roleName || 'Staff'}
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                id="btn-sidebar-logout"
                title="Logout dari akun"
                onClick={() => onLogout?.()}
                className={`text-zinc-500 hover:text-rose-400 p-2 rounded-lg transition min-w-[36px] min-h-[36px] flex items-center justify-center ${
                  isCollapsed ? 'lg:hidden' : 'flex'
                }`}
                aria-label="Logout dari sesi akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
