# Penguin Bank MCP Server - Product Requirements Document v3.0

## Executive Summary

Penguin Bank is a production-ready Model Context Protocol (MCP) server that demonstrates AI-assisted banking interactions through a friendly, Antarctic-themed interface. The project showcases MCP's latest features including interactive elicitation for payment workflows, real user data persistence with Supabase, and deployment on Netlify's edge infrastructure with a professional landing page at penguinbank.cloud.

## Project Overview

### Domains
- **Landing Page**: https://penguinbank.cloud
- **MCP Server**: https://mcp.penguinbank.cloud

### Tech Stack
- **MCP Server**: TypeScript on Netlify Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Landing Page**: HTML/CSS/JavaScript (static site)
- **CI/CD**: GitHub Actions with Supabase CLI
- **Protocol**: MCP with Elicitation support (2025-06-18 spec)

### Key Features
- 🐧 Friendly banking assistant personality
- 💳 Interactive payment flows using MCP Elicitation
- 🗄️ Persistent user data with Supabase
- 🌐 Globally distributed edge deployment
- 🔒 Secure, authenticated architecture
- 📱 Responsive landing page
- 🚀 Automated CI/CD pipeline

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Claude Desktop │◄────────┤ Netlify Edge    │◄────────┤   Supabase      │
│  (MCP Client)   │  HTTP   │ Function        │  SQL    │   Database      │
│                 │         │ (MCP Server)    │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                    │
                            ┌───────▼─────────┐
                            │                 │
                            │ Landing Page    │
                            │ (Static Site)   │
                            │                 │
                            └─────────────────┘
```

## Database Schema

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Accounts Table
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
  account_number TEXT UNIQUE NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0.00,
  available_balance DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, account_type)
);
```

### 3. Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  amount DECIMAL(12,2) NOT NULL,
  merchant TEXT,
  category TEXT,
  description TEXT,
  balance_after DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
```

### 4. Bills Table
```sql
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payee TEXT NOT NULL,
  statement_balance DECIMAL(12,2) NOT NULL,
  minimum_payment DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Payment History Table
```sql
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_type TEXT NOT NULL,
  confirmation_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Supabase Setup

### 1. Project Configuration

#### Environment Variables
```bash
# .env.local (for development)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GitHub Secrets (for CI/CD)
SUPABASE_ACCESS_TOKEN=your-personal-access-token
SUPABASE_DB_PASSWORD=your-database-password
SUPABASE_PROJECT_ID=your-project-ref
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_SITE_ID=your-netlify-site-id
```

### 2. Database Migrations

#### Initial Schema Migration
```sql
-- supabase/migrations/20250118000000_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
  account_number TEXT UNIQUE NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0.00,
  available_balance DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, account_type)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  amount DECIMAL(12,2) NOT NULL,
  merchant TEXT,
  category TEXT,
  description TEXT,
  balance_after DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills table
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payee TEXT NOT NULL,
  statement_balance DECIMAL(12,2) NOT NULL,
  minimum_payment DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_type TEXT NOT NULL,
  confirmation_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- For demo purposes, we'll use service role key
-- In production, implement proper auth
```

#### Seed Data
```sql
-- supabase/seed.sql

-- Demo user
INSERT INTO users (id, email, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'demo@penguinbank.cloud', 'Demo Penguin');

-- Demo accounts
INSERT INTO accounts (user_id, account_type, account_number, balance, available_balance) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'checking', 'PB-CHK-001', 2456.78, 2456.78),
  ('550e8400-e29b-41d4-a716-446655440001', 'savings', 'PB-SAV-001', 15234.50, 15234.50);

-- Demo transactions (get account IDs from inserted data)
WITH checking_account AS (
  SELECT id FROM accounts 
  WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' 
  AND account_type = 'checking'
)
INSERT INTO transactions (account_id, transaction_type, amount, merchant, category, description, balance_after) 
SELECT 
  id,
  'debit',
  4.50,
  'Arctic Coffee Co',
  'dining',
  'Morning coffee',
  2456.78
FROM checking_account;

