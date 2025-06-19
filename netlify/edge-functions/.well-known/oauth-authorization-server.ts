// OAuth 2.1 Authorization Server Metadata Endpoint
export default async (request: Request): Promise<Response> => {
  const metadata = {
    issuer: "https://penguin-bank-cloud.netlify.app",
    authorization_endpoint: "https://penguin-bank-cloud.netlify.app/.netlify/edge-functions/mcp/auth",
    token_endpoint: "https://penguin-bank-cloud.netlify.app/.netlify/edge-functions/mcp/token", 
    registration_endpoint: "https://penguin-bank-cloud.netlify.app/.netlify/edge-functions/mcp/register",
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["read", "write"],
  };

  return new Response(JSON.stringify(metadata), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
};