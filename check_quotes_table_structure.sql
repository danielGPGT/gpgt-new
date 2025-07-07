-- Diagnostic Script: Check Current Quotes Table Structure
-- Run this first to see what columns exist in your current quotes table

-- Check if quotes table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotes') 
    THEN 'Quotes table exists' 
    ELSE 'Quotes table does not exist' 
  END as table_status;

-- Get all columns in the quotes table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'quotes' 
ORDER BY ordinal_position;

-- Check for specific columns that might cause issues
SELECT 
  'client_address' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'client_address'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'currency' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'currency'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'travelers' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'travelers'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'travelers_adults' as column_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'travelers_adults'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Count existing quotes
SELECT COUNT(*) as total_quotes FROM quotes;

-- Check sample data structure
SELECT 
  id,
  client_name,
  currency,
  total_price,
  created_at
FROM quotes 
LIMIT 5; 