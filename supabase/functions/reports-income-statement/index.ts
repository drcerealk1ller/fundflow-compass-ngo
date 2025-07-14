import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = "https://xnzgnnrpneyoonwvveno.supabase.co"
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface IncomeStatementEntry {
  account_code: string
  account_name: string
  amount: number
}

interface IncomeStatementData {
  income: IncomeStatementEntry[]
  expenses: IncomeStatementEntry[]
  total_income: number
  total_expenses: number
  net_income: number
  start_date: string
  end_date: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check user permissions
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['admin', 'finance_manager'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    let startDate = url.searchParams.get('start_date')
    let endDate = url.searchParams.get('end_date')
    const reportingPeriodId = url.searchParams.get('reporting_period_id')

    // If reporting period is specified, use its dates
    if (reportingPeriodId) {
      const { data: period } = await supabase
        .from('reporting_periods')
        .select('start_date, end_date')
        .eq('id', reportingPeriodId)
        .single()
      
      if (period) {
        startDate = period.start_date
        endDate = period.end_date
      }
    }

    // Default to current year if no dates provided
    if (!startDate || !endDate) {
      const currentYear = new Date().getFullYear()
      startDate = `${currentYear}-01-01`
      endDate = `${currentYear}-12-31`
    }

    // Get all Income and Expense accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .in('type', ['Income', 'Expense'])

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch accounts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get transaction entries within the date range
    const { data: entries, error: entriesError } = await supabase
      .from('transaction_entries')
      .select(`
        *,
        transactions!inner(date),
        chart_of_accounts!inner(code, name, type)
      `)
      .gte('transactions.date', startDate)
      .lte('transactions.date', endDate)

    if (entriesError) {
      console.error('Error fetching entries:', entriesError)
      return new Response(JSON.stringify({ error: 'Failed to fetch transaction entries' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculate amounts by account
    const accountAmounts: { [accountId: string]: number } = {}

    entries.forEach((entry: any) => {
      const accountId = entry.account_id
      const accountType = entry.chart_of_accounts.type
      
      if (!accountAmounts[accountId]) {
        accountAmounts[accountId] = 0
      }

      let amountChange = 0

      if (accountType === 'Income') {
        // Income increases with credits
        amountChange = entry.entry_type === 'credit' ? entry.amount : -entry.amount
      } else if (accountType === 'Expense') {
        // Expenses increase with debits
        amountChange = entry.entry_type === 'debit' ? entry.amount : -entry.amount
      }

      accountAmounts[accountId] += amountChange
    })

    // Organize data by account type
    const income: IncomeStatementEntry[] = []
    const expenses: IncomeStatementEntry[] = []

    accounts.forEach((account: any) => {
      const amount = accountAmounts[account.id] || 0
      
      const entry: IncomeStatementEntry = {
        account_code: account.code,
        account_name: account.name,
        amount: amount
      }

      if (account.type === 'Income') {
        income.push(entry)
      } else if (account.type === 'Expense') {
        expenses.push(entry)
      }
    })

    // Calculate totals
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
    const netIncome = totalIncome - totalExpenses

    const incomeStatementData: IncomeStatementData = {
      income,
      expenses,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_income: netIncome,
      start_date: startDate,
      end_date: endDate
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: incomeStatementData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in reports-income-statement function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})