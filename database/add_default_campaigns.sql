-- Add default campaigns to the database
-- Run this in Supabase SQL Editor

-- Insert default campaigns
INSERT INTO campaigns (name, description) VALUES
('Website Lead', 'Leads from website contact forms'),
('Referral', 'Leads from referrals'),
('Social Media', 'Leads from social media platforms'),
('Cold Call', 'Leads from cold calling'),
('Direct Mail', 'Leads from direct mail campaigns'),
('Online Ads', 'Leads from online advertising'),
('Open House', 'Leads from open house events'),
('FSBO', 'For Sale By Owner leads')
ON CONFLICT (name) DO NOTHING; 