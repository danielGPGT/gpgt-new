import { supabase } from './supabase';
import { gemini } from './gemini';
import { ImageProcessor, type ProcessedImage } from './imageProcessor';
import { getCurrentUserTeamId, ensureUserHasTeam } from './teamUtils';

export interface MediaItem {
  id: string;
  user_id: string;
  team_id?: string;
  description: string;
  tags: string[];
  category: string;
  location?: string;
  image_url: string;
  thumbnail_url: string;
  file_size: number;
  file_type: string;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface AITaggingResult {
  tags: string[];
  description: string;
  category: string;
  location?: string;
  confidence: number;
}

export interface UploadedImage {
  url: string;
  path: string;
  size: number;
  type: string;
}

// Helper to fetch a remote image URL and convert it to a File object
async function urlToFile(url: string, filename: string = 'image.png'): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

export class MediaLibraryService {
  private static BUCKET_NAME = 'media-library';
  private static MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Upload an image to the media library bucket
   */
  private static async uploadImage(file: File, userId: string): Promise<UploadedImage> {
    // Validate file
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File too large. Please upload an image smaller than 10MB.');
    }

    // Process the image with aggressive compression and WebP conversion
    const processedImage = await ImageProcessor.processImage(file, {
      convertToWebP: true,
      quality: 0.6, // More aggressive quality setting
      maxWidth: 1200, // Smaller max width
      maxHeight: 800, // Smaller max height
      maxFileSize: 500 * 1024, // Target 500KB max
    });

    // Log compression results
    console.log(`Image processed: ${processedImage.originalSize} → ${processedImage.processedSize} bytes (${processedImage.compressionRatio.toFixed(1)}% reduction)`);

