/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Domain Event & Outbox Pattern Bus
 * Implements Recommendations #11 (Event Architecture), #12 (Lightweight Realtime Deltas),
 * #14 (Transactional Boundaries), and #15 (Outbox Pattern)
 */

import { DomainEvent, DomainEventType, OutboxEventRecord } from '../types';

const OUTBOX_STORAGE_KEY = 'ryma_outbox_queue_v1';
const MAX_OUTBOX_HISTORY = 100;

type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

class OutboxEventBus {
  private subscribers: Map<DomainEventType | '*', Set<EventHandler>> = new Map();
  private outboxQueue: OutboxEventRecord[] = [];
  private isProcessing = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(OUTBOX_STORAGE_KEY);
      if (stored) {
        this.outboxQueue = JSON.parse(stored);
      }
    } catch {
      this.outboxQueue = [];
    }
  }

  private persistToStorage(): void {
    try {
      // Keep recent items
      if (this.outboxQueue.length > MAX_OUTBOX_HISTORY) {
        this.outboxQueue = this.outboxQueue.slice(-MAX_OUTBOX_HISTORY);
      }
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(this.outboxQueue));
    } catch {
      // ignore
    }
  }

  /**
   * Subscribe to specific domain event or '*' for all
   */
  public subscribe(eventType: DomainEventType | '*', handler: EventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);

    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Records a domain event atomically in the Outbox (Recommendation #15)
   */
  public recordOutboxEvent<T>(
    type: DomainEventType,
    aggregateId: string,
    aggregateType: 'ORDER' | 'DELIVERY' | 'FULFILLMENT' | 'PAYMENT',
    payload: T,
    actor: { role: 'CUSTOMER' | 'MERCHANT' | 'COURIER' | 'SYSTEM' | 'ADMIN'; id: string; name: string },
    metadata?: { idempotencyKey?: string; correlationId?: string; version?: number }
  ): DomainEvent<T> {
    const event: DomainEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      aggregateId,
      aggregateType,
      timestamp: new Date().toISOString(),
      payload,
      actor,
      metadata,
    };

    const outboxRecord: OutboxEventRecord = {
      id: `outbox-${event.id}`,
      event,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
    };

    this.outboxQueue.push(outboxRecord);
    this.persistToStorage();

    // Trigger asynchronous dispatch
    setTimeout(() => this.flushOutbox(), 10);

    return event;
  }

  /**
   * Flush pending outbox records to registered event subscribers
   */
  public async flushOutbox(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    let dispatchedCount = 0;

    try {
      const pendingRecords = this.outboxQueue.filter((r) => r.status === 'PENDING');

      for (const record of pendingRecords) {
        const { event } = record;

        try {
          // Specific subscribers
          const handlers = this.subscribers.get(event.type) || new Set();
          const wildcardHandlers = this.subscribers.get('*') || new Set();

          const allHandlers = [...handlers, ...wildcardHandlers];

          for (const handler of allHandlers) {
            await handler(event);
          }

          record.status = 'DISPATCHED';
          record.dispatchedAt = new Date().toISOString();
          dispatchedCount++;
        } catch (err: any) {
          record.retryCount += 1;
          record.error = err?.message || 'Erreur lors du dispatch';
          if (record.retryCount >= 3) {
            record.status = 'FAILED';
          }
        }
      }

      this.persistToStorage();
    } finally {
      this.isProcessing = false;
    }

    return dispatchedCount;
  }

  /**
   * Recommendation #12: Lightweight Realtime Deltas
   * Sends small targeted payloads instead of entire order trees.
   */
  public emitCourierLocationDelta(
    orderId: string,
    courierId: string,
    lat: number,
    lng: number,
    heading: number,
    speedKmh: number,
    remainingEtaMinutes: number
  ): void {
    this.recordOutboxEvent(
      'courier.location_updated',
      orderId,
      'DELIVERY',
      {
        orderId,
        courierId,
        lat,
        lng,
        heading,
        speedKmh,
        remainingEtaMinutes,
        timestamp: Date.now(),
      },
      { role: 'COURIER', id: courierId, name: 'Livreur GPS' }
    );
  }

  public emitOrderStatusDelta(
    orderId: string,
    newStatus: string,
    actor: { role: any; id: string; name: string },
    note?: string
  ): void {
    this.recordOutboxEvent(
      'order.accepted', // or matching type
      orderId,
      'ORDER',
      { orderId, newStatus, note, timestamp: Date.now() },
      actor
    );
  }

  public getOutboxStats(): {
    total: number;
    pending: number;
    dispatched: number;
    failed: number;
    recentEvents: OutboxEventRecord[];
  } {
    return {
      total: this.outboxQueue.length,
      pending: this.outboxQueue.filter((r) => r.status === 'PENDING').length,
      dispatched: this.outboxQueue.filter((r) => r.status === 'DISPATCHED').length,
      failed: this.outboxQueue.filter((r) => r.status === 'FAILED').length,
      recentEvents: this.outboxQueue.slice(-15).reverse(),
    };
  }

  public clearOutbox(): void {
    this.outboxQueue = [];
    localStorage.removeItem(OUTBOX_STORAGE_KEY);
  }
}

export const outboxEventBus = new OutboxEventBus();
