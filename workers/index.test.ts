/**
 * Unit tests for main Cloudflare Worker entry point
 */

import worker from './index';

// Mock environment for testing
const mockEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  ENVIRONMENT: 'test'
};

// Mock ExecutionContext
const mockCtx = {
  waitUntil: jest.fn(),
  passThroughOnException: jest.fn(),
  props: {}
} as ExecutionContext;

describe('Cloudflare Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check Endpoint', () => {
    test('should return health status on GET /health', async () => {
      const request = new Request('https://example.com/health', {
        method: 'GET'
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(data).toHaveProperty('mcp_server_ready', true);
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('metrics');
      expect(data.metrics).toHaveProperty('total_requests');
      expect(data.metrics).toHaveProperty('tool_executions');
    });
  });

  describe('MCP Protocol Endpoint', () => {
    test('should handle MCP initialize request', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      };

      const request = new Request('https://example.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mcpRequest)
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('id', 1);
      expect(data).toHaveProperty('result');
      expect(data.result).toHaveProperty('protocolVersion', '2024-11-05');
      expect(data.result).toHaveProperty('capabilities');
      expect(data.result.capabilities).toHaveProperty('tools');
    });

    test('should handle MCP tools/list request', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };

      const request = new Request('https://example.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mcpRequest)
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('id', 2);
      expect(data).toHaveProperty('result');
      expect(data.result).toHaveProperty('tools');
      expect(Array.isArray(data.result.tools)).toBe(true);
      expect(data.result.tools).toHaveLength(3);
      
      const toolNames = data.result.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('get_account_balance');
      expect(toolNames).toContain('get_recent_transactions');
      expect(toolNames).toContain('transfer_funds');
    });

    test('should handle MCP tools/call request', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_account_balance',
          arguments: {
            account_id: 'test-account-123'
          }
        }
      };

      const request = new Request('https://example.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mcpRequest)
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('id', 3);
      expect(data).toHaveProperty('result');
      expect(data.result).toHaveProperty('content');
      expect(Array.isArray(data.result.content)).toBe(true);
      expect(data.result.content[0]).toHaveProperty('type', 'text');
      expect(data.result.content[0].text).toContain('test-account-123');
    });

    test('should handle invalid JSON in MCP request', async () => {
      const request = new Request('https://example.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('id', null);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code', -32700);
      expect(data.error).toHaveProperty('message', 'Parse error');
    });

    test('should handle missing Content-Type header', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      };

      const request = new Request('https://example.com/mcp', {
        method: 'POST',
        body: JSON.stringify(mcpRequest)
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error.message).toContain('Content-Type');
    });
  });

  describe('SSE Endpoint', () => {
    test('should handle SSE connection request', async () => {
      const request = new Request('https://example.com/mcp', {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream'
        }
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/event-stream');
      expect(text).toContain('notifications/initialized');
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers in responses', async () => {
      const request = new Request('https://example.com/health', {
        method: 'GET'
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });

    test('should handle OPTIONS preflight requests', async () => {
      const request = new Request('https://example.com/mcp', {
        method: 'OPTIONS'
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown paths', async () => {
      const request = new Request('https://example.com/unknown', {
        method: 'GET'
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error', 'Not Found');
      expect(data).toHaveProperty('path', '/unknown');
    });

    test('should return 405 for unsupported methods on MCP endpoint', async () => {
      const request = new Request('https://example.com/mcp', {
        method: 'GET'
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data).toHaveProperty('error', 'Method Not Allowed');
      expect(data).toHaveProperty('allowed', ['POST', 'OPTIONS']);
    });

    test('should handle internal server errors gracefully', async () => {
      // Create a request that might cause an error
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'unknown_method',
        params: {}
      };

      const request = new Request('https://example.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mcpRequest)
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200); // MCP protocol returns 200 even for method errors
      expect(data).toHaveProperty('jsonrpc', '2.0');
      expect(data).toHaveProperty('id', 1);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });
  });

  describe('Request Logging', () => {
    test('should log request details', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const request = new Request('https://example.com/', {
        method: 'GET'
      });

      await worker.fetch(request, mockEnv, mockCtx);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Request received:')
      );

      consoleSpy.mockRestore();
    });

    test('should track performance metrics', async () => {
      const request1 = new Request('https://example.com/', {
        method: 'GET'
      });

      const request2 = new Request('https://example.com/', {
        method: 'GET'
      });

      // Make two requests
      await worker.fetch(request1, mockEnv, mockCtx);
      const response2 = await worker.fetch(request2, mockEnv, mockCtx);
      
      const data = await response2.json();

      expect(data.metrics.total_requests).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Session Management', () => {
    test('should handle Mcp-Session-Id header', async () => {
      const sessionId = 'test-session-123';
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' }
        }
      };

      const request = new Request('https://example.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Mcp-Session-Id': sessionId
        },
        body: JSON.stringify(mcpRequest)
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(200);
      // Session ID should be logged (we can't easily test the actual logging without more complex mocking)
    });
  });
}); 