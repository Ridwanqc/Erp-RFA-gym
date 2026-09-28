import React, { useState, useEffect, useMemo } from 'react';
import {
  INITIAL_USERS,
  INITIAL_MEMBERS,
  INITIAL_PRODUCTS,
  INITIAL_PACKAGES,
  INITIAL_TRANSACTIONS,
  INITIAL_SCHEDULES,
  INITIAL_STUDIO_CLASSES,
  INITIAL_LEADS,
  INITIAL_FOLLOW_UPS,
  INITIAL_ATTENDANCE,
  INITIAL_STAFF_ATTENDANCE,
  INITIAL_PETTY_CASH,
  INITIAL_CLOSING,
  INITIAL_PT_PURCHASES,
  INITIAL_WORK_SCHEDULES,
  INITIAL_LEAVES
} from './data/initialData';
import {
  User,
  Member,
  Product,
  PackageItem,
  Transaction,
  Schedule,
  StudioClass,
  Lead,
  FollowUpLog,
  Attendance,
  StaffAttendance,
  PettyCash,
  DailyClosingRecord,
  PTPurchaseRecord,
  BundlePackage,
  BundleItem,
  MemberMembershipRecord,
  TrainerCommissionRecord,
  SalesCommissionRecord,
  GymAsset,
  AssetMaintenance,
  DamageReport,
  WorkOrder,
  Sparepart,
  AssetProcurement,
  AssetMovement,
  AssetDisposal,
  InventoryAuditLog,
  ApprovalThresholdConfig,
  MemberFreezeRecord,
  MembershipStatus,
  WorkSchedule,
  LeaveRequest,
  LockerSlot,
  ALL_BRANCHES_ID
} from './types';
import { INITIAL_LOCKERS } from './data/lockerData';
import {
  INITIAL_BUNDLE_PACKAGES,
  INITIAL_MEMBER_MEMBERSHIPS,
  INITIAL_TRAINER_COMMISSIONS
} from './data/bundlingData';
import {
  INITIAL_GYM_ASSETS,
  INITIAL_MAINTENANCES,
  INITIAL_DAMAGE_REPORTS,
  INITIAL_WORK_ORDERS,
  INITIAL_SPAREPARTS,
  INITIAL_PROCUREMENTS,
  INITIAL_ASSET_MOVEMENTS,
  INITIAL_ASSET_DISPOSALS,
  INITIAL_INVENTORY_AUDIT_LOGS,
  INITIAL_APPROVAL_CONFIG
} from './data/inventoryData';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MembershipView } from './components/MembershipView';
import { POSView } from './components/POSView';
import { ProductManagementView } from './components/ProductManagementView';
import { AttendanceView } from './components/AttendanceView';
import { JadwalPTView } from './components/JadwalPTView';
import { CRMView } from './components/CRMView';
import { MasterDataView } from './components/MasterDataView';
import { FinanceView } from './components/FinanceView';
import { HRPayrollView } from './components/HRPayrollView';
import { LeaderPTDashboardView } from './components/LeaderPTDashboardView';
import { TrainerPackagePerformanceView } from './components/TrainerPackagePerformanceView';
import { TrainerPortalView } from './components/TrainerPortalView';
import { BundlingReportsView } from './components/BundlingReportsView';
import { FrontDeskPortalView } from './components/FrontDeskPortalView';
import { InventoryView } from './components/InventoryView';
import { LockerManagementView } from './components/LockerManagementView';
import { MembershipFreezeView } from './components/MembershipFreezeView';
import { INITIAL_FREEZE_RECORDS } from './data/freezeData';

import { ReceiptModal } from './components/ReceiptModal';
import { IDCardModal } from './components/IDCardModal';
import { MemberDetailModal } from './components/MemberDetailModal';
import { SignatureModal } from './components/SignatureModal';
import { BundlingManagerModal } from './components/BundlingManagerModal';
import { FreezeMemberModal } from './components/FreezeMemberModal';
import { UnfreezeMemberModal } from './components/UnfreezeMemberModal';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { SettingsView } from './components/SettingsView';
import { GoogleSheetsSyncView } from './components/GoogleSheetsSyncView';
import { AddBranchModal } from './components/AddBranchModal';
import { MultiBranchBar } from './components/MultiBranchBar';
import { StockTransferModal } from './components/StockTransferModal';
import { useTheme } from './context/ThemeContext';
import { useSettings } from './context/SettingsContext';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/landing/LandingPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OnlineReservation } from './types/landingTypes';
import { INITIAL_ONLINE_RESERVATIONS } from './data/landingData';
import { APP_TODAY, formatRp } from './utils/formatters';
import { testConnection, auth, onAuthStateChanged, logOutFirebase } from './lib/firebase';
import {
  saveMemberToFirestore,
  saveTransactionToFirestore,
  saveAttendanceToFirestore,
  saveLeadToFirestore,
  saveReservationToFirestore,
  subscribeMembers,
  subscribeTransactions,
  subscribeReservations,
  seedInitialFirestoreData
} from './lib/firestoreService';

