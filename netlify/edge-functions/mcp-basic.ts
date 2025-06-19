export default async (request: Request): Promise<Response> => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
  };

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    
    // Handle initialization
    if (body.method === "initialize") {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "penguin-bank",
            version: "1.0.0",
            description: "Penguin Bank MCP Server",
          },
        },
        id: body.id,
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Handle tool list
    if (body.method === "tools/list") {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        result: {
          tools: [
            {
              name: "hello_penguin",
              description: "Welcome message for Penguin Bank",
              inputSchema: {
                type: "object",
                properties: {},
              },
            },
          ],
        },
        id: body.id,
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Handle tool call
    if (body.method === "tools/call") {
      const { name } = body.params || {};
      
      if (name === "hello_penguin") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            content: [{
              type: "text",
              text: "🐧 Welcome to Penguin Bank! I'm your AI banking assistant. I can help you with account balances, transactions, bills, and payments. How can I help you today?",
            }],
          },
          id: body.id,
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
    }

    // Unknown method
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: `Method not found: ${body.method}`,
      },
      id: body.id,
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32700,
        message: "Parse error",
        data: error?.message,
      },
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
};