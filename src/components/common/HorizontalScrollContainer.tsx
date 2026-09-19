import React from 'react';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
  step?: number;
  id?: string;
  ariaLabel?: string;
}

export const HorizontalScrollContainer: React.FC<HorizontalScrollContainerProps> = ({
  children,
  className = '',
  wrapperClassName = '',
  step = 260,
  id,
  ariaLabel = 'Liste défilante horizontale',
}) => {
  const { ref, isDragging } = useHorizontalScroll<HTMLDivElement>({ step });

  return (
    <div className={`relative ${wrapperClassName}`}>
      {/* Horizontally Scrollable Container without arrows */}
      <div
        id={id}
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className={`flex overflow-x-auto select-none no-scrollbar touch-pan-x cursor-grab active:cursor-grabbing scroll-smooth overscroll-x-contain ${className} ${
          isDragging ? 'cursor-grabbing pointer-events-none' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};
