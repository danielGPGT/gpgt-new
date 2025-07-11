# Team Logos Setup Guide

This guide will help you set up the logos storage bucket in Supabase for team logo uploads.

## Prerequisites

- Supabase project with Storage enabled
- Admin access to your Supabase dashboard

## Step 1: Create the Storage Bucket

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `logos`
   - **Public bucket**: ✅ Check this to allow public access to uploaded logos
   - **File size limit**: 5MB (reasonable for logos)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/gif,image/svg+xml`

### Option B: Using SQL Script

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `setup-logos-bucket.sql`

## Step 2: Verify Setup

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. You should see a bucket named "logos"
4. Click on it and verify the policies are set up correctly

## Step 3: Test the Setup

1. Go to your application
2. Navigate to Settings → Team tab
3. Try uploading a team logo
4. Verify the file appears in your Supabase Storage dashboard
5. Check that the logo URL is stored in the teams table

## File Structure

Uploaded logos will be stored with the following structure:
```
logos/
├── teams/
│   ├── {team_id_1}/
│   │   ├── {timestamp}-{random}.jpg
│   │   └── {timestamp}-{random}.png
│   └── {team_id_2}/
│       └── {timestamp}-{random}.webp
```

## Features

✅ **Real Logo Upload**: Logos are uploaded to Supabase Storage and get permanent URLs

✅ **File Validation**: 
- Supports JPEG, PNG, WebP, GIF, SVG
- Maximum file size: 5MB
- Automatic file type validation

✅ **Team Organization**: 
- Logos are organized by team ID
- Public read access for viewing logos in PDFs
- Authenticated users can upload/update logos

✅ **Error Handling**: 
- Graceful fallbacks for failed uploads
- User-friendly error messages
- Loading states during upload

## Troubleshooting

### "Storage bucket not found" error
- Make sure the bucket name is exactly `logos`
- Verify the bucket was created successfully in your Supabase dashboard
- Run the setup-logos-bucket.sql script if needed

### "Permission denied" error
- Check that RLS policies are correctly configured
- Ensure the user is authenticated
- Verify the bucket is public

### Logo upload fails
- Check the file size (max 5MB)
- Ensure the file is a valid image type
- Verify your Supabase project has sufficient storage quota

### Logo URL shows as empty
- Check that the logo_url field is being saved to the teams table
- Verify the public URL is being generated correctly
- Check the browser console for any upload errors

## Security Notes

- Only authenticated users can upload logos
- Public bucket allows direct URL access to logos (needed for PDF generation)
- Files are organized by team ID for better organization
- Consider implementing additional validation if needed

## Usage in PDFs

Once set up, team logos will automatically appear in:
- Quote PDF headers
- Any other documents that use team branding
- The logo URL is stored in the `teams.logo_url` field and accessed via the team relationship 