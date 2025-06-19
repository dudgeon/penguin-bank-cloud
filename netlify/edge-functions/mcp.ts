import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Server } from 'https://esm.sh/@modelcontextprotocol/sdk@0.6.0/server/index.js';
import { 
  SSEServerTransport,
  StreamableHTTPServerTransport 
} from 'https://esm.sh/@modelcontextprotocol/sdk@0.6.0/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CreateElicitationRequestSchema,
  type Tool,
  type TextContent,
  type ToolCallContent
} from 'https://esm.sh/@modelcontextprotocol/sdk@0.6.0/types.js';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo user ID (in production, this would come from auth)
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

// Initialize MCP Server
const server = new Server(
  {
    name: "penguin-bank",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
      elicitation: {}
    }
  }
);

// Define tools
const tools: Tool[] = [
  {
    name: "hello_penguin",
    description: "Get a warm welcome from Penguin Bank",
    inputSchema: { 
      type: "object", 
      properties: {},
      required: []
    }
  },
  {
    name: "get_balance",
    description: "Get account balance from database",
    inputSchema: {
      type: "object",
      properties: {
        account_type: {
          type: "string",
          enum: ["checking", "savings"],
          default: "checking"
        }
      },
      required: []
    }
  },
  {
    name: "get_recent_transactions",
    description: "Get recent transactions from database",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          default: 5
        },
        account_type: {
          type: "string",
          enum: ["checking", "savings"],
          default: "checking"
        }
      },
      required: []
    }
  },
  {
    name: "show_bill",
    description: "Display bill details",
    inputSchema: {
      type: "object",
      properties: {
        payee: { 
          type: "string",
          description: "Name of the payee (e.g., 'Water Company', 'Electric Company')"
        }
      },
      required: ["payee"]
    }
  },
  {
    name: "process_payment",
    description: "Pay a bill with interactive payment options",
    inputSchema: {
      type: "object",
      properties: {
        payee: { 
          type: "string",
          description: "Name of the payee to pay"
        },
        payment_type: {
          type: "string",
          enum: ["statement_balance", "minimum_payment", "custom_amount"],
          description: "Type of payment to make"
        },
        custom_amount: {
          type: "number",
          minimum: 0.01,
          description: "Custom amount if payment_type is custom_amount"
        }
      },
      required: ["payee", "payment_type"]
    }
  }
];

