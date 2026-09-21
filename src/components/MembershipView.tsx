import React, { useState } from 'react';
import { Crown, Sparkles, Check, AlertCircle, Plus, DollarSign, Info, CreditCard, Wallet, QrCode, Building2, CheckCircle2, CalendarClock, Users, UserCheck, Copy, Gift, Layers, BarChart3, Settings } from 'lucide-react';
import { PackageItem, Member, User, Transaction, BundlePackage } from '../types';
import { formatRp, getTimestamp, APP_TODAY } from '../utils/formatters';
import { SearchableMemberSelect } from './SearchableMemberSelect';

interface MembershipViewProps {
  packages: PackageItem[];
  members: Member[];
  staffUsers: User[];
  currentUser: User | null;
  bundlePackages?: BundlePackage[];
  onOpenBundlingManager?: () => void;
  onOpenBundlingReports?: () => void;
  onPurchasePackage: (trx: Transaction, updatedMembers: Member[]) => void;
  onAddPackage: (pkg: PackageItem) => void;
  isStoreClosed?: boolean;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const MembershipView: React.FC<MembershipViewProps> = ({
  packages,
  members,
  staffUsers,
  currentUser,
  bundlePackages = [],
  onOpenBundlingManager,
  onOpenBundlingReports,
  onPurchasePackage,
  onAddPackage,
  isStoreClosed,
  showToast
}) => {
  const [cat, setCat] = useState<'Membership' | 'PT' | 'Bundling'>('Membership');
  const [type, setType] = useState<'Personal' | 'Couple' | 'Trio'>('Personal');
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [selectedBundleId, setSelectedBundleId] = useState<string>('');

  // Participants
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [p3Id, setP3Id] = useState('');

  // Dedicated PIC per Participant (1 PIC per member for dedicated focus)
  const [p1PicId, setP1PicId] = useState('');
  const [p2PicId, setP2PicId] = useState('');
  const [p3PicId, setP3PicId] = useState('');

  // Transaction settings
  const [trxType, setTrxType] = useState<'NEW MEMBERSHIP' | 'RENEWAL' | 'UPGRADE'>('NEW MEMBERSHIP');
  const [picSalesId, setPicSalesId] = useState('');
  const [discount, setDiscount] = useState('0');

  // Tipe Bayar: 'Lunas' (Penuh) vs 'Cicilan' (DP)
  const [paymentType, setPaymentType] = useState<'Lunas' | 'Cicilan'>('Lunas');
  // Metode Bayar: Tunai / Cash, Transfer Mandiri, QRIS / QR, Kartu EDC
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer' | 'QRIS' | 'EDC'>('Tunai');
  // Opsi DP Cicilan
  const [dpPercent, setDpPercent] = useState<number>(50);
  const [customDpAmount, setCustomDpAmount] = useState<string>('');

  // Master package modal
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [newPkgCat, setNewPkgCat] = useState<'Membership' | 'PT'>('Membership');
  const [newPkgType, setNewPkgType] = useState<'Personal' | 'Couple' | 'Trio'>('Personal');
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgValue, setNewPkgValue] = useState('');

  const filteredPackages = packages.filter((p) => p.cat === cat && p.type === type);
  const currentPackage = filteredPackages[selectedPkgIndex] || filteredPackages[0];

  // Bundling packages
  const activeBundles = bundlePackages.filter((b) => b.status === 'ACTIVE');
  const currentBundle = activeBundles.find((b) => b.bundleId === selectedBundleId) || activeBundles[0];

  // Auto-sync PIC when Member 1 is selected
  const handleP1Change = (memberId: string) => {
    setP1Id(memberId);
    const m = members.find((x) => x.id === memberId);
    if (m && m.picId) {
      setP1PicId(m.picId);
      setPicSalesId(m.picId);
    }
  };

  // Auto-sync PIC when Member 2 is selected
  const handleP2Change = (memberId: string) => {
    setP2Id(memberId);
    const m = members.find((x) => x.id === memberId);
    if (m && m.picId) {
      setP2PicId(m.picId);
    } else if (p1PicId && !p2PicId) {
      setP2PicId(p1PicId);
    }
  };

  // Auto-sync PIC when Member 3 is selected
  const handleP3Change = (memberId: string) => {
    setP3Id(memberId);
    const m = members.find((x) => x.id === memberId);
    if (m && m.picId) {
      setP3PicId(m.picId);
    } else if (p1PicId && !p3PicId) {
      setP3PicId(p1PicId);
    }
  };

  // Quick action: copy P1's PIC to all participants
  const copyP1PicToAll = () => {
    if (!p1PicId) {
      showToast('Peringatan', 'Pilih PIC untuk Peserta 1 terlebih dahulu.', 'warning');
      return;
    }
    setP2PicId(p1PicId);
    setP3PicId(p1PicId);
    const staff = staffUsers.find((s) => s.id === p1PicId);
    showToast('PIC Diselaraskan', `PIC semua peserta disamakan dengan ${staff?.name || 'PIC Peserta 1'}.`, 'success');
  };

  // Price calculations
  const rawPrice = cat === 'Bundling' ? (currentBundle ? currentBundle.price : 0) : (currentPackage ? currentPackage.price : 0);
  const discValue = Number(discount) || 0;
  const netTotal = Math.max(rawPrice - discValue, 0);

