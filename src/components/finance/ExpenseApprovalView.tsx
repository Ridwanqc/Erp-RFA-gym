import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  Building2,
  Calendar,
  CreditCard,
  User,
  ExternalLink,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { CompanyExpense, ExpenseApprovalPolicy, User as UserType } from '../../types';
import { formatRp } from '../../utils/formatters';
import { ExpenseDetailModal } from './ExpenseDetailModal';

interface ExpenseApprovalViewProps {
  expenses: CompanyExpense[];
  currentUser: UserType | null;
  policy: ExpenseApprovalPolicy;
  onUpdatePolicy: (newPolicy: ExpenseApprovalPolicy) => void;
  onApproveExpense: (expense: CompanyExpense) => void;
  onRejectExpense: (expense: CompanyExpense, reason: string) => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ExpenseApprovalView: React.FC<ExpenseApprovalViewProps> = ({
  expenses,
  currentUser,
  policy,
  onUpdatePolicy,
  onApproveExpense,
  onRejectExpense,
  showToast
}) => {
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<CompanyExpense | null>(null);

  // Reject Modal State
  const [rejectingExpense, setRejectingExpense] = useState<CompanyExpense | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Policy Settings Modal State
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyThreshold, setPolicyThreshold] = useState(policy.requireApprovalAbove);
  const [policyPreventSelf, setPolicyPreventSelf] = useState(policy.preventSelfApproval);

  // Filter pending vs recent approved/rejected
  const [approvalTab, setApprovalTab] = useState<'pending' | 'history'>('pending');

  const pendingExpenses = expenses.filter(
    (e) => e.approvalStatus === 'Menunggu Persetujuan'
  );

  const historyExpenses = expenses.filter(
    (e) => e.approvalStatus === 'Disetujui' || e.approvalStatus === 'Ditolak'
  );

  const isAdminOrManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'keuangan' ||
    (currentUser as any)?.role === 'ADMIN' ||
    (currentUser as any)?.role === 'LEADER';

  const handleApprove = (exp: CompanyExpense) => {
    // Check self-approval prevention
    if (policy.preventSelfApproval && exp.picStaffId === currentUser?.id) {
      showToast(
        'Pelanggaran Kebijakan Otorisasi',
        'Kebijakan perusahaan aktif: Anda tidak diperbolehkan menyetujui pengajuan yang Anda buat sendiri. Harap minta persetujuan pimpinan / manager lain.',
        'warning'
      );
      return;
    }

    onApproveExpense(exp);
    showToast('Disetujui', `Pengeluaran ${exp.expenseNumber} berhasil disetujui.`, 'success');
  };

  const handleOpenReject = (exp: CompanyExpense) => {
    setRejectingExpense(exp);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectingExpense) return;
    if (!rejectReason.trim()) {
      showToast('Alasan Diperlukan', 'Harap masukkan alasan penolakan pengeluaran.', 'warning');
      return;
    }

