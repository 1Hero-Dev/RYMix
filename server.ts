import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { mobileBffRouter } from './server/mobileBffRouter';
import { MOCK_STORES, DEFAULT_ADDRESS } from './src/data/mockData';
import { calculateAuthoritativePrice } from './src/domain/pricingEngine';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic middlewares
  app.use(express.json());

  // Permissive CORS & BFF headers for web and mobile testing
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, If-None-Match, X-Idempotency-Key'
    );
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // =========================================================================
  // 1. MOBILE BFF (Backend-For-Frontend) ROUTES
  // =========================================================================
  app.use('/api/bff/mobile', mobileBffRouter);

  // =========================================================================
  // 2. CORE & STANDARD API ROUTES
  // =========================================================================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'rym-ahmedrachedi-api',
      wilaya: 43,
      region: 'Ahmed Rachedi, Mila',
      bffEnabled: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Stores list
  app.get('/api/stores', (req: Request, res: Response) => {
    res.json(MOCK_STORES);
  });

  // Authoritative Pricing Quote
  app.post('/api/pricing/quote', (req: Request, res: Response) => {
    const { items = [], storeId, distanceMeters, voucherCode, redeemedFidelityPoints } = req.body;
    const store = MOCK_STORES.find((s) => s.id === storeId);
    const resolvedItems = items.map((cartItem: any) => {
      const catalogItem = store?.items.find((it) => it.id === cartItem.menuItemId);
      const price = catalogItem ? catalogItem.price : (Number(cartItem.price) || 500);
      return {
        price,
        quantity: Math.max(1, Number(cartItem.quantity) || 1),
        menuItemId: cartItem.menuItemId,
      };
    });

    const quote = calculateAuthoritativePrice({
      items: resolvedItems,
      storeId,
      distanceMeters: distanceMeters ?? 1200,
      voucherCode,
      redeemedFidelityPoints,
    });

    res.json({
      itemsSubtotalDZD: quote.itemsSubtotalDZD,
      deliveryFeeDZD: quote.deliveryFeeDZD,
      packagingFeeDZD: quote.packagingFeeDZD,
      platformServiceFeeDZD: quote.platformServiceFeeDZD,
      smallOrderFeeDZD: quote.smallOrderFeeDZD,
      discountDZD: quote.discountDZD,
      finalTotalDZD: quote.finalCustomerTotalDZD,
      distanceKm: quote.distanceKm,
      signature: quote.signature,
      calculatedAt: quote.calculatedAt,
    });
  });

  // Standard Order submission
  app.post('/api/orders', (req: Request, res: Response) => {
    const { storeId, items = [], deliveryAddress = DEFAULT_ADDRESS, paymentMethod = 'COD' } = req.body;
    const orderNumber = `RYM-AR-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord-${Date.now()}`;

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        status: 'CONFIRMED',
        storeId,
        items,
        deliveryAddress,
        paymentMethod,
        createdAt: new Date().toISOString(),
      },
    });
  });

  // Order transition
  app.post('/api/orders/:id/transition', (req: Request, res: Response) => {
    const { id } = req.params;
    const { targetStatus, actorRole, note } = req.body;

    res.json({
      success: true,
      orderId: id,
      newStatus: targetStatus,
      updatedBy: actorRole || 'USER',
      note: note || `Statut mis à jour : ${targetStatus}`,
      timestamp: new Date().toISOString(),
    });
  });

  // Loyalty Points
  app.get('/api/loyalty/points', (req: Request, res: Response) => {
    res.json({
      userId: 'usr-current',
      pointsBalance: 240,
      tier: 'Terroir Argent',
      conversionRateDZD: 1, // 1 point = 1 DZD
      estimatedDiscountDZD: 240,
    });
  });

  // =========================================================================
  // 3. VITE MIDDLEWARE (Development) or STATIC ASSETS (Production)
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BFF Server] Running on http://0.0.0.0:${PORT} with Mobile BFF active at /api/bff/mobile`);
  });
}

startServer().catch((err) => {
  console.error('[BFF Server] Fatal startup error:', err);
});
