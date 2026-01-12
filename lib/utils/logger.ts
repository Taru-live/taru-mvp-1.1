/**
 * Production logging utility
 * Logs in both development and production for monitoring
 * Can be extended to send to monitoring services (Sentry, LogRocket, etc.)
 */

export const logger = {
  log: (...args: unknown[]) => {
    // Log in both dev and prod for monitoring
    console.log(...args);
    // TODO: Send to monitoring service in production
    // Example: Sentry.captureMessage(args.join(' '), 'info');
  },

  debug: (...args: unknown[]) => {
    // Debug logs in both environments for monitoring
    console.debug(...args);
  },

  info: (...args: unknown[]) => {
    // Info logs for monitoring
    console.info(...args);
    // TODO: Send to monitoring service
    // Example: Sentry.captureMessage(args.join(' '), 'info');
  },

  warn: (...args: unknown[]) => {
    // Warnings should be logged in both dev and prod
    console.warn(...args);
    // TODO: Send to monitoring service
    // Example: Sentry.captureMessage(args.join(' '), 'warning');
  },

  error: (...args: unknown[]) => {
    // Errors should always be logged
    console.error(...args);
    // TODO: Send to error tracking service
    // Example: Sentry.captureException(args[0]);
  },
};
