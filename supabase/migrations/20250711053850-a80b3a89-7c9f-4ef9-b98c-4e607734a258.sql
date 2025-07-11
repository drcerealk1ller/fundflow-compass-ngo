-- Update RLS policy for funding to allow all authenticated users to create funding records
DROP POLICY IF EXISTS "Admins and accountants can modify funding" ON public.funding;

-- Create more permissive policies for funding
CREATE POLICY "Anyone can create funding" 
ON public.funding 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and accountants can update funding" 
ON public.funding 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'accountant'::text])))));

CREATE POLICY "Admins and accountants can delete funding" 
ON public.funding 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'accountant'::text])))));

-- Keep the existing view policy unchanged
-- "Anyone can view funding" policy already exists and is correct