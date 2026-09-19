import React from 'react';

interface RymGazelleIconProps {
  size?: number;
  className?: string;
  variant?: 'brand' | 'gold' | 'twilight' | 'orange' | 'monochrome' | 'badge' | 'light';
}

export const RymGazelleIcon: React.FC<RymGazelleIconProps> = ({
  size = 24,
  className = '',
  variant = 'brand',
}) => {
  if (variant === 'badge') {
    return (
      <div
        className={`rounded-full bg-linear-to-br from-[#E5A34C] via-[#D9943B] to-[#B8731E] flex items-center justify-center shadow-xs ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: size * 0.68, height: size * 0.68 }}
          className="text-[#071E26]"
          aria-label="Logo RYM Gazelle"
        >
          {/* Outer circle & gazelle head silhouette */}
          <path
            d="M 18 20 L 72 49 L 62 59 C 67 74 64 85 52 92 C 76 88 92 72 92 50 C 92 28 76 12 52 12 C 43 12 37 19 34 28"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Ear loop */}
          <path
            d="M 31 29 C 20 40 14 55 20 67 C 25 76 36 70 42 52 C 45 44 46 38 46 35"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  const strokeColor =
    variant === 'monochrome'
      ? 'currentColor'
      : variant === 'light'
      ? '#FFFFFF'
      : variant === 'twilight'
      ? '#071E26'
      : variant === 'orange'
      ? 'url(#gazelleOrangeGrad)'
      : 'url(#rymSchemaGoldGrad)';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size }}
      className={`shrink-0 ${className}`}
      aria-label="Logo RYM Gazelle"
    >
      <defs>
        {/* App Primary Schema: Dune Gold Brand Palette */}
        <linearGradient id="rymSchemaGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5A742" />
          <stop offset="50%" stopColor="#D9943B" />
          <stop offset="100%" stopColor="#B8731E" />
        </linearGradient>
        {/* Legacy Orange for fallback if needed */}
        <linearGradient id="gazelleOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5622E" />
          <stop offset="60%" stopColor="#F05524" />
          <stop offset="100%" stopColor="#D94315" />
        </linearGradient>
      </defs>

      {/* Outer circle, sweeping horn, bridge of snout, chin & neck curve */}
      <path
        d="M 18 20 L 72 49 L 62 59 C 67 74 64 85 52 92 C 76 88 92 72 92 50 C 92 28 76 12 52 12 C 43 12 37 19 34 28"
        stroke={strokeColor}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ear loop */}
      <path
        d="M 31 29 C 20 40 14 55 20 67 C 25 76 36 70 42 52 C 45 44 46 38 46 35"
        stroke={strokeColor}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
