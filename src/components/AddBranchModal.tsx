import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Tag,
  Image as ImageIcon
} from 'lucide-react';
import { GymBranch } from '../types';

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (branchData: Omit<GymBranch, 'id' | 'createdAt'> & { id?: string }) => void;
  initialData?: GymBranch | null;
}

const PRESET_PHOTOS = [
  {
    label: 'Modern Fitness Center',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80'
  },
  {
    label: 'Boutique Lifestyle Studio',
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80'
  },
  {
    label: 'Urban Functional Gym',
    url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&auto=format&fit=crop&q=80'
  },
  {
    label: 'Olympic Strength Zone',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80'
  }
];

const PRESET_FACILITIES = [
  'Locker Room & Sauna',
  'Free Weights & Olympic Racks',
  'Cardio Theater',
  'Studio Aerobik/Zumba',
  'Juice & Protein Bar',
  'Private PT Studio',
  'Hammer Strength Equipment',
  'Pilates & Yoga Studio',
  'Recovery Cold Plunge',
  'Powerlifting Platform'
];

export const AddBranchModal: React.FC<AddBranchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [openHoursWeekday, setOpenHoursWeekday] = useState('06:00 - 22:00 WIB');
  const [openHoursWeekend, setOpenHoursWeekend] = useState('07:00 - 20:00 WIB');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif' | 'Renovasi'>('Aktif');
  const [isMainBranch, setIsMainBranch] = useState(false);
  const [capacity, setCapacity] = useState<number>(150);
  const [facilities, setFacilities] = useState<string[]>([
    'Locker Room & Sauna',
    'Free Weights & Olympic Racks',
    'Cardio Theater'
  ]);
  const [customFacility, setCustomFacility] = useState('');
  const [photo, setPhoto] = useState(PRESET_PHOTOS[0].url);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCode(initialData.code || '');
      setAddress(initialData.address || '');
      setCity(initialData.city || '');
      setPhone(initialData.phone || '');
      setWhatsapp(initialData.whatsapp || '');
      setEmail(initialData.email || '');
      setManagerName(initialData.managerName || '');
      setManagerPhone(initialData.managerPhone || '');
      setOpenHoursWeekday(initialData.openHoursWeekday || '06:00 - 22:00 WIB');
      setOpenHoursWeekend(initialData.openHoursWeekend || '07:00 - 20:00 WIB');
      setStatus(initialData.status || 'Aktif');
      setIsMainBranch(Boolean(initialData.isMainBranch));
      setCapacity(initialData.capacity || 150);
      setFacilities(initialData.facilities || []);
      setPhoto(initialData.photo || PRESET_PHOTOS[0].url);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setCode('');
      setAddress('');
      setCity('DKI Jakarta');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setManagerName('');
      setManagerPhone('');
      setOpenHoursWeekday('06:00 - 22:00 WIB');
      setOpenHoursWeekend('07:00 - 20:00 WIB');
      setStatus('Aktif');
      setIsMainBranch(false);
      setCapacity(150);
      setFacilities([
        'Locker Room & Sauna',
        'Free Weights & Olympic Racks',
        'Cardio Theater'
      ]);
      setPhoto(PRESET_PHOTOS[0].url);
      setNotes('');
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const toggleFacility = (item: string) => {
    if (facilities.includes(item)) {
      setFacilities(facilities.filter((f) => f !== item));
    } else {
      setFacilities([...facilities, item]);
    }
  };

  const handleAddCustomFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFacility.trim() && !facilities.includes(customFacility.trim())) {
      setFacilities([...facilities, customFacility.trim()]);
      setCustomFacility('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama cabang wajib diisi.');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('Kode cabang wajib diisi (contoh: SDR, KGD, BKS).');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Alamat cabang wajib diisi.');
      return;
    }

    onSave({
      id: initialData?.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim(),
      city: city.trim() || 'DKI Jakarta',
      phone: phone.trim() || '(021) 500-GYM',
      whatsapp: whatsapp.trim() || phone.trim() || '0812-0000-0000',
      email: email.trim() || 'cabang@gympro.id',
      managerName: managerName.trim() || undefined,
      managerPhone: managerPhone.trim() || undefined,
      openHoursWeekday: openHoursWeekday.trim(),
      openHoursWeekend: openHoursWeekend.trim(),
      status,
      isMainBranch,
      facilities,
      capacity: Number(capacity) || 100,
      photo,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-2xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{initialData ? 'Ubah Informasi Cabang' : 'Tambah Cabang Baru'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Multi-Outlet
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Lengkapi identitas operasional, alamat, fasilitas, dan PIC cabang gym.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Identitas & Kode Cabang */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Identitas & Status Cabang</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-zinc-300 font-bold">Nama Cabang / Outlet: *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: GymPro Hub Senopati Lifestyle"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold">Kode Singkat (2-4 Huruf): *</label>
                <input
                  type="text"
                  value={code}
                  maxLength={5}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SNP / KGD"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold">Status Operasional:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Aktif">🟢 Aktif (Operasional Penuh)</option>
                  <option value="Renovasi">🟡 Renovasi / Grand Opening Segera</option>
                  <option value="Nonaktif">🔴 Nonaktif (Sementara Tutup)</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer w-full hover:border-zinc-700 transition">
                  <input
                    type="checkbox"
                    checked={isMainBranch}
                    onChange={(e) => setIsMainBranch(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded bg-zinc-900 border-zinc-700 focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-white block">Tandai Cabang Utama (HQ)</span>
                    <span className="text-[10px] text-zinc-500">
                      Sebagai referensi kantor pusat resmi
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Lokasi & Kontak */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>2. Lokasi & Kontak Operasional</span>
            </h4>

            <div className="space-y-1.5">
              <label className="text-zinc-300 font-bold">Alamat Lengkap Cabang: *</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Jl. Boulevard Artha Gading Blok A-3 No. 88, Kelapa Gading"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold">Kota / Wilayah:</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Jakarta Selatan 12190"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold">No. Telepon Kantor:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(021) 7234-8899"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold">WhatsApp Resmi:</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="0812-9876-5432"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 font-bold">Email Resmi Cabang:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="senopati@gympro.id"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section 3: Branch Manager & Jam Operasional */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>3. PIC & Jam Kerja</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold">Nama Branch Manager / PIC:</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Contoh: Jessica Anastasia, CPT"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold">Kontak HP Manager:</label>
                <input
                  type="text"
                  value={managerPhone}
                  onChange={(e) => setManagerPhone(e.target.value)}
                  placeholder="0812-3344-5566"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold">Jam Buka Hari Kerja (Senin - Jumat):</label>
                <input
                  type="text"
                  value={openHoursWeekday}
                  onChange={(e) => setOpenHoursWeekday(e.target.value)}
                  placeholder="06:00 - 22:00 WIB"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold">Jam Buka Akhir Pekan (Sabtu - Minggu):</label>
                <input
                  type="text"
                  value={openHoursWeekend}
                  onChange={(e) => setOpenHoursWeekend(e.target.value)}
                  placeholder="07:00 - 20:00 WIB"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Kapasitas & Fasilitas */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>4. Fasilitas & Kapasitas Member</span>
            </h4>

            <div className="space-y-1.5">
              <label className="text-zinc-300 font-bold">Kapasitas Member Simultan (Orang):</label>
              <input
                type="number"
                value={capacity}
                min={10}
                max={5000}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-300 font-bold">Pilih Fasilitas yang Tersedia:</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_FACILITIES.map((item) => {
                  const isChecked = facilities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleFacility(item)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Facility input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customFacility}
                  onChange={(e) => setCustomFacility(e.target.value)}
                  placeholder="Tambah fasilitas kustom (contoh: Olympic Pool, Juice Bar)..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomFacility}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition cursor-pointer text-xs shrink-0"
                >
                  + Tambah
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Foto Cover Cabang */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
              <span>5. Foto Banner Cabang</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_PHOTOS.map((preset, idx) => {
                const isSelected = photo === preset.url;
                return (
                  <div
                    key={idx}
                    onClick={() => setPhoto(preset.url)}
                    className={`rounded-2xl border overflow-hidden cursor-pointer relative group transition ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-16 object-cover group-hover:scale-105 transition"
                    />
                    <div className="p-1.5 bg-zinc-950 text-center text-[10px] truncate text-zinc-300">
                      {preset.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-400 text-[11px]">Atau masukkan URL Foto Kustom:</label>
              <input
                type="text"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-mono placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section 6: Catatan Tambahan */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800">
            <label className="text-zinc-300 font-bold">Catatan Operasional (Opsional):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Gedung parkir luas, akses member 24 jam dengan RFID gate"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialData ? 'Simpan Perubahan Cabang' : 'Buat Cabang Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
