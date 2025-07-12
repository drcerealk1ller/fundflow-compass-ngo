-- Update the current user to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = (SELECT auth.uid());