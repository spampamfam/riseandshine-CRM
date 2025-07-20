-- Updated Lead Schema with new fields
-- Run this in Supabase SQL Editor

-- Create campaigns table for dynamic campaign options
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form fields table for dynamic form management
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL UNIQUE,
    field_type VARCHAR(50) NOT NULL, -- text, textarea, select, number, email, tel, etc.
    field_label VARCHAR(255) NOT NULL,
    field_placeholder TEXT,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    field_order INTEGER DEFAULT 0,
    field_options JSONB, -- For select fields, store options as JSON array
    validation_rules JSONB, -- Store validation rules
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form sections table for organizing fields
CREATE TABLE IF NOT EXISTS form_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_name VARCHAR(100) NOT NULL UNIQUE,
    section_title VARCHAR(255) NOT NULL,
    section_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create section fields mapping table
CREATE TABLE IF NOT EXISTS section_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID REFERENCES form_sections(id) ON DELETE CASCADE,
    field_id UUID REFERENCES form_fields(id) ON DELETE CASCADE,
    field_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(section_id, field_id)
);

-- Update leads table with new fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ap DECIMAL(12,2); -- Asking Price
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mv DECIMAL(12,2); -- Market Value
ALTER TABLE leads ADD COLUMN IF NOT EXISTS repairs_needed TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bedrooms INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(3,1);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS occupancy VARCHAR(20) CHECK (occupancy IN ('owner_occupied', 'tenants', 'vacant'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS closing VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- Update status column to use new status options
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
    CHECK (status IN ('new', 'contacted', 'qualified', 'disqualified', 'callback', 'inventory', 'converted'));

-- Create lead notes table
CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general', -- general, status_change, admin_note
    is_admin_note BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default form sections
INSERT INTO form_sections (section_name, section_title, section_order) VALUES
('basic_info', 'Basic Information', 1),
('property_details', 'Property Details', 2),
('deal_info', 'Deal Information', 3),
('location', 'Location', 4),
('additional_info', 'Additional Information', 5),
('status', 'Lead Status', 6)
ON CONFLICT (section_name) DO NOTHING;

-- Insert default form fields
INSERT INTO form_fields (field_name, field_type, field_label, field_placeholder, is_required, field_order, field_options) VALUES
('name', 'text', 'Name', 'Enter full name', true, 1, NULL),
('phone_number', 'tel', 'Phone Number', 'Enter phone number', true, 2, NULL),
('campaign_id', 'select', 'Campaign', 'Select campaign', false, 3, '[]'),
('ap', 'number', 'AP (Asking Price)', 'Enter asking price', false, 4, NULL),
('mv', 'number', 'MV (Market Value)', 'Enter market value', false, 5, NULL),
('bedrooms', 'select', 'Bedrooms', 'Select number of bedrooms', false, 6, '["1","2","3","4","5","6+"]'),
('bathrooms', 'select', 'Bathrooms', 'Select number of bathrooms', false, 7, '["1","1.5","2","2.5","3","3.5","4","4+"]'),
('condition_rating', 'select', 'Condition (1-10 Scale)', 'Select condition rating', false, 8, '["1 - Very Poor","2 - Poor","3 - Fair","4 - Below Average","5 - Average","6 - Above Average","7 - Good","8 - Very Good","9 - Excellent","10 - Perfect"]'),
('occupancy', 'select', 'Occupancy', 'Select occupancy status', false, 9, '["owner_occupied","tenants","vacant"]'),
('repairs_needed', 'textarea', 'Repairs Needed', 'Describe repairs needed', false, 10, NULL),
('reason', 'textarea', 'Reason for Selling', 'Why is the property being sold?', false, 11, NULL),
('closing', 'text', 'Closing Timeline', 'e.g., ASAP, 30 days, 60 days', false, 12, NULL),
('address', 'textarea', 'Address', 'Enter full property address', true, 13, NULL),
('additional_info', 'textarea', 'Additional Info', 'Any additional notes or information', false, 14, NULL),
('status', 'select', 'Status', 'Select lead status', false, 15, '["new","contacted","qualified","disqualified","callback","inventory","converted"]')
ON CONFLICT (field_name) DO NOTHING;

-- Map fields to sections (now that both tables exist)
INSERT INTO section_fields (section_id, field_id, field_order, is_required) 
SELECT 
    s.id as section_id,
    f.id as field_id,
    f.field_order,
    f.is_required
FROM form_sections s
JOIN form_fields f ON 
    (s.section_name = 'basic_info' AND f.field_name IN ('name', 'phone_number', 'campaign_id')) OR
    (s.section_name = 'property_details' AND f.field_name IN ('ap', 'mv', 'bedrooms', 'bathrooms', 'condition_rating', 'occupancy', 'repairs_needed')) OR
    (s.section_name = 'deal_info' AND f.field_name IN ('reason', 'closing')) OR
    (s.section_name = 'location' AND f.field_name IN ('address')) OR
    (s.section_name = 'additional_info' AND f.field_name IN ('additional_info')) OR
    (s.section_name = 'status' AND f.field_name IN ('status'))
ON CONFLICT (section_id, field_id) DO NOTHING;

-- Insert some default campaigns
INSERT INTO campaigns (name, description) VALUES
('Website Lead', 'Leads from website contact forms'),
('Referral', 'Leads from referrals'),
('Social Media', 'Leads from social media platforms'),
('Cold Call', 'Leads from cold calling'),
('Direct Mail', 'Leads from direct mail campaigns'),
('Online Ads', 'Leads from online advertising')
ON CONFLICT (name) DO NOTHING;

-- Create RLS policies for campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns are viewable by all authenticated users" ON campaigns
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Campaigns are manageable by admins" ON campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Create RLS policies for form_fields
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Form fields are viewable by all authenticated users" ON form_fields
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Form fields are manageable by admins" ON form_fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Create RLS policies for form_sections
ALTER TABLE form_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Form sections are viewable by all authenticated users" ON form_sections
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Form sections are manageable by admins" ON form_sections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Create RLS policies for section_fields
ALTER TABLE section_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Section fields are viewable by all authenticated users" ON section_fields
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Section fields are manageable by admins" ON section_fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Create RLS policies for lead_notes
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes for their own leads" ON lead_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_notes.lead_id 
            AND leads.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all notes" ON lead_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Users can create notes for their own leads" ON lead_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_notes.lead_id 
            AND leads.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can create notes for any lead" ON lead_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Users can update their own notes" ON lead_notes
    FOR UPDATE USING (
        user_id = auth.uid()
    );

CREATE POLICY "Admins can update any note" ON lead_notes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_roles 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Create functions for form management
CREATE OR REPLACE FUNCTION get_form_structure()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'section', s.section_name,
            'title', s.section_title,
            'order', s.section_order,
            'fields', (
                SELECT json_agg(
                    json_build_object(
                        'name', f.field_name,
                        'type', f.field_type,
                        'label', f.field_label,
                        'placeholder', f.field_placeholder,
                        'required', sf.is_required,
                        'options', f.field_options,
                        'order', sf.field_order
                    ) ORDER BY sf.field_order
                )
                FROM section_fields sf
                JOIN form_fields f ON sf.field_id = f.id
                WHERE sf.section_id = s.id AND f.is_active = true
            )
        ) ORDER BY s.section_order
    ) INTO result
    FROM form_sections s
    WHERE s.is_active = true;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get campaigns
