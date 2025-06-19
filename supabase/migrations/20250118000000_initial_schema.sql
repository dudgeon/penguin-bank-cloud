-- Penguin Bank Database Schema
-- Initial migration with comprehensive banking tables, constraints, and indexes

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_name_length CHECK (length(name) >= 2 AND length(name) <= 100)
);

-- =====================================================
-- ACCOUNTS TABLE  
-- =====================================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  routing_number TEXT NOT NULL DEFAULT '021000021',
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  available_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  interest_rate DECIMAL(5,4) DEFAULT 0.0001,
  is_active BOOLEAN DEFAULT TRUE,
  daily_limit DECIMAL(10,2) DEFAULT 1000.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT accounts_type_check CHECK (account_type IN ('checking', 'savings')),
  CONSTRAINT accounts_balance_positive CHECK (balance >= 0),
  CONSTRAINT accounts_available_balance_valid CHECK (available_balance >= 0 AND available_balance <= balance),
  CONSTRAINT accounts_number_format CHECK (account_number ~ '^PB-[A-Z]{3}-[0-9]{3}$'),
  CONSTRAINT accounts_interest_rate_valid CHECK (interest_rate >= 0 AND interest_rate <= 0.1),
  UNIQUE(user_id, account_type)
);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  merchant TEXT,
  category TEXT,
  description TEXT NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  reference_number TEXT UNIQUE DEFAULT 'TXN' || replace(gen_random_uuid()::text, '-', ''),
  status TEXT DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT transactions_type_check CHECK (transaction_type IN ('credit', 'debit')),
  CONSTRAINT transactions_amount_positive CHECK (amount > 0),
  CONSTRAINT transactions_balance_positive CHECK (balance_after >= 0),
  CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  CONSTRAINT transactions_description_length CHECK (length(description) >= 1 AND length(description) <= 500)
);

-- =====================================================
-- BILLS TABLE
-- =====================================================
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payee TEXT NOT NULL,
  statement_balance DECIMAL(12,2) NOT NULL,
  minimum_payment DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  account_number TEXT,
  category TEXT DEFAULT 'utilities',
  is_paid BOOLEAN DEFAULT FALSE,
  is_autopay BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT bills_statement_balance_positive CHECK (statement_balance >= 0),
  CONSTRAINT bills_minimum_payment_valid CHECK (minimum_payment >= 0 AND minimum_payment <= statement_balance),
  CONSTRAINT bills_due_date_future CHECK (due_date >= CURRENT_DATE - INTERVAL '30 days'),
  CONSTRAINT bills_payee_length CHECK (length(payee) >= 2 AND length(payee) <= 100),
  CONSTRAINT bills_category_check CHECK (category IN ('utilities', 'credit_card', 'loan', 'insurance', 'subscription', 'other'))
);

-- =====================================================
-- PAYMENT HISTORY TABLE
-- =====================================================
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_type TEXT NOT NULL,
  confirmation_number TEXT UNIQUE NOT NULL DEFAULT 'PB' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  status TEXT DEFAULT 'completed',
  scheduled_date DATE,
  processed_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT payment_amount_positive CHECK (amount > 0),
  CONSTRAINT payment_type_check CHECK (payment_type IN ('one_time', 'autopay', 'scheduled')),
  CONSTRAINT payment_status_check CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  CONSTRAINT payment_confirmation_format CHECK (confirmation_number ~ '^PB[a-f0-9A-F]{12}$')
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Accounts indexes  
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_number ON accounts(account_number);
CREATE INDEX idx_accounts_active ON accounts(is_active) WHERE is_active = TRUE;

-- Transactions indexes
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_merchant ON transactions(merchant);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_amount ON transactions(amount);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Bills indexes
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_bills_payee ON bills(payee);
CREATE INDEX idx_bills_paid_status ON bills(is_paid, due_date);
CREATE INDEX idx_bills_autopay ON bills(is_autopay) WHERE is_autopay = TRUE;

-- Payment history indexes
CREATE INDEX idx_payment_history_bill_id ON payment_history(bill_id);
CREATE INDEX idx_payment_history_account_id ON payment_history(account_id);
CREATE INDEX idx_payment_history_processed_date ON payment_history(processed_date DESC);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_confirmation ON payment_history(confirmation_number);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Demo policies (for service role access)
-- In production, implement proper user-based auth policies

-- Users policies
CREATE POLICY "users_demo_policy" ON users FOR ALL USING (true);

-- Accounts policies  
CREATE POLICY "accounts_demo_policy" ON accounts FOR ALL USING (true);

-- Transactions policies
CREATE POLICY "transactions_demo_policy" ON transactions FOR ALL USING (true);

-- Bills policies
CREATE POLICY "bills_demo_policy" ON bills FOR ALL USING (true);

-- Payment history policies
CREATE POLICY "payment_history_demo_policy" ON payment_history FOR ALL USING (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Account summary view
CREATE VIEW account_summary AS
SELECT 
    a.id,
    a.user_id,
    a.account_type,
    a.account_number,
    a.balance,
    a.available_balance,
    u.name as user_name,
    u.email as user_email,
    COUNT(t.id) as transaction_count,
    MAX(t.created_at) as last_transaction_date
FROM accounts a
JOIN users u ON a.user_id = u.id
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY a.id, a.user_id, a.account_type, a.account_number, a.balance, a.available_balance, u.name, u.email;

-- Recent transactions view
CREATE VIEW recent_transactions AS
SELECT 
    t.id,
    t.account_id,
    t.transaction_type,
    t.amount,
    t.merchant,
    t.category,
    t.description,
    t.balance_after,
    t.created_at,
    a.account_number,
    a.account_type,
    u.name as user_name
FROM transactions t
JOIN accounts a ON t.account_id = a.id
JOIN users u ON a.user_id = u.id
ORDER BY t.created_at DESC;