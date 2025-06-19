# Troubleshooting the Penguin Bank MCP Server Connection

## The server shows up but won't connect: here's why and how to fix it

The Penguin Bank MCP server at https://penguinbank.netlify.app/mcp is experiencing connection issues that prevent Claude from recognizing its tools despite appearing in the integrations list. Based on comprehensive research into MCP protocol requirements and common deployment issues, several critical problems are preventing proper connection.

The most likely culprit is **missing or incorrect CORS headers** combined with improper OAuth 2.1 implementation. Remote MCP servers hosted on platforms like Netlify require specific configurations that differ from local MCP servers, and the current implementation appears to be missing these crucial elements. Additionally, the GitHub repository at https://github.com/dudgeon/penguin-bank-cloud could not be accessed during research, suggesting it may be private or the URL contains an error, which limits direct code analysis.

## Critical requirements for remote MCP server connectivity

MCP servers communicating with Claude over the internet must implement several key components that local servers don't require. **OAuth 2.1 authentication is mandatory** for remote servers as of March 2025, replacing the previous optional authentication methods. The server must support Dynamic Client Registration (DCR) and implement Proof Key for Code Exchange (PKCE) for secure authentication flows.

The protocol requires **JSON-RPC 2.0 message formatting** with proper initialization handling. When Claude attempts to connect, it sends an initialization request expecting a specific response format that includes protocol version, server capabilities, and available tools. Any deviation from this format will cause connection failures. The server must also implement **session management** using the `Mcp-Session-Id` header for maintaining stateful connections.

For Netlify deployments specifically, the server needs careful CORS configuration. The required headers include `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods` (GET, POST, DELETE, OPTIONS), and `Access-Control-Allow-Headers` (Content-Type, Accept, Authorization, Mcp-Session-Id). Without these headers, browser-based Claude clients cannot establish cross-origin connections to the MCP server.

## Common Netlify deployment pitfalls affecting MCP servers

Netlify's serverless function architecture introduces unique challenges for MCP server deployment. The platform's **default CORS handling doesn't automatically apply to serverless functions**, requiring explicit header configuration in function responses. This is the most common cause of the "connect" button appearing without successful connection.

Function timeout limits can also cause issues. Netlify functions have execution time constraints that may interrupt long-running MCP operations or complex tool executions. The server must implement efficient response handling and consider breaking complex operations into smaller, manageable chunks.

Environment variable management poses another challenge. OAuth credentials, API keys, and other sensitive configuration must be properly set in Netlify's environment settings and accessed correctly within serverless functions. Missing or incorrectly configured environment variables often manifest as authentication failures during the connection handshake.

## Debugging steps to identify the specific issue

Start diagnosis with the **MCP Inspector tool**, the official debugging utility for MCP servers. Run `npx @modelcontextprotocol/inspector --url https://penguinbank.netlify.app/mcp` to test direct connectivity and tool exposure. This bypasses Claude's client and reveals whether the server properly implements the MCP protocol.

Check the browser's developer console when attempting to connect through Claude. **CORS errors will appear as blocked requests** with specific error messages indicating which headers are missing. Network tab inspection will show the actual requests and responses, helping identify whether the server returns proper JSON-RPC formatted responses.

For authentication issues, verify the OAuth flow independently. The server should expose `.well-known/oauth-authorization-server` metadata and properly handle the authorization code exchange. Testing with tools like Postman can isolate whether OAuth implementation works outside the MCP context.

## Immediate fixes for connection problems

To resolve CORS issues on Netlify, create a `_headers` file in your deployment root with proper CORS configuration, or ensure serverless functions return appropriate headers in every response. The function handler must explicitly set headers even for OPTIONS preflight requests.

For a quick authentication workaround while developing proper OAuth support, implement API key authentication with careful security considerations. Although not recommended for production, this can help isolate whether authentication is the primary blocker.

Ensure the server responds to the initialization request with the exact format Claude expects. The response must include `protocolVersion`, `serverInfo`, and `capabilities` objects with proper tool definitions. Even minor deviations in this structure will cause Claude to fail recognizing available tools.

## Long-term solutions for reliable MCP integration

Implement comprehensive OAuth 2.1 support using established providers like Auth0 or leverage Cloudflare Workers' built-in OAuth capabilities. The investment in proper authentication will ensure long-term compatibility as MCP security requirements evolve.

Consider migrating to platforms with better MCP support. **Cloudflare Workers now offers native MCP server templates** and built-in OAuth providers, significantly simplifying deployment compared to generic hosting platforms. Their edge computing architecture also provides better performance for global users.

Develop robust error handling and logging throughout the MCP server. Detailed logs help diagnose connection issues and provide visibility into the authentication flow, tool execution, and protocol communication. Implement structured logging that captures request/response pairs for debugging.

## Verifying successful connection

Once fixes are implemented, successful connection manifests in several ways. The "connect" button in Claude's integration list will change to indicate active status. Claude will recognize and display available tools when you interact with the chat interface. The MCP icon in Claude's interface will show the connected server and its capabilities.

Test tool execution by requesting Claude to use specific Penguin Bank functions. Successful tool calls confirm end-to-end connectivity including authentication, protocol communication, and tool manifest recognition. Monitor server logs during these operations to ensure proper request handling.

## Conclusion

The Penguin Bank MCP server's connection issues stem from a combination of missing CORS headers, incomplete OAuth implementation, and potential protocol compliance problems common to Netlify deployments. Following the debugging steps and implementing the suggested fixes will establish proper connectivity. Focus initially on CORS configuration and basic protocol compliance before tackling the more complex OAuth requirements. With systematic troubleshooting using the MCP Inspector and careful attention to Netlify's serverless constraints, the server can successfully integrate with Claude's MCP ecosystem.