const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Cache-Control",
  "Access-Control-Expose-Headers": "Content-Type",
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  // Handle SSE connection
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        ...corsHeaders,
      },
      body: "data: {\"type\":\"connection\",\"status\":\"ready\"}\n\n",
    };
  }

  // Handle MCP JSON-RPC requests
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body);
      
      // Handle initialization
      if (body.method === "initialize") {
        const response = {
          jsonrpc: "2.0",
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            serverInfo: {
              name: "penguin-bank",
              version: "1.0.0",
              description: "Penguin Bank MCP Server",
            },
          },
          id: body.id,
        };

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
          body: JSON.stringify(response),
        };
      }

      // Handle notifications
      if (body.method === "notifications/initialized") {
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            result: null,
            id: body.id,
          }),
        };
      }

      // Handle tool list
      if (body.method === "tools/list") {
        const response = {
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
              {
                name: "get_balance",
                description: "Get account balances (demo data)",
                inputSchema: {
                  type: "object",
                  properties: {},
                },
              },
            ],
          },
          id: body.id,
        };

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
          body: JSON.stringify(response),
        };
      }

      // Handle resources list
      if (body.method === "resources/list") {
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            result: { resources: [] },
            id: body.id,
          }),
        };
      }

      // Handle prompts list
      if (body.method === "prompts/list") {
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            result: { prompts: [] },
            id: body.id,
          }),
        };
      }

      // Handle tool calls
      if (body.method === "tools/call") {
        const { name } = body.params || {};
        
        if (name === "hello_penguin") {
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              result: {
                content: [{
                  type: "text",
                  text: "🐧 Welcome to Penguin Bank! I'm your AI banking assistant. I can help you with account balances, transactions, bills, and payments. How can I help you today?",
                }],
              },
              id: body.id,
            }),
          };
        }

        if (name === "get_balance") {
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              result: {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    accounts: [
                      {
                        type: "checking",
                        account_number: "PB-CHK-001",
                        balance: "$2,543.67",
                        available_balance: "$2,543.67",
                      },
                      {
                        type: "savings", 
                        account_number: "PB-SAV-001",
                        balance: "$15,234.89",
                        available_balance: "$15,234.89",
                      },
                    ],
                  }, null, 2),
                }],
              },
              id: body.id,
            }),
          };
        }

        // Unknown tool
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32601,
              message: `Unknown tool: ${name}`,
            },
            id: body.id,
          }),
        };
      }

      // Unknown method
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: `Method not found: ${body.method}`,
          },
          id: body.id,
        }),
      };

    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: "Parse error",
            data: error.message,
          },
        }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: "Method not allowed",
  };
};