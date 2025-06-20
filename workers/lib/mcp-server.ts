import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Env } from "../types/env";

// CORS headers for Claude Desktop Pro access
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigins = ['https://claude.ai', 'https://app.claude.ai'];
  
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Set origin dynamically to support credentials
  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  } else {
    // Fallback for non-browser requests or development
    corsHeaders['Access-Control-Allow-Origin'] = '*';
    // Remove credentials when using wildcard origin
    delete corsHeaders['Access-Control-Allow-Credentials'];
  }

  return corsHeaders;
}

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: any;
}

/**
 * PenguinBank MCP Server using the official MCP SDK
 * 
 * This provides banking demo tools using the standard MCP protocol.
 */
export class PenguinBankMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "PenguinBank Demo",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  private setupTools() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_account_balance",
            description: "Get the current account balance for the demo account",
            inputSchema: {
              type: "object",
              properties: {
                account_id: {
                  type: "string",
                  description: "Account ID (optional, defaults to demo account)"
                }
              }
            }
          },
          {
            name: "get_recent_transactions",
            description: "Get recent transactions for the demo account",
            inputSchema: {
              type: "object",
              properties: {
                account_id: {
                  type: "string",
                  description: "Account ID (optional, defaults to demo account)"
                },
                limit: {
                  type: "number",
                  description: "Number of transactions to return (default: 5)"
                }
              }
            }
          },
          {
            name: "transfer_funds",
            description: "Transfer funds between accounts (demo only - no actual transfer occurs)",
            inputSchema: {
              type: "object",
              properties: {
                from_account: {
                  type: "string",
                  description: "Source account ID"
                },
                to_account: {
                  type: "string",
                  description: "Destination account ID"
                },
                amount: {
                  type: "number",
                  description: "Amount to transfer"
                }
              },
              required: ["from_account", "to_account", "amount"]
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "get_account_balance":
          return this.getAccountBalance(args);
        case "get_recent_transactions":
          return this.getRecentTransactions(args);
        case "transfer_funds":
          return this.transferFunds(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async getAccountBalance(args: any) {
    // Demo data - in a real implementation, this would query Supabase
    const balance = Math.floor(Math.random() * 10000) + 1000;
    const accountId = args?.account_id || 'demo-account-123';
    
    return {
      content: [{
        type: "text",
        text: `Account ${accountId} balance: $${balance.toLocaleString()}`
      }]
    };
  }

  private async getRecentTransactions(args: any) {
    // Demo data - in a real implementation, this would query Supabase
    const accountId = args?.account_id || 'demo-account-123';
    const limit = args?.limit || 5;
    const transactions = [];
    
    for (let i = 0; i < limit; i++) {
      const amount = Math.floor(Math.random() * 500) - 250; // Random amount between -250 and 250
      const isDebit = amount < 0;
      transactions.push({
        id: `txn-${Date.now()}-${i}`,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: isDebit ? 'Purchase at Store' : 'Deposit',
        amount: Math.abs(amount),
        type: isDebit ? 'debit' : 'credit'
      });
    }

    const transactionList = transactions
      .map(t => `${t.date}: ${t.type === 'debit' ? '-' : '+'}$${t.amount} - ${t.description}`)
      .join('\n');

    return {
      content: [{
        type: "text",
        text: `Recent transactions for account ${accountId}:\n${transactionList}`
      }]
    };
  }

  private async transferFunds(args: any) {
    // Demo implementation - no actual transfer
    const { from_account, to_account, amount } = args;
    const transferId = `transfer-${Date.now()}`;
    
    return {
      content: [{
        type: "text",
        text: `Demo transfer initiated:\nTransfer ID: ${transferId}\nFrom: ${from_account}\nTo: ${to_account}\nAmount: $${amount}\n\nNote: This is a demo - no actual funds were transferred.`
      }]
    };
  }

  getServer() {
    return this.server;
  }

  /**
   * Handle HTTP request using MCP SDK transport
   */
  async handleRequest(request: Request): Promise<Response> {
    // For SSE connections - simplified implementation
    if (request.headers.get('Accept') === 'text/event-stream') {
      return new Response('data: {"jsonrpc":"2.0","method":"notifications/initialized"}\n\n', {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...getCorsHeaders(request)
        }
      });
    }

    // For regular HTTP POST requests
    if (request.method === 'POST') {
      try {
        const body = await request.json() as JsonRpcRequest;
        
        console.log('MCP Request received:', {
          method: body.method,
          id: body.id,
          hasId: body.id !== undefined,
          isNotification: body.method && body.method.startsWith('notifications/')
        });
        
        // Handle notifications (no response required)
        if (body.method && body.method.startsWith('notifications/')) {
          return new Response('', { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...getCorsHeaders(request)
            }
          });
        }

        // Use the server's request handlers
        const handlers = (this.server as any)._requestHandlers;
        const handler = handlers.get(body.method);
        
        if (handler) {
          const result = await handler(body);
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: body.id,
            result
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...getCorsHeaders(request)
            }
          });
        }

        // Method not found
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          error: {
            code: -32601,
            message: `Method not found: ${body.method}`
          }
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request)
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request)
          }
        });
      }
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: {
        ...getCorsHeaders(request)
      }
    });
  }
} 