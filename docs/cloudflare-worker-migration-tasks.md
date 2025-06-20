# Migrating MCP Server from Netlify Functions to Cloudflare Workers

Based on extensive research, here's a comprehensive, step-by-step migration guide for moving your MCP (Model Context Protocol) server from Netlify Functions to Cloudflare Workers while maintaining SSE support and all existing functionality.

## Pre-Migration Checklist

### Environment Setup and Prerequisites
- [ ] 1. Install Node.js 18+ and npm/yarn on your local machine
- [ ] 2. Create a Cloudflare account if you don't have one
- [ ] 3. Add your domains (penguinbank.cloud and mcp.penguinbank.cloud) to Cloudflare DNS
- [ ] 4. Install Wrangler CLI globally: `npm install -g wrangler@latest`
- [ ] 5. Authenticate Wrangler: `wrangler login`
- [ ] 6. Create a backup of your entire project
- [ ] 7. Document all current environment variables from Netlify dashboard

### API Token and Secrets Preparation
- [ ] 8. Generate Cloudflare API token with "Edit Cloudflare Workers" permissions
- [ ] 9. Save API token securely for GitHub Actions: `CLOUDFLARE_API_TOKEN`
- [ ] 10. Get your Cloudflare Account ID from dashboard
- [ ] 11. List all Supabase credentials currently in use:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_KEY` (if used)
- [ ] 12. Review [official Anthropic MCP remote server requirements](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers)
- [ ] 13. Study [TypeScript SDK server examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/server) for implementation patterns
- [ ] 14. Review [Cloudflare's official MCP server guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) and authless template
- [ ] 15. Consider using Cloudflare's authless template: `npm create cloudflare@latest -- my-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless`

## Project Structure Setup

### Initialize Cloudflare Workers Project
- [ ] 16. **Option A - Use Cloudflare's Template**: Create new MCP server using official template:
  ```bash
  npm create cloudflare@latest -- penguin-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless
  ```
- [ ] 17. **Option B - Manual Setup**: Create a new `workers` directory in your project root
- [ ] 18. Create `wrangler.toml` in project root with initial configuration:
```toml
name = "mcp-server"
main = "workers/index.ts"
compatibility_date = "2024-06-20"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "development"

[build]
command = "npm run build:workers"
watch_paths = ["workers/**/*.ts", "workers/**/*.js"]

[env.production]
name = "mcp-server-prod"
routes = [
  { pattern = "mcp.penguinbank.cloud", custom_domain = true }
]

[env.staging]
name = "mcp-server-staging"
```

### TypeScript Configuration
- [ ] 19. Create `workers/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] 20. Install Cloudflare Workers TypeScript types:
```bash
npm install --save-dev @cloudflare/workers-types
```

- [ ] 21. Generate runtime types: `npx wrangler types`

## Code Migration

### Convert Netlify Functions to Workers Format
- [ ] 17. Create `workers/index.ts` as the main entry point following [TypeScript SDK examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/server)
- [ ] 18. Migrate `/netlify/functions/mcp.js` to Workers format:
  - [ ] Change from `exports.handler = async (event, context) => {}` to `export default { async fetch(request, env, ctx) {} }`
  - [ ] Convert `event.queryStringParameters` to `new URL(request.url).searchParams`
  - [ ] Convert `event.headers` to `request.headers`
  - [ ] Replace `process.env.VAR` with `env.VAR`
  - [ ] Update response format from `{ statusCode, body }` to `new Response(body, { status })`
  - [ ] Remove all authentication/OAuth code (authless server implementation)

### SSE Implementation Migration
- [ ] 19. Create `workers/lib/sse.ts` for SSE utilities:
```typescript
export async function handleSSE(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Accel-Buffering': 'no'
  };

  // Handle client disconnect
  ctx.waitUntil(
    new Promise<void>((resolve) => {
      request.signal.addEventListener('abort', () => {
        writer.close();
        resolve();
      });
    })
  );

  return new Response(readable, { headers });
}
```

- [ ] 20. Migrate `/netlify/functions/mcp-sse.js` SSE logic:
  - [ ] Update to use TransformStream pattern
  - [ ] Implement heartbeat mechanism (every 30 seconds)
  - [ ] Add proper error handling and connection cleanup
  - [ ] Ensure JSON-RPC message format compliance

