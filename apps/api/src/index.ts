import fastify from 'fastify';
import prismaPlugin from './plugins/prisma';
import storesRoutes from './routes/stores';
import ordersRoutes from './routes/orders';

const server = fastify({ logger: true });

server.register(prismaPlugin);

server.register(storesRoutes, { prefix: '/api' });
server.register(ordersRoutes, { prefix: '/api' });

server.get('/health', async () => {
  return { status: 'ok' };
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
