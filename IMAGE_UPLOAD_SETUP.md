# Image Upload Setup Guide

This guide will help you set up image upload functionality using Supabase Storage.

## Prerequisites

1. You already have Supabase set up for your project
2. You have the necessary environment variables configured

## Quick Setup (Recommended)

**For the fastest setup, follow the `QUICK_SETUP.md` guide instead of this detailed one.**

## Detailed Setup Steps

### 1. Create Storage Bucket

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to Storage (in the left sidebar)
3. Click "Create a new bucket"
4. Fill in the details:
   - **Name:** `itinerary-images`
   - **Public bucket:** ✅ Check this box
   - **File size limit:** `10485760` (10MB in bytes)
   - **Allowed MIME types:** `image/jpeg,image/png,image/webp,image/gif`
5. Click "Create bucket"

**Option B: Using SQL Script**

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `supabase/setup-storage.sql`

### 2. Set Up Storage Policies

1. In the Storage section, click on your `itinerary-images` bucket
2. Go to the "Policies" tab
3. Click "New Policy" and add these policies:

#### Policy 1: Allow authenticated users to upload
- **Policy name:** `Allow authenticated users to upload images`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **Policy definition:**
```sql
bucket_id = 'itinerary-images' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 2: Allow public read access
- **Policy name:** `Allow public read access to images`
- **Allowed operation:** `SELECT`
- **Target roles:** `public`
- **Policy definition:**
```sql
bucket_id = 'itinerary-images'
```

#### Policy 3: Allow users to delete their own images
- **Policy name:** `Allow users to delete their own images`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`
- **Policy definition:**
```sql
bucket_id = 'itinerary-images' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```

### 3. Verify Setup

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. You should see a bucket named "itinerary-images"
4. Click on it and verify the policies are set up correctly

## Features

✅ **Real Image Upload**: Images are uploaded to Supabase Storage and get permanent URLs

✅ **File Validation**: 
- Supports JPG, PNG, WebP, GIF
- Maximum file size: 10MB
- Automatic file type validation

✅ **User Security**: 
- Users can only upload to their own folder
- Public read access for viewing images
- Users can only delete their own images

✅ **Error Handling**: 
- Graceful fallbacks for failed uploads
- User-friendly error messages
- Loading states during upload

✅ **Stock Photos**: Still supports Unsplash stock photos as an alternative

## Usage

1. **Upload Custom Images**: Click "Upload Image" or drag & drop files
2. **Use Stock Photos**: Click "Stock Photo" to get relevant images from Unsplash
3. **Remove Images**: Hover over an image and click "Remove"

## File Structure

Images are stored in Supabase Storage with the following structure:
```
itinerary-images/
├── user-id-1/
│   ├── timestamp-random1.jpg
│   └── timestamp-random2.png
└── user-id-2/
    └── timestamp-random3.webp
```

## Troubleshooting

### "Storage bucket not found" error
- Make sure you created the bucket with the exact name `itinerary-images`
- Check that the bucket is public
- Follow the setup guide again

### "Permission denied" error
- Make sure you're logged in
- Check that the storage policies are set up correctly
- Verify the bucket name matches exactly

### "File too large" error
- Check that the file is under 10MB
- Verify the file type is supported (JPG, PNG, WebP, GIF)

## Next Steps

Once set up, you can:
1. Upload images to your itineraries
2. Images will persist across sessions
3. No more blob URL errors
4. Images are optimized and served from Supabase CDN

## Production Considerations

For production, consider:
- Setting up image optimization/compression
- Implementing image resizing for different screen sizes
- Adding image metadata storage in your database
- Setting up backup strategies for uploaded images 