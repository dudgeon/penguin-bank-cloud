import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Server } from "https://esm.sh/@modelcontextprotocol/sdk@1.0.0/server/index.js";
import { StdioServerTransport } from "https://esm.sh/@modelcontextprotocol/sdk@1.0.0/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "https://esm.sh/@modelcontextprotocol/sdk@1.0.0/types.js";

// Supabase client - initialize on first use to avoid bundling issues
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing required Supabase environment variables");
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// Demo user ID
const DEMO_USER_ID = "550e8400-e29b-41d4-a716-446655440001";

// Create MCP Server instance
const server = new Server(
  {
    name: "penguin-bank",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register MCP Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "hello_penguin",
        description: "Welcome message for Penguin Bank",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_balance",
        description: "Get account balances for checking and savings accounts",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_recent_transactions",
        description: "Get recent transactions for an account",
        inputSchema: {
          type: "object",
          properties: {
            account_type: {
              type: "string",
              enum: ["checking", "savings"],
              description: "Type of account to get transactions for",
            },
            limit: {
              type: "number",
              description: "Number of transactions to retrieve (default: 10)",
              minimum: 1,
              maximum: 50,
            },
          },
        },
      },
      {
        name: "show_bill",
        description: "Display details for a specific bill",
        inputSchema: {
          type: "object",
          properties: {
            payee: {
              type: "string",
              description: "Name of the payee to show bill details for",
            },
          },
          required: ["payee"],
        },
      },
      {
        name: "process_payment",
        description: "Process a bill payment",
        inputSchema: {
          type: "object",
          properties: {
            payee: {
              type: "string",
              description: "Name of the payee to pay",
            },
            amount: {
              type: "number",
              description: "Amount to pay",
              minimum: 0.01,
            },
            account_type: {
              type: "string",
              enum: ["checking", "savings"],
              description: "Account to pay from",
            },
          },
          required: ["payee", "amount", "account_type"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "hello_penguin":
        return {
          content: [
            {
              type: "text",
              text: "🐧 Welcome to Penguin Bank! I'm your AI banking assistant. I can help you:\n\n" +
                "• Check account balances\n" +
                "• View recent transactions\n" +
                "• Show bill details\n" +
                "• Process bill payments\n\n" +
                "How can I help you today?",
            },
          ],
        };

      case "get_balance":
        const balanceResult = await getBalance();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(balanceResult, null, 2),
            },
          ],
        };

      case "get_recent_transactions":
        const transactionsResult = await getRecentTransactions(
          args?.account_type,
          args?.limit
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(transactionsResult, null, 2),
            },
          ],
        };

      case "show_bill":
        const billResult = await showBill(args?.payee);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(billResult, null, 2),
            },
          ],
        };

      case "process_payment":
        const paymentResult = await processPayment(
          args?.payee,
          args?.amount,
          args?.account_type
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(paymentResult, null, 2),
            },
          ],
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message}`
    );
  }
});

// Tool Implementation Functions

async function getBalance() {
  const { data: accounts, error } = await getSupabaseClient()
    .from("accounts")
    .select("account_type, account_number, balance, available_balance")
    .eq("user_id", DEMO_USER_ID);

  if (error) {
    throw new Error(`Failed to fetch balances: ${error.message}`);
  }

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found");
  }

  return {
    accounts: accounts.map(account => ({
      type: account.account_type,
      account_number: account.account_number,
      balance: `$${account.balance.toFixed(2)}`,
      available_balance: `$${account.available_balance.toFixed(2)}`,
    }))
  };
}

async function getRecentTransactions(account_type = "checking", limit = 10) {
  // Get account ID
  const { data: accounts, error: accountError } = await getSupabaseClient()
    .from("accounts")
    .select("id")
    .eq("user_id", DEMO_USER_ID)
    .eq("account_type", account_type)
    .single();

  if (accountError) {
    throw new Error(`Failed to find ${account_type} account: ${accountError.message}`);
  }

  // Get transactions
  const { data: transactions, error } = await getSupabaseClient()
    .from("transactions")
    .select("*")
    .eq("account_id", accounts.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return {
    account_type,
    transactions: transactions.map(tx => ({
      date: new Date(tx.created_at).toLocaleDateString(),
      type: tx.transaction_type,
      amount: `$${tx.amount.toFixed(2)}`,
      merchant: tx.merchant || "N/A",
      category: tx.category || "other",
      description: tx.description,
      balance_after: `$${tx.balance_after.toFixed(2)}`,
    }))
  };
}

async function showBill(payee: string) {
  const { data: bills, error } = await getSupabaseClient()
    .from("bills")
    .select("*")
    .eq("user_id", DEMO_USER_ID)
    .ilike("payee", `%${payee}%`);

  if (error) {
    throw new Error(`Failed to fetch bills: ${error.message}`);
  }

  if (!bills || bills.length === 0) {
    // Get all bills as suggestions
    const { data: allBills } = await getSupabaseClient()
      .from("bills")
      .select("payee")
      .eq("user_id", DEMO_USER_ID);
    
    const suggestions = allBills?.map(b => b.payee).join(", ") || "none";
    throw new Error(`No bills found for "${payee}". Available payees: ${suggestions}`);
  }

  return {
    bills: bills.map(bill => ({
      payee: bill.payee,
      statement_balance: `$${bill.statement_balance.toFixed(2)}`,
      minimum_payment: `$${bill.minimum_payment.toFixed(2)}`,
      due_date: new Date(bill.due_date).toLocaleDateString(),
      category: bill.category,
      account_number: bill.account_number || "N/A",
      is_paid: bill.is_paid,
      is_autopay: bill.is_autopay,
    }))
  };
}

async function processPayment(payee: string, amount: number, account_type: string) {
  // Get account
  const { data: account, error: accountError } = await getSupabaseClient()
    .from("accounts")
    .select("id, balance")
    .eq("user_id", DEMO_USER_ID)
    .eq("account_type", account_type)
    .single();

  if (accountError) {
    throw new Error(`Failed to find ${account_type} account: ${accountError.message}`);
  }

  // Check balance
  if (account.balance < amount) {
    throw new Error(`Insufficient funds. Available balance: $${account.balance.toFixed(2)}`);
  }

  // Get bill
  const { data: bill, error: billError } = await getSupabaseClient()
    .from("bills")
    .select("id, statement_balance, minimum_payment")
    .eq("user_id", DEMO_USER_ID)
    .ilike("payee", `%${payee}%`)
    .single();

  if (billError) {
    throw new Error(`Bill not found for payee: ${payee}`);
  }

  // Validate amount
  if (amount > bill.statement_balance) {
    throw new Error(`Payment amount $${amount.toFixed(2)} exceeds statement balance $${bill.statement_balance.toFixed(2)}`);
  }

  if (amount < bill.minimum_payment) {
    throw new Error(`Payment amount $${amount.toFixed(2)} is less than minimum payment $${bill.minimum_payment.toFixed(2)}`);
  }

  const confirmation_number = `PB${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
  const new_balance = account.balance - amount;

  try {
    // Start transaction
    const { error: paymentError } = await getSupabaseClient()
      .from("payment_history")
      .insert({
        bill_id: bill.id,
        account_id: account.id,
        amount: amount,
        payment_type: "one_time",
        confirmation_number: confirmation_number,
        status: "completed",
      });

    if (paymentError) {
      throw new Error(`Failed to record payment: ${paymentError.message}`);
    }

    // Update account balance
    const { error: balanceError } = await getSupabaseClient()
      .from("accounts")
      .update({ balance: new_balance, available_balance: new_balance })
      .eq("id", account.id);

    if (balanceError) {
      throw new Error(`Failed to update balance: ${balanceError.message}`);
    }

    // Add transaction record
    const { error: txError } = await getSupabaseClient()
      .from("transactions")
      .insert({
        account_id: account.id,
        transaction_type: "debit",
        amount: amount,
        merchant: payee,
        category: "bill_payment",
        description: `Bill payment to ${payee}`,
        balance_after: new_balance,
        reference_number: confirmation_number,
      });

    if (txError) {
      throw new Error(`Failed to record transaction: ${txError.message}`);
    }

    return {
      success: true,
      confirmation_number,
      amount_paid: `$${amount.toFixed(2)}`,
      payee,
      account_type,
      new_balance: `$${new_balance.toFixed(2)}`,
      payment_date: new Date().toISOString(),
    };

  } catch (error) {
    throw new Error(`Payment failed: ${error.message}`);
  }
}

