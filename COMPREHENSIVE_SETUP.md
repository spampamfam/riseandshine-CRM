# 🚀 **Comprehensive CRM System Setup Guide**

## 🎯 **What You Get:**

### **✅ Enhanced Lead Management**
- **New Lead Form** with comprehensive property details
- **Campaign Management** with dynamic dropdown options
- **Admin Panel** to view all leads from all users
- **Form Builder** to customize lead forms dynamically

### **✅ Admin Capabilities**
- **View All Leads** from all users in the system
- **Campaign Management** - Add, edit, delete campaigns
- **Form Builder** - Add, edit, delete form fields
- **User Management** - Manage admin roles and user access
- **System Statistics** - Overview of all system activity

---

## 📋 **Step-by-Step Setup**

### **Step 1: Import Database Schema**

1. **Go to Supabase Dashboard**
2. **Click "SQL Editor"**
3. **Run the following SQL in order:**

#### **1.1 Admin Schema (if not already done)**
```sql
-- Run database/admin_schema.sql first
```

#### **1.2 Updated Lead Schema**
```sql
-- Create campaigns table for dynamic campaign options
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Create form fields table for dynamic form management
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL UNIQUE,
    field_type VARCHAR(50) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_placeholder TEXT,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    field_order INTEGER DEFAULT 0,
    field_options JSONB,
    validation_rules JSONB,
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
('status', 'select', 'Status', 'Select lead status', false, 15, '["new","contacted","qualified","converted"]')
ON CONFLICT (field_name) DO NOTHING;

-- Map fields to sections
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
```

#### **1.3 RLS Policies and Functions**
```sql
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

-- Create functions for form management here
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
```

### **Step 2: Make Yourself an Admin**
```sql
-- Get your user ID
SELECT id, email FROM auth.users;

-- Make yourself admin (replace with your user ID)
INSERT INTO admin_roles (user_id, is_admin) VALUES ('your-user-id-here', true);
```

### **Step 3: Deploy Updates**
```cmd
git add .
git commit -m "Add comprehensive CRM system with admin capabilities and new lead form"
git push
```

---

## 🎯 **New Features Overview**

### **✅ Enhanced Lead Form**
- **Name & Phone** - Basic contact information
- **Campaign Dropdown** - Dynamic campaign selection
- **Property Details** - AP, MV, bedrooms, bathrooms, condition, occupancy
- **Repairs Needed** - Text area for repair descriptions
- **Deal Information** - Reason for selling, closing timeline
- **Address** - Full property address
- **Additional Info** - Extra notes and information

### **✅ Admin Panel Features**
1. **Overview Tab** - System statistics and recent leads
2. **All Leads Tab** - View and manage all leads from all users
3. **Campaigns Tab** - Add, edit, delete campaigns
4. **Form Builder Tab** - Customize lead form fields
5. **User Management Tab** - Manage users and admin roles

### **✅ Campaign Management**
- **Add Campaigns** - Create new marketing campaigns
- **Edit Campaigns** - Update campaign details
- **Delete Campaigns** - Remove unused campaigns
- **Dynamic Dropdown** - Campaigns appear in lead form

### **✅ Form Builder**
- **Add Fields** - Create new form fields
- **Edit Fields** - Modify existing fields
- **Delete Fields** - Remove unused fields
- **Field Types** - Text, textarea, select, number, email, tel, date
- **Field Options** - For select fields, add custom options
- **Required Fields** - Mark fields as required

---

## 🚀 **How to Use**

### **✅ For Regular Users**
1. **Login** to your CRM
2. **Add Leads** using the new comprehensive form
3. **Select Campaigns** from the dropdown
4. **Fill Property Details** with all the new fields
5. **Save and Manage** your leads

### **✅ For Admins**
1. **Access Admin Panel** - Click "Admin Panel" in navigation
2. **View All Leads** - See leads from all users
3. **Manage Campaigns** - Add/edit/delete campaigns
4. **Customize Forms** - Use Form Builder to modify lead forms
5. **Manage Users** - Control admin access and user roles

### **✅ Campaign Management**
1. **Go to Admin Panel** → **Campaigns Tab**
2. **Add Campaign** - Click "+ Add Campaign"
3. **Fill Details** - Name and description
4. **Save** - Campaign appears in lead form dropdown

### **✅ Form Builder**
1. **Go to Admin Panel** → **Form Builder Tab**
2. **Add Field** - Click "+ Add Field"
3. **Configure Field** - Type, label, options, required status
4. **Save** - Field appears in lead form

---

## 🛡️ **Security Features**

- **Admin-Only Access** - Only admins can access admin features
- **Row Level Security** - Database-level protection
- **User Isolation** - Users can only see their own leads
- **Admin Override** - Admins can see all leads
- **Form Validation** - Server-side validation for all fields

---

## 🎉 **Benefits**

- ✅ **Comprehensive Lead Data** - Capture detailed property information
- ✅ **Campaign Tracking** - Track lead sources with campaigns
- ✅ **Admin Oversight** - Admins can view and manage all leads
- ✅ **Flexible Forms** - Customize lead forms as needed
- ✅ **Better Organization** - Leads organized by sections
- ✅ **Enhanced Reporting** - More data for better insights

**Your CRM is now a comprehensive lead management system with full admin capabilities!** 🚀✨ 