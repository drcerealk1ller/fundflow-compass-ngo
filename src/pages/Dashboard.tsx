import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileText,
  BarChart3,
  PieChart,
  Activity,
  CreditCard
} from "lucide-react";

interface DashboardData {
  totalUsers: number;
  totalFunding: number;
  totalExpenses: number;
  totalProjects: number;
  totalSubProjects: number;
  recentActivities: Array<{
    type: string;
    description: string;
    amount?: number;
    created_at: string;
  }>;
  monthlyExpenses: Array<{
    month: string;
    amount: number;
  }>;
  projectDistribution: Array<{
    project_name: string;
    total_expenses: number;
  }>;
}

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch funding data
      const { data: fundingData } = await supabase
        .from('funding')
        .select('amount');
      const totalFunding = fundingData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      // Fetch expenses data
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount, description, created_at, expense_date');
      const totalExpenses = expensesData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      // Fetch projects count
      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Fetch sub-projects count
      const { count: totalSubProjects } = await supabase
        .from('sub_projects')
        .select('*', { count: 'exact', head: true });

      // Fetch recent activities (expenses and funding)
      const { data: recentExpenses } = await supabase
        .from('expenses')
        .select('description, amount, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentFunding } = await supabase
        .from('funding')
        .select('donor_name, amount, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const recentActivities = [
        ...(recentExpenses?.map(expense => ({
          type: 'expense',
          description: `Expense: ${expense.description}`,
          amount: expense.amount,
          created_at: expense.created_at
        })) || []),
        ...(recentFunding?.map(funding => ({
          type: 'funding',
          description: `Funding from ${funding.donor_name}`,
          amount: funding.amount,
          created_at: funding.created_at
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

      // Fetch project distribution
      const { data: projectExpensesData } = await supabase
        .from('expenses')
        .select(`
          amount,
          sub_project:sub_projects(
            project:projects(name)
          )
        `);

      const projectMap = new Map();
      projectExpensesData?.forEach((expense: any) => {
        const projectName = expense.sub_project.project.name;
        if (!projectMap.has(projectName)) {
          projectMap.set(projectName, 0);
        }
        projectMap.set(projectName, projectMap.get(projectName) + Number(expense.amount));
      });

      const projectDistribution = Array.from(projectMap.entries()).map(([project_name, total_expenses]) => ({
        project_name,
        total_expenses
      }));

      setDashboardData({
        totalUsers: totalUsers || 0,
        totalFunding,
        totalExpenses,
        totalProjects: totalProjects || 0,
        totalSubProjects: totalSubProjects || 0,
        recentActivities,
        monthlyExpenses: [], // We can implement this later
        projectDistribution
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-accent bg-clip-text text-transparent">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground">
          Complete financial and operational insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(dashboardData?.totalFunding || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Available resources</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/10 border-rose-200 dark:border-rose-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
              {formatCurrency(dashboardData?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Money spent</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {dashboardData?.totalProjects || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.totalSubProjects || 0} sub-projects
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/10 border-violet-200 dark:border-violet-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-400">
              {dashboardData?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Financial Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency((dashboardData?.totalFunding || 0) - (dashboardData?.totalExpenses || 0))}
          </div>
          <p className="text-muted-foreground">
            Remaining funds available for allocation
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest funding and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.recentActivities.map((activity, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{activity.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`font-bold ${
                    activity.type === 'funding' 
                      ? 'text-emerald-600' 
                      : 'text-rose-600'
                  }`}>
                    {activity.type === 'funding' ? '+' : '-'}{formatCurrency(activity.amount || 0)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Project Expenses
            </CardTitle>
            <CardDescription>Distribution of expenses by project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.projectDistribution.map((project, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{project.project_name}</span>
                  <span className="font-bold">{formatCurrency(project.total_expenses)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;