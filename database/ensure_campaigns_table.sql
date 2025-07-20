-- Ensure campaigns table exists with correct structure
-- Run this in Supabase SQL Editor

-- Create campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on campaigns table
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Campaigns are viewable by all authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Campaigns are manageable by admins" ON campaigns;

-- Create RLS policies for campaigns
CREATE POLICY "Campaigns are viewable by all authenticated users" ON campaigns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Campaigns are manageable by admins" ON campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Insert default campaigns if table is empty
INSERT INTO campaigns (name, description) 
SELECT * FROM (VALUES
    ('Website Lead', 'Leads from website contact forms'),
    ('Referral', 'Leads from referrals'),
    ('Social Media', 'Leads from social media platforms'),
    ('Cold Call', 'Leads from cold calling'),
    ('Direct Mail', 'Leads from direct mail campaigns'),
    ('Online Ads', 'Leads from online advertising'),
    ('Open House', 'Leads from open house events'),
    ('FSBO', 'For Sale By Owner leads')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE campaigns.name = v.name);

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
ORDER BY ordinal_position; 