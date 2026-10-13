import React, { useRef, useState } from 'react';
import { X, Download, Printer, ShieldCheck, FileText, CheckCircle2, User, Phone, MapPin, Calendar, ZoomIn } from 'lucide-react';
import { Member, User as StaffUser } from '../types';
import { PhotoEnlargeModal } from './common/PhotoEnlargeModal';

interface IdentityCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: (Member | StaffUser) | null;
  type: 'member' | 'staff';
  onEdit?: (person: Member | StaffUser) => void;
}

export const IdentityCardModal: React.FC<IdentityCardModalProps> = ({
  isOpen,
  onClose,
  person,
  type,
  onEdit
}) => {
  const cardPrintRef = useRef<HTMLDivElement | null>(null);
  const [isPhotoEnlarged, setIsPhotoEnlarged] = useState(false);

  if (!isOpen || !person) return null;

  const isStaff = type === 'staff' || 'role' in person;
  const idType = person.idType || 'KTP';
  const idNumber = person.idNumber || '-';
  const address = person.address || 'Alamat belum dilengkapi';
  const birthDate = person.birthDate || '-';
  const idPhoto = person.idPhoto;
  const activePhotoUrl = idPhoto || person.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!cardPrintRef.current || !window.html2canvas) {
      window.print();
      return;
    }
    window.html2canvas(cardPrintRef.current, { scale: 2.5, backgroundColor: '#09090b' }).then((canvas: HTMLCanvasElement) => {
      const link = document.createElement('a');
      link.download = `Identitas_${idType}_${person.id}_${person.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Kartu Identitas Resmi ({idType})
              </h3>
              <p className="text-[11px] text-zinc-400">
                {isStaff ? 'Arsip Identitas Karyawan / Staf' : 'Dokumen Verifikasi Member Gym'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
          {/* Printable / Visual ID Card Container */}
          <div
            ref={cardPrintRef}
            className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-zinc-700/80 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden"
          >
            {/* Watermark / Badge */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-orange-500 text-zinc-950 font-black text-xs uppercase tracking-wider">
                  {idType}
                </span>
                <span className="text-xs font-mono font-bold text-zinc-300 tracking-wider">
                  {idNumber}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
              </div>
            </div>

            {/* Content: Photo + Details */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* Profile / ID Card Scan Preview */}
              <div className="col-span-1 flex flex-col items-center gap-2">
                <div
                  onClick={() => setIsPhotoEnlarged(true)}
                  className="w-full aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden border-2 border-zinc-700 hover:border-orange-500 bg-zinc-950 relative group shadow-md cursor-pointer transition-all duration-200"
                  title="Klik untuk memperbesar foto / dokumen identitas"
                >
                  <img
                    src={activePhotoUrl}
                    alt={person.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Hover Overlay with Zoom Icon */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white backdrop-blur-[2px]">
                    <div className="w-8 h-8 rounded-full bg-orange-500/80 flex items-center justify-center shadow-lg">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wide drop-shadow">Perbesar Foto</span>
                  </div>

                  {idPhoto && (
                    <span className="absolute bottom-1 right-1 text-[9px] bg-black/75 backdrop-blur-xs text-white px-1.5 py-0.5 rounded font-mono group-hover:hidden">
                      Scan Lampiran
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhotoEnlarged(true)}
                  className="w-full py-1 px-2 rounded-lg bg-zinc-800/80 hover:bg-orange-500/20 text-zinc-300 hover:text-orange-400 border border-zinc-700/60 text-[10px] font-bold transition flex items-center justify-center gap-1"
                >
                  <ZoomIn className="w-3 h-3 text-orange-400" /> Perbesar Foto
                </button>
                <div className="text-center">
                  <p className="text-[11px] font-mono text-zinc-400 font-bold">ID: {person.id}</p>
                  <p className="text-[10px] text-orange-400 font-semibold">
                    {isStaff ? (person as StaffUser).roleName : 'Member RFA GYM'}
                  </p>
                </div>
              </div>

              {/* Data Table */}
              <div className="col-span-1 sm:col-span-2 space-y-2.5 text-xs">
                <div className="grid grid-cols-3 border-b border-zinc-800/80 pb-1.5">
                  <span className="text-zinc-400 font-medium col-span-1">Nama Lengkap:</span>
                  <span className="font-bold text-white col-span-2 uppercase">{person.name}</span>
                </div>

                <div className="grid grid-cols-3 border-b border-zinc-800/80 pb-1.5">
                  <span className="text-zinc-400 font-medium col-span-1">No. {idType}:</span>
                  <span className="font-mono font-bold text-orange-400 col-span-2 tracking-wide">
                    {idNumber}
                  </span>
                </div>

                <div className="grid grid-cols-3 border-b border-zinc-800/80 pb-1.5">
                  <span className="text-zinc-400 font-medium col-span-1">Jenis Kelamin:</span>
                  <span className="text-zinc-200 col-span-2 font-medium">
                    {person.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                  </span>
                </div>

                {birthDate && birthDate !== '-' && (
                  <div className="grid grid-cols-3 border-b border-zinc-800/80 pb-1.5">
                    <span className="text-zinc-400 font-medium col-span-1">Tgl Lahir:</span>
                    <span className="text-zinc-200 col-span-2 font-medium">{birthDate}</span>
                  </div>
                )}

                <div className="grid grid-cols-3 border-b border-zinc-800/80 pb-1.5">
                  <span className="text-zinc-400 font-medium col-span-1">No. Telepon:</span>
                  <span className="text-zinc-200 col-span-2 font-medium">{person.phone || '-'}</span>
                </div>

                <div className="grid grid-cols-3 border-b border-zinc-800/80 pb-1.5">
                  <span className="text-zinc-400 font-medium col-span-1">Alamat Domisili:</span>
                  <span className="text-zinc-300 col-span-2 text-[11px] leading-relaxed">
                    {address}
                  </span>
                </div>

                {person.emergencyContact && (
                  <div className="grid grid-cols-3 pb-1">
                    <span className="text-zinc-400 font-medium col-span-1">Kontak Darurat:</span>
                    <span className="text-zinc-300 col-span-2 text-[11px]">
                      {person.emergencyContact}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Scan Image Full Width View if Available */}
            {idPhoto && (
              <div className="mt-4 pt-3.5 border-t border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Lampiran Berkas Fisik ({idType}):
                </span>
                <div className="w-full max-h-48 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center">
                  <img
                    src={idPhoto}
                    alt={`Lampiran ${idType}`}
                    className="w-full h-full object-contain max-h-48"
                  />
                </div>
              </div>
            )}
          </div>

          {!person.idNumber && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between">
              <span>Nomor identitas ({idType}) belum diisi lengkap.</span>
              {onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(person);
                  }}
                  className="px-2.5 py-1 bg-amber-500 text-zinc-950 rounded-lg font-bold text-[11px] hover:bg-amber-400"
                >
                  Input Sekarang
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3">
          {onEdit ? (
            <button
              onClick={() => {
                onClose();
                onEdit(person);
              }}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-orange-400" /> Edit Kartu Identitas
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Dokumen
            </button>
          </div>
        </div>
      </div>

      {/* Enlarged Photo Lightbox Modal */}
      <PhotoEnlargeModal
        isOpen={isPhotoEnlarged}
        onClose={() => setIsPhotoEnlarged(false)}
        imageUrl={activePhotoUrl}
        name={person.name}
        id={person.id}
        roleOrType={isStaff ? (person as StaffUser).roleName : `${idType}: ${idNumber}`}
        subInfo={address}
        badgeType={idPhoto ? 'document' : isStaff ? 'staff' : 'member'}
      />
    </div>
  );
};
