import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Activity,
  Plus,
  Search,
  Calendar,
  User,
  Scale,
  Flame,
  TrendingDown,
  TrendingUp,
  Printer,
  FileText,
  Award,
  ChevronRight,
  Sparkles,
  Heart,
  Droplets,
  Ruler,
  Dumbbell,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Download,
  AlertCircle
} from 'lucide-react';
import { BodyCompositionRecord, Member, User as UserType } from '../types';
import { formatDateIndo, formatRp, APP_TODAY } from '../utils/formatters';
import { calculateBMI, getBMICategory, calculateEstimatedBMR } from '../data/bodyCompositionData';
import { useSettings } from '../context/SettingsContext';

interface BodyCompositionViewProps {
  records: BodyCompositionRecord[];
  members: Member[];
  staffUsers: UserType[];
  currentUser: UserType | null;
  onSaveRecord: (record: BodyCompositionRecord) => void;
  onDeleteRecord?: (recordId: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  initialMemberId?: string;
}

export const BodyCompositionView: React.FC<BodyCompositionViewProps> = ({
  records,
  members,
  staffUsers,
  currentUser,
  onSaveRecord,
  onDeleteRecord,
  showToast,
  initialMemberId
}) => {
  const { settings } = useSettings();
  const gymName = settings?.profile?.gymName || 'GYMPRO FITNESS ENTERPRISE';
  const branchName = settings?.profile?.branchName || 'Cabang Utama';

  // State
  const [searchMember, setSearchMember] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    if (initialMemberId) return initialMemberId;
    // Default to the member with the most records or first available
    if (records.length > 0) return records[0].memberId;
    if (members.length > 0) return members[0].id;
    return '';
  });

  useEffect(() => {
    if (initialMemberId) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [printRecord, setPrintRecord] = useState<BodyCompositionRecord | null>(null);
  const [activeChartMetric, setActiveChartMetric] = useState<'weight' | 'bodyFat' | 'muscle'>('weight');

  // Filter members list based on search
  const filteredMemberList = useMemo(() => {
    return members.filter((m) => {
      const q = searchMember.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q))
      );
    });
  }, [members, searchMember]);

  // Selected member object
  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  // Records for the selected member (sorted chronological: oldest to newest for charts)
  const memberRecords = useMemo(() => {
    if (!selectedMemberId) return [];
    return records
      .filter((r) => r.memberId === selectedMemberId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records, selectedMemberId]);

  // Reverse for chronological table (newest first)
  const memberRecordsDesc = useMemo(() => {
    return [...memberRecords].reverse();
  }, [memberRecords]);

  // Earliest vs Latest record
  const initialRecord = memberRecords.length > 0 ? memberRecords[0] : null;
  const latestRecord = memberRecords.length > 0 ? memberRecords[memberRecords.length - 1] : null;

  // Deltas
  const weightDelta = initialRecord && latestRecord ? Math.round((latestRecord.weight - initialRecord.weight) * 10) / 10 : 0;
  const bodyFatDelta = initialRecord?.bodyFatPercentage && latestRecord?.bodyFatPercentage
    ? Math.round((latestRecord.bodyFatPercentage - initialRecord.bodyFatPercentage) * 10) / 10
    : null;
  const muscleMassDelta = initialRecord?.muscleMass && latestRecord?.muscleMass
    ? Math.round((latestRecord.muscleMass - initialRecord.muscleMass) * 10) / 10
    : null;

  // New Record Form State
  const [formMemberId, setFormMemberId] = useState(selectedMemberId || '');
  const [formDate, setFormDate] = useState(APP_TODAY);
  const [formWeight, setFormWeight] = useState('');
  const [formHeight, setFormHeight] = useState('170');
  const [formBodyFat, setFormBodyFat] = useState('');
  const [formMuscleMass, setFormMuscleMass] = useState('');
  const [formVisceralFat, setFormVisceralFat] = useState('');
  const [formChest, setFormChest] = useState('');
  const [formWaist, setFormWaist] = useState('');
  const [formHips, setFormHips] = useState('');
  const [formArmRight, setFormArmRight] = useState('');
  const [formThighRight, setFormThighRight] = useState('');
  const [formBloodPressure, setFormBloodPressure] = useState('120/80');
  const [formRestingHR, setFormRestingHR] = useState('72');
  const [formTargetWeight, setFormTargetWeight] = useState('');
  const [formFitnessGoal, setFormFitnessGoal] = useState<'Weight Loss' | 'Muscle Gain' | 'General Fitness' | 'Endurance'>('Weight Loss');
  const [formTrainerId, setFormTrainerId] = useState(() => {
    if (currentUser?.role === 'pt' || currentUser?.role === 'leader_pt') return currentUser.id;
    return staffUsers.find((s) => s.role === 'pt')?.id || '';
  });
  const [formNotes, setFormNotes] = useState('');
  const [formRecommendations, setFormRecommendations] = useState('');

  // Auto calculate BMI in form
  const computedFormBMI = useMemo(() => {
    const w = parseFloat(formWeight);
    const h = parseFloat(formHeight);
    return calculateBMI(w, h);
  }, [formWeight, formHeight]);

  const computedFormBMICategory = useMemo(() => {
    return getBMICategory(computedFormBMI);
  }, [computedFormBMI]);

  // Open modal with preselected member
  const handleOpenAddModal = (memberId?: string) => {
    const targetId = memberId || selectedMemberId || (members[0]?.id ?? '');
    setFormMemberId(targetId);
    setFormDate(APP_TODAY);

    // Prepopulate height & target from previous record if available
    const existingRecs = records.filter((r) => r.memberId === targetId);
    if (existingRecs.length > 0) {
      const last = existingRecs[existingRecs.length - 1];
      setFormHeight(last.height ? String(last.height) : '170');
      setFormTargetWeight(last.targetWeight ? String(last.targetWeight) : '');
      setFormFitnessGoal((last.fitnessGoal as any) || 'Weight Loss');
      if (last.weight) setFormWeight(String(last.weight));
    } else {
      setFormHeight('170');
      setFormWeight('70');
      setFormTargetWeight('65');
    }

    setFormBodyFat('');
    setFormMuscleMass('');
    setFormVisceralFat('');
    setFormChest('');
    setFormWaist('');
    setFormHips('');
    setFormArmRight('');
    setFormThighRight('');
    setFormNotes('');
    setFormRecommendations('');
    setIsAddModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMemberId) {
      showToast('Validasi Gagal', 'Harap pilih member terlebih dahulu.', 'warning');
      return;
    }
    const weightVal = parseFloat(formWeight);
    const heightVal = parseFloat(formHeight);
    if (!weightVal || weightVal <= 0 || !heightVal || heightVal <= 0) {
      showToast('Validasi Gagal', 'Berat badan dan tinggi badan harus diisi angka valid.', 'warning');
      return;
    }

    const targetMember = members.find((m) => m.id === formMemberId);
    const isSelfInput = formTrainerId === '__SELF__';
    const trainerObj = isSelfInput ? null : staffUsers.find((s) => s.id === formTrainerId);
    const bmiVal = calculateBMI(weightVal, heightVal);
    const bmrVal = calculateEstimatedBMR(
      weightVal,
      heightVal,
      28,
      (targetMember?.gender as 'L' | 'P') || 'L'
    );

    const newRecord: BodyCompositionRecord = {
      id: 'BC-' + Date.now().toString().slice(-6),
      memberId: formMemberId,
      memberName: targetMember ? targetMember.name : 'Member',
      date: formDate,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      trainerId: isSelfInput ? undefined : formTrainerId || undefined,
      trainerName: isSelfInput ? 'Input Mandiri (Member)' : (trainerObj ? trainerObj.name : currentUser?.name || 'Trainer InBody'),
      selfReported: isSelfInput,
      weight: weightVal,
      height: heightVal,
      bmi: bmiVal,
      bodyFatPercentage: formBodyFat ? parseFloat(formBodyFat) : undefined,
      muscleMass: formMuscleMass ? parseFloat(formMuscleMass) : undefined,
      visceralFat: formVisceralFat ? parseInt(formVisceralFat, 10) : undefined,
      basalMetabolicRate: bmrVal,
      chest: formChest ? parseFloat(formChest) : undefined,
      waist: formWaist ? parseFloat(formWaist) : undefined,
      hips: formHips ? parseFloat(formHips) : undefined,
      armRight: formArmRight ? parseFloat(formArmRight) : undefined,
      thighRight: formThighRight ? parseFloat(formThighRight) : undefined,
      bloodPressure: formBloodPressure || undefined,
      restingHeartRate: formRestingHR ? parseInt(formRestingHR, 10) : undefined,
      targetWeight: formTargetWeight ? parseFloat(formTargetWeight) : undefined,
      fitnessGoal: formFitnessGoal,
      notes: formNotes || undefined,
      trainerRecommendations: formRecommendations || undefined,
      branchId: targetMember?.branchId,
      branchName: targetMember?.branchName,
      createdAt: new Date().toISOString()
    };

    onSaveRecord(newRecord);
    showToast('Pengukuran Disimpan', `Evaluasi fisik untuk ${newRecord.memberName} berhasil dicatat.`, 'success');
    setIsAddModalOpen(false);
    setSelectedMemberId(formMemberId);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast('Tidak Ada Data', 'Belum ada data pengukuran untuk diexport.', 'warning');
      return;
    }
    const headers = [
      'ID',
      'Member ID',
      'Nama Member',
      'Tanggal',
      'Tinggi (cm)',
      'Berat (kg)',
      'BMI',
      'Body Fat (%)',
      'Muscle Mass (kg)',
      'Visceral Fat',
      'Lingkar Dada (cm)',
      'Lingkar Pinggang (cm)',
      'Lingkar Pinggul (cm)',
      'Tekanan Darah',
      'Trainer',
      'Catatan'
    ];
    const rows = records.map((r) => [
      r.id,
      r.memberId,
      `"${r.memberName}"`,
      r.date,
      r.height,
      r.weight,
      r.bmi,
      r.bodyFatPercentage || '',
      r.muscleMass || '',
      r.visceralFat || '',
      r.chest || '',
      r.waist || '',
      r.hips || '',
      `"${r.bloodPressure || ''}"`,
      `"${r.trainerName || ''}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Body_Composition_Report_${APP_TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Berhasil', 'Laporan pengukuran fisik berhasil didownload ke file CSV.', 'success');
  };

  // Print Report Handler
  const printAreaRef = useRef<HTMLDivElement>(null);
  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Body Composition & Progress Tracking
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold uppercase tracking-wider">
                  InBody Standard
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pencatatan metrik fisik, body fat, massa otot, lingkar tubuh & analisis kemajuan latihan member
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-zinc-400" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-orange-500/20 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Catat Pengukuran Baru
          </button>
        </div>
      </div>

      {/* MEMBER SELECTOR BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Member Directory Selector */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col h-[750px]">
          <div className="mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
              <span>Pilih Member ({members.length})</span>
              <span className="text-[10px] text-orange-400 lowercase">{records.length} evaluasi tercatat</span>
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Cari nama atau No. ID..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-orange-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {filteredMemberList.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Tidak ada member ditemukan.
              </div>
            ) : (
              filteredMemberList.map((m) => {
                const isSelected = m.id === selectedMemberId;
                const memRecCount = records.filter((r) => r.memberId === m.id).length;
                const lastRec = records
                  .filter((r) => r.memberId === m.id)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 border ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500/40 text-white'
                        : 'bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-800/50 text-zinc-300'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={m.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                        alt={m.name}
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
                      />
                      {memRecCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">
                          {memRecCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs truncate text-white">{m.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">{m.id}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                        <span className="truncate">{m.phone}</span>
                        {lastRec ? (
                          <span className="text-orange-400 font-bold shrink-0">{lastRec.weight} kg</span>
                        ) : (
                          <span className="text-zinc-600 shrink-0">Belum ada data</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition ${isSelected ? 'text-orange-400 translate-x-0.5' : 'text-zinc-600'}`} />
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800 mt-2">
            <button
              type="button"
              onClick={() => handleOpenAddModal(selectedMemberId)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5 text-orange-400" />
              <span>Input InBody untuk Member Terpilih</span>
            </button>
          </div>
        </div>

        {/* Right Side: Member Fitness Dashboard & Trend Analysis */}
        <div className="lg:col-span-8 space-y-6">
          {selectedMember ? (
            <>
              {/* MEMBER HERO CARD */}
              <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden shadow-xl">
                <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedMember.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                      alt={selectedMember.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-500/30 shadow-md shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-white">{selectedMember.name}</h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono font-bold">
                          {selectedMember.id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
                        <span>📱 {selectedMember.phone}</span>
                        <span>🏢 {selectedMember.branchName || 'Cabang Utama'}</span>
                        <span>🎯 PT Quota: {selectedMember.ptQuota || 0} Sesi</span>
                      </div>
                      {latestRecord?.fitnessGoal && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                          <Award className="w-3 h-3 text-amber-400" /> Goal: {latestRecord.fitnessGoal}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(selectedMember.id)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Tambah Catatan
                    </button>
                    {latestRecord && (
                      <button
                        type="button"
                        onClick={() => setPrintRecord(latestRecord)}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Printer className="w-4 h-4 text-orange-400" /> Cetak Raport
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI PROGRESS TILES */}
                {latestRecord ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-800/80">
                    {/* Weight Tile */}
                    <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span>Berat Terkini</span>
                        <Scale className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">{latestRecord.weight}</span>
                        <span className="text-xs text-zinc-400 font-bold">kg</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        {weightDelta !== 0 && (
                          <span
                            className={`flex items-center font-bold ${
                              weightDelta < 0 ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {weightDelta < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5" />}
                            {weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg
                          </span>
                        )}
                        <span className="text-zinc-500">
                          {initialRecord ? `dari ${initialRecord.weight} kg` : 'baseline'}
                        </span>
                      </div>
                      {latestRecord.targetWeight && (
                        <div className="mt-2 pt-2 border-t border-zinc-800/60 flex justify-between items-center text-[9px] text-zinc-400">
                          <span>Target: {latestRecord.targetWeight} kg</span>
                          <span className="font-bold text-orange-400">
                            {Math.abs(Math.round((latestRecord.weight - latestRecord.targetWeight) * 10) / 10)} kg lagi
                          </span>
                        </div>
                      )}
                    </div>

                    {/* BMI Tile */}
                    <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span>Index Massa Tubuh</span>
                        <Activity className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">{latestRecord.bmi}</span>
                        <span className="text-xs text-zinc-400 font-bold">BMI</span>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-block text-[9.5px] px-2 py-0.5 rounded-md font-bold ${getBMICategory(latestRecord.bmi).badge}`}>
                          {getBMICategory(latestRecord.bmi).label}
                        </span>
                      </div>
                      <div className="mt-2 text-[9px] text-zinc-500">
                        TB: {latestRecord.height} cm
                      </div>
                    </div>

                    {/* Body Fat Tile */}
                    <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span>Body Fat %</span>
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">
                          {latestRecord.bodyFatPercentage ? `${latestRecord.bodyFatPercentage}%` : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        {bodyFatDelta !== null && (
                          <span
                            className={`flex items-center font-bold ${
                              bodyFatDelta < 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {bodyFatDelta < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5" />}
                            {bodyFatDelta > 0 ? `+${bodyFatDelta}` : bodyFatDelta}%
                          </span>
                        )}
                        <span className="text-zinc-500">lemak tubuh</span>
                      </div>
                      <div className="mt-2 text-[9px] text-zinc-500">
                        Visceral: Level {latestRecord.visceralFat ?? '-'}
                      </div>
                    </div>

                    {/* Muscle Mass Tile */}
                    <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        <span>Massa Otot (SMM)</span>
                        <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white">
                          {latestRecord.muscleMass ? latestRecord.muscleMass : '-'}
                        </span>
                        <span className="text-xs text-zinc-400 font-bold">kg</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px]">
                        {muscleMassDelta !== null && (
                          <span
                            className={`flex items-center font-bold ${
                              muscleMassDelta >= 0 ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                            {muscleMassDelta > 0 ? `+${muscleMassDelta}` : muscleMassDelta} kg
                          </span>
                        )}
                        <span className="text-zinc-500">skeletal muscle</span>
                      </div>
                      <div className="mt-2 text-[9px] text-zinc-500">
                        BMR: {latestRecord.basalMetabolicRate ? `${latestRecord.basalMetabolicRate} kcal` : '-'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 pt-5 border-t border-zinc-800 text-center py-6 text-zinc-500 text-xs">
                    Member ini belum memiliki data pengukuran tubuh. Klik tombol "Tambah Catatan" di atas untuk memulai evaluasi pertama.
                  </div>
                )}
              </div>

              {/* TREND VISUALIZATION CHART */}
              {memberRecords.length > 1 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-400" />
                        Grafik Perkembangan Metrik Tubuh
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Perkembangan berkala dari {formatDateIndo(memberRecords[0].date)} hingga {formatDateIndo(memberRecords[memberRecords.length - 1].date)}
                      </p>
                    </div>

                    <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setActiveChartMetric('weight')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          activeChartMetric === 'weight'
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Berat Badan (kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveChartMetric('bodyFat')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          activeChartMetric === 'bodyFat'
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Body Fat %
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveChartMetric('muscle')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          activeChartMetric === 'muscle'
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Massa Otot (kg)
                      </button>
                    </div>
                  </div>

                  {/* SVG Line / Timeline Chart */}
                  <div className="h-60 w-full relative pt-6 pb-2">
                    {(() => {
                      const dataPoints = memberRecords.map((r, i) => {
                        let val = r.weight;
                        if (activeChartMetric === 'bodyFat') val = r.bodyFatPercentage || 0;
                        if (activeChartMetric === 'muscle') val = r.muscleMass || 0;
                        return { date: r.date, val, record: r };
                      });

                      const values = dataPoints.map((d) => d.val).filter((v) => v > 0);
                      const minVal = values.length > 0 ? Math.min(...values) * 0.95 : 0;
                      const maxVal = values.length > 0 ? Math.max(...values) * 1.05 : 100;
                      const range = maxVal - minVal || 1;

                      const svgWidth = 600;
                      const svgHeight = 180;

                      const points = dataPoints.map((d, index) => {
                        const x = dataPoints.length === 1 ? svgWidth / 2 : (index / (dataPoints.length - 1)) * (svgWidth - 60) + 30;
                        const y = svgHeight - ((d.val - minVal) / range) * (svgHeight - 40) - 20;
                        return { x, y, ...d };
                      });

                      const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

                      return (
                        <div className="w-full h-full flex flex-col justify-between">
                          <svg
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            className="w-full h-44 overflow-visible"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Grid horizontal lines */}
                            <line x1="20" y1="20" x2={svgWidth - 20} y2="20" stroke="#27272a" strokeDasharray="4 4" />
                            <line x1="20" y1={svgHeight / 2} x2={svgWidth - 20} y2={svgHeight / 2} stroke="#27272a" strokeDasharray="4 4" />
                            <line x1="20" y1={svgHeight - 20} x2={svgWidth - 20} y2={svgHeight - 20} stroke="#27272a" strokeDasharray="4 4" />

                            {/* Filled Area */}
                            {points.length > 1 && (
                              <polygon
                                points={`30,${svgHeight - 10} ${polylinePoints} ${points[points.length - 1].x},${svgHeight - 10}`}
                                fill="url(#chartGrad)"
                              />
                            )}

                            {/* Polyline */}
                            <polyline
                              fill="none"
                              stroke="#f97316"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={polylinePoints}
                            />

                            {/* Data Point Circles */}
                            {points.map((p, i) => (
                              <g key={i}>
                                <circle cx={p.x} cy={p.y} r="6" fill="#18181b" stroke="#f97316" strokeWidth="2.5" />
                                <text
                                  x={p.x}
                                  y={p.y - 12}
                                  fill="#f4f4f5"
                                  fontSize="10"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {p.val} {activeChartMetric === 'bodyFat' ? '%' : 'kg'}
                                </text>
                              </g>
                            ))}
                          </svg>

                          {/* Date Labels below chart */}
                          <div className="flex justify-between px-6 text-[10px] font-mono text-zinc-500 border-t border-zinc-800 pt-2">
                            {memberRecords.map((r, i) => (
                              <span key={i} className="text-center">
                                {formatDateIndo(r.date)}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ANTHROPOMETRIC CIRCUMFERENCES COMPARISON */}
              {latestRecord && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-orange-400" />
                        Pengukuran Lingkar Tubuh (Antropometri)
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Perbandingan lingkar bagian tubuh utama dalam centimeter (cm)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      {
                        label: 'Lingkar Dada',
                        init: initialRecord?.chest,
                        current: latestRecord.chest,
                        unit: 'cm'
                      },
                      {
                        label: 'Lingkar Pinggang',
                        init: initialRecord?.waist,
                        current: latestRecord.waist,
                        unit: 'cm'
                      },
                      {
                        label: 'Lingkar Pinggul',
                        init: initialRecord?.hips,
                        current: latestRecord.hips,
                        unit: 'cm'
                      },
                      {
                        label: 'Lingkar Lengan',
                        init: initialRecord?.armRight,
                        current: latestRecord.armRight,
                        unit: 'cm'
                      },
                      {
                        label: 'Lingkar Paha',
                        init: initialRecord?.thighRight,
                        current: latestRecord.thighRight,
                        unit: 'cm'
                      }
                    ].map((item, idx) => {
                      const delta = item.init && item.current ? Math.round((item.current - item.init) * 10) / 10 : 0;
                      return (
                        <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-center">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            {item.label}
                          </span>
                          <span className="text-lg font-black text-white">
                            {item.current ? `${item.current} cm` : '-'}
                          </span>
                          {item.init && item.current && (
                            <div className="mt-1 flex items-center justify-center gap-1 text-[10px]">
                              <span className="text-zinc-500">Awal: {item.init}</span>
                              <span
                                className={`font-bold ml-1 ${
                                  delta < 0 ? 'text-emerald-400' : delta > 0 ? 'text-amber-400' : 'text-zinc-400'
                                }`}
                              >
                                ({delta > 0 ? `+${delta}` : delta})
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ASSESSMENT HISTORY LIST */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    Riwayat Sesi Pengukuran ({memberRecordsDesc.length})
                  </h3>
                </div>

                {memberRecordsDesc.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    Belum ada riwayat pengukuran untuk member ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memberRecordsDesc.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">
                              {formatDateIndo(rec.date)} {rec.time ? `• ${rec.time}` : ''}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">#{rec.id}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getBMICategory(rec.bmi).badge}`}>
                              BMI {rec.bmi} ({getBMICategory(rec.bmi).label})
                            </span>
                            {rec.selfReported || rec.trainerName?.includes('Mandiri') ? (
                              <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[9px] font-black">
                                📱 INPUT MANDIRI MEMBER
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black">
                                👨‍🏫 EVALUASI TRAINER
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300">
                            <span>
                              ⚖️ <strong>{rec.weight} kg</strong> (TB: {rec.height} cm)
                            </span>
                            {rec.bodyFatPercentage && (
                              <span>
                                🔥 Fat: <strong>{rec.bodyFatPercentage}%</strong>
                              </span>
                            )}
                            {rec.muscleMass && (
                              <span>
                                💪 Otot: <strong>{rec.muscleMass} kg</strong>
                              </span>
                            )}
                            {rec.visceralFat && (
                              <span>
                                🫀 Visceral: <strong>Lvl {rec.visceralFat}</strong>
                              </span>
                            )}
                            {rec.trainerName && (
                              <span className="text-zinc-400">
                                {rec.selfReported || rec.trainerName.includes('Mandiri') ? (
                                  <span className="text-blue-400 font-semibold">📱 Input Mandiri Member</span>
                                ) : (
                                  <>👨‍🏫 Trainer: <strong className="text-zinc-200">{rec.trainerName}</strong></>
                                )}
                              </span>
                            )}
                          </div>

                          {rec.notes && (
                            <p className="text-[11px] text-zinc-400 italic mt-1 line-clamp-1">
                              "{rec.notes}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPrintRecord(rec)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-400" /> Cetak Raport
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
              <Scale className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-400">Pilih member di kolom kiri untuk melihat data komposisi tubuh.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: INPUT INBODY BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Catat Pengukuran Fisik & InBody</h3>
                  <p className="text-[11px] text-zinc-400">Input parameter komposisi tubuh dan lingkar antropometri member</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              {/* Member & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Member *
                  </label>
                  <select
                    value={formMemberId}
                    onChange={(e) => setFormMemberId(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-orange-500"
                  >
                    <option value="">Pilih Member...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Tanggal Pengukuran *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              {/* CORE METRICS: Berat, Tinggi, Body Fat, Muscle Mass */}
              <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Parameter Utama Komposisi Tubuh
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Berat (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formWeight}
                      onChange={(e) => setFormWeight(e.target.value)}
                      required
                      placeholder="Cth: 75.5"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Tinggi (cm) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formHeight}
                      onChange={(e) => setFormHeight(e.target.value)}
                      required
                      placeholder="Cth: 175"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Body Fat (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formBodyFat}
                      onChange={(e) => setFormBodyFat(e.target.value)}
                      placeholder="Cth: 21.5"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Massa Otot (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formMuscleMass}
                      onChange={(e) => setFormMuscleMass(e.target.value)}
                      placeholder="Cth: 34.0"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Auto-calc BMI Feedback Banner */}
                {computedFormBMI > 0 && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                    <span className="text-zinc-400">
                      Auto-Calculated BMI: <strong className="text-white">{computedFormBMI}</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${computedFormBMICategory.badge}`}>
                      {computedFormBMICategory.label}
                    </span>
                  </div>
                )}
              </div>

              {/* LINGKAR TUBUH (ANTROPOMETRI) */}
              <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> Ukuran Lingkar Tubuh (cm)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Dada
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formChest}
                      onChange={(e) => setFormChest(e.target.value)}
                      placeholder="cm"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Pinggang
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formWaist}
                      onChange={(e) => setFormWaist(e.target.value)}
                      placeholder="cm"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Pinggul
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formHips}
                      onChange={(e) => setFormHips(e.target.value)}
                      placeholder="cm"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Lengan Kanan
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formArmRight}
                      onChange={(e) => setFormArmRight(e.target.value)}
                      placeholder="cm"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Paha Kanan
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formThighRight}
                      onChange={(e) => setFormThighRight(e.target.value)}
                      placeholder="cm"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* TARGET & CATATAN TRAINER */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Target Berat (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formTargetWeight}
                    onChange={(e) => setFormTargetWeight(e.target.value)}
                    placeholder="Cth: 70.0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Tujuan / Goal Program
                  </label>
                  <select
                    value={formFitnessGoal}
                    onChange={(e) => setFormFitnessGoal(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-orange-500"
                  >
                    <option value="Weight Loss">Penurunan Berat (Fat Loss)</option>
                    <option value="Muscle Gain">Penambahan Otot (Hypertrophy)</option>
                    <option value="General Fitness">Kebugaran Umum & Stamina</option>
                    <option value="Endurance">Daya Tahan (Endurance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Trainer / Penilai
                  </label>
                  <select
                    value={formTrainerId}
                    onChange={(e) => setFormTrainerId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-hidden focus:border-orange-500"
                  >
                    <option value="">Pilih Trainer...</option>
                    <option value="__SELF__">📱 Input Mandiri oleh Member</option>
                    {staffUsers
                      .filter((s) => s.role === 'pt' || s.role === 'leader_pt' || s.role === 'admin')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          👨‍🏫 {s.name} ({s.roleName})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Catatan Evaluasi & Rekomendasi Latihan / Nutrisi
                </label>
                <textarea
                  value={formRecommendations}
                  onChange={(e) => setFormRecommendations(e.target.value)}
                  rows={2}
                  placeholder="Cth: Jadwal latihan beban 3x/minggu, deficit kalori 300 kcal, target konsumsi protein 100g/hari..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-orange-500/20"
                >
                  Simpan Pengukuran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRINT PREVIEW / LAPORAN INBODY RESMI */}
      {printRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white text-zinc-900 rounded-2xl shadow-2xl w-full max-w-xl p-6 sm:p-8 my-auto max-h-[95vh] overflow-y-auto print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none">
            {/* Action Bar for Modal (hidden in print) */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-6 print:hidden">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-600" /> Lembar Evaluasi Kebugaran InBody
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
                >
                  <Printer className="w-4 h-4" /> Cetak Dokumen
                </button>
                <button
                  type="button"
                  onClick={() => setPrintRecord(null)}
                  className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PRINTABLE REPORT CARD */}
            <div ref={printAreaRef} className="space-y-5 text-black">
              {/* Gym Header */}
              <div className="text-center pb-4 border-b-2 border-black space-y-1">
                <h2 className="text-xl font-black uppercase tracking-wider">{gymName}</h2>
                <p className="text-xs font-semibold text-zinc-700">{branchName} • BODY COMPOSITION EVALUATION</p>
                <p className="text-[10px] text-zinc-500">ID Laporan: {printRecord.id} • Tanggal: {formatDateIndo(printRecord.date)}</p>
              </div>

              {/* Member Profile Row */}
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Nama Member</span>
                  <strong className="text-sm">{printRecord.memberName}</strong>
                  <span className="text-[10px] text-zinc-600 block">ID: {printRecord.memberId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Trainer Penilai</span>
                  <strong className="text-sm">{printRecord.trainerName || 'Instruktur InBody'}</strong>
                  {printRecord.fitnessGoal && (
                    <span className="text-[10px] text-orange-700 font-bold block">Goal: {printRecord.fitnessGoal}</span>
                  )}
                </div>
              </div>

              {/* Core InBody Metrics Table */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                  1. Parameter Komposisi Tubuh
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-zinc-50 rounded border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 uppercase block">Berat Badan</span>
                    <span className="text-base font-black">{printRecord.weight} kg</span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 rounded border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 uppercase block">Tinggi Badan</span>
                    <span className="text-base font-black">{printRecord.height} cm</span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 rounded border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 uppercase block">BMI Index</span>
                    <span className="text-base font-black">{printRecord.bmi}</span>
                    <span className="text-[8.5px] block font-bold text-zinc-700 mt-0.5">
                      {getBMICategory(printRecord.bmi).label}
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 rounded border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 uppercase block">Body Fat %</span>
                    <span className="text-base font-black">{printRecord.bodyFatPercentage ?? '-'}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mt-2">
                  <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 uppercase block">Massa Otot (SMM)</span>
                    <span className="text-sm font-black">{printRecord.muscleMass ?? '-'} kg</span>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 uppercase block">Visceral Fat</span>
                    <span className="text-sm font-black">Level {printRecord.visceralFat ?? '-'}</span>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 uppercase block">BMR Estimasi</span>
                    <span className="text-sm font-black">{printRecord.basalMetabolicRate ?? '-'} kcal</span>
                  </div>
                </div>
              </div>

              {/* Anthropometric Table */}
              {(printRecord.chest || printRecord.waist || printRecord.hips || printRecord.armRight) && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-black border-b border-black pb-1 mb-2">
                    2. Ukuran Lingkar Antropometri (cm)
                  </h4>
                  <table className="w-full text-xs text-left border border-zinc-200">
                    <thead className="bg-zinc-100 font-bold border-b border-zinc-200">
                      <tr>
                        <th className="p-1.5">Bagian Tubuh</th>
                        <th className="p-1.5 text-right">Ukuran (cm)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {printRecord.chest && (
                        <tr>
                          <td className="p-1.5">Lingkar Dada</td>
                          <td className="p-1.5 text-right font-bold">{printRecord.chest} cm</td>
                        </tr>
                      )}
                      {printRecord.waist && (
                        <tr>
                          <td className="p-1.5">Lingkar Pinggang</td>
                          <td className="p-1.5 text-right font-bold">{printRecord.waist} cm</td>
                        </tr>
                      )}
                      {printRecord.hips && (
                        <tr>
                          <td className="p-1.5">Lingkar Pinggul</td>
                          <td className="p-1.5 text-right font-bold">{printRecord.hips} cm</td>
                        </tr>
                      )}
                      {printRecord.armRight && (
                        <tr>
                          <td className="p-1.5">Lingkar Lengan (Kanan)</td>
                          <td className="p-1.5 text-right font-bold">{printRecord.armRight} cm</td>
                        </tr>
                      )}
                      {printRecord.thighRight && (
                        <tr>
                          <td className="p-1.5">Lingkar Paha (Kanan)</td>
                          <td className="p-1.5 text-right font-bold">{printRecord.thighRight} cm</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Recommendations */}
              {(printRecord.trainerRecommendations || printRecord.notes) && (
                <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-zinc-600 block">
                    Saran & Rekomendasi Trainer:
                  </span>
                  <p className="text-xs leading-relaxed text-zinc-800">
                    {printRecord.trainerRecommendations || printRecord.notes}
                  </p>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="text-zinc-500 mb-12">Member / Klien</p>
                  <p className="font-bold border-t border-zinc-400 mx-8 pt-1">{printRecord.memberName}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-12">Personal Trainer / Instruktur</p>
                  <p className="font-bold border-t border-zinc-400 mx-8 pt-1">{printRecord.trainerName || 'Trainer'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
