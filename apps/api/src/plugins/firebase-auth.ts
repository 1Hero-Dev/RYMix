/**
 * Firebase Auth Plugin for Fastify
 * 
 * Phase 1 (V1, V2 fix): Server-side token verification and RBAC.
 * Verifies Firebase ID tokens and extracts role from custom claims.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (uses GOOGLE_APPLICATION_CREDENTIALS env var)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export interface AuthUser {
  uid: string;
  email?: string;
  role: 'CUSTOMER' | 'MERCHANT' | 'COURIER' | 'ADMIN';
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;
  }
}

/**
 * Extracts role from Firebase custom claims.
 * Priority: token.admin → token.role → default CUSTOMER
 */
function extractRole(decodedToken: admin.auth.DecodedIdToken): AuthUser['role'] {
  if (decodedToken.admin === true) return 'ADMIN';
  
  const role = decodedToken.role as string | undefined;
  if (role && ['CUSTOMER', 'MERCHANT', 'COURIER', 'ADMIN'].includes(role.toUpperCase())) {
    return role.toUpperCase() as AuthUser['role'];
  }
  
  return 'CUSTOMER';
}

/**
 * Authentication preHandler — verifies Firebase ID token and decorates request.user
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Unauthorized: missing or malformed Authorization header' });
    return;
  }
  
  const idToken = authHeader.substring(7);
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    request.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: extractRole(decodedToken),
    };
  } catch (err) {
    request.log.warn({ err }, 'Firebase token verification failed');
    reply.code(401).send({ error: 'Unauthorized: invalid or expired token' });
    return;
  }

  // Orders, deliveries and loyalty accounts hold foreign keys to User.id, and
  // nothing else creates users. Without this, the first order from any real
  // account fails with a foreign-key violation.
  try {
    await ensureUserProvisioned(request.server, request.user);
  } catch (err) {
    request.log.error({ err }, 'User provisioning failed');
    reply.code(503).send({ error: 'Service temporarily unavailable' });
    return;
  }
}

/** Firebase role -> database role. The Firebase claim stays the source of truth. */
const DB_ROLE = {
  CUSTOMER: 'CUSTOMER',
  COURIER: 'COURIER',
  MERCHANT: 'MERCHANT_STAFF',
  ADMIN: 'ADMIN_OPERATIONS',
} as const;

// Avoid a database write on every request: provision once per uid per process.
const provisionedUids = new Set<string>();

/**
 * Ensures a User row exists for the authenticated Firebase account. Never
 * overwrites an existing row, so roles assigned by an administrator survive.
 */
export async function ensureUserProvisioned(fastify: FastifyInstance, user: AuthUser): Promise<void> {
  if (provisionedUids.has(user.uid)) return;
  try {
    await fastify.prisma.user.upsert({
      where: { id: user.uid },
      update: {},
      create: { id: user.uid, role: DB_ROLE[user.role] },
    });
  } catch (err) {
    // Two concurrent first requests can both try to insert; the loser hits the
    // unique constraint, which only means the row now exists.
    if ((err as { code?: string }).code !== 'P2002') throw err;
  }
  if (provisionedUids.size > 50_000) provisionedUids.clear();
  provisionedUids.add(user.uid);
}

/**
 * RBAC guard factory — returns a preHandler that checks the user's role
 */
export function requireRole(...roles: AuthUser['role'][]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await authenticate(request, reply);
    if (reply.sent) return;
    
    if (!roles.includes(request.user.role)) {
      reply.code(403).send({
        error: `Forbidden: requires role ${roles.join(' or ')}, you have ${request.user.role}`,
      });
    }
  };
}

export default fp(async (fastify: FastifyInstance) => {
  // Decorate request with user property (null by default)
  fastify.decorateRequest('user', null as never);
  
  fastify.log.info('Firebase Auth plugin registered');
});
