import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Receipt } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  attachment_url: string | null;
  created_at: string;
  sub_project: {
    id: string;
    name: string;
    project: {
      name: string;
    };
  };
}

interface SubProject {
  id: string;
  name: string;
  project: {
    id: string;
    name: string;
  };
}

interface ProjectAllocation {
  allocation_id: string;
  project_id: string;
  project_name: string;
  allocated_amount: number;
  spent_amount: number;
  available_amount: number;
  funding_donor: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [projectAllocations, setProjectAllocations] = useState<ProjectAllocation[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [fundingSources, setFundingSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [formData, setFormData] = useState({
    project_allocation_id: "",
    sub_project_id: "",
    description: "",
    amount: "",
    expense_date: "",
    category: "",
    attachment_url: "",
    voucher_reference: "",
    paid_from_account_id: "",
    account_id: "",
    transaction_type: "Expense",
    payment_mode: "",
    fund_source_id: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesResult, subProjectsResult, allocationsResult, accountsResult, fundingResult] = await Promise.all([
        supabase
          .from('expenses')
          .select(`
            *,
            sub_project:sub_projects(
              id,
              name,
              project:projects(id, name)
            )
          `)
          .order('expense_date', { ascending: false }),
        supabase
          .from('sub_projects')
          .select(`
            id,
            name,
            project:projects(id, name)
          `)
          .order('name'),
        supabase.rpc('get_project_allocations_with_budget'),
        supabase
          .from('chart_of_accounts')
          .select('*')
          .order('code'),
        supabase
          .from('funding')
          .select('id, donor_name, amount')
          .order('donor_name')
      ]);

      if (expensesResult.error) throw expensesResult.error;
      if (subProjectsResult.error) throw subProjectsResult.error;
      if (allocationsResult.error) throw allocationsResult.error;
      if (accountsResult.error) throw accountsResult.error;
      if (fundingResult.error) throw fundingResult.error;

      setExpenses(expensesResult.data || []);
      setSubProjects(subProjectsResult.data || []);
      setProjectAllocations(allocationsResult.data || []);
      setAccounts(accountsResult.data || []);
      setFundingSources(fundingResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate that there's enough budget
      const selectedAllocation = projectAllocations.find(a => a.allocation_id === formData.project_allocation_id);
      if (!selectedAllocation) {
        toast({
          title: "Error",
          description: "Please select a valid project allocation",
          variant: "destructive"
        });
        return;
      }

      const expenseAmount = parseFloat(formData.amount);
      if (expenseAmount > selectedAllocation.available_amount) {
        toast({
          title: "Error",
          description: `Insufficient budget. Available: $${selectedAllocation.available_amount.toLocaleString()}`,
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('expenses')
        .insert([{
          project_allocation_id: formData.project_allocation_id,
          sub_project_id: formData.sub_project_id,
          description: formData.description,
          amount: expenseAmount,
          expense_date: formData.expense_date,
          category: formData.category,
          attachment_url: formData.attachment_url || null,
          voucher_reference: formData.voucher_reference || null,
          paid_from_account_id: formData.paid_from_account_id || null,
          account_id: formData.account_id || null,
          transaction_type: formData.transaction_type,
          payment_mode: formData.payment_mode || null,
          fund_source_id: formData.fund_source_id || null,
          created_by: (await supabase.auth.getUser()).data.user?.id!
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense added and budget deducted successfully"
      });

      setFormData({
        project_allocation_id: "",
        sub_project_id: "",
        description: "",
        amount: "",
        expense_date: "",
        category: "",
        attachment_url: "",
        voucher_reference: "",
        paid_from_account_id: "",
        account_id: "",
        transaction_type: "Expense",
        payment_mode: "",
        fund_source_id: ""
      });
      setSelectedProjectId("");
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive"
      });
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.sub_project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const categoryColors: { [key: string]: string } = {
    'admin': 'bg-blue-100 text-blue-800',
    'field work': 'bg-green-100 text-green-800',
    'travel': 'bg-yellow-100 text-yellow-800',
    'supplies': 'bg-purple-100 text-purple-800',
    'other': 'bg-gray-100 text-gray-800'
  };

  if (loading) {
    return <div className="p-6">Loading expenses...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expense Tracking</h2>
          <p className="text-muted-foreground">
            Record and track all expenses for your sub-projects
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new expense for a sub-project
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_allocation_select">Project Budget *</Label>
                  <select
                    id="project_allocation_select"
                    className="w-full p-2 border rounded-md"
                    value={formData.project_allocation_id}
                    onChange={(e) => {
                      const allocationId = e.target.value;
                      const allocation = projectAllocations.find(a => a.allocation_id === allocationId);
                      setFormData({...formData, project_allocation_id: allocationId});
                      setSelectedProjectId(allocation?.project_id || "");
                    }}
                    required
                  >
                    <option value="">Select project budget</option>
                    {projectAllocations.filter(a => a.available_amount > 0).map((allocation) => (
                      <option key={allocation.allocation_id} value={allocation.allocation_id}>
                        {allocation.project_name} - Available: ${allocation.available_amount.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sub_project_select">Sub-Project *</Label>
                  <select
                    id="sub_project_select"
                    className="w-full p-2 border rounded-md"
                    value={formData.sub_project_id}
                    onChange={(e) => setFormData({...formData, sub_project_id: e.target.value})}
                    required
                    disabled={!selectedProjectId}
                  >
                    <option value="">Select a sub-project</option>
                    {subProjects
                      .filter(subProject => subProject.project.id === selectedProjectId)
                      .map((subProject) => (
                      <option key={subProject.id} value={subProject.id}>
                        {subProject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense_date">Transaction Date *</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="voucher_reference">Voucher/Reference ID</Label>
                  <Input
                    id="voucher_reference"
                    value={formData.voucher_reference}
                    onChange={(e) => setFormData({...formData, voucher_reference: e.target.value})}
                    placeholder="Payment voucher, receipt number, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paid_from_account">Paid From Account *</Label>
                  <select
                    id="paid_from_account"
                    className="w-full p-2 border rounded-md"
                    value={formData.paid_from_account_id}
                    onChange={(e) => setFormData({...formData, paid_from_account_id: e.target.value})}
                    required
                  >
                    <option value="">Select source account</option>
                    {accounts.filter(acc => acc.type === 'Asset').map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expense_account">Paid To / Expense Account *</Label>
                  <select
                    id="expense_account"
                    className="w-full p-2 border rounded-md"
                    value={formData.account_id}
                    onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                    required
                  >
                    <option value="">Select expense account</option>
                    {accounts.filter(acc => acc.type === 'Expense').map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount Paid ($) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                  {formData.project_allocation_id && (
                    <p className="text-sm text-muted-foreground">
                      Available budget: ${projectAllocations.find(a => a.allocation_id === formData.project_allocation_id)?.available_amount.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment_mode">Payment Mode</Label>
                  <select
                    id="payment_mode"
                    className="w-full p-2 border rounded-md"
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({...formData, payment_mode: e.target.value})}
                  >
                    <option value="">Select payment mode</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Narration/Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Short explanation of the payment purpose"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    className="w-full p-2 border rounded-md"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="admin">Admin</option>
                    <option value="field work">Field Work</option>
                    <option value="travel">Travel</option>
                    <option value="supplies">Supplies</option>
                    <option value="utilities">Utilities</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fund_source">Fund Source / Donor</Label>
                  <select
                    id="fund_source"
                    className="w-full p-2 border rounded-md"
                    value={formData.fund_source_id}
                    onChange={(e) => setFormData({...formData, fund_source_id: e.target.value})}
                  >
                    <option value="">Select fund source</option>
                    {fundingSources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.donor_name} (${source.amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction_type">Transaction Type</Label>
                  <Input
                    id="transaction_type"
                    value={formData.transaction_type}
                    onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="attachment_url">Supporting Document (Optional)</Label>
                  <Input
                    id="attachment_url"
                    type="url"
                    value={formData.attachment_url}
                    onChange={(e) => setFormData({...formData, attachment_url: e.target.value})}
                    placeholder="https://... (bill, invoice, receipt link)"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                Add Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Expense Records
          </CardTitle>
          <CardDescription>
            All recorded expenses by sub-project
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Sub-Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">
                    {expense.sub_project.project.name}
                  </TableCell>
                  <TableCell>{expense.sub_project.name}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge 
                      className={categoryColors[expense.category] || categoryColors['other']}
                      variant="secondary"
                    >
                      {expense.category}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredExpenses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Expenses;