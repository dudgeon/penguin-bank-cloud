# Penguin Bank Architecture

## Technology Stack
- **Frontend**: Static HTML/CSS/JS on Netlify
- **Backend**: TypeScript Edge Functions on Netlify
- **Database**: Supabase (PostgreSQL)
- **Protocol**: Model Context Protocol (MCP) v2025-06-18
- **CI/CD**: GitHub Actions

## Database Architecture
- PostgreSQL on Supabase
- 5 main tables: users, accounts, transactions, bills, payment_history
- Row Level Security (RLS) enabled
- Service role key for demo (auth in future)

## Key Features
1. Real-time account balances from database
2. Transaction history with categorization
3. Bill payment with elicitation workflow
4. Persistent data across sessions
5. Automated deployments with migrations

## Environment Variables Required
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ACCESS_TOKEN (CI/CD)
- SUPABASE_DB_PASSWORD (CI/CD)
- SUPABASE_PROJECT_ID (CI/CD)
- NETLIFY_AUTH_TOKEN (CI/CD)
- NETLIFY_SITE_ID (CI/CD)

## Development Workflow
1. Local Supabase instance for development
2. Migrations tracked in version control
3. Type generation from database schema
4. Automated testing and deployment