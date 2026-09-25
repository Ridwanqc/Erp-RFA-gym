import React from 'react';
import { X } from 'lucide-react';
import { LockerSlot, Member, Attendance } from '../types';
import { LockerManagementView } from './LockerManagementView';

interface LockerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockers: LockerSlot[];
  onUpdateLockers: React.Dispatch<React.SetStateAction<LockerSlot[]>>;
  members: Member[];
  attendances?: Attendance[];
  onAddAttendance?: (att: Attendance, member?: Member) => void;
  onCheckoutMember?: (attId: string) => void;
  onReleaseLocker?: (lockerNum: number) => void;
  onSwapLocker?: (oldNum: number, newNum: number) => void;
  showToast: (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const LockerManagementModal: React.FC<LockerManagementModalProps> = ({
  isOpen,
  onClose,
  lockers,
  onUpdateLockers,
  members,
  attendances,
  onAddAttendance,
  onCheckoutMember,
  onReleaseLocker,
  onSwapLocker,
  showToast
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in-50 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Pusat Pengaturan & Input Loker Fisik
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-zinc-800">
          <LockerManagementView
            lockers={lockers}
            onUpdateLockers={onUpdateLockers}
            members={members}
            attendances={attendances}
            onAddAttendance={onAddAttendance}
            onCheckoutMember={onCheckoutMember}
            onReleaseLocker={onReleaseLocker}
            onSwapLocker={onSwapLocker}
            showToast={showToast}
            isModal={true}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
