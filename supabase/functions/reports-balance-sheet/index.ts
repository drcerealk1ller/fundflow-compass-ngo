import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = "https://xnzgnnrpneyoonwvveno.supabase.co"
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface BalanceSheetEntry {
  account_code: string
  account_name: string
  balance: number
}

interface BalanceSheetData {
  assets: BalanceSheetEntry[]
  liabilities: BalanceSheetEntry[]
  equity: BalanceSheetEntry[]
  total_assets: number
  total_liabilities: number
  total_equity: number
  as_of_date: string
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
    const asOfDate = url.searchParams.get('as_of_date') || new Date().toISOString().split('T')[0]
    const reportingPeriodId = url.searchParams.get('reporting_period_id')

    let endDate = asOfDate

    // If reporting period is specified, use its end date
    if (reportingPeriodId) {
      const { data: period } = await supabase
        .from('reporting_periods')
        .select('end_date')
        .eq('id', reportingPeriodId)
        .single()
      
      if (period) {
        endDate = period.end_date
      }
    }

    // Get all accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .in('type', ['Asset', 'Liability', 'Equity'])

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch accounts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get all transaction entries up to the as_of_date
    const { data: entries, error: entriesError } = await supabase
      .from('transaction_entries')
      .select(`
        *,
        transactions!inner(date),
        chart_of_accounts!inner(code, name, type)
      `)
      .lte('transactions.date', endDate)

    if (entriesError) {
      console.error('Error fetching entries:', entriesError)
      return new Response(JSON.stringify({ error: 'Failed to fetch transaction entries' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculate balances by account
    const accountBalances: { [accountId: string]: number } = {}

    entries.forEach((entry: any) => {
      const accountId = entry.account_id
      const accountType = entry.chart_of_accounts.type
      
      if (!accountBalances[accountId]) {
        accountBalances[accountId] = 0
      }

      let balanceChange = 0

      if (accountType === 'Asset') {
        // Assets increase with debits
        balanceChange = entry.entry_type === 'debit' ? entry.amount : -entry.amount
      } else if (['Liability', 'Equity'].includes(accountType)) {
        // Liabilities and Equity increase with credits
        balanceChange = entry.entry_type === 'credit' ? entry.amount : -entry.amount
      }

      accountBalances[accountId] += balanceChange
    })

    // Organize data by account type
    const assets: BalanceSheetEntry[] = []
    const liabilities: BalanceSheetEntry[] = []
    const equity: BalanceSheetEntry[] = []

    accounts.forEach((account: any) => {
      const balance = accountBalances[account.id] || 0
      
      const entry: BalanceSheetEntry = {
        account_code: account.code,
        account_name: account.name,
        balance: balance
      }

      switch (account.type) {
        case 'Asset':
          assets.push(entry)
          break
        case 'Liability':
          liabilities.push(entry)
          break
        case 'Equity':
          equity.push(entry)
          break
      }
    })

    // Calculate totals
    const totalAssets = assets.reduce((sum, asset) => sum + asset.balance, 0)
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.balance, 0)
    const totalEquity = equity.reduce((sum, eq) => sum + eq.balance, 0)

    const balanceSheetData: BalanceSheetData = {
      assets,
      liabilities,
      equity,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      total_equity: totalEquity,
      as_of_date: endDate
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: balanceSheetData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in reports-balance-sheet function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})