### MCP Protocol Implementation
- [ ] 21. Create `workers/lib/mcp-server.ts`:
```typescript
import { WorkerEntrypoint } from 'cloudflare:workers';

export class MCPServer extends WorkerEntrypoint<Env> {
  async initialize(request: Request): Promise<Response> {
    // Handle MCP initialization
  }

  async handleRequest(request: Request): Promise<Response> {
    // Route to appropriate handler based on JSON-RPC method
  }
}
```

- [ ] 22. Implement MCP protocol handlers (authless server):
  - [ ] Initialize handler with capability negotiation
  - [ ] Tool execution handlers for banking demo
  - [ ] Resource access handlers
  - [ ] Prompt management handlers
  - [ ] Shutdown handler
  - [ ] Ensure compatibility with Claude.ai, Claude Desktop, and mobile apps

### Static Assets Configuration
- [ ] 23. Update `wrangler.toml` to serve static files:
```toml
[assets]
directory = "./public"
binding = "ASSETS"
```

- [ ] 24. Update main handler to serve static assets:
```typescript
if (url.pathname === '/' || url.pathname === '/index.html') {
  return env.ASSETS.fetch(request);
}
```

## Environment Variables and Secrets

### Local Development Setup
- [ ] 25. Create `.dev.vars` file in project root:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

- [ ] 26. Create `.dev.vars.production` for production secrets
- [ ] 27. Add `.dev.vars*` to `.gitignore`

### Production Secrets Setup (Simplified for Authless Server)
- [ ] 28. Add Supabase secrets via Wrangler CLI:
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_KEY
```

- [ ] 29. Verify secrets are set: `wrangler secret list`
- [ ] 30. No OAuth or authentication secrets required (authless implementation)

## GitHub Actions Configuration

### Update CI/CD Pipeline
- [ ] 30. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run typecheck

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - name: Deploy to Staging
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - name: Deploy to Production
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
```

- [ ] 31. Add GitHub secrets:
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`

### Update Package.json Scripts
- [ ] 32. Add/update npm scripts:
```json
{
  "scripts": {
    "dev": "wrangler dev --local",
    "dev:remote": "wrangler dev --remote",
    "build:workers": "tsc -p workers/tsconfig.json",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging",
    "deploy:production": "wrangler deploy --env production",
    "tail": "wrangler tail",
    "typecheck": "tsc --noEmit"
  }
}
```

## Custom Domain Configuration

### DNS and SSL Setup
- [ ] 33. In Cloudflare dashboard, verify domains are active
- [ ] 34. Deploy worker first: `npm run deploy:production`
- [ ] 35. Configure custom domains in Cloudflare dashboard:
  - [ ] Go to Workers & Pages → Your Worker → Settings → Domains & Routes
  - [ ] Add custom domain: `mcp.penguinbank.cloud`
  - [ ] Verify DNS records are created automatically
  - [ ] Wait for SSL certificate provisioning (usually instant)

### Alternative: Configure via Wrangler
- [ ] 36. Update `wrangler.toml` with routes:
```toml
[env.production]
routes = [
  { pattern = "mcp.penguinbank.cloud", custom_domain = true },
  { pattern = "penguinbank.cloud", custom_domain = true }
]
```

## Testing and Validation

### Local Testing
- [ ] 37. Start local development server: `npm run dev`
- [ ] 38. Test MCP endpoints at `http://localhost:8787`
- [ ] 39. Test authless server connection (no authentication required)
- [ ] 40. Create SSE test client:
```javascript
// test-sse.js
const EventSource = require('eventsource');
const eventSource = new EventSource('http://localhost:8787/sse');

eventSource.onmessage = (event) => {
  console.log('Received:', event.data);
};

eventSource.onerror = (error) => {
  console.error('Error:', error);
};
```

- [ ] 41. Test all MCP protocol operations:
  - [ ] Initialize connection (no auth)
  - [ ] Execute banking demo tools
  - [ ] Access resources
  - [ ] Handle disconnections