-- Demo bills
INSERT INTO bills (user_id, payee, statement_balance, minimum_payment, due_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Water Company', 125.50, 25.00, CURRENT_DATE + INTERVAL '14 days'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Electric Company', 187.25, 35.00, CURRENT_DATE + INTERVAL '18 days');
```

### 3. Type Generation

```typescript
// package.json scripts
{
  "scripts": {
    "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/database.ts"
  }
}
```

## CI/CD Pipeline Configuration

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Penguin Bank

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  SUPABASE_VERSION: 'latest'

jobs:
  # Test and type check
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: ${{ env.SUPABASE_VERSION }}
      
      - name: Generate types
        run: |
          supabase gen types typescript \
            --project-id ${{ secrets.SUPABASE_PROJECT_ID }} \
            > src/types/database.ts
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run typecheck
      
      - name: Run tests
        run: npm test
      
      - name: Build project
        run: npm run build

  # Deploy database migrations
  migrate:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/staging'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: ${{ env.SUPABASE_VERSION }}
      
      - name: Link Supabase project
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Push database migrations
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "y" | supabase db push --password ${{ secrets.SUPABASE_DB_PASSWORD }}
          else
            supabase db push --dry-run --password ${{ secrets.SUPABASE_DB_PASSWORD }}
          fi
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  # Deploy to Netlify
  deploy:
    needs: [test, migrate]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Netlify Preview
        if: github.event_name == 'pull_request'
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './public'
          functions-dir: './netlify/edge-functions'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from PR #${{ github.event.pull_request.number }}"
          enable-pull-request-comment: true
          enable-commit-comment: false
          overwrites-pull-request-comment: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
      
      - name: Deploy to Netlify Production
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './public'
          functions-dir: './netlify/edge-functions'
          production-deploy: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Production deploy ${{ github.sha }}"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
      
      - name: Create deployment status
        if: github.ref == 'refs/heads/main'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.repos.createDeploymentStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              deployment_id: context.payload.deployment.id,
              state: 'success',
              environment_url: 'https://penguinbank.cloud',
              description: 'Deployed to production'
            });
```

### 2. Local Development Workflow

```yaml
# .github/workflows/local-dev.yml
name: Local Development Setup

on:
  workflow_dispatch:

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - name: Instructions
        run: |
          echo "Local Development Setup:"
          echo "1. Install Supabase CLI: npm install -g supabase"
          echo "2. Login: supabase login"
          echo "3. Link project: supabase link --project-ref $SUPABASE_PROJECT_ID"
          echo "4. Start local: supabase start"
          echo "5. Run migrations: supabase db reset"
          echo "6. Start Netlify dev: netlify dev"
```

## Updated MCP Server Implementation

### TypeScript Implementation with Supabase

```typescript
// netlify/edge-functions/mcp.ts
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

// Types from generated database types
import type { Database } from '../../src/types/database.ts';

type Tables = Database['public']['Tables'];
type Account = Tables['accounts']['Row'];
type Transaction = Tables['transactions']['Row'];
type Bill = Tables['bills']['Row'];

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

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
    name: "pay_bill",
    description: "Pay a bill with interactive payment options",
    inputSchema: {
      type: "object",
      properties: {
        payee: { type: "string" }
      },
      required: ["payee"]
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
      
      case "pay_bill": {
        const payee = args.payee;
        
        // Get bill from database
        const { data: bill, error } = await supabase
          .from('bills')
          .select('*')
          .eq('user_id', DEMO_USER_ID)
          .eq('payee', payee)
          .eq('is_paid', false)
          .order('due_date', { ascending: true })
          .limit(1)
          .single();
        
        if (error || !bill) {
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
        
        // For elicitation, we need to return a special response
        // that triggers the elicitation flow
        const toolCallContent: ToolCallContent = {
          type: "tool_call",
          tool_name: "elicitation",
          arguments: {
            billId: bill.id,
            payee: payee,
            statement_balance: bill.statement_balance,
            minimum_payment: bill.minimum_payment,
            due_date: bill.due_date
          }
        };
        
        // Return content that indicates elicitation is needed
        const content: TextContent = {
          type: "text",
          text: `I found your bill for ${payee}. Let me help you make a payment.`
        };
        
        return { 
          content: [content],
          _meta: {
            elicitation_needed: true,
            bill_data: {
              id: bill.id,
              payee: payee,
              statement_balance: bill.statement_balance,
              minimum_payment: bill.minimum_payment,
              due_date: bill.due_date
            }
          }
        };
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

// Handle elicitation requests
server.setRequestHandler(CreateElicitationRequestSchema, async (request) => {
  // This would be called by the client when it detects elicitation is needed
  const { tool_name, tool_args } = request.params;
  
  if (tool_name === "pay_bill" && tool_args._meta?.elicitation_needed) {
    const billData = tool_args._meta.bill_data;
    
    return {
      prompt: `How much would you like to pay to ${billData.payee}?\n\nStatement Balance: ${billData.statement_balance}\nMinimum Payment: ${billData.minimum_payment}\nDue Date: ${new Date(billData.due_date).toLocaleDateString()}`,
      requestedSchema: {
        type: "object",
        properties: {
          payment_type: {
            type: "string",
            title: "Payment Type",
            description: "Choose your payment amount",
            enum: ["statement_balance", "minimum_payment", "custom_amount"]
          },
          custom_amount: {
            type: "number",
            title: "Custom Amount (if applicable)",
            description: "Enter amount if choosing custom",
            minimum: 0.01,
            maximum: 10000
          }
        },
        required: ["payment_type"]
      }
    };
  }
  
  throw new Error("Invalid elicitation request");
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
## Package Configuration for MCP TypeScript SDK

### package.json
```json
{
  "name": "penguin-bank-mcp",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "netlify dev",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts",
    "test": "vitest run",
    "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/database.ts",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0",
    "@supabase/supabase-js": "^2.45.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "supabase": "^1.150.0",
    "netlify-cli": "^17.0.0"
  }
}
```

### Note on Elicitation Implementation

**Important**: The elicitation feature in MCP is still evolving in the specification. The current TypeScript SDK (v0.6.0) doesn't have full built-in support for the elicitation flow as described in the latest spec. The implementation above shows a pattern for handling elicitation, but in practice, you would need to:

1. **Client-Side Handling**: The MCP client (e.g., Claude Desktop) needs to support elicitation
2. **Custom Protocol Extension**: Implement elicitation as a custom protocol extension
3. **Alternative Approach**: Use a two-step tool interaction:
   - First tool call returns available options
   - Second tool call with the selected option

Here's a more practical implementation for current SDK limitations:

### Phase 1: Repository Setup with Supabase Context

#### Initial Repository Structure (docs/PROJECT_ARCHITECTURE.md)
```markdown
# Penguin Bank Architecture

