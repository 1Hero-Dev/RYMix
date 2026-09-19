/**
 * Image Utilities for WebP Conversion & Responsive CDN Optimization
 * 
 * Provides automated transformation of image URLs to modern WebP format
 * and generates responsive width variants to minimize cellular bandwidth
 * consumption across Mila (Wilaya 43).
 */

/**
 * Converts any image URL to a high-efficiency WebP format.
 * Specifically optimizes Google Fife CDN URLs (lh3.googleusercontent.com)
 * by appending or updating the =rw parameter, as well as handling Unsplash
 * and generic CDNs.
 *
 * @param url The raw image URL
 * @param width Optional target resolution width (e.g., 200, 400, 800)
 * @returns WebP-optimized URL string
 */
export function toWebPUrl(url: string | undefined | null, width?: number): string {
  if (!url) return '';

  const trimmedUrl = url.trim();

  // If already SVG or base64 data URL or local blob, leave intact
  if (
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('blob:') ||
    trimmedUrl.endsWith('.svg')
  ) {
    return trimmedUrl;
  }

  // Google UserContent / Google Photos / Aida Fife CDN URLs
  if (trimmedUrl.includes('googleusercontent.com')) {
    // Strip existing = options from the end of the URL
    const baseUrl = trimmedUrl.split('=')[0];

    // If a width is specified, deliver both target size and WebP compression
    if (width && width > 0) {
      return `${baseUrl}=w${Math.round(width)}-rw`;
    }
    // Default high-efficiency WebP
    return `${baseUrl}=rw`;
  }

  // Unsplash CDN image formatting
  if (trimmedUrl.includes('images.unsplash.com')) {
    const hasQuery = trimmedUrl.includes('?');
    const separator = hasQuery ? '&' : '?';
    const cleanUrl = trimmedUrl
      .replace(/[?&]auto=format/g, '')
      .replace(/[?&]fm=[^&]+/g, '')
      .replace(/[?&]w=\d+/g, '');
    const widthParam = width && width > 0 ? `&w=${Math.round(width)}` : '';
    return `${cleanUrl}${separator}fm=webp&auto=format&q=80${widthParam}`;
  }

  // If the URL already ends with .webp or contains .webp?, return as is
  if (trimmedUrl.includes('.webp')) {
    return trimmedUrl;
  }

  return trimmedUrl;
}

/**
 * Generates an optimized WebP srcSet for responsive retina / high-DPI displays.
 *
 * @param url Base image URL
 * @param widths Array of desired display widths, e.g. [150, 300, 600]
 * @returns srcSet string
 */
export function getWebPSrcSet(url: string | undefined | null, widths: number[] = [200, 400, 800]): string {
  if (!url) return '';
  if (!url.includes('googleusercontent.com') && !url.includes('images.unsplash.com')) {
    return toWebPUrl(url);
  }

  return widths
    .map((w) => `${toWebPUrl(url, w)} ${w}w`)
    .join(', ');
}
