# Tasks: MCP Server Migration to Cloudflare Workers

Based on the PRD for migrating the PenguinBank MCP server from Netlify Functions to Cloudflare Workers, with specific focus on Claude Desktop compatibility.

<!-- CODING AGENT CONTEXT:
This is a migration from Netlify Functions to Cloudflare Workers for an MCP (Model Context Protocol) server.
The main challenge is that Claude Desktop has very specific requirements:
- Only supports STDIO transport for local servers (not HTTP/SSE)
- Has aggressive timeouts: 60 seconds for initialization, 30 seconds for tool execution
- Requires specific CORS headers for remote access (Team/Enterprise only)

Key References:
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Cloudflare MCP Guide: https://developers.cloudflare.com/agents/guides/remote-mcp-server/
- workers-mcp package: https://www.npmjs.com/package/workers-mcp
- MCP Specification: https://spec.modelcontextprotocol.io/
-->

## Relevant Files

<!-- ARCHITECTURE OVERVIEW FOR CODING AGENT:
Current State:
- Cloudflare Worker deployed at https://mcp.penguinbank.cloud ✓
- Worker implements MCP protocol using @modelcontextprotocol/sdk ✓
- Banking tools work when tested via HTTP clients ✓
- Claude Desktop cannot connect (needs STDIO transport) ✗

Target Architecture:
1. Claude Desktop → spawns workers-mcp proxy (STDIO)
2. workers-mcp proxy → HTTP requests to Cloudflare Worker
3. Cloudflare Worker → Supabase for banking data

The Worker code doesn't need major changes - just optimization for timeouts.
The main work is setting up the workers-mcp proxy layer.
-->

- `workers/index.ts` - Main Cloudflare Worker entry point and request handler with root path MCP routing
- `workers/index.test.ts` - Unit tests for main Worker functionality
- `workers/lib/mcp-server.ts` - Core MCP protocol implementation using official @modelcontextprotocol/sdk
- `workers/lib/mcp-server.test.ts` - Unit tests for MCP server logic
- `workers/lib/logger.ts` - Structured logging utility with different levels and request tracking
- `workers/lib/metrics.ts` - Performance metrics tracking (response times, connection counts, tool execution metrics)
- `workers/lib/supabase-client.ts` - Supabase database integration for Workers
- `workers/lib/supabase-client.test.ts` - Unit tests for database operations
- `workers/lib/banking-tools.ts` - Banking demo tools implementation
- `workers/lib/banking-tools.test.ts` - Unit tests for banking tools
- `workers/wrangler.toml` - Cloudflare Workers configuration with production and development environments
- `.github/workflows/deploy.yml` - GitHub Actions CI/CD pipeline
- `workers/types/env.ts` - TypeScript environment variable definitions
- `workers/tsconfig.json` - TypeScript configuration for Workers
- `workers/lib/monitoring.ts` - Performance metrics and error tracking implementation
- `workers/lib/monitoring.test.ts` - Unit tests for monitoring functionality
- `workers/.dev.vars` - Local development environment variables (gitignored)
- `workers/package.json` - Workers-specific dependencies including @modelcontextprotocol/sdk

### Notes

