import React, { useState, useMemo } from 'react';
import {
  Target,
  Trophy,
  Users,
  Plus,
  Phone,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Package,
  ShoppingBag,
  Eye,
  Search,
  X,
  RotateCcw,
  FileText,
  ArrowRightLeft,
  UserCheck,
  Flame,
  Tag,
  DollarSign,
  History,
  Edit3,
  Trash2,
  ExternalLink,
  Send,
  Check,
  Briefcase,
  AlertCircle,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Globe,
  Ticket,
  LayoutGrid,
  List,
  Copy,
  Lock,
  Unlock,
  KeyRound,
  EyeOff,
  ShieldCheck,
  UserPlus,
  Repeat,
  Award,
  ArrowUpDown
} from 'lucide-react';
import { Lead, Member, User, FollowUpLog, Transaction, LeadFollowUpRecord, LeadHandoverRecord, getStaffDivision } from '../types';
import { OnlineReservation } from '../types/landingTypes';
import { formatRp, getDayDiff, formatDateIndo, APP_TODAY } from '../utils/formatters';
import { isOnlineLead, getOnlinePasscode, mapOnlineReservationToLead } from '../utils/crmPipelineUtils';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_PIC_PROTECTION } from '../data/settingsData';

export type DatePreset = 'all' | 'today' | 'last7' | 'this_month' | 'last_month' | 'custom';

export interface ProductSaleDetail {
  name: string;
  category: 'Membership' | 'PT' | 'POS';
  count: number;
  revenue: number;
  newCount?: number;
  newRevenue?: number;
  renewalCount?: number;
  renewalRevenue?: number;
}

export interface PICTransactionLog {
  id: string;
  date: string;
  time: string;
  customer: string;
  type: 'Membership' | 'PT' | 'POS' | 'Pelunasan Cicilan';
  desc: string;
  amount: number;
  picRevenue: number;
  method: string;
  status: string;
  trxCategory?: string;
  isRenewal?: boolean;
  isNewMember?: boolean;
}

export interface PICLeaderboardStat {
  id: string;
  name: string;
  roleName: string;
  photo?: string;
  revenue: number;
  newCount: number;
  newRevenue: number;
  renewalCount: number;
  renewalRevenue: number;
  membershipCount: number;
  membershipRevenue: number;
  ptCount: number;
  ptRevenue: number;
  posCount: number;
  posRevenue: number;
  products: ProductSaleDetail[];
  transactions: PICTransactionLog[];
}