## Technology Stack
- **Frontend**: Static HTML/CSS/JS on Netlify
- **Backend**: TypeScript Edge Functions on Netlify
- **Database**: Supabase (PostgreSQL)
- **Protocol**: Model Context Protocol (MCP) v2025-06-18
- **CI/CD**: GitHub Actions

## Database Architecture
- PostgreSQL on Supabase
- 5 main tables: users, accounts, transactions, bills, payment_history
- Row Level Security (RLS) enabled
- Service role key for demo (auth in future)

## Key Features
1. Real-time account balances from database
2. Transaction history with categorization
3. Bill payment with elicitation workflow
4. Persistent data across sessions
5. Automated deployments with migrations

## Environment Variables Required
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ACCESS_TOKEN (CI/CD)
- SUPABASE_DB_PASSWORD (CI/CD)
- SUPABASE_PROJECT_ID (CI/CD)
- NETLIFY_AUTH_TOKEN (CI/CD)
- NETLIFY_SITE_ID (CI/CD)

## Development Workflow
1. Local Supabase instance for development
2. Migrations tracked in version control
3. Type generation from database schema
4. Automated testing and deployment
```

### Phase 2: Step-by-Step Claude Code Instructions

#### Step 1: Initialize Supabase Project
**Prompt to Claude Code:**
```
Initialize a Supabase-enabled TypeScript project:
1. Create package.json with Supabase dependencies
2. Set up TypeScript config for Deno/Netlify Edge
3. Create supabase directory structure
4. Add .env.example file with all required variables
5. Create initial migration file for the database schema

Use the schema from PROJECT_ARCHITECTURE.md. Include proper indexes and RLS setup.
```

#### Step 2: Database Migrations and Seed Data
**Prompt to Claude Code:**
```
Create Supabase migrations and seed data:
1. In supabase/migrations/, create the initial schema migration with all 5 tables
2. Add proper foreign key constraints and indexes
3. Create supabase/seed.sql with demo user and sample data
4. Add a GitHub Action workflow for database deployment
5. Include type generation script in package.json

Ensure the demo user has realistic banking data across all tables.
```

#### Step 3: Implement MCP Server with Database
**Prompt to Claude Code:**
```
Create the MCP server in netlify/edge-functions/mcp.ts:
1. Import Supabase client and MCP SDK
2. Implement all 5 tools with real database queries
3. Add proper error handling for database operations
4. Implement the pay_bill elicitation flow with transaction recording
5. Use database types for type safety

The server should handle real data persistence, updating balances after payments, and maintaining transaction history.
```

#### Step 4: CI/CD Pipeline Setup
**Prompt to Claude Code:**
```
Create comprehensive GitHub Actions workflows:
1. Main deployment workflow (.github/workflows/deploy.yml)
2. Database migration workflow with Supabase CLI
3. Type generation and checking
4. Preview deployments for PRs
5. Production deployment with migration verification

