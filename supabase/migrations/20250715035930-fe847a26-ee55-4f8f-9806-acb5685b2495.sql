-- Add new fields to expenses table for better financial reporting
ALTER TABLE public.expenses 
ADD COLUMN voucher_reference TEXT,
ADD COLUMN paid_from_account_id UUID REFERENCES public.chart_of_accounts(id),
ADD COLUMN transaction_type TEXT DEFAULT 'Expense',
ADD COLUMN payment_mode TEXT,
ADD COLUMN fund_source_id UUID REFERENCES public.funding(id);

-- Update the existing account_id column comment for clarity
COMMENT ON COLUMN public.expenses.account_id IS 'Paid to / Expense account';
COMMENT ON COLUMN public.expenses.paid_from_account_id IS 'Paid from account (e.g., Bank, Cash)';
COMMENT ON COLUMN public.expenses.voucher_reference IS 'Voucher or reference ID (payment voucher number, receipt number, etc.)';
COMMENT ON COLUMN public.expenses.fund_source_id IS 'Fund source / Donor who funded this expense';
COMMENT ON COLUMN public.expenses.payment_mode IS 'Payment mode (Cash, Bank Transfer, Cheque, etc.)';
COMMENT ON COLUMN public.expenses.transaction_type IS 'Transaction type (usually Expense)';

-- Add some default chart of accounts for common NGO accounts if they don't exist
INSERT INTO public.chart_of_accounts (code, name, type, description) VALUES 
('1001', 'Cash in Hand', 'Asset', 'Physical cash available'),
('1002', 'Bank Account - Operations', 'Asset', 'Main operational bank account'),
('1003', 'Bank Account - Restricted', 'Asset', 'Restricted funds bank account'),
('5001', 'Program Expenses', 'Expense', 'Direct program implementation costs'),
('5002', 'Administrative Expenses', 'Expense', 'General administrative costs'),
('5003', 'Travel Expenses', 'Expense', 'Travel and transportation costs'),
('5004', 'Supplies and Materials', 'Expense', 'Office supplies and materials'),
('5005', 'Utilities', 'Expense', 'Electricity, water, internet, etc.')
ON CONFLICT (code) DO NOTHING;