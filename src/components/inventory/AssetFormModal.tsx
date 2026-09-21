import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Dumbbell,
  Wrench,
  Camera,
  Calendar,
  DollarSign,
  Tag,
  Building2,
  MapPin,
  ShieldCheck,
  UserCheck,
  FileText
} from 'lucide-react';
import {
  GymAsset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  MaintenanceScheduleType
} from '../../types';
import { GYM_LOCATIONS } from '../../data/inventoryData';
import { APP_TODAY } from '../../utils/formatters';

interface AssetFormModalProps {
  assetToEdit?: GymAsset | null;
  onSave: (asset: GymAsset, isNew: boolean) => void;
  onClose: () => void;
}

const PRESET_CATEGORIES: AssetCategory[] = [
  'Cardio',
  'Strength',
  'Free Weight',
  'Machine',
  'Bench',
  'Cable Machine',
  'Functional Training',
  'Equipment',
  'Elektronik',
  'Furniture',
  'Lainnya'
];

const PRESET_CONDITIONS: AssetCondition[] = [
  'Baru',
  'Baik',
  'Cukup',
  'Rusak Ringan',
  'Rusak Berat',
  'Tidak Layak Pakai'
];

const PRESET_STATUSES: AssetStatus[] = [
  'Aktif',
  'Maintenance',
  'Rusak',
  'Tidak Digunakan',
  'Dipindahkan',
  'Dijual',
  'Dihapus'
];

const PRESET_SCHEDULES: MaintenanceScheduleType[] = [
  'Harian',
  'Mingguan',
  'Bulanan',
  '3 Bulanan',
  '6 Bulanan',
  'Tahunan',
  'Custom'
];

