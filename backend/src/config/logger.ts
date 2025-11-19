import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, errors, printf, colorize, json } = winston.format;

// Custom format for console output (development)
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  // Add stack trace if error
  if (stack) {
    msg += `\n${stack}`;
  }

  return msg;
});

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Base configuration
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  defaultMeta: { service: 'animeshorts-api' },
  transports: [] as winston.transport[],
};

// Development: Console logging with colors
if (process.env.NODE_ENV !== 'production') {
  loggerConfig.transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      ),
    })
  );
}

// Production: File logging with rotation
if (process.env.NODE_ENV === 'production') {
  // Combined logs (all levels)
  loggerConfig.transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: json(),
    })
  );

  // Error logs (error level only)
  loggerConfig.transports.push(
    new DailyRotateFile({
      level: 'error',
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: json(),
    })
  );

  // Console logging (JSON format for log aggregation)
  loggerConfig.transports.push(
    new winston.transports.Console({
      format: json(),
    })
  );
}

// Create the logger
export const logger = winston.createLogger(loggerConfig);

/**
 * HTTP request logger for Express
 */
export const httpLogger = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

/**
 * Stream for Morgan integration
 */
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

/**
 * Log levels:
 * - error: Error events that require immediate attention
 * - warn: Warning events that should be reviewed
 * - info: General informational messages about application state
 * - http: HTTP request logs
 * - debug: Detailed information for debugging
 */

/**
 * Usage examples:
 *
 * logger.error('Database connection failed', { error: err.message });
 * logger.warn('Cache miss for key', { key: 'user:123' });
 * logger.info('User registered', { userId: '123', username: 'john' });
 * logger.debug('Cache lookup', { key: 'video:456', hit: true });
 */

export default logger;
