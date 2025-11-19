import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import morgan from 'morgan';

/**
 * Morgan middleware with Winston integration
 */
export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => {
        // Parse Morgan output to extract request details
        const parts = message.trim().split(' ');
        const [method, url, status, contentLength, , responseTime] = parts;

        logger.http('HTTP Request', {
          method,
          url,
          status: parseInt(status),
          contentLength,
          responseTime: parseFloat(responseTime),
        });
      },
    },
  }
);

/**
 * Enhanced request/response logger middleware
 * Logs detailed information about each request
 */
export const enhancedLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userId: (req as any).user?.id,
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Error logging middleware
 * Should be added after all routes but before error handler
 */
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    user: (req as any).user?.id,
  });

  next(err);
};

/**
 * Performance logging middleware
 * Logs slow requests (> 1 second)
 */
export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration,
        status: res.statusCode,
      });
    }
  });

  next();
};
