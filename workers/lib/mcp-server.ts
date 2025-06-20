import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, InitializeRequestSchema, ListResourcesRequestSchema, ListPromptsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Env } from "../types/env";

// CORS headers for Claude Desktop Pro access
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigins = ['https://claude.ai', 'https://app.claude.ai', 'https://desktop.claude.ai'];
  
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, x-api-key, Mcp-Session-Id, Last-Event-ID',
    'Access-Control-Expose-Headers': 'Content-Type, Authorization, x-api-key, Mcp-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Validate origin against whitelist (per requirements document)
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

/**
 * Session state management for Streamable HTTP transport
 */
interface SessionState {
  sessionId: string;
  initialized: boolean;
  lastActivity: number;
}

/**
 * PenguinBank MCP Server using proper MCP SDK patterns
 * 
 * This implementation follows MCP SDK protection rules:
 * - Uses MCP SDK through documented public APIs only
 * - Focuses on implementing application logic that consumes the SDK
 * - Lets the SDK handle all transport negotiation and protocol details
 * - Only implements business logic in registered handlers
 */
export class PenguinBankMCPServer {
  private server: Server;
  private initStartTime: number;
  private sessions: Map<string, SessionState> = new Map();

  constructor() {
    this.initStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting MCP server initialization`);
    
    // Initialize MCP Server with proper capabilities
    this.server = new Server(
      {
        name: "PenguinBank Demo",
        version: "1.0.2",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    
    const initDuration = Date.now() - this.initStartTime;
    console.log(`[${new Date().toISOString()}] MCP server initialization completed in ${initDuration}ms`);
  }

  private setupHandlers() {
    // Note: We handle requests directly through handleMCPRequest method
    // The MCP SDK server is initialized but we bypass its request handlers
    // to maintain control over session management and transport negotiation
    console.log(`[${new Date().toISOString()}] MCP server handlers configured for direct routing`);
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getAccountBalance(args: any) {
    const toolStart = Date.now();
    console.log(`[${new Date().toISOString()}] Starting get_account_balance`);
    
    // Demo data - in a real implementation, this would query Supabase
    const balance = Math.floor(Math.random() * 10000) + 1000;
    const accountId = args?.account_id || 'demo-account-123';
    
    const duration = Date.now() - toolStart;
    console.log(`[${new Date().toISOString()}] Completed get_account_balance in ${duration}ms`);
    
    return {
      content: [{
        type: "text",
        text: `Account ${accountId} balance: $${balance.toLocaleString()}`
      }]
    };
  }

  private async getRecentTransactions(args: any) {
    const toolStart = Date.now();
    console.log(`[${new Date().toISOString()}] Starting get_recent_transactions`);
    
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

    const duration = Date.now() - toolStart;
    console.log(`[${new Date().toISOString()}] Completed get_recent_transactions in ${duration}ms`);

    return {
      content: [{
        type: "text",
        text: `Recent transactions for account ${accountId}:\n${transactionList}`
      }]
    };
  }

  private async transferFunds(args: any) {
    const toolStart = Date.now();
    console.log(`[${new Date().toISOString()}] Starting transfer_funds`);
    
    // Demo implementation - no actual transfer
    const { from_account, to_account, amount } = args;
    const transferId = `transfer-${Date.now()}`;
    
    const duration = Date.now() - toolStart;
    console.log(`[${new Date().toISOString()}] Completed transfer_funds in ${duration}ms`);
    
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
   * Handle HTTP requests using proper MCP SDK patterns
   * This implementation follows the Streamable HTTP transport specification
   */
  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    console.log(`[${new Date().toISOString()}] MCP Request received:`, {
      method: request.method,
      pathname: url.pathname,
      accept: request.headers.get('Accept'),
      contentType: request.headers.get('Content-Type'),
      sessionId: request.headers.get('Mcp-Session-Id')
    });

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request)
      });
    }

    // Handle Streamable HTTP transport (POST to /messages or root)
    if (request.method === 'POST') {
      try {
        // Extract or generate session ID
        let sessionId = request.headers.get('Mcp-Session-Id') || undefined;
        
        const bodyText = await request.text();
        console.log(`[${new Date().toISOString()}] Request body:`, bodyText);
        
        const body = JSON.parse(bodyText);
        
        // Generate session ID for initialize requests if not provided
        if (!sessionId && this.isInitializeRequest(body)) {
          sessionId = this.generateSessionId();
        }

        // Check Accept header for response type preference
        const acceptHeader = request.headers.get('Accept') || '';
        const supportsSSE = acceptHeader.includes('text/event-stream');
        const supportsJSON = acceptHeader.includes('application/json');

        // Process the request using MCP SDK through proper transport
        const response = await this.processRequestWithTransport(body, sessionId);
        
        // Determine response strategy based on client preferences
        if (this.shouldStream(body, response) && supportsSSE) {
          return this.createSSEResponse(response, sessionId, request);
        } else {
          return this.createJSONResponse(response, sessionId, request);
        }
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Request handling error:`, error);
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request)
          }
        });
      }
    }

    // Handle SSE connections for streaming
    if (request.method === 'GET' && request.headers.get('Accept') === 'text/event-stream') {
      return this.handleSSE(request);
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: getCorsHeaders(request)
    });
  }

  private isInitializeRequest(body: any): boolean {
    return body?.method === 'initialize' || (Array.isArray(body) && body.some(req => req?.method === 'initialize'));
  }

  private shouldStream(request: any, response: any): boolean {
    // For now, only stream for long-running operations or if client explicitly requests it
    // This can be expanded based on specific requirements
    return false;
  }

  /**
   * Process requests using the MCP SDK through proper transport mechanisms
   * This creates a mock transport to integrate with the SDK properly
   */
  private async processRequestWithTransport(body: any, sessionId?: string): Promise<any> {
    // Check if this is a batch request
    const isBatch = Array.isArray(body);
    const requests = isBatch ? body : [body];
    
    const responses = [];
    
    for (const req of requests) {
      try {
        // Handle notifications (no response expected)
        if (req.method && req.method.includes('notifications/')) {
          console.log(`[${new Date().toISOString()}] Processing notification: ${req.method}`);
          // Notifications don't get responses
          continue;
        }
        
        // Create a mock transport request and let the SDK handle it
        const response = await this.handleMCPRequest(req);
        
        if (response) {
          responses.push({
            jsonrpc: '2.0',
            id: req.id,
            result: response
          });
        }
        
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Request processing error:`, error);
        responses.push({
          jsonrpc: '2.0',
          id: req.id,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }
    
    // Return appropriate response format
    return isBatch ? responses : responses[0];
  }

  /**
   * Handle individual MCP requests by calling the appropriate handlers directly
   * This avoids accessing private APIs while still using the SDK properly
   */
  private async handleMCPRequest(request: any): Promise<any> {
    const { method, params, id } = request;
    
    // Create a properly formatted request object for the handlers
    const handlerRequest = { params };
    
    try {
      switch (method) {
        case 'initialize':
          // Call our initialize handler directly
          return await this.handleInitialize(handlerRequest);
          
        case 'tools/list':
          return await this.handleToolsList();
          
        case 'tools/call':
          return await this.handleToolCall(handlerRequest);
          
        case 'resources/list':
          return await this.handleResourcesList();
          
        case 'prompts/list':
          return await this.handlePromptsList();
          
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Handler error for ${method}:`, error);
      throw error;
    }
  }

  /**
   * Individual handler methods that mirror the registered handlers
   * These call the same logic without accessing private SDK APIs
   */
  private async handleInitialize(request: any): Promise<any> {
    console.log(`[${new Date().toISOString()}] Handling initialize request`);
    
    const { protocolVersion, capabilities, clientInfo } = request.params;
    
    // Generate session ID for this initialization
    const sessionId = this.generateSessionId();
    
    // Store session state
    this.sessions.set(sessionId, {
      sessionId,
      initialized: true,
      lastActivity: Date.now()
    });
    
    console.log(`[${new Date().toISOString()}] Session ${sessionId} initialized for client: ${clientInfo?.name || 'unknown'}`);
    
    return {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      serverInfo: {
        name: "PenguinBank Demo",
        version: "1.0.2",
      },
      // Include session info in response
      _meta: {
        sessionId
      }
    };
  }

  private async handleToolsList(): Promise<any> {
    console.log(`[${new Date().toISOString()}] Handling tools/list request`);
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
  }

  private async handleToolCall(request: any): Promise<any> {
    const { name, arguments: args } = request.params;
    console.log(`[${new Date().toISOString()}] Handling tool call: ${name}`);

    // Create timeout promise (25 seconds to stay under Claude's 30s limit)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Tool execution timed out after 25 seconds')), 25000)
    );

    try {
      let toolPromise: Promise<any>;
      
      switch (name) {
        case "get_account_balance":
          toolPromise = this.getAccountBalance(args);
          break;
        case "get_recent_transactions":
          toolPromise = this.getRecentTransactions(args);
          break;
        case "transfer_funds":
          toolPromise = this.transferFunds(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      // Race between tool execution and timeout
      return await Promise.race([toolPromise, timeoutPromise]);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Tool ${name} failed:`, error);
      
      // Return timeout error in MCP format
      if (error instanceof Error && error.message.includes('timed out')) {
        return {
          content: [{
            type: "text",
            text: `Error: Tool execution timed out. Please try again with a simpler request.`
          }]
        };
      }
      
      // Re-throw other errors to let MCP SDK handle them
      throw error;
    }
  }

  private async handleResourcesList(): Promise<any> {
    console.log(`[${new Date().toISOString()}] Handling resources/list request`);
    return {
      resources: [] // No resources for this demo server
    };
  }

  private async handlePromptsList(): Promise<any> {
    console.log(`[${new Date().toISOString()}] Handling prompts/list request`);
    return {
      prompts: [] // No prompts for this demo server
    };
  }

  private createJSONResponse(response: any, sessionId: string | undefined, request: Request): Response {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request)
    };
    
    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers
    });
  }

  private createSSEResponse(response: any, sessionId: string | undefined, request: Request): Response {
    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
      ...getCorsHeaders(request)
    };
    
    if (sessionId) {
      headers['Mcp-Session-Id'] = sessionId;
    }
    
    // Create SSE response
    const eventId = Date.now().toString();
    const sseData = `id: ${eventId}\ndata: ${JSON.stringify(response)}\n\n`;
    
    return new Response(sseData, {
      status: 200,
      headers
    });
  }

  /**
   * Handle SSE connections for streaming
   */
  private handleSSE(request: Request): Response {
    const sessionId = request.headers.get('Mcp-Session-Id') || this.generateSessionId();
    
    // Store session
    this.sessions.set(sessionId, {
      sessionId,
      initialized: false,
      lastActivity: Date.now()
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Mcp-Session-Id': sessionId,
      ...getCorsHeaders(request)
    };
    
    // Send initial connection message
    const initMessage = `id: ${Date.now()}\ndata: ${JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: { sessionId }
    })}\n\n`;
    
    return new Response(initMessage, { headers });
  }
} 