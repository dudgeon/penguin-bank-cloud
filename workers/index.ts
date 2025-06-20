/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 * Cloudflare Worker for PenguinBank MCP Server
 * 
 * This Worker serves as the entry point for the MCP (Model Context Protocol) server,
 * providing banking demo tools through HTTP and SSE endpoints.
 */

import { PenguinBankMCPServer } from './lib/mcp-server';
import { logger } from './lib/logger';
import { metrics } from './lib/metrics';
import type { Env } from './types/env';

// Cloudflare Workers types
export interface ExportedHandler<Env = unknown> {
	fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
}

export interface ExecutionContext {
	waitUntil(promise: Promise<any>): void;
	passThroughOnException(): void;
}

// CORS headers for cross-origin requests
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id',
};

interface JsonRpcRequest {
	jsonrpc: string;
	id?: string | number | null;
	method: string;
	params?: any;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const startTime = Date.now();
		const url = new URL(request.url);
		const requestId = crypto.randomUUID();

		// Initialize logger and metrics
		logger.setLogLevel('debug');
		
		logger.logRequest(request.method, url.pathname, requestId);
		metrics.startRequest(requestId, request.method, url.pathname);

		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			const duration = Date.now() - startTime;
			logger.logResponse(request.method, url.pathname, requestId, 200, duration);
			metrics.endRequest(requestId, 200);
			
			return new Response(null, {
				status: 200,
				headers: corsHeaders
			});
		}

		// Health check endpoint
		if (url.pathname === '/health') {
			const duration = Date.now() - startTime;
			logger.logResponse(request.method, url.pathname, requestId, 200, duration);
			metrics.endRequest(requestId, 200);
			
			return new Response(JSON.stringify({ 
				status: 'healthy',
				mcp_server_ready: true,
				timestamp: new Date().toISOString(),
				metrics: metrics.getMetricsSummary()
			}), {
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders
				}
			});
		}

		// MCP endpoint - handle at root path, /mcp, /sse, or any other path (except /health)
		// This allows the MCP server to be accessed directly at the domain root
		if (url.pathname !== '/health') {
			try {
				logger.debug('MCP request received', {
					requestId,
					method: request.method,
					pathname: url.pathname,
					accept: request.headers.get('Accept')
				});

				// Create MCP server instance and handle the request
				const mcpServer = new PenguinBankMCPServer();
				const response = await mcpServer.handleRequest(request);
				
				const duration = Date.now() - startTime;
				logger.logResponse(request.method, url.pathname, requestId, response.status, duration);
				metrics.endRequest(requestId, response.status);
				
				return response;

			} catch (error) {
				const duration = Date.now() - startTime;
				logger.error('MCP Server Error', {
					requestId,
					method: request.method,
					path: url.pathname,
					duration
				}, error instanceof Error ? error : new Error(String(error)));
				
				logger.logResponse(request.method, url.pathname, requestId, 500, duration);
				metrics.endRequest(requestId, 500);
				
				return new Response(JSON.stringify({
					jsonrpc: '2.0',
					error: {
						code: -32603,
						message: 'Internal error',
						data: error instanceof Error ? error.message : 'Unknown error'
					}
				}), {
					status: 500,
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					}
				});
			}
		}

		// This should never be reached since all non-health requests are handled above
		const duration = Date.now() - startTime;
		logger.error('Unexpected code path reached', {
			requestId,
			method: request.method,
			path: url.pathname,
			duration
		});
		
		logger.logResponse(request.method, url.pathname, requestId, 500, duration);
		metrics.endRequest(requestId, 500);
		
		return new Response(JSON.stringify({
			error: 'Internal Error',
			message: 'Unexpected code path'
		}), {
			status: 500,
			headers: { 
				'Content-Type': 'application/json',
				...corsHeaders
			}
		});
	},
} satisfies ExportedHandler<Env>;
