import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Store, Utensils, ShoppingBag, User, Image as ImageIcon } from 'lucide-react';
import { toWebPUrl, getWebPSrcSet } from '../../utils/imageUtils';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  placeholderType?: 'store' | 'food' | 'grocery' | 'avatar' | 'generic';
  targetWidth?: number;
  responsiveWidths?: number[];
  priority?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = React.memo(({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  placeholderType = 'generic',
  targetWidth,
  responsiveWidths,
  priority = false,
  loading,
  decoding = 'async',
  referrerPolicy = 'no-referrer',
  ...restProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset loading & error state if src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Lazy loading via IntersectionObserver
  useEffect(() => {
    if (priority || isInView) return;

    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '250px 0px', // Pre-fetch slightly before appearing in viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, isInView]);

  // Derive optimal WebP sources
  const webpUrl = useMemo(() => toWebPUrl(src, targetWidth), [src, targetWidth]);
  const webpSrcSet = useMemo(
    () => (responsiveWidths ? getWebPSrcSet(src, responsiveWidths) : undefined),
    [src, responsiveWidths]
  );

  // Icon for placeholder & error state
  const renderIcon = () => {
    const iconProps = { size: 16, className: 'text-zinc-300 transition-opacity' };
    switch (placeholderType) {
      case 'store':
        return <Store {...iconProps} />;
      case 'food':
        return <Utensils {...iconProps} />;
      case 'grocery':
        return <ShoppingBag {...iconProps} />;
      case 'avatar':
        return <User {...iconProps} />;
      default:
        return <ImageIcon {...iconProps} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full h-full ${containerClassName}`}
    >
      {/* Animated Shimmer / Pulse Placeholder */}
      {(!isLoaded || hasError) && (
        <div
          className={`absolute inset-0 z-0 flex items-center justify-center bg-neutral-100/90 transition-opacity duration-300 ${
            !hasError ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        >
          {renderIcon()}
        </div>
      )}

      {/* Render Picture & Image once in view */}
      {isInView && !hasError && (
        <picture className="block w-full h-full">
          <source
            type="image/webp"
            srcSet={webpSrcSet || webpUrl}
            sizes={restProps.sizes}
          />
          <img
            src={webpUrl}
            alt={alt}
            loading={priority ? 'eager' : loading || 'lazy'}
            decoding={decoding}
            referrerPolicy={referrerPolicy}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true);
              setIsLoaded(true);
            }}
            className={`w-full h-full object-cover block transition-opacity duration-300 ease-out ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            {...restProps}
          />
        </picture>
      )}

      {/* Error Fallback View */}
      {hasError && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 text-zinc-400 p-1 text-center"
          title={`Image non disponible: ${alt}`}
        >
          {renderIcon()}
          <span className="text-[9px] font-medium mt-1 text-zinc-400 truncate max-w-[90%]">
            {alt || 'Image'}
          </span>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';
