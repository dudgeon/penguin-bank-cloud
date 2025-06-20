# Tasks: MCP Server Migration to Cloudflare Workers

Based on the PRD for migrating the PenguinBank MCP server from Netlify Functions to Cloudflare Workers.

## Relevant Files

- `workers/index.ts` - Main Cloudflare Worker entry point and request handler with root path MCP routing
- `workers/index.test.ts` - Unit tests for main Worker functionality
- `workers/lib/mcp-server.ts` - Core MCP protocol implementation using official @modelcontextprotocol/sdk
- `workers/lib/mcp-server.test.ts` - Unit tests for MCP server logic
- `workers/lib/logger.ts` - Structured logging utility with different levels and request tracking
- `workers/lib/metrics.ts` - Performance metrics tracking (response times, connection counts, tool execution metrics)
- `workers/lib/sse-handler.ts` - Server-Sent Events transport implementation
- `workers/lib/sse-handler.test.ts` - Unit tests for SSE functionality
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

- Unit tests should be placed alongside the code files they are testing
- Use `npm test` to run all tests, or `npx jest workers/` to run only Worker tests
- Use `wrangler dev` for local development and `wrangler deploy` for production deployment
- Follow [Cloudflare's official MCP server guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) and [TypeScript SDK examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/server)
- DO NOT push any changes to or delete the current Netlify MCP edge client; we can use that prod version as an archive of our prior test, as it works.
- **PRODUCTION DEPLOYMENT**: MCP server is now live at https://mcp.penguinbank.cloud/ (root path access)

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
    - **RESOLVED**: Implemented proper notification handling in MCP server
    - **SOLUTION**: Added notification detection and proper no-response handling for notification methods
    - **STATUS**: Server now correctly handles notifications without returning errors
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

**STATUS UPDATE (2025-06-20)**: Major milestone achieved - MCP server is accessible and works with the Cloudflare sandbox, but **DOES NOT work with Claude Desktop**, with the following errors:

**MCP API failures:**
- Calls to `tools/list` and `resources/list` on penguin bank return:
  - MCP error -32001: Request timed out
  - MCP error -32000: Connection closed

**Critical Issue**: Your front-end can't reach the MCP server. Check:
1. Server is up and reachable from client
2. CORS / auth headers  
3. Cloudflare or reverse-proxy timeouts

**Next Priority**: Investigate Claude Desktop connectivity issues - likely related to transport layer (SSE) or CORS configuration that differs between Cloudflare sandbox testing and Claude Desktop client requirements.

- [ ] 3.0 Transport Layer Implementation (SSE + HTTP)
  - [ ] 3.1 Implement Server-Sent Events handler (`workers/lib/sse-handler.ts`) using TransformStream
  - [ ] 3.2 Add SSE connection management with heartbeat mechanism (30-second intervals)
  - [ ] 3.3 Implement proper CORS headers for Claude.ai and Claude Desktop integration
  - [ ] 3.4 Add connection cleanup on client disconnect and abort signals
  - [ ] 3.5 Implement dual transport support (SSE + Streamable HTTP) for compatibility
  - [ ] 3.6 Add request routing logic to handle different transport methods
  - [ ] 3.7 Write unit tests for transport layer functionality

- [ ] 4.0 Banking Tools Migration and Integration
  - [x] 4.1 Create Supabase client adapter (`workers/lib/supabase-client.ts`) for Cloudflare Workers
  - [x] 4.2 Migrate existing banking tools to new architecture (`workers/lib/banking-tools.ts`)
  - [x] 4.3 Implement authless tool execution (no authentication required for demo)
  - [x] 4.4 Add tool discovery and capability reporting for MCP clients
  - [x] 4.5 Ensure all tools meet performance requirements (<2 seconds execution time)
  - [x] 4.6 Add proper error handling and logging for tool operations
  - [ ] 4.7 Implement rate limiting to prevent abuse of demo endpoints
  - [x] 4.8 Add health check endpoint for service monitoring
  - [ ] 4.9 Write comprehensive unit tests for all banking tools

- [ ] 5.0 CI/CD Pipeline and Deployment Configuration
  - [ ] 5.1 Create GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated deployment
  - [ ] 5.2 Configure staging and production environment deployments
  - [ ] 5.3 Add automated testing in CI pipeline before deployment
  - [ ] 5.4 Set up Cloudflare Workers secrets management in production
  - [x] 5.5 Configure custom domains and SSL certificates in Cloudflare
  - [ ] 5.6 Add deployment scripts to `package.json` for local and remote deployment
  - [ ] 5.7 Configure blue-green deployment strategy with Netlify fallback
  - [ ] 5.8 Set up monitoring and alerting for performance metrics (response times, error rates, connection counts)
  - [ ] 5.9 Test CI/CD pipeline with staging environment deployment

- [ ] 6.0 Testing, Validation, and Production Deployment
  - [x] 6.1 Test local development server with `wrangler dev` and validate basic functionality
  - [ ] 6.2 Use MCP inspector tool (`npx @modelcontextprotocol/inspector@latest`) to validate server compliance
  - [ ] 6.3 Test with Cloudflare AI Playground for remote MCP client validation
  - [ ] 6.4 Configure Claude Desktop integration using mcp-remote proxy
  - [ ] 6.5 Perform load testing to ensure performance requirements are met
  - [x] 6.6 Perform DNS cutover from Netlify to Cloudflare Workers
  - [x] 6.7 Deploy to production and monitor for 48 hours with rollback readiness
  - [ ] 6.8 Validate rollback criteria (functionality regression, performance degradation, connection failures)
  - [ ] 6.9 Update documentation and clean up legacy Netlify code
  - [ ] 6.10 Validate all success metrics (Claude Desktop integration, performance benchmarks, zero regression)
  - [ ] 6.11 Conduct post-migration retrospective and document lessons learned 

**NEXT PRIORITY TASKS:**
1. **Section 3.0 - Transport Layer Implementation** - Focus on SSE (Server-Sent Events) for Claude Desktop compatibility
2. **Section 2.13 - Claude Desktop Integration Debugging** - Investigate timeout and connection closure issues
3. **Section 2.14 - CORS and Headers Optimization** - Address Permissions-Policy warnings and connection requirements

---

## Lessons Learned

### **✅ What Worked Well:**

1. **Official MCP SDK Integration**
   - Using `@modelcontextprotocol/sdk` was the correct approach - not "reinventing the wheel"
   - Proper JSON-RPC 2.0 implementation with `Server`, `ListToolsRequestSchema`, `CallToolRequestSchema`
   - SDK handles protocol complexity correctly and provides type safety

2. **Cloudflare Workers Platform**
   - Excellent performance and global edge deployment
   - Built-in observability with structured logging
   - Seamless production deployment with custom domains
   - Cost-effective serverless architecture

3. **Development Workflow**
   - Wrangler CLI provides excellent development experience with `wrangler dev --local`
   - Real-time tail logging with `wrangler tail --env production` invaluable for debugging
   - Environment-specific configurations work well for dev/prod separation

4. **Testing Strategy**
   - Cloudflare sandbox testing confirmed core MCP functionality works perfectly
   - curl-based API testing provided immediate feedback during development
   - Health endpoints essential for monitoring and debugging

### **❌ Critical Discovery - Transport Layer Requirements:**

1. **Claude Desktop vs Cloudflare Sandbox Differences**
   - **Cloudflare Sandbox**: Works with standard HTTP POST JSON-RPC requests ✅
   - **Claude Desktop**: Requires different transport layer (likely SSE or WebSocket) ❌
   - This is NOT a protocol issue but a **transport mechanism** requirement

2. **Connection Patterns**
   - MCP error -32001 (Request timed out) suggests Claude Desktop expects persistent connections
   - MCP error -32000 (Connection closed) indicates transport layer incompatibility
   - Standard HTTP request/response insufficient for Claude Desktop integration

3. **Browser Environment Constraints**
   - Permissions-Policy header warnings indicate browser security restrictions
   - iframe sandbox limitations affect Claude Desktop's web-based architecture
   - CORS requirements may differ between testing environments and production clients

### **🔧 Technical Insights:**

1. **Wrangler Configuration Gotchas**
   - Must run wrangler commands from `workers/` directory (not root)
   - Environment-specific worker names essential: `penguin-bank-mcp-prod` vs `penguin-bank-mcp`
   - Route configuration requires manual Cloudflare dashboard setup for custom domains

2. **Development Environment Setup**
   - Node.js v20+ required for Wrangler 4.x
   - `nvm use 20` before all wrangler commands prevents version conflicts
   - Local development requires `--local` flag to avoid remote dependencies during testing

3. **Logging and Observability**
   - Structured JSON logging with request IDs crucial for debugging distributed systems
   - Real-time log tailing reveals client behavior patterns not visible in basic testing
   - Duration tracking helps identify performance bottlenecks

### **📋 Process Improvements:**

1. **Testing Strategy Evolution**
   - Start with simple curl tests for basic functionality
   - Progress to Cloudflare sandbox for protocol validation
   - End with actual client integration (Claude Desktop) to discover transport requirements
   - Each testing layer reveals different categories of issues

2. **Documentation Importance**
   - Maintaining detailed task lists with status updates prevents losing context
   - Recording exact error messages and browser console output essential for debugging
   - Git commit messages should capture both successes AND known limitations

3. **Incremental Deployment**
   - Deploy to production early to test real-world routing and DNS
   - Separate development and production worker environments prevents conflicts
   - Custom domain configuration should be tested before declaring "completion"

### **🚀 Next Phase Preparation:**

1. **Transport Layer Research Needed**
   - Investigate MCP specification for required transport mechanisms
   - Research Claude Desktop's specific connection requirements
   - Evaluate SSE vs WebSocket implementation trade-offs

2. **Client Compatibility Matrix**
   - Document which MCP clients work with which transport layers
   - Test with multiple MCP client implementations beyond Claude Desktop
   - Build compatibility testing into development workflow

3. **Performance Optimization**
   - Monitor Cloudflare Workers CPU time and memory usage
   - Implement connection pooling if persistent connections required
   - Consider caching strategies for frequently accessed tools

**KEY TAKEAWAY**: The MCP protocol implementation was correct from the start. The challenge is implementing the right **transport layer** for different MCP clients, not the protocol logic itself. 