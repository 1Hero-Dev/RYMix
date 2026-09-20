import 'dotenv/config';
import fastify from 'fastify';
import prismaPlugin from './plugins/prisma.js';
import firebaseAuthPlugin from './plugins/firebase-auth.js';
import storesRoutes from './routes/stores.js';
import ordersRoutes from './routes/orders.js';
import pricingRoutes from './routes/pricing.js';
import loyaltyRoutes from './routes/loyalty.js';

const server = fastify({ logger: true });

// Enable CORS
server.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (request.method === 'OPTIONS') {
    reply.code(204).send();
    return reply;
  }
});

// Plugins
server.register(prismaPlugin);
server.register(firebaseAuthPlugin);

// Routes
server.register(storesRoutes, { prefix: '/api' });
server.register(ordersRoutes, { prefix: '/api' });
server.register(pricingRoutes, { prefix: '/api' });
server.register(loyaltyRoutes, { prefix: '/api' });

// Health check (public, no auth)
server.get('/health', async () => {
  return {
    status: 'ok',
    service: 'rym-api-server',
    phase: 'Phase 1 — Server-Authoritative',
    timestamp: new Date().toISOString(),
  };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    server.log.info('Fastify API server started on port 3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
