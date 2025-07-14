-- Create enum types for accounting
CREATE TYPE public.account_type AS ENUM ('Asset', 'Liability', 'Equity', 'Income', 'Expense');
CREATE TYPE public.reference_type AS ENUM ('expense', 'funding', 'allocation');
CREATE TYPE public.entry_type AS ENUM ('debit', 'credit');
CREATE TYPE public.tax_category AS ENUM ('VAT', 'Service', 'None');

-- Create chart_of_accounts table
CREATE TABLE public.chart_of_accounts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    code text NOT NULL UNIQUE,
    type account_type NOT NULL,
    description text,
    parent_account_id uuid REFERENCES public.chart_of_accounts(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    description text NOT NULL,
    reference_type reference_type,
    reference_id uuid,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create transaction_entries table
CREATE TABLE public.transaction_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
    amount numeric NOT NULL,
    entry_type entry_type NOT NULL,
    notes text
);

-- Create reporting_periods table
CREATE TABLE public.reporting_periods (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Modify expenses table
ALTER TABLE public.expenses 
ADD COLUMN account_id uuid REFERENCES public.chart_of_accounts(id),
ADD COLUMN tax_deductible boolean DEFAULT false,
ADD COLUMN invoice_number text,
ADD COLUMN vendor_name text,
ADD COLUMN tax_category tax_category DEFAULT 'None';

-- Modify funding table
ALTER TABLE public.funding 
ADD COLUMN account_id uuid REFERENCES public.chart_of_accounts(id),
ADD COLUMN tax_deductible boolean DEFAULT false,
ADD COLUMN donor_type text;

-- Enable RLS on new tables
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporting_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies for chart_of_accounts
CREATE POLICY "Anyone can view chart of accounts" 
ON public.chart_of_accounts FOR SELECT USING (true);

CREATE POLICY "Finance managers can create accounts" 
ON public.chart_of_accounts FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

CREATE POLICY "Finance managers can update accounts" 
ON public.chart_of_accounts FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

CREATE POLICY "Finance managers can delete accounts" 
ON public.chart_of_accounts FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

-- RLS policies for transactions
CREATE POLICY "Anyone can view transactions" 
ON public.transactions FOR SELECT USING (true);

CREATE POLICY "Finance managers can create transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

CREATE POLICY "Finance managers can update transactions" 
ON public.transactions FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

CREATE POLICY "Finance managers can delete transactions" 
ON public.transactions FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

-- RLS policies for transaction_entries
CREATE POLICY "Anyone can view transaction entries" 
ON public.transaction_entries FOR SELECT USING (true);

CREATE POLICY "Finance managers can create transaction entries" 
ON public.transaction_entries FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

CREATE POLICY "Finance managers can update transaction entries" 
ON public.transaction_entries FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

CREATE POLICY "Finance managers can delete transaction entries" 
ON public.transaction_entries FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

-- RLS policies for reporting_periods
CREATE POLICY "Anyone can view reporting periods" 
ON public.reporting_periods FOR SELECT USING (true);

CREATE POLICY "Finance managers can create reporting periods" 
ON public.reporting_periods FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

CREATE POLICY "Finance managers can update reporting periods" 
ON public.reporting_periods FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

CREATE POLICY "Finance managers can delete reporting periods" 
ON public.reporting_periods FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'finance_manager')
));

-- Create updated_at triggers
CREATE TRIGGER update_chart_of_accounts_updated_at
    BEFORE UPDATE ON public.chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reporting_periods_updated_at
    BEFORE UPDATE ON public.reporting_periods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default chart of accounts
INSERT INTO public.chart_of_accounts (name, code, type, description) VALUES
('Cash', '1001', 'Asset', 'Cash and cash equivalents'),
('Bank Account', '1002', 'Asset', 'Bank checking and savings accounts'),
('Accounts Receivable', '1003', 'Asset', 'Money owed to the organization'),
('Program Assets', '1004', 'Asset', 'Assets used for program delivery'),
('Office Equipment', '1005', 'Asset', 'Computers, furniture, and office equipment'),

('Accounts Payable', '2001', 'Liability', 'Money owed by the organization'),
('Accrued Expenses', '2002', 'Liability', 'Expenses incurred but not yet paid'),
('Deferred Revenue', '2003', 'Liability', 'Funds received but not yet earned'),

('Net Assets', '3001', 'Equity', 'Unrestricted net assets'),
('Restricted Net Assets', '3002', 'Equity', 'Temporarily restricted net assets'),
('Permanently Restricted Net Assets', '3003', 'Equity', 'Permanently restricted net assets'),

('Donation Revenue', '4001', 'Income', 'Individual and corporate donations'),
('Grant Revenue', '4002', 'Income', 'Government and foundation grants'),
('Program Revenue', '4003', 'Income', 'Revenue from program activities'),
('Investment Income', '4004', 'Income', 'Interest and investment returns'),

('Program Expenses', '5001', 'Expense', 'Direct program costs'),
('Personnel Expenses', '5002', 'Expense', 'Salaries, benefits, and contractor costs'),
('Administrative Expenses', '5003', 'Expense', 'General administrative costs'),
('Fundraising Expenses', '5004', 'Expense', 'Costs related to fundraising activities'),
('Office Expenses', '5005', 'Expense', 'Rent, utilities, and office supplies'),
('Travel Expenses', '5006', 'Expense', 'Transportation and accommodation costs'),
('Professional Services', '5007', 'Expense', 'Legal, accounting, and consulting fees');