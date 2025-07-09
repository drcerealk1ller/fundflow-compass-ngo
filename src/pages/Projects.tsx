import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderTree } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
}

interface SubProject {
  id: string;
  project_id: string;
  name: string;
  description: string;
  project: Project;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubProjectDialogOpen, setIsSubProjectDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [subProjectForm, setSubProjectForm] = useState({
    name: "",
    description: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsResult, subProjectsResult] = await Promise.all([
        supabase.from('projects').select('*').order('name'),
        supabase.from('sub_projects').select('*, project:projects(*)').order('name')
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (subProjectsResult.error) throw subProjectsResult.error;

      setProjects(projectsResult.data || []);
      setSubProjects(subProjectsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('sub_projects')
        .insert([{
          project_id: selectedProjectId,
          name: subProjectForm.name,
          description: subProjectForm.description
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sub-project added successfully"
      });

      setSubProjectForm({ name: "", description: "" });
      setSelectedProjectId("");
      setIsSubProjectDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding sub-project:', error);
      toast({
        title: "Error",
        description: "Failed to add sub-project",
        variant: "destructive"
      });
    }
  };

  const getSubProjectsByProject = (projectId: string) => {
    return subProjects.filter(sp => sp.project_id === projectId);
  };

  if (loading) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects & Sub-Projects</h2>
          <p className="text-muted-foreground">
            Manage your organization's main projects and their sub-projects
          </p>
        </div>
        
        <Dialog open={isSubProjectDialogOpen} onOpenChange={setIsSubProjectDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Sub-Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Sub-Project</DialogTitle>
              <DialogDescription>
                Create a new sub-project under one of the main projects
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubProject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project_select">Main Project</Label>
                <select
                  id="project_select"
                  className="w-full p-2 border rounded-md"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  required
                >
                  <option value="">Select a main project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub_name">Sub-Project Name</Label>
                <Input
                  id="sub_name"
                  value={subProjectForm.name}
                  onChange={(e) => setSubProjectForm({...subProjectForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub_description">Description (Optional)</Label>
                <Textarea
                  id="sub_description"
                  value={subProjectForm.description}
                  onChange={(e) => setSubProjectForm({...subProjectForm, description: e.target.value})}
                  placeholder="Description of the sub-project..."
                />
              </div>
              <Button type="submit" className="w-full">
                Add Sub-Project
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue={projects[0]?.id} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {projects.map((project) => (
            <TabsTrigger key={project.id} value={project.id}>
              {project.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {projects.map((project) => (
          <TabsContent key={project.id} value={project.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  {project.name}
                </CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Sub-Projects</h4>
                  {getSubProjectsByProject(project.id).length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {getSubProjectsByProject(project.id).map((subProject) => (
                        <Card key={subProject.id}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{subProject.name}</CardTitle>
                            {subProject.description && (
                              <CardDescription>{subProject.description}</CardDescription>
                            )}
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sub-projects yet</p>
                      <p className="text-sm">Add a sub-project to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Projects;