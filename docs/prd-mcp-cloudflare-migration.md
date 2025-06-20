# **Product Requirements Document: MCP Server Migration to Cloudflare Workers**

## **1. Introduction/Overview**

This PRD outlines the migration of the PenguinBank MCP (Model Context Protocol) server from Netlify Functions to Cloudflare Workers architecture. The current Netlify-based implementation is incompatible with Claude Desktop's remote MCP server requirements, preventing consumer-friendly usage of our MCP tools.

**Problem Statement**: The existing MCP server architecture does not support Claude Desktop's remote server integration requirements, limiting our ability to provide seamless AI-powered banking tools to end users.

**Goal**: Migrate to a Cloudflare Workers-based architecture that meets Claude Desktop's performance and compatibility requirements while maintaining all existing functionality and improving deployment efficiency.

## **2. Goals**

### **Primary Goals**
1. **Claude Desktop Compatibility**: Enable seamless integration with Claude Desktop as a remote MCP server
2. **Performance Compliance**: Meet Claude Desktop's performance requirements for remote MCP servers (sub-100ms response times for tool discovery, reliable SSE connections)
3. **Zero-Downtime Migration**: Complete migration without service interruption (acceptable for demo app)
4. **Automated CI/CD**: Establish robust GitHub Actions-based deployment pipeline for Cloudflare Workers

### **Secondary Goals**
5. **Cost Optimization**: Reduce hosting costs through Cloudflare's pricing model
6. **Global Performance**: Improve response times through Cloudflare's edge network
7. **Simplified Maintenance**: Reduce manual deployment overhead and configuration complexity

## **3. User Stories**

### **Primary User Stories**
- **As a Claude Desktop user**, I want to connect to the PenguinBank MCP server remotely so that I can access banking tools without local setup
- **As a Claude Desktop user**, I want fast tool discovery and execution so that my AI interactions feel responsive
- **As a developer**, I want to deploy MCP server updates automatically so that I can focus on feature development rather than manual deployment

### **Secondary User Stories**
- **As a system administrator**, I want reliable error handling and logging so that I can quickly diagnose and resolve issues
- **As a developer**, I want consistent environment variable management so that secrets are secure across all environments

## **4. Functional Requirements**

### **4.1 Core MCP Protocol Support**
1. **JSON-RPC 2.0 Compliance**: Server must handle all MCP protocol messages according to specification
2. **Tool Execution**: Support for all existing banking tools (account queries, transaction history, etc.)
3. **Capability Negotiation**: Proper initialization handshake with Claude Desktop
4. **Session Management**: Maintain conversation state across multiple requests
5. **Error Handling**: Return structured JSON-RPC error responses with appropriate codes

### **4.2 Transport Layer Requirements**
6. **Dual Transport Support**: Claude.ai supports both SSE and Streamable HTTP-based servers
7. **3/26 Auth Spec Compliance**: Implement current auth specification (note: future spec updates will require migration)
8. **Session ID Management**: Proper session tracking via `Mcp-Session-Id` headers
9. **Connection Management**: Handle connection lifecycle, timeouts, and cleanup
10. **Inspector Tool Compatibility**: Ensure server works with [MCP inspector tool](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers) for testing

### **4.3 Security Considerations**
10. **Authless Server Support**: Implement as authless remote server (supported by Claude.ai per [official documentation](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers))
11. **Public Demo Access**: No authentication required for public banking demo tools
12. **Supabase Integration**: Maintain existing database integration for demo data
13. **Environment Variable Security**: Secure management of Supabase connection credentials
14. **CORS Configuration**: Proper CORS headers for Claude.ai and Claude Desktop integration

### **4.4 Performance Requirements**
16. **Response Time**: Tool discovery < 100ms, tool execution < 2 seconds
17. **Concurrent Connections**: Support minimum 100 simultaneous SSE connections
18. **Memory Efficiency**: Optimize for Cloudflare Workers' 128MB memory limit
19. **CPU Time Limits**: Ensure all operations complete within 30-second CPU time limit
20. **Multi-Platform Support**: Ensure compatibility with Claude.ai web, Claude Desktop, and upcoming mobile apps

