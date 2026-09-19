/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Analytics & Observability Provider Abstraction Layer
 * V1: Lightweight in-memory & local storage metric recorder
 * V2 Ready: ClickHouse / BigQuery Warehouse pipeline
 */

export interface TelemetryEvent {
  eventName: string;
  category: 'ORDER' | 'DISPATCH' | 'PERFORMANCE' | 'AUTH' | 'NAVIGATION';
  properties?: Record<string, any>;
  timestamp: string;
}

export interface AnalyticsProvider {
  readonly providerName: string;
  trackEvent(event: TelemetryEvent): void;
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
}

export class LightweightTelemetryAnalyticsProvider implements AnalyticsProvider {
  readonly providerName = 'LIGHTWEIGHT_TELEMETRY_V1';

  trackEvent(event: TelemetryEvent): void {
    if (process.env.NODE_ENV !== 'production') {
      // Diagnostic output in development
      // console.debug(`[Telemetry: ${event.category}]`, event.eventName, event.properties);
    }
  }

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    // In V1, metrics are kept ephemeral
  }
}

export class AnalyticsServiceRegistry {
  private static activeProvider: AnalyticsProvider = new LightweightTelemetryAnalyticsProvider();

  public static getProvider(): AnalyticsProvider {
    return this.activeProvider;
  }

  public static setProvider(provider: AnalyticsProvider): void {
    this.activeProvider = provider;
  }
}
