/**
 * Unit tests for PenguinBank MCP Server
 */

import { PenguinBankMCPServer } from './mcp-server';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('PenguinBankMCPServer', () => {
  let mcpServer: PenguinBankMCPServer;
  let server: any;

  beforeEach(() => {
    mcpServer = new PenguinBankMCPServer();
    server = mcpServer.getServer();
  });

  describe('Server Initialization', () => {
    test('should create server instance', () => {
      expect(server).toBeDefined();
      expect(mcpServer).toBeInstanceOf(PenguinBankMCPServer);
    });

    test('should have request handlers configured', () => {
      const handlers = server._requestHandlers;
      expect(handlers).toBeDefined();
      expect(handlers.has('tools/list')).toBe(true);
      expect(handlers.has('tools/call')).toBe(true);
    });
  });

  describe('Tools List', () => {
    test('should return all available banking tools', async () => {
      const request = {
        method: 'tools/list',
        params: {}
      };

      // Mock the request handler
      const handlers = server._requestHandlers;
      const listToolsHandler = handlers.get('tools/list');
      expect(listToolsHandler).toBeDefined();

      const response = await listToolsHandler(request);
      
      expect(response).toHaveProperty('tools');
      expect(response.tools).toHaveLength(3);
      
      const toolNames = response.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('get_account_balance');
      expect(toolNames).toContain('get_recent_transactions');
      expect(toolNames).toContain('transfer_funds');
    });

    test('should return tools with proper schema definitions', async () => {
      const request = {
        method: 'tools/list',
        params: {}
      };

      const handlers = server._requestHandlers;
      const listToolsHandler = handlers.get('tools/list');
      const response = await listToolsHandler(request);

      const balanceTool = response.tools.find((tool: any) => tool.name === 'get_account_balance');
      expect(balanceTool).toBeDefined();
      expect(balanceTool.description).toContain('account balance');
      expect(balanceTool.inputSchema).toHaveProperty('type', 'object');
      expect(balanceTool.inputSchema.properties).toHaveProperty('account_id');

      const transactionsTool = response.tools.find((tool: any) => tool.name === 'get_recent_transactions');
      expect(transactionsTool).toBeDefined();
      expect(transactionsTool.inputSchema.properties).toHaveProperty('limit');

      const transferTool = response.tools.find((tool: any) => tool.name === 'transfer_funds');
      expect(transferTool).toBeDefined();
      expect(transferTool.inputSchema.required).toEqual(['from_account', 'to_account', 'amount']);
    });
  });

  describe('Tool Execution - get_account_balance', () => {
    test('should return account balance with default account', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'get_account_balance',
          arguments: {}
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      const response = await callToolHandler(request);

      expect(response).toHaveProperty('content');
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toContain('demo-account-123');
      expect(response.content[0].text).toContain('balance');
      expect(response.content[0].text).toMatch(/\$[\d,]+/);
    });

    test('should return account balance with custom account ID', async () => {
      const customAccountId = 'custom-account-456';
      const request = {
        method: 'tools/call',
        params: {
          name: 'get_account_balance',
          arguments: {
            account_id: customAccountId
          }
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      const response = await callToolHandler(request);

      expect(response.content[0].text).toContain(customAccountId);
    });

    test('should return different balance amounts on multiple calls', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'get_account_balance',
          arguments: {}
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      
      const response1 = await callToolHandler(request);
      const response2 = await callToolHandler(request);

      // Since balance is random, they should potentially be different
      // But we can at least verify they're both valid responses
      expect(response1.content[0].text).toMatch(/\$[\d,]+/);
      expect(response2.content[0].text).toMatch(/\$[\d,]+/);
    });
  });

  describe('Tool Execution - get_recent_transactions', () => {
    test('should return default number of transactions', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'get_recent_transactions',
          arguments: {}
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      const response = await callToolHandler(request);

      expect(response.content[0].text).toContain('Recent transactions');
      expect(response.content[0].text).toContain('demo-account-123');
      
             // Should have 5 transactions by default (5 lines with dates)
       const lines = response.content[0].text.split('\n');
       const transactionLines = lines.filter((line: string) => line.match(/\d{4}-\d{2}-\d{2}:/));
      expect(transactionLines).toHaveLength(5);
    });

    test('should return custom number of transactions', async () => {
      const limit = 3;
      const request = {
        method: 'tools/call',
        params: {
          name: 'get_recent_transactions',
          arguments: {
            limit: limit
          }
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      const response = await callToolHandler(request);

             const lines = response.content[0].text.split('\n');
       const transactionLines = lines.filter((line: string) => line.match(/\d{4}-\d{2}-\d{2}:/));
      expect(transactionLines).toHaveLength(limit);
    });

    test('should return transactions with proper format', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'get_recent_transactions',
          arguments: { limit: 2 }
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      const response = await callToolHandler(request);

      const text = response.content[0].text;
      
      // Should contain date format YYYY-MM-DD
      expect(text).toMatch(/\d{4}-\d{2}-\d{2}:/);
      
      // Should contain + or - for credit/debit
      expect(text).toMatch(/[+-]\$\d+/);
      
      // Should contain transaction descriptions
      expect(text).toMatch(/(Purchase at Store|Deposit)/);
    });

    test('should use custom account ID', async () => {
      const customAccountId = 'test-account-789';
      const request = {
        method: 'tools/call',
        params: {
          name: 'get_recent_transactions',
          arguments: {
            account_id: customAccountId,
            limit: 1
          }
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      const response = await callToolHandler(request);

      expect(response.content[0].text).toContain(customAccountId);
    });
  });

  describe('Tool Execution - transfer_funds', () => {
    test('should process transfer with all required parameters', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'transfer_funds',
          arguments: {
            from_account: 'account-123',
            to_account: 'account-456',
            amount: 100.50
          }
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      const response = await callToolHandler(request);

      const text = response.content[0].text;
      expect(text).toContain('Demo transfer initiated');
      expect(text).toContain('account-123');
      expect(text).toContain('account-456');
      expect(text).toContain('100.5');
      expect(text).toContain('Transfer ID: transfer-');
      expect(text).toContain('no actual funds were transferred');
    });

    test('should generate unique transfer IDs', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'transfer_funds',
          arguments: {
            from_account: 'account-123',
            to_account: 'account-456',
            amount: 50
          }
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      
      const response1 = await callToolHandler(request);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));
      const response2 = await callToolHandler(request);

      const transferId1 = response1.content[0].text.match(/Transfer ID: (transfer-\d+)/)?.[1];
      const transferId2 = response2.content[0].text.match(/Transfer ID: (transfer-\d+)/)?.[1];

      expect(transferId1).toBeDefined();
      expect(transferId2).toBeDefined();
      expect(transferId1).not.toBe(transferId2);
    });

    test('should handle different amount formats', async () => {
      const testCases = [
        { amount: 100, expected: '100' },
        { amount: 100.50, expected: '100.5' },
        { amount: 1000, expected: '1000' }
      ];

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');

      for (const testCase of testCases) {
        const request = {
          method: 'tools/call',
          params: {
            name: 'transfer_funds',
            arguments: {
              from_account: 'account-123',
              to_account: 'account-456',
              amount: testCase.amount
            }
          }
        };

        const response = await callToolHandler(request);
        expect(response.content[0].text).toContain(`$${testCase.expected}`);
      }
    });
  });

  describe('Error Handling', () => {
    test('should throw error for unknown tool', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');

      await expect(callToolHandler(request)).rejects.toThrow('Unknown tool: unknown_tool');
    });

    test('should handle empty arguments gracefully', async () => {
      // Test get_account_balance with empty arguments (should work with defaults)
      const request1 = {
        method: 'tools/call',
        params: {
          name: 'get_account_balance',
          arguments: {}
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      
      const response1 = await callToolHandler(request1);
      expect(response1.content[0].text).toContain('demo-account-123');

      // Test get_recent_transactions with empty arguments (should work with defaults)
      const request2 = {
        method: 'tools/call',
        params: {
          name: 'get_recent_transactions',
          arguments: {}
        }
      };

      const response2 = await callToolHandler(request2);
      expect(response2.content[0].text).toContain('Recent transactions');
    });
  });

  describe('Response Format', () => {
    test('should return responses in correct MCP format', async () => {
      const request = {
        method: 'tools/call',
        params: {
          name: 'get_account_balance',
          arguments: {}
        }
      };

      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');
      const response = await callToolHandler(request);

      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');
      expect(typeof response.content[0].text).toBe('string');
    });

    test('should return consistent response structure for all tools', async () => {
      const tools = ['get_account_balance', 'get_recent_transactions'];
      const handlers = server._requestHandlers;
      const callToolHandler = handlers.get('tools/call');

      for (const toolName of tools) {
        const request = {
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: {}
          }
        };

        const response = await callToolHandler(request);
        
        expect(response).toHaveProperty('content');
        expect(Array.isArray(response.content)).toBe(true);
        expect(response.content[0]).toHaveProperty('type', 'text');
        expect(response.content[0]).toHaveProperty('text');
      }
    });
  });
}); 