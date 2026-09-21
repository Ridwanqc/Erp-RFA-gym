import React, { useState } from 'react';
import { X, ShieldCheck, DollarSign, CheckCircle, Save, Settings2 } from 'lucide-react';
import { ApprovalThresholdConfig } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ApprovalConfigModalProps {
  config: ApprovalThresholdConfig;
  onSaveConfig: (newConfig: ApprovalThresholdConfig) => void;
  onClose: () => void;
}

export const ApprovalConfigModal: React.FC<ApprovalConfigModalProps> = ({
  config,
  onSaveConfig,
  onClose
}) => {
  const [staffMax, setStaffMax] = useState(config.staffMaxAmount);
  const [adminMax, setAdminMax] = useState(config.adminMaxAmount);
  const [managementAbove, setManagementAbove] = useState(config.requireManagementAbove);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      staffMaxAmount: Number(staffMax),
      adminMaxAmount: Number(adminMax),
      requireManagementAbove: Number(managementAbove)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Konfigurasi Ambang Batas Approval Biaya</h2>
              <p className="text-xs text-zinc-400">
                Atur otorisasi berjenjang untuk pengeluaran maintenance & perbaikan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Level 1: Batas Maksimal Auto-Approved / Staff Kasir (Rp)
              </label>
              <input
                type="number"
                value={staffMax}
                onChange={(e) => setStaffMax(Number(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                required
              />
              <span className="text-[11px] text-zinc-400 block mt-1">
                Pengeluaran &le; {formatRp(staffMax)} dapat disetujui langsung oleh Staf / Teknisi.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Level 2: Batas Maksimal Persetujuan Manager (Rp)
              </label>
              <input
                type="number"
                value={adminMax}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  setAdminMax(v);
                  setManagementAbove(v);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                required
              />
              <span className="text-[11px] text-zinc-400 block mt-1">
                Pengeluaran &gt; {formatRp(staffMax)} s/d {formatRp(adminMax)} membutuhkan approval Manager.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Level 3: Wajib Persetujuan Top Management (Rp)
              </label>
              <input
                type="number"
                value={managementAbove}
                onChange={(e) => setManagementAbove(Number(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold font-mono"
                required
              />
              <span className="text-[11px] text-zinc-400 block mt-1">
                Pengeluaran &gt; {formatRp(managementAbove)} wajib disetujui oleh Direksi / Owner Gym.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              Simpan Konfigurasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
