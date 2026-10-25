import React from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface ResponsiveTableContainerProps {
  children: React.ReactNode;
  /** Optional custom hint text for mobile users */
  mobileHint?: string;
  /** Show the mobile swipe badge (default: true) */
  showSwipeHint?: boolean;
  /** Additional container classes */
  className?: string;
  /** Optional header element inside container above table */
  headerContent?: React.ReactNode;
  /** Optional footer or pagination inside container */
  footerContent?: React.ReactNode;
}

/**
 * ResponsiveTableContainer:
 * A standardized, accessible wrapper for backoffice tabular data.
 * - Handles smooth momentum horizontal scroll on mobile & tablet without page blowout.
 * - Displays an unobtrusive visual swipe cue on small screens (< 768px).
 * - Maintains aesthetic dark theme integrity (zinc-950/zinc-900 border and subtle backdrop).
 */
export const ResponsiveTableContainer: React.FC<ResponsiveTableContainerProps> = ({
  children,
  mobileHint = 'Geser tabel untuk melihat kolom lengkap',
  showSwipeHint = true,
  className = '',
  headerContent,
  footerContent
}) => {
  return (
    <div className={`w-full max-w-full bg-zinc-900/90 border border-zinc-800/90 rounded-2xl sm:rounded-3xl shadow-md overflow-hidden flex flex-col ${className}`}>
      {headerContent}

      {showSwipeHint && (
        <div className="md:hidden flex items-center justify-between px-3.5 py-1.5 bg-zinc-950/70 border-b border-zinc-800/80 text-[10px] text-zinc-400 select-none">
          <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
            <ArrowLeftRight className="w-3 h-3 text-orange-400 animate-pulse" />
            <span>{mobileHint}</span>
          </span>
          <span className="text-[9px] text-zinc-500 font-mono">Horizontal Scroll</span>
        </div>
      )}

      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent -webkit-overflow-scrolling-touch">
        {children}
      </div>

      {footerContent}
    </div>
  );
};
