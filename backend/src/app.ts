import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger } from './lib/logger';

import { authRouter } from './modules/auth/auth.routes';
import { tablesRouter } from './modules/tables/tables.routes';
import { menuRouter } from './modules/menu/menu.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { kitchenRouter } from './modules/kitchen/kitchen.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { inventoryRouter } from './modules/inventory/inventory.routes';
import { usersRouter } from './modules/users/users.routes';
import { whatsappRouter } from './modules/whatsapp/whatsapp.routes';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(
        {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
        },
        'HTTP Request'
      );
    });
    next();
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Rutas de la API
  app.use('/api/auth', authRouter);
  app.use('/api/tables', tablesRouter);
  app.use('/api/menu', menuRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/kitchen', kitchenRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/inventory', inventoryRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/whatsapp', whatsappRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err, req }, 'Unhandled error');
    res.status(500).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  });

  return app;
}
