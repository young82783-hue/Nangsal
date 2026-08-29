/**
 * Lightweight Error Logging & Production Diagnostics Service
 * Captures real-time runtime exceptions, unhandled promise rejections,
 * and API/Firestore failure telemetry.
 */

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  type: 'runtime' | 'unhandled_rejection' | 'api' | 'firestore' | 'react_boundary';
  context?: Record<string, unknown>;
  url: string;
  userAgent: string;
}

class ErrorLoggerService {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 50;
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Capture global unhandled JavaScript errors
    window.addEventListener('error', (event: ErrorEvent) => {
      this.captureException(event.error || event.message, {
        type: 'runtime',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Capture unhandled promise rejections (e.g. failed async fetch or firestore calls)
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      let reason = event.reason;
      let message = 'Unhandled Promise Rejection';
      let stack: string | undefined;

      if (reason instanceof Error) {
        message = reason.message;
        stack = reason.stack;
      } else if (typeof reason === 'string') {
        message = reason;
      } else if (reason && typeof reason === 'object') {
        try {
          message = JSON.stringify(reason);
        } catch {
          message = String(reason);
        }
      }

      this.logError({
        id: `rej_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        message,
        stack,
        type: 'unhandled_rejection',
        context: { reason: String(reason) },
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    console.log('[ErrorLogger] Global error telemetry initialized.');
  }

  public captureException(error: Error | string | unknown, context?: Record<string, unknown>) {
    let message = 'Unknown error';
    let stack: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      try {
        message = JSON.stringify(error);
      } catch {
        message = String(error);
      }
    }

    const entry: ErrorLogEntry = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      message,
      stack,
      type: (context?.type as ErrorLogEntry['type']) || 'runtime',
      context,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    this.logError(entry);
  }

  public captureApiError(endpoint: string, status: number | string, error: unknown, payload?: unknown) {
    this.captureException(error, {
      type: 'api',
      endpoint,
      status,
      payload,
    });
  }

  private logError(entry: ErrorLogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Structured dev / prod console log with clear visual grouping
    console.groupCollapsed(
      `%c[ErrorLogger] %c${entry.type.toUpperCase()}: %c${entry.message.substring(0, 100)}`,
      'color: #d97706; font-weight: bold;',
      'color: #ef4444; font-weight: bold;',
      'color: inherit;'
    );
    console.error('Timestamp:', entry.timestamp);
    console.error('Type:', entry.type);
    console.error('URL:', entry.url);
    if (entry.context) console.error('Context:', entry.context);
    if (entry.stack) console.error('Stack trace:\n', entry.stack);
    console.groupEnd();
  }

  public getRecentLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
  }
}

export const errorLogger = new ErrorLoggerService();
