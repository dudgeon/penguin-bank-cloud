# Penguin Bank MCP Server

A production-ready Model Context Protocol (MCP) server demonstrating AI-assisted banking interactions with real data persistence using Supabase.

## 🐧 Features

- **Real Banking Operations**: Account balances, transactions, and bill payments
- **Persistent Data**: All data stored in Supabase PostgreSQL database  
- **MCP Protocol**: Full compatibility with Claude Desktop and other MCP clients
- **Interactive Payments**: Bill payment workflow with payment options
- **Production Ready**: Deployed on Netlify Edge Functions with CI/CD

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase account
- Netlify account (for deployment)

### Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd penguin-bank-cloud
   npm install
   npm install -g supabase netlify-cli
   ```

2. **Set up Supabase**:
   ```bash
   supabase start
   supabase db reset
   npm run db:types
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start development server**:
   ```bash
   netlify dev
   ```

5. **Configure Claude Desktop**:
   Add to your Claude Desktop MCP settings:
   ```json
   {
     "mcpServers": {
       "penguin-bank": {
         "url": "http://localhost:8888/mcp",
         "transport": "http"
       }
     }
   }
   ```

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Claude Desktop │◄────────┤ Netlify Edge    │◄────────┤   Supabase      │
│  (MCP Client)   │  HTTP   │ Function        │  SQL    │   Database      │
│                 │         │ (MCP Server)    │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

## 🛠️ Available Tools

1. **hello_penguin** - Welcome message
2. **get_balance** - Get account balance
3. **get_recent_transactions** - List recent transactions
4. **show_bill** - Display bill details
5. **process_payment** - Pay bills with interactive options

## 📊 Database Schema

- **users** - User accounts
- **accounts** - Bank accounts (checking/savings)
- **transactions** - Transaction history
- **bills** - Payable bills
- **payment_history** - Payment records

## 🔧 Development Commands

```bash
npm run dev          # Start local development
npm run build        # Build project
npm run typecheck    # Type checking
npm run lint         # Run linter
npm test            # Run tests
npm run db:types    # Generate TypeScript types
npm run db:reset    # Reset database with seed data
```

## 🚀 Deployment

The project auto-deploys via GitHub Actions:

1. **Push to main branch** triggers production deployment
2. **Pull requests** create preview deployments
3. **Database migrations** run automatically
4. **Type checking** and tests must pass

Build Status: ![Deploy](https://github.com/dudgeon/penguin-bank-cloud/actions/workflows/deploy.yml/badge.svg)

### Required GitHub Secrets

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

## 🧪 Testing

Test the MCP server locally:

```bash
curl -X POST http://localhost:8888/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## 📚 Documentation

- [Project Architecture](docs/PROJECT_ARCHITECTURE.md)
- [Product Requirements](docs/penguin-bank-prd-v2.md)

## 🔒 Security

- Demo uses fixed user ID for simplicity
- Production deployment needs proper authentication
- RLS policies enabled but bypassed for demo
- Service role key used (rotate regularly)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details