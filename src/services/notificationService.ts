/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Server-Side Notification Service (Resolves Finding M4)
 * 
 * Invariants:
 * - Notifications are NEVER triggered directly by client applications ("sends alerts").
 * - Notifications are triggered exclusively server-side by listening to domain events
 *   emitted into the Outbox Event Bus (`order.placed`, `order.ready`, `order.delivered`, etc.).
 * - Generates targeted multi-channel dispatches (FCM, Native OS Push, SMS) using localized
 *   templates and recipient preferences.
 */

import { outboxEventBus } from '../events/outboxEventBus';
import { DomainEvent, OrderStatus } from '../types';
import { NotificationServiceRegistry, NotificationPayload } from '../adapters/notificationProvider';
import { sendPushNotification } from '../firebase/firebaseServices';

export interface NotificationTemplate {
  title: string;
  body: string;
  recipientRoles: ('CUSTOMER' | 'MERCHANT' | 'COURIER' | 'ADMIN')[];
}

export class ServerNotificationService {
  private static instance: ServerNotificationService;

  private constructor() {
    this.registerEventSubscribers();
  }

  public static getInstance(): ServerNotificationService {
    if (!this.instance) {
      this.instance = new ServerNotificationService();
    }
    return this.instance;
  }

  /**
   * Subscribes to outbox domain events to trigger server-side alerts
   */
  private registerEventSubscribers(): void {
    // 1. Order Placed
    outboxEventBus.subscribe('order.placed', (event) => {
      this.handleOrderPlaced(event);
    });

    // 2. Order Delivered
    outboxEventBus.subscribe('order.delivered', (event) => {
      this.handleOrderDelivered(event);
    });

    // 3. Order Cancelled
    outboxEventBus.subscribe('order.cancelled', (event) => {
      this.handleOrderCancelled(event);
    });

    // 4. Order Accepted / Ready
    outboxEventBus.subscribe('order.accepted', (event) => {
      this.handleOrderAccepted(event);
    });
  }

  private handleOrderPlaced(event: DomainEvent<any>): void {
    const { orderId, orderNumber, storeId, total } = event.payload || {};

    // Alert Merchant: New incoming order
    this.dispatchAlert({
      recipientId: storeId || 'merchant-store',
      recipientRole: 'MERCHANT',
      orderId,
      title: `Nouvelle commande reçue #${orderNumber || orderId}`,
      body: `Une nouvelle commande de ${total || 0} DZD requiert votre confirmation.`,
    });

    // Mirror to FCM Cloud Messaging
    sendPushNotification(
      'shop',
      `Nouvelle commande #${orderNumber || orderId}`,
      `Montant : ${total || 0} DZD. En attente de préparation.`
    );
  }

  private handleOrderDelivered(event: DomainEvent<any>): void {
    const { orderId, orderNumber } = event.payload || {};

    // Alert Customer
    this.dispatchAlert({
      recipientId: 'customer',
      recipientRole: 'CUSTOMER',
      orderId,
      title: `Commande #${orderNumber || orderId} livrée !`,
      body: `Votre commande a été remise avec succès. Bon appétit !`,
    });

    // Alert Admin Operations
    this.dispatchAlert({
      recipientId: 'admin-console',
      recipientRole: 'ADMIN',
      orderId,
      title: `Livraison terminée #${orderNumber || orderId}`,
      body: `Encaissement espèces validé et course clôturée.`,
    });
  }

  private handleOrderCancelled(event: DomainEvent<any>): void {
    const { orderId, orderNumber, note } = event.payload || {};

    this.dispatchAlert({
      recipientId: 'all-parties',
      recipientRole: 'CUSTOMER',
      orderId,
      title: `Commande #${orderNumber || orderId} annulée`,
      body: note || 'La commande a été annulée.',
    });
  }

  private handleOrderAccepted(event: DomainEvent<any>): void {
    const { orderId, nextStatus, note } = event.payload || {};
    if (!nextStatus) return;

    const titles: Partial<Record<OrderStatus, string>> = {
      CONFIRMED: 'Commande confirmée par le restaurant',
      PREPARING: 'En cours de préparation en cuisine',
      READY: 'Commande prête au comptoir',
      PICKED_UP: 'Prise en charge par le livreur',
      DELIVERING: 'Livreur en route vers votre adresse 🛵',
      ARRIVED: 'Le livreur est arrivé à votre porte !',
    };

    const title = titles[nextStatus as OrderStatus] || `Mise à jour commande : ${nextStatus}`;

    this.dispatchAlert({
      recipientId: 'customer',
      recipientRole: 'CUSTOMER',
      orderId,
      title,
      body: note || `Statut de votre commande : ${nextStatus}`,
    });
  }

  /**
   * Dispatches the alert to registered notification providers (Browser, FCM, SMS)
   */
  private async dispatchAlert(payload: NotificationPayload): Promise<void> {
    const provider = NotificationServiceRegistry.getProvider();
    await provider.sendNotification(payload);
  }
}

export const serverNotificationService = ServerNotificationService.getInstance();
