/**
 * Loyalty API Routes — Server-Authoritative Loyalty Balance & History
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../plugins/firebase-auth.js';
import { LoyaltyEngine } from '../domain/loyaltyEngine.js';

export default async function (fastify: FastifyInstance) {
  // GET /api/loyalty/me — Get loyalty account balance, tier, and recent transactions
  fastify.get('/loyalty/me', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    const account = await LoyaltyEngine.getAccount(fastify.prisma, user.uid);
    return account;
  });
}
