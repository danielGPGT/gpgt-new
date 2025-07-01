import { supabase } from './supabase';

export interface UploadedImage {
  url: string;
  path: string;
  size: number;
  type: string;
}

export class ImageUploadService {
  private static BUCKET_NAME = 'itinerary-images';
  private static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Upload an image to Supabase Storage
   */
  static async uploadImage(
    file: File, 
    userId: string, 
    itineraryId?: string
  ): Promise<UploadedImage> {
    // Validate file
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File too large. Please upload an image smaller than 10MB.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      if (error.message.includes('bucket not found')) {
        throw new Error('Storage bucket not found. Please set up the storage bucket first. See IMAGE_UPLOAD_SETUP.md for instructions.');
      }
      throw new Error('Failed to upload image. Please try again.');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      path: fileName,
      size: file.size,
      type: file.type
    };
  }

  /**
   * Delete an image from Supabase Storage
   */
  static async deleteImage(imagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([imagePath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete image.');
    }
  }

  /**
   * Get a list of user's uploaded images
   */
  static async getUserImages(userId: string): Promise<UploadedImage[]> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(userId);

    if (error) {
      console.error('List error:', error);
      throw new Error('Failed to load images.');
    }

    return data.map(file => ({
      url: supabase.storage.from(this.BUCKET_NAME).getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
      path: `${userId}/${file.name}`,
      size: file.metadata?.size || 0,
      type: file.metadata?.mimetype || 'image/jpeg'
    }));
  }

  /**
   * Check if the storage bucket exists
   */
  static async checkBucketExists(): Promise<boolean> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      return buckets?.some(bucket => bucket.name === this.BUCKET_NAME) || false;
    } catch (error) {
      console.error('Error checking bucket:', error);
      return false;
    }
  }
} 