### **4.5 Deployment & CI/CD**
21. **GitHub Actions Integration**: Automated deployment on push to main/develop branches
22. **Environment Separation**: Distinct staging and production environments
23. **Custom Domain Configuration**: Support for `mcp.penguinbank.cloud` and `penguinbank.cloud`
24. **SSL Certificate Management**: Automatic certificate provisioning and renewal
25. **Cloudflare MCP Hosting**: Consider leveraging Cloudflare's built-in MCP server hosting with autoscaling and OAuth management

### **4.6 Monitoring & Observability**
26. **Structured Logging**: Comprehensive logging for debugging and monitoring
27. **Error Tracking**: Capture and report runtime errors
28. **Performance Metrics**: Track response times, error rates, and connection counts
29. **Health Checks**: Endpoint for service health monitoring
30. **MCP Inspector Integration**: Validate server functionality using official MCP inspector tool

## **5. Non-Goals (Out of Scope)**

1. **Breaking Changes**: No changes to existing tool interfaces or data formats
2. **New Features**: No new banking tools or MCP capabilities during migration
3. **Database Migration**: Supabase database schema and data remain unchanged
4. **Client Applications**: No changes to web frontend or mobile apps required
5. **User Interface Changes**: No modifications to Claude Desktop integration UI
6. **Multi-Region Deployment**: Single-region deployment acceptable for initial migration
7. **Load Balancing**: Single Worker instance sufficient for current usage
8. **Backup Strategy Changes**: Existing Supabase backup strategy remains unchanged

## **6. Technical Considerations**

### **6.1 Architecture Overview**
- **Runtime**: Cloudflare Workers with Node.js compatibility
- **Framework**: Express.js with MCP SDK integration
- **Transport**: Dual support for Streamable HTTP and HTTP+SSE
- **Session Storage**: In-memory JavaScript Map for session management
- **Authentication**: OAuth 2.1 with Firebase Auth integration

### **6.2 Migration Strategy**
- **Blue-Green Deployment**: Deploy to new Cloudflare Workers while maintaining Netlify fallback
- **DNS Cutover**: Update DNS records after successful testing
- **Rollback Plan**: Immediate DNS revert to Netlify if critical issues arise