  const isCicilan = paymentType === 'Cicilan';

  // Calculate downPayment
  let downPayment = netTotal;
  if (isCicilan) {
    if (customDpAmount !== '' && Number(customDpAmount) >= 0) {
      downPayment = Math.min(Number(customDpAmount), netTotal);
    } else {
      downPayment = Math.round((netTotal * dpPercent) / 100);
    }
  }
  const sisaCicilan = isCicilan ? Math.max(netTotal - downPayment, 0) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isStoreClosed) {
      showToast('Toko Ditutup', 'Daily closing telah dijalankan hari ini. Pembelian dikunci sementara.', 'error');
      return;
    }

    if (cat === 'Bundling' && !currentBundle) {
      showToast('Peringatan', 'Pilih paket bundling yang tersedia.', 'warning');
      return;
    }

    if (cat !== 'Bundling' && !currentPackage) {
      showToast('Peringatan', 'Pilih paket yang akan dibeli.', 'warning');
      return;
    }

    if (!p1Id) {
      showToast('Peringatan', 'Pilih peserta utama (Peserta 1).', 'warning');
      return;
    }

    if (isCicilan && downPayment <= 0 && netTotal > 0) {
      showToast('Peringatan', 'Nominal DP cicilan harus lebih besar dari Rp 0.', 'warning');
      return;
    }

    if (type === 'Couple' && !p2Id) {
      showToast('Peringatan', 'Paket Couple membutuhkan Peserta 2.', 'warning');
      return;
    }

    if (type === 'Trio' && (!p2Id || !p3Id)) {
      showToast('Peringatan', 'Paket Trio membutuhkan Peserta 2 dan Peserta 3.', 'warning');
      return;
    }

    // Effective PIC assignments per participant
    const effectiveP1Pic = p1PicId || picSalesId || currentUser?.id || '';
    const effectiveP2Pic = p2PicId || effectiveP1Pic;
    const effectiveP3Pic = p3PicId || effectiveP1Pic;

    // Check unique participants
    const chosenIds = [p1Id, p2Id, p3Id].filter(Boolean);
    if (new Set(chosenIds).size !== chosenIds.length) {
      showToast('Duplikasi Peserta', 'Peserta 1, 2, dan 3 tidak boleh orang yang sama.', 'error');
      return;
    }

    // Prepare updated members with dedicated PICs
    const updatedMembersList: Member[] = [];
    chosenIds.forEach((mId) => {
      const existing = members.find((m) => m.id === mId);
      if (existing) {
        // Dedicated PIC for this participant
        const assignedPicId = mId === p1Id ? effectiveP1Pic : mId === p2Id ? effectiveP2Pic : effectiveP3Pic;
        const assignedStaff = staffUsers.find((s) => s.id === assignedPicId);

        let updatedMember: Member = {
          ...existing,
          picId: assignedPicId || existing.picId,
          picName: assignedStaff ? assignedStaff.name : (existing.picName || '')
        };

        if (cat === 'Bundling') {
          // Extend membership and add PT sessions automatically
          const currentExp = new Date(existing.expired + 'T00:00:00');
          const todayDate = new Date(APP_TODAY + 'T00:00:00');
          const baseDate = currentExp > todayDate ? currentExp : todayDate;
          const memItem = currentBundle.items.find((i) => i.itemType === 'MEMBERSHIP');
          const durationDays = currentBundle.durationDays || memItem?.duration || 30;
          baseDate.setDate(baseDate.getDate() + durationDays);
          const newExp = baseDate.toISOString().split('T')[0];

          const ptItem = currentBundle.items.find((i) => i.itemType === 'PT');
          const addPt = ptItem?.sessionCount || 2;

          updatedMember = {
            ...updatedMember,
            expired: newExp,
            ptQuota: (existing.ptQuota || 0) + addPt,
            followUpStatus: 'SUDAH RENEWAL'
          };
        } else if (cat === 'Membership') {
          // Extend membership
          const currentExp = new Date(existing.expired + 'T00:00:00');
          const todayDate = new Date(APP_TODAY + 'T00:00:00');
          const baseDate = currentExp > todayDate ? currentExp : todayDate;
          baseDate.setDate(baseDate.getDate() + currentPackage.value);
          const newExp = baseDate.toISOString().split('T')[0];

          updatedMember = {
            ...updatedMember,
            expired: newExp,
            followUpStatus: 'SUDAH RENEWAL'
          };
        } else {
          // Add PT Quota
          updatedMember = {
            ...updatedMember,
            ptQuota: (existing.ptQuota || 0) + currentPackage.value
          };
        }
        updatedMembersList.push(updatedMember);
      }
    });

    // Create Transaction
    // CRITICAL: Initial cash inflow for today is ONLY downPayment!
    // Remaining debt is placed in amountRemaining with 40 days due date.
    // When paid in future, a PAY-* record will capture that cash flow cleanly with NO double counting!
    const dueDateDate = new Date(APP_TODAY + 'T00:00:00');
    dueDateDate.setDate(dueDateDate.getDate() + 40);
    const dueDateStr = dueDateDate.toISOString().split('T')[0];

    const customerNames = updatedMembersList.map((m) => m.name).join(', ');

    // Participant-PIC pairing summary
    const participantsDetail = updatedMembersList.map((m) => {
      const staff = staffUsers.find((s) => s.id === m.picId);
      return {
        memberId: m.id,
        memberName: m.name,
        picId: m.picId,
        picName: staff?.name || m.picName || '-'
      };
    });

    // Determine closing PICs for sales lead attribution:
    // If participants > 1 (Couple/Trio), combine all participant PICs automatically (PIC 1, PIC 2, PIC 3)
    let closingPicIds: string[] = [];
    if (type === 'Personal') {
      closingPicIds = [picSalesId || effectiveP1Pic || currentUser?.id || 'S01'].filter(Boolean);
    } else if (type === 'Couple') {
      closingPicIds = [effectiveP1Pic, effectiveP2Pic].filter(Boolean);
    } else {
      // Trio: Gabung PIC 1, PIC 2, & PIC 3
      closingPicIds = [effectiveP1Pic, effectiveP2Pic, effectiveP3Pic].filter(Boolean);
    }

    if (closingPicIds.length === 0) {
      closingPicIds = [currentUser?.id || 'S01'];
    }

    const closingPicNames = closingPicIds
      .map((pid) => staffUsers.find((s) => s.id === pid)?.name || pid)
      .join(', ');

    const newTrx: Transaction = {
      id: 'TRX-' + Math.floor(100000 + Math.random() * 900000),
      date: APP_TODAY,
      time: getTimestamp(),
      type: cat,
      bundleId: cat === 'Bundling' && currentBundle ? currentBundle.bundleId : undefined,
      bundleCode: cat === 'Bundling' && currentBundle ? currentBundle.bundleCode : undefined,
      desc: cat === 'Bundling' && currentBundle
        ? `Paket Bundling ${currentBundle.bundleName} (${currentBundle.bundleCode})${isCicilan ? ` (Cicilan DP ${formatRp(downPayment)})` : ''}`
        : `Paket ${currentPackage ? currentPackage.name : ''}${isCicilan ? ` (Cicilan DP ${formatRp(downPayment)})` : ''}`,
      customer: customerNames,
      amount: netTotal,
      amountPaid: downPayment,
      amountRemaining: sisaCicilan,
      dueDate: isCicilan ? dueDateStr : '-',
      cogs: 0,
      profit: downPayment,
      method: paymentMethod,
      status: isCicilan ? 'DP 50%' : 'Paid',
      cashier: currentUser?.name || 'Kasir',
      bankDest: paymentMethod === 'Tunai' ? undefined : 'Mandiri',
      itemsJSON: JSON.stringify([
        cat === 'Bundling' && currentBundle
          ? {
              name: currentBundle.bundleName,
              code: currentBundle.bundleCode,
              bundleId: currentBundle.bundleId,
              bundleType: currentBundle.bundleType,
              price: currentBundle.price,
              qty: 1,
              items: currentBundle.items,
              participants: participantsDetail
            }
          : {
              name: currentPackage ? currentPackage.name : '',
              price: currentPackage ? currentPackage.price : 0,
              qty: 1,
              participants: participantsDetail
            }
      ]),
      picId: closingPicIds.join(', '),
      picIds: closingPicIds,
      picNames: closingPicNames,
      trxCategory: trxType,
      initialCashPaid: downPayment
    };

    onPurchasePackage(newTrx, updatedMembersList);
    showToast(
      'Pembelian Berhasil',
      `Paket ${currentPackage.name} untuk ${customerNames} berhasil diproses (${isCicilan ? `Cicilan DP ${formatRp(downPayment)} via ${paymentMethod}` : `Lunas via ${paymentMethod}`}).`,
      'success'
    );

    // Reset form
    setP1Id('');
    setP2Id('');
    setP3Id('');
    setP1PicId('');
    setP2PicId('');
    setP3PicId('');
    setPicSalesId('');
    setDiscount('0');
    setPaymentType('Lunas');
    setPaymentMethod('Tunai');
    setDpPercent(50);
    setCustomDpAmount('');
  };

  const handleSaveMasterPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName || !newPkgPrice || !newPkgValue) return;

    const newPkg: PackageItem = {
      id: 'PKG-' + Date.now(),
      cat: newPkgCat,
      type: newPkgType,
      name: newPkgName,
      price: Number(newPkgPrice),
      value: Number(newPkgValue)
    };

    onAddPackage(newPkg);
    showToast('Paket Dibuat', `Master paket ${newPkgName} berhasil ditambahkan.`, 'success');
    setIsPkgModalOpen(false);
    setNewPkgName('');
    setNewPkgPrice('');
    setNewPkgValue('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Crown className="w-5 h-5 text-orange-500" /> Pembelian Paket Membership, PT & Bundling
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dukungan paket Solo / Couple / Trio, Paket Bundling (VIP PLUS), serta fasilitas cicilan 2x (DP 50%).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenBundlingManager && (
            <button
              type="button"
              onClick={onOpenBundlingManager}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-amber-500/30 transition flex items-center gap-1.5 shadow-sm"
            >
              <Gift className="w-4 h-4 text-amber-400" /> Master Bundling
            </button>
          )}
          {onOpenBundlingReports && (
            <button
              type="button"
              onClick={onOpenBundlingReports}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-500/30 transition flex items-center gap-1.5 shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Laporan & Komisi
            </button>
          )}
          <button
            onClick={() => setIsPkgModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-700 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Master Paket Reguler
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category & Type Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                  Kategori Layanan
                </label>
                <select
                  value={cat}
                  onChange={(e) => {
                    setCat(e.target.value as any);
                    setSelectedPkgIndex(0);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-orange-500"
                >
                  <option value="Membership">Akses Gym (Membership)</option>
                  <option value="PT">Sesi Personal Trainer (PT)</option>
                  <option value="Bundling">🎁 Paket Bundling (VIP PLUS, Gold, dll)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                  Tipe Peserta
                </label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as any);
                    setSelectedPkgIndex(0);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-orange-500"
                >
                  <option value="Personal">Solo / Personal (1 Orang)</option>
                  <option value="Couple">Couple / Duo (2 Orang)</option>
                  <option value="Trio">Trio / Squad (3 Orang)</option>
                </select>
              </div>
            </div>

            {/* Package Choice */}
            {cat === 'Bundling' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                    Pilih Paket Bundling Aktif
                  </label>
                  {onOpenBundlingManager && (
                    <button
                      type="button"
                      onClick={onOpenBundlingManager}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
                    >
                      <Settings className="w-3.5 h-3.5" /> Kelola Bundling
                    </button>
                  )}
                </div>
                <select
                  value={currentBundle?.bundleId || ''}
                  onChange={(e) => setSelectedBundleId(e.target.value)}
                  className="w-full bg-zinc-950 border border-amber-500/70 rounded-xl px-4 py-3.5 text-sm font-black text-amber-400 outline-none shadow-inner"
                >
                  {activeBundles.map((b) => (
                    <option key={b.bundleId} value={b.bundleId}>
                      {b.bundleName} ({b.bundleCode}) — {formatRp(b.price)} [{b.bundleType.replace(/_/g, ' ')}]
                    </option>
                  ))}
                </select>

                {/* Preview Bundle Components Card */}
                {currentBundle && (
                  <div className="bg-gradient-to-br from-amber-950/30 to-zinc-950 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-amber-400" /> Benefit Termasuk dalam {currentBundle.bundleName}:
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
                        {currentBundle.bundleCode}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs">{currentBundle.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 block font-semibold">Membership Gym</span>
                        <span className="text-xs font-bold text-white">
                          {(() => {
                            const mem = currentBundle.items.find((i) => i.itemType === 'MEMBERSHIP');
                            const days = currentBundle.durationDays || mem?.duration;
                            return days ? `${days} Hari (${mem?.durationLabel || Math.round(days / 30) + ' Bln'})` : 'Tidak Ada';
                          })()}
                        </span>
                      </div>
                      <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 block font-semibold">Personal Training</span>
                        <span className="text-xs font-bold text-white">
                          {(() => {
                            const pt = currentBundle.items.find((i) => i.itemType === 'PT');
                            return pt ? `${pt.sessionCount} Sesi PT` : 'Tidak Ada';
                          })()}
                        </span>
                      </div>
                      <div className="bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 block font-semibold">Basis Komisi PT</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {formatRp(currentBundle.ptComponentValue || 0)} ({currentBundle.commissionRate || currentBundle.trainerCommissionRate || 20}%)
                        </span>
                      </div>
                    </div>
                    {currentBundle.items.some((i) => i.itemType === 'PRODUCT') && (
                      <div className="text-[11px] text-zinc-300 bg-zinc-900/60 rounded-xl px-3 py-1.5 border border-zinc-800/80 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          Bonus Produk:{' '}
                          {currentBundle.items
                            .filter((i) => i.itemType === 'PRODUCT')
                            .map((i) => `${i.productName || i.name || 'Produk'} (${i.productQty || i.quantity || 1} pcs)`)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                  Pilih Paket
                </label>
                <select
                  value={selectedPkgIndex}
                  onChange={(e) => {
                    setSelectedPkgIndex(Number(e.target.value));
                  }}
                  className="w-full bg-zinc-950 border border-orange-500/70 rounded-xl px-4 py-3.5 text-sm font-black text-orange-400 outline-none shadow-inner"
                >
                  {filteredPackages.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      {p.name} — {formatRp(p.price)} ({p.value} {p.cat === 'Membership' ? 'Hari' : 'Sesi'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Participants & Dedicated PIC Section */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Pendaftaran Peserta & Alokasi PIC ({cat === 'PT' ? 'Sesi PT' : 'Akses Gym'})
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {type === 'Personal'
                      ? '1 peserta didampingi 1 PIC/Trainer khusus.'
                      : `Paket ${type}: 1 PIC untuk setiap peserta agar pendampingan latihan dan evaluasi lebih fokus.`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                    {type === 'Personal' ? '1 Peserta • 1 PIC' : type === 'Couple' ? '2 Peserta • 2 PIC' : '3 Peserta • 3 PIC'}
                  </span>
                  {(type === 'Couple' || type === 'Trio') && p1PicId && (
                    <button
                      type="button"
                      onClick={copyP1PicToAll}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-orange-500/60 text-zinc-300 hover:text-white transition flex items-center gap-1.5 shadow-sm"
                      title="Salin PIC Peserta 1 ke Peserta 2 & 3"
                    >
                      <Copy className="w-3 h-3 text-orange-400" /> Samakan PIC
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-Participant Notice */}
              {(type === 'Couple' || type === 'Trio') && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
                  <Users className="w-4 h-4 text-orange-400 shrink-0" />
                  <p className="leading-snug">
                    <strong>Fokus 1-on-1:</strong> Jumlah PIC otomatis disesuaikan dengan jumlah ({type === 'Couple' ? '2' : '3'}) peserta. Anda dapat memilih trainer berbeda untuk masing-masing peserta atau klik <em>"Samakan PIC"</em> jika ingin 1 trainer yang sama.
                  </p>
                </div>
              )}

              {/* Peserta 1 (Utama) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-zinc-950 font-black text-[10px] flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-white">Peserta 1 (Utama)</span>
                  </div>
                  <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                    Wajib
                  </span>
                </div>

                <SearchableMemberSelect
                  id="searchable-p1-select"
                  label="Pilih Member Peserta 1"
                  required
                  placeholder="Ketik nama, ID member (contoh: M001), atau nomor HP..."
                  members={members}
                  selectedMemberId={p1Id}
                  onSelectMember={handleP1Change}
                  excludeMemberIds={[p2Id, p3Id].filter(Boolean)}
                />

                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 ml-1">
                    PIC / Trainer Khusus Peserta 1 <span className="text-orange-400">*</span>
                  </label>
                  <select
                    value={p1PicId}
                    onChange={(e) => {
                      setP1PicId(e.target.value);
                      if (!picSalesId) setPicSalesId(e.target.value);
                    }}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                  >
                    <option value="">-- Pilih PIC / Trainer Peserta 1 --</option>
                    {staffUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roleName} - Shift {s.shift})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Peserta 2 (Couple & Trio) */}
              {(type === 'Couple' || type === 'Trio') && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-zinc-950 font-black text-[10px] flex items-center justify-center">
                        2
                      </span>
                      <span className="text-xs font-bold text-white">Peserta 2</span>
                    </div>
                    <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      Wajib
                    </span>
                  </div>

                  <SearchableMemberSelect
                    id="searchable-p2-select"
                    label="Pilih Member Peserta 2"
                    required
                    placeholder="Ketik nama, ID member, atau nomor HP Peserta 2..."
                    members={members}
                    selectedMemberId={p2Id}
                    onSelectMember={handleP2Change}
                    excludeMemberIds={[p1Id, p3Id].filter(Boolean)}
                  />

                  <div className="pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        PIC / Trainer Khusus Peserta 2 <span className="text-orange-400">*</span>
                      </label>
                      {p1PicId && p2PicId !== p1PicId && (
                        <button
                          type="button"
                          onClick={() => setP2PicId(p1PicId)}
                          className="text-[10px] text-orange-400 hover:text-orange-300 font-bold"
                        >
                          Samakan dg PIC Peserta 1
                        </button>
                      )}
                    </div>
                    <select
                      value={p2PicId}
                      onChange={(e) => setP2PicId(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="">-- Pilih PIC / Trainer Peserta 2 --</option>
                      {staffUsers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.roleName} - Shift {s.shift})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Peserta 3 (Trio) */}
              {type === 'Trio' && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-zinc-950 font-black text-[10px] flex items-center justify-center">
                        3
                      </span>
                      <span className="text-xs font-bold text-white">Peserta 3</span>
                    </div>
                    <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      Wajib
                    </span>
                  </div>

                  <SearchableMemberSelect
                    id="searchable-p3-select"
                    label="Pilih Member Peserta 3"
                    required
                    placeholder="Ketik nama, ID member, atau nomor HP Peserta 3..."
                    members={members}
                    selectedMemberId={p3Id}
                    onSelectMember={handleP3Change}
                    excludeMemberIds={[p1Id, p2Id].filter(Boolean)}
                  />

                  <div className="pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        PIC / Trainer Khusus Peserta 3 <span className="text-orange-400">*</span>
                      </label>
                      {p1PicId && p3PicId !== p1PicId && (
                        <button
                          type="button"
                          onClick={() => setP3PicId(p1PicId)}
                          className="text-[10px] text-orange-400 hover:text-orange-300 font-bold"
                        >
                          Samakan dg PIC Peserta 1
                        </button>
                      )}
                    </div>
                    <select
                      value={p3PicId}
                      onChange={(e) => setP3PicId(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="">-- Pilih PIC / Trainer Peserta 3 --</option>
                      {staffUsers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.roleName} - Shift {s.shift})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Sales PIC and Transaction Type */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                    Tipe Transaksi
                  </label>
                  <select
                    value={trxType}
                    onChange={(e) => setTrxType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                  >
                    <option value="NEW MEMBERSHIP">New Membership (Member Baru)</option>
                    <option value="RENEWAL">Renewal (Perpanjangan)</option>
                    <option value="UPGRADE">Upgrade Paket</option>
                  </select>
                </div>

                {type === 'Personal' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        PIC Closing Penjualan (Sales Lead)
                      </label>
                      <span className="text-[10px] text-zinc-500">
                        Atribusi Transaksi
                      </span>
                    </div>
                    <select
                      value={picSalesId || p1PicId}
                      onChange={(e) => setPicSalesId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                    >
                      <option value="">-- Pilih PIC Closing --</option>
                      {staffUsers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.roleName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* PIC Closing Penjualan untuk Peserta > 1 (Couple & Trio) - Gabung Semua PIC Peserta */}
              {type !== 'Personal' && (
                <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider block">
                        PIC Closing Penjualan (Sales Lead)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Gabung Semua PIC Peserta ({type === 'Couple' ? '2' : '3'} Orang)
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      Otomatis menggabungkan PIC dari setiap peserta
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {/* PIC Peserta 1 */}
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[9px] text-zinc-400 block uppercase font-bold">Slot Peserta 1</span>
                        <span className="text-xs font-bold text-white truncate block">
                          {staffUsers.find((s) => s.id === p1PicId)?.name || (
                            <span className="text-amber-400/90 text-[11px] font-normal italic">Belum dipilih di slot 1</span>
                          )}
                        </span>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0">
                        1
                      </span>
                    </div>

                    {/* PIC Peserta 2 */}
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-[9px] text-zinc-400 block uppercase font-bold">Slot Peserta 2</span>
                        <span className="text-xs font-bold text-white truncate block">
                          {staffUsers.find((s) => s.id === p2PicId)?.name || (
                            <span className="text-amber-400/90 text-[11px] font-normal italic">Belum dipilih di slot 2</span>
                          )}
                        </span>
                      </div>
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0">
                        2
                      </span>
                    </div>

                    {/* PIC Peserta 3 (if Trio) */}
                    {type === 'Trio' && (
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <span className="text-[9px] text-zinc-400 block uppercase font-bold">Slot Peserta 3</span>
                          <span className="text-xs font-bold text-white truncate block">
                            {staffUsers.find((s) => s.id === p3PicId)?.name || (
                              <span className="text-amber-400/90 text-[11px] font-normal italic">Belum dipilih di slot 3</span>
                            )}
                          </span>
                        </div>
                        <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0">
                          3
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="leading-snug">
                      <span className="font-bold text-white">
                        Penanggung Jawab Closing Gabungan:{' '}
                      </span>
                      <span>
                        {[p1PicId, p2PicId, type === 'Trio' ? p3PicId : null]
                          .filter(Boolean)
                          .map((pid) => staffUsers.find((s) => s.id === pid)?.name)
                          .filter(Boolean)
                          .join(' + ') || 'Semua PIC peserta yang dipilih'}
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Closing transaksi akan tercatat untuk seluruh PIC yang mendampingi peserta, dengan atribusi dan evaluasi komisi yang terbagi rata.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Discount Section */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                Diskon Pembelian Khusus (Rp)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                  placeholder="0"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-orange-500"
                />
                {discValue > 0 && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-rose-400">
                    Potongan: -{formatRp(discValue)}
                  </span>
                )}
              </div>
            </div>

            {/* Tipe Bayar (Skema Pembayaran): Lunas vs Cicilan */}
            <div className="space-y-2 pt-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">
                Tipe Bayar (Skema Pembayaran)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType('Lunas')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                    paymentType === 'Lunas'
                      ? 'bg-orange-500/10 border-orange-500 text-white shadow-sm ring-1 ring-orange-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      paymentType === 'Lunas'
                        ? 'bg-orange-500 text-zinc-950 font-black'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white">Bayar Lunas</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        100% Penuh
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Pelunasan langsung tanpa sisa piutang. Paket aktif penuh.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('Cicilan')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                    paymentType === 'Cicilan'
                      ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      paymentType === 'Cicilan'
                        ? 'bg-amber-500 text-zinc-950 font-black'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white">Fasilitas Cicilan</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Uang Muka (DP)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      Bayar DP hari ini, sisa tagihan dicatat di Buku Piutang (40 hari).
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Cicilan DP Configuration Box */}
            {isCicilan && (
              <div className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Atur Pilihan Uang Muka (DP)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Total Tagihan: <strong className="text-white">{formatRp(netTotal)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'DP 50% (Standar)', percent: 50 },
                    { label: 'DP 30%', percent: 30 },
                    { label: 'DP 70%', percent: 70 },
                    { label: 'Nominal Kustom', percent: 0 }
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        if (opt.percent > 0) {
                          setDpPercent(opt.percent);
                          setCustomDpAmount('');
                        } else {
                          setDpPercent(0);
                          if (!customDpAmount) setCustomDpAmount(String(Math.round(netTotal / 2)));
                        }
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border text-center ${
                        (opt.percent > 0 && dpPercent === opt.percent && !customDpAmount) ||
                        (opt.percent === 0 && customDpAmount !== '')
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-sm'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {customDpAmount !== '' && (
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Nominal DP Kustom (Rp)
                    </label>
                    <input
                      type="number"
                      value={customDpAmount}
                      onChange={(e) => setCustomDpAmount(e.target.value)}
                      placeholder="Masukkan nominal DP..."
                      max={netTotal}
                      min="0"
                      className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-zinc-400">DP Dibayar Hari Ini:</span>
                    <span className="font-black text-amber-400 text-sm">{formatRp(downPayment)}</span>
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-zinc-400">Sisa Tagihan (Piutang):</span>
                    <span className="font-black text-rose-400 text-sm">{formatRp(sisaCicilan)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Metode Pembayaran (Cash, Transfer, QRIS, EDC) */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 ml-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {isCicilan
                    ? 'Pilih Metode Pembayaran Uang Muka (DP Hari Ini)'
                    : 'Pilih Metode Pembayaran (Pelunasan Penuh)'}
                </label>
                <span className="text-[11px] text-zinc-400">
                  Nominal Dibayar:{' '}
                  <strong className="text-orange-400 font-bold">{formatRp(downPayment)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'Tunai', label: 'Cash / Tunai', desc: 'Kas Laci Kasir', icon: Wallet },
                  { id: 'Transfer', label: 'Transfer Bank', desc: 'Rek. Mandiri', icon: Building2 },
                  { id: 'QRIS', label: 'QRIS / QR Code', desc: 'Scan QR Code', icon: QrCode },
                  { id: 'EDC', label: 'Debit / EDC', desc: 'Mesin Kartu', icon: CreditCard }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500 text-white shadow-md ring-1 ring-orange-500/50'
                          : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div
                          className={`p-2 rounded-xl ${
                            isSelected ? 'bg-orange-500 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                          {m.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-t border-zinc-800">
              <div>
                <span className="text-xs font-bold text-zinc-400 block">Total Yang Dibayar Sekarang:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-orange-400">
                    {formatRp(downPayment)}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">
                    via {paymentMethod === 'Tunai' ? 'Cash / Tunai' : paymentMethod === 'Transfer' ? 'Transfer Mandiri' : paymentMethod === 'QRIS' ? 'QRIS' : 'EDC'}
                  </span>
                </div>
                {isCicilan && (
                  <span className="text-xs text-amber-400 font-semibold block mt-0.5">
                    Sisa piutang: {formatRp(sisaCicilan)} (Jatuh tempo 40 hari)
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Proses Pembayaran & Aktifkan Paket
              </button>
            </div>
          </form>
        </div>

        {/* Right Info Box */}
        <div className="space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-orange-500" /> Ringkasan Paket Terpilih
            </h3>
            {cat === 'Bundling' && currentBundle ? (
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Nama Bundling:</span>
                  <span className="font-bold text-amber-300">{currentBundle.bundleName}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Kode & Tipe:</span>
                  <span className="font-semibold text-white">{currentBundle.bundleCode} ({currentBundle.bundleType.replace(/_/g, ' ')})</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Tipe Peserta:</span>
                  <span className="font-semibold text-white">{type}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Durasi Membership:</span>
                  <span className="font-bold text-white">
                    {(() => {
                      const mem = currentBundle.items.find((i) => i.itemType === 'MEMBERSHIP');
                      const dur = currentBundle.durationDays || mem?.duration;
                      return dur ? `${dur} Hari (${mem?.durationLabel || Math.round(dur / 30) + ' Bulan'})` : '-';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Sesi PT:</span>
                  <span className="font-bold text-white">
                    {(() => {
                      const pt = currentBundle.items.find((i) => i.itemType === 'PT');
                      return pt ? `${pt.sessionCount} Sesi PT` : '-';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Komponen PT:</span>
                  <span className="font-bold text-emerald-400">{formatRp(currentBundle.ptComponentValue || 0)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Harga Paket:</span>
                  <span className="font-bold text-zinc-300">{formatRp(currentBundle.price)}</span>
                </div>
                {discValue > 0 && (
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Diskon:</span>
                    <span className="font-bold text-rose-400">- {formatRp(discValue)}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Total Netto:</span>
                  <span className="font-black text-white">{formatRp(netTotal)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Tipe Bayar:</span>
                  <span className={`font-bold ${isCicilan ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isCicilan ? `Cicilan (DP ${formatRp(downPayment)})` : 'Lunas (100%)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Metode Bayar:</span>
                  <span className="font-bold text-sky-400">
                    {paymentMethod === 'Tunai'
                      ? 'Cash / Tunai'
                      : paymentMethod === 'Transfer'
                      ? 'Transfer Mandiri'
                      : paymentMethod === 'QRIS'
                      ? 'QRIS / QR Code'
                      : 'Debit / EDC'}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-300 font-bold">Bayar Kasir Sekarang:</span>
                  <span className="font-black text-orange-400 text-sm">{formatRp(downPayment)}</span>
                </div>
                {isCicilan && (
                  <div className="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-dashed border-zinc-800">
                    <span>Sisa Piutang (40 hari):</span>
                    <span className="font-bold text-rose-400">{formatRp(sisaCicilan)}</span>
                  </div>
                )}
              </div>
            ) : currentPackage ? (
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Nama Paket:</span>
                  <span className="font-bold text-white">{currentPackage.name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Kategori:</span>
                  <span className="font-semibold text-orange-400">{currentPackage.cat}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Tipe Peserta:</span>
                  <span className="font-semibold text-white">{currentPackage.type}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Masa / Sesi:</span>
                  <span className="font-bold text-white">
                    {currentPackage.value} {currentPackage.cat === 'Membership' ? 'Hari' : 'Sesi'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Harga Normal:</span>
                  <span className="font-bold text-zinc-300">{formatRp(currentPackage.price)}</span>
                </div>
                {discValue > 0 && (
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Diskon:</span>
                    <span className="font-bold text-rose-400">- {formatRp(discValue)}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Total Netto:</span>
                  <span className="font-black text-white">{formatRp(netTotal)}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Tipe Bayar:</span>
                  <span className={`font-bold ${isCicilan ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isCicilan ? `Cicilan (DP ${formatRp(downPayment)})` : 'Lunas (100%)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Metode Bayar:</span>
                  <span className="font-bold text-sky-400">
                    {paymentMethod === 'Tunai'
                      ? 'Cash / Tunai'
                      : paymentMethod === 'Transfer'
                      ? 'Transfer Mandiri'
                      : paymentMethod === 'QRIS'
                      ? 'QRIS / QR Code'
                      : 'Debit / EDC'}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-300 font-bold">Bayar Kasir Sekarang:</span>
                  <span className="font-black text-orange-400 text-sm">{formatRp(downPayment)}</span>
                </div>
                {isCicilan && (
                  <div className="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-dashed border-zinc-800">
                    <span>Sisa Piutang (40 hari):</span>
                    <span className="font-bold text-rose-400">{formatRp(sisaCicilan)}</span>
                  </div>
                )}

                {/* Participant & Dedicated PIC Allocation Breakdown */}
                <div className="border-t border-zinc-800 pt-3 mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Alokasi PIC Peserta ({type}):
                    </span>
                    <span className="text-[10px] text-orange-400 font-semibold">
                      {type === 'Personal' ? '1 Peserta : 1 PIC' : type === 'Couple' ? '2 Peserta : 2 PIC' : '3 Peserta : 3 PIC'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Peserta 1 */}
                    <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[9px] flex items-center justify-center shrink-0">
                          1
                        </span>
                        <span className="text-zinc-200 font-medium truncate">
                          {members.find((m) => m.id === p1Id)?.name || 'Peserta 1'}
                        </span>
                      </div>
                      <span className="font-bold text-orange-400 text-right shrink-0 truncate max-w-[130px]">
                        PIC: {staffUsers.find((s) => s.id === p1PicId)?.name || (p1Id ? 'Belum pilih' : '-')}
                      </span>
                    </div>

                    {/* Peserta 2 */}
                    {(type === 'Couple' || type === 'Trio') && (
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[9px] flex items-center justify-center shrink-0">
                            2
                          </span>
                          <span className="text-zinc-200 font-medium truncate">
                            {members.find((m) => m.id === p2Id)?.name || 'Peserta 2'}
                          </span>
                        </div>
                        <span className="font-bold text-orange-400 text-right shrink-0 truncate max-w-[130px]">
                          PIC: {staffUsers.find((s) => s.id === p2PicId)?.name || (p2Id ? 'Belum pilih' : '-')}
                        </span>
                      </div>
                    )}

                    {/* Peserta 3 */}
                    {type === 'Trio' && (
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[9px] flex items-center justify-center shrink-0">
                            3
                          </span>
                          <span className="text-zinc-200 font-medium truncate">
                            {members.find((m) => m.id === p3Id)?.name || 'Peserta 3'}
                          </span>
                        </div>
                        <span className="font-bold text-orange-400 text-right shrink-0 truncate max-w-[130px]">
                          PIC: {staffUsers.find((s) => s.id === p3PicId)?.name || (p3Id ? 'Belum pilih' : '-')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Joined Closing PICs in Summary */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider">PIC Closing Penjualan:</span>
                      <span className="font-bold text-orange-400">
                        {type === 'Personal' ? '1 PIC' : `Gabungan ${type === 'Couple' ? '2' : '3'} PIC`}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      {type === 'Personal'
                        ? staffUsers.find((s) => s.id === (picSalesId || p1PicId))?.name || (p1Id ? 'Belum pilih' : '-')
                        : [p1PicId, p2PicId, type === 'Trio' ? p3PicId : null]
                            .filter(Boolean)
                            .map((pid) => staffUsers.find((s) => s.id === pid)?.name)
                            .filter(Boolean)
                            .join(' + ') || (p1Id ? 'Sedang memilih PIC...' : '-')}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 text-xs text-zinc-400 space-y-2">
            <h4 className="font-bold text-zinc-300 uppercase text-[10px] tracking-wider">Aturan Sistem Keuangan</h4>
            <p className="leading-relaxed">
              1. Rekening penerimaan non-tunai diarahkan ke <strong>Bank Mandiri</strong>, sedangkan pembayaran tunai masuk ke kas laci.
            </p>
            <p className="leading-relaxed">
              2. Pada transaksi cicilan, member dapat memilih metode bayar <strong>Cash, Transfer Mandiri, QRIS, atau Kartu EDC</strong> untuk membayar DP hari ini. Kas riil hanya mencatat DP yang diterima, sisa tagihan tercatat di Buku Piutang tanpa risiko duplikasi.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: MASTER PAKET BARU */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4">Buat Master Paket Baru</h3>
            <form onSubmit={handleSaveMasterPackage} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={newPkgCat}
                    onChange={(e) => setNewPkgCat(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="Membership">Membership</option>
                    <option value="PT">Sesi PT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Tipe Peserta
                  </label>
                  <select
                    value={newPkgType}
                    onChange={(e) => setNewPkgType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="Personal">Personal (1 Org)</option>
                    <option value="Couple">Couple (2 Org)</option>
                    <option value="Trio">Trio (3 Org)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nama Paket
                </label>
                <input
                  type="text"
                  value={newPkgName}
                  onChange={(e) => setNewPkgName(e.target.value)}
                  placeholder="Cth: 3 Bulan Fit & Tone"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(e.target.value)}
                    required
                    min="0"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Value (Hari / Sesi)
                  </label>
                  <input
                    type="number"
                    value={newPkgValue}
                    onChange={(e) => setNewPkgValue(e.target.value)}
                    required
                    min="1"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPkgModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Simpan Master Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
