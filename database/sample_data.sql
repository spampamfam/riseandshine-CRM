-- Sample Data for CRM System
-- Run this AFTER creating users through the application
-- Replace the user_id values with actual user IDs from your Supabase auth.users table

-- To get user IDs, run this query in Supabase SQL Editor:
-- SELECT id, email FROM auth.users;

-- Then replace the user_id values below with actual UUIDs

-- Example: Insert sample leads for a user (replace USER_ID_HERE with actual user ID)
-- INSERT INTO leads (user_id, name, contact, source, status) VALUES
--     ('USER_ID_HERE', 'John Doe', 'john@example.com', 'website', 'new'),
--     ('USER_ID_HERE', 'Jane Smith', 'jane@example.com', 'referral', 'contacted'),
--     ('USER_ID_HERE', 'Bob Johnson', 'bob@example.com', 'social', 'qualified'),
--     ('USER_ID_HERE', 'Alice Brown', 'alice@example.com', 'email', 'qualified'),
--     ('USER_ID_HERE', 'Charlie Wilson', 'charlie@example.com', 'phone', 'converted'),
--     ('USER_ID_HERE', 'Diana Davis', 'diana@example.com', 'website', 'new'),
--     ('USER_ID_HERE', 'Edward Miller', 'edward@example.com', 'referral', 'contacted'),
--     ('USER_ID_HERE', 'Fiona Garcia', 'fiona@example.com', 'social', 'new'),
--     ('USER_ID_HERE', 'George Martinez', 'george@example.com', 'email', 'qualified'),
--     ('USER_ID_HERE', 'Helen Rodriguez', 'helen@example.com', 'website', 'converted');

-- Instructions:
-- 1. First, register a user through the CRM application
-- 2. Go to Supabase Dashboard > SQL Editor
-- 3. Run: SELECT id, email FROM auth.users;
-- 4. Copy the user ID (UUID format)
-- 5. Replace 'USER_ID_HERE' in the INSERT statements above
-- 6. Run the INSERT statements to add sample data 