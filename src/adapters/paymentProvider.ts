/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Payment Provider Abstraction Layer
 * V1: Cash on Delivery (COD - Espèces à la livraison)
 * V2 Ready: CIB / Carte Edahabia (Satim Gateway integration interface)
 */

export interface PaymentTransactionResult {
  transactionId: string;
  orderId: string;
  paymentMethod: 'CASH_ON_DELIVERY' | 'CIB_EDAHABIA' | 'LOYALTY_POINTS';
  amountDZD: number;
  status: 'PENDING' | 'AUTHORIZED' | 'COLLECTED' | 'FAILED';
  collectedAt?: string;
  receiptNumber?: string;
  errorMessage?: string;
}

export interface PaymentProvider {
  readonly providerName: string;
  initiatePayment(orderId: string, amountDZD: number): Promise<PaymentTransactionResult>;
  verifyPayment(transactionId: string): Promise<PaymentTransactionResult>;
  recordCashCollection(orderId: string, courierId: string, amountDZD: number): Promise<PaymentTransactionResult>;
}

/**
 * V1 Primary Implementation: Cash On Delivery (COD)
 * Built for Ahmed Rachedi & Algerian retail context.
 * Payment collected physically by the courier upon package handover.
 */
export class CashOnDeliveryPaymentProvider implements PaymentProvider {
  readonly providerName = 'CASH_ON_DELIVERY_V1';

  async initiatePayment(orderId: string, amountDZD: number): Promise<PaymentTransactionResult> {
    return {
      transactionId: `cod-tx-${orderId}-${Date.now()}`,
      orderId,
      paymentMethod: 'CASH_ON_DELIVERY',
      amountDZD,
      status: 'PENDING',
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentTransactionResult> {
    return {
      transactionId,
      orderId: transactionId.replace('cod-tx-', '').split('-')[0],
      paymentMethod: 'CASH_ON_DELIVERY',
      amountDZD: 0,
      status: 'PENDING',
    };
  }

  async recordCashCollection(orderId: string, courierId: string, amountDZD: number): Promise<PaymentTransactionResult> {
    return {
      transactionId: `cod-col-${orderId}-${Date.now()}`,
      orderId,
      paymentMethod: 'CASH_ON_DELIVERY',
      amountDZD,
      status: 'COLLECTED',
      collectedAt: new Date().toISOString(),
      receiptNumber: `REC-${Date.now().toString(36).toUpperCase()}`,
    };
  }
}

/**
 * Payment Service Facade
 */
export class PaymentServiceRegistry {
  private static activeProvider: PaymentProvider = new CashOnDeliveryPaymentProvider();

  public static getProvider(): PaymentProvider {
    return this.activeProvider;
  }

  public static setProvider(provider: PaymentProvider): void {
    this.activeProvider = provider;
  }
}

/* =========================================================================
 * V2 EXTENSION POINTS (SATIM / CIB / EDAHABIA)
 * ========================================================================= */

export interface SatimPaymentConfig {
  merchantId: string;
  terminalId: string;
  secretKey: string;
  gatewayUrl: string;
  returnUrl: string;
}
