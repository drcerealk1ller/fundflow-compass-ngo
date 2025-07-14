import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = "https://xnzgnnrpneyoonwvveno.supabase.co"
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface LedgerEntry {
  date: string
  account_code: string
  account_name: string
  description: string
  debit_amount: number
  credit_amount: number
  running_balance: number
  reference_type?: string
  reference_id?: string
}

interface LedgerFilters {
  account_id?: string
  project_id?: string
  sub_project_id?: string
  start_date?: string
  end_date?: string
  reporting_period_id?: string
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
    const filters: LedgerFilters = {
      account_id: url.searchParams.get('account_id') || undefined,
      project_id: url.searchParams.get('project_id') || undefined,
      sub_project_id: url.searchParams.get('sub_project_id') || undefined,
      start_date: url.searchParams.get('start_date') || undefined,
      end_date: url.searchParams.get('end_date') || undefined,
      reporting_period_id: url.searchParams.get('reporting_period_id') || undefined
    }

    // Build query for transaction entries with joins
    let query = supabase
      .from('transaction_entries')
      .select(`
        *,
        transactions!inner(date, description, reference_type, reference_id),
        chart_of_accounts!inner(code, name, type)
      `)

    // Apply filters
    if (filters.account_id) {
      query = query.eq('account_id', filters.account_id)
    }

    if (filters.start_date && filters.end_date) {
      query = query
        .gte('transactions.date', filters.start_date)
        .lte('transactions.date', filters.end_date)
    }

    if (filters.reporting_period_id) {
      // Get reporting period dates
      const { data: period } = await supabase
        .from('reporting_periods')
        .select('start_date, end_date')
        .eq('id', filters.reporting_period_id)
        .single()
      
      if (period) {
        query = query
          .gte('transactions.date', period.start_date)
          .lte('transactions.date', period.end_date)
      }
    }

    const { data: entries, error } = await query
      .order('transactions(date)', { ascending: true })

    if (error) {
      console.error('Error fetching ledger entries:', error)
      return new Response(JSON.stringify({ error: 'Failed to fetch ledger data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Process entries to calculate running balances by account
    const ledgerByAccount: { [accountId: string]: LedgerEntry[] } = {}
    const accountBalances: { [accountId: string]: number } = {}

    entries.forEach((entry: any) => {
      const accountId = entry.account_id
      if (!ledgerByAccount[accountId]) {
        ledgerByAccount[accountId] = []
        accountBalances[accountId] = 0
      }

      // Calculate balance change based on account type and entry type
      const accountType = entry.chart_of_accounts.type
      let balanceChange = 0

      if (['Asset', 'Expense'].includes(accountType)) {
        // Assets and Expenses increase with debits
        balanceChange = entry.entry_type === 'debit' ? entry.amount : -entry.amount
      } else {
        // Liabilities, Equity, Income increase with credits
        balanceChange = entry.entry_type === 'credit' ? entry.amount : -entry.amount
      }

      accountBalances[accountId] += balanceChange

      const ledgerEntry: LedgerEntry = {
        date: entry.transactions.date,
        account_code: entry.chart_of_accounts.code,
        account_name: entry.chart_of_accounts.name,
        description: entry.transactions.description,
        debit_amount: entry.entry_type === 'debit' ? entry.amount : 0,
        credit_amount: entry.entry_type === 'credit' ? entry.amount : 0,
        running_balance: accountBalances[accountId],
        reference_type: entry.transactions.reference_type,
        reference_id: entry.transactions.reference_id
      }

      ledgerByAccount[accountId].push(ledgerEntry)
    })

    return new Response(JSON.stringify({ 
      success: true, 
      data: ledgerByAccount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in reports-ledger function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})