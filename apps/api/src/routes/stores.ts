import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  // GET /api/stores
  fastify.get('/stores', async (request, reply) => {
    // Basic spatial bounding box / distance implementation would go here.
    // For now, return all OPEN stores.
    const stores = await fastify.prisma.store.findMany({
      where: { status: 'OPEN' }
    });
    return stores;
  });

  // GET /api/stores/:id/catalog
  fastify.get('/stores/:id/catalog', async (request, reply) => {
    const { id } = request.params as { id: string };
    const catalog = await fastify.prisma.menuCategory.findMany({
      where: { storeId: id },
      include: {
        items: {
          where: { status: 'AVAILABLE' }
        }
      }
    });
    return catalog;
  });
}
