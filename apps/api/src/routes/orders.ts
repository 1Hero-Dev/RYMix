/**
 * Orders API Routes — Server-Authoritative Order Management
 * 
 * Phase 1: Resolves V1 (backend in browser), V5 (price tampering), V6 (no durable store)
 * 
 * All order operations now flow through this server with:
 * - Firebase token verification (V2 fix)
 * - Catalog price lookup (V5 fix)  
 * - Prisma transaction (V6 fix)
 * - Role-based state transitions
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate, requireRole } from '../plugins/firebase-auth.js';
import { calculateAuthoritativePrice } from '../domain/pricingEngine.js';
import { validateOrderTransition, evaluateCancellationPolicy, type ActorRole, type OrderStatus } from '../domain/orderLifecycle.js';

export default async function (fastify: FastifyInstance) {

  // =========================================================================
  // POST /api/orders — Create order with server-authoritative pricing
  // =========================================================================
  fastify.post('/orders', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;

    const body = request.body as {
      storeId: string;
      items: { menuItemId: string; quantity: number }[];
      deliveryAddress: {
        wilaya?: string;
        commune?: string;
        street?: string;
        landmark?: string;
        phone?: string;
        lat?: number;
        lng?: number;
        building?: string;
        floor?: string;
      };
      deliveryNotes?: string;
      voucherCode?: string;
      redeemedFidelityPoints?: number;
      idempotencyKey?: string;
    };

    if (!body.storeId || !body.items?.length) {
      return reply.code(400).send({ error: 'storeId and items are required' });
    }

    // Idempotency check
    if (body.idempotencyKey) {
      const existing = await fastify.prisma.order.findUnique({
        where: { idempotencyKey: body.idempotencyKey },
        include: { items: true, delivery: true, statusHistory: true },
      });
      if (existing) {
        return reply.code(200).send({ order: existing, isDuplicateReplay: true });
      }
    }

    // Verify store exists and is open
    const store = await fastify.prisma.store.findUnique({ where: { id: body.storeId } });
    if (!store || store.status === 'CLOSED') {
      return reply.code(400).send({ error: 'Store not found or is currently closed' });
    }

    // V5 FIX: Server-authoritative pricing with catalog lookup
    let pricing;
    try {
      pricing = await calculateAuthoritativePrice(fastify.prisma, {
        items: body.items,
        storeId: body.storeId,
        voucherCode: body.voucherCode,
        redeemedFidelityPoints: body.redeemedFidelityPoints,
      });
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }

    // V6 FIX: Create order in a Prisma transaction (durable source of truth)
    const order = await fastify.prisma.$transaction(async (tx) => {
      // Find or create customer address
      const addressData = body.deliveryAddress || {};

      const createdOrder = await tx.order.create({
        data: {
          idempotencyKey: body.idempotencyKey || `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          customerId: user.uid,
          storeId: body.storeId,
          subtotalSnapshot: pricing.itemsSubtotalDZD,
          deliveryFee: pricing.deliveryFeeDZD,
          discountSnapshot: pricing.discountDZD,
          totalSnapshot: pricing.finalCustomerTotalDZD,
          status: 'PENDING',
          deliveryLat: addressData.lat || store.lat,
          deliveryLng: addressData.lng || store.lng,
          deliveryNotes: body.deliveryNotes,
          items: {
            create: pricing.itemSnapshots.map(snapshot => ({
              menuItemId: snapshot.menuItemId,
              productNameSnapshot: snapshot.name,
              unitPriceSnapshot: snapshot.catalogPrice,
              quantity: snapshot.quantity,
            })),
          },
          statusHistory: {
            create: {
              status: 'PENDING',
              notes: 'Commande créée avec tarification serveur-autoritative',
            },
          },
          payment: {
            create: {
              amount: pricing.finalCustomerTotalDZD,
              method: 'CASH_ON_DELIVERY',
              status: 'PENDING',
            },
          },
          delivery: {
            create: {
              pickupLat: store.lat,
              pickupLng: store.lng,
              destLat: addressData.lat || store.lat,
              destLng: addressData.lng || store.lng,
              deliveryFee: pricing.deliveryFeeDZD,
              estimatedDistance: pricing.distanceKm,
            },
          },
        },
        include: {
          items: true,
          delivery: true,
          statusHistory: true,
          payment: true,
        },
      });

      return createdOrder;
    });

    return reply.code(201).send({
      order,
      pricing: {
        itemsSubtotalDZD: pricing.itemsSubtotalDZD,
        deliveryFeeDZD: pricing.deliveryFeeDZD,
        discountDZD: pricing.discountDZD,
        finalTotalDZD: pricing.finalCustomerTotalDZD,
        signature: pricing.signature,
      },
    });
  });

  // =========================================================================
  // GET /api/orders/mine — List orders for the authenticated user
  // =========================================================================
  fastify.get('/orders/mine', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;

    const orders = await fastify.prisma.order.findMany({
      where: { customerId: user.uid },
      include: {
        items: true,
        delivery: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return orders;
  });

  // =========================================================================
  // GET /api/orders/:id — Get single order (with role-based access)
  // =========================================================================
  fastify.get('/orders/:id', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user;

    const order = await fastify.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        delivery: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        payment: true,
      },
    });

    if (!order) {
      return reply.code(404).send({ error: 'Order not found' });
    }

    // Access control: customer owns it, courier is assigned, or admin
    if (
      user.role !== 'ADMIN' &&
      order.customerId !== user.uid &&
      order.delivery?.courierId !== user.uid
    ) {
      return reply.code(403).send({ error: 'Forbidden: you do not have access to this order' });
    }

    return order;
  });

  // =========================================================================
  // PATCH /api/orders/:id/status — Transition order status (role-guarded)
  // =========================================================================
  fastify.patch('/orders/:id/status', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user;
    const { status: targetStatus, note } = request.body as { status: OrderStatus; note?: string };

    if (!targetStatus) {
      return reply.code(400).send({ error: 'Target status is required' });
    }

    const order = await fastify.prisma.order.findUnique({
      where: { id },
      include: { delivery: true },
    });

    if (!order) {
      return reply.code(404).send({ error: 'Order not found' });
    }

    // Map auth role to ActorRole
    const actorRole: ActorRole = user.role as ActorRole;
    const currentStatus = order.status as OrderStatus;

    // Validate the transition using the lifecycle state machine
    const validation = validateOrderTransition(currentStatus, targetStatus, actorRole);
    if (!validation.valid) {
      return reply.code(403).send({ error: validation.reason });
    }

    // Execute the transition in a transaction
    const updated = await fastify.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: targetStatus,
          statusHistory: {
            create: {
              status: targetStatus,
              notes: note || `Status transition: ${currentStatus} → ${targetStatus}`,
            },
          },
        },
        include: {
          items: true,
          delivery: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      });

      // Update delivery status if applicable
      if (order.delivery) {
        const deliveryStatusMap: Partial<Record<OrderStatus, string>> = {
          READY: 'READY',
          ASSIGNED: 'ASSIGNED',
          PICKED_UP: 'PICKED_UP',
          DELIVERING: 'EN_ROUTE',
          DELIVERED: 'DELIVERED',
          CANCELLED: 'CANCELLED',
        };
        const newDeliveryStatus = deliveryStatusMap[targetStatus];
        if (newDeliveryStatus) {
          await tx.delivery.update({
            where: { id: order.delivery.id },
            data: {
              ...(targetStatus === 'PICKED_UP' ? { pickedUpAt: new Date() } : {}),
              ...(targetStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
            },
          });
        }
      }

      // Update payment status on delivery
      if (targetStatus === 'DELIVERED') {
        await tx.payment.updateMany({
          where: { orderId: id },
          data: { status: 'COMPLETED' },
        });
      }

      return updatedOrder;
    });

    return { success: true, order: updated };
  });

  // =========================================================================
  // POST /api/orders/:id/cancel — Cancel order (lifecycle-aware)
  // =========================================================================
  fastify.post('/orders/:id/cancel', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user;
    const { reason } = request.body as { reason?: string };

    const order = await fastify.prisma.order.findUnique({ where: { id } });

    if (!order) {
      return reply.code(404).send({ error: 'Order not found' });
    }

    // Check cancellation policy
    const actorRole: ActorRole = user.role as ActorRole;
    const policy = evaluateCancellationPolicy(order.status as OrderStatus, actorRole);

    if (!policy.allowedImmediately) {
      return reply.code(403).send({
        error: policy.explanation,
        requiresAdminIntervention: policy.requiresAdminIntervention,
        requiresStoreApproval: policy.requiresStoreApproval,
      });
    }

    const updated = await fastify.prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        statusHistory: {
          create: {
            status: 'CANCELLED',
            notes: `Annulation: ${reason || 'Raison non spécifiée'}`,
          },
        },
      },
      include: { items: true, delivery: true, statusHistory: true },
    });

    return { success: true, order: updated, message: 'Commande annulée avec succès.' };
  });
}
