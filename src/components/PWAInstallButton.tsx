import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'expanded' | 'sidebar';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstalled, isInstallable, install, openInstallGuide, isGuideOpen, closeInstallGuide } =
    usePWAInstall();

  // If already installed and running in standalone mode, suppress the button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        openInstallGuide();
      }
    } else {
      openInstallGuide();
    }
  };

  return (
    <>
      {variant === 'compact' && (
        <button
          type="button"
          id="btn-install-pwa-compact"
          onClick={handleClick}
          title="Pasang Aplikasi RFA GYM (Android & iOS)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 transition active:scale-95 cursor-pointer shadow-xs ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {variant === 'expanded' && (
        <button
          type="button"
          id="btn-install-pwa-expanded"
          onClick={handleClick}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-md active:scale-98 cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Install Aplikasi (PWA)</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          id="btn-install-pwa-sidebar"
          onClick={handleClick}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition active:scale-98 cursor-pointer ${className}`}
        >
          <Smartphone className="w-4 h-4 shrink-0 text-orange-400" />
          <span className="truncate">Install ke HP / Tablet</span>
        </button>
      )}

      <PWAInstallModal isOpen={isGuideOpen} onClose={closeInstallGuide} />
    </>
  );
};
