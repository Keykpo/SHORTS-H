import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { redis } from './config/redis';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

class Server {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
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
    if (config.env === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }
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

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();

      // Test Redis connection
      await redis.ping();

      // Start server
      this.app.listen(this.port, () => {
        console.log('');
        console.log('🎬 ═══════════════════════════════════════');
        console.log('   AnimeShorts API Server');
        console.log('═══════════════════════════════════════');
        console.log(`🚀 Environment: ${config.env}`);
        console.log(`🌐 Server running on: ${config.apiUrl}`);
        console.log(`📡 API endpoint: ${config.apiUrl}/api`);
        console.log(`🔐 CORS enabled for: ${config.frontendUrl}`);
        console.log('═══════════════════════════════════════');
        console.log('');
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    console.log('\n🔌 Shutting down server...');

    // Disconnect from database
    await disconnectDatabase();

    // Close Redis connection
    await redis.quit();

    console.log('✅ Server shutdown complete');
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
