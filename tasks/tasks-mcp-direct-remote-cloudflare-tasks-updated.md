# Tasks: MCP Server Migration to Cloudflare Workers

Based on the PRD for migrating the PenguinBank MCP server from Netlify Functions to Cloudflare Workers, with specific focus on **direct remote MCP server access** via Claude Desktop Pro.

<!-- CODING AGENT CONTEXT:
This is a migration from Netlify Functions to Cloudflare Workers for an MCP (Model Context Protocol) server.
The target is DIRECT REMOTE ACCESS from Claude Desktop Pro (no local proxy needed).

Key Requirements:
- Direct HTTP/Streamable HTTP transport (NOT STDIO)
- Proper CORS headers for https://claude.ai and https://app.claude.ai
- Fast response times: <60s initialization, <30s tool execution
- No authentication (open demo server)

Key References:
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Cloudflare MCP Guide: https://developers.cloudflare.com/agents/guides/remote-mcp-server/
- MCP Streamable HTTP spec: https://github.com/modelcontextprotocol/specification/blob/main/docs/transport/http.md
- MCP Specification: https://spec.modelcontextprotocol.io/
-->

## Relevant Files

<!-- ARCHITECTURE OVERVIEW FOR CODING AGENT:
Current State:
- Cloudflare Worker deployed at https://mcp.penguinbank.cloud ✓
- Worker implements MCP protocol using @modelcontextprotocol/sdk ✓
- Banking tools work when tested via HTTP clients ✓
- Claude Desktop Pro cannot connect (likely CORS/transport issues) ✗

Target Architecture (DIRECT CONNECTION):
1. Claude Desktop Pro → HTTP/Streamable HTTP → Cloudflare Worker
2. Cloudflare Worker → Supabase for banking data

NO LOCAL PROXY NEEDED - This is for direct remote access with Claude Desktop Pro accounts.
The main fixes needed are CORS headers and proper Streamable HTTP transport.
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

