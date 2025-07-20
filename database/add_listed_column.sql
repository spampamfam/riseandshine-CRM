-- Add listed column to leads table
-- Run this in Supabase SQL Editor

-- Add the listed column with check constraint
ALTER TABLE leads ADD COLUMN IF NOT EXISTS listed VARCHAR(50) CHECK (listed IN ('listed_with_realtor', 'listed_by_owner', 'not_listed'));

-- Update existing leads to have a default value (optional)
UPDATE leads SET listed = 'not_listed' WHERE listed IS NULL; 