// Register tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case "hello_penguin": {
        const content: TextContent = {
          type: "text",
          text: "🐧 Welcome to Penguin Bank! We're here to make your banking experience cool and simple. How can I help you today?"
        };
        return { content: [content] };
      }
      
      case "get_balance": {
        const accountType = args.account_type || "checking";
        
        // Query account from database
        const { data: account, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', DEMO_USER_ID)
          .eq('account_type', accountType)
          .single();
        
        if (error || !account) {
          const content: TextContent = {
            type: "text",
            text: `Sorry, I couldn't find your ${accountType} account. Please try again.`
          };
          return { content: [content] };
        }
        
        const content: TextContent = {
          type: "text",
          text: JSON.stringify({
            account_type: accountType,
            account_number: account.account_number,
            balance: account.balance,
            available_balance: account.available_balance,
            currency: "USD",
            as_of: new Date().toISOString()
          }, null, 2)
        };
        return { content: [content] };
      }
      
      case "get_recent_transactions": {
        const limit = args.limit || 5;
        const accountType = args.account_type || "checking";
        
        // First get the account
        const { data: account } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', DEMO_USER_ID)
          .eq('account_type', accountType)
          .single();
        
        if (!account) {
          const content: TextContent = {
            type: "text",
            text: `No ${accountType} account found.`
          };
          return { content: [content] };
        }
        
        // Get recent transactions
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('account_id', account.id)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error) {
          const content: TextContent = {
            type: "text",
            text: "Sorry, I couldn't retrieve your transactions."
          };
          return { content: [content] };
        }
        
        const formattedTransactions = transactions?.map(t => ({
          date: new Date(t.created_at).toLocaleDateString(),
          type: t.transaction_type,
          merchant: t.merchant || t.description,
          amount: t.transaction_type === 'debit' ? -t.amount : t.amount,
          category: t.category,
          balance_after: t.balance_after
        }));
        
        const content: TextContent = {
          type: "text",
          text: JSON.stringify(formattedTransactions, null, 2)
        };
        return { content: [content] };
      }
      
      case "show_bill": {
        const payee = args.payee;
        
        // Get bill from database
        const { data: bills, error } = await supabase
          .from('bills')
          .select('*')
          .eq('user_id', DEMO_USER_ID)
          .eq('payee', payee)
          .eq('is_paid', false)
          .order('due_date', { ascending: true });
        
        if (error || !bills || bills.length === 0) {
          // List available bills
          const { data: availableBills } = await supabase
            .from('bills')
            .select('payee')
            .eq('user_id', DEMO_USER_ID)
            .eq('is_paid', false);
          
          const payees = availableBills?.map(b => b.payee).join(", ") || "None";
          
          const content: TextContent = {
            type: "text",
            text: `Sorry, I couldn't find an unpaid bill for ${payee}. Available payees: ${payees}`
          };
          return { content: [content] };
        }
        
        const bill = bills[0];
        const content: TextContent = {
          type: "text",
          text: JSON.stringify({
            payee: bill.payee,
            statement_balance: bill.statement_balance,
            minimum_payment: bill.minimum_payment,
            due_date: bill.due_date,
            days_until_due: Math.ceil((new Date(bill.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          }, null, 2)
        };
        return { content: [content] };
      }
      
      case "process_payment": {
        const payee = args.payee;
        const paymentType = args.payment_type;
        const customAmount = args.custom_amount;
        
        // Get bill from database
        const { data: bill, error: billError } = await supabase
          .from('bills')
          .select('*')
          .eq('user_id', DEMO_USER_ID)
          .eq('payee', payee)
          .eq('is_paid', false)
          .order('due_date', { ascending: true })
          .limit(1)
          .single();
        
        if (billError || !bill) {
          const content: TextContent = {
            type: "text",
            text: `Sorry, I couldn't find an unpaid bill for ${payee}.`
          };
          return { content: [content] };
        }
        
        // Calculate payment amount
        let paymentAmount: number;
        switch (paymentType) {
          case "statement_balance":
            paymentAmount = Number(bill.statement_balance);
            break;
          case "minimum_payment":
            paymentAmount = Number(bill.minimum_payment);
            break;
          case "custom_amount":
            if (!customAmount || customAmount <= 0) {
              const content: TextContent = {
                type: "text",
                text: "Please provide a valid custom amount greater than 0."
              };
              return { content: [content] };
            }
            paymentAmount = customAmount;
            break;
          default:
            const content: TextContent = {
              type: "text",
              text: "Invalid payment type. Please choose 'statement_balance', 'minimum_payment', or 'custom_amount'."
            };
            return { content: [content] };
        }
        
        // Get checking account
        const { data: account } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', DEMO_USER_ID)
          .eq('account_type', 'checking')
          .single();
        
        if (!account || Number(account.balance) < paymentAmount) {
          const content: TextContent = {
            type: "text",
            text: `Insufficient funds. Available balance: $${account?.balance || 0}`
          };
          return { content: [content] };
        }
        
        // Process payment (in a transaction)
        const confirmationNumber = `PB${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const newBalance = Number(account.balance) - paymentAmount;
        
        // Update account balance
        await supabase
          .from('accounts')
          .update({ 
            balance: newBalance,
            available_balance: newBalance 
          })
          .eq('id', account.id);
        
        // Add transaction record
        await supabase
          .from('transactions')
          .insert({
            account_id: account.id,
            transaction_type: 'debit',
            amount: paymentAmount,
            merchant: payee,
            category: 'bill_payment',
            description: `Bill payment to ${payee}`,
            balance_after: newBalance
          });
        
        // Record payment
        await supabase
          .from('payment_history')
          .insert({
            bill_id: bill.id,
            account_id: account.id,
            amount: paymentAmount,
            payment_type: paymentType,
            confirmation_number: confirmationNumber
          });
        
        // Mark bill as paid if full amount
        if (paymentAmount >= Number(bill.statement_balance)) {
          await supabase
            .from('bills')
            .update({ is_paid: true })
            .eq('id', bill.id);
        }
        
        const content: TextContent = {
          type: "text",
          text: JSON.stringify({
            status: "success",
            message: `Payment of $${paymentAmount} to ${payee} has been processed successfully!`,
            confirmation_number: confirmationNumber,
            remaining_balance: newBalance,
            payment_amount: paymentAmount,
            payee: payee
          }, null, 2)
        };
        return { content: [content] };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    const content: TextContent = {
      type: "text",
      text: `Sorry, I encountered an error: ${error.message}`
    };
    return { content: [content] };
  }
});

// Export handler for Netlify Edge Function
export default async (request: Request) => {
  // Add CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };
  
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }
  
  try {
    // For Netlify Edge Functions, we'll use the streamable HTTP transport
    const transport = new StreamableHTTPServerTransport({
      path: "/mcp",
      enableCors: true
    });
    
    await server.connect(transport);
    
    // Handle the request
    const response = await transport.handle(request);
    
    return response;
  } catch (error) {
    return new Response(JSON.stringify({ 
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: error.message 
      }
    }), {
      status: 500,
      headers
    });
  }
};

export const config = {
  path: "/mcp/*"
};