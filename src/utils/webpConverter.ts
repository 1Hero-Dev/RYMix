/**
 * WebP Image Converter & Optimizer
 * Converts user-uploaded images (delivery proofs, menu dishes, avatars)
 * into lightweight, high-performance .webp format directly in the browser.
 */

export interface WebPConversionResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  webpSize: number;
  savedPercent: number;
  width: number;
  height: number;
}

export interface WebPConversionOptions {
  quality?: number; // 0.1 to 1.0 (default 0.82)
  maxWidth?: number; // max width in px (default 1600)
  maxHeight?: number; // max height in px (default 1600)
  outputFileName?: string;
}

/**
 * Converts any Image File or Blob to high-efficiency WebP format using client-side Canvas
 */
export async function convertToWebP(
  input: File | Blob,
  options: WebPConversionOptions = {}
): Promise<WebPConversionResult> {
  const {
    quality = 0.82,
    maxWidth = 1600,
    maxHeight = 1600,
    outputFileName,
  } = options;

  const originalSize = input.size;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(input);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down if larger than max dimensions, preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context'));
        return;
      }

      // Smooth downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as WebP format
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('WebP canvas conversion failed'));
            return;
          }

          const webpSize = blob.size;
          const savedPercent = Math.max(0, Math.round(((originalSize - webpSize) / originalSize) * 100));

          const baseName =
            outputFileName ||
            (input instanceof File
              ? input.name.replace(/\.[^/.]+$/, '') + '.webp'
              : `image_${Date.now()}.webp`);

          const webpFile = new File([blob], baseName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          const dataUrl = canvas.toDataURL('image/webp', quality);

          resolve({
            file: webpFile,
            blob,
            dataUrl,
            originalSize,
            webpSize,
            savedPercent,
            width,
            height,
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for WebP conversion'));
    };

    img.src = objectUrl;
  });
}

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
