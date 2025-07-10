import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, TrendingUp, Target } from "lucide-react";

interface Funding {
  id: string;
  donor_name: string;
  amount: number;
  date_received: string;
  notes: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
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

const Funding = () => {
  const [funding, setFunding] = useState<Funding[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectAllocations, setProjectAllocations] = useState<ProjectAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    donor_name: "",
    amount: "",
    date_received: "",
    notes: ""
  });
  const [allocationFormData, setAllocationFormData] = useState({
    funding_id: "",
    project_id: "",
    amount: "",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fundingResult, projectsResult, allocationsResult] = await Promise.all([
        supabase
          .from('funding')
          .select('*')
          .order('date_received', { ascending: false }),
        supabase
          .from('projects')
          .select('*')
          .order('name'),
        supabase.rpc('get_project_allocations_with_budget')
      ]);

      if (fundingResult.error) throw fundingResult.error;
      if (projectsResult.error) throw projectsResult.error;
      if (allocationsResult.error) throw allocationsResult.error;

      setFunding(fundingResult.data || []);
      setProjects(projectsResult.data || []);
      setProjectAllocations(allocationsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('funding')
        .insert([{
          donor_name: formData.donor_name,
          amount: parseFloat(formData.amount),
          date_received: formData.date_received,
          notes: formData.notes || null,
          created_by: (await supabase.auth.getUser()).data.user?.id!
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Funding added successfully"
      });

      setFormData({
        donor_name: "",
        amount: "",
        date_received: "",
        notes: ""
      });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding funding:', error);
      toast({
        title: "Error",
        description: "Failed to add funding",
        variant: "destructive"
      });
    }
  };

  const handleAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('allocations')
        .insert([{
          funding_id: allocationFormData.funding_id,
          project_id: allocationFormData.project_id,
          amount: parseFloat(allocationFormData.amount),
          notes: allocationFormData.notes || null,
          created_by: (await supabase.auth.getUser()).data.user?.id!
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project allocation created successfully"
      });

      setAllocationFormData({
        funding_id: "",
        project_id: "",
        amount: "",
        notes: ""
      });
      setIsAllocationDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating allocation:', error);
      toast({
        title: "Error",
        description: "Failed to create allocation",
        variant: "destructive"
      });
    }
  };

  const filteredFunding = funding.filter(fund =>
    fund.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fund.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || ""
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div className="p-6">Loading funding data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Funding Management</h2>
          <p className="text-muted-foreground">
            Track funding sources and allocate budgets to projects
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Allocate to Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Allocate Funding to Project</DialogTitle>
                <DialogDescription>
                  Allocate funding from a source to a specific project
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAllocationSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="funding_select">Funding Source</Label>
                  <select
                    id="funding_select"
                    className="w-full p-2 border rounded-md"
                    value={allocationFormData.funding_id}
                    onChange={(e) => setAllocationFormData({...allocationFormData, funding_id: e.target.value})}
                    required
                  >
                    <option value="">Select funding source</option>
                    {funding.map((fund) => (
                      <option key={fund.id} value={fund.id}>
                        {fund.donor_name} - ${fund.amount.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_select">Project</Label>
                  <select
                    id="project_select"
                    className="w-full p-2 border rounded-md"
                    value={allocationFormData.project_id}
                    onChange={(e) => setAllocationFormData({...allocationFormData, project_id: e.target.value})}
                    required
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allocation_amount">Amount ($)</Label>
                  <Input
                    id="allocation_amount"
                    type="number"
                    step="0.01"
                    value={allocationFormData.amount}
                    onChange={(e) => setAllocationFormData({...allocationFormData, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allocation_notes">Notes (Optional)</Label>
                  <Textarea
                    id="allocation_notes"
                    value={allocationFormData.notes}
                    onChange={(e) => setAllocationFormData({...allocationFormData, notes: e.target.value})}
                    placeholder="Any additional notes..."
                  />
                </div>
                <Button type="submit" className="w-full">
                  Allocate Funding
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Funding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Funding</DialogTitle>
                <DialogDescription>
                  Record a new funding source from a donor
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="donor_name">Donor Name</Label>
                  <Input
                    id="donor_name"
                    value={formData.donor_name}
                    onChange={(e) => setFormData({...formData, donor_name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_received">Date Received</Label>
                  <Input
                    id="date_received"
                    type="date"
                    value={formData.date_received}
                    onChange={(e) => setFormData({...formData, date_received: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Funding
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="funding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="funding">Funding Sources</TabsTrigger>
          <TabsTrigger value="allocations">Project Allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="funding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Funding Sources
              </CardTitle>
              <CardDescription>
                All funding received from donors and grants
              </CardDescription>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search funding sources..."
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
                    <TableHead>Donor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date Received</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFunding.map((fund) => (
                    <TableRow key={fund.id}>
                      <TableCell className="font-medium">{fund.donor_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ${fund.amount.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(fund.date_received).toLocaleDateString()}</TableCell>
                      <TableCell>{fund.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredFunding.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No funding sources found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Project Budget Allocations
              </CardTitle>
              <CardDescription>
                Funding allocated to projects with spending status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Funding Source</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectAllocations.map((allocation) => (
                    <TableRow key={allocation.allocation_id}>
                      <TableCell className="font-medium">{allocation.project_name}</TableCell>
                      <TableCell>{allocation.funding_donor}</TableCell>
                      <TableCell>${allocation.allocated_amount.toLocaleString()}</TableCell>
                      <TableCell>${allocation.spent_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={allocation.available_amount > 0 ? "secondary" : "destructive"}
                          className={allocation.available_amount > 0 ? "bg-green-100 text-green-800" : ""}
                        >
                          ${allocation.available_amount.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={allocation.available_amount > allocation.allocated_amount * 0.1 ? "secondary" : "destructive"}
                        >
                          {allocation.available_amount > allocation.allocated_amount * 0.1 ? "Good" : "Low Budget"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {projectAllocations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No project allocations found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Funding;