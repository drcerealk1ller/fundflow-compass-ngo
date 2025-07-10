-- Add project_allocation_id to expenses table to track which allocation this expense deducts from
ALTER TABLE public.expenses 
ADD COLUMN project_allocation_id uuid REFERENCES public.allocations(id);

-- Add index for better performance
CREATE INDEX idx_expenses_project_allocation ON public.expenses(project_allocation_id);

-- Create a function to get available budget for a project
CREATE OR REPLACE FUNCTION public.get_project_available_budget(project_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_allocated numeric := 0;
  total_spent numeric := 0;
BEGIN
  -- Get total allocated to this project
  SELECT COALESCE(SUM(amount), 0) INTO total_allocated
  FROM public.allocations
  WHERE project_id = project_id_param;
  
  -- Get total spent by this project (through expenses)
  SELECT COALESCE(SUM(e.amount), 0) INTO total_spent
  FROM public.expenses e
  JOIN public.allocations a ON e.project_allocation_id = a.id
  WHERE a.project_id = project_id_param;
  
  RETURN total_allocated - total_spent;
END;
$$;

-- Create a function to get project allocations with available budget
CREATE OR REPLACE FUNCTION public.get_project_allocations_with_budget()
RETURNS TABLE (
  allocation_id uuid,
  project_id uuid,
  project_name text,
  allocated_amount numeric,
  spent_amount numeric,
  available_amount numeric,
  funding_donor text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as allocation_id,
    p.id as project_id,
    p.name as project_name,
    a.amount as allocated_amount,
    COALESCE(SUM(e.amount), 0) as spent_amount,
    a.amount - COALESCE(SUM(e.amount), 0) as available_amount,
    f.donor_name as funding_donor
  FROM public.allocations a
  JOIN public.projects p ON a.project_id = p.id
  JOIN public.funding f ON a.funding_id = f.id
  LEFT JOIN public.expenses e ON e.project_allocation_id = a.id
  GROUP BY a.id, p.id, p.name, a.amount, f.donor_name
  ORDER BY p.name;
END;
$$;