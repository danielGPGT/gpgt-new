import { supabase } from './supabase';
import { ImageUploadService } from './imageUpload';
import { gemini } from './gemini';

export interface MediaItem {
  id: string;
  user_id: string;
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

// Helper to fetch a remote image URL and convert it to a File object
async function urlToFile(url: string, filename: string = 'image.png'): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

export class MediaLibraryService {
  private static BUCKET_NAME = 'media-library';

  /**
   * Upload image and generate AI tags
   */
  static async uploadImageWithAITagging(
    file: File, 
    userId: string,
  ): Promise<MediaItem> {
    try {
      // Upload image to storage
      const uploadedImage = await ImageUploadService.uploadImage(file, userId);
      
      // Generate AI tags using the actual image file
      const aiResult = await this.generateAITagsWithGemini(file);
      
      // Save to media library table
      const { data, error } = await supabase
        .from('media_library')
        .insert({
          user_id: userId,
          description: aiResult.description,
          tags: aiResult.tags,
          category: aiResult.category,
          location: aiResult.location,
          image_url: uploadedImage.url,
          thumbnail_url: uploadedImage.url, // Could generate thumbnail later
          file_size: file.size,
          file_type: file.type,
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
        confidence: 0.5
      };
    }
  }

  /**
   * Get user's media library
   */
  static async getUserMedia(userId: string, filters?: {
    category?: string;
    tags?: string[];
    search?: string;
  }): Promise<MediaItem[]> {
    try {
      let query = supabase
        .from('media_library')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user media:', error);
      throw error;
    }
  }

  /**
   * Search media by content
   */
  static async searchMedia(userId: string, query: string): Promise<MediaItem[]> {
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching media:', error);
      throw error;
    }
  }

  /**
   * Get media by category
   */
  static async getMediaByCategory(userId: string, category: string): Promise<MediaItem[]> {
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching media by category:', error);
      throw error;
    }
  }

  /**
   * Update media item
   */
  static async updateMediaItem(id: string, updates: Partial<MediaItem>): Promise<MediaItem> {
    try {
      const { data, error } = await supabase
        .from('media_library')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
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
   * Delete media item
   */
  static async deleteMediaItem(id: string): Promise<void> {
    try {
      // Get the media item to delete the file
      const { data: mediaItem } = await supabase
        .from('media_library')
        .select('image_url')
        .eq('id', id)
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
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting media item:', error);
      throw error;
    }
  }

  /**
   * Get categories
   */
  static async getCategories(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('category')
        .eq('user_id', userId);

      if (error) throw error;
      
      const categories = [...new Set(data?.map((item: { category: any; }) => item.category) || [])];
      return categories.sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get popular tags
   */
  static async getPopularTags(userId: string, limit: number = 20): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('tags')
        .eq('user_id', userId);

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
      console.error('Error fetching popular tags:', error);
      return [];
    }
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
      const uploadedImage = await ImageUploadService.uploadImage(imageFile, userId);
      
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
      
      // Save to media library table
      const { data, error } = await supabase
        .from('media_library')
        .insert({
          user_id: userId,
          description,
          tags: combinedTags,
          category: aiResult.category,
          location: aiResult.location,
          image_url: uploadedImage.url,
          thumbnail_url: uploadedImage.url,
          file_size: imageFile.size,
          file_type: imageFile.type,
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