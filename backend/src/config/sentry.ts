import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { config } from './index';
import { Express } from 'express';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export const initSentry = (app: Express) => {
  // Only initialize in production or staging
  if (config.env === 'development' || !process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.env,
    release: process.env.npm_package_version || '1.0.0',

    // Performance monitoring
    tracesSampleRate: config.env === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in staging

    // Profiling
    profilesSampleRate: config.env === 'production' ? 0.1 : 1.0,
    integrations: [
      // Express integration
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Don't send events for certain errors
      const error = hint.originalException;

      // Filter out 404 errors
      if (event.message?.includes('404') || event.message?.includes('Not Found')) {
        return null;
      }

      // Filter out validation errors (client-side issues)
      if (event.message?.includes('Validation') || event.message?.includes('Invalid input')) {
        return null;
      }

      // Remove sensitive data from request bodies
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === 'object') {
          delete data.password;
          delete data.passwordHash;
          delete data.accessToken;
          delete data.refreshToken;
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      'ECONNABORTED',
      'ECONNRESET',
      'EPIPE',
      'ETIMEDOUT',
      'Unauthorized',
      'Forbidden',
    ],
  });
};

/**
 * Sentry request handler middleware
 * Must be added before all routes
 */
export const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler({
    user: ['id', 'username', 'email'],
    ip: true,
  });
};

/**
 * Sentry tracing middleware
 * Must be added before all routes
 */
export const sentryTracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

/**
 * Sentry error handler middleware
 * Must be added after all routes but before other error handlers
 */
export const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Only report server errors (5xx)
      return true;
    },
  });
};

/**
 * Capture exception manually
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (config.env === 'development') {
    return; // Don't send to Sentry in development
  }

  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture message manually
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) => {
  if (config.env === 'development') {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

/**
 * Set user context for error tracking
 */
export const setUser = (user: { id: string; username?: string; email?: string }) => {
  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
  });
};

/**
 * Clear user context
 */
export const clearUser = () => {
  Sentry.setUser(null);
};

/**
 * Add breadcrumb for tracking user actions
 */
export const addBreadcrumb = (message: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
};

/**
 * Start a transaction for performance monitoring
 */
export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

export default Sentry;
