# Penguin Bank MCP Server

Banking demo using Model Context Protocol (MCP) with real data persistence.

## Quick Start

```bash
npm install
supabase start
supabase db reset
npm run db:types
netlify dev
```

## Environment Variables

Create `.env` from `.env.example`:
```
SUPABASE_URL=your-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## Key Commands

- `npm run dev` - Start local server  
- `npm run build` - Build project
- `npm run typecheck` - Type checking
- `npm run lint` - Run linter
- `npm test` - Run tests
- `npm run db:types` - Generate TypeScript types
- `npm run db:reset` - Reset database with seed data
- `git push main` - Deploy to production

## Code Style

- Use official MCP TypeScript SDK (`@modelcontextprotocol/sdk`)
- ESM imports for Deno/Netlify Edge Functions
- Always handle database errors with try-catch
- Type all Supabase queries with generated types
- Commit after each feature with clear messages

## Project Structure

- `/netlify/edge-functions/mcp.ts` - MCP server implementation
- `/supabase/migrations/` - Database schema changes
- `/public/` - Landing page files
- `/.github/workflows/` - CI/CD pipeline

## MCP Tools

1. `hello_penguin` - Welcome message
2. `get_balance` - Get account balance
3. `get_recent_transactions` - List transactions
4. `show_bill` - Display bill details
5. `process_payment` - Pay a bill

## Database Tables

- `users` - User accounts
- `accounts` - Bank accounts (checking/savings)
- `transactions` - Transaction history
- `bills` - Payable bills
- `payment_history` - Payment records

## Testing MCP Locally

```bash
# Test with curl
curl -X POST http://localhost:8888/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Claude Desktop Integration

### Prerequisites
```bash
# Install mcp-remote proxy (globally)
npm install -g mcp-remote
```

### Configuration
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "penguin-bank": {
      "command": "mcp-remote",
      "args": ["https://penguinbank.cloud/mcp"]
    }
  }
}
```

### Steps to Connect
1. Install mcp-remote proxy: `npm install -g mcp-remote`
2. Create/update Claude Desktop config file with above configuration
3. Restart Claude Desktop completely (quit and reopen)
4. Look for MCP tools icon in Claude Desktop interface
5. Test with: "Hello from Penguin Bank" or "What's my balance?"

### Troubleshooting
- Ensure https://penguinbank.cloud/mcp returns valid JSON-RPC responses
- Check Claude Desktop > Settings > Developer for MCP server status
- Verify mcp-remote can connect: `mcp-remote https://penguinbank.cloud/mcp`

## Common Issues

- Type errors: Run `npm run db:types`
- CORS issues: Check edge function headers
- Database connection: Verify Supabase credentials

## Notes

- Demo uses fixed user ID: `550e8400-e29b-41d4-a716-446655440001`
- Elicitation workaround: Use two-step tool process
- Production needs: Auth, RLS policies, rate limiting

## Memory

- The .env file exists; check first before asking about secrets
- Always check the status of an action (e.g. starting a web server, a github action completing successfully, a deploy/build completing successfully) prior to telling the user that it 'should work'