- **CRITICAL**: Claude Desktop only supports STDIO transport for local servers
- SSE transport has been deprecated as of MCP spec 2025-03-26
- Use `workers-mcp` proxy package for Claude Desktop integration
- Remote MCP servers require Team/Enterprise Claude accounts
- Claude Desktop has aggressive timeouts: 60s initialization, 30s tool execution
- Follow [Cloudflare's official MCP server guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)
- **PRODUCTION DEPLOYMENT**: MCP server is now live at https://mcp.penguinbank.cloud/ (root path access)

<!-- CODING AGENT NOTE: The existing production deployment works with Cloudflare's sandbox but NOT with Claude Desktop.
The issue is transport incompatibility - we need to add a local STDIO proxy layer. -->

## Tasks

- [x] 0.1 PRIORITY: Preserve existing Netlify edge function during migration
  - [x] 0.1.1 Disable Netlify CLI deployment in GitHub Actions to prevent accidental changes to working edge function
  - [x] 0.1.2 Keep existing Netlify MCP server as backup/archive during Cloudflare Workers migration

- [x] 1.0 Environment Setup and Project Foundation
  - [x] 1.1 Install and configure Wrangler CLI (`npm install -g wrangler@latest` and `wrangler login`)
  - [x] 1.2 Create Cloudflare account and add domains (penguinbank.cloud, mcp.penguinbank.cloud) to Cloudflare DNS
  - [x] 1.3 Generate Cloudflare API token with "Edit Cloudflare Workers" permissions
  - [x] 1.4 Add GitHub secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
  - [x] 1.5 Create `workers/` directory structure and initialize `wrangler.toml` configuration
  - [x] 1.6 Set up TypeScript configuration (`workers/tsconfig.json`) and install dependencies (`@cloudflare/workers-types`, `wrangler`)
  - [x] 1.7 Create environment variable files (`.dev.vars` for local, secrets for production)
  - [x] 1.8 Review Cloudflare's official MCP server guide and TypeScript SDK examples
  - [x] 1.9 Verify MCP SDK compatibility with Cloudflare Workers runtime environment

- [x] 2.0 Core MCP Server Implementation
  - [x] 2.1 Create main Worker entry point (`workers/index.ts`) with fetch handler
  - [x] 2.2 Implement MCP protocol handler (`workers/lib/mcp-server.ts`) with JSON-RPC 2.0 compliance
  - [x] 2.3 Add capability negotiation and initialization handshake logic
  - [x] 2.4 Implement session management with `Mcp-Session-Id` header tracking
  - [x] 2.5 Add structured error handling with proper JSON-RPC error codes
  - [x] 2.6 Create environment types definition (`workers/types/env.ts`) for TypeScript
  - [x] 2.7 Implement structured logging for debugging and monitoring
  - [x] 2.8 Add performance metrics tracking (response times, connection counts)
  - [x] 2.9 Write unit tests for core MCP server functionality

- [x] 2.10 Fix MCP client compatibility issues discovered during testing
  - [x] 2.10.1 Fix "notifications/initialized" handling - server returns error instead of accepting notification
  - [x] 2.10.2 Implement proper MCP SDK integration in Worker instead of custom JSON-RPC handling
  - [x] 2.10.3 Add support for MCP notifications (no response required for notification messages)
  - [x] 2.10.4 Test with mcp-remote and Cursor MCP client to verify compatibility
  - [x] 2.10.5 Update error handling to distinguish between requests (need response) and notifications (no response)

- [x] 2.11 Audit codebase for SDK bypass patterns and architectural issues
  - [x] 2.11.1 Review workers/index.ts for manual JSON-RPC handling that should use MCP SDK
  - [x] 2.11.2 Check workers/lib/mcp-server.ts for proper SDK integration patterns
  - [x] 2.11.3 Identify any custom protocol implementations that duplicate SDK functionality
  - [x] 2.11.4 Document all places where we're reinventing MCP SDK capabilities
  - [x] 2.11.5 Create refactoring plan to eliminate SDK bypasses and use proper abstractions

- [x] 2.12 Production deployment and routing configuration
  - [x] 2.12.1 Deploy MCP server to production environment (penguin-bank-mcp-prod)
  - [x] 2.12.2 Configure Cloudflare routes for mcp.penguinbank.cloud domain
  - [x] 2.12.3 Enable root path access (/) for MCP requests instead of requiring /mcp suffix
  - [x] 2.12.4 Verify all MCP tools are working in production (get_account_balance, get_recent_transactions, transfer_funds)
  - [x] 2.12.5 Test health endpoint and monitoring functionality

<!-- CURRENT ERROR STATE (IMPORTANT FOR CODING AGENT):
When Claude Desktop tries to connect to the MCP server, it fails with:
- MCP error -32001: Request timed out (on tools/list)
- MCP error -32000: Connection closed (on resources/list)

Root cause: Claude Desktop is trying to connect directly via HTTP, but it needs STDIO transport.
The Worker is running fine (works in Cloudflare sandbox), but Claude Desktop cannot reach it.

DO NOT try to fix this by:
- Adjusting CORS headers (won't help with STDIO requirement)
- Optimizing the Worker performance (it's already fast enough)
- Implementing SSE transport (it's deprecated and won't work)

The ONLY solution is to implement the workers-mcp proxy approach in section 3.0.
-->

**STATUS UPDATE (2025-06-20)**: MCP server works in Cloudflare sandbox but fails with Claude Desktop due to transport incompatibility. Claude Desktop requires STDIO transport for local servers or properly configured remote servers (Team/Enterprise only).

<!-- CODING AGENT CONTEXT: 
The current implementation uses HTTP/SSE transport which works for web clients but NOT for Claude Desktop.
Claude Desktop expects to spawn a local process and communicate via stdin/stdout (STDIO transport).
The solution is to use workers-mcp as a local proxy that:
1. Claude Desktop spawns as a subprocess (STDIO communication)
2. workers-mcp translates STDIO to HTTP calls to our Cloudflare Worker
3. Our Worker continues to use the MCP SDK normally

This is the ONLY reliable way to get Claude Desktop working with a Cloudflare Worker.
Direct HTTP connections from Claude Desktop are restricted and unreliable.
-->

- [ ] 3.0 Claude Desktop Integration via workers-mcp Proxy
  <!-- CRITICAL SECTION: This is the key to making Claude Desktop work with our Cloudflare Worker.
  workers-mcp acts as a bridge, converting Claude Desktop's STDIO transport to HTTP calls to our Worker.
  Reference: https://github.com/cloudflare/workers-sdk/tree/main/packages/workers-mcp -->
  
  - [x] 3.1 Install workers-mcp package locally (`npm install -g workers-mcp`)
    <!-- NOTE: This must be installed globally on the user's machine, not in the project.
    It will run as a local process that Claude Desktop spawns via STDIO. -->
    
  - [x] 3.2 Run workers-mcp setup wizard to configure local proxy
    <!-- Command: `workers-mcp setup`
    This wizard will create the necessary configuration files and update claude_desktop_config.json -->
    - [x] 3.2.1 Select Cloudflare Worker connection type
    - [x] 3.2.2 Input Worker URL: https://mcp.penguinbank.cloud
      <!-- IMPORTANT: Use the root domain, not /mcp path. Our Worker handles routing at the root. -->
    - [x] 3.2.3 Configure authentication if required
      <!-- For demo purposes, we're running authless. Skip this step unless implementing auth. -->
    - [x] 3.2.4 Name the server configuration (e.g., "penguinbank")
      <!-- This name will appear in Claude Desktop's UI when users select MCP servers -->
      
  - [x] 3.3 Verify claude_desktop_config.json is properly generated
    <!-- This file is automatically created/updated by workers-mcp setup wizard -->
    - [x] 3.3.1 Location: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
    - [x] 3.3.2 Location: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
    - [x] 3.3.3 Verify STDIO transport is configured (not SSE or HTTP)
    - [x] 3.3.4 Example configuration structure:
      ```json
      {
        "mcpServers": {
          "penguinbank": {
            "command": "workers-mcp",
            "args": ["proxy", "--config", "/path/to/workers-mcp-config.json"],
            "env": {}
          }
        }
      }
      ```
      <!-- The "command" field tells Claude Desktop to spawn workers-mcp as a subprocess.
      The proxy reads from stdin and writes to stdout, which Claude Desktop understands. -->
      
  - [ ] 3.4 Test Claude Desktop connectivity with proxy
    - [ ] 3.4.1 Restart Claude Desktop after config changes
      <!-- IMPORTANT: Claude Desktop only reads config on startup. Always restart after changes. -->
    - [ ] 3.4.2 Check Claude Desktop logs for initialization errors
      <!-- macOS: ~/Library/Logs/Claude/
           Windows: %APPDATA%\Claude\logs\
           Look for "MCP" or "penguinbank" in the logs -->
    - [ ] 3.4.3 Verify tools appear in Claude's tool list
      <!-- In Claude Desktop, type "/" to see available tools. Should see:
           - get_account_balance
           - get_recent_transactions  
           - transfer_funds -->
    - [ ] 3.4.4 Test tool execution within 60-second timeout window
      <!-- Try: "What's my account balance?" - should complete in <60s including init -->

- [ ] 4.0 Optimize Worker for Claude Desktop Requirements
  <!-- This section focuses on making the Worker fast enough for Claude Desktop's aggressive timeouts.
  Reference: https://spec.modelcontextprotocol.io/specification/server/implementation/#performance -->
  
  - [ ] 4.1 Implement fast initialization (<60 seconds)
    <!-- Claude Desktop will kill the process if initialization takes >60s -->
    - [ ] 4.1.1 Move all expensive operations to lazy loading
      <!-- Example: Instead of connecting to Supabase in constructor, do it on first tool call:
      ```typescript
      private supabase: SupabaseClient | null = null;
      private getSupabase() {
        if (!this.supabase) {
          this.supabase = createClient(url, key);
        }
        return this.supabase;
      }
      ```
      -->
    - [ ] 4.1.2 Defer Supabase connection until first tool call
      <!-- Connection establishment can take 2-5 seconds, don't do it during init -->
    - [ ] 4.1.3 Remove synchronous external API calls from startup
      <!-- Any fetch() or database calls in initialization will count against the 60s limit -->
    - [ ] 4.1.4 Implement connection pooling for database
      <!-- Cloudflare Workers can reuse connections across requests. See:
           https://developers.cloudflare.com/workers/databases/native-integrations/ -->
           
  - [ ] 4.2 Ensure tool execution performance (<30 seconds)
    <!-- Each individual tool call must complete within 30s or Claude Desktop shows timeout error -->
    - [ ] 4.2.1 Add timeout handling to all tool operations
      <!-- Use AbortController or Promise.race() to enforce timeouts:
      ```typescript
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s safety margin
      try {
        const result = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      ```
      -->
    - [ ] 4.2.2 Implement circuit breakers for external services
      <!-- If Supabase is down, fail fast instead of timing out -->
    - [ ] 4.2.3 Add performance monitoring for each tool
      <!-- Log execution times to identify bottlenecks -->
    - [ ] 4.2.4 Cache frequently accessed data where appropriate
      <!-- Cloudflare KV or Cache API for read-heavy operations -->
      
  - [ ] 4.3 Add proper CORS headers for remote access (Team/Enterprise users)
    <!-- Only needed if supporting direct remote access without workers-mcp proxy -->
    - [ ] 4.3.1 Implement CORS configuration:
      ```javascript
      const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://claude.ai',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
        'Access-Control-Expose-Headers': 'Mcp-Session-Id',
        'Access-Control-Max-Age': '86400'
      };
      ```
      <!-- CRITICAL: Never use '*' for Allow-Origin in production. Claude Desktop will reject it. -->
    - [ ] 4.3.2 Handle preflight OPTIONS requests with 204 status
      <!-- OPTIONS requests must return immediately with no body:
      ```typescript
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }
      ```
      -->
    - [ ] 4.3.3 Add production origin restrictions (no wildcards)
      <!-- Also allow: https://app.claude.ai for production -->
      
  - [ ] 4.4 Implement Streamable HTTP transport (modern standard)
    <!-- This replaces the deprecated SSE transport. Reference:
         https://github.com/modelcontextprotocol/specification/blob/main/docs/transport/http.md -->
    - [ ] 4.4.1 Single endpoint for all MCP communication
      <!-- All requests go to POST / or POST /mcp -->
    - [ ] 4.4.2 Support both standard HTTP and SSE dynamically
      <!-- Check Accept header: "text/event-stream" for SSE, otherwise standard JSON -->
    - [ ] 4.4.3 Implement proper session management via headers
      <!-- Use Mcp-Session-Id header to track sessions -->
    - [ ] 4.4.4 Enable JSON-RPC message batching
      <!-- Accept arrays of requests: [{"jsonrpc":"2.0","id":1,...}, {"jsonrpc":"2.0","id":2,...}] -->

- [ ] 5.0 Error Handling and Debugging for Claude Desktop
  <!-- These are the two most common errors when integrating with Claude Desktop.
  Understanding them is crucial for successful integration. -->
  
  - [ ] 5.1 Implement comprehensive error handling for -32001 (timeout) errors
    <!-- Error -32001 means the request exceeded Claude Desktop's timeout limit -->
    - [ ] 5.1.1 Add initialization performance logging
      <!-- Log timestamps for each initialization step:
      ```typescript
      console.error(`[MCP] Init start: ${Date.now()}`);
      // ... initialization code ...
      console.error(`[MCP] Init complete: ${Date.now()} (${Date.now() - start}ms)`);
      ```
      NOTE: Use console.error() for logs - stdout is reserved for JSON-RPC responses -->
    - [ ] 5.1.2 Identify and optimize blocking operations
      <!-- Common culprits:
           - Synchronous file I/O
           - Blocking database connections
           - Large JSON parsing
           - External API calls without timeouts -->
    - [ ] 5.1.3 Implement progress reporting during startup
      <!-- While MCP doesn't have a progress API, you can use notifications:
      ```typescript
      server.notification({
        method: 'progress',
        params: { message: 'Connecting to database...' }
      });
      ```
      -->
      
  - [ ] 5.2 Prevent -32000 (connection closed) errors
    <!-- Error -32000 means the server process crashed or closed unexpectedly -->
    - [ ] 5.2.1 Add try-catch blocks to all async operations
      <!-- NEVER let an unhandled promise rejection crash the Worker:
      ```typescript
      process.on('unhandledRejection', (error) => {
        console.error('[MCP] Unhandled rejection:', error);
        // Don't exit - try to recover
      });
      ```
      -->
    - [ ] 5.2.2 Validate all JSON-RPC messages before processing
      <!-- Use zod or similar for runtime validation:
      ```typescript
      const RequestSchema = z.object({
        jsonrpc: z.literal('2.0'),
        method: z.string(),
        params: z.unknown().optional(),
        id: z.union([z.string(), z.number()]).optional()
      });
      ```
      -->
    - [ ] 5.2.3 Log errors to stderr only (never stdout)
      <!-- stdout is ONLY for JSON-RPC responses. Any debug output must use stderr:
      ```typescript
      console.error('[DEBUG]', message); // Good
      console.log(message); // BAD - breaks JSON-RPC protocol
      ```
      -->
    - [ ] 5.2.4 Return proper error responses instead of crashing
      <!-- Always return valid JSON-RPC error responses:
      ```typescript
      {
        "jsonrpc": "2.0",
        "error": {
          "code": -32603,
          "message": "Internal error",
          "data": { "details": "Database connection failed" }
        },
        "id": request.id
      }
      ```
      -->
      
  - [ ] 5.3 Add Claude Desktop specific debugging
    - [ ] 5.3.1 Implement debug mode with verbose logging
      <!-- Check for DEBUG env var: `if (process.env.DEBUG) console.error(...);` -->
    - [ ] 5.3.2 Add request/response logging for troubleshooting
      <!-- Log full JSON-RPC messages (to stderr) when debugging -->
    - [ ] 5.3.3 Create health check endpoint for diagnostics
      <!-- Add a tool like "debug_health_check" that reports server status -->
    - [ ] 5.3.4 Document common error patterns and solutions
      <!-- Create a TROUBLESHOOTING.md with:
           - How to read Claude Desktop logs
           - Common error codes and fixes
           - Performance optimization tips
           - Example working configurations -->

- [ ] 6.0 Testing and Validation
  <!-- Thorough testing is crucial because Claude Desktop's environment differs significantly
  from development environments. Test early and often. -->
  
  - [ ] 6.1 Local testing with workers-mcp proxy
    - [ ] 6.1.1 Test all banking tools through Claude Desktop
      <!-- Test prompts to try:
           - "What's my account balance?"
           - "Show me my recent transactions"
           - "Transfer $50 to checking"
           Verify each completes successfully -->
    - [ ] 6.1.2 Verify timeout compliance (init <60s, tools <30s)
      <!-- Add timing logs to measure actual performance:
      ```typescript
      const start = Date.now();
      // ... operation ...
      console.error(`Operation took ${Date.now() - start}ms`);
      ```
      -->
    - [ ] 6.1.3 Test error scenarios and recovery
      <!-- Intentionally trigger errors to test handling:
           - Disconnect network during tool execution
           - Send malformed requests
           - Exceed timeout limits
           - Simulate database failures -->
           
  - [ ] 6.2 MCP Inspector validation
    <!-- MCP Inspector is the official tool for testing MCP servers.
    Install: npm install -g @modelcontextprotocol/inspector -->
    - [ ] 6.2.1 Run `npx @modelcontextprotocol/inspector@latest`
      <!-- This opens a web UI for testing your MCP server -->
    - [ ] 6.2.2 Connect to Worker via proxy
      <!-- Use the same workers-mcp proxy configuration as Claude Desktop -->
    - [ ] 6.2.3 Validate protocol compliance
      <!-- Inspector will show any protocol violations or non-compliant responses -->
    - [ ] 6.2.4 Test all tool schemas and responses
      <!-- Verify:
           - Tool discovery returns all expected tools
           - Tool schemas match implementation
           - Tool execution returns valid responses
           - Error handling follows JSON-RPC spec -->
           
  - [ ] 6.3 Load testing for performance
    <!-- Claude Desktop might spawn multiple connections. Ensure your Worker can handle it. -->
    - [ ] 6.3.1 Simulate concurrent Claude Desktop connections
      <!-- Use a tool like k6 or Artillery to simulate multiple MCP clients:
      ```javascript
      // k6 script example
      import http from 'k6/http';
      export default function() {
        const payload = JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1
        });
        http.post('https://mcp.penguinbank.cloud', payload);
      }
      ```
      -->
    - [ ] 6.3.2 Measure initialization times under load
      <!-- Target: <60s even with 10+ concurrent connections -->
    - [ ] 6.3.3 Verify tool execution times remain under limits
      <!-- Target: <30s for all tools even under load -->
    - [ ] 6.3.4 Test connection stability over extended periods
      <!-- Run a long-duration test (1+ hours) to check for memory leaks or degradation -->

- [ ] 7.0 Documentation and Deployment
  <!-- Good documentation is critical for MCP servers since setup can be complex -->
  
  - [ ] 7.1 Create Claude Desktop setup documentation
    - [ ] 7.1.1 Step-by-step workers-mcp installation guide
      <!-- Include:
           - System requirements (Node.js version, OS compatibility)
           - Installation commands with expected output
           - Screenshots of successful setup
           - Troubleshooting section for common issues -->
    - [ ] 7.1.2 Configuration file examples and troubleshooting
      <!-- Provide complete, working examples of:
           - claude_desktop_config.json
           - workers-mcp config file
           - Environment variables needed
           Show both minimal and full configurations -->
    - [ ] 7.1.3 Common error messages and solutions
      <!-- Document each error with:
           - Exact error message
           - Root cause
           - Step-by-step fix
           - How to verify the fix worked -->
    - [ ] 7.1.4 Performance optimization tips
      <!-- Include:
           - How to measure initialization time
           - Database connection pooling strategies
           - Caching recommendations
           - Cloudflare-specific optimizations -->
           
  - [ ] 7.2 Update deployment configuration
    - [ ] 7.2.1 Remove SSE transport code (deprecated)
      <!-- Delete any SSE-specific handlers since it's deprecated.
           Focus only on Streamable HTTP transport. -->
    - [ ] 7.2.2 Focus on Streamable HTTP implementation
      <!-- Ensure the Worker supports the modern transport spec:
           https://github.com/modelcontextprotocol/specification/blob/main/docs/transport/http.md -->
    - [ ] 7.2.3 Ensure all timeouts align with Claude Desktop limits
      <!-- Add explicit timeouts to wrangler.toml if needed:
      ```toml
      [env.production]
      compatibility_flags = ["nodejs_compat"]
      # Workers have a 30s CPU time limit by default - perfect for Claude Desktop
      ```
      -->
      
  - [ ] 7.3 Monitor production deployment
    <!-- Set up monitoring before issues arise -->
    - [ ] 7.3.1 Track initialization success rates
      <!-- Use Cloudflare Analytics or custom metrics:
           - Count successful vs failed initializations
           - Track initialization duration percentiles (p50, p95, p99) -->
    - [ ] 7.3.2 Monitor tool execution performance
      <!-- For each tool, track:
           - Execution time
           - Success/failure rate
           - Error types -->
    - [ ] 7.3.3 Alert on timeout violations
      <!-- Set up alerts (email, Slack, etc.) when:
           - Any initialization takes >50s (approaching limit)
           - Any tool execution takes >25s (approaching limit)
           - Error rate exceeds 5% -->
    - [ ] 7.3.4 Collect Claude Desktop specific metrics
      <!-- Track:
           - Which version of Claude Desktop is connecting
           - Which tools are most used
           - Common error patterns -->

- [ ] 8.0 Success Validation
  <!-- Final checklist to ensure everything works correctly -->
  
  - [ ] 8.1 Verify Claude Desktop integration works reliably
    <!-- Success criteria:
         - Can connect to MCP server via workers-mcp proxy
         - Tools appear in Claude Desktop UI
         - All tools execute successfully
         - No timeout errors during normal use -->
  - [ ] 8.2 Confirm all tools execute within timeout limits
    <!-- Run each tool 10 times and verify:
         - 100% complete within 30 seconds
         - Initialization always completes within 60 seconds -->
  - [ ] 8.3 Validate zero regression from Netlify functionality
    <!-- Compare with original Netlify implementation:
         - Same tools available
         - Same response formats
         - Same or better performance -->
  - [ ] 8.4 Document lessons learned and best practices
    <!-- Create a retrospective document covering:
         - What worked well
         - What was challenging
         - Cloudflare vs Netlify differences
         - Tips for future MCP server implementations -->
  - [ ] 8.5 Create runbook for troubleshooting common issues
    <!-- Include:
         - How to diagnose connection failures
         - How to debug timeout issues
         - How to test without Claude Desktop
         - Emergency rollback procedures -->
         
<!-- CODING AGENT FINAL NOTES:
1. The workers-mcp proxy approach is CRITICAL for Claude Desktop support
2. Never try to connect Claude Desktop directly to the HTTP endpoint
3. Always test with the actual Claude Desktop app, not just the inspector
4. Remember the 60s init and 30s execution timeouts are hard limits
5. Use stderr for all logging - stdout is only for JSON-RPC responses
6. The MCP SDK should handle most protocol details - don't reimplement
7. When in doubt, check the official MCP TypeScript SDK examples

Good luck with the implementation! -->