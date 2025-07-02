import { supabase } from './supabase';

export interface UploadedPDF {
  url: string;
  path: string;
  size: number;
  filename: string;
}

export class PDFUploadService {
  private static BUCKET_NAME = 'contracts';
  private static MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for PDFs
  private static ALLOWED_TYPES = ['application/pdf'];

  /**
   * Upload a PDF to Supabase Storage
   */
  static async uploadPDF(
    file: File, 
    userId: string, 
    roomId?: string
  ): Promise<UploadedPDF> {
    // Validate file
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a PDF file.');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File too large. Please upload a PDF smaller than 50MB.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/\.pdf$/i, '');
    const fileName = `${userId}/${roomId || 'general'}/${timestamp}-${originalName}.pdf`;
    
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
        throw new Error('Storage bucket not found. Please set up the contracts bucket first.');
      }
      throw new Error('Failed to upload PDF. Please try again.');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      path: fileName,
      size: file.size,
      filename: file.name
    };
  }

  /**
   * Delete a PDF from Supabase Storage
   */
  static async deletePDF(pdfPath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([pdfPath]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete PDF.');
    }
  }

  /**
   * Get a list of user's uploaded PDFs
   */
  static async getUserPDFs(userId: string): Promise<UploadedPDF[]> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(userId);

    if (error) {
      console.error('List error:', error);
      throw new Error('Failed to load PDFs.');
    }

    return data.map(file => ({
      url: supabase.storage.from(this.BUCKET_NAME).getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
      path: `${userId}/${file.name}`,
      size: file.metadata?.size || 0,
      filename: file.name
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