# Contracts Upload Setup Guide

This guide will help you set up the contracts storage bucket in Supabase for PDF contract uploads.

## Prerequisites

- Supabase project with Storage enabled
- Admin access to your Supabase dashboard

## Step 1: Create the Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `contracts`
   - **Public bucket**: ✅ Check this to allow public access to uploaded PDFs
   - **File size limit**: 50MB (or your preferred limit)
   - **Allowed MIME types**: `application/pdf`

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies to control access.

### Policy 1: Allow authenticated users to upload PDFs

```sql
CREATE POLICY "Allow authenticated users to upload contracts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'contracts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Allow users to view their own contracts

```sql
CREATE POLICY "Allow users to view their own contracts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'contracts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Allow users to delete their own contracts

```sql
CREATE POLICY "Allow users to delete their own contracts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'contracts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4: Allow users to update their own contracts

```sql
CREATE POLICY "Allow users to update their own contracts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'contracts' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 3: Enable RLS

Make sure Row Level Security is enabled on the storage.objects table:

```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## Step 4: Test the Setup

1. Go to your application
2. Navigate to the Hotel Room form
3. Try uploading a PDF contract
4. Verify the file appears in your Supabase Storage dashboard

## File Structure

Uploaded contracts will be stored with the following structure:
```
contracts/
├── {user_id}/
│   ├── {room_id}/
│   │   └── {timestamp}-{filename}.pdf
│   └── general/
│       └── {timestamp}-{filename}.pdf
```

## Troubleshooting

### "Storage bucket not found" error
- Make sure the bucket name is exactly `contracts`
- Verify the bucket was created successfully in your Supabase dashboard

### "Permission denied" error
- Check that RLS policies are correctly configured
- Ensure the user is authenticated
- Verify the file path structure matches the policy conditions

### File upload fails
- Check the file size (max 50MB)
- Ensure the file is a valid PDF
- Verify your Supabase project has sufficient storage quota

## Security Notes

- Only authenticated users can upload/view/delete their own contracts
- Files are organized by user ID to prevent cross-user access
- Public bucket allows direct URL access to PDFs (consider if this meets your security requirements)
- Consider implementing additional encryption if needed for sensitive contracts

## Customization

You can modify the `PDFUploadService` in `src/lib/pdfUpload.ts` to:
- Change the bucket name
- Adjust file size limits
- Modify the file naming convention
- Add additional file type validation 