export default function App() {
  // Navigation & Platform View State
  const [guestView, setGuestView] = useState<'landing' | 'staff-login'>('landing');
  const [staffViewMode, setStaffViewMode] = useState<'erp' | 'landing'>('erp');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gympro_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [firebaseConnected, setFirebaseConnected] = useState(true);
  const { isThemeModalOpen, closeThemeModal } = useTheme();
  const {
    branches,
    activeBranchId,
    activeBranch,
    isAllBranches,
    setActiveBranchId,
    addBranch,
    filterByBranch,
    canUserAccessBranch,
    stockTransfers,
    recordStockTransfer
  } = useSettings();
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isStockTransferModalOpen, setIsStockTransferModalOpen] = useState(false);

  const handleToggleDesktopSidebar = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gympro_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // State with LocalStorage fallbacks and mock data synchronization
  const [staffUsers, setStaffUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('rfa_staff');
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: User[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((u) => u.id));
      const missing = INITIAL_USERS.filter((u) => !existingIds.has(u.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const sessionActive = localStorage.getItem('rfa_session_active');
    const savedUserId = localStorage.getItem('rfa_current_user_id');
    if (sessionActive === 'true' && savedUserId) {
      const saved = localStorage.getItem('rfa_staff');
      const pool = saved ? JSON.parse(saved) : INITIAL_USERS;
      const found = pool.find((u: User) => u.id === savedUserId);
      if (found) return found;
    }
    // Default to null so user lands on the newly created Login Page
    return null;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('rfa_members');
    if (!saved) return INITIAL_MEMBERS;
    try {
      const parsed: Member[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((m) => m.id));
      const missing = INITIAL_MEMBERS.filter((m) => !existingIds.has(m.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('rfa_products');
    if (!saved) return INITIAL_PRODUCTS;
    try {
      const parsed: Product[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((p) => p.id));
      const missing = INITIAL_PRODUCTS.filter((p) => !existingIds.has(p.id));
      return [...parsed, ...missing];
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [packages, setPackages] = useState<PackageItem[]>(() => {
    const saved = localStorage.getItem('rfa_packages');
    if (!saved) return INITIAL_PACKAGES;
    try {
      const parsed: PackageItem[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((p) => p.id));
      const missing = INITIAL_PACKAGES.filter((p) => !existingIds.has(p.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_PACKAGES;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('rfa_transactions');
    if (!saved) return INITIAL_TRANSACTIONS;
    try {
      const parsed: Transaction[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((t) => t.id));
      const missing = INITIAL_TRANSACTIONS.filter((t) => !existingIds.has(t.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [targetPiutangTrxId, setTargetPiutangTrxId] = useState<string | null>(null);

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem('rfa_schedules');
    if (!saved) return INITIAL_SCHEDULES;
    try {
      const parsed: Schedule[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((s) => s.id));
      const missing = INITIAL_SCHEDULES.filter((s) => !existingIds.has(s.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_SCHEDULES;
    }
  });

  const [studioClasses, setStudioClasses] = useState<StudioClass[]>(() => {
    const saved = localStorage.getItem('rfa_studioclasses');
    return saved ? JSON.parse(saved) : INITIAL_STUDIO_CLASSES;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('rfa_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [followUps, setFollowUps] = useState<FollowUpLog[]>(() => {
    const saved = localStorage.getItem('rfa_followups');
    return saved ? JSON.parse(saved) : INITIAL_FOLLOW_UPS;
  });

  const [attendances, setAttendances] = useState<Attendance[]>(() => {
    const saved = localStorage.getItem('rfa_attendance');
    if (!saved) return INITIAL_ATTENDANCE;
    try {
      const parsed: Attendance[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((a) => a.id));
      const missing = INITIAL_ATTENDANCE.filter((a) => !existingIds.has(a.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });

  const [staffAttendances, setStaffAttendances] = useState<StaffAttendance[]>(() => {
    const saved = localStorage.getItem('rfa_staff_att');
    if (!saved) return INITIAL_STAFF_ATTENDANCE;
    try {
      const parsed: StaffAttendance[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((sa) => sa.id));
      const missing = INITIAL_STAFF_ATTENDANCE.filter((sa) => !existingIds.has(sa.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_STAFF_ATTENDANCE;
    }
  });

  const [lockers, setLockers] = useState<LockerSlot[]>(() => {
    const saved = localStorage.getItem('rfa_lockers');
    if (!saved) return INITIAL_LOCKERS;
    try {
      const parsed: LockerSlot[] = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_LOCKERS;
    } catch {
      return INITIAL_LOCKERS;
    }
  });

  useEffect(() => {
    localStorage.setItem('rfa_lockers', JSON.stringify(lockers));
  }, [lockers]);

  // Online Reservations State (Integrated between Landing Page & ERP Front Desk)
  const [reservations, setReservations] = useState<OnlineReservation[]>(() => {
    const saved = localStorage.getItem('rfa_online_reservations');
    if (!saved) return INITIAL_ONLINE_RESERVATIONS;
    try {
      const parsed: OnlineReservation[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((r) => r.id));
      const missing = INITIAL_ONLINE_RESERVATIONS.filter((r) => !existingIds.has(r.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_ONLINE_RESERVATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rfa_online_reservations', JSON.stringify(reservations));
    } catch {}
  }, [reservations]);

  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>(() => {
    const saved = localStorage.getItem('rfa_work_schedules');
    if (!saved) return INITIAL_WORK_SCHEDULES;
    try {
      const parsed: WorkSchedule[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((ws) => ws.id));
      const missing = INITIAL_WORK_SCHEDULES.filter((ws) => !existingIds.has(ws.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_WORK_SCHEDULES;
    }
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('rfa_leaves');
    if (!saved) return INITIAL_LEAVES;
    try {
      const parsed: LeaveRequest[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((l) => l.id));
      const missing = INITIAL_LEAVES.filter((l) => !existingIds.has(l.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_LEAVES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rfa_staff', JSON.stringify(staffUsers));
    } catch (e) {
      console.error(e);
    }
  }, [staffUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('rfa_staff_att', JSON.stringify(staffAttendances));
    } catch (e) {
      console.error(e);
    }
  }, [staffAttendances]);

  useEffect(() => {
    try {
      localStorage.setItem('rfa_work_schedules', JSON.stringify(workSchedules));
    } catch (e) {
      console.error(e);
    }
  }, [workSchedules]);

  useEffect(() => {
    try {
      localStorage.setItem('rfa_leaves', JSON.stringify(leaveRequests));
    } catch (e) {
      console.error(e);
    }
  }, [leaveRequests]);

  const [pettyCashList, setPettyCashList] = useState<PettyCash[]>(() => {
    const saved = localStorage.getItem('rfa_pettycash');
    if (!saved) return INITIAL_PETTY_CASH;
    try {
      const parsed: PettyCash[] = JSON.parse(saved);
      const hasValidFormat = Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0]?.expenses);
      if (!hasValidFormat) {
        return INITIAL_PETTY_CASH;
      }
      const existingIds = new Set(parsed.map((p) => p.id));
      const missing = INITIAL_PETTY_CASH.filter((p) => !existingIds.has(p.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_PETTY_CASH;
    }
  });

  const [closingRecords, setClosingRecords] = useState<DailyClosingRecord[]>(() => {
    const saved = localStorage.getItem('rfa_closing');
    return saved ? JSON.parse(saved) : INITIAL_CLOSING;
  });

  const [ptPurchases, setPtPurchases] = useState<PTPurchaseRecord[]>(() => {
    const saved = localStorage.getItem('rfa_pt_purchases');
    if (!saved) return INITIAL_PT_PURCHASES;
    try {
      const parsed: PTPurchaseRecord[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((p) => p.id));
      const missing = INITIAL_PT_PURCHASES.filter((p) => !existingIds.has(p.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_PT_PURCHASES;
    }
  });

  useEffect(() => {
    localStorage.setItem('rfa_pt_purchases', JSON.stringify(ptPurchases));
  }, [ptPurchases]);

  // Bundling Package State & Modals
  const [bundlePackages, setBundlePackages] = useState<BundlePackage[]>(() => {
    const saved = localStorage.getItem('rfa_bundle_packages');
    if (!saved) return INITIAL_BUNDLE_PACKAGES;
    try {
      const parsed: BundlePackage[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((b) => b.bundleId));
      const missing = INITIAL_BUNDLE_PACKAGES.filter((b) => !existingIds.has(b.bundleId));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_BUNDLE_PACKAGES;
    }
  });

  const [memberMemberships, setMemberMemberships] = useState<MemberMembershipRecord[]>(() => {
    const saved = localStorage.getItem('rfa_member_memberships');
    if (!saved) return INITIAL_MEMBER_MEMBERSHIPS;
    try {
      const parsed: MemberMembershipRecord[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((m) => m.id || m.membershipRecordId));
      const missing = INITIAL_MEMBER_MEMBERSHIPS.filter((m) => !existingIds.has(m.id || m.membershipRecordId));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_MEMBER_MEMBERSHIPS;
    }
  });

  const [trainerCommissions, setTrainerCommissions] = useState<TrainerCommissionRecord[]>(() => {
    const saved = localStorage.getItem('rfa_trainer_commissions');
    if (!saved) return INITIAL_TRAINER_COMMISSIONS;
    try {
      const parsed: TrainerCommissionRecord[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((c) => c.id || c.commissionId));
      const missing = INITIAL_TRAINER_COMMISSIONS.filter((c) => !existingIds.has(c.id || c.commissionId));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_TRAINER_COMMISSIONS;
    }
  });

  const [isBundlingModalOpen, setIsBundlingModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('rfa_bundle_packages', JSON.stringify(bundlePackages));
  }, [bundlePackages]);

  useEffect(() => {
    localStorage.setItem('rfa_member_memberships', JSON.stringify(memberMemberships));
  }, [memberMemberships]);

  useEffect(() => {
    localStorage.setItem('rfa_trainer_commissions', JSON.stringify(trainerCommissions));
  }, [trainerCommissions]);

  const [salesCommissions, setSalesCommissions] = useState<SalesCommissionRecord[]>(() => {
    const saved = localStorage.getItem('rfa_sales_commissions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('rfa_sales_commissions', JSON.stringify(salesCommissions));
  }, [salesCommissions]);

  useEffect(() => {
    localStorage.setItem('rfa_packages', JSON.stringify(packages));
  }, [packages]);

  // ==================== MEMBERSHIP FREEZE / UNFREEZE STATE ====================
  const [freezeRecords, setFreezeRecords] = useState<MemberFreezeRecord[]>(() => {
    const saved = localStorage.getItem('rfa_freeze_records');
    if (!saved) return INITIAL_FREEZE_RECORDS;
    try {
      const parsed: MemberFreezeRecord[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((r) => r.id));
      const missing = INITIAL_FREEZE_RECORDS.filter((r) => !existingIds.has(r.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_FREEZE_RECORDS;
    }
  });

  const [activeFreezeMember, setActiveFreezeMember] = useState<Member | null>(null);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [activeUnfreezeMember, setActiveUnfreezeMember] = useState<Member | null>(null);
  const [activeUnfreezeRecord, setActiveUnfreezeRecord] = useState<MemberFreezeRecord | null>(null);

  useEffect(() => {
    localStorage.setItem('rfa_freeze_records', JSON.stringify(freezeRecords));
  }, [freezeRecords]);

  // ==================== INVENTARIS & ASET STATE ====================
  const [gymAssets, setGymAssets] = useState<GymAsset[]>(() => {
    try {
      const saved = localStorage.getItem('rfa_gym_assets');
      return saved ? JSON.parse(saved) : INITIAL_GYM_ASSETS;
    } catch {
      return INITIAL_GYM_ASSETS;
    }
  });

  const [assetMaintenances, setAssetMaintenances] = useState<AssetMaintenance[]>(() => {
    try {
      const saved = localStorage.getItem('rfa_asset_maintenances');
      return saved ? JSON.parse(saved) : INITIAL_MAINTENANCES;
    } catch {
      return INITIAL_MAINTENANCES;
    }
  });

  const [damageReports, setDamageReports] = useState<DamageReport[]>(() => {
    try {
      const saved = localStorage.getItem('rfa_damage_reports');
      return saved ? JSON.parse(saved) : INITIAL_DAMAGE_REPORTS;
    } catch {
      return INITIAL_DAMAGE_REPORTS;
    }
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    try {
      const saved = localStorage.getItem('rfa_work_orders');
      return saved ? JSON.parse(saved) : INITIAL_WORK_ORDERS;
    } catch {
      return INITIAL_WORK_ORDERS;
    }
  });

  const [spareparts, setSpareparts] = useState<Sparepart[]>(() => {
    try {
      const saved = localStorage.getItem('rfa_spareparts');
      return saved ? JSON.parse(saved) : INITIAL_SPAREPARTS;
    } catch {
      return INITIAL_SPAREPARTS;
    }
  });

  const [assetProcurements, setAssetProcurements] = useState<AssetProcurement[]>(() => {
    try {
      const saved = localStorage.getItem('rfa_asset_procurements');
      return saved ? JSON.parse(saved) : INITIAL_PROCUREMENTS;
    } catch {
      return INITIAL_PROCUREMENTS;
    }
  });

  const [assetMovements, setAssetMovements] = useState<AssetMovement[]>(() => {
    try {
      const saved = localStorage.getItem('rfa_asset_movements');
      return saved ? JSON.parse(saved) : INITIAL_ASSET_MOVEMENTS;
    } catch {
      return INITIAL_ASSET_MOVEMENTS;
    }
  });

  const [assetDisposals, setAssetDisposals] = useState<AssetDisposal[]>(() => {
    try {
      const saved = localStorage.getItem('rfa_asset_disposals');
      return saved ? JSON.parse(saved) : INITIAL_ASSET_DISPOSALS;
    } catch {
      return INITIAL_ASSET_DISPOSALS;
    }
  });

  const [inventoryAuditLogs, setInventoryAuditLogs] = useState<InventoryAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('rfa_inventory_audit_logs');
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY_AUDIT_LOGS;
    } catch {
      return INITIAL_INVENTORY_AUDIT_LOGS;
    }
  });

  const [approvalConfig, setApprovalConfig] = useState<ApprovalThresholdConfig>(() => {
    try {
      const saved = localStorage.getItem('rfa_approval_config');
      return saved ? JSON.parse(saved) : INITIAL_APPROVAL_CONFIG;
    } catch {
      return INITIAL_APPROVAL_CONFIG;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('rfa_gym_assets', JSON.stringify(gymAssets));
  }, [gymAssets]);

  useEffect(() => {
    localStorage.setItem('rfa_asset_maintenances', JSON.stringify(assetMaintenances));
  }, [assetMaintenances]);

  useEffect(() => {
    localStorage.setItem('rfa_damage_reports', JSON.stringify(damageReports));
  }, [damageReports]);

  useEffect(() => {
    localStorage.setItem('rfa_work_orders', JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem('rfa_spareparts', JSON.stringify(spareparts));
  }, [spareparts]);

  useEffect(() => {
    localStorage.setItem('rfa_asset_procurements', JSON.stringify(assetProcurements));
  }, [assetProcurements]);

  useEffect(() => {
    localStorage.setItem('rfa_asset_movements', JSON.stringify(assetMovements));
  }, [assetMovements]);

  useEffect(() => {
    localStorage.setItem('rfa_asset_disposals', JSON.stringify(assetDisposals));
  }, [assetDisposals]);

  useEffect(() => {
    localStorage.setItem('rfa_inventory_audit_logs', JSON.stringify(inventoryAuditLogs));
  }, [inventoryAuditLogs]);

  useEffect(() => {
    localStorage.setItem('rfa_approval_config', JSON.stringify(approvalConfig));
  }, [approvalConfig]);

  // Synchronize and lock active branch when non-admin staff logs in
  useEffect(() => {
    if (currentUser?.branchId && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      if (activeBranchId !== currentUser.branchId) {
        setActiveBranchId(currentUser.branchId);
      }
    }
  }, [currentUser, activeBranchId, setActiveBranchId]);

  // Multi-Branch Scoped Data Partitioning
  const scopedTransactions = useMemo(() => {
    if (isAllBranches) return transactions;
    return transactions.filter((t) => !t.branchId || t.branchId === activeBranchId);
  }, [transactions, isAllBranches, activeBranchId]);

  const scopedMembers = useMemo(() => {
    if (isAllBranches) return members;
    return members.filter((m) => !m.branchId || m.branchId === activeBranchId);
  }, [members, isAllBranches, activeBranchId]);

  const scopedStaffUsers = useMemo(() => {
    if (isAllBranches) return staffUsers;
    return staffUsers.filter(
      (u) =>
        !u.branchId ||
        u.branchId === activeBranchId ||
        (u.allowedBranchIds && u.allowedBranchIds.includes(activeBranchId))
    );
  }, [staffUsers, isAllBranches, activeBranchId]);

  const scopedPettyCashList = useMemo(() => {
    if (isAllBranches) return pettyCashList;
    return pettyCashList.filter((p) => !p.branchId || p.branchId === activeBranchId);
  }, [pettyCashList, isAllBranches, activeBranchId]);

  const scopedClosingRecords = useMemo(() => {
    if (isAllBranches) return closingRecords;
    return closingRecords.filter((c) => !c.branchId || c.branchId === activeBranchId);
  }, [closingRecords, isAllBranches, activeBranchId]);

  const scopedAttendances = useMemo(() => {
    if (isAllBranches) return attendances;
    return attendances.filter((a) => !a.branchId || a.branchId === activeBranchId);
  }, [attendances, isAllBranches, activeBranchId]);

  const scopedStaffAttendances = useMemo(() => {
    if (isAllBranches) return staffAttendances;
    return staffAttendances.filter((sa) => !sa.branchId || sa.branchId === activeBranchId);
  }, [staffAttendances, isAllBranches, activeBranchId]);

  const scopedLeads = useMemo(() => {
    if (isAllBranches) return leads;
    return leads.filter((l) => !l.branchId || l.branchId === activeBranchId);
  }, [leads, isAllBranches, activeBranchId]);

  const scopedGymAssets = useMemo(() => {
    if (isAllBranches) return gymAssets;
    return gymAssets.filter((a) => !a.branchId || a.branchId === activeBranchId);
  }, [gymAssets, isAllBranches, activeBranchId]);

  const scopedProducts = useMemo(() => {
    if (isAllBranches) return products;
    return products.map((p) => {
      if (p.branchStocks && p.branchStocks[activeBranchId] !== undefined) {
        return {
          ...p,
          stock: p.branchStocks[activeBranchId]
        };
      }
      return p;
    });
  }, [products, isAllBranches, activeBranchId]);

  // Inventory Helper: Add Audit Log
  const addInventoryAuditLog = (
    action: string,
    targetType: 'ASSET' | 'MAINTENANCE' | 'DAMAGE_REPORT' | 'WORK_ORDER' | 'SPAREPART' | 'PROCUREMENT' | 'MOVEMENT' | 'DISPOSAL',
    targetId: string,
    targetName: string,
    details: string,
    costImpact: number = 0
  ) => {
    const newLog: InventoryAuditLog = {
      id: 'LOG-' + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser?.id || 'U-SYS',
      userName: currentUser?.name || 'Sistem',
      userRole: currentUser?.role || 'admin',
      action,
      targetType,
      targetId,
      targetName,
      details,
      costImpact
    };
    setInventoryAuditLogs((prev) => [newLog, ...prev]);
  };

  // Handler: Save Asset
  const handleSaveAsset = (asset: GymAsset, isNew: boolean) => {
    if (isNew) {
      setGymAssets((prev) => [asset, ...prev]);
      addInventoryAuditLog('TAMBAH_ASET', 'ASSET', asset.id, asset.name, `Aset baru didaftarkan: ${asset.code} (${asset.location})`, asset.purchasePrice);
      showToast('Aset Tersimpan', `Aset ${asset.name} (${asset.code}) berhasil didaftarkan.`, 'success');
    } else {
      setGymAssets((prev) => prev.map((a) => (a.id === asset.id ? asset : a)));
      addInventoryAuditLog('UPDATE_ASET', 'ASSET', asset.id, asset.name, `Data aset ${asset.code} diperbarui.`);
      showToast('Aset Diperbarui', `Perubahan data aset ${asset.name} telah disimpan.`, 'success');
    }
  };

  // Handler: Save Maintenance
  const handleSaveMaintenance = (m: AssetMaintenance, isNew: boolean) => {
    if (isNew) {
      setAssetMaintenances((prev) => [m, ...prev]);
      setGymAssets((prev) =>
        prev.map((a) => {
          if (a.id === m.assetId) {
            return {
              ...a,
              lastMaintenance: m.scheduledDate,
              nextMaintenance: m.nextScheduledDate || a.nextMaintenance,
              condition: m.status === 'SELESAI' ? 'BAIK' : a.condition,
              status: m.status === 'SELESAI' ? 'OPERASIONAL' : 'DALAM_PERAWATAN'
            };
          }
          return a;
        })
      );
      addInventoryAuditLog('JADWAL_MAINTENANCE', 'MAINTENANCE', m.id, m.assetName, `Perawatan dijadwalkan: ${m.title} (${m.type})`, m.cost || 0);
      showToast('Jadwal Perawatan Dibuat', `Jadwal perawatan untuk ${m.assetName} berhasil disimpan.`, 'success');
    } else {
      setAssetMaintenances((prev) => prev.map((item) => (item.id === m.id ? m : item)));
      if (m.status === 'SELESAI') {
        setGymAssets((prev) =>
          prev.map((a) => (a.id === m.assetId ? { ...a, status: 'OPERASIONAL', condition: 'BAIK' } : a))
        );
      }
      addInventoryAuditLog('UPDATE_MAINTENANCE', 'MAINTENANCE', m.id, m.assetName, `Status perawatan diubah menjadi ${m.status}`, m.cost || 0);
      showToast('Perawatan Diperbarui', `Data perawatan telah diperbarui.`, 'success');
    }
  };

  // Handler: Save Damage Report
  const handleSaveDamageReport = (report: DamageReport) => {
    setDamageReports((prev) => {
      const exists = prev.some((r) => r.id === report.id);
      if (exists) {
        return prev.map((r) => (r.id === report.id ? report : r));
      }
      return [report, ...prev];
    });

    setGymAssets((prev) =>
      prev.map((a) => {
        if (a.id === report.assetId) {
          const isHeavy = report.severity === 'BERAT' || report.severity === 'TOTAL';
          return {
            ...a,
            condition: isHeavy ? 'RUSAK_BERAT' : 'RUSAK_RINGAN',
            status: isHeavy ? 'RUSAK' : a.status
          };
        }
        return a;
      })
    );

    addInventoryAuditLog('LAPORAN_KERUSAKAN', 'DAMAGE_REPORT', report.id, report.assetName, `Laporan kerusakan baru (${report.severity}): ${report.issueDescription}`);
    showToast('Laporan Kerusakan Dibuat', `Laporan kerusakan untuk ${report.assetName} telah dicatat.`, 'warning');
  };

  // Handler: Save Work Order
  const handleSaveWorkOrder = (wo: WorkOrder) => {
    setWorkOrders((prev) => {
      const exists = prev.some((w) => w.id === wo.id);
      if (exists) {
        return prev.map((w) => (w.id === wo.id ? wo : w));
      }
      return [wo, ...prev];
    });

    if (wo.status === 'SELESAI') {
      setGymAssets((prev) =>
        prev.map((a) => (a.id === wo.assetId ? { ...a, status: 'OPERASIONAL', condition: 'BAIK' } : a))
      );
      if (wo.damageReportId) {
        setDamageReports((prev) =>
          prev.map((dr) => (dr.id === wo.damageReportId ? { ...dr, status: 'SELESAI' } : dr))
        );
      }
    }

    addInventoryAuditLog('WORK_ORDER', 'WORK_ORDER', wo.id, wo.woNumber || wo.id, `SPK ${wo.woNumber || wo.id} diupdate (${wo.status}) - Biaya: ${formatRp(wo.actualCost || wo.estimatedCost)}`, wo.actualCost || wo.estimatedCost);
    showToast('SPK Disimpan', `Surat Perintah Kerja ${wo.woNumber || wo.id} berhasil disimpan.`, 'success');
  };

  // Handler: Save Procurement
  const handleSaveProcurement = (proc: AssetProcurement, shouldGenerateAssets: boolean) => {
    setAssetProcurements((prev) => {
      const exists = prev.some((p) => p.id === proc.id);
      if (exists) {
        return prev.map((p) => (p.id === proc.id ? proc : p));
      }
      return [proc, ...prev];
    });

    if (shouldGenerateAssets && (proc.status === 'DITERIMA' || proc.status === 'DISETUJUI_OWNER' || proc.status === 'DISETUJUI_MANAGER')) {
      const newAssets: GymAsset[] = (proc.items || []).map((item) => ({
        id: 'AST-' + Math.floor(100000 + Math.random() * 900000),
        assetCode: `RFA-AST-${item.category.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        code: `RFA-AST-${item.category.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        name: item.name,
        category: item.category,
        brand: item.brand,
        model: item.model || item.name,
        serialNumber: item.serialNumber || `SN-${Math.floor(1000000 + Math.random() * 9000000)}`,
        purchaseDate: proc.orderDate || proc.date || new Date().toISOString().split('T')[0],
        purchasePrice: item.estimatedPrice,
        vendor: proc.vendorName || proc.supplier,
        supplier: proc.vendorName || proc.supplier,
        vendorPhone: proc.vendorPhone,
        warrantyMonths: 12,
        warrantyExpiry: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        location: proc.targetLocation || 'Main Gym Floor',
        status: 'OPERASIONAL',
        condition: 'BARU',
        maintenanceFrequencyMonths: 1,
        nextMaintenance: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        depreciationYears: 5,
        salvageValue: Math.round(item.estimatedPrice * 0.1),
        accumulatedDepreciation: 0,
        currentBookValue: item.estimatedPrice,
        notes: `Pengadaan: ${proc.poNumber || proc.id} (${proc.title || proc.assetName || ''})`,
        specifications: { Power: '220V', Capacity: 'Standard' }
      }));
      setGymAssets((prev) => [...newAssets, ...prev]);
    }

    addInventoryAuditLog('PENGADAAN_ASET', 'PROCUREMENT', proc.id, proc.poNumber || proc.id, `Pengadaan ${proc.poNumber || proc.id} (${proc.title || proc.assetName || ''}) - Status: ${proc.status}`, proc.totalCost || proc.totalPurchase);
    showToast('Pengadaan Tersimpan', `Pengajuan pengadaan ${proc.poNumber || proc.id} berhasil dicatat.`, 'success');
  };

  // Handler: Save Sparepart
  const handleSaveSparepart = (sp: Sparepart, isNew: boolean, restockCost?: number) => {
    if (isNew) {
      setSpareparts((prev) => [sp, ...prev]);
      addInventoryAuditLog('TAMBAH_SPAREPART', 'SPAREPART', sp.id, sp.name, `Sparepart ${sp.code || sp.sparepartCode} ditambahkan`, (sp.unitCost || sp.unitPrice || 0) * sp.stock);
      showToast('Sparepart Ditambahkan', `Suku cadang ${sp.name} berhasil didaftarkan.`, 'success');
    } else {
      setSpareparts((prev) => prev.map((s) => (s.id === sp.id ? sp : s)));
      addInventoryAuditLog('UPDATE_SPAREPART', 'SPAREPART', sp.id, sp.name, `Stok sparepart ${sp.code || sp.sparepartCode} diperbarui: ${sp.stock} ${sp.unit || 'pcs'}`, restockCost || 0);
      showToast('Sparepart Diperbarui', `Data suku cadang ${sp.name} berhasil disimpan.`, 'success');
    }
  };

  // Handler: Save Movement / Mutasi
  const handleSaveMovement = (mov: AssetMovement) => {
    const destLoc = mov.toLocation || mov.newLocation || 'Main Gym Floor';
    setAssetMovements((prev) => [mov, ...prev]);
    setGymAssets((prev) =>
      prev.map((a) => (a.id === mov.assetId ? { ...a, location: destLoc } : a))
    );
    addInventoryAuditLog('MUTASI_ASET', 'MOVEMENT', mov.id, mov.assetName, `Mutasi dari ${mov.fromLocation || mov.oldLocation} ke ${destLoc}`);
    showToast('Mutasi Aset Tercatat', `Aset ${mov.assetName} dipindahkan ke ${destLoc}.`, 'info');
  };

  // Handler: Save Disposal
  const handleSaveDisposal = (disp: AssetDisposal) => {
    setAssetDisposals((prev) => [disp, ...prev]);
    setGymAssets((prev) =>
      prev.map((a) => (a.id === disp.assetId ? { ...a, status: 'DISPOSAL', condition: 'AFKIR' } : a))
    );
    addInventoryAuditLog('DISPOSAL_ASET', 'DISPOSAL', disp.id, disp.assetName, `Penghapusan aset: ${disp.method} - Alasan: ${disp.reason}`, disp.recoveryAmount || 0);
    showToast('Disposal Aset Dicatat', `Aset ${disp.assetName} telah dicatat dalam arsip penghapusan/disposal.`, 'warning');
  };

  // Handler: Save Approval Config
  const handleSaveApprovalConfig = (config: ApprovalThresholdConfig) => {
    setApprovalConfig(config);
    addInventoryAuditLog('UPDATE_CONFIG', 'PROCUREMENT', 'CONFIG', 'Batas Nominal Approval', `Batas nominal approval disesuaikan`);
    showToast('Konfigurasi Disimpan', 'Batas nominal persetujuan pengadaan berhasil diubah.', 'success');
  };

  // Daily closing status scoped per branch
  const isStoreClosed = useMemo(() => {
    if (isAllBranches) return false;
    return closingRecords.some(
      (c) => c.date === APP_TODAY && (c.branchId === activeBranchId || (!c.branchId && activeBranchId === 'BR-001'))
    );
  }, [closingRecords, isAllBranches, activeBranchId]);

  // Multi-branch ERP filtered state projections
  const activeBranchFilteredMembers = useMemo(() => {
    if (isAllBranches) return members;
    return members.filter((m) => m.branchId === activeBranchId || (!m.branchId && activeBranchId === 'BR-001'));
  }, [members, isAllBranches, activeBranchId]);

  const activeBranchFilteredTransactions = useMemo(() => {
    if (isAllBranches) return transactions;
    return transactions.filter((t) => t.branchId === activeBranchId || (!t.branchId && activeBranchId === 'BR-001'));
  }, [transactions, isAllBranches, activeBranchId]);

  const activeBranchFilteredAttendances = useMemo(() => {
    if (isAllBranches) return attendances;
    return attendances.filter((a) => a.branchId === activeBranchId || (!a.branchId && activeBranchId === 'BR-001'));
  }, [attendances, isAllBranches, activeBranchId]);

  const activeBranchFilteredStaffAttendances = useMemo(() => {
    if (isAllBranches) return staffAttendances;
    return staffAttendances.filter((s) => s.branchId === activeBranchId || (!s.branchId && activeBranchId === 'BR-001'));
  }, [staffAttendances, isAllBranches, activeBranchId]);

  const activeBranchFilteredStaffUsers = useMemo(() => {
    if (isAllBranches) return staffUsers;
    return staffUsers.filter(
      (s) =>
        s.branchId === activeBranchId ||
        (!s.branchId && activeBranchId === 'BR-001') ||
        (s.allowedBranchIds && s.allowedBranchIds.includes(activeBranchId))
    );
  }, [staffUsers, isAllBranches, activeBranchId]);

  const activeBranchFilteredPettyCash = useMemo(() => {
    if (isAllBranches) return pettyCashList;
    return pettyCashList.filter((p) => p.branchId === activeBranchId || (!p.branchId && activeBranchId === 'BR-001'));
  }, [pettyCashList, isAllBranches, activeBranchId]);

  const activeBranchFilteredClosings = useMemo(() => {
    if (isAllBranches) return closingRecords;
    return closingRecords.filter((c) => c.branchId === activeBranchId || (!c.branchId && activeBranchId === 'BR-001'));
  }, [closingRecords, isAllBranches, activeBranchId]);

  const activeBranchFilteredAssets = useMemo(() => {
    if (isAllBranches) return gymAssets;
    return gymAssets.filter((a) => a.branchId === activeBranchId || (!a.branchId && activeBranchId === 'BR-001'));
  }, [gymAssets, isAllBranches, activeBranchId]);

  const activeBranchFilteredLeads = useMemo(() => {
    if (isAllBranches) return leads;
    return leads.filter((l) => l.branchId === activeBranchId || (!l.branchId && activeBranchId === 'BR-001'));
  }, [leads, isAllBranches, activeBranchId]);

  // Global Modals
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [activeIDCardMember, setActiveIDCardMember] = useState<Member | null>(null);
  const [activeDetailMember, setActiveDetailMember] = useState<Member | null>(null);

  // Digital Signature Modal state for 3-party validation
  const [sigModal, setSigModal] = useState<{
    isOpen: boolean;
    scheduleId: string;
    role: 'valStaf' | 'valTrainer' | 'valMember' | null;
    title: string;
  }>({
    isOpen: false,
    scheduleId: '',
    role: null,
    title: ''
  });

  // Toast System
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showToast = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Synchronize to localStorage
  useEffect(() => {
    localStorage.setItem('rfa_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('rfa_staff', JSON.stringify(staffUsers));
  }, [staffUsers]);

  useEffect(() => {
    localStorage.setItem('rfa_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('rfa_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('rfa_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('rfa_pettycash', JSON.stringify(pettyCashList));
  }, [pettyCashList]);

  useEffect(() => {
    localStorage.setItem('rfa_closing', JSON.stringify(closingRecords));
  }, [closingRecords]);

  useEffect(() => {
    localStorage.setItem('rfa_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('rfa_followups', JSON.stringify(followUps));
  }, [followUps]);

  // Firebase Boot Connectivity Test & Cloud Firestore Synchronization
  useEffect(() => {
    // 1. Mandatory connection test
    testConnection().then((connected) => {
      setFirebaseConnected(connected);
    });

    let unsubMembers: (() => void) | undefined;
    let unsubTrx: (() => void) | undefined;
    let unsubReservations: (() => void) | undefined;

    // 2. Auth State Listener - Only attach onSnapshot listeners if auth is ready and user is authenticated
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseConnected(true);
        // Seed initial mock records if cloud database is empty
        seedInitialFirestoreData(INITIAL_MEMBERS, INITIAL_TRANSACTIONS).catch(() => {});

        // Clean up previous listeners if any
        if (unsubMembers) unsubMembers();
        if (unsubTrx) unsubTrx();
        if (unsubReservations) unsubReservations();

        // 3. Real-Time Cloud Subscribers (merges cloud changes)
        try {
          unsubMembers = subscribeMembers(
            (cloudMembers) => {
              if (cloudMembers && cloudMembers.length > 0) {
                setMembers((prev) => {
                  const map = new Map(prev.map((m) => [m.id, m]));
                  cloudMembers.forEach((cm) => map.set(cm.id, { ...map.get(cm.id), ...cm }));
                  return Array.from(map.values());
                });
              }
            },
            () => {}
          );

          unsubTrx = subscribeTransactions(
            (cloudTrx) => {
              if (cloudTrx && cloudTrx.length > 0) {
                setTransactions((prev) => {
                  const map = new Map(prev.map((t) => [t.id, t]));
                  cloudTrx.forEach((ct) => map.set(ct.id, { ...map.get(ct.id), ...ct }));
                  return Array.from(map.values());
                });
              }
            },
            () => {}
          );

          unsubReservations = subscribeReservations(
            (cloudRes) => {
              if (cloudRes && cloudRes.length > 0) {
                setReservations((prev) => {
                  const map = new Map(prev.map((r) => [r.id, r]));
                  cloudRes.forEach((cr) => map.set(cr.id, { ...map.get(cr.id), ...cr }));
                  return Array.from(map.values());
                });
              }
            },
            () => {}
          );
        } catch (e) {
          console.warn('Firestore subscription initialized in local fallback mode:', e);
        }
      } else {
        // When user is not authenticated with Firebase Auth, clean up active cloud subscriptions
        if (unsubMembers) {
          unsubMembers();
          unsubMembers = undefined;
        }
        if (unsubTrx) {
          unsubTrx();
          unsubTrx = undefined;
        }
        if (unsubReservations) {
          unsubReservations();
          unsubReservations = undefined;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubMembers) unsubMembers();
      if (unsubTrx) unsubTrx();
      if (unsubReservations) unsubReservations();
    };
  }, []);

  // Handler: Switch User
  const handleSwitchUser = (userId: string) => {
    const found = staffUsers.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('rfa_current_user_id', found.id);
      if (found.branchId && found.role !== 'admin' && found.role !== 'manager') {
        setActiveBranchId(found.branchId);
      }
      if (found.role === 'leader_pt') {
        setActiveTab('leader-pt');
      } else if (found.role === 'pt') {
        setActiveTab('trainer-portal');
      } else if (found.role === 'kasir') {
        setActiveTab('front-desk-portal');
      }
      showToast('Ganti Pengguna', `Beralih ke akun ${found.name} (${found.roleName}).`, 'info');
    }
  };

  // Handler: Login
  const handleLogin = (user: User, rememberMe = true) => {
    if (rememberMe) {
      localStorage.setItem('rfa_session_active', 'true');
      localStorage.setItem('rfa_current_user_id', user.id);
    } else {
      localStorage.removeItem('rfa_session_active');
      localStorage.setItem('rfa_current_user_id', user.id);
    }
    setCurrentUser(user);
    if (user.branchId && user.role !== 'admin' && user.role !== 'manager') {
      setActiveBranchId(user.branchId);
    }
    if (user.role === 'leader_pt') {
      setActiveTab('leader-pt');
    } else if (user.role === 'pt') {
      setActiveTab('trainer-portal');
    } else if (user.role === 'kasir') {
      setActiveTab('front-desk-portal');
    } else {
      setActiveTab('dashboard');
    }
    showToast('Login Berhasil', `Selamat datang kembali, ${user.name}! Shift: ${user.shift}`, 'success');
  };

  // Handler: Logout
  const handleLogout = () => {
    localStorage.removeItem('rfa_session_active');
    localStorage.removeItem('rfa_current_user_id');
    setCurrentUser(null);
    logOutFirebase().catch(() => {});
    showToast('Logout Berhasil', 'Anda telah keluar dari sesi kerja. Silakan login kembali untuk melanjutkan.', 'info');
  };

  // Handler: Freeze Member (Cuti Sementara)
  const handleFreezeMember = (record: MemberFreezeRecord, precalculatedMember?: Member) => {
    setFreezeRecords((prev) => [record, ...prev]);

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === record.memberId) {
          const updated: Member = precalculatedMember || {
            ...m,
            status: 'FREEZE',
            isFrozen: true,
            freezeStartDate: record.startDate,
            freezePlannedEndDate: record.plannedEndDate,
            freezeReason: record.reason,
            freezeDays: record.freezeDays || record.plannedDays,
            previousStatus: (record.previousStatus as MembershipStatus) || 'AKTIF',
            expired: record.newAdjustedExpiredDate || record.adjustedExpiryDate || m.expired,
            lastFreezeRecordId: record.id
          };
          saveMemberToFirestore(updated).catch(() => {});
          return updated;
        }
        return m;
      })
    );

    // Record optional admin fee transaction to cash flow
    if (record.adminFee && record.adminFee > 0) {
      const feeTrx: Transaction = {
        id: 'TRX-FRZ-' + Math.floor(100000 + Math.random() * 900000),
        date: record.startDate || APP_TODAY,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        type: 'Membership',
        customer: record.memberName,
        memberId: record.memberId,
        desc: `Biaya Admin Freeze Membership (${record.plannedDays} Hari) - ${record.reason}`,
        amount: record.adminFee,
        method: 'Tunai',
        status: 'Paid',
        cashier: record.staffName || currentUser?.name || 'Kasir',
        initialCashPaid: record.adminFee,
        amountPaid: record.adminFee,
        amountRemaining: 0
      };
      setTransactions((tPrev) => [feeTrx, ...tPrev]);
      saveTransactionToFirestore(feeTrx).catch(() => {});
    }

    const daysCount = record.freezeDays || record.plannedDays;
    const newExp = record.newAdjustedExpiredDate || record.adjustedExpiryDate || '';
    showToast(
      'Membership Dibekukan (Freeze)',
      `Keanggotaan ${record.memberName} berhasil di-freeze selama ${daysCount} hari hingga ${record.plannedEndDate}. Masa aktif otomatis disesuaikan menjadi ${newExp}.`,
      'success'
    );
  };

  // Handler: Unfreeze Member (Aktifkan Kembali)
  const handleUnfreezeMember = (
    memberId: string,
    unfreezeDate: string,
    actualDays: number,
    newExpiredDate: string,
    notes?: string
  ) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;

    setFreezeRecords((prev) =>
      prev.map((r) => {
        if (
          r.memberId === memberId &&
          (r.status === 'FREEZE' || r.status === 'AKTIF' || r.id === targetMember.lastFreezeRecordId)
        ) {
          return {
            ...r,
            status: 'SELESAI',
            actualEndDate: unfreezeDate,
            actualDays: actualDays,
            adjustedExpiryDate: newExpiredDate,
            unfreezeNotes: notes || 'Diaktifkan kembali oleh staf',
            unfreezeStaffId: currentUser?.id,
            unfreezeStaffName: currentUser?.name
          };
        }
        return r;
      })
    );

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const updated: Member = {
            ...m,
            status: 'AKTIF',
            isFrozen: false,
            freezeStartDate: undefined,
            freezePlannedEndDate: undefined,
            freezeReason: undefined,
            freezeDays: undefined,
            expired: newExpiredDate
          };
          saveMemberToFirestore(updated).catch(() => {});
          return updated;
        }
        return m;
      })
    );

    showToast(
      'Membership Diaktifkan Kembali (Unfreeze)',
      `Keanggotaan ${targetMember.name} kini kembali AKTIF. Durasi freeze aktual: ${actualDays} hari. Masa aktif baru: ${newExpiredDate}.`,
      'success'
    );
  };

  // Handler: Purchase Package
  const handlePurchasePackage = (newTrx: Transaction, updatedMembersList: Member[]) => {
    const branchIdToTag = newTrx.branchId || (isAllBranches ? (branches[0]?.id || 'BR-001') : activeBranchId);
    const branchNameToTag = newTrx.branchName || (activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.name || 'GymPro Flagship Kelapa Gading') : activeBranch.name);

    const stampedTrx: Transaction = {
      ...newTrx,
      branchId: branchIdToTag,
      branchName: branchNameToTag
    };

    setTransactions([stampedTrx, ...transactions]);

    // Cloud Firestore Sync
    saveTransactionToFirestore(stampedTrx).catch(() => {});
    updatedMembersList.forEach((m) => {
      const stampedMem: Member = {
        ...m,
        branchId: m.branchId || branchIdToTag,
        branchName: m.branchName || branchNameToTag
      };
      saveMemberToFirestore(stampedMem).catch(() => {});
    });

    // If this is a PT package, record it in ptPurchases for performance tracking & generate trainer commissions
    if (newTrx.type === 'PT') {
      const matchedPkg = packages.find((p) => newTrx.desc.includes(p.name));
      const totalSess = matchedPkg ? matchedPkg.value : 10;
      const trainerObj = staffUsers.find((u) => u.id === newTrx.picId) || currentUser;

      const newPtCommissions: TrainerCommissionRecord[] = [];

      updatedMembersList.forEach((mem) => {
        const memberTrainer = staffUsers.find((u) => u.id === mem.picId) || trainerObj;
        const participantPrice = Math.round(newTrx.amount / (updatedMembersList.length || 1));
        const newPurchase: PTPurchaseRecord = {
          id: 'PUR-' + Math.floor(100000 + Math.random() * 900000),
          date: newTrx.date || APP_TODAY,
          memberId: mem.id,
          memberName: mem.name,
          trainerId: memberTrainer?.id || mem.picId || 'S03',
          trainerName: memberTrainer?.name || mem.picName || 'Citra Lestari',
          packageId: matchedPkg?.id || 'PK09',
          packageName: matchedPkg?.name || newTrx.desc.replace('Paket ', ''),
          totalSessions: totalSess,
          completedSessions: 0,
          price: participantPrice,
          status: 'Active',
          notes: `Pembelian baru via ${newTrx.method}`
        };
        setPtPurchases((prev) => [newPurchase, ...prev]);

        // Generate Trainer Commission record from package configuration
        const commRate = matchedPkg?.trainerCommissionRate ?? 40;
        const commAmt = matchedPkg?.trainerCommissionNominal
          ? Math.round(matchedPkg.trainerCommissionNominal / (updatedMembersList.length || 1))
          : Math.round((participantPrice * commRate) / 100);
        const perSessAmt = matchedPkg?.trainerCommissionPerSession || Math.round(commAmt / (totalSess || 1));

        newPtCommissions.push({
          id: 'COMM-' + Math.floor(100000 + Math.random() * 900000),
          commissionId: 'COMM-' + Math.floor(100000 + Math.random() * 900000),
          trxId: newTrx.id,
          transactionId: newTrx.id,
          bundleId: matchedPkg?.id || 'PKG-PT',
          bundleCode: matchedPkg?.id || 'PT',
          bundleName: matchedPkg?.name || newTrx.desc,
          trainerId: memberTrainer?.id || mem.picId || 'S03',
          trainerName: memberTrainer?.name || mem.picName || 'Citra Lestari',
          memberId: mem.id,
          memberName: mem.name,
          date: newTrx.date || APP_TODAY,
          ptComponentValue: participantPrice,
          commissionRate: commRate,
          commissionAmount: commAmt,
          commissionPerSession: perSessAmt,
          totalSessions: totalSess,
          paymentStatus: 'LUNAS',
          validationStatus: 'PENDING',
          valStatus: 'PENDING',
          status: 'ACTIVE',
          notes: `Komisi PT dari paket ${matchedPkg?.name || newTrx.desc}`
        });
      });

      if (newPtCommissions.length > 0) {
        setTrainerCommissions((prev) => [...newPtCommissions, ...prev]);
      }
    }

    // If this is a Class package, generate Instructor Commission records
    if (newTrx.type === 'Class') {
      const matchedPkg = packages.find((p) => newTrx.desc.includes(p.name)) || packages.find((p) => p.cat === 'Class' && p.id === newTrx.classPackageId);
      const totalSess = matchedPkg?.sessionCount || matchedPkg?.value || 1;
      const commRate = matchedPkg?.trainerCommissionRate || 35;

      const newClassCommissions: TrainerCommissionRecord[] = [];
      updatedMembersList.forEach((mem) => {
        const participantPrice = Math.round(newTrx.amount / (updatedMembersList.length || 1));
        const commAmt = matchedPkg?.trainerCommissionNominal
          ? Math.round(matchedPkg.trainerCommissionNominal / (updatedMembersList.length || 1))
          : Math.round((participantPrice * commRate) / 100);
        const perSessAmt = matchedPkg?.trainerCommissionPerSession || Math.round(commAmt / (totalSess || 1));
        const instructorObj = staffUsers.find((u) => u.id === mem.picId) || staffUsers.find((u) => u.role === 'pt' || u.role === 'leader_pt') || currentUser;

        newClassCommissions.push({
          id: 'COMM-CLS-' + Math.floor(100000 + Math.random() * 900000),
          commissionId: 'COMM-CLS-' + Math.floor(100000 + Math.random() * 900000),
          trxId: newTrx.id,
          transactionId: newTrx.id,
          bundleId: matchedPkg?.id || 'PKG-CLASS',
          bundleCode: matchedPkg?.id || 'CLASS',
          bundleName: matchedPkg?.name || newTrx.desc,
          trainerId: instructorObj?.id || 'S03',
          trainerName: instructorObj?.name || 'Instruktur Kelas Studio',
          memberId: mem.id,
          memberName: mem.name,
          date: newTrx.date || APP_TODAY,
          ptComponentValue: participantPrice,
          commissionRate: commRate,
          commissionAmount: commAmt,
          commissionPerSession: perSessAmt,
          totalSessions: totalSess,
          paymentStatus: 'LUNAS',
          validationStatus: 'PENDING',
          valStatus: 'PENDING',
          status: 'ACTIVE',
          notes: `Komisi Instruktur Kelas (${matchedPkg?.classCategory || 'Studio'}) dari ${matchedPkg?.name || newTrx.desc}`
        });
      });

      if (newClassCommissions.length > 0) {
        setTrainerCommissions((prev) => [...newClassCommissions, ...prev]);
      }
    }

    // If this is a Bundling package, generate MemberMembershipRecord, PTPurchaseRecord, and TrainerCommission
    if (newTrx.type === 'Bundling') {
      const bundle = bundlePackages.find(
        (b) => b.bundleId === newTrx.bundleId || b.bundleCode === newTrx.bundleCode
      );

      if (bundle) {
        // 1. Create MemberMembershipRecord for each participant
        const membershipItem = bundle.items.find((i) => i.itemType === 'MEMBERSHIP');
        const newMemberships: MemberMembershipRecord[] = updatedMembersList.map((mem) => ({
          id: 'MEM-' + Math.floor(100000 + Math.random() * 900000),
          membershipRecordId: 'MEM-' + Math.floor(100000 + Math.random() * 900000),
          memberId: mem.id,
          memberName: mem.name,
          packageName: bundle.bundleName,
          bundleId: bundle.bundleId,
          bundleCode: bundle.bundleCode,
          bundleName: bundle.bundleName,
          bundleTrxId: newTrx.id,
          transactionId: newTrx.id,
          membershipPackageId: membershipItem?.membershipPackageId || 'PKG-BUNDLE-M',
          startDate: newTrx.date || APP_TODAY,
          endDate: mem.expired,
          durationDays: bundle.durationDays || membershipItem?.duration || 30,
          durationLabel: membershipItem?.durationLabel || '1 Bulan',
          status: 'AKTIF',
          createdDate: newTrx.date || APP_TODAY,
          source: 'BUNDLING'
        }));
        setMemberMemberships((prev) => [...newMemberships, ...prev]);

        // 2. Create PTPurchaseRecord if bundle includes PT
        const ptItem = bundle.items.find((i) => i.itemType === 'PT');
        if (ptItem) {
          const ptSessions = ptItem.sessionCount || 2;
          const newPtPurchases: PTPurchaseRecord[] = updatedMembersList.map((mem) => {
            const memberTrainer = staffUsers.find((u) => u.id === mem.picId) || currentUser;
            return {
              id: 'PUR-BND-' + Math.floor(100000 + Math.random() * 900000),
              date: newTrx.date || APP_TODAY,
              memberId: mem.id,
              memberName: mem.name,
              trainerId: memberTrainer?.id || mem.picId || 'S03',
              trainerName: memberTrainer?.name || mem.picName || 'Citra Lestari',
              packageId: bundle.bundleId,
              packageName: `${bundle.bundleName} (${ptSessions} Sesi PT)`,
              totalSessions: ptSessions,
              completedSessions: 0,
              price: Math.round((bundle.ptComponentValue || 300000) / (updatedMembersList.length || 1)),
              status: 'Active',
              notes: `Paket Bundling ${bundle.bundleName} (${bundle.bundleCode})`,
              source: 'BUNDLING',
              bundleId: bundle.bundleId,
              bundleCode: bundle.bundleCode,
              ptComponentValue: bundle.ptComponentValue || 300000
            };
          });
          setPtPurchases((prev) => [...newPtPurchases, ...prev]);

          // 3. Create Trainer Commission record for the assigned trainer(s)
          const newCommissions: TrainerCommissionRecord[] = updatedMembersList.map((mem) => {
            const memberTrainer = staffUsers.find((u) => u.id === mem.picId) || currentUser;
            const ptVal = Math.round((bundle.ptComponentValue || 300000) / (updatedMembersList.length || 1));
            const rate = bundle.commissionRate || bundle.trainerCommissionRate || 20;
            const commAmt = Math.round((ptVal * rate) / 100);

            return {
              id: 'COMM-' + Math.floor(100000 + Math.random() * 900000),
              commissionId: 'COMM-' + Math.floor(100000 + Math.random() * 900000),
              trxId: newTrx.id,
              transactionId: newTrx.id,
              bundleId: bundle.bundleId,
              bundleCode: bundle.bundleCode,
              bundleName: bundle.bundleName,
              trainerId: memberTrainer?.id || mem.picId || 'S03',
              trainerName: memberTrainer?.name || mem.picName || 'Trainer',
              memberId: mem.id,
              memberName: mem.name,
              date: newTrx.date || APP_TODAY,
              ptComponentValue: ptVal,
              commissionRate: rate,
              commissionAmount: commAmt,
              paymentStatus: 'LUNAS',
              validationStatus: 'PENDING',
              valStatus: 'PENDING',
              status: 'ACTIVE'
            };
          });
          setTrainerCommissions((prev) => [...newCommissions, ...prev]);
        }

        // 4. Reduce stock for bonus product items
        const productItems = bundle.items.filter((i) => i.itemType === 'PRODUCT' && i.productId);
        if (productItems.length > 0) {
          setProducts((prev) =>
            prev.map((prod) => {
              const matchedItem = productItems.find((pi) => pi.productId === prod.id);
              if (matchedItem) {
                const qtyToDeduct = (matchedItem.productQty || matchedItem.quantity || 1) * (updatedMembersList.length || 1);
                return {
                  ...prod,
                  stock: Math.max(0, prod.stock - qtyToDeduct)
                };
              }
              return prod;
            })
          );
        }

        showToast(
          'Paket Bundling Diaktifkan',
          `Membership & PT untuk ${bundle.bundleName} berhasil diaktifkan untuk ${updatedMembersList.map((m) => m.name).join(', ')}.`,
          'success'
        );
      }
    }

    // 5. Generate Sales Commission records for Closing PIC(s)
    const fallbackStaffId = currentUser?.id || 'S01';
    const closingPicIds = (newTrx.picIds && newTrx.picIds.length > 0)
      ? newTrx.picIds
      : [newTrx.picId || fallbackStaffId];

    let totalSalesCommission = 0;
    let pkgSourceLabel = newTrx.desc;

    if (newTrx.type === 'Bundling') {
      const bundle = bundlePackages.find((b) => b.bundleId === newTrx.bundleId || b.bundleCode === newTrx.bundleCode);
      const bRate = bundle?.salesCommissionRate || 4;
      totalSalesCommission = bundle?.salesCommissionNominal
        ? bundle.salesCommissionNominal
        : Math.round((newTrx.amount * bRate) / 100);
      pkgSourceLabel = bundle?.bundleName || newTrx.desc;
    } else {
      const matchedPkg = packages.find((p) => newTrx.desc.includes(p.name));
      const sRate = matchedPkg?.salesCommissionRate || (newTrx.type === 'Membership' ? 4 : 3);
      totalSalesCommission = matchedPkg?.salesCommissionNominal
        ? matchedPkg.salesCommissionNominal
        : Math.round((newTrx.amount * sRate) / 100);
      pkgSourceLabel = matchedPkg?.name || newTrx.desc;
    }

    if (totalSalesCommission > 0 && closingPicIds.length > 0) {
      const perStaffComm = Math.round(totalSalesCommission / closingPicIds.length);
      const firstMemberName = updatedMembersList.map((m) => m.name).join(', ') || newTrx.customer || 'Member';
      const firstMemberId = updatedMembersList[0]?.id || newTrx.memberId;
      const newSalesRecords: SalesCommissionRecord[] = closingPicIds.map((sId) => {
        const staffObj = staffUsers.find((u) => u.id === sId) || currentUser;
        return {
          id: 'SCOMM-' + Math.floor(100000 + Math.random() * 900000),
          trxId: newTrx.id,
          date: newTrx.date || APP_TODAY,
          staffId: sId,
          staffName: staffObj?.name || 'Staff Kasir',
          memberId: firstMemberId,
          memberName: firstMemberName,
          packageId: newTrx.bundleId || 'PKG',
          packageName: pkgSourceLabel,
          packageCat: (newTrx.type as any) || 'Membership',
          packagePrice: newTrx.amount,
          commissionRate: 0,
          commissionAmount: perStaffComm,
          paymentStatus: 'LUNAS',
          notes: `Komisi penjualan ${pkgSourceLabel} (${closingPicIds.length > 1 ? 'Bagi Tim' : 'Solo'})`
        };
      });
      setSalesCommissions((prev) => [...newSalesRecords, ...prev]);
    }

    // Update members list
    setMembers((prev) =>
      prev.map((m) => {
        const found = updatedMembersList.find((u) => u.id === m.id);
        return found || m;
      })
    );

    // Open receipt modal
    setActiveReceipt(newTrx);
  };

  // Handler: POS Checkout
  const handleProcessCheckout = (newTrx: Transaction, updatedProducts: Product[]) => {
    const branchIdToTag = newTrx.branchId || (isAllBranches ? (branches[0]?.id || 'BR-001') : activeBranchId);
    const branchNameToTag = newTrx.branchName || (activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.name || 'GymPro Flagship Kelapa Gading') : activeBranch.name);

    const stampedTrx: Transaction = {
      ...newTrx,
      branchId: branchIdToTag,
      branchName: branchNameToTag
    };

    setTransactions([stampedTrx, ...transactions]);

    // Keep per-branch stock accurate
    setProducts((prev) =>
      prev.map((origProd) => {
        const updated = updatedProducts.find((up) => up.id === origProd.id);
        if (!updated) return origProd;
        const diff = origProd.stock - updated.stock;
        if (diff > 0 && origProd.branchStocks) {
          const curBranchStock = origProd.branchStocks[branchIdToTag] ?? origProd.stock;
          return {
            ...updated,
            branchStocks: {
              ...origProd.branchStocks,
              [branchIdToTag]: Math.max(0, curBranchStock - diff)
            }
          };
        }
        return updated;
      })
    );

    saveTransactionToFirestore(stampedTrx).catch(() => {});
    setActiveReceipt(stampedTrx);
  };

  // Handler: Pay Installment
  // CRITICAL: prevents revenue double-counting!
  // Updates original transaction's amountRemaining and amountPaid.
  // Inserts a separate PAY-* transaction for today's cash inflow.
  const handlePayInstallment = (payTrx: Transaction, originalTrxId: string, paidAmount: number) => {
    const orig = transactions.find((t) => t.id === originalTrxId);
    const branchIdToTag = orig?.branchId || payTrx.branchId || (isAllBranches ? (branches[0]?.id || 'BR-001') : activeBranchId);
    const branchNameToTag = orig?.branchName || payTrx.branchName || activeBranch.name;
    const stampedPayTrx: Transaction = {
      ...payTrx,
      branchId: branchIdToTag,
      branchName: branchNameToTag
    };

    setTransactions((prev) => {
      const updatedOriginals = prev.map((t) => {
        if (t.id === originalTrxId) {
          const newPaid = (t.amountPaid || 0) + paidAmount;
          const newRemaining = Math.max((t.amountRemaining || 0) - paidAmount, 0);
          const newStatus = newRemaining <= 0 ? 'Paid' : t.status;
          const updatedTrx = {
            ...t,
            amountPaid: newPaid,
            amountRemaining: newRemaining,
            status: newStatus
          };
          saveTransactionToFirestore(updatedTrx).catch(() => {});
          return updatedTrx;
        }
        return t;
      });
      return [stampedPayTrx, ...updatedOriginals];
    });

    saveTransactionToFirestore(stampedPayTrx).catch(() => {});
    setActiveReceipt(stampedPayTrx);
  };

  // Handler: Batch Pay Installments (Multi-Tagihan / Bayar Semua)
  const handleBatchPayInstallment = (
    payments: { payTrx: Transaction; originalTrxId: string; paidAmount: number }[]
  ) => {
    if (payments.length === 0) return;

    setTransactions((prev) => {
      const paymentMap = new Map<string, number>();
      payments.forEach((p) => {
        paymentMap.set(p.originalTrxId, (paymentMap.get(p.originalTrxId) || 0) + p.paidAmount);
      });

      const newPayTrxs = payments.map((p) => p.payTrx);

      // Save each new pay transaction to Firestore
      newPayTrxs.forEach((payTrx) => {
        saveTransactionToFirestore(payTrx).catch(() => {});
      });

      const updatedTransactions = prev.map((t) => {
        if (paymentMap.has(t.id)) {
          const paidAmount = paymentMap.get(t.id) || 0;
          const newPaid = (t.amountPaid || 0) + paidAmount;
          const newRemaining = Math.max((t.amountRemaining || 0) - paidAmount, 0);
          const newStatus = newRemaining <= 0 ? 'Paid' : t.status;
          const updatedTrx = {
            ...t,
            amountPaid: newPaid,
            amountRemaining: newRemaining,
            status: newStatus
          };
          saveTransactionToFirestore(updatedTrx).catch(() => {});
          return updatedTrx;
        }
        return t;
      });

      return [...newPayTrxs, ...updatedTransactions];
    });

    // Set active receipt to the first payment
    if (payments.length > 0) {
      setActiveReceipt(payments[0].payTrx);
    }
  };

  // Handler: Void Transaction
  const handleVoidTransaction = (trxId: string, reason: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === trxId) {
          return {
            ...t,
            status: 'VOID',
            desc: `${t.desc} [VOID: ${reason}]`,
            initialCashPaid: 0,
            amountRemaining: 0
          };
        }
        return t;
      })
    );

    // If POS items were sold in this transaction, restock products automatically
    const targetTrx = transactions.find((t) => t.id === trxId);
    if (targetTrx && targetTrx.itemsJSON) {
      try {
        const items: { name: string; qty?: number }[] = JSON.parse(targetTrx.itemsJSON);
        setProducts((prevProd) =>
          prevProd.map((p) => {
            const match = items.find((i) => i.name === p.name);
            if (match && match.qty) {
              return { ...p, stock: p.stock + match.qty };
            }
            return p;
          })
        );
      } catch {
        // ignore parse error
      }
    }

    // If Bundling transaction was voided, cancel commissions and membership records
    if (targetTrx && targetTrx.type === 'Bundling') {
      setMemberMemberships((prev) =>
        prev.map((m) =>
          m.transactionId === trxId || m.bundleTrxId === trxId ? { ...m, status: 'EXPIRED' } : m
        )
      );
      setPtPurchases((prev) =>
        prev.map((p) =>
          p.bundleTrxId === trxId || (p.bundleId === targetTrx.bundleId && p.date === targetTrx.date)
            ? { ...p, status: 'Cancelled' }
            : p
        )
      );
      setTrainerCommissions((prev) =>
        prev.map((c) =>
          c.transactionId === trxId || c.trxId === trxId
            ? { ...c, status: 'CANCELLED', valStatus: 'CANCELLED', validationStatus: 'CANCELLED' }
            : c
        )
      );
    }

    showToast('Transaksi VOID', `Transaksi #${trxId} berhasil dibatalkan (status: VOID). Saldo kas dan rekonsiliasi telah disesuaikan.`, 'warning');
  };

  // Handlers for Bundling Package Management
  const handleSaveBundlePackage = (bundle: BundlePackage, isNew?: boolean) => {
    const shouldAdd = isNew ?? !bundlePackages.some((b) => b.bundleId === bundle.bundleId);
    if (shouldAdd) {
      setBundlePackages([bundle, ...bundlePackages.filter((b) => b.bundleId !== bundle.bundleId)]);
      showToast('Bundling Dibuat', `Paket bundling ${bundle.bundleName} (${bundle.bundleCode}) berhasil disimpan.`, 'success');
    } else {
      setBundlePackages(bundlePackages.map((b) => (b.bundleId === bundle.bundleId ? bundle : b)));
      showToast('Bundling Diperbarui', `Paket bundling ${bundle.bundleName} berhasil diperbarui.`, 'success');
    }
  };

  const handleDeleteBundlePackage = (bundleId: string) => {
    const target = bundlePackages.find((b) => b.bundleId === bundleId);
    setBundlePackages(bundlePackages.filter((b) => b.bundleId !== bundleId));
    showToast('Bundling Dihapus', `Paket bundling ${target?.bundleName || ''} telah dihapus.`, 'warning');
  };

  // Handler: Correct / Update Payment Method
  const handleUpdatePaymentMethod = (
    trxId: string,
    newMethod: 'Tunai' | 'Transfer' | 'QRIS' | 'EDC' | 'Kasbon',
    newBankDest?: string,
    reason?: string
  ) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === trxId) {
          const oldMethodDesc = `${t.method}${t.bankDest ? ` (${t.bankDest})` : ''}`;
          const newMethodDesc = `${newMethod}${newBankDest ? ` (${newBankDest})` : ''}`;
          const note = reason
            ? ` [Koreksi Metode: ${oldMethodDesc} -> ${newMethodDesc} (${reason})]`
            : ` [Koreksi Metode: ${oldMethodDesc} -> ${newMethodDesc}]`;

          let newInitialCash = t.initialCashPaid;
          if (newMethod === 'Tunai') {
            newInitialCash = t.amountPaid || t.amount;
          } else if (t.method === 'Tunai') {
            newInitialCash = 0;
          }

          let newStatus = t.status;
          let newRemaining = t.amountRemaining;
          if (newMethod === 'Kasbon' && t.status === 'Paid') {
            newStatus = 'BELUM LUNAS';
            newRemaining = t.amount;
          } else if (t.method === 'Kasbon' && t.status === 'BELUM LUNAS') {
            newStatus = 'Paid';
            newRemaining = 0;
          }

          return {
            ...t,
            method: newMethod,
            bankDest: newBankDest || (newMethod === 'Transfer' ? 'Mandiri' : undefined),
            desc: `${t.desc}${note}`,
            initialCashPaid: newInitialCash,
            status: newStatus,
            amountRemaining: newRemaining
          };
        }
        return t;
      })
    );

    showToast(
      'Metode Berhasil Diperbarui',
      `Metode pembayaran transaksi #${trxId} diubah menjadi ${newMethod}${newBankDest ? ` (${newBankDest})` : ''}.`,
      'success'
    );
  };

  // Handler: Daily Closing Execution
  const handleExecuteDailyClosing = (record: DailyClosingRecord) => {
    const branchIdToTag = record.branchId || (isAllBranches ? (branches[0]?.id || 'BR-001') : activeBranchId);
    const branchNameToTag = record.branchName || (activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.name || 'GymPro Flagship Kelapa Gading') : activeBranch.name);
    const stampedRecord: DailyClosingRecord = {
      ...record,
      branchId: branchIdToTag,
      branchName: branchNameToTag
    };
    setClosingRecords([stampedRecord, ...closingRecords]);
    showToast('Tutup Kasir Berhasil', `Closing harian cabang ${branchNameToTag} telah tersimpan.`, 'success');
  };

  // Handler: Member Attendance & Locker Assignment
  const handleAddAttendance = (newAtt: Attendance, updatedMember?: Member) => {
    const branchIdToTag = newAtt.branchId || (isAllBranches ? (branches[0]?.id || 'BR-001') : activeBranchId);
    const branchNameToTag = newAtt.branchName || (activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.name || 'GymPro Flagship Kelapa Gading') : activeBranch.name);
    const stampedAtt: Attendance = {
      ...newAtt,
      branchId: branchIdToTag,
      branchName: branchNameToTag
    };
    setAttendances([stampedAtt, ...attendances]);
    saveAttendanceToFirestore(stampedAtt).catch(() => {});
    if (updatedMember) {
      const stampedMember: Member = {
        ...updatedMember,
        branchId: updatedMember.branchId || branchIdToTag,
        branchName: updatedMember.branchName || branchNameToTag
      };
      setMembers((prev) => prev.map((m) => (m.id === stampedMember.id ? stampedMember : m)));
      saveMemberToFirestore(stampedMember).catch(() => {});
    }

    // Auto-occupy assigned locker
    if (newAtt.lockerNumber) {
      const lockerNum =
        typeof newAtt.lockerNumber === 'string'
          ? parseInt(newAtt.lockerNumber.replace(/\D/g, ''), 10)
          : newAtt.lockerNumber;

      if (lockerNum) {
        setLockers((prev) =>
          prev.map((l) =>
            l.number === lockerNum
              ? {
                  ...l,
                  isOccupied: true,
                  memberId: newAtt.memberId,
                  memberName: newAtt.memberName,
                  timeIn: newAtt.timeIn,
                  hasTowel: newAtt.hasTowel ?? true,
                  status: 'Terpakai'
                }
              : l
          )
        );
      }
    }
  };

  const handleCheckoutMember = (attId: string) => {
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const targetAtt = attendances.find((a) => a.id === attId);

    setAttendances((prev) =>
      prev.map((a) => (a.id === attId ? { ...a, timeOut: timeNow, lockerReturned: true } : a))
    );

    // Release locker automatically upon checkout
    if (targetAtt && targetAtt.lockerNumber) {
      const lockerNum =
        typeof targetAtt.lockerNumber === 'string'
          ? parseInt(targetAtt.lockerNumber.replace(/\D/g, ''), 10)
          : targetAtt.lockerNumber;

      if (lockerNum) {
        setLockers((prev) =>
          prev.map((l) =>
            l.number === lockerNum
              ? {
                  ...l,
                  isOccupied: false,
                  memberId: undefined,
                  memberName: undefined,
                  timeIn: undefined,
                  hasTowel: false,
                  status: 'Tersedia'
                }
              : l
          )
        );
      }
    }

    showToast(
      'Check-Out Berhasil',
      `Member ${targetAtt?.memberName || ''} telah checkout${
        targetAtt?.lockerNumber ? ` & Kunci Loker #${targetAtt.lockerNumber} telah dikembalikan ke meja resepsionis.` : '.'
      }`,
      'info'
    );
  };

  const handleReleaseLocker = (lockerNum: number) => {
    setLockers((prev) =>
      prev.map((l) =>
        l.number === lockerNum
          ? {
              ...l,
              isOccupied: false,
              memberId: undefined,
              memberName: undefined,
              timeIn: undefined,
              hasTowel: false,
              status: 'Tersedia'
            }
          : l
      )
    );
    showToast('Kunci Loker Dikembalikan', `Loker #${lockerNum} kini tersedia kembali.`, 'success');
  };

  const handleSwapLocker = (oldLockerNum: number, newLockerNum: number) => {
    setLockers((prev) => {
      const oldSlot = prev.find((l) => l.number === oldLockerNum);
      if (!oldSlot || !oldSlot.isOccupied) return prev;

      return prev.map((l) => {
        if (l.number === oldLockerNum) {
          return {
            ...l,
            isOccupied: false,
            memberId: undefined,
            memberName: undefined,
            timeIn: undefined,
            hasTowel: false,
            status: 'Tersedia'
          };
        }
        if (l.number === newLockerNum) {
          return {
            ...l,
            isOccupied: true,
            memberId: oldSlot.memberId,
            memberName: oldSlot.memberName,
            timeIn: oldSlot.timeIn,
            hasTowel: oldSlot.hasTowel,
            status: 'Terpakai'
          };
        }
        return l;
      });
    });

    // Update ongoing attendance record
    const oldSlot = lockers.find((l) => l.number === oldLockerNum);
    if (oldSlot && oldSlot.memberId) {
      setAttendances((prev) =>
        prev.map((a) =>
          (a.memberId === oldSlot.memberId || a.memberName === oldSlot.memberName) && !a.timeOut
            ? { ...a, lockerNumber: newLockerNum }
            : a
        )
      );
    }

    showToast('Tukar Loker Berhasil', `Kunci dipindahkan dari Loker #${oldLockerNum} ke Loker #${newLockerNum}.`, 'success');
  };

  // Handler: Staff Attendance Clock In/Out
  const handleStaffClock = (record: StaffAttendance) => {
    setStaffAttendances((prev) => {
      const idx = prev.findIndex((s) => s.id === record.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });
  };

  const handleDeleteStaffAttendance = (id: string) => {
    setStaffAttendances((prev) => prev.filter((s) => s.id !== id));
    showToast('Presensi Dihapus', 'Data presensi berhasil dihapus.', 'info');
  };

  const handleSaveWorkSchedule = (schedule: WorkSchedule, isNew: boolean) => {
    setWorkSchedules((prev) => {
      const idx = prev.findIndex((s) => s.id === schedule.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = schedule;
        return copy;
      }
      return [schedule, ...prev];
    });
    showToast('Jadwal Disimpan', `Jadwal shift ${schedule.staffName} (${schedule.shift}) berhasil diperbarui.`, 'success');
  };

  const handleDeleteWorkSchedule = (id: string) => {
    setWorkSchedules((prev) => prev.filter((s) => s.id !== id));
    showToast('Jadwal Dihapus', 'Jadwal shift staf berhasil dihapus.', 'info');
  };

  const handleSwapWorkSchedule = (staffId1: string, staffId2: string, date: string) => {
    const staff1 = staffUsers.find((s) => s.id === staffId1);
    const staff2 = staffUsers.find((s) => s.id === staffId2);
    if (!staff1 || !staff2) return;

    setWorkSchedules((prev) => {
      const sch1 = prev.find((s) => (s.staffId === staffId1 || s.staffName === staff1.name) && s.date === date);
      const sch2 = prev.find((s) => (s.staffId === staffId2 || s.staffName === staff2.name) && s.date === date);

      const shift1 = sch1 ? sch1.shift : (staff1.shift || 'Pagi');
      const shift2 = sch2 ? sch2.shift : (staff2.shift || 'Siang');

      const updated = prev.filter(
        (s) =>
          !((s.staffId === staffId1 || s.staffName === staff1.name || s.staffId === staffId2 || s.staffName === staff2.name) &&
            s.date === date)
      );

      const newSch1: WorkSchedule = {
        id: sch1?.id || `WS-${date.replace(/-/g, '')}-${staffId1}`,
        staffId: staffId1,
        staffName: staff1.name,
        role: staff1.roleName,
        date,
        shift: shift2 as any,
        startTime: sch2 ? sch2.startTime : '14:00',
        endTime: sch2 ? sch2.endTime : '22:00',
        status: shift2 === 'Off' ? 'Off' : 'Scheduled',
        notes: `Tukar shift dengan ${staff2.name}`
      };

      const newSch2: WorkSchedule = {
        id: sch2?.id || `WS-${date.replace(/-/g, '')}-${staffId2}`,
        staffId: staffId2,
        staffName: staff2.name,
        role: staff2.roleName,
        date,
        shift: shift1 as any,
        startTime: sch1 ? sch1.startTime : '06:00',
        endTime: sch1 ? sch1.endTime : '14:00',
        status: shift1 === 'Off' ? 'Off' : 'Scheduled',
        notes: `Tukar shift dengan ${staff1.name}`
      };

      return [...updated, newSch1, newSch2];
    });

    showToast('Tukar Shift Berhasil', `Jadwal ${staff1.name} & ${staff2.name} pada ${date} berhasil ditukar.`, 'success');
  };

  const handleSaveStaff = (user: User, isNew: boolean) => {
    setStaffUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = user;
        return copy;
      }
      return [...prev, user];
    });
    showToast('Data Karyawan Disimpan', `Profil ${user.name} berhasil disimpan.`, 'success');
  };

  const handleDeleteStaff = (id: string) => {
    setStaffUsers((prev) => prev.filter((u) => u.id !== id));
    showToast('Karyawan Dihapus', 'Data staf berhasil dihapus.', 'info');
  };

  // Handler: Batch Import Members
  const handleBatchImportMembers = (
    importedMembers: Member[],
    mode: 'merge' | 'skip_existing' | 'generate_new'
  ) => {
    setMembers((prev) => {
      let updated: Member[];
      if (mode === 'generate_new') {
        updated = [...prev, ...importedMembers];
      } else if (mode === 'skip_existing') {
        const existingIds = new Set(prev.map((m) => m.id.toUpperCase()));
        const existingPhones = new Set(
          prev.filter((m) => m.phone).map((m) => m.phone.replace(/\D/g, ''))
        );
        const toAdd = importedMembers.filter(
          (im) =>
            !existingIds.has(im.id.toUpperCase()) &&
            (!im.phone || !existingPhones.has(im.phone.replace(/\D/g, '')))
        );
        updated = [...prev, ...toAdd];
      } else {
        // merge / update existing + add new
        const map = new Map<string, Member>();
        prev.forEach((m) => map.set(m.id.toUpperCase(), m));
        importedMembers.forEach((im) => {
          const key = im.id.toUpperCase();
          const existing = map.get(key);
          if (existing) {
            map.set(key, { ...existing, ...im });
          } else {
            map.set(key, im);
          }
        });
        updated = Array.from(map.values());
      }
      try {
        localStorage.setItem('rfa_members', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Cloud firestore sync
    importedMembers.forEach((m) => {
      saveMemberToFirestore(m).catch(() => {});
    });

    showToast(
      'Import Member Berhasil',
      `Berhasil memproses ${importedMembers.length} data member ke dalam sistem.`,
      'success'
    );
  };

  // Handler: Batch Import Staff
  const handleBatchImportStaff = (
    importedStaff: User[],
    mode: 'merge' | 'skip_existing' | 'generate_new'
  ) => {
    setStaffUsers((prev) => {
      let updated: User[];
      if (mode === 'generate_new') {
        updated = [...prev, ...importedStaff];
      } else if (mode === 'skip_existing') {
        const existingIds = new Set(prev.map((s) => s.id.toUpperCase()));
        const existingAccs = new Set(prev.map((s) => (s.accId || '').toLowerCase()));
        const toAdd = importedStaff.filter(
          (is) =>
            !existingIds.has(is.id.toUpperCase()) &&
            !existingAccs.has((is.accId || '').toLowerCase())
        );
        updated = [...prev, ...toAdd];
      } else {
        // merge / update existing + add new
        const map = new Map<string, User>();
        prev.forEach((s) => map.set(s.id.toUpperCase(), s));
        importedStaff.forEach((is) => {
          const key = is.id.toUpperCase();
          const existing = map.get(key);
          if (existing) {
            map.set(key, { ...existing, ...is });
          } else {
            map.set(key, is);
          }
        });
        updated = Array.from(map.values());
      }
      try {
        localStorage.setItem('rfa_staff', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast(
      'Import Karyawan Berhasil',
      `Berhasil memproses ${importedStaff.length} data karyawan ke dalam sistem.`,
      'success'
    );
  };

  const handleSaveLeaveRequest = (leave: LeaveRequest, isNew: boolean) => {
    setLeaveRequests((prev) => [leave, ...prev]);
  };

  const handleApproveLeaveRequest = (id: string, status: 'Approved' | 'Rejected', notes?: string) => {
    const targetLeave = leaveRequests.find((l) => l.id === id);
    setLeaveRequests((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status,
              notes: notes || l.notes,
              approvedAt: new Date().toISOString().substring(0, 10)
            }
          : l
      )
    );

    if (status === 'Approved' && targetLeave && targetLeave.type === 'Cuti Tahunan') {
      const days = targetLeave.daysCount || 1;
      setStaffUsers((prev) =>
        prev.map((u) =>
          u.id === targetLeave.staffId || u.name === targetLeave.staffName
            ? { ...u, leaveQuota: Math.max(0, (u.leaveQuota ?? 12) - days) }
            : u
        )
      );
    }
  };

  // Handler: PT 3-Party Digital Signature Flow
  const handleOpenSignature = (scheduleId: string, targetRole: 'valStaf' | 'valTrainer' | 'valMember') => {
    const sch = schedules.find((s) => s.id === scheduleId);
    if (!sch) return;

    const roleName =
      targetRole === 'valStaf'
        ? 'Staf Operasional'
        : targetRole === 'valTrainer'
        ? `Trainer (${sch.trainer})`
        : `Member (${sch.memberName})`;

    setSigModal({
      isOpen: true,
      scheduleId,
      role: targetRole,
      title: `${sch.memberName} - Sesi ${sch.date} (${roleName})`
    });
  };

  const handleSaveSignature = () => {
    if (!sigModal.scheduleId || !sigModal.role) return;

    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === sigModal.scheduleId) {
          const updated = {
            ...s,
            [sigModal.role!]: true
          };

          // If all 3 parties have signed, complete the session and deduct 1 PT quota
          if (updated.valStaf && updated.valTrainer && updated.valMember) {
            updated.status = 'Selesai';
            // Deduct member quota
            setMembers((mPrev) =>
              mPrev.map((m) => {
                if (m.id === s.memberId || m.name === s.memberName) {
                  return { ...m, ptQuota: Math.max((m.ptQuota || 0) - 1, 0) };
                }
                return m;
              })
            );
            showToast(
              'Validasi 3 Pihak Lengkap',
              `Sesi PT ${s.memberName} telah tervalidasi lengkap (Staf, Trainer, Member). Kuota PT berkurang 1 sesi.`,
              'success'
            );
          } else {
            showToast('Tanda Tangan Tersimpan', 'Tanda tangan digital berhasil diverifikasi.', 'info');
          }

          return updated;
        }
        return s;
      })
    );

    setSigModal({ isOpen: false, scheduleId: '', role: null, title: '' });
  };

  // Handler: Studio Class Booking
  const handleBookStudioClass = (classId: string, memberName: string) => {
    setStudioClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            booked: [...c.booked, memberName]
          };
        }
        return c;
      })
    );

    // If member has class quota, deduct 1 session
    setMembers((prev) =>
      prev.map((m) => {
        if (m.name.toLowerCase() === memberName.toLowerCase() || m.id === memberName) {
          const curQuota = m.classQuota || 0;
          return {
            ...m,
            classQuota: Math.max(0, curQuota - 1)
          };
        }
        return m;
      })
    );

    showToast('Booking Kelas Sukses', `${memberName} berhasil memesan tempat di kelas. Kuota dipotong 1 sesi.`, 'success');
  };

  // Handler: CRM Convert Lead to Member
  const handleConvertLeadToMember = (lead: Lead) => {
    const newMemberId = 'M' + Math.floor(100 + Math.random() * 900);
    const branchIdToTag = lead.branchId || (isAllBranches ? (branches[0]?.id || 'BR-001') : activeBranchId);
    const branchNameToTag = lead.branchName || (activeBranchId === ALL_BRANCHES_ID ? (branches[0]?.name || 'GymPro Flagship Kelapa Gading') : activeBranch.name);
    const newMember: Member = {
      id: newMemberId,
      name: lead.name,
      phone: lead.phone,
      gender: 'L',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      expired: APP_TODAY,
      ptQuota: 0,
      picId: lead.picId || 'S01',
      picName: staffUsers.find((s) => s.id === lead.picId)?.name || 'Admin',
      isPicLocked: true,
      followUpStatus: 'TERDAFTAR MEMBER',
      joinDate: APP_TODAY,
      branchId: branchIdToTag,
      branchName: branchNameToTag
    };

    setMembers([newMember, ...members]);
    saveMemberToFirestore(newMember).catch(() => {});
    showToast(
      'Member Baru Terdaftar',
      `Lead ${lead.name} berhasil dikonversi menjadi Member (${newMemberId}) di ${branchNameToTag}.`,
      'success'
    );
  };

  const piutangCount = transactions.filter(
    (t) => (t.status === 'DP 50%' || t.status === 'BELUM LUNAS') && (t.amountRemaining || 0) > 0
  ).length;

  const freezeCount = members.filter((m) => m.isFrozen || m.status === 'FREEZE').length;

  // Handlers for Online Reservations
  const handleCompleteReservation = (newRes: OnlineReservation) => {
    setReservations((prev) => [newRes, ...prev]);
    saveReservationToFirestore(newRes).catch(() => {});

    // If it's a studio class, also book slot
    if (newRes.classId) {
      handleBookStudioClass(newRes.classId, newRes.customerName);
    }

    // Also auto-add to CRM Leads if not an existing member
    if (!newRes.memberId) {
      const newLead: Lead = {
        id: 'L-' + Math.floor(1000 + Math.random() * 9000),
        name: newRes.customerName,
        phone: newRes.customerPhone,
        source: 'Google / Website',
        status: 'Baru',
        date: APP_TODAY,
        interest: `${newRes.programName} (${newRes.branchName})`,
        notes: `Online Booking: ${newRes.id} - ${newRes.targetDate} (${newRes.timeSlot})`,
        branchId: newRes.branchId,
        branchName: newRes.branchName,
        picId: 'S01'
      };
      setLeads((prev) => [newLead, ...prev]);
      saveLeadToFirestore(newLead).catch(() => {});
    }

    showToast('Reservasi Berhasil', `Tiket ${newRes.id} (${newRes.customerName}) telah tersimpan & slot diamankan.`, 'success');
  };

  const handleCheckinReservation = (resId: string) => {
    setReservations((prev) => {
      const updated = prev.map((r) => (r.id === resId ? { ...r, status: 'COMPLETED' as const } : r));
      const target = updated.find((r) => r.id === resId);
      if (target) saveReservationToFirestore(target).catch(() => {});
      return updated;
    });
  };

  const handleCancelReservation = (resId: string) => {
    setReservations((prev) => {
      const updated = prev.map((r) => (r.id === resId ? { ...r, status: 'CANCELLED' as const } : r));
      const target = updated.find((r) => r.id === resId);
      if (target) saveReservationToFirestore(target).catch(() => {});
      return updated;
    });
  };

  // If user is not logged in as staff, render Landing Page or Staff Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 font-sans selection:bg-orange-500 selection:text-white">
        {guestView === 'landing' ? (
          <LandingPage
            members={members}
            attendances={attendances}
            studioClasses={studioClasses}
            staffUsers={staffUsers}
            onOpenStaffLogin={() => setGuestView('staff-login')}
            isStaffLoggedIn={false}
            onBookStudioClass={handleBookStudioClass}
            reservations={reservations}
            onCompleteReservation={handleCompleteReservation}
            onCancelReservation={handleCancelReservation}
          />
        ) : (
          <LoginPage
            onLogin={handleLogin}
            staffUsers={staffUsers}
            onBackToLanding={() => setGuestView('landing')}
          />
        )}

        {/* FLOATING TOAST NOTIFICATION */}
        {toast.show && (
          <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
            <div
              className={`flex items-start gap-3 p-4 rounded-2xl border shadow-2xl max-w-sm backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                  : toast.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                  : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
              }`}
            >
              <div>
                <h5 className="text-xs font-black uppercase tracking-wider">{toast.title}</h5>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If staff user is in Landing Page preview mode
  if (staffViewMode === 'landing') {
    return (
      <div className="min-h-screen bg-zinc-950 font-sans selection:bg-orange-500 selection:text-white flex flex-col">
        {/* Top ERP Staff Navigation Bar */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 px-4 py-2 text-white text-xs font-bold flex items-center justify-between shadow-xl sticky top-0 z-60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span>
              Mode Pratinjau Portal Publik RFA Gym — Akun Staf: <strong>{currentUser.name}</strong> ({currentUser.roleName || currentUser.role})
            </span>
          </div>
          <button
            onClick={() => setStaffViewMode('erp')}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md border border-white/20"
          >
            <span>← Kembali ke Ruang Kerja ERP</span>
          </button>
        </div>
        <LandingPage
          members={members}
          attendances={attendances}
          studioClasses={studioClasses}
          staffUsers={staffUsers}
          onOpenStaffLogin={() => {}}
          isStaffLoggedIn={true}
          onReturnToERP={() => setStaffViewMode('erp')}
          onBookStudioClass={handleBookStudioClass}
          reservations={reservations}
          onCompleteReservation={handleCompleteReservation}
          onCancelReservation={handleCancelReservation}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        staffUsers={staffUsers}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        isStoreClosed={isStoreClosed}
        firebaseConnected={firebaseConnected}
        onToggleSidebar={handleToggleDesktopSidebar}
        onToggleMobileSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarCollapsed={isDesktopCollapsed}
        onOpenAddBranchModal={() => setIsAddBranchModalOpen(true)}
        onOpenLandingPage={() => setStaffViewMode('landing')}
        onOpenSettings={(subTab) => {
          if (subTab) {
            setActiveTab(`settings-${subTab}` as any);
          } else {
            setActiveTab('settings');
          }
        }}
      />

      {/* Multi-Branch ERP Status Bar */}
      <MultiBranchBar
        memberCount={activeBranchFilteredMembers.length}
        transactionCount={activeBranchFilteredTransactions.filter((t) => t.date === APP_TODAY).length}
        staffCount={activeBranchFilteredStaffUsers.length}
        currentUser={currentUser}
        onOpenBranchManager={() => {
          setActiveTab('settings-branches' as any);
        }}
        onOpenStockTransfer={() => setIsStockTransferModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          currentUser={currentUser}
          isCollapsed={isDesktopCollapsed}
          onToggleCollapse={handleToggleDesktopSidebar}
          isOpenMobile={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          piutangCount={piutangCount}
          freezeCount={freezeCount}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-6 lg:p-8 bg-zinc-950/50 scrollbar-thin scrollbar-thumb-zinc-800 w-full min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={activeBranchFilteredTransactions}
              attendances={activeBranchFilteredAttendances}
              schedules={schedules}
              members={activeBranchFilteredMembers}
              products={products}
              onAddStock={(id, qty) =>
                setProducts(products.map((p) => (p.id === id ? { ...p, stock: p.stock + qty } : p)))
              }
              onNavigateTab={(tab) => setActiveTab(tab)}
              onPayPiutang={(trxId) => {
                setTargetPiutangTrxId(trxId);
                setActiveTab('piutang');
              }}
            />
          )}

          {activeTab === 'leader-pt' && (
            <LeaderPTDashboardView
              members={activeBranchFilteredMembers}
              schedules={schedules}
              staffUsers={activeBranchFilteredStaffUsers}
              staffAttendances={activeBranchFilteredStaffAttendances}
              attendances={activeBranchFilteredAttendances}
              currentUser={currentUser}
              ptPurchases={ptPurchases}
              bundlePackages={bundlePackages}
              transactions={activeBranchFilteredTransactions}
              trainerCommissions={trainerCommissions}
              onUpdateMember={(upMem) => {
                setMembers((prev) => prev.map((m) => (m.id === upMem.id ? upMem : m)));
                saveMemberToFirestore(upMem).catch(console.error);
              }}
              onUpdatePTPurchase={(upP) => {
                setPtPurchases((prev) => prev.map((p) => (p.id === upP.id ? upP : p)));
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenMemberDetail={(m) => setActiveDetailMember(m)}
              onUpdateSchedule={(upSch) =>
                setSchedules(schedules.map((s) => (s.id === upSch.id ? upSch : s)))
              }
              onAddSchedule={(newSch) => setSchedules([...schedules, newSch])}
              showToast={showToast}
            />
          )}

          {activeTab === 'pt-package-performance' && (
            <TrainerPackagePerformanceView
              ptPurchases={ptPurchases}
              staffUsers={activeBranchFilteredStaffUsers}
              packages={packages}
              members={activeBranchFilteredMembers}
              schedules={schedules}
              currentUser={currentUser}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'trainer-portal' && (
            <TrainerPortalView
              currentUser={currentUser}
              staffUsers={activeBranchFilteredStaffUsers}
              onSwitchUser={handleSwitchUser}
              schedules={schedules}
              onAddSchedule={(newSch) => setSchedules([...schedules, newSch])}
              onUpdateSchedule={(upSch) =>
                setSchedules(schedules.map((s) => (s.id === upSch.id ? upSch : s)))
              }
              members={activeBranchFilteredMembers}
              onUpdateMember={(upMem) =>
                setMembers(members.map((m) => (m.id === upMem.id ? upMem : m)))
              }
              ptPurchases={ptPurchases}
              onOpenSignature={handleOpenSignature}
              showToast={showToast}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'front-desk-portal' && (
            <FrontDeskPortalView
              members={activeBranchFilteredMembers}
              attendances={activeBranchFilteredAttendances}
              lockers={lockers}
              onUpdateLockers={setLockers}
              onReleaseLocker={handleReleaseLocker}
              onSwapLocker={handleSwapLocker}
              onAddAttendance={handleAddAttendance}
              onCheckoutMember={handleCheckoutMember}
              onUpdateMember={(upMem) => {
                setMembers((prev) => prev.map((m) => (m.id === upMem.id ? upMem : m)));
                saveMemberToFirestore(upMem).catch(console.error);
              }}
              onAddMember={(newMem) => {
                setMembers((prev) => [newMem, ...prev]);
                saveMemberToFirestore(newMem).catch(console.error);
              }}
              packages={packages}
              bundlePackages={bundlePackages}
              transactions={activeBranchFilteredTransactions}
              onAddTransaction={(trx) => {
                setTransactions((prev) => [trx, ...prev]);
                saveTransactionToFirestore(trx).catch(console.error);
              }}
              currentUser={currentUser}
              staffUsers={activeBranchFilteredStaffUsers}
              schedules={schedules}
              freezeRecords={freezeRecords}
              onOpenFreezeModal={(mem) => {
                setActiveFreezeMember(mem);
                setIsFreezeModalOpen(true);
              }}
              onOpenUnfreezeModal={(mem) => {
                setActiveUnfreezeMember(mem);
                const rec = freezeRecords.find((r) => r.memberId === mem.id && r.status === 'FREEZE');
                setActiveUnfreezeRecord(rec || null);
              }}
              onOpenMemberDetail={(mem) => setActiveDetailMember(mem)}
              onOpenIDCard={(mem) => setActiveIDCardMember(mem)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              showToast={showToast}
              isStoreClosed={isStoreClosed}
              onlineReservations={reservations}
              onCheckinReservation={handleCheckinReservation}
              onCancelReservation={handleCancelReservation}
            />
          )}

          {activeTab === 'membership' && (
            <MembershipView
              packages={packages}
              bundlePackages={bundlePackages}
              members={activeBranchFilteredMembers}
              staffUsers={activeBranchFilteredStaffUsers}
              currentUser={currentUser}
              onPurchasePackage={handlePurchasePackage}
              onAddPackage={(pkg) => setPackages([...packages, pkg])}
              onUpdatePackage={(pkg) => setPackages((prev) => prev.map((p) => (p.id === pkg.id ? pkg : p)))}
              onDeletePackage={(pkgId) => setPackages((prev) => prev.filter((p) => p.id !== pkgId))}
              onOpenBundlingManager={() => setIsBundlingModalOpen(true)}
              onOpenBundlingReports={() => setActiveTab('bundling-reports')}
              isStoreClosed={isStoreClosed}
              showToast={showToast}
            />
          )}

          {activeTab === 'bundling-reports' && (
            <BundlingReportsView
              bundlePackages={bundlePackages}
              transactions={activeBranchFilteredTransactions}
              members={activeBranchFilteredMembers}
              schedules={schedules}
              memberMemberships={memberMemberships}
              ptPurchases={ptPurchases}
              trainerCommissions={trainerCommissions}
              staffUsers={activeBranchFilteredStaffUsers}
              showToast={showToast}
              onNavigateTab={(tab: any) => setActiveTab(tab)}
              onOpenBundlingManager={() => setIsBundlingModalOpen(true)}
              onUpdateCommissionStatus={(commissionId: string, newStatus: string) => {
                setTrainerCommissions((prev) =>
                  prev.map((c) =>
                    c.id === commissionId || c.commissionId === commissionId
                      ? { ...c, valStatus: newStatus, validationStatus: newStatus }
                      : c
                  )
                );
                showToast('Status Komisi Diperbarui', `Komisi #${commissionId} disetujui/diperbarui.`, 'success');
              }}
            />
          )}

          {activeTab === 'pos' && (
            <POSView
              products={products}
              currentUser={currentUser}
              onProcessCheckout={handleProcessCheckout}
              onAddProduct={(prod) => setProducts([...products, prod])}
              onAddStock={(id, qty) =>
                setProducts(products.map((p) => (p.id === id ? { ...p, stock: p.stock + qty } : p)))
              }
              onNavigateTab={(tab) => setActiveTab(tab)}
              isStoreClosed={isStoreClosed}
              showToast={showToast}
            />
          )}

          {activeTab === 'products' && (
            <ProductManagementView
              products={products}
              transactions={activeBranchFilteredTransactions}
              onSaveProduct={(updatedProduct, isNew) => {
                if (isNew) {
                  setProducts([...products, updatedProduct]);
                  showToast('Produk Ditambahkan', `${updatedProduct.name} berhasil didaftarkan ke inventaris.`, 'success');
                } else {
                  setProducts(products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
                  showToast('Produk Diperbarui', `Informasi produk ${updatedProduct.name} berhasil disimpan.`, 'success');
                }
              }}
              onDeleteProduct={(productId) => {
                const target = products.find((p) => p.id === productId);
                setProducts(products.filter((p) => p.id !== productId));
                showToast('Produk Dihapus', `${target?.name || 'Produk'} telah dihapus dari katalog inventaris.`, 'warning');
              }}
              onAddStock={(productId, qty) => {
                setProducts(products.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + qty) } : p)));
                const target = products.find((p) => p.id === productId);
                showToast('Stok Diperbarui', `${qty >= 0 ? '+' : ''}${qty} unit untuk ${target?.name || 'Produk'}.`, 'success');
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'absen' && (
            <AttendanceView
              members={activeBranchFilteredMembers}
              staffUsers={activeBranchFilteredStaffUsers}
              attendances={activeBranchFilteredAttendances}
              staffAttendances={activeBranchFilteredStaffAttendances}
              lockers={lockers}
              onUpdateLockers={setLockers}
              onReleaseLocker={handleReleaseLocker}
              onSwapLocker={handleSwapLocker}
              onAddAttendance={handleAddAttendance}
              onCheckoutMember={handleCheckoutMember}
              onStaffClock={handleStaffClock}
              transactions={activeBranchFilteredTransactions}
              showToast={showToast}
            />
          )}

          {activeTab === 'jadwal-pt' && (
            <JadwalPTView
              schedules={schedules}
              studioClasses={studioClasses}
              members={activeBranchFilteredMembers}
              trainers={activeBranchFilteredStaffUsers.filter((s) => s.role === 'pt' || s.role === 'leader_pt')}
              currentUser={currentUser}
              packages={packages}
              staffUsers={activeBranchFilteredStaffUsers}
              onPurchasePackage={handlePurchasePackage}
              onAddSchedule={(newSch) => setSchedules([...schedules, newSch])}
              onUpdateSchedule={(upSch) =>
                setSchedules(schedules.map((s) => (s.id === upSch.id ? upSch : s)))
              }
              onAddStudioClass={(newCls) => setStudioClasses([...studioClasses, newCls])}
              onBookStudioClass={handleBookStudioClass}
              onOpenSignature={handleOpenSignature}
              showToast={showToast}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'freeze' && (
            <MembershipFreezeView
              members={activeBranchFilteredMembers}
              freezeRecords={freezeRecords}
              currentUser={currentUser}
              staffUsers={activeBranchFilteredStaffUsers}
              onOpenFreezeModal={(member) => {
                setActiveFreezeMember(member || null);
                setIsFreezeModalOpen(true);
              }}
              onOpenUnfreezeModal={(member, record) => {
                setActiveUnfreezeMember(member);
                setActiveUnfreezeRecord(record);
              }}
              onSelectMember={(member) => {
                setActiveDetailMember(member);
              }}
            />
          )}

          {activeTab === 'crm' && (
            <CRMView
              leads={activeBranchFilteredLeads}
              members={activeBranchFilteredMembers}
              staffUsers={activeBranchFilteredStaffUsers}
              followUps={followUps}
              transactions={activeBranchFilteredTransactions}
              currentUser={currentUser}
              onAddLead={(l) => setLeads([l, ...leads])}
              onUpdateLeadStatus={(lid, nStatus) =>
                setLeads(leads.map((l) => (l.id === lid ? { ...l, status: nStatus } : l)))
              }
              onUpdateLead={(updatedLead) =>
                setLeads(leads.map((l) => (l.id === updatedLead.id ? updatedLead : l)))
              }
              onDeleteLead={(lid) =>
                setLeads(leads.filter((l) => l.id !== lid))
              }
              onAddFollowUp={(fu) => {
                setFollowUps([fu, ...followUps]);
                setMembers(
                  members.map((m) => (m.id === fu.memberId ? { ...m, followUpStatus: fu.status } : m))
                );
              }}
              onConvertLeadToMember={handleConvertLeadToMember}
              showToast={showToast}
            />
          )}

          {activeTab === 'master-data' && (
            <MasterDataView
              members={activeBranchFilteredMembers}
              staffUsers={activeBranchFilteredStaffUsers}
              currentUser={currentUser}
              onOpenMemberDetail={(m) => setActiveDetailMember(m)}
              onOpenIDCard={(m) => setActiveIDCardMember(m)}
              onSaveMember={(m) => {
                const idx = members.findIndex((x) => x.id === m.id);
                if (idx >= 0) {
                  const copy = [...members];
                  copy[idx] = m;
                  setMembers(copy);
                } else {
                  setMembers([m, ...members]);
                }
              }}
              onDeleteMember={(mid) => setMembers(members.filter((m) => m.id !== mid))}
              onSaveStaff={(s) => {
                const idx = staffUsers.findIndex((x) => x.id === s.id);
                if (idx >= 0) {
                  const copy = [...staffUsers];
                  copy[idx] = s;
                  setStaffUsers(copy);
                } else {
                  setStaffUsers([...staffUsers, s]);
                }
              }}
              onDeleteStaff={(sid) => setStaffUsers(staffUsers.filter((s) => s.id !== sid))}
              onImportMembers={handleBatchImportMembers}
              onImportStaff={handleBatchImportStaff}
              showToast={showToast}
            />
          )}

          {activeTab === 'inventaris' && (
            <InventoryView
              assets={activeBranchFilteredAssets}
              maintenances={assetMaintenances}
              damageReports={damageReports}
              workOrders={workOrders}
              spareparts={spareparts}
              procurements={assetProcurements}
              movements={assetMovements}
              disposals={assetDisposals}
              auditLogs={inventoryAuditLogs}
              approvalConfig={approvalConfig}
              currentUser={currentUser}
              onSaveAsset={handleSaveAsset}
              onSaveMaintenance={handleSaveMaintenance}
              onSaveDamageReport={handleSaveDamageReport}
              onSaveWorkOrder={handleSaveWorkOrder}
              onSaveProcurement={handleSaveProcurement}
              onSaveSparepart={handleSaveSparepart}
              onSaveMovement={handleSaveMovement}
              onSaveDisposal={handleSaveDisposal}
              onSaveApprovalConfig={handleSaveApprovalConfig}
            />
          )}

          {activeTab === 'lockers' && (
            <LockerManagementView
              lockers={lockers}
              onUpdateLockers={setLockers}
              members={activeBranchFilteredMembers}
              attendances={activeBranchFilteredAttendances}
              onAddAttendance={handleAddAttendance}
              onCheckoutMember={handleCheckoutMember}
              onReleaseLocker={handleReleaseLocker}
              onSwapLocker={handleSwapLocker}
              showToast={showToast}
            />
          )}

          {activeTab === 'piutang' && (
            <FinanceView
              transactions={activeBranchFilteredTransactions}
              pettyCashList={activeBranchFilteredPettyCash}
              closingRecords={activeBranchFilteredClosings}
              currentUser={currentUser}
              isStoreClosed={isStoreClosed}
              initialSubTab="piutang"
              initialSelectedPiutangId={targetPiutangTrxId || undefined}
              onPayInstallment={(payTrx, origId, amount) => {
                handlePayInstallment(payTrx, origId, amount);
                setTargetPiutangTrxId(null);
              }}
              onBatchPayInstallment={(payments) => {
                handleBatchPayInstallment(payments);
                setTargetPiutangTrxId(null);
              }}
              onAddPettyCash={(pc) => setPettyCashList([pc, ...pettyCashList])}
              onUpdatePettyCashList={setPettyCashList}
              onExecuteDailyClosing={handleExecuteDailyClosing}
              onVoidTransaction={handleVoidTransaction}
              onReprintReceipt={(trx) => setActiveReceipt(trx)}
              onUpdatePaymentMethod={handleUpdatePaymentMethod}
              showToast={showToast}
            />
          )}

          {activeTab === 'laporan' && (
            <FinanceView
              transactions={activeBranchFilteredTransactions}
              pettyCashList={activeBranchFilteredPettyCash}
              closingRecords={activeBranchFilteredClosings}
              currentUser={currentUser}
              isStoreClosed={isStoreClosed}
              initialSubTab="bukubesar"
              onPayInstallment={handlePayInstallment}
              onBatchPayInstallment={handleBatchPayInstallment}
              onAddPettyCash={(pc) => setPettyCashList([pc, ...pettyCashList])}
              onUpdatePettyCashList={setPettyCashList}
              onExecuteDailyClosing={handleExecuteDailyClosing}
              onVoidTransaction={handleVoidTransaction}
              onReprintReceipt={(trx) => setActiveReceipt(trx)}
              onUpdatePaymentMethod={handleUpdatePaymentMethod}
              showToast={showToast}
            />
          )}

          {activeTab === 'laporan-bulanan' && (
            <FinanceView
              transactions={activeBranchFilteredTransactions}
              pettyCashList={activeBranchFilteredPettyCash}
              closingRecords={activeBranchFilteredClosings}
              currentUser={currentUser}
              isStoreClosed={isStoreClosed}
              initialSubTab="bulanan"
              onPayInstallment={handlePayInstallment}
              onBatchPayInstallment={handleBatchPayInstallment}
              onAddPettyCash={(pc) => setPettyCashList([pc, ...pettyCashList])}
              onUpdatePettyCashList={setPettyCashList}
              onExecuteDailyClosing={handleExecuteDailyClosing}
              onVoidTransaction={handleVoidTransaction}
              onReprintReceipt={(trx) => setActiveReceipt(trx)}
              onUpdatePaymentMethod={handleUpdatePaymentMethod}
              showToast={showToast}
            />
          )}

          {activeTab === 'tutup-toko' && (
            <FinanceView
              transactions={activeBranchFilteredTransactions}
              pettyCashList={activeBranchFilteredPettyCash}
              closingRecords={activeBranchFilteredClosings}
              currentUser={currentUser}
              isStoreClosed={isStoreClosed}
              initialSubTab="closing"
              onPayInstallment={handlePayInstallment}
              onBatchPayInstallment={handleBatchPayInstallment}
              onAddPettyCash={(pc) => setPettyCashList([pc, ...pettyCashList])}
              onUpdatePettyCashList={setPettyCashList}
              onExecuteDailyClosing={handleExecuteDailyClosing}
              onVoidTransaction={handleVoidTransaction}
              onReprintReceipt={(trx) => setActiveReceipt(trx)}
              onUpdatePaymentMethod={handleUpdatePaymentMethod}
              showToast={showToast}
            />
          )}

          {activeTab === 'hr-payroll' && (
            <HRPayrollView
              staffUsers={activeBranchFilteredStaffUsers}
              staffAttendance={activeBranchFilteredStaffAttendances}
              transactions={activeBranchFilteredTransactions}
              schedules={schedules}
              workSchedules={workSchedules}
              leaveRequests={leaveRequests}
              onSaveWorkSchedule={handleSaveWorkSchedule}
              onDeleteWorkSchedule={handleDeleteWorkSchedule}
              onSwapWorkSchedule={handleSwapWorkSchedule}
              onStaffClock={handleStaffClock}
              onDeleteAttendance={handleDeleteStaffAttendance}
              onSaveStaff={handleSaveStaff}
              onDeleteStaff={handleDeleteStaff}
              onImportStaff={handleBatchImportStaff}
              onSaveLeaveRequest={handleSaveLeaveRequest}
              onApproveLeaveRequest={handleApproveLeaveRequest}
              packages={packages}
              trainerCommissions={trainerCommissions}
              salesCommissions={salesCommissions}
              showToast={showToast}
            />
          )}

          {activeTab === 'google-sheets' && (
            <GoogleSheetsSyncView
              currentUser={currentUser}
              members={members}
              transactions={transactions}
              products={products}
              schedules={schedules}
              onImportMembers={(importedMembers) => {
                setMembers((prev) => {
                  const existingIds = new Set(prev.map((m) => m.id));
                  const newOnes = importedMembers.filter((im) => !existingIds.has(im.id));
                  const updated = [...prev, ...newOnes];
                  try {
                    localStorage.setItem('rfa_members', JSON.stringify(updated));
                  } catch {}
                  return updated;
                });
              }}
              showToast={showToast}
            />
          )}

          {(activeTab === 'settings' ||
            activeTab === 'settings-printer' ||
            activeTab === 'settings-theme' ||
            activeTab === 'settings-roles' ||
            activeTab === 'settings-branches' ||
            activeTab === 'settings-profile' ||
            activeTab === 'settings-finance' ||
            activeTab === 'settings-backup') && (
            <SettingsView
              currentUser={currentUser}
              staffUsers={staffUsers}
              onUpdateStaffRole={(staffId, newRole) => {
                setStaffUsers((prev) => {
                  const updated = prev.map((u) => (u.id === staffId ? { ...u, role: newRole } : u));
                  try {
                    localStorage.setItem('rfa_staff', JSON.stringify(updated));
                  } catch {}
                  return updated;
                });
                if (currentUser && currentUser.id === staffId) {
                  setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
                }
              }}
              allSystemData={{
                members,
                transactions,
                products,
                staffUsers,
                staffAttendances,
                schedules,
                pettyCashList,
                closingRecords
              }}
              onRestoreSystemData={(imported) => {
                if (imported.members) setMembers(imported.members);
                if (imported.transactions) setTransactions(imported.transactions);
                if (imported.products) setProducts(imported.products);
                if (imported.staffUsers) setStaffUsers(imported.staffUsers);
              }}
              showToast={showToast}
              onNavigateToGoogleSheets={() => setActiveTab('google-sheets')}
              initialSubTab={
                activeTab === 'settings-printer'
                  ? 'printer'
                  : activeTab === 'settings-theme'
                  ? 'theme'
                  : activeTab === 'settings-roles'
                  ? 'roles'
                  : activeTab === 'settings-branches'
                  ? 'branches'
                  : activeTab === 'settings-profile'
                  ? 'profile'
                  : activeTab === 'settings-finance'
                  ? 'finance'
                  : activeTab === 'settings-backup'
                  ? 'backup'
                  : 'printer'
              }
            />
          )}
        </main>
      </div>

      {/* GLOBAL MODALS */}
      {/* 1. Transaction Receipt */}
      <ReceiptModal
        isOpen={Boolean(activeReceipt)}
        transaction={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      {/* 2. Digital ID Card Pass */}
      <IDCardModal
        isOpen={Boolean(activeIDCardMember)}
        member={activeIDCardMember}
        onClose={() => setActiveIDCardMember(null)}
      />

      {/* 3. Member 360 Detail */}
      <MemberDetailModal
        isOpen={Boolean(activeDetailMember)}
        member={activeDetailMember}
        attendanceList={attendances}
        transactionList={transactions}
        scheduleList={schedules}
        followUpList={followUps}
        memberMemberships={memberMemberships}
        ptPurchases={ptPurchases}
        freezeRecords={freezeRecords}
        onClose={() => setActiveDetailMember(null)}
        onOpenIDCard={(m) => {
          setActiveIDCardMember(m);
        }}
        onOpenPayPiutang={(t) => {
          setActiveDetailMember(null);
          setActiveTab('piutang');
        }}
        onOpenFreeze={(m) => {
          setActiveDetailMember(null);
          setActiveFreezeMember(m);
          setIsFreezeModalOpen(true);
        }}
        onOpenUnfreeze={(m, rec) => {
          setActiveDetailMember(null);
          setActiveUnfreezeMember(m);
          setActiveUnfreezeRecord(rec || null);
        }}
        onUpdateMember={(updatedMember) => {
          setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
          setActiveDetailMember(updatedMember);
          saveMemberToFirestore(updatedMember).catch((err) => {
            console.warn('Firestore update member photo notice:', err);
          });
          showToast(
            'Foto Profil Tersimpan',
            `Foto profil ${updatedMember.name} (${updatedMember.id}) berhasil diperbarui melalui kamera dan disinkronkan ke Cloud Firestore.`,
            'success'
          );
        }}
        showToast={showToast}
      />

      {/* 4. Freeze Membership Modal */}
      <FreezeMemberModal
        isOpen={isFreezeModalOpen}
        member={activeFreezeMember}
        allMembers={members}
        currentUser={currentUser}
        staffUsers={staffUsers}
        onClose={() => {
          setIsFreezeModalOpen(false);
          setActiveFreezeMember(null);
        }}
        onConfirmFreeze={(record: MemberFreezeRecord, updatedMember: Member) => {
          handleFreezeMember(record, updatedMember);
          setIsFreezeModalOpen(false);
          setActiveFreezeMember(null);
        }}
      />

      {/* 5. Unfreeze / Aktifkan Kembali Modal */}
      <UnfreezeMemberModal
        isOpen={Boolean(activeUnfreezeMember)}
        member={activeUnfreezeMember}
        freezeRecord={
          activeUnfreezeRecord ||
          freezeRecords.find((r) => r.memberId === activeUnfreezeMember?.id && r.status === 'FREEZE') ||
          null
        }
        currentUser={currentUser}
        staffUsers={staffUsers}
        onClose={() => {
          setActiveUnfreezeMember(null);
          setActiveUnfreezeRecord(null);
        }}
        onConfirmUnfreeze={(recordId: string, updatedRecord: MemberFreezeRecord, updatedMember: Member) => {
          handleUnfreezeMember(
            updatedMember.id,
            updatedRecord.actualEndDate || APP_TODAY,
            updatedRecord.actualDays || 0,
            updatedMember.expired,
            updatedRecord.unfreezeNotes
          );
          setActiveUnfreezeMember(null);
          setActiveUnfreezeRecord(null);
        }}
      />

      {/* 4. Bundling Packages Manager Modal */}
      <BundlingManagerModal
        isOpen={isBundlingModalOpen}
        onClose={() => setIsBundlingModalOpen(false)}
        bundlePackages={bundlePackages}
        packages={packages}
        products={products}
        onSaveBundle={handleSaveBundlePackage}
        onDeleteBundle={handleDeleteBundlePackage}
      />

      {/* 4. 3-Party Digital Signature Modal */}
      <SignatureModal
        isOpen={sigModal.isOpen}
        targetRole={sigModal.role}
        scheduleTitle={sigModal.title}
        onClose={() => setSigModal({ isOpen: false, scheduleId: '', role: null, title: '' })}
        onSave={handleSaveSignature}
      />

      {/* 5. Theme Settings & Customizer Modal */}
      <ThemeSettingsModal
        isOpen={isThemeModalOpen}
        onClose={closeThemeModal}
        showToast={showToast}
      />

      {/* 6. Add Branch Global Modal */}
      <AddBranchModal
        isOpen={isAddBranchModalOpen}
        onClose={() => setIsAddBranchModalOpen(false)}
        onSave={(branchData) => {
          const created = addBranch(branchData);
          showToast(
            'Cabang Baru Ditambahkan',
            `Cabang ${created.name} (${created.code}) telah terdaftar dalam sistem.`,
            'success'
          );
        }}
      />

      {/* 7. Inter-Branch Stock Transfer Modal */}
      <StockTransferModal
        isOpen={isStockTransferModalOpen}
        onClose={() => setIsStockTransferModalOpen(false)}
        products={products}
        currentUser={currentUser}
        onTransferSuccess={(transfer, updatedProducts) => {
          setProducts(updatedProducts);
          showToast(
            'Transfer Stok Berhasil',
            `Berhasil memindahkan ${transfer.quantity} unit ${transfer.productName} dari ${transfer.fromBranchName} ke ${transfer.toBranchName}.`,
            'success'
          );
        }}
      />

      {/* FLOATING TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-2xl max-w-sm backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
            }`}
          >
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider">{toast.title}</h5>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
      {/* PWA OFFLINE CONNECTIVITY INDICATOR */}
      <OfflineIndicator />
    </div>
  );
}
