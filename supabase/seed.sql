-- Demo user
INSERT INTO users (id, email, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'demo@penguinbank.cloud', 'Demo Penguin');

-- Demo accounts
INSERT INTO accounts (user_id, account_type, account_number, balance, available_balance) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'checking', 'PB-CHK-001', 2456.78, 2456.78),
  ('550e8400-e29b-41d4-a716-446655440001', 'savings', 'PB-SAV-001', 15234.50, 15234.50);

-- Demo transactions (get account IDs from inserted data)
WITH checking_account AS (
  SELECT id FROM accounts 
  WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' 
  AND account_type = 'checking'
)
INSERT INTO transactions (account_id, transaction_type, amount, merchant, category, description, balance_after) 
SELECT 
  id,
  'debit',
  4.50,
  'Arctic Coffee Co',
  'dining',
  'Morning coffee',
  2456.78
FROM checking_account;

WITH checking_account AS (
  SELECT id FROM accounts 
  WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' 
  AND account_type = 'checking'
)
INSERT INTO transactions (account_id, transaction_type, amount, merchant, category, description, balance_after, created_at) 
SELECT 
  id,
  'debit',
  75.00,
  'Iceberg Groceries',
  'groceries',
  'Weekly grocery shopping',
  2381.78,
  NOW() - INTERVAL '1 day'
FROM checking_account;

WITH checking_account AS (
  SELECT id FROM accounts 
  WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' 
  AND account_type = 'checking'
)
INSERT INTO transactions (account_id, transaction_type, amount, merchant, category, description, balance_after, created_at) 
SELECT 
  id,
  'credit',
  2500.00,
  'Penguin Corp',
  'salary',
  'Direct deposit payroll',
  4881.78,
  NOW() - INTERVAL '3 days'
FROM checking_account;

-- Demo bills
INSERT INTO bills (user_id, payee, statement_balance, minimum_payment, due_date) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Water Company', 125.50, 25.00, CURRENT_DATE + INTERVAL '14 days'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Electric Company', 187.25, 35.00, CURRENT_DATE + INTERVAL '18 days'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Internet Provider', 89.99, 89.99, CURRENT_DATE + INTERVAL '10 days');