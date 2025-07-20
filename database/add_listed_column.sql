-- Add listed column to leads table
-- Run this in Supabase SQL Editor

-- Add the listed column with check constraint
ALTER TABLE leads ADD COLUMN IF NOT EXISTS listed VARCHAR(50) CHECK (listed IN ('listed_with_realtor', 'listed_by_owner', 'not_listed'));

-- Add the listed field to form_fields if it doesn't exist
INSERT INTO form_fields (field_name, field_type, field_label, field_placeholder, is_required, field_order, field_options) 
VALUES ('listed', 'select', 'Listed', 'Select listing status', false, 4, '["listed_with_realtor","listed_by_owner","not_listed"]')
ON CONFLICT (field_name) DO NOTHING;

-- Map the listed field to basic_info section
INSERT INTO section_fields (section_id, field_id, field_order, is_required) 
SELECT 
    s.id as section_id,
    f.id as field_id,
    f.field_order,
    f.is_required
FROM form_sections s
JOIN form_fields f ON f.field_name = 'listed' AND s.section_name = 'basic_info'
ON CONFLICT (section_id, field_id) DO NOTHING; 