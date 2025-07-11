-- Delete and Recreate Logos Storage Bucket for Team Logos
-- This script will completely remove the existing logos bucket and create a fresh one

-- 1. First, delete all objects in the logos bucket (if it exists)
DELETE FROM storage.objects WHERE bucket_id = 'logos';

-- 2. Delete the logos bucket itself
DELETE FROM storage.buckets WHERE id = 'logos';

-- 3. Create a fresh logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB in bytes (reasonable for logos)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
);

-- 4. Create policy to allow authenticated users to upload logos
CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
);

-- 5. Create policy to allow public read access to logos
CREATE POLICY "Allow public read access to logos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'logos'
);

-- 6. Create policy to allow users to delete logos (for team admins/owners)
CREATE POLICY "Allow users to delete logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
);

-- 7. Create policy to allow users to update logos
CREATE POLICY "Allow users to update logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
);

-- 8. Verify the bucket was created successfully
SELECT * FROM storage.buckets WHERE id = 'logos'; 