Include proper secret management and environment-specific deployments.
```

#### Step 5: Landing Page with Supabase Integration
**Prompt to Claude Code:**
```
Enhance the landing page to showcase Supabase integration:
1. Add a "Live Demo" section showing real-time data
2. Create a dashboard preview component
3. Add database schema visualization
4. Include setup instructions for Supabase
5. Add monitoring/status indicators

The page should communicate that this uses real persistent data.
```

#### Step 6: Documentation Update
**Prompt to Claude Code:**
```
Create comprehensive documentation:
1. README.md with Supabase setup instructions
2. docs/DATABASE.md explaining the schema and relations
3. docs/DEPLOYMENT.md for CI/CD pipeline
4. docs/LOCAL_DEVELOPMENT.md for dev environment
5. docs/TROUBLESHOOTING.md for common issues

Include screenshots placeholders and SQL examples.
```

### Phase 3: Testing & Security

#### Security Configuration
```typescript
// netlify/edge-functions/_shared/auth.ts
import { createClient } from '@supabase/supabase-js';

export async function authenticateUser(token?: string) {
  // For demo, use fixed user
  // In production, validate JWT token
  const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
  
  if (token) {
    // Validate token with Supabase Auth
    // Return real user ID
  }
  
  return { userId: DEMO_USER_ID, isDemo: true };
}

export function createSecureClient() {
  // Use service role key for demo
  // In production, use user's JWT
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### Local Development Setup

```markdown
## Local Development with Supabase

1. Install dependencies:
   ```bash
   npm install
   npm install -g supabase netlify-cli
   ```

2. Start Supabase locally:
   ```bash
   supabase start
   ```

3. Run migrations:
   ```bash
   supabase db reset  # This runs migrations + seed
   ```

4. Generate types:
   ```bash
   npm run db:types
   ```

5. Start Netlify dev server:
   ```bash
   netlify dev
   ```

6. Configure Claude Desktop:
   ```json
   {
     "mcpServers": {
       "penguin-bank-local": {
         "url": "http://localhost:8888/mcp",
         "transport": "http"
       }
     }
   }
   ```
```

## Environment Setup Guide

### 1. GitHub Secrets Configuration
```bash
# Required secrets for GitHub Actions:
SUPABASE_ACCESS_TOKEN    # From Supabase Dashboard > Account > Access Tokens
SUPABASE_DB_PASSWORD     # Database password from project settings
SUPABASE_PROJECT_ID      # Project ref from project settings
NETLIFY_AUTH_TOKEN       # From Netlify user settings
NETLIFY_SITE_ID          # From Netlify site settings
```

### 2. Netlify Environment Variables
```bash
# Set in Netlify Dashboard > Site Settings > Environment Variables
SUPABASE_URL             # Your Supabase project URL
SUPABASE_ANON_KEY        # Public anon key
SUPABASE_SERVICE_ROLE_KEY # Service role key (keep secure!)
```

### 3. Supabase Project Setup
1. Create new project at database.new
2. Save connection details
3. Enable Email auth (for future)
4. Create personal access token
5. Note project reference ID

## Migration Strategy

### Adding New Features
```bash
# 1. Create new migration
supabase migration new add_feature_name

# 2. Write SQL in generated file
# 3. Test locally
supabase db reset

# 4. Commit and push
git add .
git commit -m "Add feature_name migration"
git push

# 5. GitHub Actions will deploy automatically
```

## Production Considerations

1. **Authentication**: Implement proper user auth with Supabase Auth
2. **RLS Policies**: Add row-level security policies
3. **Rate Limiting**: Use Netlify's rate limiting
4. **Monitoring**: Add Sentry or similar
5. **Backups**: Enable Supabase point-in-time recovery
6. **Secrets**: Rotate keys regularly
7. **Scaling**: Monitor database connections

## Success Metrics

1. **Technical Success**
   - Database queries < 50ms
   - Zero data inconsistencies
   - 99.9% uptime
   - Successful CI/CD deployments

2. **User Experience**
   - Real-time balance updates
   - Persistent transaction history
   - Smooth elicitation flows
   - Professional data presentation

3. **Development Experience**
   - 5-minute local setup
   - Automated type safety
   - One-command deployments
   - Clear error messages

## Timeline

- **Week 1**: Database schema + migrations
- **Week 2**: MCP server with Supabase integration
- **Week 3**: CI/CD pipeline + testing
- **Week 4**: Polish, documentation, launch

## Future Enhancements

1. **Multi-user Support**: Real authentication system
2. **Advanced Features**: 
   - Budgeting tools
   - Spending analytics
   - Bill reminders
   - Investment tracking
3. **Mobile App**: React Native with Supabase
4. **Webhooks**: Real-time notifications
5. **AI Insights**: Spending pattern analysis