interface CRMViewProps {
  leads: Lead[];
  members: Member[];
  staffUsers: User[];
  followUps: FollowUpLog[];
  transactions: Transaction[];
  currentUser: User | null;
  onlineReservations?: OnlineReservation[];
  onAddLead: (lead: Lead) => void;
  onUpdateLeadStatus: (leadId: string, nextStatus: Lead['status']) => void;
  onUpdateLead?: (updatedLead: Lead) => void;
  onDeleteLead?: (leadId: string) => void;
  onAddFollowUp: (fu: FollowUpLog) => void;
  onConvertLeadToMember: (lead: Lead) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const CRMView: React.FC<CRMViewProps> = ({
  leads,
  members,
  staffUsers,
  followUps,
  transactions,
  currentUser,
  onlineReservations = [],
  onAddLead,
  onUpdateLeadStatus,
  onUpdateLead,
  onDeleteLead,
  onAddFollowUp,
  onConvertLeadToMember,
  showToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'leads' | 'followup'>('dashboard');

  // Date Filter State for Leaderboard
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('2026-09-01');
  const [customEndDate, setCustomEndDate] = useState(APP_TODAY);

  // Leaderboard Separation & Sorting State (New vs Renewal)
  const [leaderboardViewMode, setLeaderboardViewMode] = useState<'all' | 'new' | 'renewal'>('all');
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<'revenue' | 'newRevenue' | 'renewalRevenue' | 'totalClosing'>('revenue');

  // Accordion & Detail Modal state for PIC Sales
  const [expandedPicId, setExpandedPicId] = useState<string | null>(null);
  const [selectedModalPic, setSelectedModalPic] = useState<PICLeaderboardStat | null>(null);
  const [modalFilterCat, setModalFilterCat] = useState<'all' | 'new' | 'renewal' | 'Membership' | 'PT' | 'POS' | 'trx'>('all');
  const [modalSearch, setModalSearch] = useState('');

  // Leads Kanban Filters & Scope (added 'online' scope)
  const [leadScope, setLeadScope] = useState<'all' | 'my' | 'online' | 'unassigned' | 'high_priority'>('all');
  const [filterLeadPic, setFilterLeadPic] = useState<string>('all');
  const [filterLeadSource, setFilterLeadSource] = useState<string>('all');
  const [filterLeadPriority, setFilterLeadPriority] = useState<string>('all');
  const [searchLeadQuery, setSearchLeadQuery] = useState<string>('');

  // Pipeline View Mode & Stage Expansion States
  const [expandedStage, setExpandedStage] = useState<Lead['status'] | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  const [expandedViewMode, setExpandedViewMode] = useState<'grid' | 'table'>('grid');
  const [pipelineViewMode, setPipelineViewMode] = useState<'kanban' | 'table'>('kanban');
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  // Add Lead modal state
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSource, setLeadSource] = useState<string>('Instagram');
  const [leadPicId, setLeadPicId] = useState<string>('');
  const [leadPriority, setLeadPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Tinggi');
  const [leadInterest, setLeadInterest] = useState('Membership 3 Bulan');
  const [leadEstimatedValue, setLeadEstimatedValue] = useState('750000');
  const [leadNotes, setLeadNotes] = useState('');

  // Settings Context for PIC Security & Password Verification
  const { settings, verifyPicPassword } = useSettings();
  const picProtection = settings.picProtection || DEFAULT_PIC_PROTECTION;
  const isLeadHandoverPasswordRequired =
    picProtection.requirePasswordToChangePic && (picProtection.requirePasswordOnLeadHandover !== false);
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'admin_cabang' || currentUser?.role === 'manager';

  // Handover / Oper Alih PIC modal state
  const [selectedLeadForHandover, setSelectedLeadForHandover] = useState<Lead | null>(null);
  const [handoverTargetPicId, setHandoverTargetPicId] = useState<string>('');
  const [handoverReason, setHandoverReason] = useState<string>('');
  const [handoverPassword, setHandoverPassword] = useState<string>('');
  const [showHandoverPassword, setShowHandoverPassword] = useState<boolean>(false);
  const [handoverPasswordError, setHandoverPasswordError] = useState<string>('');

  // Lead 360 Detail & Timeline modal state
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'overview' | 'followup' | 'handover'>('overview');
  const [detailNewFuMethod, setDetailNewFuMethod] = useState<'WhatsApp' | 'Telepon' | 'Tatap Muka' | 'Instagram DM'>('WhatsApp');
  const [detailNewFuResult, setDetailNewFuResult] = useState<string>('Tertarik - Pertimbangkan Harga');
  const [detailNewFuNotes, setDetailNewFuNotes] = useState<string>('');
  const [detailNewFuNextStage, setDetailNewFuNextStage] = useState<string>('');

  // Lost Reason modal state
  const [selectedLeadForLost, setSelectedLeadForLost] = useState<Lead | null>(null);
  const [lostReasonCategory, setLostReasonCategory] = useState<string>('Harga / Budget Terlalu Tinggi');
  const [lostReasonNotes, setLostReasonNotes] = useState<string>('');

  // Follow up state
  const [filterPic, setFilterPic] = useState('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');

  // Follow up logging modal
  const [selectedMemberForFU, setSelectedMemberForFU] = useState<Member | null>(null);
  const [fuMethod, setFuMethod] = useState<'WhatsApp' | 'Telepon'>('WhatsApp');
  const [fuStatus, setFuStatus] = useState('SUDAH DIHUBUNGI');
  const [fuNotes, setFuNotes] = useState('');

  // History modal
  const [historyMember, setHistoryMember] = useState<Member | null>(null);

  // Date Filter matching helper
  const isDateInRange = (trxDate: string): boolean => {
    if (!trxDate) return false;
    if (datePreset === 'all') return true;
    if (datePreset === 'today') return trxDate === APP_TODAY;
    if (datePreset === 'last7') {
      const diff = getDayDiff(trxDate, APP_TODAY);
      return diff <= 0 && diff >= -7;
    }
    if (datePreset === 'this_month') {
      return trxDate.slice(0, 7) === APP_TODAY.slice(0, 7);
    }
    if (datePreset === 'last_month') {
      const [y, m] = APP_TODAY.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      return trxDate.slice(0, 7) === prevMonthStr;
    }
    if (datePreset === 'custom') {
      if (customStartDate && trxDate < customStartDate) return false;
      if (customEndDate && trxDate > customEndDate) return false;
      return true;
    }
    return true;
  };

  // Helper to categorize product from transaction desc / type
  const detectCategory = (desc: string, type: string): 'Membership' | 'PT' | 'POS' => {
    const lowDesc = desc.toLowerCase();
    if (type === 'PT' || lowDesc.includes('pt ') || lowDesc.includes('sesi') || lowDesc.includes('personal trainer')) {
      return 'PT';
    }
    if (
      type === 'POS' ||
      lowDesc.startsWith('pos:') ||
      lowDesc.includes('protein') ||
      lowDesc.includes('suplemen') ||
      lowDesc.includes('bar') ||
      lowDesc.includes('mineral')
    ) {
      return 'POS';
    }
    return 'Membership';
  };

  const sanitizeItemName = (desc: string, type: string): string => {
    if (type === 'POS' && desc.startsWith('POS: ')) {
      return desc.replace(/^POS:\s*\d*x?\s*/i, '').trim();
    }
    return desc
      .replace(/\s*\(Eligible Cicilan\)/gi, '')
      .replace(/\s*\(Cicilan \d\/\d\)/gi, '')
      .trim();
  };

  // Compute PIC Leaderboard stats with Date Filter and separated New vs Renewal
  const {
    rankedPICs,
    allPICStats,
    globalRevenue,
    globalNewCount,
    globalNewRevenue,
    globalRenewalCount,
    globalRenewalRevenue,
    globalMembershipUnits,
    globalMembershipRevenue,
    globalPtUnits,
    globalPtRevenue,
    globalPosUnits,
    globalPosRevenue,
    filteredTrxCount,
    topPerformerAll,
    topPerformerNew,
    topPerformerRenewal
  } = useMemo(() => {
    const picStatsMap: {
      [picId: string]: {
        id: string;
        name: string;
        roleName: string;
        photo?: string;
        revenue: number;
        newCount: number;
        newRevenue: number;
        renewalCount: number;
        renewalRevenue: number;
        membershipCount: number;
        membershipRevenue: number;
        ptCount: number;
        ptRevenue: number;
        posCount: number;
        posRevenue: number;
        productsMap: { [productName: string]: ProductSaleDetail };
        transactions: PICTransactionLog[];
      };
    } = {};

    staffUsers.forEach((s) => {
      picStatsMap[s.id] = {
        id: s.id,
        name: s.name,
        roleName: s.roleName,
        photo: s.photo,
        revenue: 0,
        newCount: 0,
        newRevenue: 0,
        renewalCount: 0,
        renewalRevenue: 0,
        membershipCount: 0,
        membershipRevenue: 0,
        ptCount: 0,
        ptRevenue: 0,
        posCount: 0,
        posRevenue: 0,
        productsMap: {},
        transactions: []
      };
    });

    let gRev = 0;
    let gNew = 0;
    let gNewRevenue = 0;
    let gRenewal = 0;
    let gRenewalRevenue = 0;
    let gMemUnits = 0;
    let gMemRev = 0;
    let gPtUnits = 0;
    let gPtRev = 0;
    let gPosUnits = 0;
    let gPosRev = 0;
    let fCount = 0;

    transactions.forEach((t) => {
      if (t.status === 'VOID') return;
      if (!isDateInRange(t.date)) return;

      // Only count revenue transactions
      if (t.status === 'Paid' || t.status === 'DP 50%') {
        fCount++;
        let pids: string[] = [];
        if (t.picIds && t.picIds.length > 0) {
          pids = t.picIds;
        } else if (t.picId) {
          pids = t.picId.split(',').map((s) => s.trim()).filter(Boolean);
        } else if (t.cashier) {
          const matched = staffUsers.find(
            (s) => s.name.toLowerCase() === t.cashier.toLowerCase() || s.accId.toLowerCase() === t.cashier.toLowerCase()
          );
          if (matched) {
            pids = [matched.id];
          }
        }

        if (pids.length === 0) {
          pids = ['S01']; // default fallback
        }

        const amt = t.amountPaid || t.amount;
        const amtPerPic = amt / (pids.length || 1);
        const cat = detectCategory(t.desc, t.type);
        const cleanName = sanitizeItemName(t.desc, t.type);

        const isRenewal = Boolean(
          t.trxCategory === 'RENEWAL' ||
          (t.trxCategory && t.trxCategory.toUpperCase().includes('RENEW')) ||
          (t.desc && (t.desc.toLowerCase().includes('renewal') || t.desc.toLowerCase().includes('perpanjang')))
        );

        // Request 6: Di NEW Member tipe transaksi HANYA pembelian membership murni, jangan campur dengan PT/POS/lainnya
        const isMembershipPurchase = Boolean(
          (cat === 'Membership' || t.type === 'Membership' || t.trxCategory === 'NEW MEMBERSHIP' || t.trxCategory === 'RENEWAL') &&
          cat !== 'PT' &&
          cat !== 'POS'
        );

        const isNewMembership = !isRenewal && isMembershipPurchase;
        const isRenewalMembership = isRenewal && isMembershipPurchase;

        pids.forEach((pid) => {
          const stat = picStatsMap[pid];
          if (stat) {
            stat.revenue += amtPerPic;
            if (isRenewalMembership) {
              stat.renewalCount += 1 / pids.length;
              stat.renewalRevenue += amtPerPic;
            } else if (isNewMembership) {
              stat.newCount += 1 / pids.length;
              stat.newRevenue += amtPerPic;
            }

            if (cat === 'Membership') {
              stat.membershipRevenue += amtPerPic;
              stat.membershipCount += 1 / pids.length;
            } else if (cat === 'PT') {
              stat.ptRevenue += amtPerPic;
              stat.ptCount += 1 / pids.length;
            } else {
              stat.posRevenue += amtPerPic;
              stat.posCount += 1 / pids.length;
            }

            if (!stat.productsMap[cleanName]) {
              stat.productsMap[cleanName] = {
                name: cleanName,
                category: cat,
                count: 0,
                revenue: 0,
                newCount: 0,
                newRevenue: 0,
                renewalCount: 0,
                renewalRevenue: 0
              };
            }
            stat.productsMap[cleanName].count += 1 / pids.length;
            stat.productsMap[cleanName].revenue += amtPerPic;
            if (isRenewalMembership) {
              stat.productsMap[cleanName].renewalCount = (stat.productsMap[cleanName].renewalCount || 0) + 1 / pids.length;
              stat.productsMap[cleanName].renewalRevenue = (stat.productsMap[cleanName].renewalRevenue || 0) + amtPerPic;
            } else if (isNewMembership) {
              stat.productsMap[cleanName].newCount = (stat.productsMap[cleanName].newCount || 0) + 1 / pids.length;
              stat.productsMap[cleanName].newRevenue = (stat.productsMap[cleanName].newRevenue || 0) + amtPerPic;
            }

            stat.transactions.push({
              id: t.id,
              date: t.date,
              time: t.time,
              customer: t.customer,
              type: cat,
              desc: t.desc,
              amount: t.amount,
              picRevenue: amtPerPic,
              method: t.method,
              status: t.status,
              trxCategory: t.trxCategory,
              isRenewal: isRenewalMembership,
              isNewMember: isNewMembership
            });
          }
        });

        gRev += amt;
        if (isRenewalMembership) {
          gRenewal++;
          gRenewalRevenue += amt;
        } else if (isNewMembership) {
          gNew++;
          gNewRevenue += amt;
        }

        if (cat === 'Membership') {
          gMemUnits++;
          gMemRev += amt;
        } else if (cat === 'PT') {
          gPtUnits++;
          gPtRev += amt;
        } else {
          gPosUnits++;
          gPosRev += amt;
        }
      }
    });

    const allStats: PICLeaderboardStat[] = Object.values(picStatsMap).map((item) => ({
      id: item.id,
      name: item.name,
      roleName: item.roleName,
      photo: item.photo,
      revenue: Math.round(item.revenue),
      newCount: Math.round(item.newCount),
      newRevenue: Math.round(item.newRevenue),
      renewalCount: Math.round(item.renewalCount),
      renewalRevenue: Math.round(item.renewalRevenue),
      membershipCount: Math.round(item.membershipCount),
      membershipRevenue: Math.round(item.membershipRevenue),
      ptCount: Math.round(item.ptCount),
      ptRevenue: Math.round(item.ptRevenue),
      posCount: Math.round(item.posCount),
      posRevenue: Math.round(item.posRevenue),
      products: Object.values(item.productsMap).sort((a, b) => b.revenue - a.revenue),
      transactions: item.transactions.sort((a, b) => b.date.localeCompare(a.date))
    }));

    // Top performers for highlights
    const topPerformerAll = [...allStats].filter((p) => p.revenue > 0).sort((a, b) => b.revenue - a.revenue)[0] || null;
    const topPerformerNew = [...allStats].filter((p) => p.newRevenue > 0).sort((a, b) => b.newRevenue - a.newRevenue)[0] || null;
    const topPerformerRenewal = [...allStats].filter((p) => p.renewalRevenue > 0).sort((a, b) => b.renewalRevenue - a.renewalRevenue)[0] || null;

    // Sorting according to mode & user preference
    const sorted = [...allStats].sort((a, b) => {
      if (leaderboardViewMode === 'new') {
        if (b.newRevenue !== a.newRevenue) return b.newRevenue - a.newRevenue;
        return b.newCount - a.newCount;
      }
      if (leaderboardViewMode === 'renewal') {
        if (b.renewalRevenue !== a.renewalRevenue) return b.renewalRevenue - a.renewalRevenue;
        return b.renewalCount - a.renewalCount;
      }
      // Mode 'all'
      if (leaderboardSortBy === 'newRevenue') return b.newRevenue - a.newRevenue;
      if (leaderboardSortBy === 'renewalRevenue') return b.renewalRevenue - a.renewalRevenue;
      if (leaderboardSortBy === 'totalClosing') return (b.newCount + b.renewalCount) - (a.newCount + a.renewalCount);
      return b.revenue - a.revenue;
    });

    return {
      rankedPICs: sorted,
      allPICStats: allStats,
      globalRevenue: gRev,
      globalNewCount: gNew,
      globalNewRevenue: gNewRevenue,
      globalRenewalCount: gRenewal,
      globalRenewalRevenue: gRenewalRevenue,
      globalMembershipUnits: gMemUnits,
      globalMembershipRevenue: gMemRev,
      globalPtUnits: gPtUnits,
      globalPtRevenue: gPtRev,
      globalPosUnits: gPosUnits,
      globalPosRevenue: gPosRev,
      filteredTrxCount: fCount,
      topPerformerAll,
      topPerformerNew,
      topPerformerRenewal
    };
  }, [transactions, staffUsers, datePreset, customStartDate, customEndDate, leaderboardViewMode, leaderboardSortBy]);

  // Label for current date filter
  const dateFilterLabel = useMemo(() => {
    switch (datePreset) {
      case 'today':
        return `Hari Ini (${formatDateIndo(APP_TODAY)})`;
      case 'last7':
        return '7 Hari Terakhir';
      case 'this_month':
        return 'Bulan Ini (September 2026)';
      case 'last_month':
        return 'Bulan Lalu (Agustus 2026)';
      case 'custom':
        return `${formatDateIndo(customStartDate)} s/d ${formatDateIndo(customEndDate)}`;
      case 'all':
      default:
        return 'Semua Waktu (Seluruh Riwayat)';
    }
  }, [datePreset, customStartDate, customEndDate]);

  // Follow-up calculations
  const priorityMembers = members.map((m) => {
    const diff = getDayDiff(m.expired, APP_TODAY);
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE' = 'SAFE';
    if (diff < 0) priority = 'HIGH'; // Expired
    else if (diff <= 3) priority = 'HIGH'; // H-3
    else if (diff <= 7) priority = 'MEDIUM'; // H-7
    else if (diff <= 30) priority = 'LOW'; // H-30
    return { ...m, diffDays: diff, priority };
  });

  const filteredFUMembers = priorityMembers.filter((m) => {
    if (m.priority === 'SAFE') return false;
    if (filterPic !== 'all' && m.picId !== filterPic) return false;
    if (filterPriority !== 'all' && m.priority !== filterPriority) return false;
    return true;
  });

  const highCount = priorityMembers.filter((m) => m.priority === 'HIGH').length;
  const mediumCount = priorityMembers.filter((m) => m.priority === 'MEDIUM').length;
  const lowCount = priorityMembers.filter((m) => m.priority === 'LOW').length;

  // Staff Helper
  const getStaffById = (id?: string): User | undefined => {
    if (!id) return undefined;
    return staffUsers.find((s) => s.id === id);
  };

  // Merge leads with online reservations to ensure all online members appear in the pipeline
  const allPipelineLeads = useMemo(() => {
    const existingPhones = new Set(leads.map((l) => l.phone.replace(/\D/g, '')));
    const existingIds = new Set(leads.map((l) => l.id));

    const onlineMappedLeads: Lead[] = (onlineReservations || [])
      .filter((res) => {
        const cleanPhone = (res.customerPhone || '').replace(/\D/g, '');
        return !existingIds.has(res.id) && !existingPhones.has(cleanPhone);
      })
      .map((res) => mapOnlineReservationToLead(res));

    return [...leads, ...onlineMappedLeads];
  }, [leads, onlineReservations]);

  // Filtered Leads Calculation
  const myLeadsCount = useMemo(() => {
    if (!currentUser) return 0;
    return allPipelineLeads.filter((l) => l.picId === currentUser.id && l.status !== 'Lost').length;
  }, [allPipelineLeads, currentUser]);

  const onlineLeadsCount = useMemo(() => {
    return allPipelineLeads.filter((l) => isOnlineLead(l)).length;
  }, [allPipelineLeads]);

  const unassignedLeadsCount = useMemo(() => {
    return allPipelineLeads.filter((l) => !l.picId && l.status !== 'Lost').length;
  }, [allPipelineLeads]);

  const highPriorityLeadsCount = useMemo(() => {
    return allPipelineLeads.filter((l) => l.priority === 'Tinggi' && l.status !== 'Lost').length;
  }, [allPipelineLeads]);

  const activePipelineValue = useMemo(() => {
    return allPipelineLeads
      .filter((l) => l.status !== 'Lost' && l.status !== 'Member')
      .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
  }, [allPipelineLeads]);

  const winClosingValue = useMemo(() => {
    return allPipelineLeads
      .filter((l) => l.status === 'Member')
      .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
  }, [allPipelineLeads]);

  const closingRate = useMemo(() => {
    if (allPipelineLeads.length === 0) return 0;
    const memberCount = allPipelineLeads.filter((l) => l.status === 'Member').length;
    return Math.round((memberCount / allPipelineLeads.length) * 100);
  }, [allPipelineLeads]);

  // Toggle inline card expansion
  const toggleCardExpand = (id: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle column collapse
  const toggleColumnCollapse = (stageKey: string) => {
    setCollapsedStages((prev) => ({
      ...prev,
      [stageKey]: !prev[stageKey]
    }));
  };

  // Copy phone number helper
  const handleCopyPhone = (phone: string, name: string) => {
    navigator.clipboard.writeText(phone);
    showToast('Tersalin 📋', `Nomor ${phone} (${name}) disalin ke clipboard.`, 'info');
  };

  // Stage Metadata Configuration
  const STAGE_CONFIGS: {
    key: Lead['status'];
    label: string;
    subtitle: string;
    dotColor: string;
    borderColor: string;
    bgBadge: string;
    textColor: string;
    accentBg: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: 'Baru',
      label: 'Lead Baru',
      subtitle: 'Inquiry & Registrasi Masuk',
      dotColor: 'bg-blue-500',
      borderColor: 'border-blue-500/30',
      bgBadge: 'bg-blue-500/20 text-blue-400',
      textColor: 'text-blue-400',
      accentBg: 'bg-blue-500/10',
      icon: Sparkles
    },
    {
      key: 'Follow Up',
      label: 'Follow Up',
      subtitle: 'Konsultasi & Penawaran Paket',
      dotColor: 'bg-amber-500',
      borderColor: 'border-amber-500/30',
      bgBadge: 'bg-amber-500/20 text-amber-400',
      textColor: 'text-amber-400',
      accentBg: 'bg-amber-500/10',
      icon: MessageSquare
    },
    {
      key: 'Trial',
      label: 'Trial / Visit',
      subtitle: 'Jadwal Survey & Latihan',
      dotColor: 'bg-purple-500',
      borderColor: 'border-purple-500/30',
      bgBadge: 'bg-purple-500/20 text-purple-400',
      textColor: 'text-purple-400',
      accentBg: 'bg-purple-500/10',
      icon: Dumbbell
    },
    {
      key: 'Member',
      label: 'Win (Member)',
      subtitle: 'Closing & Terdaftar Resmi',
      dotColor: 'bg-emerald-500',
      borderColor: 'border-emerald-500/30',
      bgBadge: 'bg-emerald-500/20 text-emerald-400',
      textColor: 'text-emerald-400',
      accentBg: 'bg-emerald-500/10',
      icon: Trophy
    },
    {
      key: 'Lost',
      label: 'Lost / Batal',
      subtitle: 'Tidak Berminat / Batal',
      dotColor: 'bg-rose-500',
      borderColor: 'border-rose-500/30',
      bgBadge: 'bg-rose-500/20 text-rose-400',
      textColor: 'text-rose-400',
      accentBg: 'bg-rose-500/10',
      icon: AlertTriangle
    }
  ];

  // Filtered Leads for Kanban Board
  const filteredLeads = useMemo(() => {
    return allPipelineLeads.filter((lead) => {
      // 1. Lead Scope filter
      if (leadScope === 'my') {
        if (!currentUser || lead.picId !== currentUser.id) return false;
      } else if (leadScope === 'online') {
        if (!isOnlineLead(lead)) return false;
      } else if (leadScope === 'unassigned') {
        if (lead.picId) return false;
      } else if (leadScope === 'high_priority') {
        if (lead.priority !== 'Tinggi') return false;
      }

      // 2. PIC filter
      if (filterLeadPic !== 'all') {
        if (filterLeadPic === 'unassigned') {
          if (lead.picId) return false;
        } else if (lead.picId !== filterLeadPic) {
          return false;
        }
      }

      // 3. Source filter
      if (filterLeadSource !== 'all') {
        if (filterLeadSource === 'Online' || filterLeadSource === 'Daftar Online (Website)') {
          if (!isOnlineLead(lead)) return false;
        } else if (lead.source !== filterLeadSource) {
          return false;
        }
      }

      // 4. Priority filter
      if (filterLeadPriority !== 'all' && lead.priority !== filterLeadPriority) {
        return false;
      }

      // 5. Search query
      if (searchLeadQuery.trim()) {
        const q = searchLeadQuery.toLowerCase().trim();
        const staff = getStaffById(lead.picId);
        const matchName = lead.name.toLowerCase().includes(q);
        const matchPhone = lead.phone.includes(q);
        const matchPic = (staff?.name || lead.picName || '').toLowerCase().includes(q);
        const matchInterest = (lead.interest || '').toLowerCase().includes(q);
        const matchNotes = (lead.notes || '').toLowerCase().includes(q);
        const matchTags = (lead.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchPhone && !matchPic && !matchInterest && !matchNotes && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [allPipelineLeads, leadScope, filterLeadPic, filterLeadSource, filterLeadPriority, searchLeadQuery, currentUser, staffUsers]);

  // Save New Lead Handler
  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) {
      showToast('Data Belum Lengkap', 'Nama dan No WhatsApp calon member wajib diisi.', 'warning');
      return;
    }

    const assignedStaffId = leadPicId || currentUser?.id || staffUsers[0]?.id;
    const assignedStaff = getStaffById(assignedStaffId);
    const estValNum = parseInt(leadEstimatedValue.replace(/\D/g, '') || '0', 10);

    const newLead: Lead = {
      id: 'L-' + Date.now(),
      date: APP_TODAY,
      name: leadName.trim(),
      phone: leadPhone.trim(),
      source: leadSource,
      status: 'Baru',
      picId: assignedStaff?.id,
      picName: assignedStaff?.name || 'Petugas Front Desk',
      picRole: assignedStaff?.roleName || 'Front Desk',
      picDivision: getStaffDivision(assignedStaff),
      picShift: assignedStaff?.shift || 'Pagi',
      assignedAt: `${APP_TODAY} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      assignedBy: currentUser?.name || 'Front Desk',
      priority: leadPriority,
      interest: leadInterest.trim() || 'Membership Gym',
      estimatedValue: estValNum,
      notes: leadNotes.trim(),
      lastFollowUpDate: APP_TODAY,
      followUpHistory: [
        {
          id: 'FU-' + Date.now(),
          date: APP_TODAY,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          picId: assignedStaff?.id || 'SYSTEM',
          picName: assignedStaff?.name || 'Petugas Front Desk',
          picRole: assignedStaff?.roleName || 'Front Desk',
          picDivision: getStaffDivision(assignedStaff),
          method: leadSource === 'Walk-in' ? 'Tatap Muka' : 'Instagram DM',
          result: 'Inquiry Prospek Baru Diterima',
          notes: leadNotes.trim() || 'Prospek berhasil ditambahkan ke Kanban dan ditugaskan ke Front Desk.'
        }
      ]
    };

    onAddLead(newLead);
    showToast(
      'Lead Baru Ditambahkan 🎯',
      `Prospek ${leadName} berhasil ditugaskan ke ${assignedStaff?.name || 'Front Desk'} (${getStaffDivision(assignedStaff)}).`,
      'success'
    );

    // Reset Form
    setIsAddLeadOpen(false);
    setLeadName('');
    setLeadPhone('');
    setLeadNotes('');
    setLeadEstimatedValue('750000');
  };

  // Handover / Oper Alih PIC Handler (Pencegah Tertukar & Multi-Divisi)
  const handlePerformHandover = (lead: Lead, targetPicId: string, reason: string) => {
    const targetStaff = getStaffById(targetPicId);
    if (!targetStaff) {
      showToast('Pilih Petugas', 'Silakan pilih petugas Front Desk / PIC tujuan.', 'warning');
      return;
    }

    const currentStaff = getStaffById(lead.picId);
    const fromName = currentStaff?.name || lead.picName || 'Belum Ada PIC (Pool Bebas)';
    const fromDivision = lead.picDivision || getStaffDivision(currentStaff);
    const toDivision = getStaffDivision(targetStaff);
    const isCrossDivision = fromDivision !== toDivision;

    const newHandover: LeadHandoverRecord = {
      id: 'HO-' + Date.now(),
      date: APP_TODAY,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      fromPicId: lead.picId || 'UNASSIGNED',
      fromPicName: fromName,
      fromPicDivision: fromDivision,
      toPicId: targetStaff.id,
      toPicName: targetStaff.name,
      toPicDivision: toDivision,
      reason: reason.trim() || `Oper alih tugas ke ${targetStaff.name} (${toDivision})`
    };

    const updatedLead: Lead = {
      ...lead,
      picId: targetStaff.id,
      picName: targetStaff.name,
      picRole: targetStaff.roleName || 'Front Desk',
      picDivision: toDivision,
      picShift: targetStaff.shift || 'Pagi',
      assignedAt: `${APP_TODAY} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      assignedBy: currentUser?.name || 'Front Desk',
      handoverHistory: [newHandover, ...(lead.handoverHistory || [])]
    };

    if (onUpdateLead) {
      onUpdateLead(updatedLead);
    } else {
      onUpdateLeadStatus(lead.id, lead.status);
    }

    showToast(
      isCrossDivision ? 'Oper Alih Lintas Devisi 🔄' : 'Tanggung Jawab Dialihkan 🔄',
      `Prospek ${lead.name} dialihkan ke ${targetStaff.name} (${toDivision} - Shift ${targetStaff.shift || '-'}).`,
      'success'
    );

    setSelectedLeadForHandover(null);
    setHandoverReason('');
    if (selectedLeadForDetail?.id === lead.id) {
      setSelectedLeadForDetail(updatedLead);
    }
  };

  // Claim Lead Handler
  const handleClaimLead = (lead: Lead) => {
    if (!currentUser) return;
    handlePerformHandover(
      lead,
      currentUser.id,
      `Klaim mandiri tanggung jawab oleh ${currentUser.name} (${currentUser.roleName || 'Front Desk'} - Shift ${currentUser.shift || '-'})`
    );
  };

  // Add Follow Up Log to Lead Handler
  const handleAddLeadFollowUp = (
    lead: Lead,
    method: 'WhatsApp' | 'Telepon' | 'Tatap Muka' | 'Instagram DM',
    result: string,
    notes: string,
    nextStage?: Lead['status']
  ) => {
    const activeStaff = currentUser || getStaffById(lead.picId);
    const newRecord: LeadFollowUpRecord = {
      id: 'FU-' + Date.now(),
      date: APP_TODAY,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      picId: activeStaff?.id || 'SYSTEM',
      picName: activeStaff?.name || 'Petugas Front Desk',
      picRole: activeStaff?.roleName || 'Front Desk',
      method,
      result,
      notes: notes.trim()
    };

    const targetStage = nextStage || lead.status;
    const updatedLead: Lead = {
      ...lead,
      status: targetStage,
      lastFollowUpDate: APP_TODAY,
      followUpHistory: [newRecord, ...(lead.followUpHistory || [])]
    };

    if (onUpdateLead) {
      onUpdateLead(updatedLead);
    } else if (nextStage && nextStage !== lead.status) {
      onUpdateLeadStatus(lead.id, targetStage);
    }

    showToast('Follow Up Tercatat 📝', `Aktivitas follow-up untuk ${lead.name} berhasil disimpan.`, 'success');
    if (selectedLeadForDetail?.id === lead.id) {
      setSelectedLeadForDetail(updatedLead);
    }
  };

  // Stage Movement Handler
  const handleMoveStage = (lead: Lead, nextStatus: Lead['status']) => {
    // If this lead was dynamically mapped from onlineReservations, add it to leads state!
    if (!leads.some((l) => l.id === lead.id)) {
      const promotedLead: Lead = {
        ...lead,
        status: nextStatus
      };
      onAddLead(promotedLead);
      if (nextStatus === 'Member') {
        onConvertLeadToMember(promotedLead);
        return;
      }
      if (nextStatus === 'Lost') {
        setSelectedLeadForLost(promotedLead);
        return;
      }
      showToast('Tahapan Diperbarui 📋', `${lead.name} dipindahkan ke tahap ${nextStatus}.`, 'info');
      return;
    }

    if (nextStatus === 'Member') {
      onUpdateLeadStatus(lead.id, 'Member');
      onConvertLeadToMember(lead);
      return;
    }

    if (nextStatus === 'Lost') {
      setSelectedLeadForLost(lead);
      return;
    }

    onUpdateLeadStatus(lead.id, nextStatus);
    showToast('Tahapan Diperbarui 📋', `${lead.name} dipindahkan ke tahap ${nextStatus}.`, 'info');
  };

  // Save Lost Reason Handler
  const handleConfirmLost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadForLost) return;

    const lostRecord: LeadFollowUpRecord = {
      id: 'FU-LOST-' + Date.now(),
      date: APP_TODAY,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      picId: currentUser?.id || selectedLeadForLost.picId || 'SYSTEM',
      picName: currentUser?.name || selectedLeadForLost.picName || 'Front Desk',
      picRole: currentUser?.roleName || 'Front Desk',
      method: 'WhatsApp',
      result: 'Batal / Lost Closing',
      notes: `Alasan Batal: ${lostReasonCategory}. Catatan: ${lostReasonNotes.trim() || 'Tidak ada catatan tambahan.'}`
    };

    const updatedLead: Lead = {
      ...selectedLeadForLost,
      status: 'Lost',
      lostReason: `${lostReasonCategory} - ${lostReasonNotes.trim()}`,
      followUpHistory: [lostRecord, ...(selectedLeadForLost.followUpHistory || [])]
    };

    if (onUpdateLead) {
      onUpdateLead(updatedLead);
    } else {
      onUpdateLeadStatus(selectedLeadForLost.id, 'Lost');
    }

    showToast('Prospek Diarsipkan (Lost)', `Prospek ${selectedLeadForLost.name} dipindahkan ke daftar Lost.`, 'info');
    setSelectedLeadForLost(null);
    setLostReasonNotes('');
  };

  // WhatsApp Smart Action with Online Template Support
  const openWhatsAppLead = (lead: Lead, templateType: 'greeting' | 'trial' | 'promo' | 'online_welcome') => {
    const staff = getStaffById(lead.picId) || currentUser;
    const staffName = staff?.name || 'Petugas Front Desk RFA Gym';
    const cleanPhone = lead.phone.replace(/^0/, '62').replace(/\D/g, '');
    const isOnline = isOnlineLead(lead);
    const passcode = getOnlinePasscode(lead);

    let text = '';
    if (templateType === 'online_welcome' || isOnline) {
      text = `Halo Kak ${lead.name}! Salam hangat dan bugar dari RFA Gym. Saya ${staffName} dari tim Front Desk. Kami telah menerima data registrasi online Kakak ${passcode ? `(Passcode: ${passcode})` : ''} untuk ${lead.interest || 'paket gym'}. Tim kami siap menyambut kedatangan Kakak untuk serah terima Digital Member Card dan sesi gratis penimbangan InBody 770. Kapan kira-kira waktu yang paling nyaman untuk berkunjung ke gym kami?`;
    } else if (templateType === 'greeting') {
      text = `Halo Kak ${lead.name}! Salam hangat dan sehat dari RFA Gym. Saya ${staffName} dari tim Front Desk. Terima kasih telah menghubungi kami mengenai ${lead.interest || 'program gym'}. Apakah ada jadwal luang untuk kami bantu jelaskan paket atau keliling studio gym kami?`;
    } else if (templateType === 'trial') {
      text = `Halo Kak ${lead.name}! Saya ${staffName} dari Front Desk RFA Gym. Kami ingin mengonfirmasi jadwal sesi Free Trial & Konsultasi Kebugaran untuk Kakak. Kapan kira-kira waktu yang paling nyaman untuk berkunjung ke gym kami?`;
    } else {
      text = `Halo Kak ${lead.name}! Saya ${staffName} dari RFA Gym. Spesial hari ini kami memiliki promo khusus membership dengan potongan biaya registrasi dan free akses kelas studio. Apakah Kakak berminat kami kirimkan brosur detailnya?`;
    }

    // Auto-record follow up
    handleAddLeadFollowUp(
      lead,
      'WhatsApp',
      `Kirim Pesan WhatsApp (${isOnline ? 'Konfirmasi Online' : templateType === 'greeting' ? 'Sapaan Awal' : templateType === 'trial' ? 'Jadwal Trial' : 'Promo Khusus'})`,
      `Pesan template WA terkirim otomatis oleh ${staffName}`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForFU || !fuNotes.trim()) return;

    const newFU: FollowUpLog = {
      id: 'FU-' + Date.now(),
      memberId: selectedMemberForFU.id,
      date: APP_TODAY,
      method: fuMethod,
      status: fuStatus,
      notes: fuNotes.trim()
    };

    onAddFollowUp(newFU);
    showToast('Log Tersimpan', `Catatan follow up untuk ${selectedMemberForFU.name} berhasil direkam.`, 'success');
    setSelectedMemberForFU(null);
    setFuNotes('');
  };

  const generateAIDraft = () => {
    if (!selectedMemberForFU) return;
    setFuNotes(
      `Halo Kak ${selectedMemberForFU.name}! Salam hangat dari RFA GYM. Kami perhatikan membership Kakak akan berakhir pada ${selectedMemberForFU.expired}. Saat ini kami punya promo perpanjangan spesial potongan harga dan fasilitas cicilan 2x. Apakah Kakak berminat kami bantu proses renewal-nya hari ini?`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Sub-tab switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" /> CRM Leads & Performa PIC
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Pipeline prospek member baru, leaderboard penjualan PIC, dan reminder expired</p>
        </div>
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'dashboard' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Dashboard KPI PIC
          </button>
          <button
            onClick={() => setActiveSubTab('leads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'leads' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Leads Kanban ({leads.length})
          </button>
          <button
            onClick={() => setActiveSubTab('followup')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'followup' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Follow Up Member ({filteredFUMembers.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DASHBOARD & LEADERBOARD PIC */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* DATE FILTER CONTROLS BAR */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Filter Tanggal & Periode Penjualan
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Pilih periode waktu untuk menganalisis omset dan produk paket yang dijual PIC Sales / Front Desk
                  </p>
                </div>
              </div>

              {datePreset !== 'all' && (
                <button
                  onClick={() => setDatePreset('all')}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 px-3 py-1.5 rounded-xl transition self-start md:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                  <span>Reset ke Semua Waktu</span>
                </button>
              )}
            </div>

            {/* Presets Button Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                { id: 'all' as DatePreset, label: 'Semua Waktu' },
                { id: 'today' as DatePreset, label: 'Hari Ini' },
                { id: 'last7' as DatePreset, label: '7 Hari Terakhir' },
                { id: 'this_month' as DatePreset, label: 'Bulan Ini' },
                { id: 'last_month' as DatePreset, label: 'Bulan Lalu' },
                { id: 'custom' as DatePreset, label: 'Rentang Kustom' }
              ].map((p) => {
                const isActive = datePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setDatePreset(p.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {p.id === 'custom' && <Filter className="w-3.5 h-3.5" />}
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Pickers Row */}
            {datePreset === 'custom' && (
              <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-4 bg-zinc-950/60 p-3.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400">Dari Tanggal:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400">Sampai Tanggal:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* Active Filter Info Badge */}
            <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 bg-zinc-950/40 px-3.5 py-2 rounded-xl border border-zinc-800/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>
                  Periode Aktif: <strong className="text-zinc-200">{dateFilterLabel}</strong>
                </span>
                <span className="text-zinc-600">•</span>
                <span>
                  <strong className="text-orange-400">{filteredTrxCount}</strong> transaksi terhitung
                </span>
              </div>
              <div className="font-semibold text-zinc-300">
                Total Omset Terfilter: <span className="text-emerald-400 font-bold">{formatRp(globalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* MAIN LEADERBOARD & SUMMARY GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leaderboard Table Column */}
            <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard Revenue PIC Sales & Front Desk
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Laporan penjualan PIC dipisahkan antara closing member baru (NEW: murni paket membership) dan perpanjangan (RENEWAL)
                  </p>
                </div>

                {/* Sort Option Dropdown */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" /> Urutkan:
                  </span>
                  <select
                    value={leaderboardSortBy}
                    onChange={(e) => setLeaderboardSortBy(e.target.value as any)}
                    className="bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="revenue">Total Omset (Tertinggi)</option>
                    <option value="newRevenue">Omset Closing NEW Mbr (Tertinggi)</option>
                    <option value="renewalRevenue">Omset RENEWAL (Tertinggi)</option>
                    <option value="totalClosing">Total Transaksi Closing</option>
                  </select>
                </div>
              </div>

              {/* Sub-Tabs: Pisahkan Mode Laporan Leaderboard */}
              <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800/80 overflow-x-auto max-w-full scrollbar-none items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLeaderboardViewMode('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    leaderboardViewMode === 'all'
                      ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Semua Transaksi ({formatRp(globalRevenue)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeaderboardViewMode('new')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    leaderboardViewMode === 'new'
                      ? 'bg-emerald-500 text-zinc-950 font-black shadow-md shadow-emerald-500/20'
                      : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Khusus NEW Member ({globalNewCount} Mbr Baru • {formatRp(globalNewRevenue)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeaderboardViewMode('renewal')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    leaderboardViewMode === 'renewal'
                      ? 'bg-blue-500 text-white font-black shadow-md shadow-blue-500/20'
                      : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Khusus RENEWAL ({globalRenewalCount} Unit • {formatRp(globalRenewalRevenue)})</span>
                </button>
              </div>

              {/* Leaderboard Table with Separated Columns */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Peringkat</th>
                      <th className="py-2.5 px-3">Nama PIC</th>
                      {/* Separate New Column */}
                      <th className={`py-2.5 px-3 ${leaderboardViewMode === 'new' ? 'bg-emerald-500/15 text-emerald-300 rounded-t-xl' : 'text-emerald-400'}`}>
                        <div className="flex items-center gap-1">
                          <UserPlus className="w-3 h-3" /> Closing NEW Member
                        </div>
                      </th>
                      {/* Separate Renewal Column */}
                      <th className={`py-2.5 px-3 ${leaderboardViewMode === 'renewal' ? 'bg-blue-500/15 text-blue-300 rounded-t-xl' : 'text-blue-400'}`}>
                        <div className="flex items-center gap-1">
                          <Repeat className="w-3 h-3" /> Closing RENEWAL
                        </div>
                      </th>
                      <th className="py-2.5 px-3">Paket Mbr & PT</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue</th>
                      <th className="py-2.5 px-3 text-center">Detail PIC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
                    {rankedPICs.map((pic, idx) => {
                      const isExpanded = expandedPicId === pic.id;
                      const totalPackagesSold = pic.membershipCount + pic.ptCount + pic.posCount;

                      return (
                        <React.Fragment key={pic.id}>
                          <tr
                            onClick={() => setExpandedPicId(isExpanded ? null : pic.id)}
                            className={`cursor-pointer transition ${
                              isExpanded ? 'bg-orange-500/10' : 'hover:bg-zinc-800/40'
                            }`}
                          >
                            <td className="py-3.5 px-3 font-bold text-xs">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-[11px] shrink-0">
                                  {pic.photo ? (
                                    <img src={pic.photo} alt={pic.name} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    pic.name.slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{pic.name}</span>
                                    {idx === 0 && (
                                      <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-black">
                                        {leaderboardViewMode === 'new' ? 'TOP NEW' : leaderboardViewMode === 'renewal' ? 'TOP RENEWAL' : 'TOP SALES'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">{pic.roleName}</div>
                                </div>
                              </div>
                            </td>

                            {/* SEPARATED NEW MEMBER REPORT */}
                            <td className={`py-3.5 px-3 ${leaderboardViewMode === 'new' ? 'bg-emerald-500/10 font-bold' : ''}`}>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-emerald-500/15 text-emerald-400 font-black px-2 py-0.5 rounded-md text-[11px]">
                                    {pic.newCount} New
                                  </span>
                                  <span className="font-bold text-emerald-300 text-xs">
                                    {formatRp(pic.newRevenue)}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* SEPARATED RENEWAL REPORT */}
                            <td className={`py-3.5 px-3 ${leaderboardViewMode === 'renewal' ? 'bg-blue-500/10 font-bold' : ''}`}>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-blue-500/15 text-blue-400 font-black px-2 py-0.5 rounded-md text-[11px]">
                                    {pic.renewalCount} Rnw
                                  </span>
                                  <span className="font-bold text-blue-300 text-xs">
                                    {formatRp(pic.renewalRevenue)}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* PAKET MEMBERSHIP & PT */}
                            <td className="py-3.5 px-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-indigo-500/15 text-indigo-400 font-bold px-1.5 py-0.2 rounded text-[10px]">
                                    {pic.membershipCount} Mbr
                                  </span>
                                  <span className="text-[10px] text-zinc-400">{formatRp(pic.membershipRevenue)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-emerald-500/15 text-emerald-400 font-bold px-1.5 py-0.2 rounded text-[10px]">
                                    {pic.ptCount} PT
                                  </span>
                                  <span className="text-[10px] text-zinc-400">{formatRp(pic.ptRevenue)}</span>
                                </div>
                              </div>
                            </td>

                            {/* TOTAL REVENUE */}
                            <td className="py-3.5 px-3 text-right font-black text-orange-400 text-sm">
                              {formatRp(pic.revenue)}
                            </td>

                            {/* ACTION BUTTONS */}
                            <td className="py-3.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedPicId(isExpanded ? null : pic.id);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                    isExpanded
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                                  }`}
                                  title="Lihat rincian pemisahan New dan Renewal"
                                >
                                  <span>{totalPackagesSold} Item</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedModalPic(pic);
                                    setModalFilterCat('all');
                                    setModalSearch('');
                                  }}
                                  className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition"
                                  title="Buka dialog detail lengkap"
                                >
                                  <Eye className="w-3.5 h-3.5 text-orange-400" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDABLE ACCORDION DETAIL ROW - SEPARATED NEW VS RENEWAL */}
                          {isExpanded && (
                            <tr className="bg-zinc-950/90">
                              <td colSpan={7} className="p-4 border-y border-zinc-800/80">
                                <div className="space-y-4">
                                  {/* Header summary of expanded PIC */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
                                    <div className="flex items-center gap-2">
                                      <Package className="w-4 h-4 text-orange-400" />
                                      <span className="font-bold text-xs text-white">
                                        Rincian Laporan Penjualan PIC: {pic.name} ({dateFilterLabel})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[11px] text-zinc-400">
                                        Total: <strong className="text-orange-400">{formatRp(pic.revenue)}</strong> ({totalPackagesSold} transaksi)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedModalPic(pic);
                                          setModalFilterCat('all');
                                          setModalSearch('');
                                        }}
                                        className="text-[11px] text-orange-400 hover:text-orange-300 font-bold underline flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" /> Buka Modal Penuh
                                      </button>
                                    </div>
                                  </div>

                                  {/* DUA KARTU UTAMA: LAPORAN CLOSING NEW vs RENEWAL TERPISAH */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* KARTU 1: LAPORAN CLOSING NEW MEMBER (MURNI MEMBERSHIP) */}
                                    <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                            <UserPlus className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <h5 className="font-bold text-xs text-white">Laporan Closing NEW Member</h5>
                                            <p className="text-[10px] text-zinc-400">Khusus pembelian paket membership member baru</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-xs font-black text-emerald-400 block">{formatRp(pic.newRevenue)}</span>
                                          <span className="text-[10px] font-bold text-emerald-300/80 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                            {pic.newCount} Membership Baru
                                          </span>
                                        </div>
                                      </div>

                                      {/* Daftar Transaksi New PIC (Hanya Pembelian Membership Murni) */}
                                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                                        {pic.transactions.filter((t) => t.isNewMember).length === 0 ? (
                                          <p className="text-[11px] text-zinc-500 italic py-2">
                                            Tidak ada closing pembelian membership baru pada periode ini.
                                          </p>
                                        ) : (
                                          pic.transactions
                                            .filter((t) => t.isNewMember)
                                            .map((trx) => (
                                              <div
                                                key={trx.id}
                                                className="bg-zinc-950/80 border border-emerald-500/20 p-2 rounded-xl flex items-center justify-between text-xs"
                                              >
                                                <div className="space-y-0.5 max-w-[65%]">
                                                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                                                    <span>{trx.customer}</span>
                                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-bold">
                                                      NEW MBR
                                                    </span>
                                                  </div>
                                                  <div className="text-[10px] text-zinc-400 truncate">{trx.desc}</div>
                                                </div>
                                                <div className="text-right">
                                                  <div className="font-black text-emerald-400">{formatRp(trx.picRevenue)}</div>
                                                  <div className="text-[9px] text-zinc-500">{trx.date}</div>
                                                </div>
                                              </div>
                                            ))
                                        )}
                                      </div>
                                    </div>

                                    {/* KARTU 2: LAPORAN CLOSING RENEWAL */}
                                    <div className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-4 space-y-3">
                                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                            <Repeat className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <h5 className="font-bold text-xs text-white">Laporan Closing RENEWAL</h5>
                                            <p className="text-[10px] text-zinc-400">Perpanjangan paket member aktif/expired</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-xs font-black text-blue-400 block">{formatRp(pic.renewalRevenue)}</span>
                                          <span className="text-[10px] font-bold text-blue-300/80 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                            {pic.renewalCount} Perpanjangan
                                          </span>
                                        </div>
                                      </div>

                                      {/* Daftar Transaksi Renewal PIC */}
                                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                                        {pic.transactions.filter((t) => t.isRenewal).length === 0 ? (
                                          <p className="text-[11px] text-zinc-500 italic py-2">
                                            Tidak ada perpanjangan (renewal) pada periode ini.
                                          </p>
                                        ) : (
                                          pic.transactions
                                            .filter((t) => t.isRenewal)
                                            .map((trx) => (
                                              <div
                                                key={trx.id}
                                                className="bg-zinc-950/80 border border-blue-500/20 p-2 rounded-xl flex items-center justify-between text-xs"
                                              >
                                                <div className="space-y-0.5 max-w-[65%]">
                                                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                                                    <span>{trx.customer}</span>
                                                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-bold">
                                                      RENEWAL
                                                    </span>
                                                  </div>
                                                  <div className="text-[10px] text-zinc-400 truncate">{trx.desc}</div>
                                                </div>
                                                <div className="text-right">
                                                  <div className="font-black text-blue-400">{formatRp(trx.picRevenue)}</div>
                                                  <div className="text-[9px] text-zinc-500">{trx.date}</div>
                                                </div>
                                              </div>
                                            ))
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Rincian Produk/Paket Membership & PT */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
                                      <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                                        <span className="flex items-center gap-1.5">
                                          <Users className="w-3.5 h-3.5 text-indigo-400" /> Paket Membership
                                        </span>
                                        <span className="text-indigo-400 font-bold">{pic.membershipCount} Paket • {formatRp(pic.membershipRevenue)}</span>
                                      </div>
                                      <div className="space-y-1">
                                        {pic.products.filter(p => p.category === 'Membership').map((prod, pIdx) => (
                                          <div key={pIdx} className="bg-zinc-950/60 p-2 rounded-xl flex items-center justify-between text-xs">
                                            <span className="text-zinc-300 truncate max-w-[65%]">{prod.name} ({prod.count}x)</span>
                                            <span className="font-bold text-indigo-400">{formatRp(prod.revenue)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
                                      <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                                        <span className="flex items-center gap-1.5">
                                          <Dumbbell className="w-3.5 h-3.5 text-emerald-400" /> Paket Personal Trainer (PT)
                                        </span>
                                        <span className="text-emerald-400 font-bold">{pic.ptCount} Sesi • {formatRp(pic.ptRevenue)}</span>
                                      </div>
                                      <div className="space-y-1">
                                        {pic.products.filter(p => p.category === 'PT').map((prod, pIdx) => (
                                          <div key={pIdx} className="bg-zinc-950/60 p-2 rounded-xl flex items-center justify-between text-xs">
                                            <span className="text-zinc-300 truncate max-w-[65%]">{prod.name} ({prod.count}x)</span>
                                            <span className="font-bold text-emerald-400">{formatRp(prod.revenue)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Global Summary Box on Right Column with New & Renewal Separation */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm space-y-5">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Total Revenue Periode Terpilih
                </p>
                <h3 className="text-3xl font-black text-orange-400 mt-1">{formatRp(globalRevenue)}</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Akumulasi penjualan paket membership & PT ({dateFilterLabel})
                </p>

                {/* Progress Bar: Perbandingan Omset NEW vs RENEWAL */}
                <div className="mt-4 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-left space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> NEW: {globalRevenue > 0 ? Math.round((globalNewRevenue / globalRevenue) * 100) : 0}%
                    </span>
                    <span className="text-blue-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span> RENEWAL: {globalRevenue > 0 ? Math.round((globalRenewalRevenue / globalRevenue) * 100) : 0}%
                    </span>
                  </div>
                  {/* Dual color progress bar */}
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${globalRevenue > 0 ? (globalNewRevenue / globalRevenue) * 100 : 50}%` }}
                      title={`New: ${formatRp(globalNewRevenue)}`}
                    ></div>
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${globalRevenue > 0 ? (globalRenewalRevenue / globalRevenue) * 100 : 50}%` }}
                      title={`Renewal: ${formatRp(globalRenewalRevenue)}`}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                    <span>{formatRp(globalNewRevenue)}</span>
                    <span>{formatRp(globalRenewalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Top Sales Highlight Cards for New vs Renewal */}
              <div className="space-y-2 text-left">
                {/* Top Overall */}
                {topPerformerAll && (
                  <div className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[8px] px-2 py-0.5 rounded-bl-lg uppercase">
                      Top Overall
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-xs">
                        🥇
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-400 font-medium">Juara Omset Keseluruhan</div>
                        <div className="font-bold text-white text-xs">{topPerformerAll.name}</div>
                        <div className="text-[11px] font-bold text-orange-400">{formatRp(topPerformerAll.revenue)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top New vs Top Renewal row */}
                <div className="grid grid-cols-2 gap-2">
                  {topPerformerNew && (
                    <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-2xl p-2.5">
                      <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Top Closer NEW
                      </span>
                      <div className="font-bold text-white text-xs mt-1.5 truncate">{topPerformerNew.name}</div>
                      <div className="text-[11px] font-black text-emerald-400">{formatRp(topPerformerNew.newRevenue)}</div>
                      <span className="text-[9px] text-zinc-400">{topPerformerNew.newCount} member baru</span>
                    </div>
                  )}

                  {topPerformerRenewal && (
                    <div className="bg-zinc-900/80 border border-blue-500/30 rounded-2xl p-2.5">
                      <span className="text-[8px] font-black uppercase text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        Top RENEWAL
                      </span>
                      <div className="font-bold text-white text-xs mt-1.5 truncate">{topPerformerRenewal.name}</div>
                      <div className="text-[11px] font-black text-blue-400">{formatRp(topPerformerRenewal.renewalRevenue)}</div>
                      <span className="text-[9px] text-zinc-400">{topPerformerRenewal.renewalCount} perpanjangan</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 KPI Summary Cards with separated New and Renewal */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-zinc-900 border border-emerald-500/20 rounded-2xl p-3 text-left">
                  <p className="text-[9px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Closing NEW
                  </p>
                  <h4 className="text-lg font-black text-white mt-0.5">{globalNewCount}</h4>
                  <span className="text-[10px] text-emerald-400 font-bold block">{formatRp(globalNewRevenue)}</span>
                  <span className="text-[9px] text-zinc-500">Member baru</span>
                </div>

                <div className="bg-zinc-900 border border-blue-500/20 rounded-2xl p-3 text-left">
                  <p className="text-[9px] font-bold text-blue-400 uppercase flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> RENEWAL
                  </p>
                  <h4 className="text-lg font-black text-white mt-0.5">{globalRenewalCount}</h4>
                  <span className="text-[10px] text-blue-400 font-bold block">{formatRp(globalRenewalRevenue)}</span>
                  <span className="text-[9px] text-zinc-500">Perpanjangan</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-left">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Paket Membership</p>
                  <h4 className="text-lg font-black text-indigo-400 mt-0.5">{globalMembershipUnits}</h4>
                  <span className="text-[10px] text-zinc-400 block">{formatRp(globalMembershipRevenue)}</span>
                  <span className="text-[9px] text-zinc-500">Paket terjual</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-left">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Paket PT</p>
                  <h4 className="text-lg font-black text-emerald-400 mt-0.5">{globalPtUnits}</h4>
                  <span className="text-[10px] text-zinc-400 block">{formatRp(globalPtRevenue)}</span>
                  <span className="text-[9px] text-zinc-500">Sesi/paket</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LEADS KANBAN PIPELINE */}
      {activeSubTab === 'leads' && (
        <div className="space-y-5">
          {/* Header & Quick Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-3xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                <h3 className="text-sm font-bold text-white">Pipeline Prospek Calon Member (CRM Leads)</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Setiap calon member ditugaskan secara jelas ke Petugas Front Desk / PIC agar teratur dan tidak tertukar.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLeadPicId(currentUser?.id || staffUsers[0]?.id || '');
                  setIsAddLeadOpen(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Tambah Lead Baru
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Leads Aktif</p>
                <h4 className="text-lg font-black text-white mt-0.5">
                  {allPipelineLeads.filter((l) => l.status !== 'Lost' && l.status !== 'Member').length}
                </h4>
                <p className="text-[9px] text-zinc-400">Total prospek berjalan</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Target className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Estimasi Pipeline</p>
                <h4 className="text-lg font-black text-emerald-400 mt-0.5">{formatRp(activePipelineValue)}</h4>
                <p className="text-[9px] text-zinc-400">Potensi nilai closing</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div
              onClick={() => {
                setLeadScope(leadScope === 'online' ? 'all' : 'online');
                setFilterLeadPic('all');
              }}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                leadScope === 'online'
                  ? 'bg-cyan-500/20 border-cyan-500/60 ring-1 ring-cyan-500'
                  : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" /> Member Online
                </p>
                <h4 className="text-lg font-black text-cyan-300 mt-0.5">{onlineLeadsCount} Member</h4>
                <p className="text-[9px] text-zinc-400">Daftar Web & Portal</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Ticket className="w-4 h-4" />
              </div>
            </div>

            <div
              onClick={() => {
                setLeadScope(leadScope === 'my' ? 'all' : 'my');
                setFilterLeadPic('all');
              }}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                leadScope === 'my'
                  ? 'bg-orange-500/20 border-orange-500/60 ring-1 ring-orange-500'
                  : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold text-orange-400 uppercase flex items-center gap-1">
                  ⭐ Tanggung Jawab Saya
                </p>
                <h4 className="text-lg font-black text-white mt-0.5">{myLeadsCount} Prospek</h4>
                <p className="text-[9px] text-zinc-400">
                  {currentUser?.name || 'Petugas Aktif'} ({currentUser?.roleName || 'Front Desk'})
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Closing Win Rate</p>
                <h4 className="text-lg font-black text-purple-400 mt-0.5">{closingRate}%</h4>
                <p className="text-[9px] text-zinc-400">{formatRp(winClosingValue)} terkonversi</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* FRONT DESK PIC RESPONSIBILITY STRIP (Pencegah Tertukar) */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Distribusi Petugas Front Desk / PIC (Klik untuk filter):
                </span>
              </div>
              <span className="text-[10px] text-zinc-400">
                Memastikan tidak ada calon member yang tertukar atau terlantar
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
              <button
                onClick={() => {
                  setFilterLeadPic('all');
                  setLeadScope('all');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  filterLeadPic === 'all' && leadScope === 'all'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                }`}
              >
                <span>Semua Petugas</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    filterLeadPic === 'all' && leadScope === 'all'
                      ? 'bg-black/30 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {allPipelineLeads.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setLeadScope(leadScope === 'online' ? 'all' : 'online');
                  setFilterLeadPic('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                  leadScope === 'online'
                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-md'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-cyan-400 border-cyan-500/30'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>🌐 Daftar Online</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${leadScope === 'online' ? 'bg-black/30 text-white' : 'bg-cyan-500/20 text-cyan-300'}`}>
                  {onlineLeadsCount}
                </span>
              </button>

              {staffUsers
                .slice()
                .sort((a, b) => {
                  const divA = getStaffDivision(a);
                  const divB = getStaffDivision(b);
                  if (divA === 'Kasir & Front Desk' && divB !== 'Kasir & Front Desk') return -1;
                  if (divB === 'Kasir & Front Desk' && divA !== 'Kasir & Front Desk') return 1;
                  return a.name.localeCompare(b.name);
                })
                .map((staff) => {
                  const staffDivision = getStaffDivision(staff);
                  const staffLeadsCount = allPipelineLeads.filter(
                    (l) => l.picId === staff.id && l.status !== 'Lost'
                  ).length;
                  const isSelected = filterLeadPic === staff.id;
                  const isMe = currentUser?.id === staff.id;

                  return (
                    <button
                      key={staff.id}
                      onClick={() => {
                        setFilterLeadPic(staff.id);
                        setLeadScope('all');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 shrink-0 border ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                          : isMe
                          ? 'bg-zinc-950 hover:bg-zinc-800 text-orange-400 border-orange-500/40'
                          : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 flex items-center justify-center shrink-0">
                        {staff.photo ? (
                          <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-300">
                            {staff.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-[110px]">{staff.name}</span>
                          {isMe && <span className="text-[9px] text-amber-300">⭐</span>}
                        </div>
                        <span className="text-[9px] opacity-75 font-normal block leading-tight">
                          {staffDivision === 'Kasir & Front Desk'
                            ? 'Kasir & Front Desk'
                            : staffDivision === 'Pelatihan'
                            ? 'Pelatihan (PT)'
                            : staff.roleName?.split(' ')[0] || 'Staff'} {staff.shift ? `(${staff.shift})` : ''}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-black/30 text-white'
                            : staffLeadsCount > 0
                            ? 'bg-zinc-800 text-zinc-200'
                            : 'bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        {staffLeadsCount}
                      </span>
                    </button>
                  );
                })}

              <button
                onClick={() => {
                  setFilterLeadPic('unassigned');
                  setLeadScope('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                  filterLeadPic === 'unassigned'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-amber-400 border-amber-500/30'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Belum Ada PIC</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
                  {unassignedLeadsCount}
                </span>
              </button>
            </div>
          </div>

          {/* STAGE SELECTOR TABS & MONITORING VIEW MODE BAR */}
          <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Stage Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
              <button
                onClick={() => setExpandedStage(null)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                  expandedStage === null
                    ? 'bg-zinc-800 text-white border-zinc-700 shadow-sm'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Semua Tahap (5 Kolom)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  {filteredLeads.length}
                </span>
              </button>

              {STAGE_CONFIGS.map((sc) => {
                const count = filteredLeads.filter((l) => l.status === sc.key).length;
                const onlineInStage = filteredLeads.filter((l) => l.status === sc.key && isOnlineLead(l)).length;
                const isExpandedThis = expandedStage === sc.key;
                return (
                  <button
                    key={sc.key}
                    onClick={() => setExpandedStage(isExpandedThis ? null : sc.key)}
                    title={`Klik untuk expand tahap ${sc.label} (Fokus Mode)`}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                      isExpandedThis
                        ? `${sc.accentBg} ${sc.textColor} border-current shadow-md ring-1 ring-current/40`
                        : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${sc.dotColor}`}></span>
                    <span>{sc.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 font-mono font-bold">
                      {count}
                    </span>
                    {onlineInStage > 0 && (
                      <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-500/30 flex items-center gap-0.5" title={`${onlineInStage} daftar online`}>
                        <Globe className="w-2.5 h-2.5" /> {onlineInStage}
                      </span>
                    )}
                    <Maximize2 className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle (Kanban vs Table) */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              {Object.values(collapsedStages).some(Boolean) && expandedStage === null && (
                <button
                  onClick={() => setCollapsedStages({})}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition"
                  title="Buka kembali semua kolom yang di-collapse"
                >
                  Buka Semua Kolom
                </button>
              )}

              {expandedStage === null && (
                <div className="bg-zinc-950 border border-zinc-800 p-1 rounded-xl flex items-center gap-1">
                  <button
                    onClick={() => setPipelineViewMode('kanban')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      pipelineViewMode === 'kanban'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> Board
                  </button>
                  <button
                    onClick={() => setPipelineViewMode('table')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      pipelineViewMode === 'table'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> Tabel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* FILTER CONTROLS & SEARCH BAR */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Scope Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => {
                  setLeadScope('all');
                  setFilterLeadPic('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  leadScope === 'all' && filterLeadPic === 'all'
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Semua ({allPipelineLeads.length})
              </button>
              <button
                onClick={() => {
                  setLeadScope('online');
                  setFilterLeadPic('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                  leadScope === 'online'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow'
                    : 'text-cyan-400 hover:bg-cyan-500/10 border-transparent'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🌐 Daftar Online ({onlineLeadsCount})</span>
              </button>
              <button
                onClick={() => {
                  setLeadScope('my');
                  setFilterLeadPic('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  leadScope === 'my'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-orange-400 hover:bg-orange-500/10'
                }`}
              >
                ⭐ Tanggung Jawab Saya ({myLeadsCount})
              </button>
              <button
                onClick={() => {
                  setLeadScope('unassigned');
                  setFilterLeadPic('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  leadScope === 'unassigned'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                ⚠️ Belum Ada PIC ({unassignedLeadsCount})
              </button>
              <button
                onClick={() => setLeadScope(leadScope === 'high_priority' ? 'all' : 'high_priority')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  leadScope === 'high_priority'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                🔥 Prioritas Tinggi ({highPriorityLeadsCount})
              </button>
            </div>

            {/* Dropdown Filters & Search */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Dropdown Filter PIC (Front Desk / Sales) */}
              <div className="relative">
                <select
                  aria-label="Filter Petugas PIC"
                  value={
                    leadScope === 'my'
                      ? 'my'
                      : leadScope === 'unassigned' || filterLeadPic === 'unassigned'
                      ? 'unassigned'
                      : filterLeadPic
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'all') {
                      setFilterLeadPic('all');
                      if (leadScope === 'my' || leadScope === 'unassigned') {
                        setLeadScope('all');
                      }
                    } else if (val === 'my') {
                      setLeadScope('my');
                      setFilterLeadPic('all');
                    } else if (val === 'unassigned') {
                      setFilterLeadPic('unassigned');
                      setLeadScope('all');
                    } else {
                      setFilterLeadPic(val);
                      setLeadScope('all');
                    }
                  }}
                  className={`border rounded-xl px-2.5 py-1.5 text-xs outline-none transition font-medium cursor-pointer ${
                    filterLeadPic !== 'all' || leadScope === 'my' || leadScope === 'unassigned'
                      ? 'bg-orange-500/15 border-orange-500/60 text-orange-300 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-orange-500'
                  }`}
                >
                  <option value="all">👤 Semua PIC / Petugas ({allPipelineLeads.length})</option>
                  {currentUser && (
                    <option value="my">⭐ PIC: Tanggung Jawab Saya ({myLeadsCount})</option>
                  )}
                  <option value="unassigned">⚠️ Belum Ada PIC ({unassignedLeadsCount})</option>
                  <optgroup label="🏛️ Divisi Kasir & Front Desk (PIC Utama Prospek)">
                    {staffUsers
                      .filter((s) => getStaffDivision(s) === 'Kasir & Front Desk')
                      .map((staff) => {
                        const count = allPipelineLeads.filter((l) => l.picId === staff.id && l.status !== 'Lost').length;
                        const shiftDisplay = staff.shift ? ` [${staff.shift}]` : '';
                        return (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} (Kasir & Front Desk{shiftDisplay}) — {count} Leads
                          </option>
                        );
                      })}
                  </optgroup>
                  <optgroup label="🏋️ Divisi Pelatihan (Beda Devisi - Pelatih & PT)">
                    {staffUsers
                      .filter((s) => getStaffDivision(s) === 'Pelatihan')
                      .map((staff) => {
                        const count = allPipelineLeads.filter((l) => l.picId === staff.id && l.status !== 'Lost').length;
                        const shiftDisplay = staff.shift ? ` [${staff.shift}]` : '';
                        return (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} (Pelatih PT{shiftDisplay}) — {count} Leads
                          </option>
                        );
                      })}
                  </optgroup>
                  <optgroup label="🏢 Divisi Manajemen & Operasional">
                    {staffUsers
                      .filter((s) => getStaffDivision(s) !== 'Kasir & Front Desk' && getStaffDivision(s) !== 'Pelatihan')
                      .map((staff) => {
                        const count = allPipelineLeads.filter((l) => l.picId === staff.id && l.status !== 'Lost').length;
                        return (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} ({staff.roleName || staff.role}) — {count} Leads
                          </option>
                        );
                      })}
                  </optgroup>
                </select>
              </div>

              {/* Filter Sumber */}
              <div className="relative">
                <select
                  value={filterLeadSource}
                  onChange={(e) => setFilterLeadSource(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-orange-500"
                >
                  <option value="all">Semua Sumber</option>
                  <option value="Daftar Online (Website)">🌐 Daftar Online (Website)</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Referral">Referral</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Google / Web">Google / Web</option>
                </select>
              </div>

              {/* Filter Prioritas */}
              <div className="relative">
                <select
                  value={filterLeadPriority}
                  onChange={(e) => setFilterLeadPriority(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-orange-500"
                >
                  <option value="all">Semua Prioritas</option>
                  <option value="Tinggi">🔥 Tinggi</option>
                  <option value="Sedang">⚡ Sedang</option>
                  <option value="Rendah">Rendah</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Cari prospek, telp, PIC..."
                  value={searchLeadQuery}
                  onChange={(e) => setSearchLeadQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-500"
                />
                {searchLeadQuery && (
                  <button
                    onClick={() => setSearchLeadQuery('')}
                    className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Indicator & Reset */}
          {(filterLeadPic !== 'all' || leadScope !== 'all' || filterLeadSource !== 'all' || filterLeadPriority !== 'all' || searchLeadQuery.trim() !== '') && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-xs animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-zinc-400 font-medium">Fokus Filter:</span>
                {(filterLeadPic !== 'all' || leadScope === 'my' || leadScope === 'unassigned') && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/20 text-orange-300 rounded-lg font-bold border border-orange-500/30">
                    <UserCheck className="w-3.5 h-3.5" />
                    PIC:{' '}
                    {leadScope === 'my'
                      ? `Saya (${currentUser?.name || 'Petugas'})`
                      : leadScope === 'unassigned' || filterLeadPic === 'unassigned'
                      ? 'Belum Ada PIC'
                      : getStaffById(filterLeadPic)?.name || filterLeadPic}
                    <button
                      onClick={() => {
                        setFilterLeadPic('all');
                        if (leadScope === 'my' || leadScope === 'unassigned') setLeadScope('all');
                      }}
                      className="hover:text-white ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {leadScope === 'online' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg font-bold border border-cyan-500/30">
                    <Globe className="w-3 h-3" /> Member Daftar Online
                    <button onClick={() => setLeadScope('all')} className="hover:text-white ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {leadScope === 'high_priority' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/20 text-rose-300 rounded-lg font-bold border border-rose-500/30">
                    <Flame className="w-3 h-3" /> Prioritas Tinggi
                    <button onClick={() => setLeadScope('all')} className="hover:text-white ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterLeadSource !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-lg font-bold border border-zinc-700">
                    Sumber: {filterLeadSource}
                    <button onClick={() => setFilterLeadSource('all')} className="hover:text-white ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterLeadPriority !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-lg font-bold border border-zinc-700">
                    Prioritas: {filterLeadPriority}
                    <button onClick={() => setFilterLeadPriority('all')} className="hover:text-white ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchLeadQuery.trim() !== '' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-lg font-bold border border-zinc-700">
                    Cari: "{searchLeadQuery}"
                    <button onClick={() => setSearchLeadQuery('')} className="hover:text-white ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-zinc-400 font-medium">
                  Menampilkan <strong className="text-white">{filteredLeads.length}</strong> dari {allPipelineLeads.length} prospek
                </span>
                <button
                  onClick={() => {
                    setFilterLeadPic('all');
                    setLeadScope('all');
                    setFilterLeadSource('all');
                    setFilterLeadPriority('all');
                    setSearchLeadQuery('');
                  }}
                  className="text-xs text-orange-400 hover:text-orange-300 underline font-semibold transition"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIPELINE RENDERING MODES: EXPANDED STAGE / TABLE VIEW / 5-COLUMN KANBAN */}
          {/* ========================================================================= */}
          {(() => {
            // Reusable Lead Card Renderer for both Kanban Columns & Expanded Cockpit
            const renderLeadCard = (lead: Lead, currentStage: Lead['status'], isExpandedView: boolean = false) => {
              const staff = getStaffById(lead.picId);
              const isMyLead = currentUser?.id === lead.picId;
              const isOnline = isOnlineLead(lead);
              const passcode = getOnlinePasscode(lead);
              const isCardExpanded = expandedCardIds.has(lead.id);

              return (
                <div
                  key={lead.id}
                  className={`bg-zinc-950 border p-3.5 rounded-2xl space-y-2.5 transition shadow-sm hover:border-zinc-700 relative ${
                    isMyLead
                      ? 'border-orange-500/40 ring-1 ring-orange-500/20'
                      : isOnline
                      ? 'border-cyan-500/40 bg-gradient-to-b from-cyan-950/10 to-zinc-950'
                      : 'border-zinc-800/90'
                  }`}
                >
                  {/* Top Strip: Priority + Source + Online Badge + Date */}
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          lead.priority === 'Tinggi'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : lead.priority === 'Sedang'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {lead.priority === 'Tinggi' ? '🔥 Tinggi' : lead.priority || 'Sedang'}
                      </span>

                      {isOnline ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shadow-sm">
                          <Globe className="w-2.5 h-2.5 text-cyan-400 animate-pulse" /> DAFTAR ONLINE
                        </span>
                      ) : (
                        <span className="text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          {lead.source}
                        </span>
                      )}
                    </div>
                    <span className="text-zinc-500">{formatDateIndo(lead.date || '')}</span>
                  </div>

                  {/* Online Passcode Strip (if online registration) */}
                  {isOnline && (
                    <div className="bg-gradient-to-r from-cyan-950/40 via-zinc-900/90 to-emerald-950/30 border border-cyan-500/30 rounded-xl px-2.5 py-1.5 text-[10px] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-cyan-300 font-bold">{passcode ? `Passcode: ${passcode}` : 'Reservasi Online'}</span>
                      </div>
                      <span className="text-[9px] text-zinc-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/20 font-medium">
                        Web Portal
                      </span>
                    </div>
                  )}

                  {/* Lead Name & Target Program */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h5
                        className="text-xs font-bold text-white hover:text-orange-400 transition cursor-pointer flex items-center gap-1"
                        onClick={() => setSelectedLeadForDetail(lead)}
                      >
                        <span>{lead.name}</span>
                      </h5>
                      {lead.estimatedValue ? (
                        <span className="text-[10px] text-emerald-400 font-bold">
                          {formatRp(lead.estimatedValue)}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span className="font-mono">{lead.phone}</span>
                        <button
                          onClick={() => handleCopyPhone(lead.phone, lead.name)}
                          title="Salin No. WhatsApp"
                          className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    {lead.interest && (
                      <p className="text-[10px] text-orange-400/90 font-medium mt-1 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10 truncate">
                        Minat: <strong className="text-zinc-200">{lead.interest}</strong>
                      </p>
                    )}
                  </div>

                  {/* PIC RESPONSIBILITY BOX (Pencegah Tertukar) */}
                  <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                          {staff?.photo ? (
                            <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-zinc-300">
                              {(staff?.name || lead.picName || '?').charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="leading-tight">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-zinc-200">
                              {staff?.name || lead.picName || 'Belum Ada PIC'}
                            </span>
                            {isMyLead && (
                              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-bold">
                                Milik Saya
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[9px] text-zinc-500">
                              {staff?.roleName || lead.picRole || 'Front Desk'} • Shift {staff?.shift || lead.picShift || 'Pagi'}
                            </span>
                            {(() => {
                              const div = lead.picDivision || getStaffDivision(staff);
                              return (
                                <span className={`text-[8px] px-1 py-0.2 rounded font-semibold ${
                                  div === 'Kasir & Front Desk'
                                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                    : div === 'Pelatihan'
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                }`}>
                                  {div}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Handover or Claim Button */}
                      {lead.picId ? (
                        <button
                          onClick={() => {
                            setSelectedLeadForHandover(lead);
                            setHandoverTargetPicId(staffUsers.find((s) => s.id !== lead.picId)?.id || '');
                            setHandoverPassword('');
                            setShowHandoverPassword(false);
                            setHandoverPasswordError('');
                          }}
                          title={
                            isLeadHandoverPasswordRequired
                              ? 'Oper Alih / Handover ke Petugas Lain (Dilindungi Sandi Keamanan)'
                              : 'Oper Alih / Handover ke Petugas Lain'
                          }
                          className="text-[9px] font-bold bg-zinc-800 hover:bg-zinc-700 text-orange-400 px-2 py-1 rounded-lg flex items-center gap-1 border border-zinc-700 transition"
                        >
                          {isLeadHandoverPasswordRequired ? (
                            <Lock className="w-2.5 h-2.5 text-amber-400" />
                          ) : (
                            <ArrowRightLeft className="w-2.5 h-2.5" />
                          )}
                          <span>Oper</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleClaimLead(lead)}
                          className="text-[9px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-500/30 transition"
                        >
                          <UserCheck className="w-2.5 h-2.5" /> Klaim
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Notes & Follow-up History Toggle */}
                  <div>
                    {lead.notes && !isCardExpanded && (
                      <p className="text-[10px] text-zinc-400 italic line-clamp-1 bg-zinc-900/40 px-2 py-1 rounded">
                        "{lead.notes}"
                      </p>
                    )}

                    {isCardExpanded && (
                      <div className="space-y-2 pt-1 border-t border-zinc-800/80 animate-in fade-in duration-150">
                        {lead.notes && (
                          <div className="bg-zinc-900/60 p-2 rounded-xl text-[10px] text-zinc-300 border border-zinc-800 space-y-0.5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase">Catatan Prospek:</span>
                            <p className="whitespace-pre-line leading-relaxed">{lead.notes}</p>
                          </div>
                        )}

                        {lead.followUpHistory && lead.followUpHistory.length > 0 && (
                          <div className="bg-zinc-900/60 p-2 rounded-xl text-[10px] border border-zinc-800 space-y-1">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> Log Follow-up Terakhir:
                            </span>
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center text-zinc-400 font-semibold">
                                <span>{lead.followUpHistory[0].result}</span>
                                <span className="text-[9px] text-zinc-500">{lead.followUpHistory[0].date}</span>
                              </div>
                              <p className="text-zinc-400 italic">{lead.followUpHistory[0].notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Quick Stage Mover Selector */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Pindah Tahap:</span>
                          <select
                            aria-label="Pindah Tahap"
                            value={lead.status}
                            onChange={(e) => handleMoveStage(lead, e.target.value as Lead['status'])}
                            className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] rounded-lg px-2 py-1 font-bold outline-none focus:border-orange-500"
                          >
                            <option value="Baru">🔵 Lead Baru</option>
                            <option value="Follow Up">🟠 Follow Up</option>
                            <option value="Trial">🟣 Trial / Visit</option>
                            <option value="Member">🟢 Win (Member)</option>
                            <option value="Lost">🔴 Lost / Batal</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => toggleCardExpand(lead.id)}
                      className="text-[9px] text-zinc-500 hover:text-zinc-300 font-medium flex items-center gap-1 mt-1 transition"
                    >
                      {isCardExpanded ? (
                        <>
                          <ChevronUp className="w-2.5 h-2.5" /> Sembunyikan Detail
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-2.5 h-2.5" /> Lihat Catatan & Riwayat ({lead.followUpHistory?.length || 0})
                        </>
                      )}
                    </button>
                  </div>

                  {/* Card Footer: WhatsApp & Stage Action */}
                  <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center gap-1">
                    <button
                      onClick={() => openWhatsAppLead(lead, isOnline ? 'online_welcome' : currentStage === 'Trial' ? 'trial' : currentStage === 'Follow Up' ? 'promo' : 'greeting')}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition"
                    >
                      <MessageSquare className="w-3 h-3" /> {isOnline ? 'Konfirmasi WA' : 'Chat WA'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedLeadForDetail(lead)}
                        title="Lihat Detail & Timeline"
                        className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded-lg transition"
                      >
                        <Eye className="w-3 h-3" />
                      </button>

                      {currentStage === 'Baru' && (
                        <button
                          onClick={() => handleMoveStage(lead, 'Follow Up')}
                          className="text-[10px] font-bold bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-sm"
                        >
                          Follow Up <ChevronRight className="w-3 h-3" />
                        </button>
                      )}

                      {currentStage === 'Follow Up' && (
                        <>
                          <button
                            onClick={() => handleMoveStage(lead, 'Baru')}
                            title="Kembalikan ke Baru"
                            className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white p-1.5 rounded-lg transition"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveStage(lead, 'Trial')}
                            className="text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-sm"
                          >
                            Ke Trial <ChevronRight className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      {currentStage === 'Trial' && (
                        <>
                          <button
                            onClick={() => handleMoveStage(lead, 'Follow Up')}
                            title="Kembalikan ke Follow Up"
                            className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white p-1.5 rounded-lg transition"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveStage(lead, 'Member')}
                            className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-sm"
                          >
                            Jadi Member <CheckCircle2 className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      {currentStage === 'Member' && (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Closing Win
                        </span>
                      )}

                      {currentStage === 'Lost' && (
                        <button
                          onClick={() => handleMoveStage(lead, 'Follow Up')}
                          className="text-[10px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded-lg border border-orange-500/20 transition"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Reaktivasi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            };

            // CASE 1: EXPANDED STAGE COCKPIT VIEW
            if (expandedStage !== null) {
              const activeStageConfig = STAGE_CONFIGS.find((s) => s.key === expandedStage) || STAGE_CONFIGS[0];
              const stageLeads = filteredLeads.filter((l) => l.status === expandedStage);
              const stageOnlineCount = stageLeads.filter((l) => isOnlineLead(l)).length;

              return (
                <div className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-5 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  {/* Cockpit Top Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedStage(null)}
                        className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-2 shrink-0 border border-zinc-700 shadow-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Kembali ke 5 Kolom</span>
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full ${activeStageConfig.dotColor}`}></span>
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            Fokus Tahap: {activeStageConfig.label}
                          </h3>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${activeStageConfig.bgBadge}`}>
                            {stageLeads.length} Prospek
                          </span>
                          {stageOnlineCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-cyan-400" /> {stageOnlineCount} Member Online
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {activeStageConfig.subtitle} • Monitoring mendalam dan aksi cepat khusus tahap ini
                        </p>
                      </div>
                    </div>

                    {/* Stage Switcher Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1 hidden sm:inline">Pindah Tahap:</span>
                      {STAGE_CONFIGS.map((sc) => {
                        const count = filteredLeads.filter((l) => l.status === sc.key).length;
                        const isCurrent = expandedStage === sc.key;
                        return (
                          <button
                            key={sc.key}
                            onClick={() => setExpandedStage(sc.key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border ${
                              isCurrent
                                ? `${sc.accentBg} ${sc.textColor} border-current shadow-md ring-1 ring-current/40`
                                : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${sc.dotColor}`}></span>
                            <span>{sc.label}</span>
                            <span className="text-[10px] px-1 py-0.2 rounded-full bg-zinc-800/80 font-mono font-bold">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage KPI Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Total Prospek</span>
                      <h4 className="text-2xl font-black text-white mt-1">{stageLeads.length}</h4>
                      <p className="text-[10px] text-zinc-400">Dalam tahap {activeStageConfig.label}</p>
                    </div>

                    <div className="bg-zinc-950 border border-cyan-500/30 p-3.5 rounded-2xl">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" /> Member Daftar Online
                      </span>
                      <h4 className="text-2xl font-black text-cyan-300 mt-1">{stageOnlineCount}</h4>
                      <p className="text-[10px] text-zinc-400">
                        {stageLeads.length > 0 ? Math.round((stageOnlineCount / stageLeads.length) * 100) : 0}% dari tahap ini
                      </p>
                    </div>

                    <div className="bg-zinc-950 border border-emerald-500/30 p-3.5 rounded-2xl">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Estimasi Nilai Pipeline</span>
                      <h4 className="text-2xl font-black text-emerald-400 mt-1">
                        {formatRp(stageLeads.reduce((a, b) => a + (b.estimatedValue || 0), 0))}
                      </h4>
                      <p className="text-[10px] text-zinc-400">Potensi konversi omzet</p>
                    </div>

                    <div className="bg-zinc-950 border border-amber-500/30 p-3.5 rounded-2xl">
                      <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Belum Ada PIC
                      </span>
                      <h4 className="text-2xl font-black text-amber-300 mt-1">
                        {stageLeads.filter((l) => !l.picId).length}
                      </h4>
                      <p className="text-[10px] text-zinc-400">Perlu penugasan segera</p>
                    </div>
                  </div>

                  {/* Stage Controls: View Mode & Online Filter */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-zinc-400 font-medium">Tampilan:</span>
                      <div className="bg-zinc-900 border border-zinc-800 p-0.5 rounded-xl flex items-center gap-1">
                        <button
                          onClick={() => setExpandedViewMode('grid')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            expandedViewMode === 'grid'
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" /> Grid Kartu
                        </button>
                        <button
                          onClick={() => setExpandedViewMode('table')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            expandedViewMode === 'table'
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <List className="w-3.5 h-3.5" /> Tabel Monitoring
                        </button>
                      </div>

                      <button
                        onClick={() => setLeadScope(leadScope === 'online' ? 'all' : 'online')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                          leadScope === 'online'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Hanya Daftar Online</span>
                        {stageOnlineCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-950 text-cyan-300 font-mono font-bold">
                            {stageOnlineCount}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="text-xs text-zinc-400">
                      Menampilkan <strong className="text-white">{stageLeads.length}</strong> prospek di tahap {activeStageConfig.label}
                    </div>
                  </div>

                  {/* Content: Grid or Table */}
                  {stageLeads.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-zinc-800 rounded-3xl text-zinc-500 text-sm space-y-2">
                      <p className="font-bold text-zinc-400">Tidak ada lead di tahap {activeStageConfig.label}</p>
                      <p className="text-xs text-zinc-500">
                        Ubah filter pencarian atau pindahkan lead dari tahapan lain ke sini.
                      </p>
                    </div>
                  ) : expandedViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {stageLeads.map((lead) => renderLeadCard(lead, activeStageConfig.key, true))}
                    </div>
                  ) : (
                    /* Expanded Table Monitoring View */
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="p-3.5 font-bold">No</th>
                            <th className="p-3.5 font-bold">Calon Member & Kontak</th>
                            <th className="p-3.5 font-bold">Sumber</th>
                            <th className="p-3.5 font-bold">Minat / Program</th>
                            <th className="p-3.5 font-bold">Est. Nilai</th>
                            <th className="p-3.5 font-bold">Petugas PIC</th>
                            <th className="p-3.5 font-bold">Catatan / Status</th>
                            <th className="p-3.5 font-bold text-center">Pindah Tahap</th>
                            <th className="p-3.5 font-bold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/80">
                          {stageLeads.map((lead, idx) => {
                            const staff = getStaffById(lead.picId);
                            const isOnline = isOnlineLead(lead);
                            const passcode = getOnlinePasscode(lead);
                            return (
                              <tr key={lead.id} className="hover:bg-zinc-900/50 transition">
                                <td className="p-3.5 text-zinc-500 font-mono">{idx + 1}</td>
                                <td className="p-3.5">
                                  <div>
                                    <span
                                      onClick={() => setSelectedLeadForDetail(lead)}
                                      className="font-bold text-white hover:text-orange-400 cursor-pointer block"
                                    >
                                      {lead.name}
                                    </span>
                                    <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                                      {lead.phone}
                                      <button
                                        onClick={() => handleCopyPhone(lead.phone, lead.name)}
                                        className="text-zinc-500 hover:text-zinc-300"
                                      >
                                        <Copy className="w-2.5 h-2.5" />
                                      </button>
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3.5">
                                  {isOnline ? (
                                    <div className="space-y-0.5">
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 inline-flex items-center gap-1">
                                        <Globe className="w-2.5 h-2.5" /> Online
                                      </span>
                                      {passcode && (
                                        <span className="block text-[9px] font-mono text-zinc-400">{passcode}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-[10px]">
                                      {lead.source}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5">
                                  <span className="text-zinc-200 font-medium">{lead.interest || '-'}</span>
                                </td>
                                <td className="p-3.5 font-bold text-emerald-400">
                                  {formatRp(lead.estimatedValue || 0)}
                                </td>
                                <td className="p-3.5">
                                  <div className="leading-tight">
                                    <span className="text-zinc-200 font-medium block">
                                      {staff?.name || lead.picName || 'Belum Ada PIC'}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] text-zinc-500">
                                        {staff?.roleName || lead.picRole || 'Front Desk'}
                                      </span>
                                      {(() => {
                                        const div = lead.picDivision || getStaffDivision(staff);
                                        return (
                                          <span className={`text-[8px] px-1 py-0.2 rounded font-semibold ${
                                            div === 'Kasir & Front Desk'
                                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                              : div === 'Pelatihan'
                                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                          }`}>
                                            {div}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3.5 max-w-[200px]">
                                  <p className="text-zinc-400 text-[11px] truncate">
                                    {lead.notes || (lead.followUpHistory?.[0]?.notes) || '-'}
                                  </p>
                                </td>
                                <td className="p-3.5 text-center">
                                  <select
                                    aria-label="Pindah Tahap"
                                    value={lead.status}
                                    onChange={(e) => handleMoveStage(lead, e.target.value as Lead['status'])}
                                    className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] rounded-lg px-2 py-1 font-bold outline-none cursor-pointer focus:border-orange-500"
                                  >
                                    <option value="Baru">🔵 Baru</option>
                                    <option value="Follow Up">🟠 Follow Up</option>
                                    <option value="Trial">🟣 Trial</option>
                                    <option value="Member">🟢 Member (Win)</option>
                                    <option value="Lost">🔴 Lost</option>
                                  </select>
                                </td>
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => openWhatsAppLead(lead, isOnline ? 'online_welcome' : 'greeting')}
                                      title="Chat WhatsApp"
                                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setSelectedLeadForDetail(lead)}
                                      title="Lihat Detail & Timeline"
                                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    {lead.status !== 'Member' && (
                                      <button
                                        onClick={() => handleMoveStage(lead, 'Member')}
                                        title="Jadikan Member Resmi"
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition shadow-sm"
                                      >
                                        Jadi Member
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            }

            // CASE 2: UNIFIED MONITORING TABLE VIEW ACROSS ALL STAGES
            if (pipelineViewMode === 'table') {
              return (
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <List className="w-4 h-4 text-orange-400" />
                        Tabel Monitoring Terpadu Prospek & Member Online
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Memantau seluruh calon member dari semua tahapan dalam satu daftar terstruktur
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400">
                      Total: <strong className="text-white">{filteredLeads.length}</strong> Prospek
                    </span>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="p-3.5 font-bold">No</th>
                          <th className="p-3.5 font-bold">Tahap</th>
                          <th className="p-3.5 font-bold">Calon Member & Kontak</th>
                          <th className="p-3.5 font-bold">Sumber</th>
                          <th className="p-3.5 font-bold">Minat / Program</th>
                          <th className="p-3.5 font-bold">Est. Nilai</th>
                          <th className="p-3.5 font-bold">Petugas PIC</th>
                          <th className="p-3.5 font-bold">Follow Up Terakhir</th>
                          <th className="p-3.5 font-bold text-center">Pindah Tahap</th>
                          <th className="p-3.5 font-bold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/80">
                        {filteredLeads.map((lead, idx) => {
                          const staff = getStaffById(lead.picId);
                          const isOnline = isOnlineLead(lead);
                          const passcode = getOnlinePasscode(lead);
                          const stageCfg = STAGE_CONFIGS.find((s) => s.key === lead.status) || STAGE_CONFIGS[0];

                          return (
                            <tr key={lead.id} className="hover:bg-zinc-900/50 transition">
                              <td className="p-3.5 text-zinc-500 font-mono">{idx + 1}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stageCfg.bgBadge} border border-current/30 inline-flex items-center gap-1`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${stageCfg.dotColor}`}></span>
                                  {stageCfg.label}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <div>
                                  <span
                                    onClick={() => setSelectedLeadForDetail(lead)}
                                    className="font-bold text-white hover:text-orange-400 cursor-pointer block"
                                  >
                                    {lead.name}
                                  </span>
                                  <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                                    {lead.phone}
                                    <button
                                      onClick={() => handleCopyPhone(lead.phone, lead.name)}
                                      className="text-zinc-500 hover:text-zinc-300"
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                    </button>
                                  </span>
                                </div>
                              </td>
                              <td className="p-3.5">
                                {isOnline ? (
                                  <div className="space-y-0.5">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 inline-flex items-center gap-1">
                                      <Globe className="w-2.5 h-2.5" /> Online
                                    </span>
                                    {passcode && (
                                      <span className="block text-[9px] font-mono text-zinc-400">{passcode}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-[10px]">
                                    {lead.source}
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className="text-zinc-200 font-medium">{lead.interest || '-'}</span>
                              </td>
                              <td className="p-3.5 font-bold text-emerald-400">
                                {formatRp(lead.estimatedValue || 0)}
                              </td>
                              <td className="p-3.5">
                                <div className="leading-tight">
                                  <span className="text-zinc-200 font-medium block">
                                    {staff?.name || lead.picName || 'Belum Ada PIC'}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-zinc-500">
                                      {staff?.roleName || lead.picRole || 'Front Desk'}
                                    </span>
                                    {(() => {
                                      const div = lead.picDivision || getStaffDivision(staff);
                                      return (
                                        <span className={`text-[8px] px-1 py-0.2 rounded font-semibold ${
                                          div === 'Kasir & Front Desk'
                                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                            : div === 'Pelatihan'
                                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                            : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                        }`}>
                                          {div}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5 max-w-[200px]">
                                <p className="text-zinc-400 text-[11px] truncate">
                                  {lead.notes || (lead.followUpHistory?.[0]?.notes) || '-'}
                                </p>
                              </td>
                              <td className="p-3.5 text-center">
                                <select
                                  aria-label="Pindah Tahap"
                                  value={lead.status}
                                  onChange={(e) => handleMoveStage(lead, e.target.value as Lead['status'])}
                                  className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] rounded-lg px-2 py-1 font-bold outline-none cursor-pointer focus:border-orange-500"
                                >
                                  <option value="Baru">🔵 Baru</option>
                                  <option value="Follow Up">🟠 Follow Up</option>
                                  <option value="Trial">🟣 Trial</option>
                                  <option value="Member">🟢 Member</option>
                                  <option value="Lost">🔴 Lost</option>
                                </select>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openWhatsAppLead(lead, isOnline ? 'online_welcome' : 'greeting')}
                                    title="Chat WhatsApp"
                                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedLeadForDetail(lead)}
                                    title="Lihat Detail & Timeline"
                                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  {lead.status !== 'Member' && (
                                    <button
                                      onClick={() => handleMoveStage(lead, 'Member')}
                                      title="Jadikan Member Resmi"
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition shadow-sm"
                                    >
                                      Jadi Member
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            // CASE 3: 5-COLUMN KANBAN BOARD WITH EXPAND & COLLAPSE SUPPORT
            return (
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 items-start">
                {STAGE_CONFIGS.map((stage) => {
                  const isCollapsed = Boolean(collapsedStages[stage.key]);
                  const stageLeads = filteredLeads.filter((l) => l.status === stage.key);
                  const stageOnlineCount = stageLeads.filter((l) => isOnlineLead(l)).length;
                  const stageTotalVal = stageLeads.reduce((a, b) => a + (b.estimatedValue || 0), 0);

                  // Collapsed Column Strip
                  if (isCollapsed) {
                    return (
                      <div
                        key={stage.key}
                        onClick={() => toggleColumnCollapse(stage.key)}
                        className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-2.5 flex flex-col items-center justify-between min-h-[500px] cursor-pointer hover:border-zinc-700 hover:bg-zinc-900 transition w-14 shrink-0 shadow-sm"
                        title={`Klik untuk membuka kembali kolom ${stage.label}`}
                      >
                        <div className="flex flex-col items-center gap-2 pt-2">
                          <span className={`w-3 h-3 rounded-full ${stage.dotColor}`}></span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stage.bgBadge}`}>
                            {stageLeads.length}
                          </span>
                        </div>

                        <div className="[writing-mode:vertical-rl] rotate-180 text-xs font-bold text-zinc-300 tracking-wider flex items-center gap-2 py-4">
                          <span>{stage.label}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleColumnCollapse(stage.key);
                          }}
                          className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                          title="Expand Kolom"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  // Normal Expanded Column
                  return (
                    <div
                      key={stage.key}
                      className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-3.5 flex flex-col min-h-[500px] min-w-[280px] sm:min-w-[300px] flex-1 shadow-sm transition"
                    >
                      {/* Column Header */}
                      <div className="flex justify-between items-start pb-3 mb-3 border-b border-zinc-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`}></span>
                            <span className="text-xs font-bold text-white">{stage.label}</span>
                            {stageOnlineCount > 0 && (
                              <span
                                className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-0.5"
                                title={`${stageOnlineCount} member daftar online`}
                              >
                                <Globe className="w-2.5 h-2.5" /> {stageOnlineCount}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">{stage.subtitle}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="text-right mr-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.bgBadge}`}>
                              {stageLeads.length}
                            </span>
                            <p className="text-[9px] text-zinc-500 mt-0.5">
                              {formatRp(stageTotalVal)}
                            </p>
                          </div>

                          {/* Collapse button */}
                          <button
                            onClick={() => toggleColumnCollapse(stage.key)}
                            title="Perkecil / Minimize Kolom"
                            className="p-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>

                          {/* Expand Tahap button (Fokus Mode) */}
                          <button
                            onClick={() => setExpandedStage(stage.key)}
                            title={`Expand Tahap ${stage.label} (Fokus Mode & Layar Lebar)`}
                            className={`p-1.5 rounded-lg border transition flex items-center gap-1 text-[10px] font-bold ${stage.accentBg} ${stage.textColor} border-current/30 hover:bg-white/10`}
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span className="hidden xl:inline text-[9px]">Expand</span>
                          </button>
                        </div>
                      </div>

                      {/* Cards Container */}
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] scrollbar-thin scrollbar-thumb-zinc-800 pr-1">
                        {stageLeads.length === 0 ? (
                          <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                            <p>Tidak ada lead di tahap ini</p>
                          </div>
                        ) : (
                          stageLeads.map((lead) => renderLeadCard(lead, stage.key))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB 3: FOLLOW UP EXPIRY & PIC REMINDERS */}
      {activeSubTab === 'followup' && (
        <div className="space-y-4">
          {/* Top Filter and Priority Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => setFilterPriority(filterPriority === 'HIGH' ? 'all' : 'HIGH')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex justify-between items-center ${
                filterPriority === 'HIGH' ? 'bg-rose-500/20 border-rose-500' : 'bg-zinc-900/90 border-zinc-800'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase">Prioritas Tinggi (H-3 & Expired)</p>
                <h4 className="text-2xl font-black text-rose-400 mt-1">{highCount} Member</h4>
              </div>
              <AlertTriangle className="w-6 h-6 text-rose-500 opacity-60" />
            </div>

            <div
              onClick={() => setFilterPriority(filterPriority === 'MEDIUM' ? 'all' : 'MEDIUM')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex justify-between items-center ${
                filterPriority === 'MEDIUM' ? 'bg-amber-500/20 border-amber-500' : 'bg-zinc-900/90 border-zinc-800'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase">Prioritas Sedang (H-7)</p>
                <h4 className="text-2xl font-black text-amber-400 mt-1">{mediumCount} Member</h4>
              </div>
              <Clock className="w-6 h-6 text-amber-500 opacity-60" />
            </div>

            <div
              onClick={() => setFilterPriority(filterPriority === 'LOW' ? 'all' : 'LOW')}
              className={`p-4 rounded-2xl border transition cursor-pointer flex justify-between items-center ${
                filterPriority === 'LOW' ? 'bg-blue-500/20 border-blue-500' : 'bg-zinc-900/90 border-zinc-800'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase">Prioritas Rendah (H-30)</p>
                <h4 className="text-2xl font-black text-blue-400 mt-1">{lowCount} Member</h4>
              </div>
              <Clock className="w-6 h-6 text-blue-500 opacity-60" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-3 bg-zinc-950/40">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-400">Filter PIC:</span>
                <select
                  value={filterPic}
                  onChange={(e) => setFilterPic(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-xs font-semibold rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                >
                  <option value="all">Semua PIC</option>
                  <optgroup label="🏛️ Divisi Kasir & Front Desk">
                    {staffUsers
                      .filter((s) => getStaffDivision(s) === 'Kasir & Front Desk')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.roleName || 'Kasir & Front Desk'})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🏋️ Divisi Pelatihan (PT & Coach)">
                    {staffUsers
                      .filter((s) => getStaffDivision(s) === 'Pelatihan')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.roleName || 'Pelatih PT'})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🏢 Divisi Manajemen & Lainnya">
                    {staffUsers
                      .filter((s) => getStaffDivision(s) !== 'Kasir & Front Desk' && getStaffDivision(s) !== 'Pelatihan')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.roleName || 'Manajemen'})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {filterPriority !== 'all' && (
                <button
                  onClick={() => setFilterPriority('all')}
                  className="text-xs text-orange-400 hover:underline font-bold"
                >
                  Reset Filter ({filterPriority})
                </button>
              )}
            </div>

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <table className="w-full text-left whitespace-nowrap min-w-[750px]">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Member Info</th>
                    <th className="py-3 px-4 text-center">Periode Kadaluarsa</th>
                    <th className="py-3 px-4">Status Terakhir & PIC</th>
                    <th className="py-3 px-4 text-right">Aksi Follow Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-950/30 text-xs">
                  {filteredFUMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500">
                        Tidak ada member dalam status follow-up pada kriteria ini.
                      </td>
                    </tr>
                  ) : (
                    filteredFUMembers.map((mem) => (
                      <tr key={mem.id} className="hover:bg-zinc-800/30">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{mem.name}</p>
                          <p className="text-[11px] text-zinc-400">{mem.phone}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              mem.diffDays < 0
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : mem.diffDays <= 3
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : mem.diffDays <= 7
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {mem.diffDays < 0 ? 'EXPIRED' : `H-${mem.diffDays}`}
                          </span>
                          <p className="text-[10px] text-zinc-500 mt-1">{mem.expired}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-orange-400 block text-xs">{mem.followUpStatus}</span>
                          <span className="text-[10px] text-zinc-500">PIC: {mem.picName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <a
                            href={`https://wa.me/${mem.phone}?text=${encodeURIComponent(
                              `Halo Kak ${mem.name}, ada promo perpanjangan menarik di RFA Gym nih!`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
                          >
                            <Phone className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                          <button
                            onClick={() => {
                              setSelectedMemberForFU(mem);
                              setFuStatus(mem.followUpStatus || 'TERTARIK RENEWAL');
                              setFuNotes('');
                            }}
                            className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition"
                          >
                            Catat Log
                          </button>
                          <button
                            onClick={() => setHistoryMember(mem)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                          >
                            Riwayat
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH LEAD BARU (ENHANCED DENGAN PIC RESPONSIBILITY) */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  Tambah Prospek Lead Baru
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tugaskan ke Petugas Front Desk yang bertanggung jawab agar tindak lanjut jelas dan tidak tertukar.
                </p>
              </div>
              <button
                onClick={() => setIsAddLeadOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Nama Calon Member *
                  </label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Cth: Denny Chandra"
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    No WhatsApp Aktif *
                  </label>
                  <input
                    type="text"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="Cth: 08123456789"
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* PETUGAS FRONT DESK / PIC YANG BERTANGGUNG JAWAB */}
              <div className="bg-zinc-950 border border-orange-500/30 rounded-2xl p-3.5 space-y-2">
                <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Petugas Front Desk / PIC Penanggung Jawab *</span>
                  <span className="text-[9px] text-zinc-400 font-semibold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                    Struktur Devisi Terpisah
                  </span>
                </label>
                <select
                  value={leadPicId}
                  onChange={(e) => setLeadPicId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  <optgroup label="🏛️ Divisi Kasir & Front Desk (Rekomendasi PIC Calon Member)">
                    {staffUsers
                      .filter((s) => getStaffDivision(s) === 'Kasir & Front Desk')
                      .map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} — {staff.roleName || 'Kasir & Front Desk'} {staff.shift ? `(Shift ${staff.shift})` : ''} {currentUser?.id === staff.id ? '⭐ [Saya]' : ''}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🏋️ Divisi Pelatihan (Beda Devisi - Pelatih / Personal Trainer)">
                    {staffUsers
                      .filter((s) => getStaffDivision(s) === 'Pelatihan')
                      .map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} — {staff.roleName || 'Pelatih PT'} {staff.shift ? `(Shift ${staff.shift})` : ''} {currentUser?.id === staff.id ? '⭐ [Saya]' : ''}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🏢 Divisi Manajemen & Operasional">
                    {staffUsers
                      .filter((s) => getStaffDivision(s) !== 'Kasir & Front Desk' && getStaffDivision(s) !== 'Pelatihan')
                      .map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} — {staff.roleName || 'Manajemen'} {currentUser?.id === staff.id ? '⭐ [Saya]' : ''}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <div className="flex items-start gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 text-[10px] text-zinc-400">
                  <Briefcase className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pemberitahuan Devisi:</strong> Divisi Kasir & Front Desk bertanggung jawab penuh sebagai PIC administrasi & prospek calon member. Divisi Pelatihan khusus menangani program latihan, postur, dan sesi personal training.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Sumber Prospek
                  </label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="Daftar Online (Website)">🌐 Daftar Online (Website / Portal)</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Walk-in">Walk-in Langsung</option>
                    <option value="Referral">Rekomendasi Teman</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Google / Web">Google / Web</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={leadPriority}
                    onChange={(e) => setLeadPriority(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="Tinggi">🔥 Tinggi (Segera Hubungi)</option>
                    <option value="Sedang">⚡ Sedang</option>
                    <option value="Rendah">Rendah (Santai)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Est. Nilai Omset (Rp)
                  </label>
                  <input
                    type="number"
                    value={leadEstimatedValue}
                    onChange={(e) => setLeadEstimatedValue(e.target.value)}
                    placeholder="750000"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Program / Paket yang Diminati
                </label>
                <input
                  type="text"
                  value={leadInterest}
                  onChange={(e) => setLeadInterest(e.target.value)}
                  placeholder="Cth: Membership 3 Bulan + 5 Sesi PT"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Catatan Kebutuhan Calon Member
                </label>
                <textarea
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  rows={2}
                  placeholder="Cth: Mau coba free trial besok sore jam 17:00, tertarik fat loss program"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan & Tugaskan Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OPER ALIH / HANDOVER PIC (PENCEGAH TERTUKAR & AUDIT SERAH TERIMA) */}
      {selectedLeadForHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-orange-400" />
                  Oper Alih Tanggung Jawab Prospek
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Serah terima tanggung jawab calon member ke petugas Front Desk lain agar tidak tertukar.
                </p>
              </div>
              <button
                onClick={() => setSelectedLeadForHandover(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Lead Info */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-white">{selectedLeadForHandover.name}</h4>
                <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  {selectedLeadForHandover.phone}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/80">
                <span>PIC Saat Ini:</span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-orange-400">
                    {getStaffById(selectedLeadForHandover.picId)?.name || selectedLeadForHandover.picName || 'Belum Ada PIC'}
                  </strong>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    (selectedLeadForHandover.picDivision || getStaffDivision(getStaffById(selectedLeadForHandover.picId))) === 'Kasir & Front Desk'
                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      : (selectedLeadForHandover.picDivision || getStaffDivision(getStaffById(selectedLeadForHandover.picId))) === 'Pelatihan'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  }`}>
                    Divisi: {selectedLeadForHandover.picDivision || getStaffDivision(getStaffById(selectedLeadForHandover.picId))}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Alihkan Tanggung Jawab Kepada *</span>
                  <span className="text-[9px] text-zinc-500 font-normal">Pilih PIC penerima</span>
                </label>
                <select
                  value={handoverTargetPicId}
                  onChange={(e) => setHandoverTargetPicId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="">-- Pilih Petugas / PIC Baru --</option>
                  <optgroup label="🏛️ Divisi Kasir & Front Desk (Internal Divisi)">
                    {staffUsers
                      .filter((s) => s.id !== selectedLeadForHandover.picId && getStaffDivision(s) === 'Kasir & Front Desk')
                      .map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.roleName || 'Kasir & Front Desk'} • Shift {staff.shift || '-'})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🏋️ Divisi Pelatihan (Beda Devisi - Pelatih / PT)">
                    {staffUsers
                      .filter((s) => s.id !== selectedLeadForHandover.picId && getStaffDivision(s) === 'Pelatihan')
                      .map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.roleName || 'Pelatih PT'} • Shift {staff.shift || '-'})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🏢 Divisi Manajemen & Lainnya">
                    {staffUsers
                      .filter((s) => s.id !== selectedLeadForHandover.picId && getStaffDivision(s) !== 'Kasir & Front Desk' && getStaffDivision(s) !== 'Pelatihan')
                      .map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.roleName} • Shift {staff.shift || '-'})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Notice if crossing division boundaries */}
              {handoverTargetPicId && (
                (() => {
                  const targetStaff = getStaffById(handoverTargetPicId);
                  const currentStaff = getStaffById(selectedLeadForHandover.picId);
                  const currentDiv = selectedLeadForHandover.picDivision || getStaffDivision(currentStaff);
                  const targetDiv = getStaffDivision(targetStaff);
                  if (currentDiv !== targetDiv) {
                    return (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-amber-300 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Peringatan: Oper Alih Beda Devisi!</strong>
                          <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                            Anda mengalihkan tanggung jawab dari <strong>{currentDiv}</strong> ke <strong>{targetDiv}</strong> ({targetStaff?.name}). Divisi Kasir & Front Desk dan Divisi Pelatihan adalah unit kerja terpisah. Pastikan catatan alasan mencantumkan kebutuhan khusus (misal: pendampingan sesi latihan fisik/trial postur).
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Catatan Serah Terima / Alasan Oper Alih
                </label>
                <textarea
                  value={handoverReason}
                  onChange={(e) => setHandoverReason(e.target.value)}
                  rows={2}
                  placeholder="Cth: Pergantian shift siang ke sore. Member sudah janjian mau trial jam 18:30 WIB, tolong disapa dan dampingi saat datang."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white outline-none focus:border-orange-500"
                ></textarea>
              </div>

              {/* OTORISASI SANDI / PASSWORD OPER ALIH PIC CRM LEADS */}
              {isLeadHandoverPasswordRequired && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Lock className="w-3.5 h-3.5" />
                      Sandi Otorisasi Keamanan *
                    </label>
                    {isAdminOrManager && picProtection.allowAdminBypass && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Bypass Admin Aktif
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showHandoverPassword ? 'text' : 'password'}
                      value={handoverPassword}
                      onChange={(e) => {
                        setHandoverPassword(e.target.value);
                        if (handoverPasswordError) setHandoverPasswordError('');
                      }}
                      placeholder={
                        isAdminOrManager && picProtection.allowAdminBypass
                          ? 'Boleh kosong (Hak Akses Admin) atau ketik sandi...'
                          : 'Ketik sandi otorisasi untuk konfirmasi oper alih...'
                      }
                      className={`w-full bg-zinc-950 border ${
                        handoverPasswordError
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-zinc-700 focus:border-amber-500'
                      } rounded-xl pl-9 pr-10 py-2.5 text-xs text-white outline-none transition`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowHandoverPassword(!showHandoverPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                      title={showHandoverPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showHandoverPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {handoverPasswordError ? (
                    <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{handoverPasswordError}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Sandi diperlukan untuk mencegah pengoperan/pencurian prospek calon member antar staf tanpa izin.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLeadForHandover(null);
                    setHandoverPassword('');
                    setHandoverPasswordError('');
                  }}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!handoverTargetPicId) {
                      showToast('Pilih Petugas', 'Silakan tentukan petugas yang akan menerima prospek.', 'warning');
                      return;
                    }

                    if (isLeadHandoverPasswordRequired) {
                      const canBypass = isAdminOrManager && picProtection.allowAdminBypass;
                      if (!canBypass || handoverPassword.trim().length > 0) {
                        if (!handoverPassword.trim()) {
                          setHandoverPasswordError('Sandi otorisasi keamanan wajib dimasukkan.');
                          showToast(
                            'Sandi Diperlukan 🔒',
                            'Masukkan sandi otorisasi untuk melakukan oper alih prospek.',
                            'warning'
                          );
                          return;
                        }
                        const isValid = verifyPicPassword(handoverPassword);
                        if (!isValid) {
                          setHandoverPasswordError('Sandi otorisasi salah. Hubungi Administrator / Manager.');
                          showToast(
                            'Sandi Salah ❌',
                            'Sandi otorisasi tidak cocok. Oper alih dibatalkan.',
                            'error'
                          );
                          return;
                        }
                      }
                    }

                    handlePerformHandover(selectedLeadForHandover, handoverTargetPicId, handoverReason);
                    setSelectedLeadForHandover(null);
                    setHandoverPassword('');
                    setHandoverPasswordError('');
                  }}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Konfirmasi Alihkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PROSPEK 360 & TIMELINE AKTIVITAS */}
      {selectedLeadForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-xl p-5 sm:p-6 my-auto max-h-[94vh] overflow-y-auto animate-in fade-in zoom-in-95 space-y-4">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedLeadForDetail.name}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedLeadForDetail.status === 'Member'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : selectedLeadForDetail.status === 'Lost'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : selectedLeadForDetail.status === 'Trial'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : selectedLeadForDetail.status === 'Follow Up'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    Tahap: {selectedLeadForDetail.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                  <span>No HP: {selectedLeadForDetail.phone}</span> •{' '}
                  <span>Sumber: {selectedLeadForDetail.source}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedLeadForDetail(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Strip inside detail */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-zinc-300">
                    {(selectedLeadForDetail.picName || '?').charAt(0)}
                  </span>
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-zinc-200">
                      PIC: {getStaffById(selectedLeadForDetail.picId)?.name || selectedLeadForDetail.picName || 'Belum Ada PIC'}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                      (selectedLeadForDetail.picDivision || getStaffDivision(getStaffById(selectedLeadForDetail.picId))) === 'Kasir & Front Desk'
                        ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        : (selectedLeadForDetail.picDivision || getStaffDivision(getStaffById(selectedLeadForDetail.picId))) === 'Pelatihan'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    }`}>
                      {selectedLeadForDetail.picDivision || getStaffDivision(getStaffById(selectedLeadForDetail.picId))}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-500 block">
                    {getStaffById(selectedLeadForDetail.picId)?.roleName || selectedLeadForDetail.picRole || 'Front Desk'} • Shift {getStaffById(selectedLeadForDetail.picId)?.shift || selectedLeadForDetail.picShift || '-'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openWhatsAppLead(selectedLeadForDetail, 'greeting')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Chat WhatsApp
                </button>
                <button
                  onClick={() => {
                    setSelectedLeadForHandover(selectedLeadForDetail);
                    setHandoverTargetPicId(staffUsers.find((s) => s.id !== selectedLeadForDetail.picId)?.id || '');
                    setHandoverPassword('');
                    setShowHandoverPassword(false);
                    setHandoverPasswordError('');
                  }}
                  title={
                    isLeadHandoverPasswordRequired
                      ? 'Oper Alih / Handover ke Petugas Lain (Dilindungi Sandi Keamanan)'
                      : 'Oper Alih / Handover ke Petugas Lain'
                  }
                  className="bg-zinc-800 hover:bg-zinc-700 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-zinc-700"
                >
                  {isLeadHandoverPasswordRequired ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  )}
                  <span>Oper Alih</span>
                </button>
                {selectedLeadForDetail.status !== 'Member' && (
                  <button
                    onClick={() => {
                      onUpdateLeadStatus(selectedLeadForDetail.id, 'Member');
                      onConvertLeadToMember(selectedLeadForDetail);
                      setSelectedLeadForDetail(null);
                    }}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 border border-emerald-500/30"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Jadi Member
                  </button>
                )}
              </div>
            </div>

            {/* Tab navigation inside modal */}
            <div className="flex border-b border-zinc-800 gap-4 text-xs font-bold">
              <button
                onClick={() => setDetailModalTab('overview')}
                className={`pb-2.5 transition border-b-2 ${
                  detailModalTab === 'overview'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                Ringkasan Prospek
              </button>
              <button
                onClick={() => setDetailModalTab('followup')}
                className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
                  detailModalTab === 'followup'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <span>Riwayat Follow-Up</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-full">
                  {selectedLeadForDetail.followUpHistory?.length || 0}
                </span>
              </button>
              <button
                onClick={() => setDetailModalTab('handover')}
                className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
                  detailModalTab === 'handover'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <span>Audit Serah Terima (Handover)</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-full">
                  {selectedLeadForDetail.handoverHistory?.length || 0}
                </span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {detailModalTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Program Minat</span>
                    <strong className="text-white text-xs mt-0.5 block">
                      {selectedLeadForDetail.interest || 'Membership Umum'}
                    </strong>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Estimasi Nilai</span>
                    <strong className="text-emerald-400 text-xs mt-0.5 block">
                      {formatRp(selectedLeadForDetail.estimatedValue || 0)}
                    </strong>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Prioritas</span>
                    <strong className="text-orange-400 text-xs mt-0.5 block">
                      {selectedLeadForDetail.priority || 'Sedang'}
                    </strong>
                  </div>
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Tanggal Masuk</span>
                    <strong className="text-zinc-300 text-xs mt-0.5 block">
                      {formatDateIndo(selectedLeadForDetail.date || '')}
                    </strong>
                  </div>
                </div>

                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold">Catatan Kebutuhan</span>
                  <p className="text-xs text-zinc-300 whitespace-pre-wrap">
                    {selectedLeadForDetail.notes || 'Belum ada catatan khusus.'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: FOLLOW-UP TIMELINE & LOGGING FORM */}
            {detailModalTab === 'followup' && (
              <div className="space-y-4">
                {/* Form Quick Log Follow-up */}
                <div className="bg-zinc-950 border border-orange-500/20 rounded-2xl p-3.5 space-y-3">
                  <h4 className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Tambah Catatan Kontak / Follow-Up Baru
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Metode</label>
                      <select
                        value={detailNewFuMethod}
                        onChange={(e) => setDetailNewFuMethod(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Telepon">Telepon Langsung</option>
                        <option value="Tatap Muka">Tatap Muka di Gym</option>
                        <option value="Instagram DM">Instagram DM</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Hasil Kontak</label>
                      <input
                        type="text"
                        value={detailNewFuResult}
                        onChange={(e) => setDetailNewFuResult(e.target.value)}
                        placeholder="Cth: Menjadwalkan Trial"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">Catatan Percakapan</label>
                    <textarea
                      value={detailNewFuNotes}
                      onChange={(e) => setDetailNewFuNotes(e.target.value)}
                      rows={2}
                      placeholder="Detail respon calon member..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white"
                    ></textarea>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!detailNewFuResult.trim()) {
                        showToast('Isi Hasil Kontak', 'Harap isi ringkasan hasil kontak.', 'warning');
                        return;
                      }
                      handleAddLeadFollowUp(
                        selectedLeadForDetail,
                        detailNewFuMethod,
                        detailNewFuResult,
                        detailNewFuNotes
                      );
                      setDetailNewFuNotes('');
                    }}
                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    Simpan Catatan Follow-Up
                  </button>
                </div>

                {/* Follow-up Timeline List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Timeline Aktivitas</h4>
                  {(!selectedLeadForDetail.followUpHistory || selectedLeadForDetail.followUpHistory.length === 0) ? (
                    <p className="text-xs text-zinc-500 italic p-4 text-center">Belum ada riwayat follow-up tercatat.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedLeadForDetail.followUpHistory.map((fu) => (
                        <div key={fu.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                              {fu.method} • {fu.result}
                            </span>
                            <span className="text-zinc-500">{fu.date} {fu.time || ''}</span>
                          </div>
                          <p className="text-xs text-zinc-300">{fu.notes}</p>
                          <span className="text-[9px] text-zinc-500 block pt-0.5">
                            Oleh: <strong className="text-zinc-400">{fu.picName || 'Front Desk'}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: AUDIT SERAH TERIMA (HANDOVER) */}
            {detailModalTab === 'handover' && (
              <div className="space-y-3">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                  <p className="text-xs text-zinc-400">
                    Semua pergantian PIC dicatat secara transparan beserta tanggal, waktu, petugas asal, petugas penerima, dan catatan serah terima antar shift.
                  </p>
                </div>

                {(!selectedLeadForDetail.handoverHistory || selectedLeadForDetail.handoverHistory.length === 0) ? (
                  <p className="text-xs text-zinc-500 italic p-6 text-center">
                    Belum pernah ada pengalihan tanggung jawab untuk prospek ini.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {selectedLeadForDetail.handoverHistory.map((ho) => (
                      <div key={ho.id} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-orange-400 font-bold flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3" /> Serah Terima PIC
                          </span>
                          <span className="text-zinc-500">{ho.date} {ho.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg text-zinc-300">
                            <span>{ho.fromPicName}</span>
                            {ho.fromPicDivision && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 font-semibold">
                                {ho.fromPicDivision}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-3 h-3 text-zinc-500 shrink-0" />
                          <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/30 px-2 py-1 rounded-lg text-orange-400 font-bold">
                            <span>{ho.toPicName}</span>
                            {ho.toPicDivision && (
                              <span className={`text-[8px] px-1 py-0.2 rounded font-semibold ${
                                ho.toPicDivision === 'Kasir & Front Desk'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : ho.toPicDivision === 'Pelatihan'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}>
                                {ho.toPicDivision}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-zinc-300 bg-zinc-900/60 p-2 rounded-xl italic">
                          "{ho.reason}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ALASAN BATAL / LOST (ARSIP PROSPEK) */}
      {selectedLeadForLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Tandai Prospek Batal (Lost)
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Calon member: <strong className="text-white">{selectedLeadForLost.name}</strong> ({selectedLeadForLost.phone})
            </p>

            <form onSubmit={handleConfirmLost} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Kategori Alasan Batal
                </label>
                <select
                  value={lostReasonCategory}
                  onChange={(e) => setLostReasonCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500"
                >
                  <option value="Harga / Budget Terlalu Tinggi">Harga / Budget Terlalu Tinggi</option>
                  <option value="Lokasi Studio Terlalu Jauh">Lokasi Studio Terlalu Jauh</option>
                  <option value="Jadwal Gym Tidak Cocok">Jadwal Gym Tidak Cocok</option>
                  <option value="Pindah Keluar Kota">Pindah Keluar Kota</option>
                  <option value="Sudah Daftar di Gym Lain">Sudah Daftar di Gym Lain</option>
                  <option value="Tidak Merespon / Nomor Tidak Aktif">Tidak Merespon / Nomor Tidak Aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Catatan Tambahan
                </label>
                <textarea
                  value={lostReasonNotes}
                  onChange={(e) => setLostReasonNotes(e.target.value)}
                  rows={3}
                  placeholder="Cth: Menginfokan bahwa budget bulan ini belum cukup, follow-up ulang saat ada promo gajian."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForLost(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Konfirmasi Lost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATAT LOG FOLLOW UP */}
      {selectedMemberForFU && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2">Update Catatan Follow Up</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Member: <strong className="text-white">{selectedMemberForFU.name}</strong> ({selectedMemberForFU.expired})
            </p>

            <form onSubmit={handleSaveFollowUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Metode Hubung
                  </label>
                  <select
                    value={fuMethod}
                    onChange={(e) => setFuMethod(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telepon">Telepon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Status Respon
                  </label>
                  <select
                    value={fuStatus}
                    onChange={(e) => setFuStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="SUDAH DIHUBUNGI">Sudah Dihubungi</option>
                    <option value="RESPON">Respon (Diskusi)</option>
                    <option value="TIDAK RESPON">Tidak Respon</option>
                    <option value="TERTARIK RENEWAL">Tertarik Renewal</option>
                    <option value="AKAN RENEWAL">Akan Renewal</option>
                    <option value="TIDAK TERTARIK">Tidak Tertarik</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Catatan Interaksi
                  </label>
                  <button
                    type="button"
                    onClick={generateAIDraft}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3" /> AI Draft Pesan
                  </button>
                </div>
                <textarea
                  value={fuNotes}
                  onChange={(e) => setFuNotes(e.target.value)}
                  required
                  rows={3}
                  placeholder="Tulis hasil komunikasi atau klik AI Draft Pesan..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForFU(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RIWAYAT FOLLOW UP MEMBER */}
      {historyMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 my-auto max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-1">Riwayat Interaksi Follow Up</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Member: <strong className="text-white">{historyMember.name}</strong>
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {followUps.filter((f) => f.memberId === historyMember.id).length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-6">Belum ada riwayat tercatat.</p>
              ) : (
                followUps
                  .filter((f) => f.memberId === historyMember.id)
                  .map((item, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded uppercase">
                          {item.status}
                        </span>
                        <span className="text-zinc-500">{item.date}</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed italic mt-1">"{item.notes}"</p>
                    </div>
                  ))
              )}
            </div>

            <button
              onClick={() => setHistoryMember(null)}
              className="mt-4 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PRODUK & PAKET PIC SALES LENGKAP */}
      {selectedModalPic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-4xl p-4 sm:p-6 my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center font-black text-orange-400 text-base shrink-0">
                  {selectedModalPic.photo ? (
                    <img
                      src={selectedModalPic.photo}
                      alt={selectedModalPic.name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    selectedModalPic.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{selectedModalPic.name}</h3>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-bold">
                      {selectedModalPic.roleName}
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                      Peringkat #{rankedPICs.findIndex((p) => p.id === selectedModalPic.id) + 1}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Periode: <strong className="text-zinc-200">{dateFilterLabel}</strong> • Total Omset:{' '}
                    <strong className="text-orange-400">{formatRp(selectedModalPic.revenue)}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedModalPic(null)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Cards with Separated New vs Renewal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Total Revenue PIC</span>
                <h4 className="text-lg font-black text-orange-400 mt-0.5">{formatRp(selectedModalPic.revenue)}</h4>
                <p className="text-[10px] text-zinc-400">{selectedModalPic.transactions.length} total transaksi</p>
              </div>
              <div className="bg-zinc-950 border border-emerald-500/30 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> Closing NEW Member
                </span>
                <h4 className="text-lg font-black text-emerald-400 mt-0.5">{formatRp(selectedModalPic.newRevenue)}</h4>
                <p className="text-[10px] text-emerald-300/80">{selectedModalPic.newCount} member baru</p>
              </div>
              <div className="bg-zinc-950 border border-blue-500/30 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1">
                  <Repeat className="w-3 h-3" /> Closing RENEWAL
                </span>
                <h4 className="text-lg font-black text-blue-400 mt-0.5">{formatRp(selectedModalPic.renewalRevenue)}</h4>
                <p className="text-[10px] text-blue-300/80">{selectedModalPic.renewalCount} perpanjangan</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Paket Mbr & PT</span>
                <h4 className="text-sm font-black text-white mt-1">
                  {selectedModalPic.membershipCount} Mbr • {selectedModalPic.ptCount} PT
                </h4>
                <p className="text-[10px] text-zinc-400">
                  {formatRp(selectedModalPic.membershipRevenue + selectedModalPic.ptRevenue)}
                </p>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all' as const, label: `Semua (${selectedModalPic.products.length})` },
                  {
                    id: 'new' as const,
                    label: `🟢 Closing NEW Mbr (${selectedModalPic.transactions.filter((t) => t.isNewMember).length})`
                  },
                  {
                    id: 'renewal' as const,
                    label: `🔵 RENEWAL (${selectedModalPic.transactions.filter((t) => t.isRenewal).length})`
                  },
                  {
                    id: 'Membership' as const,
                    label: `Membership (${selectedModalPic.products.filter((p) => p.category === 'Membership').length})`
                  },
                  {
                    id: 'PT' as const,
                    label: `PT (${selectedModalPic.products.filter((p) => p.category === 'PT').length})`
                  },
                  {
                    id: 'POS' as const,
                    label: `Retail/POS (${selectedModalPic.products.filter((p) => p.category === 'POS').length})`
                  },
                  {
                    id: 'trx' as const,
                    label: `Log Transaksi (${selectedModalPic.transactions.length})`
                  }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setModalFilterCat(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      modalFilterCat === tab.id
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Cari paket / transaksi..."
                  className="bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-orange-500 w-full sm:w-56"
                />
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-3 scrollbar-thin scrollbar-thumb-zinc-800">
              {modalFilterCat !== 'trx' && modalFilterCat !== 'new' && modalFilterCat !== 'renewal' ? (
                // TABEL PRODUK & PAKET
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Nama Paket / Produk</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3 text-center">Jumlah Terjual</th>
                        <th className="py-2.5 px-3 text-right">Total Revenue PIC</th>
                        <th className="py-2.5 px-3 text-right">Porsi Omset</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
                      {selectedModalPic.products
                        .filter((p) => {
                          if (modalFilterCat !== 'all' && p.category !== modalFilterCat) return false;
                          if (modalSearch && !p.name.toLowerCase().includes(modalSearch.toLowerCase())) return false;
                          return true;
                        })
                        .map((prod, idx) => {
                          const pct =
                            selectedModalPic.revenue > 0
                              ? Math.round((prod.revenue / selectedModalPic.revenue) * 100)
                              : 0;

                          return (
                            <tr key={idx} className="hover:bg-zinc-800/30">
                              <td className="py-3 px-3 text-zinc-500 font-mono text-[11px]">{idx + 1}</td>
                              <td className="py-3 px-3 font-bold text-white">
                                <div className="flex items-center gap-2">
                                  {prod.category === 'Membership' ? (
                                    <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                                  ) : prod.category === 'PT' ? (
                                    <Dumbbell className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                                  )}
                                  <span>{prod.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                    prod.category === 'Membership'
                                      ? 'bg-indigo-500/20 text-indigo-400'
                                      : prod.category === 'PT'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-amber-500/20 text-amber-400'
                                  }`}
                                >
                                  {prod.category === 'Membership'
                                    ? 'Paket Membership'
                                    : prod.category === 'PT'
                                    ? 'Paket PT'
                                    : 'Retail / POS'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-zinc-200">
                                {prod.count} {prod.category === 'PT' ? 'sesi/paket' : 'unit'}
                              </td>
                              <td className="py-3 px-3 text-right font-black text-orange-400">
                                {formatRp(prod.revenue)}
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-zinc-400">
                                <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold text-zinc-300">
                                  {pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                      {selectedModalPic.products.filter((p) => {
                        if (modalFilterCat !== 'all' && p.category !== modalFilterCat) return false;
                        if (modalSearch && !p.name.toLowerCase().includes(modalSearch.toLowerCase())) return false;
                        return true;
                      }).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500 italic">
                            Tidak ditemukan produk atau paket pada filter ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                // TABEL LOG TRANSAKSI INDIVIDU (DENGAN PEMISAHAN NEW VS RENEWAL)
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">No. Trx</th>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Member / Customer</th>
                        <th className="py-2.5 px-3 text-center">Tipe Transaksi</th>
                        <th className="py-2.5 px-3">Deskripsi Produk / Paket</th>
                        <th className="py-2.5 px-3">Metode</th>
                        <th className="py-2.5 px-3 text-right">Omset PIC</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
                      {selectedModalPic.transactions
                        .filter((t) => {
                          if (modalFilterCat === 'new' && !t.isNewMember) return false;
                          if (modalFilterCat === 'renewal' && !t.isRenewal) return false;
                          if (
                            modalSearch &&
                            !t.customer.toLowerCase().includes(modalSearch.toLowerCase()) &&
                            !t.desc.toLowerCase().includes(modalSearch.toLowerCase()) &&
                            !t.id.toLowerCase().includes(modalSearch.toLowerCase())
                          ) {
                            return false;
                          }
                          return true;
                        })
                        .map((trx, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/30">
                            <td className="py-3 px-3 font-mono font-bold text-orange-400 text-[11px]">{trx.id}</td>
                            <td className="py-3 px-3 text-zinc-400 text-[11px]">
                              {trx.date} <span className="text-zinc-600">{trx.time}</span>
                            </td>
                            <td className="py-3 px-3 font-bold text-white">{trx.customer}</td>
                            <td className="py-3 px-3 text-center">
                              {trx.isRenewal ? (
                                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                  <Repeat className="w-2.5 h-2.5" /> RENEWAL
                                </span>
                              ) : trx.isNewMember ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                  <UserPlus className="w-2.5 h-2.5" /> NEW MEMBER
                                </span>
                              ) : trx.type === 'PT' ? (
                                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                  <Dumbbell className="w-2.5 h-2.5" /> PAKET PT
                                </span>
                              ) : (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                  <ShoppingBag className="w-2.5 h-2.5" /> POS / RETAIL
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-zinc-200">
                              <span className="font-semibold">{trx.desc}</span>
                              {trx.trxCategory && trx.trxCategory !== 'RENEWAL' && (
                                <span className="ml-2 text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-bold uppercase">
                                  {trx.trxCategory}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-zinc-400">{trx.method}</td>
                            <td className="py-3 px-3 text-right font-black text-orange-400">
                              {formatRp(trx.picRevenue)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  trx.status === 'Paid'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {trx.status}
                              </span>
                            </td>
                          </tr>
                        ))}

                      {selectedModalPic.transactions.filter((t) => {
                        if (modalFilterCat === 'new' && t.isRenewal) return false;
                        if (modalFilterCat === 'renewal' && !t.isRenewal) return false;
                        if (
                          modalSearch &&
                          !t.customer.toLowerCase().includes(modalSearch.toLowerCase()) &&
                          !t.desc.toLowerCase().includes(modalSearch.toLowerCase()) &&
                          !t.id.toLowerCase().includes(modalSearch.toLowerCase())
                        ) {
                          return false;
                        }
                        return true;
                      }).length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-zinc-500 italic">
                            Tidak ditemukan log transaksi yang sesuai filter ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedModalPic(null)}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
