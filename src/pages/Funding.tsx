import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";

interface FundingEntry {
  id: string;
  donor_name: string;
  amount: number;
  date_received: string;
  notes: string;
  created_at: string;
}

const Funding = () => {
  const [fundingEntries, setFundingEntries] = useState<FundingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    donor_name: "",
    amount: "",
    date_received: "",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchFundingEntries();
  }, []);

  const fetchFundingEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('funding')
        .select('*')
        .order('date_received', { ascending: false });

      if (error) throw error;
      setFundingEntries(data || []);
    } catch (error) {
      console.error('Error fetching funding entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch funding entries",
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
          notes: formData.notes,
          created_by: (await supabase.auth.getUser()).data.user?.id!
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Funding entry added successfully"
      });

      setFormData({
        donor_name: "",
        amount: "",
        date_received: "",
        notes: ""
      });
      setIsDialogOpen(false);
      fetchFundingEntries();
    } catch (error) {
      console.error('Error adding funding entry:', error);
      toast({
        title: "Error",
        description: "Failed to add funding entry",
        variant: "destructive"
      });
    }
  };

  const filteredEntries = fundingEntries.filter(entry =>
    entry.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div className="p-6">Loading funding entries...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Funding Management</h2>
          <p className="text-muted-foreground">
            Track and manage funding received from various sources
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Funding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Funding Entry</DialogTitle>
              <DialogDescription>
                Record a new funding entry from a donor or source
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
                  placeholder="Additional notes about this funding..."
                />
              </div>
              <Button type="submit" className="w-full">
                Add Funding Entry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funding Entries</CardTitle>
          <CardDescription>
            All funding received by the organization
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by donor name or notes..."
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
                <TableHead>Donor Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date Received</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.donor_name}</TableCell>
                  <TableCell>{formatCurrency(entry.amount)}</TableCell>
                  <TableCell>{new Date(entry.date_received).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.notes || '-'}</TableCell>
                  <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No funding entries found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Funding;