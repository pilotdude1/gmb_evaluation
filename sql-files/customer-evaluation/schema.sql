-- Customer Evaluation System Database Schema
-- Run this script in your Supabase SQL editor to create the required tables

-- Table: customer_evaluation_searches
-- Stores search requests and their progress
CREATE TABLE IF NOT EXISTS customer_evaluation_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_params JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'initiated',
    current_step INTEGER DEFAULT 0,
    found_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: customer_evaluations  
-- Stores the actual business data from GMB scraping
CREATE TABLE IF NOT EXISTS customer_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_session_id UUID REFERENCES customer_evaluation_searches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Business Info
    business_name TEXT NOT NULL,
    contact_person TEXT,
    phone_number TEXT,
    email_1 TEXT,
    email_2 TEXT,
    email_3 TEXT,
    email_4 TEXT,
    email_5 TEXT,
    website_url TEXT,
    
    -- Address Information
    street TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    neighborhood TEXT,
    
    -- Business Data (from GMB)
    categories JSONB,
    business_hours JSONB,
    customer_reviews JSONB,
    review_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    
    -- Activity Indicators
    posts_updates BOOLEAN DEFAULT false,
    location_collection JSONB,
    photos_media BOOLEAN DEFAULT false,
    gmb_questions BOOLEAN DEFAULT false,
    business_status TEXT DEFAULT 'open',
    recent_engagements BOOLEAN DEFAULT false,
    
    -- Evaluation Score
    fit_score INTEGER DEFAULT 0,
    evaluation_status TEXT DEFAULT 'pending', -- pending, approved, rejected
    
    -- Integration IDs
    agile_crm_id TEXT,
    clickup_task_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: customer_evaluation_campaigns
-- Stores saved search templates and campaigns
CREATE TABLE IF NOT EXISTS customer_evaluation_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    search_params JSONB NOT NULL,
    is_template BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: customer_evaluation_usage
-- Track API usage for subscription limits
CREATE TABLE IF NOT EXISTS customer_evaluation_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    searches_this_month INTEGER DEFAULT 0,
    businesses_found_this_month INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_evaluations_user_id ON customer_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_evaluations_session_id ON customer_evaluations(search_session_id);
CREATE INDEX IF NOT EXISTS idx_customer_evaluations_business_name ON customer_evaluations(business_name);
CREATE INDEX IF NOT EXISTS idx_customer_evaluations_city_state ON customer_evaluations(city, state);
CREATE INDEX IF NOT EXISTS idx_customer_evaluations_fit_score ON customer_evaluations(fit_score);
CREATE INDEX IF NOT EXISTS idx_customer_evaluations_created_at ON customer_evaluations(created_at);

CREATE INDEX IF NOT EXISTS idx_customer_evaluation_searches_user_id ON customer_evaluation_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_evaluation_searches_status ON customer_evaluation_searches(status);
CREATE INDEX IF NOT EXISTS idx_customer_evaluation_searches_created_at ON customer_evaluation_searches(created_at);

CREATE INDEX IF NOT EXISTS idx_customer_evaluation_campaigns_user_id ON customer_evaluation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_evaluation_campaigns_is_template ON customer_evaluation_campaigns(is_template);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE customer_evaluation_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_evaluation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_evaluation_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_evaluation_searches
CREATE POLICY "Users can view their own searches" ON customer_evaluation_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches" ON customer_evaluation_searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches" ON customer_evaluation_searches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches" ON customer_evaluation_searches
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for customer_evaluations
CREATE POLICY "Users can view their own evaluations" ON customer_evaluations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evaluations" ON customer_evaluations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evaluations" ON customer_evaluations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evaluations" ON customer_evaluations
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for customer_evaluation_campaigns
CREATE POLICY "Users can view their own campaigns" ON customer_evaluation_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON customer_evaluation_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON customer_evaluation_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON customer_evaluation_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for customer_evaluation_usage
CREATE POLICY "Users can view their own usage" ON customer_evaluation_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON customer_evaluation_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON customer_evaluation_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_customer_evaluation_searches_updated_at 
    BEFORE UPDATE ON customer_evaluation_searches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_evaluations_updated_at 
    BEFORE UPDATE ON customer_evaluations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_evaluation_campaigns_updated_at 
    BEFORE UPDATE ON customer_evaluation_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_evaluation_usage_updated_at 
    BEFORE UPDATE ON customer_evaluation_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly usage counters
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE customer_evaluation_usage 
    SET 
        searches_this_month = 0,
        businesses_found_this_month = 0,
        last_reset_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE last_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ language 'plpgsql';

-- Create a function to get user's current usage statistics
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_uuid UUID)
RETURNS TABLE (
    searches_this_month INTEGER,
    businesses_found_this_month INTEGER,
    total_searches BIGINT,
    total_businesses BIGINT
) AS $$
BEGIN
    -- Ensure user has a usage record
    INSERT INTO customer_evaluation_usage (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Reset monthly counters if needed
    PERFORM reset_monthly_usage();
    
    RETURN QUERY
    SELECT 
        u.searches_this_month,
        u.businesses_found_this_month,
        COALESCE(s.total_searches, 0) as total_searches,
        COALESCE(e.total_businesses, 0) as total_businesses
    FROM customer_evaluation_usage u
    LEFT JOIN (
        SELECT user_id, COUNT(*) as total_searches
        FROM customer_evaluation_searches
        WHERE user_id = user_uuid
        GROUP BY user_id
    ) s ON u.user_id = s.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as total_businesses
        FROM customer_evaluations
        WHERE user_id = user_uuid
        GROUP BY user_id
    ) e ON u.user_id = e.user_id
    WHERE u.user_id = user_uuid;
END;
$$ language 'plpgsql';

-- Seed some example campaign templates
INSERT INTO customer_evaluation_campaigns (
    id,
    user_id,
    name,
    description,
    search_params,
    is_template
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM auth.users LIMIT 1), -- Replace with actual user ID
    'Phoenix Restaurants - Standard',
    'Standard restaurant search template for Phoenix area',
    '{
        "marketVertical": "restaurant",
        "subCategory": "",
        "city": "Phoenix",
        "state": "AZ",
        "radius": 25,
        "minReviews": 25,
        "minRating": 4.0,
        "batchSize": 50,
        "excludeClosed": true
    }'::jsonb,
    true
),
(
    gen_random_uuid(),
    (SELECT id FROM auth.users LIMIT 1), -- Replace with actual user ID
    'Arizona Contractors - Comprehensive',
    'Comprehensive contractor search for Arizona state',
    '{
        "marketVertical": "contractor",
        "subCategory": "",
        "city": "Phoenix",
        "state": "AZ", 
        "radius": 100,
        "minReviews": 10,
        "minRating": 3.5,
        "batchSize": 75,
        "excludeClosed": true,
        "hasWebsite": true
    }'::jsonb,
    true
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE customer_evaluation_searches IS 'Stores search requests and their progress tracking';
COMMENT ON TABLE customer_evaluations IS 'Stores scraped business data from Google My Business';
COMMENT ON TABLE customer_evaluation_campaigns IS 'Stores saved search templates and campaign configurations';
COMMENT ON TABLE customer_evaluation_usage IS 'Tracks monthly usage for subscription limits';
