import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileDown, Plus, Calendar, DollarSign } from "lucide-react";
import * as XLSX from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  description: string;
}

interface ReportingPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface LedgerEntry {
  date: string;
  account_code: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  running_balance: number;
}

interface BalanceSheetData {
  assets: Array<{ account_code: string; account_name: string; balance: number }>;
  liabilities: Array<{ account_code: string; account_name: string; balance: number }>;
  equity: Array<{ account_code: string; account_name: string; balance: number }>;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  as_of_date: string;
}

interface IncomeStatementData {
  income: Array<{ account_code: string; account_name: string; amount: number }>;
  expenses: Array<{ account_code: string; account_name: string; amount: number }>;
  total_income: number;
  total_expenses: number;
  net_income: number;
  start_date: string;
  end_date: string;
}

export default function Accounting() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reportingPeriods, setReportingPeriods] = useState<ReportingPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ledgerData, setLedgerData] = useState<{ [accountId: string]: LedgerEntry[] }>({});
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [incomeStatementData, setIncomeStatementData] = useState<IncomeStatementData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
    fetchReportingPeriods();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .order('code');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch chart of accounts",
        variant: "destructive",
      });
    } else {
      setAccounts(data || []);
    }
  };

  const fetchReportingPeriods = async () => {
    const { data, error } = await supabase
      .from('reporting_periods')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reporting periods",
        variant: "destructive",
      });
    } else {
      setReportingPeriods(data || []);
    }
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedAccount) params.account_id = selectedAccount;
      if (selectedPeriod) params.reporting_period_id = selectedPeriod;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `https://xnzgnnrpneyoonwvveno.supabase.co/functions/v1/reports-ledger?${queryString}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.success) {
        setLedgerData(data.data);
      } else {
        throw new Error(data?.error || 'Failed to fetch ledger');
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ledger data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedPeriod) params.reporting_period_id = selectedPeriod;
      if (endDate) params.as_of_date = endDate;

      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `https://xnzgnnrpneyoonwvveno.supabase.co/functions/v1/reports-balance-sheet?${queryString}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.success) {
        setBalanceSheetData(data.data);
      } else {
        throw new Error(data?.error || 'Failed to fetch balance sheet');
      }
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      toast({
        title: "Error",
        description: "Failed to fetch balance sheet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeStatement = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedPeriod) params.reporting_period_id = selectedPeriod;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `https://xnzgnnrpneyoonwvveno.supabase.co/functions/v1/reports-income-statement?${queryString}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.success) {
        setIncomeStatementData(data.data);
      } else {
        throw new Error(data?.error || 'Failed to fetch income statement');
      }
    } catch (error) {
      console.error('Error fetching income statement:', error);
      toast({
        title: "Error",
        description: "Failed to fetch income statement data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async (type: 'ledger' | 'balance-sheet' | 'income-statement') => {
    const workbook = new XLSX.Workbook();
    
    if (type === 'ledger' && Object.keys(ledgerData).length > 0) {
      Object.entries(ledgerData).forEach(([accountId, entries]) => {
        if (entries.length > 0) {
          const worksheet = workbook.addWorksheet(entries[0].account_name.substring(0, 30));
          
          worksheet.addRow(['Date', 'Description', 'Debit', 'Credit', 'Balance']);
          
          entries.forEach(entry => {
            worksheet.addRow([
              entry.date,
              entry.description,
              entry.debit_amount,
              entry.credit_amount,
              entry.running_balance
            ]);
          });
        }
      });
    } else if (type === 'balance-sheet' && balanceSheetData) {
      const worksheet = workbook.addWorksheet('Balance Sheet');
      
      worksheet.addRow(['BALANCE SHEET']);
      worksheet.addRow([`As of ${balanceSheetData.as_of_date}`]);
      worksheet.addRow([]);
      
      worksheet.addRow(['ASSETS']);
      balanceSheetData.assets.forEach(asset => {
        worksheet.addRow([asset.account_name, asset.balance]);
      });
      worksheet.addRow(['Total Assets', balanceSheetData.total_assets]);
      worksheet.addRow([]);
      
      worksheet.addRow(['LIABILITIES']);
      balanceSheetData.liabilities.forEach(liability => {
        worksheet.addRow([liability.account_name, liability.balance]);
      });
      worksheet.addRow(['Total Liabilities', balanceSheetData.total_liabilities]);
      worksheet.addRow([]);
      
      worksheet.addRow(['EQUITY']);
      balanceSheetData.equity.forEach(equity => {
        worksheet.addRow([equity.account_name, equity.balance]);
      });
      worksheet.addRow(['Total Equity', balanceSheetData.total_equity]);
    } else if (type === 'income-statement' && incomeStatementData) {
      const worksheet = workbook.addWorksheet('Income Statement');
      
      worksheet.addRow(['INCOME STATEMENT']);
      worksheet.addRow([`From ${incomeStatementData.start_date} to ${incomeStatementData.end_date}`]);
      worksheet.addRow([]);
      
      worksheet.addRow(['INCOME']);
      incomeStatementData.income.forEach(income => {
        worksheet.addRow([income.account_name, income.amount]);
      });
      worksheet.addRow(['Total Income', incomeStatementData.total_income]);
      worksheet.addRow([]);
      
      worksheet.addRow(['EXPENSES']);
      incomeStatementData.expenses.forEach(expense => {
        worksheet.addRow([expense.account_name, expense.amount]);
      });
      worksheet.addRow(['Total Expenses', incomeStatementData.total_expenses]);
      worksheet.addRow([]);
      worksheet.addRow(['Net Income', incomeStatementData.net_income]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (type: 'balance-sheet' | 'income-statement') => {
    const doc = new jsPDF();
    
    if (type === 'balance-sheet' && balanceSheetData) {
      doc.text('BALANCE SHEET', 20, 20);
      doc.text(`As of ${balanceSheetData.as_of_date}`, 20, 30);
      
      let yPosition = 50;
      
      // Assets
      doc.text('ASSETS', 20, yPosition);
      yPosition += 10;
      
      balanceSheetData.assets.forEach(asset => {
        doc.text(`${asset.account_name}: $${asset.balance.toFixed(2)}`, 30, yPosition);
        yPosition += 8;
      });
      
      doc.text(`Total Assets: $${balanceSheetData.total_assets.toFixed(2)}`, 20, yPosition);
      yPosition += 20;
      
      // Liabilities
      doc.text('LIABILITIES', 20, yPosition);
      yPosition += 10;
      
      balanceSheetData.liabilities.forEach(liability => {
        doc.text(`${liability.account_name}: $${liability.balance.toFixed(2)}`, 30, yPosition);
        yPosition += 8;
      });
      
      doc.text(`Total Liabilities: $${balanceSheetData.total_liabilities.toFixed(2)}`, 20, yPosition);
      yPosition += 20;
      
      // Equity
      doc.text('EQUITY', 20, yPosition);
      yPosition += 10;
      
      balanceSheetData.equity.forEach(equity => {
        doc.text(`${equity.account_name}: $${equity.balance.toFixed(2)}`, 30, yPosition);
        yPosition += 8;
      });
      
      doc.text(`Total Equity: $${balanceSheetData.total_equity.toFixed(2)}`, 20, yPosition);
      
    } else if (type === 'income-statement' && incomeStatementData) {
      doc.text('INCOME STATEMENT', 20, 20);
      doc.text(`From ${incomeStatementData.start_date} to ${incomeStatementData.end_date}`, 20, 30);
      
      let yPosition = 50;
      
      // Income
      doc.text('INCOME', 20, yPosition);
      yPosition += 10;
      
      incomeStatementData.income.forEach(income => {
        doc.text(`${income.account_name}: $${income.amount.toFixed(2)}`, 30, yPosition);
        yPosition += 8;
      });
      
      doc.text(`Total Income: $${incomeStatementData.total_income.toFixed(2)}`, 20, yPosition);
      yPosition += 20;
      
      // Expenses
      doc.text('EXPENSES', 20, yPosition);
      yPosition += 10;
      
      incomeStatementData.expenses.forEach(expense => {
        doc.text(`${expense.account_name}: $${expense.amount.toFixed(2)}`, 30, yPosition);
        yPosition += 8;
      });
      
      doc.text(`Total Expenses: $${incomeStatementData.total_expenses.toFixed(2)}`, 20, yPosition);
      yPosition += 20;
      
      doc.text(`Net Income: $${incomeStatementData.net_income.toFixed(2)}`, 20, yPosition);
    }
    
    doc.save(`${type}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Accounting</h1>
      </div>

      <Tabs defaultValue="ledger" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
          <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle>General Ledger</CardTitle>
              <CardDescription>View detailed transaction history by account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="account-select">Account</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger id="account-select">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Accounts</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="period-select">Reporting Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger id="period-select">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Custom Date Range</SelectItem>
                      {reportingPeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={fetchLedger} disabled={loading}>
                    Generate Report
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => exportToExcel('ledger')}
                    disabled={Object.keys(ledgerData).length === 0}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export XLSX
                  </Button>
                </div>
              </div>

              {!selectedPeriod && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {Object.keys(ledgerData).length > 0 && (
                <div className="space-y-6">
                  {Object.entries(ledgerData).map(([accountId, entries]) => (
                    <div key={accountId}>
                      <h3 className="text-lg font-semibold mb-2">
                        {entries[0]?.account_code} - {entries[0]?.account_name}
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entries.map((entry, index) => (
                            <TableRow key={index}>
                              <TableCell>{entry.date}</TableCell>
                              <TableCell>{entry.description}</TableCell>
                              <TableCell className="text-right">
                                {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : ''}
                              </TableCell>
                              <TableCell className="text-right">
                                {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : ''}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(entry.running_balance)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>View financial position as of a specific date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="bs-period-select">Reporting Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger id="bs-period-select">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Custom Date</SelectItem>
                      {reportingPeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!selectedPeriod && (
                  <div>
                    <Label htmlFor="as-of-date">As of Date</Label>
                    <Input
                      id="as-of-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={fetchBalanceSheet} disabled={loading}>
                    Generate Report
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => exportToExcel('balance-sheet')}
                    disabled={!balanceSheetData}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export XLSX
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => exportToPDF('balance-sheet')}
                    disabled={!balanceSheetData}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>

              {balanceSheetData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Assets</h3>
                    <Table>
                      <TableBody>
                        {balanceSheetData.assets.map((asset, index) => (
                          <TableRow key={index}>
                            <TableCell>{asset.account_name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(asset.balance)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold">
                          <TableCell>Total Assets</TableCell>
                          <TableCell className="text-right">{formatCurrency(balanceSheetData.total_assets)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Liabilities</h3>
                    <Table>
                      <TableBody>
                        {balanceSheetData.liabilities.map((liability, index) => (
                          <TableRow key={index}>
                            <TableCell>{liability.account_name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(liability.balance)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold">
                          <TableCell>Total Liabilities</TableCell>
                          <TableCell className="text-right">{formatCurrency(balanceSheetData.total_liabilities)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Equity</h3>
                    <Table>
                      <TableBody>
                        {balanceSheetData.equity.map((equity, index) => (
                          <TableRow key={index}>
                            <TableCell>{equity.account_name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(equity.balance)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold">
                          <TableCell>Total Equity</TableCell>
                          <TableCell className="text-right">{formatCurrency(balanceSheetData.total_equity)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-statement">
          <Card>
            <CardHeader>
              <CardTitle>Income Statement</CardTitle>
              <CardDescription>View income and expenses for a specific period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="is-period-select">Reporting Period</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger id="is-period-select">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Custom Date Range</SelectItem>
                      {reportingPeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={fetchIncomeStatement} disabled={loading}>
                    Generate Report
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => exportToExcel('income-statement')}
                    disabled={!incomeStatementData}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export XLSX
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => exportToPDF('income-statement')}
                    disabled={!incomeStatementData}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>

              {!selectedPeriod && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="is-start-date">Start Date</Label>
                    <Input
                      id="is-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="is-end-date">End Date</Label>
                    <Input
                      id="is-end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {incomeStatementData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Income</h3>
                    <Table>
                      <TableBody>
                        {incomeStatementData.income.map((income, index) => (
                          <TableRow key={index}>
                            <TableCell>{income.account_name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(income.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold">
                          <TableCell>Total Income</TableCell>
                          <TableCell className="text-right">{formatCurrency(incomeStatementData.total_income)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                    <Table>
                      <TableBody>
                        {incomeStatementData.expenses.map((expense, index) => (
                          <TableRow key={index}>
                            <TableCell>{expense.account_name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold">
                          <TableCell>Total Expenses</TableCell>
                          <TableCell className="text-right">{formatCurrency(incomeStatementData.total_expenses)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:col-span-2">
                    <Table>
                      <TableBody>
                        <TableRow className="text-xl font-bold">
                          <TableCell>Net Income</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={incomeStatementData.net_income >= 0 ? "default" : "destructive"}>
                              {formatCurrency(incomeStatementData.net_income)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart-of-accounts">
          <Card>
            <CardHeader>
              <CardTitle>Chart of Accounts</CardTitle>
              <CardDescription>Manage your organization's accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono">{account.code}</TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{account.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{account.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}