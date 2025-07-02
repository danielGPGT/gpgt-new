-- Setup Contracts Storage Bucket
-- Run this in your Supabase SQL Editor

-- 1. Create the contracts bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  true,
  52428800, -- 50MB in bytes
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy to allow authenticated users to upload contracts
CREATE POLICY "Allow authenticated users to upload contracts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'contracts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Create policy to allow users to view their own contracts
CREATE POLICY "Allow users to view their own contracts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'contracts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Create policy to allow users to delete their own contracts
CREATE POLICY "Allow users to delete their own contracts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'contracts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Create policy to allow users to update their own contracts
CREATE POLICY "Allow users to update their own contracts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'contracts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'contracts'; 