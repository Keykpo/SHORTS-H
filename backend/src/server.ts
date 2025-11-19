import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { redis } from './config/redis';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { logger } from './config/logger';
import { requestLogger, errorLogger, performanceLogger } from './middlewares/logging.middleware';
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
} from './config/sentry';

class Server {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;

    // Initialize Sentry first (must be before other middlewares)
    initSentry(this.app);

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Sentry request tracking (must be first)
    this.app.use(sentryRequestHandler());
    this.app.use(sentryTracingHandler());

    // Security
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    this.app.use(cors({
      origin: config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        success: false,
        error: 'Too many requests, please try again later',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(requestLogger);
    this.app.use(performanceLogger);
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', routes);

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Welcome to AnimeShorts API',
        version: '1.0.0',
        documentation: '/api/health',
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Sentry error handler (must be before other error handlers)
    this.app.use(sentryErrorHandler());

    // Error logging middleware
    this.app.use(errorLogger);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      logger.info('Database connected successfully');

      // Test Redis connection
      await redis.ping();
      logger.info('Redis connected successfully');

      // Start server
      this.app.listen(this.port, () => {
        logger.info('');
        logger.info('🎬 ═══════════════════════════════════════');
        logger.info('   AnimeShorts API Server');
        logger.info('═══════════════════════════════════════');
        logger.info(`🚀 Environment: ${config.env}`);
        logger.info(`🌐 Server running on: ${config.apiUrl}`);
        logger.info(`📡 API endpoint: ${config.apiUrl}/api`);
        logger.info(`🔐 CORS enabled for: ${config.frontendUrl}`);
        logger.info('═══════════════════════════════════════');
        logger.info('');
      });
    } catch (error) {
      logger.error('Failed to start server', { error });
      await this.shutdown();
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down server...');

    // Disconnect from database
    await disconnectDatabase();
    logger.info('Database disconnected');

    // Close Redis connection
    await redis.quit();
    logger.info('Redis disconnected');

    logger.info('Server shutdown complete');
    process.exit(0);
  }
}

// Create server instance
const server = new Server();

// Start server
server.start();

// Graceful shutdown
process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());

export default server.app;