### **6.3 Dependencies**
- **Cloudflare Workers Runtime**: Node.js 18+ compatibility
- **MCP SDK**: `@modelcontextprotocol/sdk` latest version (following [official TypeScript SDK examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/server))
- **Supabase Client**: Maintain existing database integration for demo data
- **Anthropic MCP Spec**: Compliance with [official remote server requirements](https://support.anthropic.com/en/articles/11503834-building-custom-integrations-via-remote-mcp-servers)

### **6.4 Security Considerations**
- **Environment Variables**: Use Cloudflare Workers secrets for Supabase credentials
- **CORS Configuration**: Proper CORS headers for Claude.ai and Claude Desktop integration
- **Rate Limiting**: Implement basic rate limiting to prevent abuse of demo endpoints
- **Public Access**: No user authentication required for demo banking tools

## **7. Success Metrics**

### **7.1 Primary Success Criteria**
1. **Claude Desktop Integration**: Successfully connect and execute tools from Claude Desktop
2. **Performance Benchmarks**: 
   - Tool discovery: < 100ms response time
   - Tool execution: < 2 seconds for banking queries
   - SSE connection stability: > 99% uptime
3. **Zero Regression**: All existing functionality works identically to Netlify version
4. **CI/CD Reliability**: 100% successful deployments via GitHub Actions

### **7.2 Secondary Success Criteria**
5. **Cost Reduction**: Achieve 30% reduction in hosting costs compared to Netlify
6. **Global Performance**: Improve average response times by 25% through edge deployment
7. **Deployment Efficiency**: Reduce deployment time from manual process to < 5 minutes automated

### **7.3 Rollback Criteria**
- Any functionality regression that breaks existing tools
- Performance degradation > 50% compared to Netlify baseline  
- Claude Desktop connection failures > 5% of attempts
- Critical security vulnerabilities discovered during migration

## **8. Implementation Plan**

### **Phase 1: Foundation Setup (Week 1)**
- [ ] Initialize Cloudflare Workers project structure
- [ ] Configure wrangler.toml with environments
- [ ] Set up GitHub Actions workflow
- [ ] Implement basic Express server with health checks

### **Phase 2: Core Migration (Week 2)**
- [ ] Convert Netlify Functions to Workers format
- [ ] Implement dual transport support (Streamable HTTP + SSE)
- [ ] Migrate session management logic
- [ ] Remove authentication code (authless server implementation)

### **Phase 3: Integration & Testing (Week 3)**
- [ ] Configure Cloudflare secrets for Supabase credentials
- [ ] Set up custom domains and SSL certificates
- [ ] Test authless server with Claude.ai and Claude Desktop
- [ ] Validate with MCP inspector tool
- [ ] Performance optimization and monitoring setup

### **Phase 4: Deployment & Cleanup (Week 4)**
- [ ] Production deployment with DNS cutover
- [ ] Monitor for 48 hours with rollback readiness
- [ ] Clean up Netlify resources and documentation
- [ ] Update deployment documentation

## **9. Risk Assessment & Mitigation**

### **High-Risk Items**
1. **SSE Connection Stability**: Risk of dropped connections affecting Claude Desktop
   - *Mitigation*: Implement heartbeat mechanism and proper connection cleanup
   
2. **Authless Server Configuration**: Risk of misconfigured server preventing Claude.ai connection
   - *Mitigation*: Follow official TypeScript SDK examples and test with MCP inspector tool

3. **Session Management Complexity**: Risk of session state loss during migration
   - *Mitigation*: Thorough testing of session lifecycle and cleanup processes

### **Medium-Risk Items**
4. **Performance Regression**: Risk of slower response times on Cloudflare Workers
   - *Mitigation*: Load testing and performance monitoring during migration

5. **Environment Variable Management**: Risk of missing Supabase credentials
   - *Mitigation*: Automated verification of database connection in CI/CD pipeline

### **Low-Risk Items**
6. **DNS Propagation Delays**: Risk of temporary service disruption during cutover
   - *Mitigation*: Schedule migration during low-usage periods with TTL reduction

## **10. Dependencies & Assumptions**

### **External Dependencies**
- Cloudflare Workers platform availability and performance
- GitHub Actions reliability for CI/CD pipeline
- Supabase service continuity for database operations

### **Technical Assumptions**
- Cloudflare Workers Node.js compatibility sufficient for MCP SDK
- Current Supabase usage patterns remain within Cloudflare Workers limits
- Claude Desktop MCP client follows specification correctly
- No breaking changes in MCP SDK during migration period

### **Business Assumptions**
- Demo application status allows for full cutover approach
- No immediate need for multi-region deployment
- Current user base size manageable with single Worker instance
- Cost optimization secondary to functionality and performance

## **11. Open Questions**

1. **Monitoring Strategy**: What specific metrics should trigger alerts in production?
2. **Scaling Thresholds**: At what usage levels should we consider multiple Worker instances?
3. **Rate Limiting Strategy**: What rate limiting should we implement for the public demo endpoints?
4. **Tool Versioning**: How should we handle MCP SDK updates post-migration?
5. **Error Recovery**: What automated recovery mechanisms should we implement for common failure modes?

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: Post-migration retrospective  
**Stakeholders**: Development Team, Infrastructure Team  
**Approval Required**: Technical Lead, Project Manager 