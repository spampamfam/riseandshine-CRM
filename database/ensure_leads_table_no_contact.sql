-- Remove the 'contact' column from the leads table if it exists
ALTER TABLE leads DROP COLUMN IF EXISTS contact;

-- Optionally, show the current columns for verification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'; 