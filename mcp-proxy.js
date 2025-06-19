#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Remote server URL
const REMOTE_SERVER_URL = "https://penguin-bank-cloud.netlify.app/.netlify/edge-functions/mcp";

// Create MCP server
const server = new Server(
  {
    name: "penguin-bank-proxy",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to make requests to remote server
async function callRemoteServer(method, params = {}, id = 1) {
  try {
    const response = await fetch(REMOTE_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`Remote server error: ${error.message}`);
  }
}

// Register tools/list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const remoteResponse = await callRemoteServer("tools/list");
  return remoteResponse.result;
});

// Register tools/call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const remoteResponse = await callRemoteServer("tools/call", request.params);
  return remoteResponse.result;
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Penguin Bank MCP Proxy Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});