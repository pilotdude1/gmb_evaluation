-- Temporary fix: Disable RLS to get the system working
-- Run this in your Supabase SQL Editor
-- WARNING: This reduces security but will get your app working while we debug

-- Disable Row Level Security temporarily on all customer evaluation tables
ALTER TABLE public.customer_evaluation_searches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_evaluation_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_evaluation_usage DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to ensure access works
GRANT ALL ON public.customer_evaluation_searches TO authenticated, anon;
GRANT ALL ON public.customer_evaluations TO authenticated, anon;
GRANT ALL ON public.customer_evaluation_campaigns TO authenticated, anon;
GRANT ALL ON public.customer_evaluation_usage TO authenticated, anon;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Also grant sequence permissions if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
