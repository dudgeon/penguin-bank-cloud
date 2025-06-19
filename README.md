# Penguin Bank MCP Server

A production-ready Model Context Protocol (MCP) server demonstrating AI-assisted banking interactions with real data persistence using Supabase and Netlify Edge Functions.

## 🐧 Features

- **Real Banking Operations**: Account balances, transactions, and bill payments
- **Persistent Data**: All data stored in Supabase PostgreSQL database  
- **MCP Protocol**: Full compatibility with Claude Desktop and other MCP clients
- **Interactive Payments**: Bill payment workflow with validation
- **Edge Functions**: Fast, globally distributed on Netlify Edge Runtime (Deno)

## 🚀 Quick Start

### Prerequisites
- Supabase account
- Netlify account (for deployment)

### Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd penguin-bank-cloud
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Configure Claude Desktop**:
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
│  (MCP Client)   │  HTTP   │ Function (Deno) │  SQL    │   Database      │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

**Key Components:**
- **Edge Function**: Single `mcp.ts` file handling MCP protocol
- **Deno Runtime**: No build process, direct TypeScript execution
- **Supabase**: Cloud-first database with comprehensive banking schema

## 🛠️ Available Tools

1. **hello_penguin** - Welcome message
2. **get_balance** - Get account balance
3. **get_recent_transactions** - List recent transactions
4. **show_bill** - Display bill details
5. **process_payment** - Pay bills with validation

## 📊 Database Schema

- **users** - User accounts with profile data
- **accounts** - Bank accounts (checking/savings) with balances
- **transactions** - Complete transaction history with categories
- **bills** - Payable bills with due dates and autopay
- **payment_history** - Payment records with confirmations

## 🔧 Development Commands

```bash
npm run dev          # Start local development server
npm run db:migrate   # Push database migrations to cloud
npm run db:reset     # Reset cloud database with seed data
npm run db:link      # Link to Supabase project
```

## 🚀 Deployment

**Automatic deployment via GitHub Actions:**

1. **Push to main** → Triggers production deployment
2. **Pull requests** → Create preview deployments
3. **Database migrations** → Run automatically on main branch
4. **Zero build process** → Edge functions deploy directly

### Required GitHub Secrets

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

Build Status: ![Deploy](https://github.com/dudgeon/penguin-bank-cloud/actions/workflows/deploy.yml/badge.svg)

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
3. Make changes and test with `npm run dev`
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details