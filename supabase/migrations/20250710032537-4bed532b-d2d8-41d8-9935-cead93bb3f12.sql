-- Update RLS policy for sub_projects to allow all authenticated users to create sub-projects
DROP POLICY IF EXISTS "Admins and project leads can modify sub_projects" ON public.sub_projects;

-- Create more permissive policies for sub_projects
CREATE POLICY "Anyone can create sub_projects" 
ON public.sub_projects 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and project leads can update sub_projects" 
ON public.sub_projects 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'project_lead'::text])))));

CREATE POLICY "Admins and project leads can delete sub_projects" 
ON public.sub_projects 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'project_lead'::text])))));

-- Update RLS policy for allocations to allow all authenticated users to create allocations
DROP POLICY IF EXISTS "Admins and accountants can modify allocations" ON public.allocations;

-- Create more permissive policies for allocations
CREATE POLICY "Anyone can create allocations" 
ON public.allocations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and accountants can update allocations" 
ON public.allocations 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'accountant'::text])))));

CREATE POLICY "Admins and accountants can delete allocations" 
ON public.allocations 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'accountant'::text])))));

-- Update RLS policy for projects to allow all authenticated users to create projects
DROP POLICY IF EXISTS "Admins can modify projects" ON public.projects;

-- Create more permissive policies for projects
CREATE POLICY "Anyone can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update projects" 
ON public.projects 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))));

CREATE POLICY "Admins can delete projects" 
ON public.projects 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text))));