    // Generate unique filename with appropriate extension
    const timestamp = Date.now();
    const fileExtension = processedImage.format;
    const fileName = `${userId}/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, processedImage.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      if (error.message.includes('bucket not found')) {
        throw new Error('Storage bucket not found. Please set up the media library storage bucket first.');
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
      size: processedImage.processedSize,
      type: processedImage.file.type
    };
  }

  /**
   * Upload image and generate AI tags
   */
  static async uploadImageWithAITagging(
    file: File, 
    userId: string,
  ): Promise<MediaItem> {
    try {
      // Upload image to storage using the media library bucket
      const uploadedImage = await this.uploadImage(file, userId);
      
      // Generate AI tags using the actual image file
      const aiResult = await this.generateAITagsWithGemini(file);
      
      // Get or create team for the user
      const teamId = await ensureUserHasTeam();
      
      // Save to media library table
      const { data, error } = await supabase
        .from('media_library')
        .insert({
          user_id: userId,
          team_id: teamId,
          description: aiResult.description,
          tags: aiResult.tags,
          category: aiResult.category,
          location: aiResult.location,
          image_url: uploadedImage.url,
          thumbnail_url: uploadedImage.url, // Could generate thumbnail later
          file_size: uploadedImage.size, // Use processed file size
          file_type: uploadedImage.type, // Use processed file type
          ai_generated: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading image with AI tagging:', error);
      throw error;
    }
  }

  /**
   * Generate AI tags and description for an image using Gemini
   */
  static async generateAITagsWithGemini(imageFile: File): Promise<AITaggingResult> {
    try {
      const prompt = `add 7 tags for this image, can be event, location (locations need to be as accurate as possible), add the most relevant tags you can

Respond with ONLY valid JSON in this exact format:
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
  "description": "Brief description of what's visible in the image",
  "category": "activity",
  "location": "location_name_or_unknown",
  "confidence": 0.85
}`;

      // Use Gemini to analyze the image by sending the file data
      const response = await gemini.generateContent(prompt, imageFile);
      const responseText = response.response.text();
      
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }

      const aiResult = JSON.parse(jsonMatch[0]) as AITaggingResult;
      
      // Basic validation
      return {
        tags: Array.isArray(aiResult.tags) ? aiResult.tags.slice(0, 7) : ['image', 'content'],
        description: aiResult.description || 'Image content',
        category: aiResult.category || 'activity',
        location: aiResult.location || undefined,
        confidence: Math.min(Math.max(aiResult.confidence || 0.5, 0.1), 1.0)
      };

    } catch (error) {
      console.error('Error generating AI tags with Gemini:', error);
      
      // Return fallback tags if Gemini fails
      return {
        tags: ['image', 'content'],
        description: 'Image content',
        category: 'activity',
        location: undefined,
        confidence: 0.75
      };
    }
  }

  /**
   * Get team's media library
   */
  static async getTeamMedia(filters?: {
    category?: string;
    tags?: string[];
    search?: string;
  }): Promise<MediaItem[]> {
    try {
      const teamId = await getCurrentUserTeamId();

      let query = supabase
        .from('media_library')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters?.search) {
        query = query.or(`description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team media:', error);
      throw error;
    }
  }

  /**
   * Get user's media library (deprecated - use getTeamMedia instead)
   */
  static async getUserMedia(userId: string, filters?: {
    category?: string;
    tags?: string[];
    search?: string;
  }): Promise<MediaItem[]> {
    return this.getTeamMedia(filters);
  }

  /**
   * Search team media by content
   */
  static async searchTeamMedia(query: string): Promise<MediaItem[]> {
    try {
      const teamId = await getCurrentUserTeamId();

      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('team_id', teamId)
        .or(`description.ilike.%${query}%,tags.cs.{${query}},category.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching team media:', error);
      throw error;
    }
  }

  /**
   * Search media by content (deprecated - use searchTeamMedia instead)
   */
  static async searchMedia(userId: string, query: string): Promise<MediaItem[]> {
    return this.searchTeamMedia(query);
  }

  /**
   * Get team media by category
   */
  static async getTeamMediaByCategory(category: string): Promise<MediaItem[]> {
    try {
      const teamId = await getCurrentUserTeamId();

      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('team_id', teamId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team media by category:', error);
      throw error;
    }
  }

  /**
   * Get media by category (deprecated - use getTeamMediaByCategory instead)
   */
  static async getMediaByCategory(userId: string, category: string): Promise<MediaItem[]> {
    return this.getTeamMediaByCategory(category);
  }

  /**
   * Update a media item
   */
  static async updateMediaItem(id: string, updates: Partial<MediaItem>): Promise<MediaItem> {
    try {
      const teamId = await getCurrentUserTeamId();

      const { data, error } = await supabase
        .from('media_library')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('team_id', teamId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating media item:', error);
      throw error;
    }
  }

  /**
   * Delete a media item
   */
  static async deleteMediaItem(id: string): Promise<void> {
    try {
      const teamId = await getCurrentUserTeamId();

      // Get the media item first to delete the file from storage
      const { data: mediaItem } = await supabase
        .from('media_library')
        .select('image_url')
        .eq('id', id)
        .eq('team_id', teamId)
        .single();

      if (mediaItem) {
        // Extract file path from URL
        const urlParts = mediaItem.image_url.split('/');
        const filePath = urlParts.slice(-2).join('/'); // user-id/filename
        
        // Delete from storage
        await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('media_library')
        .delete()
        .eq('id', id)
        .eq('team_id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting media item:', error);
      throw error;
    }
  }

  /**
   * Get team categories
   */
  static async getTeamCategories(): Promise<string[]> {
    try {
      const teamId = await getCurrentUserTeamId();

      const { data, error } = await supabase
        .from('media_library')
        .select('category')
        .eq('team_id', teamId);

      if (error) throw error;
      
      const categories = [...new Set(data?.map((item: { category: any; }) => item.category) || [])];
      return categories.sort();
    } catch (error) {
      console.error('Error fetching team categories:', error);
      return [];
    }
  }

  /**
   * Get categories (deprecated - use getTeamCategories instead)
   */
  static async getCategories(userId: string): Promise<string[]> {
    return this.getTeamCategories();
  }

  /**
   * Get team popular tags
   */
  static async getTeamPopularTags(limit: number = 20): Promise<string[]> {
    try {
      const teamId = await getCurrentUserTeamId();

      const { data, error } = await supabase
        .from('media_library')
        .select('tags')
        .eq('team_id', teamId);

      if (error) throw error;
      
      // Count tag frequency
      const tagCounts: { [key: string]: number } = {};
      data?.forEach((item: { tags: any[]; }) => {
        item.tags?.forEach((tag: string | number) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      // Sort by frequency and return top tags
      return Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([tag]) => tag);
    } catch (error) {
      console.error('Error fetching team popular tags:', error);
      return [];
    }
  }

  /**
   * Get popular tags (deprecated - use getTeamPopularTags instead)
   */
  static async getPopularTags(userId: string, limit: number = 20): Promise<string[]> {
    return this.getTeamPopularTags(limit);
  }

  /**
   * Regenerate AI tags for an existing image
   */
  static async regenerateAITags(mediaItemId: string): Promise<MediaItem> {
    try {
      // Get the media item
      const { data: mediaItem, error: fetchError } = await supabase
        .from('media_library')
        .select('*')
        .eq('id', mediaItemId)
        .single();

      if (fetchError || !mediaItem) throw fetchError || new Error('Media item not found');

      // Fetch the image from the URL and convert it to a File object
      const imageFile = await urlToFile(mediaItem.image_url);

      // Generate new AI tags
      const aiResult = await this.generateAITagsWithGemini(imageFile);

      // Update the media item
      const { data: updatedItem, error: updateError } = await supabase
        .from('media_library')
        .update({
          description: aiResult.description,
          tags: aiResult.tags,
          category: aiResult.category,
          location: aiResult.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mediaItemId)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedItem;
    } catch (error) {
      console.error('Error regenerating AI tags:', error);
      throw error;
    }
  }

  /**
   * Upload Unsplash image to media library
   */
  static async uploadUnsplashImage(
    unsplashImage: { id: string; urls: { regular: string }; alt_description: string; user: { name: string } },
    userId: string,
    searchQuery?: string
  ): Promise<MediaItem> {
    try {
      // Download the image from Unsplash
      const imageFile = await urlToFile(unsplashImage.urls.regular, `unsplash-${unsplashImage.id}.jpg`);
      
      // Upload image to storage
      const uploadedImage = await this.uploadImage(imageFile, userId);
      
      // Generate AI tags using the downloaded image file
      const aiResult = await this.generateAITagsWithGemini(imageFile);
      
      // Create description from Unsplash data and AI analysis
      const description = aiResult.description || unsplashImage.alt_description || searchQuery || 'Unsplash image';
      
      // Add Unsplash-specific tags
      const unsplashTags = ['unsplash', 'stock photo'];
      if (searchQuery) {
        unsplashTags.push(searchQuery.toLowerCase());
      }
      const combinedTags = [...aiResult.tags, ...unsplashTags].slice(0, 7);
      
      // Get or create team for the user
      const teamId = await ensureUserHasTeam();
      
      // Save to media library table
      const { data, error } = await supabase
        .from('media_library')
        .insert({
          user_id: userId,
          team_id: teamId,
          description,
          tags: combinedTags,
          category: aiResult.category,
          location: aiResult.location,
          image_url: uploadedImage.url,
          thumbnail_url: uploadedImage.url,
          file_size: uploadedImage.size, // Use processed file size
          file_type: uploadedImage.type, // Use processed file type
          ai_generated: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading Unsplash image:', error);
      throw error;
    }
  }
} 