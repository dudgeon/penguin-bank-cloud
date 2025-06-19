const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: "Method not allowed",
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    // Handle initialization
    if (body.method === "initialize") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({
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
        }),
      };
    }

    // Handle tool list
    if (body.method === "tools/list") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
        body: JSON.stringify({
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
        }),
      };
    }

    // Handle tool call
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
};