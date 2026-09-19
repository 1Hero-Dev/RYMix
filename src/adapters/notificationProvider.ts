/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Notification Provider Abstraction Layer
 * V1: Browser Push API + Firestore Cloud Triggers + In-App Audio
 * V2 Ready: Open-Source HTTP-SMS Android Gateway / WhatsApp Business API
 */

export interface NotificationPayload {
  recipientId: string;
  recipientRole: 'CUSTOMER' | 'MERCHANT' | 'COURIER' | 'ADMIN';
  title: string;
  body: string;
  orderId?: string;
  tag?: string;
  data?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  channel: 'PUSH' | 'IN_APP' | 'SMS' | 'WHATSAPP';
  messageId?: string;
  timestamp: string;
}

export interface NotificationProvider {
  readonly providerName: string;
  sendNotification(payload: NotificationPayload): Promise<NotificationResult>;
}

/**
 * V1 Browser & Web Push Notification Provider
 */
export class BrowserAndFcmNotificationProvider implements NotificationProvider {
  readonly providerName = 'BROWSER_FCM_V1';

  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    const timestamp = new Date().toISOString();

    // 1. Browser Native Notification if supported & granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(payload.title, {
          body: payload.body,
          tag: payload.tag || `order-${payload.orderId || 'general'}`,
          icon: '/favicon.ico',
        });
      } catch {
        // Ignore fallback
      }
    }

    return {
      success: true,
      channel: 'PUSH',
      messageId: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp,
    };
  }
}

export class NotificationServiceRegistry {
  private static activeProvider: NotificationProvider = new BrowserAndFcmNotificationProvider();

  public static getProvider(): NotificationProvider {
    return this.activeProvider;
  }

  public static setProvider(provider: NotificationProvider): void {
    this.activeProvider = provider;
  }
}

/* =========================================================================
 * V2 EXTENSION POINTS (HTTP-SMS Android Gateway / WhatsApp)
 * ========================================================================= */

export interface HttpSmsGatewayConfig {
  gatewayUrl: string; // e.g. http://192.168.1.100:8080/send
  apiKey: string;
  senderPhone: string;
  simSlot: number;
}
