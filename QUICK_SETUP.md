# Quick Image Upload Setup

## Step 1: Create Storage Bucket in Supabase Dashboard

1. **Go to your Supabase project dashboard**
2. **Navigate to Storage** (in the left sidebar)
3. **Click "Create a new bucket"**
4. **Fill in the details:**
   - **Name:** `itinerary-images`
   - **Public bucket:** ✅ Check this box
   - **File size limit:** `10485760` (10MB in bytes)
   - **Allowed MIME types:** `image/jpeg,image/png,image/webp,image/gif`

5. **Click "Create bucket"**

## Step 2: Set Up Storage Policies

1. **In the Storage section, click on your `itinerary-images` bucket**
2. **Go to the "Policies" tab**
3. **Click "New Policy"**
4. **Add these policies one by one:**

### Policy 1: Allow authenticated users to upload
- **Policy name:** `Allow authenticated users to upload images`
- **Allowed operation:** `INSERT`
- **Target roles:** `authenticated`
- **Policy definition:**
```sql
bucket_id = 'itinerary-images' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```

### Policy 2: Allow public read access
- **Policy name:** `Allow public read access to images`
- **Allowed operation:** `SELECT`
- **Target roles:** `public`
- **Policy definition:**
```sql
bucket_id = 'itinerary-images'
```

### Policy 3: Allow users to delete their own images
- **Policy name:** `Allow users to delete their own images`
- **Allowed operation:** `DELETE`
- **Target roles:** `authenticated`
- **Policy definition:**
```sql
bucket_id = 'itinerary-images' 
AND auth.role() = 'authenticated'
AND (storage.foldername(name))[1] = auth.uid()::text
```

## Step 3: Test the Upload

1. **Start your development server:** `npm run dev`
2. **Log in to your application**
3. **Try uploading an image in any itinerary**
4. **The image should upload successfully and get a permanent URL**

## Troubleshooting

### "Storage bucket not found" error
- Make sure you created the bucket with the exact name `itinerary-images`
- Check that the bucket is public

### "Permission denied" error
- Make sure you're logged in
- Check that the storage policies are set up correctly
- Verify the bucket name matches exactly

### "File too large" error
- Check that the file is under 10MB
- Verify the file type is supported (JPG, PNG, WebP, GIF)

## Success!

Once set up, you'll have:
- ✅ Real image uploads to Supabase Storage
- ✅ Permanent URLs that never expire
- ✅ User-specific folders for security
- ✅ Public access for viewing images
- ✅ No more blob URL errors 