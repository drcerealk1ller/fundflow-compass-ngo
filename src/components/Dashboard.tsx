import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface DashboardStats {
  totalFunding: number;
  totalAllocated: number;
  totalExpenses: number;
  remainingBalance: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalFunding: 0,
    totalAllocated: 0,
    totalExpenses: 0,
    remainingBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get total funding
      const { data: fundingData } = await supabase
        .from('funding')
        .select('amount');
      
      const totalFunding = fundingData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      // Get total allocations
      const { data: allocationsData } = await supabase
        .from('allocations')
        .select('amount');
      
      const totalAllocated = allocationsData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      // Get total expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount');
      
      const totalExpenses = expensesData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      const remainingBalance = totalFunding - totalExpenses;

      setStats({
        totalFunding,
        totalAllocated,
        totalExpenses,
        remainingBalance
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your NGO's financial status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Funding Received
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalFunding)}</div>
            <p className="text-xs text-muted-foreground">
              All funding received to date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Allocated
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAllocated)}</div>
            <p className="text-xs text-muted-foreground">
              Funds allocated to projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              Total amount spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Remaining Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.remainingBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Available for allocation
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;