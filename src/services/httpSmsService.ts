/**
 * Open-Source HTTP-SMS Gateway Integration Service
 * Compatible with the open-source http-sms Android gateway project (e.g., thedevs-network/http-sms)
 * Turns any local Android smartphone with an Algerian SIM card (Mobilis, Djezzy, Ooredoo)
 * into a zero-marginal-cost SMS gateway for RYM SuperApp (Ahmed Rachedi, Wilaya de Mila).
 */

export interface HttpSmsConfig {
  gatewayUrl: string; // e.g., 'http://192.168.1.100:8080/send' or 'https://api.httpsms.com/v1/messages/send'
  apiKey: string;
  senderPhone: string; // Algerian SIM number e.g. '+213550123456'
  enabled: boolean;
  gatewayType: 'android_local_apk' | 'httpsms_gateway' | 'custom_relay';
  fallbackToSimulation: boolean;
}

export interface SmsLogEntry {
  id: string;
  recipient: string;
  sender: string;
  message: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  httpStatus?: number;
  timestamp: string;
  type: 'OTP' | 'ORDER_CONFIRMATION' | 'COURIER_ASSIGNED' | 'DELIVERED' | 'TEST';
  details?: string;
}

const STORAGE_KEY_CONFIG = 'rym_http_sms_config_v1';
const STORAGE_KEY_LOGS = 'rym_http_sms_logs_v1';

// Default configuration suited for local Android APK or hosted open-source gateway
export const DEFAULT_HTTP_SMS_CONFIG: HttpSmsConfig = {
  gatewayUrl: 'http://192.168.1.100:8080/send',
  apiKey: 'rym_ahmedrachedi_sec_2026',
  senderPhone: '+213 550 12 34 56',
  enabled: true,
  gatewayType: 'android_local_apk',
  fallbackToSimulation: true,
};

class HttpSmsService {
  private config: HttpSmsConfig;
  private logs: SmsLogEntry[] = [];
  private listeners: Array<(log: SmsLogEntry) => void> = [];

  constructor() {
    this.config = this.loadConfig();
    this.logs = this.loadLogs();
  }

  private loadConfig(): HttpSmsConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return { ...DEFAULT_HTTP_SMS_CONFIG, ...JSON.parse(saved) };
    } catch {
      // Fallback
    }
    return DEFAULT_HTTP_SMS_CONFIG;
  }

  private loadLogs(): SmsLogEntry[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'sms-demo-1',
        recipient: '+213 550 12 34 56',
        sender: '+213 550 12 34 56',
        message: 'RYM SuperApp Ahmed Rachedi : Bienvenue ! Votre passerelle open-source HTTP-SMS est opérationnelle sur le réseau Wilaya 43.',
        status: 'SIMULATED',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'TEST',
        details: 'Initialisation système Android SIM Gateway',
      },
    ];
  }

  public getConfig(): HttpSmsConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<HttpSmsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to persist HTTP SMS config to localStorage:', e);
    }
  }

  public getLogs(): SmsLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem(STORAGE_KEY_LOGS);
    } catch {}
  }

  public onNewLog(callback: (log: SmsLogEntry) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Normalize Algerian phone numbers (05/06/07 xx xx xx -> +213 xxx)
   */
  public normalizeAlgerianPhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '+213' + cleaned.substring(1);
    }
    if (cleaned.startsWith('213') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    if (cleaned.startsWith('+213')) {
      return cleaned;
    }
    return phone;
  }

  /**
   * Send SMS via the configured HTTP-SMS Android Gateway
   */
  public async sendSms(
    to: string,
    message: string,
    type: SmsLogEntry['type'] = 'TEST'
  ): Promise<{ success: boolean; status: SmsLogEntry['status']; details: string }> {
    const recipient = this.normalizeAlgerianPhone(to);
    const logId = `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Build payload compatible with open-source HTTP-SMS endpoints
    // (both local APK format and httpsms.com cloud format)
    const payload =
      this.config.gatewayType === 'httpsms_gateway'
        ? {
            content: message,
            from: this.config.senderPhone,
            to: recipient,
          }
        : {
            // Local Android open-source APK format
            phone: recipient,
            to: recipient,
            message: message,
            text: message,
            sender: this.config.senderPhone,
            simSlot: 1, // Default primary Algerian SIM slot (e.g. Mobilis / Djezzy)
          };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(this.config.gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { 'x-api-key': this.config.apiKey, Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const logEntry: SmsLogEntry = {
          id: logId,
          recipient,
          sender: this.config.senderPhone,
          message,
          status: 'SENT',
          httpStatus: response.status,
          timestamp,
          type,
          details: `Délivré via passerelle Android (${response.status} OK)`,
        };
        this.addLog(logEntry);
        return { success: true, status: 'SENT', details: logEntry.details! };
      } else {
        throw new Error(`Passerelle HTTP-SMS a retourné code HTTP ${response.status}`);
      }
    } catch (err: any) {
      // In web preview / sandbox or if phone is offline, use simulation fallback
      if (this.config.fallbackToSimulation) {
        const logEntry: SmsLogEntry = {
          id: logId,
          recipient,
          sender: this.config.senderPhone,
          message,
          status: 'SIMULATED',
          timestamp,
          type,
          details: `Simulé avec succès (Passerelle locale en attente : ${this.config.gatewayUrl})`,
        };
        this.addLog(logEntry);
        return { success: true, status: 'SIMULATED', details: logEntry.details! };
      }

      const logEntry: SmsLogEntry = {
        id: logId,
        recipient,
        sender: this.config.senderPhone,
        message,
        status: 'FAILED',
        timestamp,
        type,
        details: err?.message || 'Erreur réseau vers passerelle HTTP-SMS',
      };
      this.addLog(logEntry);
      return { success: false, status: 'FAILED', details: logEntry.details! };
    }
  }

  private addLog(entry: SmsLogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
    } catch {}
    this.listeners.forEach((cb) => cb(entry));
  }

  // Pre-configured Algerian Delivery Notification helpers

  public async sendOtp(phone: string, otpCode: string) {
    const text = `RYM SuperApp Ahmed Rachedi : Votre code de sécurité est ${otpCode}. Valable 5 minutes. Ne le communiquez à personne.`;
    return this.sendSms(phone, text, 'OTP');
  }

  public async sendOrderConfirmation(phone: string, orderNumber: string, storeName: string, totalDZD: number) {
    const text = `RYM SuperApp Ahmed Rachedi : Commande #${orderNumber} validée chez ${storeName}. Total: ${totalDZD} DZD en espèces. En préparation !`;
    return this.sendSms(phone, text, 'ORDER_CONFIRMATION');
  }

  public async sendCourierAssigned(phone: string, orderNumber: string, courierName: string, etaMin: string | number) {
    const text = `RYM SuperApp : Le coursier ${courierName} a pris en charge votre commande #${orderNumber}. Livraison estimée dans ${etaMin} min.`;
    return this.sendSms(phone, text, 'COURIER_ASSIGNED');
  }

  public async sendOrderDelivered(phone: string, orderNumber: string) {
    const text = `RYM SuperApp Ahmed Rachedi : Commande #${orderNumber} livrée avec succès ! Merci de commander local à Ahmed Rachedi. Saha ftorkoum !`;
    return this.sendSms(phone, text, 'DELIVERED');
  }
}

export const httpSmsService = new HttpSmsService();