- **CRITICAL**: Claude Desktop Pro supports direct remote MCP servers via URL
- Streamable HTTP transport is the modern standard (SSE deprecated as of 2025-03-26)
- CORS headers are MANDATORY for Claude Desktop to connect
- No authentication required for this demo server
- Claude Desktop has aggressive timeouts: 60s initialization, 30s tool execution
- Follow [Cloudflare's official MCP server guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)
- **PRODUCTION DEPLOYMENT**: MCP server is now live at https://mcp.penguinbank.cloud/ (root path access)

<!-- CODING AGENT NOTE: The existing production deployment works with Cloudflare's sandbox but NOT with Claude Desktop.
The issue is likely missing CORS headers and/or incomplete Streamable HTTP transport implementation. -->

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
When Claude Desktop Pro tries to connect to the MCP server, it fails with:
- MCP error -32001: Request timed out (on tools/list)
- MCP error -32000: Connection closed (on resources/list)

Likely causes:
1. Missing or incorrect CORS headers
2. Incomplete Streamable HTTP transport implementation
3. Worker not handling preflight OPTIONS requests correctly

The Worker itself is functional (works in Cloudflare sandbox), so the issue is
specifically with Claude Desktop's requirements for remote servers.
-->

**STATUS UPDATE (2025-06-20)**: MCP server works in Cloudflare sandbox but fails with Claude Desktop Pro due to missing CORS headers and/or transport issues.

<!-- CODING AGENT CONTEXT: 
For Claude Desktop Pro remote server access, we need:
1. Proper CORS headers for https://claude.ai and https://app.claude.ai
2. Streamable HTTP transport (not SSE which is deprecated)
3. Fast response times within timeout limits
4. Correct handling of preflight OPTIONS requests

Do NOT implement workers-mcp proxy - that's only for non-Pro users.
-->

- [ ] 3.0 PRIORITY: Enable Direct Remote Access for Claude Desktop Pro
  <!-- THIS IS THE CRITICAL SECTION - Without these fixes, Claude Desktop Pro cannot connect -->
  
  - [ ] 3.1 Implement proper CORS headers for Claude Desktop
    <!-- CORS is MANDATORY for remote servers. Without it, Claude Desktop will block the connection. -->
    - [x] 3.1.1 Add CORS headers to all responses:
      ```javascript
      const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://claude.ai, https://app.claude.ai',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
        'Access-Control-Expose-Headers': 'Mcp-Session-Id',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true'
      };
      ```
      <!-- NOTE: Some browsers don't support multiple origins in Allow-Origin. 
           You may need to dynamically set based on the Origin header:
      ```javascript
      const origin = request.headers.get('Origin');
      if (origin === 'https://claude.ai' || origin === 'https://app.claude.ai') {
        corsHeaders['Access-Control-Allow-Origin'] = origin;
      }
      ```
      -->
    - [ ] 3.1.2 Handle preflight OPTIONS requests correctly:
      ```javascript
      export default {
        async fetch(request: Request, env: Env): Promise<Response> {
          // Handle OPTIONS immediately
          if (request.method === 'OPTIONS') {
            return new Response(null, { 
              status: 204, 
              headers: corsHeaders 
            });
          }
          // ... rest of handler
        }
      }
      ```
      <!-- OPTIONS requests must return 204 with no body and complete CORS headers -->
    - [ ] 3.1.3 Add CORS headers to ALL responses (success and error)
      <!-- Every response, including error responses, must have CORS headers -->
    - [ ] 3.1.4 Test CORS implementation with curl:
      ```bash
      # Test preflight
      curl -X OPTIONS https://mcp.penguinbank.cloud \
        -H "Origin: https://claude.ai" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type, Mcp-Session-Id" -v
      
      # Should see all CORS headers in response
      ```

  - [ ] 3.2 Implement Streamable HTTP transport
    <!-- Modern MCP standard - replaces deprecated SSE -->
    - [ ] 3.2.1 Support both standard JSON responses and streaming
      <!-- Check Accept header to determine response type:
      ```javascript
      const acceptsEventStream = request.headers.get('Accept')?.includes('text/event-stream');
      if (acceptsEventStream) {
        // Return SSE stream for backward compatibility
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            ...corsHeaders
          }
        });
      } else {
        // Return standard JSON response
        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      ```
      -->
    - [ ] 3.2.2 Handle session management via Mcp-Session-Id header
      <!-- Track sessions for stateful operations if needed -->
    - [ ] 3.2.3 Support JSON-RPC batch requests
      <!-- Accept arrays: [{"jsonrpc":"2.0","method":"tools/list","id":1},...] -->
    - [ ] 3.2.4 Ensure all endpoints use POST method
      <!-- MCP uses POST for all operations, not GET -->

  - [ ] 3.3 Test direct Claude Desktop Pro connectivity
    - [ ] 3.3.1 Add server via Claude Desktop Pro UI:
      <!-- Steps:
      1. Open Claude Desktop settings
      2. Navigate to MCP Servers section
      3. Click "Add Remote Server" (Pro feature)
      4. Enter:
         - Name: "PenguinBank" (or any friendly name)
         - URL: https://mcp.penguinbank.cloud
      5. Save and restart Claude Desktop
      -->
    - [ ] 3.3.2 Verify server appears in Claude's server list
      <!-- After restart, the server should show as connected -->
    - [ ] 3.3.3 Test tool discovery
      <!-- Type "/" in Claude to see if banking tools appear -->
    - [ ] 3.3.4 Execute test queries:
      <!-- Try these prompts:
      - "What's my account balance?"
      - "Show my recent transactions"
      - "Transfer $100 from savings to checking"
      -->

- [ ] 4.0 Optimize Worker for Claude Desktop Performance
  <!-- Focus on meeting the aggressive timeout requirements -->
  
  - [ ] 4.1 Implement fast initialization (<60 seconds)
    <!-- CRITICAL: Claude Desktop will timeout if init takes >60s -->
    - [ ] 4.1.1 Profile current initialization time
      ```javascript
      const initStart = Date.now();
      // ... initialization code ...
      console.log(`Init took ${Date.now() - initStart}ms`);
      ```
    - [ ] 4.1.2 Lazy load Supabase connections
      <!-- Don't connect during init, connect on first use:
      ```javascript
      private supabaseClient: SupabaseClient | null = null;
      
      private async getSupabase(): Promise<SupabaseClient> {
        if (!this.supabaseClient) {
          this.supabaseClient = createClient(this.env.SUPABASE_URL, this.env.SUPABASE_KEY);
        }
        return this.supabaseClient;
      }
      ```
      -->
    - [ ] 4.1.3 Remove any blocking operations from startup
      <!-- No synchronous file reads, no await fetch() calls during init -->
    - [ ] 4.1.4 Return minimal capability response quickly
      <!-- Start with basic capabilities, add more if needed -->

  - [ ] 4.2 Ensure tool execution performance (<30 seconds)
    - [ ] 4.2.1 Add timeouts to all external calls:
      ```javascript
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), 25000)
      );
      
      try {
        const result = await Promise.race([
          supabaseOperation(),
          timeoutPromise
        ]);
      } catch (error) {
        // Return timeout error to Claude
      }
      ```
    - [ ] 4.2.2 Implement request caching where appropriate
      <!-- Cache account balances for 30 seconds, etc. -->
    - [ ] 4.2.3 Add performance logging for each tool
      <!-- Track p50, p95, p99 latencies -->
    - [ ] 4.2.4 Optimize database queries
      <!-- Use indexes, limit result sets, avoid N+1 queries -->

- [ ] 5.0 Error Handling and Debugging
  <!-- Specific fixes for the -32001 and -32000 errors -->
  
  - [ ] 5.1 Fix timeout errors (-32001)
    - [ ] 5.1.1 Add detailed timing logs:
      ```javascript
      console.log(`[${new Date().toISOString()}] Starting ${method}`);
      // ... operation ...
      console.log(`[${new Date().toISOString()}] Completed ${method} in ${duration}ms`);
      ```
    - [ ] 5.1.2 Implement progress notifications for long operations
    - [ ] 5.1.3 Return partial results if approaching timeout
    - [ ] 5.1.4 Add timeout warnings to response metadata

  - [ ] 5.2 Fix connection closed errors (-32000)
    - [ ] 5.2.1 Ensure Worker doesn't crash on errors:
      ```javascript
      try {
        // ... operation ...
      } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: { details: error.message }
          },
          id: request.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      ```
    - [ ] 5.2.2 Validate all inputs before processing
    - [ ] 5.2.3 Handle malformed JSON gracefully
    - [ ] 5.2.4 Never throw unhandled exceptions

  - [ ] 5.3 Add debugging endpoints
    - [ ] 5.3.1 Create `/health` endpoint for monitoring
    - [ ] 5.3.2 Add `/debug` endpoint (protect in production)
    - [ ] 5.3.3 Implement request ID tracking
    - [ ] 5.3.4 Add correlation IDs to all logs

- [ ] 6.0 Testing and Validation
  
  - [ ] 6.1 Test with Claude Desktop Pro
    - [ ] 6.1.1 Verify server appears in server list
    - [ ] 6.1.2 Test all tools work correctly
    - [ ] 6.1.3 Confirm no timeout errors
    - [ ] 6.1.4 Verify tools complete within limits

  - [ ] 6.2 Use MCP Inspector for validation
    <!-- Official tool: https://github.com/modelcontextprotocol/inspector -->
    - [ ] 6.2.1 Test direct HTTP connection (no proxy)
    - [ ] 6.2.2 Validate protocol compliance
    - [ ] 6.2.3 Check all tool schemas
    - [ ] 6.2.4 Test error handling

  - [ ] 6.3 Load testing
    - [ ] 6.3.1 Test concurrent connections
    - [ ] 6.3.2 Measure performance under load
    - [ ] 6.3.3 Verify timeouts stay within limits
    - [ ] 6.3.4 Check for memory leaks

- [ ] 7.0 Documentation and Monitoring
  
  - [ ] 7.1 Create user documentation
    - [ ] 7.1.1 Write Claude Desktop Pro setup guide:
      <!-- Include:
      - Screenshots of adding remote server
      - Expected behavior
      - Common issues and fixes
      - Example prompts to try
      -->
    - [ ] 7.1.2 Document server capabilities
    - [ ] 7.1.3 Create troubleshooting guide
    - [ ] 7.1.4 Add API documentation

  - [ ] 7.2 Set up production monitoring
    - [ ] 7.2.1 Track success/failure rates
    - [ ] 7.2.2 Monitor response times
    - [ ] 7.2.3 Alert on errors or timeouts
    - [ ] 7.2.4 Create performance dashboard

- [ ] 8.0 Success Validation
  
  - [ ] 8.1 Verify Claude Desktop Pro integration works
    <!-- Success criteria:
    - Can add server via URL in Claude Desktop Pro
    - Server connects without errors
    - All tools appear and function correctly
    - No timeout errors during normal use
    -->
  - [ ] 8.2 Confirm performance requirements met
    - [ ] 8.2.1 Initialization < 60 seconds
    - [ ] 8.2.2 Tool execution < 30 seconds
    - [ ] 8.2.3 Error rate < 1%
    - [ ] 8.2.4 Uptime > 99.9%

  - [ ] 8.3 Validate feature parity with Netlify
  - [ ] 8.4 Document lessons learned
  - [ ] 8.5 Create operations runbook

<!-- CODING AGENT FINAL NOTES FOR REMOTE ACCESS:
1. CORS headers are MANDATORY - without them, Claude Desktop Pro cannot connect
2. Handle OPTIONS preflight requests correctly (return 204 with headers)
3. Focus on Streamable HTTP transport, not SSE (deprecated) or STDIO (local only)
4. Test with actual Claude Desktop Pro, not just the inspector
5. The 60s init and 30s execution timeouts are hard limits
6. Use the MCP SDK properly - don't reimplement the protocol
7. All responses must include CORS headers, even errors

The key difference from local servers: This is pure HTTP with CORS, no STDIO involved.
Good luck! -->
