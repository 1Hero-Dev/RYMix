/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RYM V2 Loyalty & Rewards Engine — Server-Side (Prisma-backed)
 * Relocated from src/domain/loyaltyEngine.ts
 * 
 * Invariant:
 * The loyalty balance is strictly a projection of immutable ledger transactions.
 * Balance is stored in PostgreSQL via Prisma, replacing client-side localStorage.
 */

import type { PrismaClient } from '@prisma/client';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP_PLATINUM';
export type LoyaltyTxType = 'EARN_PURCHASE' | 'REDEEM_CHECKOUT' | 'BONUS_SIGNUP' | 'EXPIRED_ADJUSTMENT';

export class LoyaltyEngine {
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
   * Loads or creates a loyalty account for a user in PostgreSQL
   */
  public static async getAccount(prisma: any, userId: string) {
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!account) {
      account = await prisma.$transaction(async (tx: any) => {
        const newAcc = await tx.loyaltyAccount.create({
          data: {
            userId,
            balancePoints: 100,
            lifetimePoints: 100,
            tier: 'BRONZE',
            transactions: {
              create: {
                type: 'BONUS_SIGNUP',
                pointsDelta: 100,
                description: 'Points de bienvenue RYM Ahmed Rachedi',
              },
            },
          },
          include: {
            transactions: true,
          },
        });
        return newAcc;
      });
    }

    return account;
  }

  /**
   * Records points earned from a completed purchase: 1 pt per 100 DZD
   */
  public static async recordPurchaseEarn(
    prisma: any,
    userId: string,
    orderId: string,
    orderTotalDZD: number
  ) {
    const pointsEarned = Math.max(5, Math.floor(orderTotalDZD / 100));

    return await prisma.$transaction(async (tx: any) => {
      // Ensure account exists
      let account = await tx.loyaltyAccount.findUnique({ where: { userId } });
      if (!account) {
        account = await tx.loyaltyAccount.create({
          data: {
            userId,
            balancePoints: 100,
            lifetimePoints: 100,
            tier: 'BRONZE',
          },
        });
      }

      const newLifetime = account.lifetimePoints + pointsEarned;
      const newTier = this.calculateTier(newLifetime);

      const [transaction, updatedAccount] = await Promise.all([
        tx.loyaltyTransaction.create({
          data: {
            accountId: account.id,
            type: 'EARN_PURCHASE',
            pointsDelta: pointsEarned,
            orderId,
            description: `Points gagnés sur commande #${orderId.slice(-4)}`,
          },
        }),
        tx.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            balancePoints: { increment: pointsEarned },
            lifetimePoints: newLifetime,
            tier: newTier,
          },
        }),
      ]);

      return { transaction, updatedAccount };
    });
  }

  /**
   * Redeems points for discount: 100 pts = 100 DZD discount (or 1 pt = 1 DZD)
   */
  public static async redeemPoints(
    prisma: any,
    userId: string,
    pointsToRedeem: number,
    orderId: string
  ): Promise<{ success: boolean; discountDZD: number; message: string }> {
    if (pointsToRedeem <= 0) {
      return { success: false, discountDZD: 0, message: 'Montant de points invalide' };
    }

    return await prisma.$transaction(async (tx: any) => {
      const account = await tx.loyaltyAccount.findUnique({ where: { userId } });
      if (!account || account.balancePoints < pointsToRedeem) {
        return {
          success: false,
          discountDZD: 0,
          message: `Solde insuffisant (${account?.balancePoints || 0} pts disponibles)`,
        };
      }

      const discountDZD = pointsToRedeem;

      await Promise.all([
        tx.loyaltyTransaction.create({
          data: {
            accountId: account.id,
            type: 'REDEEM_CHECKOUT',
            pointsDelta: -pointsToRedeem,
            orderId,
            description: `Utilisation de ${pointsToRedeem} points sur commande`,
          },
        }),
        tx.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            balancePoints: { decrement: pointsToRedeem },
          },
        }),
      ]);

      return {
        success: true,
        discountDZD,
        message: `${pointsToRedeem} points fidélité utilisés (-${discountDZD} DZD)`,
      };
    });
  }
}
