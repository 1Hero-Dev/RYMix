/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Operations Intelligence & Anomaly Detection
 * Implements Sections 34, 35, 36 & 37 (Operations Center & Delivery Problem Detection)
 * Deterministic rule-based anomaly detection for live logistics supervision.
 */

import { Order } from '../types';

export type OperationalAnomalyType =
  | 'ORDER_UNASSIGNED_TOO_LONG'
  | 'MERCHANT_PREP_DELAYED'
  | 'COURIER_STALLED'
  | 'ETA_OVERSHOOT';

export interface OperationalAlert {
  id: string;
  orderId: string;
  type: OperationalAnomalyType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  timeElapsedMinutes: number;
  createdAt: string;
  resolved: boolean;
}

export interface OperationsHealthOverview {
  overallHealthScore: number; // 0 to 100%
  activeOrdersCount: number;
  unassignedOrdersCount: number;
  delayedOrdersCount: number;
  alerts: OperationalAlert[];
}

export class OperationsIntelligence {
  /**
   * Evaluates active orders against operational thresholds
   */
  public static detectAnomalies(orders: Order[]): OperationalAlert[] {
    const alerts: OperationalAlert[] = [];
    const now = Date.now();

    for (const order of orders) {
      if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
        continue;
      }

      const orderAgeMinutes = Math.round((now - new Date(order.createdAt).getTime()) / 60000);

      // Rule 1: Order Ready or Confirmed without courier for > 7 minutes
      if ((order.status === 'READY' || order.status === 'CONFIRMED') && !order.courierId && orderAgeMinutes > 7) {
        alerts.push({
          id: `alert-unassigned-${order.id}`,
          orderId: order.id,
          type: 'ORDER_UNASSIGNED_TOO_LONG',
          severity: orderAgeMinutes > 15 ? 'CRITICAL' : 'WARNING',
          title: 'Commande en attente de livreur',
          description: `Commande #${order.id.slice(-4)} chez ${order.storeName} sans livreur depuis ${orderAgeMinutes} min`,
          timeElapsedMinutes: orderAgeMinutes,
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }

      // Rule 2: Kitchen prep delayed > 25 minutes
      if (order.status === 'PREPARING' && orderAgeMinutes > 25) {
        alerts.push({
          id: `alert-prep-${order.id}`,
          orderId: order.id,
          type: 'MERCHANT_PREP_DELAYED',
          severity: 'WARNING',
          title: 'Préparation en cuisine prolongée',
          description: `${order.storeName} prépare la commande #${order.id.slice(-4)} depuis ${orderAgeMinutes} min`,
          timeElapsedMinutes: orderAgeMinutes,
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }

      // Rule 3: Delivery in progress exceeding 35 minutes
      if (order.status === 'DELIVERING' && orderAgeMinutes > 35) {
        alerts.push({
          id: `alert-delivery-${order.id}`,
          orderId: order.id,
          type: 'ETA_OVERSHOOT',
          severity: 'CRITICAL',
          title: 'Dépassement du temps de course',
          description: `Livraison en cours pour #${order.id.slice(-4)} dépassant 35 minutes`,
          timeElapsedMinutes: orderAgeMinutes,
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Computes comprehensive operational health score for Ahmed Rachedi
   */
  public static getHealthOverview(orders: Order[]): OperationsHealthOverview {
    const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
    const alerts = this.detectAnomalies(activeOrders);

    const unassignedOrdersCount = activeOrders.filter((o) => ['PENDING', 'CONFIRMED', 'READY'].includes(o.status) && !o.courierId).length;
    const delayedOrdersCount = alerts.filter((a) => a.severity === 'CRITICAL').length;

    // Base score 100, deducted by critical and warning alerts
    let health = 100;
    health -= delayedOrdersCount * 15;
    health -= alerts.filter((a) => a.severity === 'WARNING').length * 5;
    health = Math.max(20, Math.min(100, health));

    return {
      overallHealthScore: health,
      activeOrdersCount: activeOrders.length,
      unassignedOrdersCount,
      delayedOrdersCount,
      alerts,
    };
  }
}
