# Claude Desktop Configuration for Penguin Bank MCP

## MCP Server Information

- **Server URL**: `https://mcp.penguinbank.cloud`
- **Server Name**: Penguin Bank
- **Protocol Version**: 2024-11-05

## Available Tools

1. **hello_penguin** - Welcome message for Penguin Bank
2. **get_balance** - Get account balances for checking and savings accounts
3. **get_recent_transactions** - Get recent transactions for an account
4. **show_bill** - Display details for a specific bill
5. **process_payment** - Process a bill payment

## Configuration Steps

### For Remote MCP Server (Claude Desktop)

1. Open Claude Desktop
2. Go to **Settings > Integrations**
3. Add the Penguin Bank MCP server:
   - Server URL: `https://mcp.penguinbank.cloud`
   - The server will handle OAuth authentication automatically

### For Local Development (Alternative)

If you need to run the server locally for development:

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Claude Desktop by editing:
   - macOS/Linux: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%AppData%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "penguin-bank-local": {
      "command": "node",
      "args": ["/path/to/penguin-bank-cloud/mcp-proxy.js"]
    }
  }
}
```

## Testing the Connection

Once connected, you can test the integration by asking Claude:

- "Show me the Penguin Bank welcome message"
- "What's my account balance?"
- "Show me my recent transactions"
- "What bills do I have?"

## Demo Account

The MCP server uses a demo account with pre-populated data:
- User ID: `550e8400-e29b-41d4-a716-446655440001`
- Includes checking and savings accounts
- Sample transactions and bills

## OAuth Authentication

The server implements OAuth 2.1 with:
- Authorization endpoint: `https://mcp.penguinbank.cloud/auth`
- Token endpoint: `https://mcp.penguinbank.cloud/token`
- Dynamic Client Registration: `https://mcp.penguinbank.cloud/register`

## Troubleshooting

If the server doesn't appear or connect:

1. Check the browser console for CORS errors
2. Verify the server is accessible: 
   ```bash
   curl -X POST https://mcp.penguinbank.cloud \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
   ```
3. Ensure you're using the latest version of Claude Desktop
4. Check that OAuth authentication completes successfully