CREATE OR REPLACE FUNCTION get_campaigns()
RETURNS TABLE(id UUID, name VARCHAR, description TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.description
    FROM campaigns c
    WHERE c.is_active = true
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lead statistics
CREATE OR REPLACE FUNCTION get_lead_stats(user_uuid UUID DEFAULT NULL)
RETURNS TABLE(
    total_qualified_this_month INTEGER,
    leads_today INTEGER,
    qualified INTEGER,
    disqualified INTEGER,
    callback INTEGER,
    inventory INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total qualified leads this month
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM leads
            WHERE status = 'qualified'
            AND created_at >= date_trunc('month', CURRENT_DATE)
            AND (user_uuid IS NULL OR user_id = user_uuid)
        ), 0) as total_qualified_this_month,
        
        -- Leads today
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM leads
            WHERE created_at >= CURRENT_DATE
            AND (user_uuid IS NULL OR user_id = user_uuid)
        ), 0) as leads_today,
        
        -- Qualified
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM leads
            WHERE status = 'qualified'
            AND (user_uuid IS NULL OR user_id = user_uuid)
        ), 0) as qualified,
        
        -- Disqualified
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM leads
            WHERE status = 'disqualified'
            AND (user_uuid IS NULL OR user_id = user_uuid)
        ), 0) as disqualified,
        
        -- Callback
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM leads
            WHERE status = 'callback'
            AND (user_uuid IS NULL OR user_id = user_uuid)
        ), 0) as callback,
        
        -- Inventory
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM leads
            WHERE status = 'inventory'
            AND (user_uuid IS NULL OR user_id = user_uuid)
        ), 0) as inventory;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing get_all_leads function to include new fields
CREATE OR REPLACE FUNCTION get_all_leads()
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    contact VARCHAR,
    phone_number VARCHAR,
    campaign_name VARCHAR,
    ap DECIMAL,
    mv DECIMAL,
    repairs_needed TEXT,
    bedrooms INTEGER,
    bathrooms DECIMAL,
    condition_rating INTEGER,
    occupancy VARCHAR,
    reason TEXT,
    closing VARCHAR,
    address TEXT,
    additional_info TEXT,
    status VARCHAR,
    source VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_email VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        l.contact,
        l.phone_number,
        c.name as campaign_name,
        l.ap,
        l.mv,
        l.repairs_needed,
        l.bedrooms,
        l.bathrooms,
        l.condition_rating,
        l.occupancy,
        l.reason,
        l.closing,
        l.address,
        l.additional_info,
        l.status,
        l.source,
        l.created_at,
        l.updated_at,
        u.email as user_email
    FROM leads l
    LEFT JOIN campaigns c ON l.campaign_id = c.id
    LEFT JOIN auth.users u ON l.user_id = u.id
    ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 