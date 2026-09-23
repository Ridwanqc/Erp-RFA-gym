import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-3 rounded-2xl bg-zinc-900/95 border border-amber-500/40 px-4 py-3 text-xs font-semibold text-amber-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200"
      role="status"
    >
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
        <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-white text-xs">Mode Offline Aktif</p>
        <p className="text-[11px] text-zinc-400 truncate">
          Data tersimpan di cache lokal. Sistem tetap dapat dioperasikan.
        </p>
      </div>
    </div>
  );
};
