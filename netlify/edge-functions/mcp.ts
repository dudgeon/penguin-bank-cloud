import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// MCP Protocol Types
interface MCPRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id?: string | number;
}

interface MCPResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string | number;
}

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

// Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Demo user ID
const DEMO_USER_ID = "550e8400-e29b-41d4-a716-446655440001";

// MCP Tools Definition
const TOOLS: Tool[] = [
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
];

// Tool Implementations
async function helloPenguin(): Promise<string> {
  return "🐧 Welcome to Penguin Bank! I'm your AI banking assistant. I can help you:\n\n" +
    "• Check account balances\n" +
    "• View recent transactions\n" +
    "• Show bill details\n" +
    "• Process bill payments\n\n" +
    "How can I help you today?";
}

async function getBalance() {
  const { data: accounts, error } = await supabase
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
  const { data: accounts, error: accountError } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", DEMO_USER_ID)
    .eq("account_type", account_type)
    .single();

  if (accountError) {
    throw new Error(`Failed to find ${account_type} account: ${accountError.message}`);
  }

  // Get transactions
  const { data: transactions, error } = await supabase
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
  const { data: bills, error } = await supabase
    .from("bills")
    .select("*")
    .eq("user_id", DEMO_USER_ID)
    .ilike("payee", `%${payee}%`);

  if (error) {
    throw new Error(`Failed to fetch bills: ${error.message}`);
  }

  if (!bills || bills.length === 0) {
    // Get all bills as suggestions
    const { data: allBills } = await supabase
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
  const { data: account, error: accountError } = await supabase
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
  const { data: bill, error: billError } = await supabase
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

  const confirmation_number = `PB${crypto.randomUUID().replace(/-/g, '').substr(0, 12)}`;
  const new_balance = account.balance - amount;

  try {
    // Start transaction
    const { error: paymentError } = await supabase
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
    const { error: balanceError } = await supabase
      .from("accounts")
      .update({ balance: new_balance, available_balance: new_balance })
      .eq("id", account.id);

    if (balanceError) {
      throw new Error(`Failed to update balance: ${balanceError.message}`);
    }

    // Add transaction record
    const { error: txError } = await supabase
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

// Main MCP Handler
async function handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
  const { method, params, id } = request;

  try {
    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          result: {
            protocolVersion: "2025-06-18",
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: "penguin-bank",
              version: "1.0.0",
            },
          },
          id,
        };

      case "tools/list":
        return {
          jsonrpc: "2.0",
          result: { tools: TOOLS },
          id,
        };

      case "tools/call":
        const { name, arguments: args } = params;
        let result;

        switch (name) {
          case "hello_penguin":
            result = await helloPenguin();
            break;
          case "get_balance":
            result = await getBalance();
            break;
          case "get_recent_transactions":
            result = await getRecentTransactions(args?.account_type, args?.limit);
            break;
          case "show_bill":
            result = await showBill(args?.payee);
            break;
          case "process_payment":
            result = await processPayment(args?.payee, args?.amount, args?.account_type);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          jsonrpc: "2.0",
          result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
          id,
        };

      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error) {
    return {
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: error.message,
        data: { method, params },
      },
      id,
    };
  }
}

// Netlify Edge Function Handler
export default async (request: Request): Promise<Response> => {
  // Handle CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const mcpRequest: MCPRequest = await request.json();
    const mcpResponse = await handleMCPRequest(mcpRequest);

    return new Response(JSON.stringify(mcpResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    const errorResponse: MCPResponse = {
      jsonrpc: "2.0",
      error: {
        code: -32700,
        message: "Parse error",
        data: error.message,
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};