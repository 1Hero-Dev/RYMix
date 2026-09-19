/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Media Provider Abstraction Layer
 * V1: WebP Transformation & Unsplash/Cloudinary responsive CDN pipeline
 * V2 Ready: Dedicated S3 / Cloud Storage Bucket with server-side compression
 */

import { toWebPUrl, getWebPSrcSet } from '../utils/imageUtils';

export interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg';
}

export interface MediaProvider {
  readonly providerName: string;
  getOptimizedUrl(originalUrl: string, options?: ImageOptimizationOptions): string;
  getSrcSet(originalUrl: string, widths: number[]): string;
}

export class WebPMediaProvider implements MediaProvider {
  readonly providerName = 'WEBP_RESPONSIVE_V1';

  getOptimizedUrl(originalUrl: string, options?: ImageOptimizationOptions): string {
    return toWebPUrl(originalUrl, options?.width);
  }

  getSrcSet(originalUrl: string, widths: number[]): string {
    return getWebPSrcSet(originalUrl, widths);
  }
}

export class MediaServiceRegistry {
  private static activeProvider: MediaProvider = new WebPMediaProvider();

  public static getProvider(): MediaProvider {
    return this.activeProvider;
  }

  public static setProvider(provider: MediaProvider): void {
    this.activeProvider = provider;
  }
}