// Custom transport for Netlify Edge Functions
class NetlifyMCPTransport {
  private _requestHandler: ((request: any) => Promise<any>) | null = null;

  setRequestHandler(handler: (request: any) => Promise<any>) {
    this._requestHandler = handler;
  }

  async handleRequest(request: any): Promise<any> {
    if (!this._requestHandler) {
      throw new Error("No request handler set");
    }
    return await this._requestHandler(request);
  }
}

const transport = new NetlifyMCPTransport();

// Connect the server to our custom transport
server.connect(transport as any);

// CORS headers for remote MCP server
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

// Session management
const sessions = new Map<string, { created: number; data: any }>();

function getOrCreateSession(request: Request): string {
  const sessionId = request.headers.get("Mcp-Session-Id") || crypto.randomUUID();
  
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      created: Date.now(),
      data: {}
    });
  }
  
  return sessionId;
}

// OAuth 2.1 metadata endpoint
async function handleOAuthMetadata(): Promise<Response> {
  const metadata = {
    issuer: "https://mcp.penguinbank.cloud",
    authorization_endpoint: "https://mcp.penguinbank.cloud/auth",
    token_endpoint: "https://mcp.penguinbank.cloud/token",
    registration_endpoint: "https://mcp.penguinbank.cloud/register",
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["read", "write"],
  };

  return new Response(JSON.stringify(metadata), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

// Handle OAuth endpoints
async function handleOAuthEndpoints(request: Request, pathname: string): Promise<Response> {
  if (pathname === "/.well-known/oauth-authorization-server") {
    return handleOAuthMetadata();
  }
  
  if (pathname === "/auth") {
    // Authorization endpoint - in production, implement proper OAuth flow
    const url = new URL(request.url);
    const redirectUri = url.searchParams.get("redirect_uri");
    const state = url.searchParams.get("state");
    const codeChallenge = url.searchParams.get("code_challenge");
    
    if (!redirectUri || !state) {
      return new Response("Missing required parameters", { 
        status: 400,
        headers: corsHeaders,
      });
    }
    
    // Generate auth code
    const authCode = crypto.randomUUID();
    
    // Store code challenge for verification (in production, use proper storage)
    if (codeChallenge) {
      sessions.set(authCode, { created: Date.now(), data: { codeChallenge } });
    }
    
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set("code", authCode);
    redirectUrl.searchParams.set("state", state);
    
    return Response.redirect(redirectUrl.toString(), 302);
  }
  
  if (pathname === "/token") {
    // Token exchange endpoint
    const formData = await request.formData();
    const code = formData.get("code");
    const codeVerifier = formData.get("code_verifier");
    
    if (!code) {
      return new Response(JSON.stringify({ error: "invalid_request" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    // In production, verify code challenge
    const token = {
      access_token: crypto.randomUUID(),
      token_type: "Bearer",
      expires_in: 3600,
    };
    
    return new Response(JSON.stringify(token), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  
  if (pathname === "/register") {
    // Dynamic Client Registration
    const registration = {
      client_id: crypto.randomUUID(),
      client_secret: crypto.randomUUID(),
      registration_access_token: crypto.randomUUID(),
      registration_client_uri: "https://mcp.penguinbank.cloud/register",
    };
    
    return new Response(JSON.stringify(registration), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  
  return new Response("Not Found", { 
    status: 404,
    headers: corsHeaders,
  });
}

// Netlify Edge Function Handler
export default async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Handle OAuth endpoints - only if not the main MCP endpoint
  if (pathname !== "/mcp" && (pathname.includes("auth") || pathname.includes("token") || pathname.includes("register") || pathname.includes(".well-known"))) {
    return handleOAuthEndpoints(request, pathname);
  }
  
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const mcpRequest = await request.json();
    const sessionId = getOrCreateSession(request);
    
    console.log("MCP Request:", JSON.stringify(mcpRequest, null, 2));
    
    // Handle initialization with session
    if (mcpRequest.method === "initialize") {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
          serverInfo: {
            name: "penguin-bank",
            version: "1.0.0",
            description: "Penguin Bank MCP Server with full banking functionality",
          },
          instructions: "This server provides banking tools for account management, transactions, bills, and payments.",
        },
        id: mcpRequest.id,
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Mcp-Session-Id": sessionId,
          ...corsHeaders,
        },
      });
    }

    // Handle tool list request
    if (mcpRequest.method === "tools/list") {
      const toolsResponse = await server.handleRequest({
        method: "tools/list",
        params: mcpRequest.params || {},
      });
      
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        result: toolsResponse,
        id: mcpRequest.id,
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Mcp-Session-Id": sessionId,
          ...corsHeaders,
        },
      });
    }

    // Handle tool call request
    if (mcpRequest.method === "tools/call") {
      const callResponse = await server.handleRequest({
        method: "tools/call", 
        params: mcpRequest.params,
      });

      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        result: callResponse,
        id: mcpRequest.id,
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Mcp-Session-Id": sessionId,
          ...corsHeaders,
        },
      });
    }

    // Unknown method
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: `Method not found: ${mcpRequest.method}`,
      },
      id: mcpRequest.id,
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error("MCP Error:", error);
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32700,
        message: "Parse error",
        data: error.message,
      },
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
};