-- Fix RLS policies for customer evaluation tables
-- Run this in your Supabase SQL Editor

-- Drop and recreate policies with more permissive settings for debugging
-- We'll use more lenient policies to ensure the system works

-- Customer Evaluation Searches Table
DROP POLICY IF EXISTS "Users can view their own searches" ON public.customer_evaluation_searches;
DROP POLICY IF EXISTS "Users can insert their own searches" ON public.customer_evaluation_searches;
DROP POLICY IF EXISTS "Users can update their own searches" ON public.customer_evaluation_searches;
DROP POLICY IF EXISTS "Users can delete their own searches" ON public.customer_evaluation_searches;

-- More permissive policies for customer_evaluation_searches
CREATE POLICY "Enable all operations for authenticated users on searches" ON public.customer_evaluation_searches
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Customer Evaluations Table  
DROP POLICY IF EXISTS "Users can view their own evaluations" ON public.customer_evaluations;
DROP POLICY IF EXISTS "Users can insert their own evaluations" ON public.customer_evaluations;
DROP POLICY IF EXISTS "Users can update their own evaluations" ON public.customer_evaluations;
DROP POLICY IF EXISTS "Users can delete their own evaluations" ON public.customer_evaluations;

CREATE POLICY "Enable all operations for authenticated users on evaluations" ON public.customer_evaluations
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Customer Evaluation Campaigns Table
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.customer_evaluation_campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.customer_evaluation_campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.customer_evaluation_campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.customer_evaluation_campaigns;

CREATE POLICY "Enable all operations for authenticated users on campaigns" ON public.customer_evaluation_campaigns
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Customer Evaluation Usage Table
DROP POLICY IF EXISTS "Users can view their own usage" ON public.customer_evaluation_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.customer_evaluation_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.customer_evaluation_usage;

CREATE POLICY "Enable all operations for authenticated users on usage" ON public.customer_evaluation_usage
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary permissions to ensure the tables are accessible
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.customer_evaluation_searches TO authenticated;
GRANT ALL ON public.customer_evaluations TO authenticated;
GRANT ALL ON public.customer_evaluation_campaigns TO authenticated;
GRANT ALL ON public.customer_evaluation_usage TO authenticated;

-- Also grant permissions to anon role for public access if needed
GRANT SELECT ON public.customer_evaluation_searches TO anon;
GRANT SELECT ON public.customer_evaluations TO anon;
GRANT SELECT ON public.customer_evaluation_campaigns TO anon;
GRANT SELECT ON public.customer_evaluation_usage TO anon;
