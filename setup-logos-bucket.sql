-- Setup Logos Storage Bucket for Team Logos
-- Run this in your Supabase SQL Editor

-- 1. Create the logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB in bytes (reasonable for logos)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy to allow authenticated users to upload logos
CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- 4. Create policy to allow public read access to logos
CREATE POLICY "Allow public read access to logos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'logos'
);

-- 5. Create policy to allow users to delete logos (for team admins/owners)
CREATE POLICY "Allow users to delete logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- 6. Create policy to allow users to update logos
CREATE POLICY "Allow users to update logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
);

-- 7. Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'logos'; 