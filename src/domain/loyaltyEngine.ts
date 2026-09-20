/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Loyalty & Rewards Engine
 * Implements Sections 16 & 17 (Loyalty Foundation & Transactional Ledger)
 * 
 * Invariant:
 * The loyalty balance is strictly a projection of immutable ledger transactions.
 * Balance is NEVER mutated directly without an audit transaction record.
 */

import { outboxEventBus } from '../events/outboxEventBus';

export type LoyaltyTransactionType = 'EARN_PURCHASE' | 'REDEEM_CHECKOUT' | 'BONUS_SIGNUP' | 'EXPIRED_ADJUSTMENT';

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: LoyaltyTransactionType;
  pointsDelta: number; // positive for earn, negative for redeem
  orderId?: string;
  description: string;
  timestamp: string;
}

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP_PLATINUM';

export interface LoyaltyAccount {
  userId: string;
  balancePoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  transactions: LoyaltyTransaction[];
}

export class LoyaltyEngine {
  private static STORAGE_KEY_PREFIX = 'rym_loyalty_account_';

  /**
   * Loads or creates a loyalty account for a user
   */
  public static getAccount(userId: string): LoyaltyAccount {
    try {
      const saved = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${userId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }

    // Default starting account with 100 welcome bonus points
    const initialTx: LoyaltyTransaction = {
      id: `tx-welcome-${Date.now()}`,
      userId,
      type: 'BONUS_SIGNUP',
      pointsDelta: 100,
      description: 'Points de bienvenue RYM Ahmed Rachedi',
      timestamp: new Date().toISOString(),
    };

    const initialAccount: LoyaltyAccount = {
      userId,
      balancePoints: 100,
      lifetimePoints: 100,
      tier: 'BRONZE',
      transactions: [initialTx],
    };

    this.saveAccount(initialAccount);
    return initialAccount;
  }

  /**
   * Persists loyalty account
   */
  private static saveAccount(account: LoyaltyAccount): void {
    try {
      localStorage.setItem(`${this.STORAGE_KEY_PREFIX}${account.userId}`, JSON.stringify(account));
    } catch {
      // LocalStorage quota fallback
    }
  }

  /**
   * Computes tier from lifetime points
   */
  public static calculateTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= 2500) return 'VIP_PLATINUM';
    if (lifetimePoints >= 1000) return 'GOLD';
    if (lifetimePoints >= 400) return 'SILVER';
    return 'BRONZE';
  }

  /**
   * Records points earned from completed purchase: 1 pt per 100 DZD
   */
  public static recordPurchaseEarn(userId: string, orderId: string, orderTotalDZD: number): LoyaltyTransaction {
    const account = this.getAccount(userId);
    const pointsEarned = Math.max(5, Math.floor(orderTotalDZD / 100));

    const tx: LoyaltyTransaction = {
      id: `tx-earn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      type: 'EARN_PURCHASE',
      pointsDelta: pointsEarned,
      orderId,
      description: `Points gagnés sur commande #${orderId.slice(-4)}`,
      timestamp: new Date().toISOString(),
    };

    account.transactions.unshift(tx);
    account.balancePoints += pointsEarned;
    account.lifetimePoints += pointsEarned;
    account.tier = this.calculateTier(account.lifetimePoints);

    this.saveAccount(account);
    return tx;
  }

  /**
   * Redeems points for discount: 100 pts = 100 DZD discount
   */
  public static redeemPoints(userId: string, pointsToRedeem: number, orderId: string): { success: boolean; discountDZD: number; message: string } {
    const account = this.getAccount(userId);

    if (pointsToRedeem <= 0) {
      return { success: false, discountDZD: 0, message: 'Montant de points invalide' };
    }

    if (account.balancePoints < pointsToRedeem) {
      return {
        success: false,
        discountDZD: 0,
        message: `Solde insuffisant (${account.balancePoints} pts disponibles)`,
      };
    }

    const discountDZD = pointsToRedeem; // 1 pt = 1 DZD
    const tx: LoyaltyTransaction = {
      id: `tx-redeem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      type: 'REDEEM_CHECKOUT',
      pointsDelta: -pointsToRedeem,
      orderId,
      description: `Utilisation de ${pointsToRedeem} points sur commande`,
      timestamp: new Date().toISOString(),
    };

    account.transactions.unshift(tx);
    account.balancePoints -= pointsToRedeem;

    this.saveAccount(account);
    return {
      success: true,
      discountDZD,
      message: `${pointsToRedeem} points fidélité utilisés (-${discountDZD} DZD)`,
    };
  }
}

// In-memory set for deduplicating delivered order events (Recommendation M3)
const processedDeliveredOrderIds = new Set<string>();

// Asynchronous Outbox Event Subscriber for decoupled loyalty point awarding
outboxEventBus.subscribe('order.delivered', (event) => {
  const { orderId, total, customerId } = event.payload || {};
  if (!orderId || processedDeliveredOrderIds.has(orderId)) {
    return; // Idempotent handling: ignore duplicate deliveries
  }

  processedDeliveredOrderIds.add(orderId);
  const targetUserId = customerId || 'cust-amine';
  const orderTotal = typeof total === 'number' ? total : 1000;

  LoyaltyEngine.recordPurchaseEarn(targetUserId, orderId, orderTotal);
});

