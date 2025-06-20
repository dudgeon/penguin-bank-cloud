# Tasks: MCP Server Migration to Cloudflare Workers

Based on the PRD for migrating the PenguinBank MCP server from Netlify Functions to Cloudflare Workers.

## Relevant Files

- `workers/index.ts` - Main Cloudflare Worker entry point and request handler (basic MCP endpoints implemented)
- `workers/index.test.ts` - Unit tests for main Worker functionality
- `workers/lib/mcp-server.ts` - Core MCP protocol implementation and JSON-RPC handling
- `workers/lib/mcp-server.test.ts` - Unit tests for MCP server logic
- `workers/lib/sse-handler.ts` - Server-Sent Events transport implementation
- `workers/lib/sse-handler.test.ts` - Unit tests for SSE functionality
- `workers/lib/supabase-client.ts` - Supabase database integration for Workers
- `workers/lib/supabase-client.test.ts` - Unit tests for database operations
- `workers/lib/banking-tools.ts` - Banking demo tools implementation
- `workers/lib/banking-tools.test.ts` - Unit tests for banking tools
- `wrangler.toml` - Cloudflare Workers configuration file
- `.github/workflows/deploy.yml` - GitHub Actions CI/CD pipeline
- `workers/types/env.ts` - TypeScript environment variable definitions
- `workers/tsconfig.json` - TypeScript configuration for Workers
- `workers/lib/monitoring.ts` - Performance metrics and error tracking implementation
- `workers/lib/monitoring.test.ts` - Unit tests for monitoring functionality
- `.dev.vars` - Local development environment variables (gitignored)
- `package.json` - Updated with Workers-specific scripts and dependencies

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npm test` to run all tests, or `npx jest workers/` to run only Worker tests
- Use `wrangler dev` for local development and `wrangler deploy` for production deployment
- Follow [Cloudflare's official MCP server guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) and [TypeScript SDK examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/server)
- DO NOT push any changes to or delete the current Netlify MCP edge client; we can use that prod version as an archive of our prior test, as it works.

## Tasks

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

- [ ] 2.0 Core MCP Server Implementation
  - [x] 2.1 Create main Worker entry point (`workers/index.ts`) with fetch handler
  - [x] 2.2 Implement MCP protocol handler (`workers/lib/mcp-server.ts`) with JSON-RPC 2.0 compliance
  - [x] 2.3 Add capability negotiation and initialization handshake logic
  - [x] 2.4 Implement session management with `Mcp-Session-Id` header tracking
  - [x] 2.5 Add structured error handling with proper JSON-RPC error codes
  - [x] 2.6 Create environment types definition (`workers/types/env.ts`) for TypeScript
  - [ ] 2.7 Implement structured logging for debugging and monitoring
  - [ ] 2.8 Add performance metrics tracking (response times, connection counts)
  - [ ] 2.9 Write unit tests for core MCP server functionality

- [ ] 3.0 Transport Layer Implementation (SSE + HTTP)
  - [ ] 3.1 Implement Server-Sent Events handler (`workers/lib/sse-handler.ts`) using TransformStream
  - [ ] 3.2 Add SSE connection management with heartbeat mechanism (30-second intervals)
  - [ ] 3.3 Implement proper CORS headers for Claude.ai and Claude Desktop integration
  - [ ] 3.4 Add connection cleanup on client disconnect and abort signals
  - [ ] 3.5 Implement dual transport support (SSE + Streamable HTTP) for compatibility
  - [ ] 3.6 Add request routing logic to handle different transport methods
  - [ ] 3.7 Write unit tests for transport layer functionality

- [ ] 4.0 Banking Tools Migration and Integration
  - [ ] 4.1 Create Supabase client adapter (`workers/lib/supabase-client.ts`) for Cloudflare Workers
  - [ ] 4.2 Migrate existing banking tools to new architecture (`workers/lib/banking-tools.ts`)
  - [ ] 4.3 Implement authless tool execution (no authentication required for demo)
  - [ ] 4.4 Add tool discovery and capability reporting for MCP clients
  - [ ] 4.5 Ensure all tools meet performance requirements (<2 seconds execution time)
  - [ ] 4.6 Add proper error handling and logging for tool operations
  - [ ] 4.7 Implement rate limiting to prevent abuse of demo endpoints
  - [ ] 4.8 Add health check endpoint for service monitoring
  - [ ] 4.9 Write comprehensive unit tests for all banking tools

- [ ] 5.0 CI/CD Pipeline and Deployment Configuration
  - [ ] 5.1 Create GitHub Actions workflow (`.github/workflows/deploy.yml`) for automated deployment
  - [ ] 5.2 Configure staging and production environment deployments
  - [ ] 5.3 Add automated testing in CI pipeline before deployment
  - [ ] 5.4 Set up Cloudflare Workers secrets management in production
  - [ ] 5.5 Configure custom domains and SSL certificates in Cloudflare
  - [ ] 5.6 Add deployment scripts to `package.json` for local and remote deployment
  - [ ] 5.7 Configure blue-green deployment strategy with Netlify fallback
  - [ ] 5.8 Set up monitoring and alerting for performance metrics (response times, error rates, connection counts)
  - [ ] 5.9 Test CI/CD pipeline with staging environment deployment

- [ ] 6.0 Testing, Validation, and Production Deployment
  - [ ] 6.1 Test local development server with `wrangler dev` and validate basic functionality
  - [ ] 6.2 Use MCP inspector tool (`npx @modelcontextprotocol/inspector@latest`) to validate server compliance
  - [ ] 6.3 Test with Cloudflare AI Playground for remote MCP client validation
  - [ ] 6.4 Configure Claude Desktop integration using mcp-remote proxy
  - [ ] 6.5 Perform load testing to ensure performance requirements are met
  - [ ] 6.6 Perform DNS cutover from Netlify to Cloudflare Workers
  - [ ] 6.7 Deploy to production and monitor for 48 hours with rollback readiness
  - [ ] 6.8 Validate rollback criteria (functionality regression, performance degradation, connection failures)
  - [ ] 6.9 Update documentation and clean up legacy Netlify code
  - [ ] 6.10 Validate all success metrics (Claude Desktop integration, performance benchmarks, zero regression)
  - [ ] 6.11 Conduct post-migration retrospective and document lessons learned 