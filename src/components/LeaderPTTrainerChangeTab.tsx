import React, { useState } from 'react';
import {
  User,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Phone,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  X
} from 'lucide-react';
import { TrainerChangeRequest, User as UserType } from '../types';
import { formatDateIndo } from '../utils/formatters';

interface LeaderPTTrainerChangeTabProps {
  changeRequests: TrainerChangeRequest[];
  trainers: UserType[];
  onApproveRequest: (requestId: string, newTrainerId: string, newTrainerName: string, notes?: string) => void;
  onRejectRequest: (requestId: string, notes?: string) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const LeaderPTTrainerChangeTab: React.FC<LeaderPTTrainerChangeTabProps> = ({
  changeRequests = [],
  trainers = [],
  onApproveRequest,
  onRejectRequest,
  showToast
}) => {
  // Modal State for Approving and Reassigning
  const [selectedRequest, setSelectedRequest] = useState<TrainerChangeRequest | null>(null);
  const [chosenTrainerId, setChosenTrainerId] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  const pendingRequests = changeRequests.filter((r) => r.status === 'PENDING');
  const pastRequests = changeRequests.filter((r) => r.status !== 'PENDING');

  const handleOpenApproveModal = (req: TrainerChangeRequest) => {
    setSelectedRequest(req);
    // Default to preferred trainer if exists, else first different trainer
    if (req.preferredTrainerId) {
      setChosenTrainerId(req.preferredTrainerId);
    } else {
      const other = trainers.find((t) => t.id !== req.currentTrainerId);
      setChosenTrainerId(other?.id || '');
    }
    setApprovalNotes('Permohonan disetujui oleh Leader PT. Pelatih baru resmi ditugaskan.');
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const newTrainer = trainers.find((t) => t.id === chosenTrainerId);
    if (!newTrainer) {
      showToast('Pilih Pelatih', 'Harap pilih pelatih pengganti yang sah.', 'warning');
      return;
    }

    onApproveRequest(selectedRequest.id, newTrainer.id, newTrainer.name, approvalNotes);
    setSelectedRequest(null);
    showToast(
      'Pergantian Pelatih Disetujui',
      `Member ${selectedRequest.memberName} kini resmi dialihkan ke Coach ${newTrainer.name}. Booking berikutnya akan menggunakan pelatih baru.`,
      'success'
    );
  };

  const handleReject = (req: TrainerChangeRequest) => {
    const reason = window.prompt(
      `Tolak permohonan pergantian trainer untuk member ${req.memberName}? Masukkan alasan penolakan:`
    );
    if (reason !== null) {
      onRejectRequest(req.id, reason || 'Ditolak oleh Leader PT setelah evaluasi jadwal.');
      showToast('Permohonan Ditolak', `Permintaan pergantian trainer ${req.memberName} telah ditolak.`, 'info');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-black text-white">
              Permintaan Pergantian Personal Trainer oleh Member
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
              {pendingRequests.length} Menunggu Review
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Member yang mengajukan pergantian pelatih melalui Portal Member akan masuk ke sini untuk dievaluasi oleh Leader PT.
          </p>
        </div>
      </div>

      {/* 2. Pending Requests List */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Antrian Menunggu Evaluasi Leader PT ({pendingRequests.length})</span>
        </h4>

        {pendingRequests.length === 0 ? (
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center text-zinc-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            <p>Tidak ada permohonan pergantian trainer yang sedang menunggu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-lg shadow-amber-500/5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">{req.id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase border border-amber-500/30">
                      MENUNGGU PERSETUJUAN
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">{req.requestedAt}</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-extrabold text-white flex items-center justify-between">
                    <span>{req.memberName}</span>
                    <span className="text-xs font-normal text-zinc-400 font-mono">{req.memberId}</span>
                  </h4>
                  <div className="text-xs text-zinc-400">
                    Paket: <strong className="text-zinc-200">{req.packageName}</strong>
                  </div>

                  {/* Current vs Preferred Trainer */}
                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Pelatih Saat Ini</span>
                      <strong className="text-rose-400">{req.currentTrainerName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Pelatih yang Diharapkan</span>
                      <strong className="text-emerald-400">{req.preferredTrainerName || 'Rekomendasi Leader'}</strong>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Alasan Member:</span>
                    <p className="text-zinc-300 italic leading-relaxed">"{req.reason}"</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleReject(req)}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-bold border border-zinc-700 transition"
                  >
                    Tolak Permohonan
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenApproveModal(req)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Setujui & Tugaskan Trainer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. History of Past Requests */}
      {pastRequests.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-zinc-800">
          <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
            Riwayat Permohonan Selesai ({pastRequests.length})
          </h4>
          <div className="divide-y divide-zinc-800/80 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {pastRequests.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{r.memberName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-zinc-400">
                    Dari Coach <strong>{r.currentTrainerName}</strong> &rarr; Ditugaskan ke Coach <strong>{r.assignedTrainerName || r.preferredTrainerName}</strong>
                  </p>
                </div>
                <span className="text-[11px] text-zinc-500">{r.reviewedAt || r.requestedAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: APPROVE & REASSIGN TRAINER */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-black text-white">
                  Setujui & Tugaskan Trainer Baru
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
              <div>
                Member: <strong className="text-white">{selectedRequest.memberName}</strong> ({selectedRequest.memberId})
              </div>
              <div>
                Pelatih Lama: <strong className="text-rose-400">{selectedRequest.currentTrainerName}</strong>
              </div>
              <div className="text-zinc-400 pt-1 border-t border-zinc-800">
                Alasan Member: <em>"{selectedRequest.reason}"</em>
              </div>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Pilih Personal Trainer Baru yang Ditugaskan:
                </label>
                <select
                  value={chosenTrainerId}
                  onChange={(e) => setChosenTrainerId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs font-bold outline-none focus:border-emerald-500"
                >
                  <option value="">-- Pilih Pelatih Resmi --</option>
                  {trainers
                    .filter((t) => t.id !== selectedRequest.currentTrainerId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.roleName || 'Pelatih PT'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Catatan Persetujuan Leader PT:
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md shadow-emerald-500/20 active:scale-95 transition"
                >
                  Konfirmasi Pergantian Pelatih
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
