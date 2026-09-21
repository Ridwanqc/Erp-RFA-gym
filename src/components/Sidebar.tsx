import React from 'react';
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
  Snowflake
} from 'lucide-react';
import { User, UserRole } from '../types';

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
  | 'tutup-toko';

interface SidebarProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen?: boolean;
  isOpenMobile?: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
  onLogout?: () => void;
  piutangCount?: number;
  freezeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  isOpen = false,
  isOpenMobile = false,
  onClose,
  onCloseMobile,
  onLogout,
  piutangCount = 0,
  freezeCount = 0
}) => {
  const isCurrentlyOpen = isOpen || isOpenMobile;
  const handleClose = onCloseMobile || onClose || (() => {});
  const role: UserRole = currentUser?.role || 'admin';

  const canAccess = (requiredRoles: UserRole[]) => {
    return requiredRoles.includes(role);
  };

  const navItems = [
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
          id: 'leader-pt' as ActiveTab,
          label: 'Dashboard Leader PT',
          icon: Activity,
          roles: ['admin', 'leader_pt'] as UserRole[]
        },
        {
          id: 'pt-package-performance' as ActiveTab,
          label: 'Performa Trainer × Paket',
          icon: Award,
          roles: ['admin', 'leader_pt'] as UserRole[]
        },
        {
          id: 'trainer-portal' as ActiveTab,
          label: 'Portal Fokus Trainer',
          icon: Dumbbell,
          roles: ['admin', 'leader_pt', 'pt'] as UserRole[]
        }
      ]
    },
    {
      group: 'Operasional & Member',
      items: [
        {
          id: 'absen' as ActiveTab,
          label: 'Absensi Member & Staf',
          icon: UserCheck,
          roles: ['admin', 'kasir', 'leader_pt', 'pt'] as UserRole[]
        },
        {
          id: 'jadwal-pt' as ActiveTab,
          label: 'Jadwal, Trainer & Kelas',
          icon: CalendarDays,
          roles: ['admin', 'leader_pt', 'pt'] as UserRole[]
        },
        {
          id: 'freeze' as ActiveTab,
          label: 'Freeze & Cuti Member',
          icon: Snowflake,
          roles: ['admin', 'kasir', 'leader_pt'] as UserRole[],
          badge: freezeCount > 0 ? freezeCount : undefined
        },
        {
          id: 'master-data' as ActiveTab,
          label: 'Direktori Member 360',
          icon: Users,
          roles: ['admin', 'leader_pt', 'kasir'] as UserRole[]
        }
      ]
    },
    {
      group: 'Transaksi & Penjualan',
      items: [
        {
          id: 'pos' as ActiveTab,
          label: 'Kasir POS FnB & Produk',
          icon: ShoppingBag,
          roles: ['admin', 'kasir'] as UserRole[]
        },
        {
          id: 'products' as ActiveTab,
          label: 'Manajemen Produk & Stok',
          icon: Boxes,
          roles: ['admin', 'kasir'] as UserRole[]
        },
        {
          id: 'membership' as ActiveTab,
          label: 'Pembelian Paket & Cicilan',
          icon: Crown,
          roles: ['admin', 'kasir'] as UserRole[]
        },
        {
          id: 'bundling-reports' as ActiveTab,
          label: 'Paket Bundling & Komisi',
          icon: Gift,
          roles: ['admin', 'leader_pt', 'kasir'] as UserRole[]
        },
        {
          id: 'crm' as ActiveTab,
          label: 'CRM & Leads Kanban',
          icon: Target,
          roles: ['admin', 'leader_pt', 'kasir'] as UserRole[]
        }
      ]
    },
    {
      group: 'Aset & Inventaris',
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
      group: 'Keuangan & Akuntansi',
      items: [
        {
          id: 'piutang' as ActiveTab,
          label: 'Buku Piutang & Cicilan',
          icon: BookOpen,
          badge: piutangCount > 0 ? piutangCount : undefined,
          roles: ['admin', 'kasir'] as UserRole[]
        },
        {
          id: 'laporan' as ActiveTab,
          label: 'Buku Besar Transaksi',
          icon: FileText,
          roles: ['admin', 'kasir'] as UserRole[]
        },
        {
          id: 'tutup-toko' as ActiveTab,
          label: 'Daily Closing & Kas',
          icon: Lock,
          roles: ['admin', 'kasir'] as UserRole[]
        }
      ]
    },
    {
      group: 'Sumber Daya Manusia',
      items: [
        {
          id: 'hr-payroll' as ActiveTab,
          label: 'HR & Payroll Staf',
          icon: UsersRound,
          roles: ['admin'] as UserRole[]
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isCurrentlyOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={handleClose}
        />
      )}

      <aside
        id="app-sidebar"
        className={`w-64 bg-[#09090b] border-r border-zinc-800 flex flex-col z-40 fixed lg:relative inset-y-0 left-0 transition-transform duration-300 ease-in-out shrink-0 ${
          isCurrentlyOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 shrink-0 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black italic text-lg tracking-tighter">
              R
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-white tracking-wider leading-none">RFA GYM</span>
              <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-0.5">Enterprise ERP</span>
            </div>
          </div>
          <button
            className="lg:hidden text-zinc-400 hover:text-white p-1 rounded-lg"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          {navItems.map((group, idx) => {
            const visibleItems = group.items.filter((item) => canAccess(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 mb-2">
                  {group.group}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (window.innerWidth < 1024) handleClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold'
                          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-white text-orange-600' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/70 transition group">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentUser?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                alt={currentUser?.name || 'User'}
                className="w-9 h-9 rounded-xl object-cover border border-zinc-700 shrink-0"
              />
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate leading-tight">{currentUser?.name || 'Guest'}</p>
                <p className="text-[10px] text-orange-400 uppercase font-medium mt-0.5">{currentUser?.roleName || 'Guest'}</p>
              </div>
            </div>
            <button
              id="btn-sidebar-logout"
              title="Logout dari akun"
              onClick={() => onLogout?.()}
              className="text-zinc-500 hover:text-rose-400 p-2 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
