import React, { useState } from 'react';
import { Dumbbell, Sparkles, Building2, Flame, User, Heart } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'gym' | 'program' | 'trainer' | 'facility' | 'tip';
  fallbackText?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackType = 'gym',
  fallbackText,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const renderFallbackIcon = () => {
    switch (fallbackType) {
      case 'program':
        return <Dumbbell className="w-10 h-10 text-orange-400 opacity-80" />;
      case 'trainer':
        return <User className="w-10 h-10 text-amber-400 opacity-80" />;
      case 'facility':
        return <Building2 className="w-10 h-10 text-orange-400 opacity-80" />;
      case 'tip':
        return <Heart className="w-10 h-10 text-rose-400 opacity-80" />;
      case 'gym':
      default:
        return <Flame className="w-10 h-10 text-orange-400 opacity-80" />;
    }
  };

  if (!src || hasError) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
      >
        {/* Subtle geometric grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 shadow-inner">
            {renderFallbackIcon()}
          </div>
          {fallbackText && (
            <span className="text-xs font-semibold text-zinc-300 tracking-wide max-w-[85%] truncate">
              {fallbackText}
            </span>
          )}
          <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500/70">
            RFA GYM ARENA
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
          <Flame className="w-6 h-6 text-zinc-700 animate-bounce" />
        </div>
      )}
      <img
        src={src}
        alt={alt || 'RFA Gym'}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
