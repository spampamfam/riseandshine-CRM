-- Admin Role System for CRM
-- Run this in Supabase SQL Editor after the main schema

-- Create admin_roles table to manage admin permissions
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_is_admin ON admin_roles(is_admin);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_roles
CREATE POLICY "Users can view their own admin status" ON admin_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all admin roles" ON admin_roles
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = user_uuid AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all leads for admin
CREATE OR REPLACE FUNCTION get_all_leads_for_admin()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name VARCHAR(255),
    contact VARCHAR(255),
    source VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_email TEXT
) AS $$
BEGIN
    -- Check if current user is admin
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        l.id,
        l.user_id,
        l.name,
        l.contact,
        l.source,
        l.status,
        l.created_at,
        l.updated_at,
        u.email as user_email
    FROM leads l
    JOIN auth.users u ON l.user_id = u.id
    ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get admin stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_leads BIGINT,
    leads_by_status JSON,
    recent_leads BIGINT,
    top_sources JSON
) AS $$
BEGIN
    -- Check if current user is admin
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM auth.users) as total_users,
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT json_object_agg(status, count) 
         FROM (SELECT status, COUNT(*) as count 
               FROM leads 
               GROUP BY status) as status_counts) as leads_by_status,
        (SELECT COUNT(*) FROM leads 
         WHERE created_at >= NOW() - INTERVAL '7 days') as recent_leads,
        (SELECT json_object_agg(source, count) 
         FROM (SELECT source, COUNT(*) as count 
               FROM leads 
               GROUP BY source 
               ORDER BY count DESC 
               LIMIT 5) as source_counts) as top_sources;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at column
CREATE TRIGGER update_admin_roles_updated_at 
    BEFORE UPDATE ON admin_roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin (replace with your user ID)
-- You can get your user ID by running: SELECT id, email FROM auth.users;
-- Then uncomment and update the line below:
-- INSERT INTO admin_roles (user_id, is_admin) VALUES ('your-user-id-here', true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON admin_roles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_leads_for_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO anon, authenticated; 