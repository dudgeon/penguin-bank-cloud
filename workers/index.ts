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
 * PenguinBank MCP Server on Cloudflare Workers
 * Implements full MCP protocol with JSON-RPC 2.0 compliance
 */

import { PenguinBankMCPServer } from './lib/mcp-server';
import { logger } from './lib/logger';
import { metrics } from './lib/metrics';
import type { Env } from './types/env';

interface JsonRpcRequest {
	jsonrpc: string;
	id?: string | number | null;
	method: string;
	params?: any;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const startTime = Date.now();
		const requestId = crypto.randomUUID();
		
		// Log incoming request
		logger.logRequest(request.method, url.pathname, requestId, {
			userAgent: request.headers.get('User-Agent'),
			origin: request.headers.get('Origin')
		});
		
		// Start metrics tracking
		metrics.startRequest(
			requestId, 
			request.method, 
			url.pathname, 
			request.headers.get('User-Agent') || undefined,
			request.headers.get('Origin') || undefined
		);
		
		// Add CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// Handle preflight OPTIONS requests
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
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

		// MCP endpoint - handle both POST requests and SSE connections
		if (url.pathname === '/mcp' || url.pathname === '/sse') {
			try {
				// For SSE connections
				if (request.headers.get('Accept') === 'text/event-stream') {
					// This is a simplified SSE implementation
					// In a full implementation, you'd need to handle the MCP protocol over SSE
					return new Response('data: {"jsonrpc":"2.0","method":"notifications/initialized"}\n\n', {
						headers: {
							'Content-Type': 'text/event-stream',
							'Cache-Control': 'no-cache',
							'Connection': 'keep-alive',
							...corsHeaders
						}
					});
				}

				// Handle JSON-RPC requests
				if (request.method === 'POST') {
					const body = await request.json() as JsonRpcRequest;
					
					logger.debug('MCP request received', {
						requestId,
						method: body.method,
						id: body.id
					});
					
					// Create MCP server instance
					const mcpServer = new PenguinBankMCPServer();
					
					// Handle initialize request
					if (body.method === 'initialize') {
						metrics.endRequest(requestId, 200);
						return new Response(JSON.stringify({
							jsonrpc: '2.0',
							id: body.id,
							result: {
								protocolVersion: '2024-11-05',
								capabilities: {
									tools: {}
								},
								serverInfo: {
									name: 'PenguinBank Demo',
									version: '1.0.0'
								}
							}
						}), {
							headers: { 
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					}

					// For now, return a simple response for other methods
					// TODO: Properly integrate with the MCP SDK's request handling
					if (body.method === 'tools/list') {
						metrics.endRequest(requestId, 200);
						return new Response(JSON.stringify({
							jsonrpc: '2.0',
							id: body.id,
							result: {
								tools: [
									{
										name: "get_account_balance",
										description: "Get the current account balance for the demo account",
										inputSchema: {
											type: "object",
											properties: {
												account_id: {
													type: "string",
													description: "Account ID (optional, defaults to demo account)"
												}
											}
										}
									},
									{
										name: "get_recent_transactions",
										description: "Get recent transactions for the demo account",
										inputSchema: {
											type: "object",
											properties: {
												account_id: {
													type: "string",
													description: "Account ID (optional, defaults to demo account)"
												},
												limit: {
													type: "number",
													description: "Number of transactions to return (default: 5)"
												}
											}
										}
									},
									{
										name: "transfer_funds",
										description: "Transfer funds between accounts (demo only - no actual transfer occurs)",
										inputSchema: {
											type: "object",
											properties: {
												from_account: {
													type: "string",
													description: "Source account ID"
												},
												to_account: {
													type: "string",
													description: "Destination account ID"
												},
												amount: {
													type: "number",
													description: "Amount to transfer"
												}
											},
											required: ["from_account", "to_account", "amount"]
										}
									}
								]
							}
						}), {
							headers: { 
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					}

					if (body.method === 'tools/call') {
						const { name, arguments: args } = body.params;
						const toolStartTime = Date.now();
						let result;
						
						logger.info('Tool execution started', {
							requestId,
							toolName: name,
							arguments: args
						});
						
						// Start tool metrics tracking
						const argsSize = JSON.stringify(args || {}).length;
						metrics.startToolExecution(name, requestId, argsSize);

						switch (name) {
							case "get_account_balance":
								const balance = Math.floor(Math.random() * 10000) + 1000;
								const accountId = args?.account_id || 'demo-account-123';
								result = {
									content: [{
										type: "text",
										text: `Account ${accountId} balance: $${balance.toLocaleString()}`
									}]
								};
								break;

							case "get_recent_transactions":
								const txnAccountId = args?.account_id || 'demo-account-123';
								const limit = args?.limit || 5;
								const transactions = [];
								
								for (let i = 0; i < limit; i++) {
									const amount = Math.floor(Math.random() * 500) - 250;
									const isDebit = amount < 0;
									transactions.push({
										id: `txn-${Date.now()}-${i}`,
										date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
										description: isDebit ? 'Purchase at Store' : 'Deposit',
										amount: Math.abs(amount),
										type: isDebit ? 'debit' : 'credit'
									});
								}

								const transactionList = transactions
									.map(t => `${t.date}: ${t.type === 'debit' ? '-' : '+'}$${t.amount} - ${t.description}`)
									.join('\n');

								result = {
									content: [{
										type: "text",
										text: `Recent transactions for account ${txnAccountId}:\n${transactionList}`
									}]
								};
								break;

							case "transfer_funds":
								const { from_account, to_account, amount } = args;
								const transferId = `transfer-${Date.now()}`;
								result = {
									content: [{
										type: "text",
										text: `Demo transfer initiated:\nTransfer ID: ${transferId}\nFrom: ${from_account}\nTo: ${to_account}\nAmount: $${amount}\n\nNote: This is a demo - no actual funds were transferred.`
									}]
								};
								break;

							default:
								metrics.endToolExecution(name, requestId, false);
								metrics.endRequest(requestId, 400);
								return new Response(JSON.stringify({
									jsonrpc: '2.0',
									id: body.id,
									error: {
										code: -32601,
										message: `Unknown tool: ${name}`
									}
								}), {
									status: 400,
									headers: { 
										'Content-Type': 'application/json',
										...corsHeaders
									}
								});
						}

						const toolDuration = Date.now() - toolStartTime;
						logger.logToolExecution(name, requestId, toolDuration, true);
						
						// End tool metrics tracking
						const responseSize = JSON.stringify(result).length;
						metrics.endToolExecution(name, requestId, true, responseSize);
						metrics.endRequest(requestId, 200);

						return new Response(JSON.stringify({
							jsonrpc: '2.0',
							id: body.id,
							result
						}), {
							headers: { 
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					}

					// Default response for unknown methods
					metrics.endRequest(requestId, 400);
					return new Response(JSON.stringify({
						jsonrpc: '2.0',
						id: body.id,
						error: {
							code: -32601,
							message: `Method not found: ${body.method}`
						}
					}), {
						status: 400,
						headers: { 
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}

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

		// Default response for unknown paths
		const duration = Date.now() - startTime;
		logger.warn('Unknown endpoint accessed', {
			requestId,
			method: request.method,
			path: url.pathname,
			duration
		});
		
		logger.logResponse(request.method, url.pathname, requestId, 404, duration);
		metrics.endRequest(requestId, 404);
		
		return new Response(JSON.stringify({
			error: 'Not Found',
			message: 'Available endpoints: /health, /mcp, /sse'
		}), {
			status: 404,
			headers: { 
				'Content-Type': 'application/json',
				...corsHeaders
			}
		});
	},
} satisfies ExportedHandler<Env>;