    onRejectExpense(rejectingExpense, rejectReason.trim());
    showToast('Pengeluaran Ditolak', `Transaksi ${rejectingExpense.expenseNumber} ditolak.`, 'info');
    setRejectingExpense(null);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePolicy({
      requireApprovalAbove: Number(policyThreshold) || 0,
      preventSelfApproval: policyPreventSelf
    });
    showToast('Kebijakan Diperbarui', 'Aturan batas otorisasi persetujuan berhasil disimpan.', 'success');
    setIsPolicyModalOpen(false);
  };

  return (
    <div className="space-y-4 text-white">
      {/* Header Banner */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white">Persetujuan Pengeluaran Perusahaan</h3>
              {pendingExpenses.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-zinc-950">
                  {pendingExpenses.length} Menunggu
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              Otorisasi transaksi pengeluaran, pemeriksaan dokumen struk, mitigasi fraud, dan pencegahan self-approval
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdminOrManager && (
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition border border-zinc-700 flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              <span>Aturan Otorisasi</span>
            </button>
          )}
        </div>
      </div>

      {/* Policy Notice Box */}
      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
          <span>
            Batas Otorisasi Pengeluaran: <strong className="text-zinc-200 font-mono">{formatRp(policy.requireApprovalAbove)}</strong>
          </span>
          <span className="text-zinc-600">•</span>
          <span>
            Pencegahan Self-Approval:{' '}
            <strong className={policy.preventSelfApproval ? 'text-emerald-400' : 'text-amber-400'}>
              {policy.preventSelfApproval ? 'AKTIF (Pengaju dilarang approve sendiri)' : 'NONAKTIF'}
            </strong>
          </span>
        </div>

        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setApprovalTab('pending')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              approvalTab === 'pending'
                ? 'bg-orange-500 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Menunggu Persetujuan ({pendingExpenses.length})
          </button>
          <button
            onClick={() => setApprovalTab('history')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              approvalTab === 'history'
                ? 'bg-orange-500 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Riwayat Otorisasi ({historyExpenses.length})
          </button>
        </div>
      </div>

      {/* Main List */}
      {approvalTab === 'pending' ? (
        <div className="space-y-3">
          {pendingExpenses.length > 0 ? (
            pendingExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-zinc-950 text-orange-400 px-2.5 py-1 rounded-lg border border-zinc-800">
                      {exp.expenseNumber}
                    </span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs font-semibold text-zinc-300">{exp.branchName}</span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs font-mono text-zinc-400">{exp.date}</span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {exp.categoryName} ({exp.subcategory})
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-base">{exp.name}</h4>

                  <p className="text-xs text-zinc-400 line-clamp-2 max-w-3xl">
                    {exp.description || 'Tidak ada deskripsi detail.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                    <span>
                      Vendor / Penerima: <strong className="text-zinc-200">{exp.vendorOrBeneficiary}</strong>
                    </span>
                    <span>
                      Pengaju (PIC): <strong className="text-zinc-200">{exp.picStaffName}</strong>
                    </span>
                    <span>
                      Metode: <strong className="text-zinc-200">{exp.paymentMethod}</strong> ({exp.sourceAccount})
                    </span>
                    {exp.invoiceRefNumber && (
                      <span className="font-mono text-zinc-400">
                        Invoice: <strong>{exp.invoiceRefNumber}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
                  <div className="text-left lg:text-right">
                    <span className="text-[11px] text-zinc-500 block uppercase">Nominal Pengeluaran</span>
                    <span className="text-xl font-black font-mono text-rose-400">
                      {formatRp(exp.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedExpenseForDetail(exp)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Periksa</span>
                    </button>

                    {isAdminOrManager && (
                      <>
                        <button
                          onClick={() => handleOpenReject(exp)}
                          className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                        <button
                          onClick={() => handleApprove(exp)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
              <p className="font-bold text-white text-base">Semua Pengajuan Telah Ditinjau!</p>
              <p className="text-xs text-zinc-400 mt-1">
                Tidak ada transaksi pengeluaran yang menunggu persetujuan saat ini.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Transaksi</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Cabang</th>
                  <th className="py-3 px-4">Kategori & Uraian</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Penyetuju / Catatan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {historyExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{exp.date}</td>
                    <td className="py-3 px-4">{exp.branchName}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{exp.name}</span>
                      <span className="text-[11px] text-zinc-400">{exp.categoryName}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      {formatRp(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          exp.approvalStatus === 'Disetujui'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {exp.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {exp.approvalStatus === 'Disetujui' ? (
                        <span>Disetujui oleh {exp.approvedByUserName || 'Admin'}</span>
                      ) : (
                        <span className="text-rose-400">Ditolak: {exp.rejectionReason}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedExpenseForDetail(exp)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedExpenseForDetail && (
        <ExpenseDetailModal
          expense={selectedExpenseForDetail}
          onClose={() => setSelectedExpenseForDetail(null)}
          onApprove={handleApprove}
          onReject={handleOpenReject}
          canApprove={isAdminOrManager}
        />
      )}

      {/* Reject Modal */}
      {rejectingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Tolak Pengajuan Pengeluaran</h3>
                <p className="text-xs text-zinc-400 font-mono">{rejectingExpense.expenseNumber}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Pengajuan yang ditolak akan dikembalikan ke pembuat pengajuan dengan alasan yang tercatat pada jejak audit sistem.
            </p>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Alasan Penolakan <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Tuliskan alasan penolakan secara jelas (misal: nota tidak jelas, nominal tidak sesuai memo internal)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setRejectingExpense(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Settings Modal */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-white">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-white">Pengaturan Kebijakan Otorisasi ERP</h3>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">
                  Batas Nominal Wajib Approval (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={policyThreshold}
                    onChange={(e) => setPolicyThreshold(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Transaksi dengan nilai di atas batas ini otomatis membutuhkan persetujuan Manager.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-zinc-200 block">Cegah Persetujuan Mandiri (Self-Approval)</span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Pengguna dilarang menyetujui transaksi pengeluaran yang mereka ajukan sendiri.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={policyPreventSelf}
                  onChange={(e) => setPolicyPreventSelf(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-orange-500 focus:ring-0"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20"
                >
                  Simpan Kebijakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