const PHOTO_PRESETS = [
  { label: 'Treadmill Commercial', url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&auto=format&fit=crop&q=60' },
  { label: 'Elliptical Cross', url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=60' },
  { label: 'Cable Machine Tower', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=60' },
  { label: 'Chest Press Machine', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=60' },
  { label: 'Rowing Machine Concept', url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=60' },
  { label: 'Bench Press & Barbell', url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=60' },
  { label: 'Dumbbell Set & Rack', url: 'https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=600&auto=format&fit=crop&q=60' },
  { label: 'Indoor Cycling Bike', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=60' },
  { label: 'InBody Medical Analyzer', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=60' }
];

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  assetToEdit,
  onSave,
  onClose
}) => {
  const isNew = !assetToEdit;

  const [formData, setFormData] = useState<GymAsset>({
    id: assetToEdit?.id || 'AST-' + String(Math.floor(100 + Math.random() * 900)),
    assetCode: assetToEdit?.assetCode || '',
    name: assetToEdit?.name || '',
    category: assetToEdit?.category || 'Cardio',
    brand: assetToEdit?.brand || '',
    model: assetToEdit?.model || '',
    serialNumber: assetToEdit?.serialNumber || '',
    purchaseYear: assetToEdit?.purchaseYear || new Date().getFullYear(),
    purchaseDate: assetToEdit?.purchaseDate || APP_TODAY,
    supplier: assetToEdit?.supplier || 'PT Prima Fit Nusantara',
    purchasePrice: assetToEdit?.purchasePrice || 0,
    warranty: assetToEdit?.warranty || '1 Tahun Garansi Resmi',
    warrantyStart: assetToEdit?.warrantyStart || APP_TODAY,
    warrantyEnd: assetToEdit?.warrantyEnd || '',
    location: assetToEdit?.location || GYM_LOCATIONS[0],
    photo: assetToEdit?.photo || PHOTO_PRESETS[0].url,
    condition: assetToEdit?.condition || 'Baru',
    status: assetToEdit?.status || 'Aktif',
    responsiblePerson: assetToEdit?.responsiblePerson || 'Andi Saputra (Lead Tech)',
    notes: assetToEdit?.notes || '',
    maintenanceSchedule: assetToEdit?.maintenanceSchedule || 'Bulanan',
    nextMaintenanceDate: assetToEdit?.nextMaintenanceDate || ''
  });

  // Calculate default warranty end date (1 year ahead) if empty
  useEffect(() => {
    if (!formData.warrantyEnd && formData.warrantyStart) {
      try {
        const start = new Date(formData.warrantyStart);
        start.setFullYear(start.getFullYear() + 1);
        const y = start.getFullYear();
        const m = String(start.getMonth() + 1).padStart(2, '0');
        const d = String(start.getDate()).padStart(2, '0');
        setFormData((prev) => ({ ...prev, warrantyEnd: `${y}-${m}-${d}` }));
      } catch {}
    }
  }, [formData.warrantyStart]);

  // Generate asset code suggestion if empty
  useEffect(() => {
    if (isNew && !formData.assetCode && formData.category) {
      const prefix =
        formData.category === 'Cardio'
          ? 'CRD'
          : formData.category === 'Strength'
          ? 'STR'
          : formData.category === 'Free Weight'
          ? 'FWT'
          : formData.category === 'Cable Machine'
          ? 'CBL'
          : formData.category === 'Bench'
          ? 'BNC'
          : 'EQP';
      const num = Math.floor(10 + Math.random() * 90);
      setFormData((prev) => ({ ...prev, assetCode: `${prefix}-${num}` }));
    }
  }, [formData.category, isNew]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (field: keyof GymAsset, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!formData.name.trim() || !formData.assetCode.trim()) {
      setErrorMsg('Nama alat dan Kode asset wajib diisi!');
      return;
    }
    onSave(formData, isNew);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {isNew ? 'Tambah Alat Gym Baru' : `Edit Alat: ${formData.name}`}
              </h2>
              <p className="text-xs text-zinc-400">
                {isNew
                  ? 'Catat spesifikasi teknis, harga beli, lokasi, dan jadwal pemeliharaan alat'
                  : `ID: ${formData.id} • Kode: ${formData.assetCode}`}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
              {errorMsg}
            </div>
          )}
          {/* Section 1: Identitas & Klasifikasi */}
          <div>
            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Tag className="w-4 h-4" /> 1. Identitas & Klasifikasi Alat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  ID Inventaris <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => handleChange('id', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Kode Asset <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.assetCode}
                  onChange={(e) => handleChange('assetCode', e.target.value)}
                  placeholder="Misal: TM-CRD-01"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Kategori Alat <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value as AssetCategory)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Nama Alat <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Contoh: Technogym Run Excite Live 9000"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Brand / Merk
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="Technogym, Life Fitness, Ziva..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Tipe / Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="Excite Live 9000 Commercial"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Serial Number (SN)
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  placeholder="SN-TG-2024-88391"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Penanggung Jawab (PIC)
                </label>
                <input
                  type="text"
                  value={formData.responsiblePerson}
                  onChange={(e) => handleChange('responsiblePerson', e.target.value)}
                  placeholder="Nama staf teknisi atau leader"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pembelian, Biaya & Garansi */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> 2. Pembelian, Biaya & Garansi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Harga Pembelian (Rp) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.purchasePrice || ''}
                  onChange={(e) => handleChange('purchasePrice', Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Tanggal Pembelian
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange('purchaseDate', val);
                    if (val) {
                      const yr = new Date(val).getFullYear();
                      handleChange('purchaseYear', yr);
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Tahun Pembelian
                </label>
                <input
                  type="number"
                  value={formData.purchaseYear || ''}
                  onChange={(e) => handleChange('purchaseYear', Number(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Supplier / Vendor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                  placeholder="PT Prima Fit Nusantara"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Keterangan Garansi
                </label>
                <input
                  type="text"
                  value={formData.warranty}
                  onChange={(e) => handleChange('warranty', e.target.value)}
                  placeholder="2 Tahun Garansi Resmi Sparepart"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Garansi Mulai
                  </label>
                  <input
                    type="date"
                    value={formData.warrantyStart}
                    onChange={(e) => handleChange('warrantyStart', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Garansi Berakhir
                  </label>
                  <input
                    type="date"
                    value={formData.warrantyEnd}
                    onChange={(e) => handleChange('warrantyEnd', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Kondisi, Status, Lokasi & Jadwal */}
          <div>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> 3. Kondisi, Status & Jadwal Pemeliharaan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Kondisi Fisik Alat
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => handleChange('condition', e.target.value as AssetCondition)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {PRESET_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Status Operasional
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as AssetStatus)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {PRESET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Lokasi Alat
                </label>
                <input
                  type="text"
                  list="locations-list"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <datalist id="locations-list">
                  {GYM_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Jadwal Preventive Maintenance
                </label>
                <select
                  value={formData.maintenanceSchedule}
                  onChange={(e) => handleChange('maintenanceSchedule', e.target.value as MaintenanceScheduleType)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {PRESET_SCHEDULES.map((sch) => (
                    <option key={sch} value={sch}>
                      {sch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Maintenance Berikutnya
                </label>
                <input
                  type="date"
                  value={formData.nextMaintenanceDate || ''}
                  onChange={(e) => handleChange('nextMaintenanceDate', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Foto Alat (URL)
                </label>
                <input
                  type="text"
                  value={formData.photo || ''}
                  onChange={(e) => handleChange('photo', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick Presets for Photo */}
            <div className="mt-3">
              <span className="text-[11px] text-zinc-400 block mb-1 font-semibold">
                Pilih Preset Foto Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PHOTO_PRESETS.map((p, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleChange('photo', p.url)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                      formData.photo === p.url
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Keterangan & Catatan Tambahan
              </label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Catatan khusus, instruksi pelumasan, panduan operasional..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              {isNew ? 'Simpan Asset Baru' : 'Perbarui Data Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
