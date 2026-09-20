/**
 * Pricing API Routes — Server-Side Cart Quotation
 * 
 * Phase 1 (V5 fix): Replaces the client-side quoteCartPrice.
 * All prices are fetched from the database catalog.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../plugins/firebase-auth.js';
import { calculateAuthoritativePrice } from '../domain/pricingEngine.js';

export default async function (fastify: FastifyInstance) {

  // POST /api/pricing/quote — Get an authoritative price quote for a cart
  fastify.post('/pricing/quote', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      items: { menuItemId: string; quantity: number }[];
      storeId: string;
      distanceMeters?: number;
      voucherCode?: string;
      redeemedFidelityPoints?: number;
    };

    if (!body.storeId || !body.items?.length) {
      return reply.code(400).send({ error: 'storeId and items are required' });
    }

    try {
      const pricing = await calculateAuthoritativePrice(fastify.prisma, {
        items: body.items,
        storeId: body.storeId,
        distanceMeters: body.distanceMeters,
        voucherCode: body.voucherCode,
        redeemedFidelityPoints: body.redeemedFidelityPoints,
      });

      return {
        itemsSubtotalDZD: pricing.itemsSubtotalDZD,
        deliveryFeeDZD: pricing.deliveryFeeDZD,
        packagingFeeDZD: pricing.packagingFeeDZD,
        platformServiceFeeDZD: pricing.platformServiceFeeDZD,
        smallOrderFeeDZD: pricing.smallOrderFeeDZD,
        discountDZD: pricing.discountDZD,
        finalTotalDZD: pricing.finalCustomerTotalDZD,
        distanceKm: pricing.distanceKm,
        signature: pricing.signature,
        calculatedAt: pricing.calculatedAt,
      };
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });
}