### Integration Testing
- [ ] 41. Create integration tests in `workers/__tests__/`:
```typescript
import { unstable_dev } from 'wrangler';

describe('MCP Server', () => {
  let worker;

  beforeAll(async () => {
    worker = await unstable_dev('workers/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  test('SSE endpoint connects', async () => {
    const response = await worker.fetch('/sse');
    expect(response.headers.get('content-type')).toBe('text/event-stream');
  });
});
```

### Staging Deployment Testing
- [ ] 42. Deploy to staging: `npm run deploy:staging`
- [ ] 43. Test authless server on staging environment
- [ ] 44. Verify Supabase connections work correctly
- [ ] 45. Test with [MCP inspector tool](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers):
  ```bash
  npx @modelcontextprotocol/inspector@latest
  # Then open http://localhost:5173 and connect to your server
  ```
- [ ] 46. Test with [Cloudflare AI Playground](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) (remote MCP client)
- [ ] 47. Test with Claude Desktop using [mcp-remote proxy](https://developers.cloudflare.com/agents/guides/remote-mcp-server/):
  ```json
  {
    "mcpServers": {
      "penguinbank": {
        "command": "npx",
        "args": ["mcp-remote", "https://your-worker.workers.dev/sse"]
      }
    }
  }
  ```
- [ ] 48. Monitor logs: `npm run tail -- --env staging`

## Production Deployment

### Final Migration Steps
- [ ] 49. Deploy to production: `npm run deploy:production` or `npx wrangler deploy`
- [ ] 50. Test authless server on production
- [ ] 51. Verify Claude.ai and Claude Desktop can connect using [mcp-remote proxy](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)
- [ ] 52. Test with [Cloudflare AI Playground](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) for remote MCP client validation
- [ ] 53. Test all banking demo tools work correctly
- [ ] 54. Monitor production logs: `npm run tail -- --env production`
- [ ] 55. Set up Cloudflare Analytics and observability

### Post-Migration Cleanup
- [ ] 56. Verify all functionality works on Cloudflare Workers
- [ ] 57. Update documentation with new authless server deployment process
- [ ] 58. Remove Netlify-specific configuration files
- [ ] 59. Remove any remaining authentication code
- [ ] 60. Update README with Cloudflare Workers instructions and [official MCP server guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)
- [ ] 61. Archive or remove `/netlify/functions` directory

## Common Issues and Solutions

### Troubleshooting Checklist
- [ ] 62. If SSE connections drop:
  - [ ] Verify `X-Accel-Buffering: no` header is set
  - [ ] Check heartbeat implementation (30-second intervals)
  - [ ] Ensure proper connection cleanup on abort

- [ ] 63. If environment variables aren't accessible:
  - [ ] Verify Supabase secrets are set for correct environment
  - [ ] Check `env` parameter usage in handlers
  - [ ] Ensure `.dev.vars` exists for local development

- [ ] 64. If Claude.ai cannot connect:
  - [ ] Verify authless server is properly configured
  - [ ] Test with [MCP inspector tool](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers)
  - [ ] Use [mcp-remote proxy](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) for Claude Desktop connection
  - [ ] Check CORS headers for Claude.ai domains
  - [ ] Verify dual transport support (SSE + Streamable HTTP)

- [ ] 65. If custom domains don't work:
  - [ ] Verify domain is active in Cloudflare
  - [ ] Check DNS propagation
  - [ ] Ensure worker is deployed before adding domain

- [ ] 66. If TypeScript errors occur:
  - [ ] Run `npx wrangler types` to generate types
  - [ ] Update imports to use `@cloudflare/workers-types`
  - [ ] Check `moduleResolution: "bundler"` in tsconfig
  - [ ] Follow [TypeScript SDK examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/server)
  - [ ] Consider using [Cloudflare's authless template](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)

- [ ] 67. Monitor and optimize:
  - [ ] Set up Cloudflare Web Analytics
  - [ ] Configure Workers Analytics
  - [ ] Monitor CPU time usage (limits apply)
  - [ ] Check concurrent connection limits (100 max)
  - [ ] Test with [Cloudflare AI Playground](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) for validation

This comprehensive checklist ensures a smooth migration from Netlify Functions to Cloudflare Workers while maintaining all MCP server functionality, SSE support, and integration with existing services like Supabase.