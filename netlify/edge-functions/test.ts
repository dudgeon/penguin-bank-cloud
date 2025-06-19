export default async (request: Request): Promise<Response> => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      
      if (body.method === "initialize") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: {
              name: "penguin-bank-test",
              version: "1.0.0",
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

      if (body.method === "tools/list") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            tools: [
              {
                name: "hello_penguin",
                description: "Test tool",
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

      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32601, message: "Method not found" },
        id: body.id,
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32700, message: "Parse error" },
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};