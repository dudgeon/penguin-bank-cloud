/**
 * Environment variables available to the Cloudflare Worker
 */
export interface Env {
  // Environment type (development, production)
  ENVIRONMENT: string;
  
  // Supabase configuration (will be added as secrets)
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  
  // Cloudflare configuration (for API calls if needed)
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  
  // Optional: Custom bindings can be added here
  // KV?: KVNamespace;
  // DB?: D1Database;
}

/**
 * Context object for Cloudflare Workers
 */
export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

/**
 * Request handler type for the Worker
 */
export type WorkerHandler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext
) => Promise<Response> | Response; 