/**
 * Structured logging utility for Cloudflare Workers
 * Provides consistent logging format with different levels and structured data
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
  userId?: string;
  sessionId?: string;
  toolName?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return entry;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLogEntry(level, message, context, error);
    const logString = JSON.stringify(logEntry);

    // Use appropriate console method based on level
    switch (level) {
      case 'debug':
        console.debug(logString);
        break;
      case 'info':
        console.info(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'error':
        console.error(logString);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  // Convenience method for request logging
  logRequest(method: string, path: string, requestId: string, context?: LogContext): void {
    this.info('Request received', {
      method,
      path,
      requestId,
      ...context
    });
  }

  // Convenience method for response logging
  logResponse(method: string, path: string, requestId: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info('Request completed', {
      method,
      path,
      requestId,
      statusCode,
      duration,
      ...context
    });
  }

  // Convenience method for tool execution logging
  logToolExecution(toolName: string, requestId: string, duration: number, success: boolean, context?: LogContext): void {
    const level = success ? 'info' : 'error';
    const message = success ? 'Tool executed successfully' : 'Tool execution failed';
    
    this.log(level, message, {
      toolName,
      requestId,
      duration,
      success,
      ...context
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance(); 