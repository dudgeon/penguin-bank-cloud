-- =====================================================
-- PENGUIN BANK SEED DATA
-- Comprehensive demo data for realistic banking experience
-- =====================================================

-- Demo user with complete profile
INSERT INTO users (id, email, name, phone, date_of_birth, address) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001', 
    'demo@penguinbank.cloud', 
    'Alex Penguin',
    '+1-555-0123',
    '1985-03-15',
    '{
      "street": "123 Iceberg Lane",
      "city": "Antarctic City", 
      "state": "AN",
      "zip": "99501",
      "country": "USA"
    }'::jsonb
  );

-- Demo accounts with realistic details
INSERT INTO accounts (user_id, account_type, account_number, balance, available_balance, interest_rate, daily_limit) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'checking', 'PB-CHK-001', 3247.83, 3247.83, 0.0001, 1500.00),
  ('550e8400-e29b-41d4-a716-446655440001', 'savings', 'PB-SAV-001', 28450.75, 28450.75, 0.0425, 500.00);

-- =====================================================
-- REALISTIC TRANSACTION HISTORY (90 days)
-- =====================================================

-- Get account IDs for referencing
WITH account_ids AS (
  SELECT 
    id as checking_id,
    (SELECT id FROM accounts WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' AND account_type = 'savings') as savings_id
  FROM accounts 
  WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' 
  AND account_type = 'checking'
)

-- Insert comprehensive transaction history
INSERT INTO transactions (account_id, transaction_type, amount, merchant, category, description, balance_after, created_at, reference_number) 
SELECT * FROM (
  SELECT checking_id, 'credit', 2500.00, 'Penguin Corp', 'salary', 'Direct deposit payroll', 3247.83, NOW() - INTERVAL '1 hour', 'TXN001' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 4.75, 'Arctic Coffee Co', 'dining', 'Morning latte', 3243.08, NOW() - INTERVAL '2 hours', 'TXN002' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 127.50, 'Iceberg Groceries', 'groceries', 'Weekly grocery shopping', 3115.58, NOW() - INTERVAL '1 day', 'TXN003' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 89.99, 'Polar Gas Station', 'transportation', 'Gas fill-up', 3025.59, NOW() - INTERVAL '2 days', 'TXN004' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 45.20, 'Snow Pharmacy', 'healthcare', 'Prescription medication', 2980.39, NOW() - INTERVAL '3 days', 'TXN005' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 125.50, 'Water Company', 'utilities', 'Monthly water bill payment', 2854.89, NOW() - INTERVAL '4 days', 'TXN006' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 67.85, 'Tundra Restaurant', 'dining', 'Dinner with friends', 2787.04, NOW() - INTERVAL '5 days', 'TXN007' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 25.00, 'Ice Cleaning Services', 'home', 'House cleaning', 2762.04, NOW() - INTERVAL '6 days', 'TXN008' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 187.25, 'Electric Company', 'utilities', 'Monthly electric bill payment', 2574.79, NOW() - INTERVAL '7 days', 'TXN009' FROM account_ids
  UNION ALL
  SELECT checking_id, 'credit', 2500.00, 'Penguin Corp', 'salary', 'Direct deposit payroll', 5074.79, NOW() - INTERVAL '14 days', 'TXN010' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 1200.00, 'Glacier Apartments', 'housing', 'Monthly rent payment', 3874.79, NOW() - INTERVAL '15 days', 'TXN011' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 89.99, 'Blizzard Internet', 'utilities', 'Monthly internet bill', 3784.80, NOW() - INTERVAL '16 days', 'TXN012' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 35.60, 'Penguin Fitness', 'health', 'Gym membership', 3749.20, NOW() - INTERVAL '17 days', 'TXN013' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 156.78, 'Frost Electronics', 'shopping', 'Smartphone case and charger', 3592.42, NOW() - INTERVAL '18 days', 'TXN014' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 92.15, 'Iceberg Groceries', 'groceries', 'Weekly grocery shopping', 3500.27, NOW() - INTERVAL '21 days', 'TXN015' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 45.00, 'Polar Car Wash', 'transportation', 'Car wash and detailing', 3455.27, NOW() - INTERVAL '22 days', 'TXN016' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 12.99, 'Netflix', 'entertainment', 'Monthly streaming subscription', 3442.28, NOW() - INTERVAL '23 days', 'TXN017' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 78.50, 'Snow Department Store', 'shopping', 'Winter clothing', 3363.78, NOW() - INTERVAL '24 days', 'TXN018' FROM account_ids
  UNION ALL
  SELECT checking_id, 'credit', 50.00, 'Refund Processing', 'refund', 'Return credit for unused item', 3413.78, NOW() - INTERVAL '25 days', 'TXN019' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 15.75, 'Arctic Coffee Co', 'dining', 'Coffee and pastry', 3398.03, NOW() - INTERVAL '26 days', 'TXN020' FROM account_ids
  UNION ALL
  SELECT checking_id, 'credit', 2500.00, 'Penguin Corp', 'salary', 'Direct deposit payroll', 5898.03, NOW() - INTERVAL '28 days', 'TXN021' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 225.00, 'Ice Insurance Co', 'insurance', 'Auto insurance premium', 5673.03, NOW() - INTERVAL '29 days', 'TXN022' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 67.82, 'Penguin Pharmacy', 'healthcare', 'Medical supplies', 5605.21, NOW() - INTERVAL '30 days', 'TXN023' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 98.45, 'Iceberg Groceries', 'groceries', 'Weekly grocery shopping', 5506.76, NOW() - INTERVAL '35 days', 'TXN024' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 145.60, 'Polar Veterinary', 'pets', 'Pet checkup and vaccinations', 5361.16, NOW() - INTERVAL '36 days', 'TXN025' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 89.99, 'Polar Gas Station', 'transportation', 'Gas fill-up', 5271.17, NOW() - INTERVAL '37 days', 'TXN026' FROM account_ids
  UNION ALL
  SELECT checking_id, 'credit', 2500.00, 'Penguin Corp', 'salary', 'Direct deposit payroll', 7771.17, NOW() - INTERVAL '42 days', 'TXN027' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 1200.00, 'Glacier Apartments', 'housing', 'Monthly rent payment', 6571.17, NOW() - INTERVAL '45 days', 'TXN028' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 125.30, 'Iceberg Groceries', 'groceries', 'Weekly grocery shopping', 6445.87, NOW() - INTERVAL '49 days', 'TXN029' FROM account_ids
  UNION ALL
  SELECT checking_id, 'debit', 187.25, 'Electric Company', 'utilities', 'Monthly electric bill payment', 6258.62, NOW() - INTERVAL '52 days', 'TXN030' FROM account_ids
  UNION ALL
  -- Savings account transactions
  SELECT savings_id, 'credit', 1000.00, 'Transfer from Checking', 'transfer', 'Monthly savings transfer', 28450.75, NOW() - INTERVAL '15 days', 'TXN031' FROM account_ids
  UNION ALL
  SELECT savings_id, 'credit', 1000.00, 'Transfer from Checking', 'transfer', 'Monthly savings transfer', 27450.75, NOW() - INTERVAL '45 days', 'TXN032' FROM account_ids
  UNION ALL
  SELECT savings_id, 'credit', 500.00, 'Transfer from Checking', 'transfer', 'Emergency fund contribution', 26450.75, NOW() - INTERVAL '60 days', 'TXN033' FROM account_ids
  UNION ALL
  SELECT savings_id, 'credit', 2.45, 'Interest Payment', 'interest', 'Monthly interest earned', 25950.75, NOW() - INTERVAL '30 days', 'TXN034' FROM account_ids
  UNION ALL
  SELECT savings_id, 'credit', 2.38, 'Interest Payment', 'interest', 'Monthly interest earned', 25948.30, NOW() - INTERVAL '60 days', 'TXN035' FROM account_ids
) AS transaction_data;

-- =====================================================
-- BILLS DATA - Comprehensive bill portfolio
-- =====================================================

INSERT INTO bills (user_id, payee, statement_balance, minimum_payment, due_date, account_number, category, is_autopay) VALUES
  -- Utilities
  ('550e8400-e29b-41d4-a716-446655440001', 'Arctic Water & Sewer', 125.50, 125.50, CURRENT_DATE + INTERVAL '8 days', 'AW-789456123', 'utilities', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'Polar Electric Company', 187.25, 187.25, CURRENT_DATE + INTERVAL '12 days', 'PE-456789012', 'utilities', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Blizzard Internet & Cable', 89.99, 89.99, CURRENT_DATE + INTERVAL '15 days', 'BI-321654987', 'utilities', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Ice Natural Gas', 67.82, 67.82, CURRENT_DATE + INTERVAL '20 days', 'ING-987321654', 'utilities', false),
  
  -- Credit Cards
  ('550e8400-e29b-41d4-a716-446655440001', 'Penguin Visa Card', 1247.89, 45.00, CURRENT_DATE + INTERVAL '18 days', '****-1234', 'credit_card', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'Arctic Express Card', 567.23, 25.00, CURRENT_DATE + INTERVAL '22 days', '****-5678', 'credit_card', false),
  
  -- Insurance
  ('550e8400-e29b-41d4-a716-446655440001', 'Ice Shield Auto Insurance', 225.00, 225.00, CURRENT_DATE + INTERVAL '25 days', 'IS-AUTO-789', 'insurance', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Penguin Health Insurance', 345.67, 345.67, CURRENT_DATE + INTERVAL '28 days', 'PH-MED-456', 'insurance', true),
  
  -- Subscriptions  
  ('550e8400-e29b-41d4-a716-446655440001', 'Netflix Streaming', 12.99, 12.99, CURRENT_DATE + INTERVAL '3 days', 'NF-SUB-123', 'subscription', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Penguin Fitness Club', 35.60, 35.60, CURRENT_DATE + INTERVAL '6 days', 'PFC-MEM-789', 'subscription', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Cloud Storage Pro', 9.99, 9.99, CURRENT_DATE + INTERVAL '10 days', 'CS-PRO-456', 'subscription', true),
  
  -- Loans
  ('550e8400-e29b-41d4-a716-446655440001', 'Iceberg Auto Loan', 15678.90, 298.45, CURRENT_DATE + INTERVAL '30 days', 'IAL-567890', 'loan', true);

-- =====================================================
-- PAYMENT HISTORY - Realistic payment records
-- =====================================================

WITH account_data AS (
  SELECT 
    checking.id as checking_id,
    bills.id as bill_id,
    bills.payee,
    bills.minimum_payment
  FROM accounts checking
  CROSS JOIN bills
  WHERE checking.user_id = '550e8400-e29b-41d4-a716-446655440001' 
  AND checking.account_type = 'checking'
  AND bills.user_id = '550e8400-e29b-41d4-a716-446655440001'
)

INSERT INTO payment_history (bill_id, account_id, amount, payment_type, status, processed_date, notes, confirmation_number)
SELECT 
  bill_id,
  checking_id,
  minimum_payment,
  CASE 
    WHEN payee LIKE '%Electric%' OR payee LIKE '%Internet%' OR payee LIKE '%Insurance%' OR payee LIKE '%Netflix%' OR payee LIKE '%Fitness%' OR payee LIKE '%Cloud%' OR payee LIKE '%Auto Loan%' THEN 'autopay'
    ELSE 'one_time'
  END,
  'completed',
  NOW() - INTERVAL (FLOOR(RANDOM() * 30) + 30) || ' days',
  'Previous month payment',
  'PB' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)
FROM account_data
WHERE payee IN ('Polar Electric Company', 'Blizzard Internet & Cable', 'Ice Shield Auto Insurance', 'Netflix Streaming', 'Penguin Fitness Club')
LIMIT 10;

-- Add a few more historical payments
WITH checking_account AS (
  SELECT id FROM accounts 
  WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' 
  AND account_type = 'checking'
),
water_bill AS (
  SELECT id FROM bills 
  WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' 
  AND payee = 'Arctic Water & Sewer'
)

INSERT INTO payment_history (bill_id, account_id, amount, payment_type, status, processed_date, notes, confirmation_number)
SELECT 
  water_bill.id,
  checking_account.id,
  125.50,
  'one_time',
  'completed',
  NOW() - INTERVAL '35 days',
  'Previous month water bill',
  'PB' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)
FROM checking_account, water_bill;