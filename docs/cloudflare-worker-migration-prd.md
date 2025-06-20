# **Migration Plan: Netlify Functions to Cloudflare Workers (PenguinBank)**

This detailed checklist covers every step to move the MCP server from Netlify Functions to Cloudflare Workers, including code conversion, configuration, CI/CD setup, and cleanup. Follow each task carefully, **committing and testing frequently** before proceeding to the next.

**🎯 Key Update**: This migration implements an **authless remote MCP server** for public demo use, following [Anthropic's official remote server requirements](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers), [TypeScript SDK examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/server), and [Cloudflare's official MCP server guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/). No OAuth or authentication implementation required.

**📋 Cloudflare Template Option**: Consider using Cloudflare's official authless template: `npm create cloudflare@latest -- penguin-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless`

## **1\. Pre-Migration Checklist**

1.1 **Environment Setup and Prerequisites**

-   **1.1.1 Install Node.js 18+** on your machine (verify with node -v). If older, download from [nodejs.org](https://nodejs.org/) and install.
-   **1.1.2 Create a Cloudflare account** if you don’t have one: sign up at [dash.cloudflare.com](https://dash.cloudflare.com).
-   **1.1.3 Add domains to Cloudflare**: In the Cloudflare dashboard, add penguinbank.cloud and mcp.penguinbank.cloud as new sites. Ensure they are active (Cloudflare managing DNS). If needed, add dummy A/CNAME records so the status turns “Active.”
-   **1.1.4 Install Wrangler CLI** globally: run npm install -g wrangler@latest. This provides the wrangler command for Workers.
-   **1.1.5 Authenticate Wrangler**: run wrangler login and follow the prompts to connect to your Cloudflare account.
-   **1.1.6 Backup your project**: Make a copy or new Git branch of the current repo. This provides a restore point in case you need to revert.
-   **1.1.7 Document Netlify environment variables**: In Netlify’s dashboard (or .env files), list all variables (e.g. SUPABASE\_URL, SUPABASE\_ANON\_KEY, SUPABASE\_SERVICE\_KEY, etc.). You’ll recreate these in Cloudflare.
-   **Important:** **Commit** the current state before starting. Test any existing functionality so you know your baseline is working.

1.2 **API Token and Account Setup**

-   **1.2.1 Create a Cloudflare API token**: In Cloudflare Dashboard > “My Profile” > “API Tokens”, make a token with **Edit Cloudflare Workers** permission. Copy it.
-   **1.2.2 Save API token in GitHub**: In GitHub repo Settings → Secrets & variables → Actions, add a secret named CLOUDFLARE\_API\_TOKEN with the token value. (This is needed for GitHub Actions to deploy.)
-   **1.2.3 Get your Cloudflare Account ID**: From Cloudflare Dashboard > Overview (or profile), copy the Account ID. Add it as a GitHub secret named CLOUDFLARE\_ACCOUNT\_ID.
-   **1.2.4 List Supabase (and other) credentials**: Note all Supabase-related keys (URL, anon key, service key) and any other API secrets your app uses. You will add these as Cloudflare secrets or variables later.

Commit and test after this step (e.g., run wrangler whoami to confirm Wrangler is connected).

## **2\. Project Structure and Configuration**

2.1 **Choose Your Approach**

**Option A - Use Cloudflare's Official Template (Recommended)**
-   Run: `npm create cloudflare@latest -- penguin-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless`
-   This creates a complete authless MCP server with best practices from [Cloudflare's guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)
-   Adapt the generated code to include your existing banking tools and Supabase integration

**Option B - Manual Migration**
-   In the project root, create a folder named workers/. This will hold all Cloudflare Worker code (e.g. workers/index.ts, workers/lib/, etc.)

2.2 **Initialize wrangler.toml**

-   Create wrangler.toml in project root with content similar to:

```
name = "mcp-server"
main = "workers/index.ts"
compatibility_date = "2025-06-20"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "development"

[build]
command = "npm run build:workers"
watch_dir = "workers"

[env.production]
name = "mcp-server-prod"
routes = [
  { pattern = "mcp.penguinbank.cloud/*", custom_domain = true },
  { pattern = "penguinbank.cloud/*", custom_domain = true }
]

[env.staging]
name = "mcp-server-staging"
```

-   Adjust compatibility\_date to today’s date. The name fields identify your Worker. The \[env.production\] section lists custom domains (routes).
-   **Commit** this config file.

2.3 **TypeScript Setup** (if using TS)

-   Create workers/tsconfig.json:

```
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["workers/**/*.ts"]
}
```

-
-   Install Cloudflare types: npm install --save-dev @cloudflare/workers-types.
-   Run npx wrangler types to generate type declarations for Worker bindings.
-   **Commit and test**: Run npm run build:workers to ensure no type errors.

2.4 **Update package.json Scripts**

-   Add scripts:

```
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
```

-
-   **Commit and test**: Run npm run dev once you have code to check basic connectivity.

## **3\. Code Migration (Netlify → Workers)**

3.1 **Main Worker Entry Point**

-   Create workers/index.ts as the primary fetch handler. For example:

```
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/sse')) {
      // (Implement SSE handler below)
    } else {
      // (Implement JSON-RPC MCP protocol below)
    }
    return new Response('Not found', { status: 404 });
  }
};
```

-
-   **Convert Netlify code**: Replace each Netlify handler (exports.handler = ...) with this format. Key changes:
    -   Use new URL(request.url).searchParams instead of event.queryStringParameters.
    -   Use request.headers instead of event.headers.
    -   Use env.VAR instead of process.env.VAR.
    -   Return new Response(body, { status }) instead of { statusCode, body }.
-   **Commit and test**: After converting one endpoint, run npm run dev and use curl to check it responds.

3.2 **JSON-RPC MCP Logic**

-   In workers/index.ts, parse the JSON-RPC request body. For example:

```
const data = await request.json();
const { method, params, id } = data as any;
if (method === 'initialize') {
  // handle initialize
  return new Response(JSON.stringify({ result: { /* capabilities */ }, id }), { status: 200 });
}
// ... handle other methods similarly ...
return new Response(JSON.stringify({ error: 'Unknown method', id }), { status: 400 });
```

-
-   **Optional (WorkerEntrypoint)**: You can also use Cloudflare’s RPC model by extending WorkerEntrypoint:

```
import { WorkerEntrypoint } from "cloudflare:workers";

export default class extends WorkerEntrypoint<Env> {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return await super.fetch(request, env, ctx);
  }
  async initialize() { /* ... */ }
  async executeTool(params: any) { /* ... */ }
  // ...other RPC methods...
}
```

-   This approach automatically handles JSON parsing and dispatch . Use whichever fits your style.
-   Implement all MCP handlers (capabilities negotiation, tool execution, resource access, etc.) as they were in Netlify. Ensure the JSON-RPC request/response format is preserved.

3.3 **SSE (Server-Sent Events) Handler**

-   Create workers/lib/sse.ts and add:

```
export async function handleSSE(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  // On client disconnect, close the stream
  request.signal.addEventListener('abort', () => {
    writer.close();
  });
  // Heartbeat every 30s to keep connection alive
  const intervalId = setInterval(() => {
    writer.write(encoder.encode(': keep-alive\n\n'));
  }, 30000);
  ctx.waitUntil(
    (async () => {
      await writable.closed;
      clearInterval(intervalId);
    })()
  );
  return new Response(readable, { headers });
}
```

-   This uses TransformStream() to stream data to the client. Headers include keep-alive and X-Accel-Buffering: no to prevent buffering .
-   **Implement message sending**: Inside the SSE stream (above), you will need to write your JSON-RPC results to writer. For example:

```
const data = { id: 1, result: { /*...*/ } };
const msg = `data: ${JSON.stringify(data)}\n\n`;
writer.write(encoder.encode(msg));
```

-   Wrap writes in try/catch. On error or abort, clean up.
-   **Commit and test**: In workers/index.ts, route /sse to this handler:

```
if (url.pathname === '/sse') {
  return handleSSE(request, env, ctx);
}
```

-   Then run npm run dev and connect with an SSE client. For example (Node):

```
const EventSource = require('eventsource');
const es = new EventSource('http://localhost:8787/sse');
es.onmessage = e => console.log('Received:', e.data);
es.onerror = e => console.error('Error:', e);
```

-   You should see SSE messages come through .

3.4 **Migrate mcp-sse.js Logic**

-   Translate your existing SSE logic into the new handleSSE function above. Differences from Netlify code:
    -   Remove the Netlify event parameter; use request and ctx.
    -   Replace any context/event streaming code with the TransformStream approach.
    -   Ensure your JSON-RPC message format is the same (prefix with data:  and newline newline).
-   **Important:** Use Connection: keep-alive and X-Accel-Buffering: no headers to avoid buffering , and send periodic pings to avoid timeouts.
-   **Commit and test**: Confirm that clients can maintain the SSE connection and receive your protocol messages just as before.

3.5 **Static Assets (if any)**

-   If your project has static files (in a public/ folder), configure Wrangler for assets. In wrangler.toml add:

```
[assets]
directory = "./public"
binding = "ASSETS"
```

-   (This tells Workers to include the public/ folder at build time .)
-   In your fetch handler (workers/index.ts), serve the root path via ASSETS. For example:

```
if (url.pathname === '/' || url.pathname === '/index.html') {
  return env.ASSETS.fetch(request);
}
```

-
-   **Commit and test**: Deploy or publish, then browse penguinbank.cloud. You should see your static site served from Cloudflare.

## **4\. Environment Variables and Secrets**

4.1 **Local Development Variables**

-   Create a file .dev.vars in project root with your local secrets, for example:

```
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_KEY=service-role-key
```

-   Wrangler will use .dev.vars for local wrangler dev .
-   For different environments, create .dev.vars.production (and .dev.vars.staging) with production values. When you run wrangler dev --env production, the .dev.vars.production file is loaded instead.
-   Add .dev.vars\* to .gitignore to avoid committing secrets.
-   **Commit (safe)** and test: Run npm run dev and check that env.SUPABASE\_URL (etc.) is correctly used (e.g. log it or test a Supabase query).

4.2 **Cloudflare Secrets for Production**

-   In your terminal, add production secrets with Wrangler:

```
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
```

-   Each command will prompt for the secret’s value (enter the production value). This encrypts and stores it for your Worker .
-   Verify by running npx wrangler secret list. All keys should be listed.
-   If using multiple environments, add \--env staging or \--env production to scope secrets to those envs.
-   **Commit** the fact that secrets are set (no actual secret values are in code). Your Worker can now access them via env.SUPABASE\_URL, etc.

## **5\. GitHub Actions CI/CD Setup**

5.1 **Create Workflow File**

-   In .github/workflows/deploy.yml, add:

```
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
        with: node-version: '18'
      - run: npm ci
      - run: npm run test        # if you have tests
      - run: npm run typecheck

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: node-version: '18'
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
        with: node-version: '18'
      - run: npm ci
      - name: Deploy to Production
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
```

-   This will run tests on push/pull and deploy to staging (on develop) or production (on main).
-   **Commit** this workflow file.

5.2 **GitHub Secrets Reminder**

-   Confirm that CLOUDFLARE\_API\_TOKEN and CLOUDFLARE\_ACCOUNT\_ID are set in GitHub (from Step 1.2).
-   (Optional) Add any other needed secrets (e.g. SUPABASE\_SERVICE\_KEY) to GitHub if your tests require them.

## **6\. Custom Domain and Deployment**

6.1 **Initial Deployment**

-   Deploy your Worker: run npm run deploy:production (or push to main). This publishes the Worker to Cloudflare.
-   Check the Cloudflare Dashboard under Workers that it’s **Active** or **Deployed**.

6.2 **Configure Custom Domains**

-   In Cloudflare Dashboard → **Workers & Pages** → **Workers** → _Your Worker_ → **Settings** → **Custom Domains**, add:
    -   penguinbank.cloud (to route the root domain)
    -   mcp.penguinbank.cloud

        Cloudflare will prompt to create DNS records. Verify they’re created and proxy is enabled (orange cloud). SSL certs should provision automatically.

-   Alternatively, you can use wrangler.toml routes (as in Step 2.2) and re-deploy.
-   **Verify**: When DNS is active, visiting https://penguinbank.cloud and https://mcp.penguinbank.cloud should reach your Worker.

6.3 **Verify Deployment**

-   Use curl or browser to test your endpoints on the real domains: e.g.

```
curl -X POST https://penguinbank.cloud -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

-
-   Ensure it behaves the same as in local/staging.

## **7\. Testing and Validation**

7.1 **Local Testing**

-   Run npm run dev. Use tools to test endpoints:
    -   **JSON-RPC**: e.g. curl -X POST http://localhost:8787 -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'.
    -   **SSE**: Run an EventSource client (as above) against http://localhost:8787/sse. Ensure you receive events.
-   Test all MCP operations (init, execute, access resources, etc.) to verify functionality.
-   **Authless Testing**: Verify no authentication is required - all endpoints should work without tokens or credentials.

7.2 **Integration Tests (Optional)**

-   If you want automated tests, set up a workers/\_\_tests\_\_/ folder. For example, using Jest with Cloudflare’s testing utilities:

```
import { unstable_dev } from 'wrangler';

describe('MCP Worker', () => {
  let worker: any;
  beforeAll(async () => {
    worker = await unstable_dev('workers/index.ts', {
      experimental: { disableExperimentalWarning: true }
    });
  });
  afterAll(async () => { await worker.stop(); });

  test('SSE endpoint returns correct header', async () => {
    const res = await worker.fetch('http://localhost:8787/sse');
    expect(res.headers.get('content-type')).toMatch(/text\/event-stream/);
  });
  // ...more tests...
});
```

-
-   Add npm test to run these. Include tests in CI (see Workflow above).

7.3 **Staging Environment Testing**

-   After deploying to staging, test on the staging URL (e.g. https://mcp.penguinbank.cloud if using a subdomain). Repeat all endpoint tests.
-   **MCP Inspector Testing**: Use the [MCP inspector tool](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers) to validate server compliance:
    ```bash
    npx @modelcontextprotocol/inspector@latest
    # Open http://localhost:5173 and connect to your server
    ```
-   **Cloudflare AI Playground**: Test with [Cloudflare's AI Playground](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) for remote MCP client validation.
-   **Claude Desktop Integration**: Test using [mcp-remote proxy](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) to connect Claude Desktop:
    ```json
    {
      "mcpServers": {
        "penguinbank": {
          "command": "npx",
          "args": ["mcp-remote", "https://your-staging-url.workers.dev/sse"]
        }
      }
    }
    ```
-   Tail logs with npm run tail -- --env staging to catch any runtime issues.

## **8\. Production Deployment and Cleanup**

8.1 **Final Production Deployment**

-   Ensure all tests passed and everything is merged to main. The Actions workflow will deploy to production. Alternatively run npm run deploy:production.
-   Verify the live endpoints (penguinbank.cloud, mcp.penguinbank.cloud) again with test calls.

8.2 **Update Client Applications**

-   Update any client applications to use the new Cloudflare Workers URLs.
-   **Claude Desktop Configuration**: Update Claude Desktop config to use [mcp-remote proxy](https://developers.cloudflare.com/agents/guides/remote-mcp-server/):
    ```json
    {
      "mcpServers": {
        "penguinbank": {
          "command": "npx",
          "args": ["mcp-remote", "https://mcp.penguinbank.cloud/sse"]
        }
      }
    }
    ```
-   Test client apps (web UI, mobile, etc.) to confirm they work end-to-end with the Worker.

8.3 **Monitoring**

-   Use npm run tail -- --env production to monitor logs for errors.
-   Optionally, enable Cloudflare Workers Analytics (via Dashboard) to monitor CPU usage, invocation count, and errors.

8.4 **Cleanup Legacy Netlify Code**

-   Once everything is confirmed working on Cloudflare, delete Netlify-specific code:
    -   Remove the /netlify/functions/ directory or move it to an archive branch .
    -   Delete Netlify config files like netlify.toml.
-   Update documentation/README to remove Netlify steps and add Cloudflare steps.
-   Reference [Cloudflare's official MCP server guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) in documentation.
-   **Commit** these cleanup changes.

## **9\. Troubleshooting and Gotchas**

-   **SSE Buffering**: If clients are not receiving SSE messages promptly, ensure the headers 'Connection: keep-alive' and 'X-Accel-Buffering: no' are set . These prevent buffering. Also send a ping/comment every ~30s to keep the connection open.
-   **Environment Variables**: If env.VAR is undefined, check your .dev.vars or Wrangler secrets. Remember .dev.vars is only for wrangler dev, while wrangler secret put is for production. Run wrangler secret list to verify.
-   **Custom Domain Issues**: If the custom domain fails, verify the DNS is managed by Cloudflare and proxied (orange cloud icon), and that you deployed the Worker _before_ adding the route. Sometimes removing and re-adding the custom domain (after a fresh deploy) helps.
-   **TypeScript Errors**: If building fails, ensure @cloudflare/workers-types is installed and included in tsconfig.json. Use "moduleResolution": "bundler" for worker imports.
-   **Concurrency Limits**: Cloudflare Workers free tier allows up to 6 simultaneous open connections. If you have many SSE clients, consider upgrading or batching.
-   **Resource Limits**: Workers have CPU time and memory limits. Very long-running operations should use ctx.waitUntil() for background work, or break up tasks to fit within the limit.

By carefully following this checklist—migrating code step by step, testing frequently, and noting each change—you can smoothly transition from Netlify Functions to Cloudflare Workers while preserving JSON-RPC and SSE behavior.

**References:** See Cloudflare docs on environment variables and secrets , and SSE with TransformStream for guidance.
