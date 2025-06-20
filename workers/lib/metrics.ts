/**
 * Performance metrics tracking for Cloudflare Workers
 * Tracks response times, connection counts, tool execution metrics, and error rates
 */

export interface MetricData {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

export interface RequestMetrics {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  userAgent?: string;
  origin?: string;
}

export interface ToolMetrics {
  toolName: string;
  requestId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  argumentsSize?: number;
  responseSize?: number;
}

export interface ConnectionMetrics {
  activeConnections: number;
  totalConnections: number;
  sseConnections: number;
  httpConnections: number;
}

export interface ErrorMetrics {
  errorType: string;
  errorCode?: number;
  count: number;
  timestamp: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private requestMetrics: Map<string, RequestMetrics> = new Map();
  private toolMetrics: Map<string, ToolMetrics> = new Map();
  private connectionMetrics: ConnectionMetrics = {
    activeConnections: 0,
    totalConnections: 0,
    sseConnections: 0,
    httpConnections: 0
  };
  private errorCounts: Map<string, number> = new Map();
  private performanceStats: {
    totalRequests: number;
    totalToolExecutions: number;
    averageResponseTime: number;
    averageToolExecutionTime: number;
    errorRate: number;
  } = {
    totalRequests: 0,
    totalToolExecutions: 0,
    averageResponseTime: 0,
    averageToolExecutionTime: 0,
    errorRate: 0
  };

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  // Request metrics
  startRequest(requestId: string, method: string, path: string, userAgent?: string, origin?: string): void {
    const metrics: RequestMetrics = {
      requestId,
      method,
      path,
      startTime: Date.now(),
      userAgent,
      origin
    };
    this.requestMetrics.set(requestId, metrics);
    this.performanceStats.totalRequests++;
    this.incrementConnectionCount(method);
  }

  endRequest(requestId: string, statusCode: number): void {
    const metrics = this.requestMetrics.get(requestId);
    if (metrics) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.statusCode = statusCode;
      
      // Update average response time
      this.updateAverageResponseTime(metrics.duration);
      
      // Track errors
      if (statusCode >= 400) {
        this.incrementErrorCount(`http_${statusCode}`);
      }
      
             // Clean up old metrics (keep only last 100 requests)
       if (this.requestMetrics.size > 100) {
         const oldestKey = this.requestMetrics.keys().next().value;
         if (oldestKey) {
           this.requestMetrics.delete(oldestKey);
         }
       }
    }
    this.decrementConnectionCount();
  }

  // Tool execution metrics
  startToolExecution(toolName: string, requestId: string, argumentsSize?: number): void {
    const metrics: ToolMetrics = {
      toolName,
      requestId,
      startTime: Date.now(),
      success: false,
      argumentsSize
    };
    this.toolMetrics.set(`${requestId}_${toolName}`, metrics);
    this.performanceStats.totalToolExecutions++;
  }

  endToolExecution(toolName: string, requestId: string, success: boolean, responseSize?: number): void {
    const key = `${requestId}_${toolName}`;
    const metrics = this.toolMetrics.get(key);
    if (metrics) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.success = success;
      metrics.responseSize = responseSize;
      
      // Update average tool execution time
      this.updateAverageToolExecutionTime(metrics.duration);
      
      // Track tool errors
      if (!success) {
        this.incrementErrorCount(`tool_${toolName}_error`);
      }
      
             // Clean up old metrics (keep only last 100 tool executions)
       if (this.toolMetrics.size > 100) {
         const oldestKey = this.toolMetrics.keys().next().value;
         if (oldestKey) {
           this.toolMetrics.delete(oldestKey);
         }
       }
    }
  }

  // Connection tracking
  private incrementConnectionCount(method: string): void {
    this.connectionMetrics.activeConnections++;
    this.connectionMetrics.totalConnections++;
    
    if (method === 'GET' && this.isSSERequest()) {
      this.connectionMetrics.sseConnections++;
    } else {
      this.connectionMetrics.httpConnections++;
    }
  }

  private decrementConnectionCount(): void {
    this.connectionMetrics.activeConnections = Math.max(0, this.connectionMetrics.activeConnections - 1);
  }

  private isSSERequest(): boolean {
    // This is a simplified check - in practice you'd check the Accept header
    return false;
  }

  // Error tracking
  incrementErrorCount(errorType: string): void {
    const current = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, current + 1);
    this.updateErrorRate();
  }

  // Performance calculations
  private updateAverageResponseTime(duration: number): void {
    const currentAvg = this.performanceStats.averageResponseTime;
    const totalRequests = this.performanceStats.totalRequests;
    this.performanceStats.averageResponseTime = 
      (currentAvg * (totalRequests - 1) + duration) / totalRequests;
  }

  private updateAverageToolExecutionTime(duration: number): void {
    const currentAvg = this.performanceStats.averageToolExecutionTime;
    const totalExecutions = this.performanceStats.totalToolExecutions;
    this.performanceStats.averageToolExecutionTime = 
      (currentAvg * (totalExecutions - 1) + duration) / totalExecutions;
  }

  private updateErrorRate(): void {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    this.performanceStats.errorRate = totalErrors / this.performanceStats.totalRequests;
  }

  // Get metrics
  getRequestMetrics(requestId: string): RequestMetrics | undefined {
    return this.requestMetrics.get(requestId);
  }

  getToolMetrics(toolName: string, requestId: string): ToolMetrics | undefined {
    return this.toolMetrics.get(`${requestId}_${toolName}`);
  }

  getConnectionMetrics(): ConnectionMetrics {
    return { ...this.connectionMetrics };
  }

  getPerformanceStats(): typeof this.performanceStats {
    return { ...this.performanceStats };
  }

  getErrorCounts(): Map<string, number> {
    return new Map(this.errorCounts);
  }

  // Get metrics summary for health checks
  getMetricsSummary(): {
    requests: {
      total: number;
      averageResponseTime: number;
      errorRate: number;
    };
    tools: {
      total: number;
      averageExecutionTime: number;
    };
    connections: ConnectionMetrics;
    errors: Record<string, number>;
  } {
    return {
      requests: {
        total: this.performanceStats.totalRequests,
        averageResponseTime: Math.round(this.performanceStats.averageResponseTime),
        errorRate: Math.round(this.performanceStats.errorRate * 100) / 100
      },
      tools: {
        total: this.performanceStats.totalToolExecutions,
        averageExecutionTime: Math.round(this.performanceStats.averageToolExecutionTime)
      },
      connections: this.getConnectionMetrics(),
      errors: Object.fromEntries(this.errorCounts)
    };
  }

  // Reset metrics (useful for testing)
  reset(): void {
    this.requestMetrics.clear();
    this.toolMetrics.clear();
    this.connectionMetrics = {
      activeConnections: 0,
      totalConnections: 0,
      sseConnections: 0,
      httpConnections: 0
    };
    this.errorCounts.clear();
    this.performanceStats = {
      totalRequests: 0,
      totalToolExecutions: 0,
      averageResponseTime: 0,
      averageToolExecutionTime: 0,
      errorRate: 0
    };
  }
}

// Export singleton instance
export const metrics = MetricsCollector.getInstance(); 