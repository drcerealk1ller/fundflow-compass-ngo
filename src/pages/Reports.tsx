import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, BarChart3 } from "lucide-react";

interface ReportData {
  totalFunding: number;
  totalExpenses: number;
  projectSummary: Array<{
    project_name: string;
    total_expenses: number;
    sub_projects: Array<{
      name: string;
      total_expenses: number;
    }>;
  }>;
  fundingEntries: Array<{
    donor_name: string;
    amount: number;
    date_received: string;
  }>;
  recentExpenses: Array<{
    description: string;
    amount: number;
    expense_date: string;
    category: string;
    sub_project_name: string;
    project_name: string;
  }>;
}

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch total funding
      const { data: fundingData } = await supabase
        .from('funding')
        .select('donor_name, amount, date_received');
      
      const totalFunding = fundingData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      // Fetch expenses with project info
      const { data: expensesData } = await supabase
        .from('expenses')
        .select(`
          description,
          amount,
          expense_date,
          category,
          sub_project:sub_projects(
            name,
            project:projects(name)
          )
        `)
        .order('expense_date', { ascending: false });

      const totalExpenses = expensesData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      // Process project summary
      const projectMap = new Map();
      expensesData?.forEach((expense: any) => {
        const projectName = expense.sub_project.project.name;
        const subProjectName = expense.sub_project.name;
        
        if (!projectMap.has(projectName)) {
          projectMap.set(projectName, {
            project_name: projectName,
            total_expenses: 0,
            sub_projects: new Map()
          });
        }
        
        const project = projectMap.get(projectName);
        project.total_expenses += Number(expense.amount);
        
        if (!project.sub_projects.has(subProjectName)) {
          project.sub_projects.set(subProjectName, {
            name: subProjectName,
            total_expenses: 0
          });
        }
        
        project.sub_projects.get(subProjectName).total_expenses += Number(expense.amount);
      });

      const projectSummary = Array.from(projectMap.values()).map(project => ({
        ...project,
        sub_projects: Array.from(project.sub_projects.values())
      }));

      const recentExpenses = expensesData?.slice(0, 10).map((expense: any) => ({
        description: expense.description,
        amount: expense.amount,
        expense_date: expense.expense_date,
        category: expense.category,
        sub_project_name: expense.sub_project.name,
        project_name: expense.sub_project.project.name
      })) || [];

      setReportData({
        totalFunding,
        totalExpenses,
        projectSummary,
        fundingEntries: fundingData || [],
        recentExpenses
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = "NGO Finance Report\n\n";
    
    // Summary
    csvContent += "FINANCIAL SUMMARY\n";
    csvContent += `Total Funding Received,$${reportData.totalFunding.toLocaleString()}\n`;
    csvContent += `Total Expenses,$${reportData.totalExpenses.toLocaleString()}\n`;
    csvContent += `Remaining Balance,$${(reportData.totalFunding - reportData.totalExpenses).toLocaleString()}\n\n`;
    
    // Funding entries
    csvContent += "FUNDING ENTRIES\n";
    csvContent += "Donor Name,Amount,Date Received\n";
    reportData.fundingEntries.forEach(entry => {
      csvContent += `"${entry.donor_name}",$${entry.amount},${entry.date_received}\n`;
    });
    csvContent += "\n";
    
    // Project summary
    csvContent += "PROJECT EXPENSES SUMMARY\n";
    csvContent += "Project,Sub-Project,Amount\n";
    reportData.projectSummary.forEach(project => {
      csvContent += `"${project.project_name}",TOTAL,$${project.total_expenses}\n`;
      project.sub_projects.forEach(subProject => {
        csvContent += `"${project.project_name}","${subProject.name}",$${subProject.total_expenses}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ngo-finance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Report exported to CSV file"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div className="p-6">Loading report data...</div>;
  }

  if (!reportData) {
    return <div className="p-6">Failed to load report data</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports & Ledger</h2>
          <p className="text-muted-foreground">
            Comprehensive financial reports and data exports
          </p>
        </div>
        
        <Button onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.totalFunding)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.totalExpenses)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(reportData.totalFunding - reportData.totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Expenses Summary
          </CardTitle>
          <CardDescription>
            Breakdown of expenses by project and sub-project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {reportData.projectSummary.map((project) => (
              <div key={project.project_name} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{project.project_name}</h3>
                  <span className="text-lg font-bold">{formatCurrency(project.total_expenses)}</span>
                </div>
                <div className="space-y-2">
                  {project.sub_projects.map((subProject) => (
                    <div key={subProject.name} className="flex justify-between items-center pl-4 py-1 border-l-2 border-muted">
                      <span className="text-sm text-muted-foreground">{subProject.name}</span>
                      <span className="text-sm font-medium">{formatCurrency(subProject.total_expenses)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>
            Last 10 recorded expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.recentExpenses.map((expense, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">{expense.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {expense.project_name} - {expense.sub_project_name} • {expense.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(expense.amount)}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;