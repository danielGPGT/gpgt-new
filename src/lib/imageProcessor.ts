import imageCompression from 'browser-image-compression';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  convertToWebP?: boolean;
  maxFileSize?: number; // in bytes
}

export interface ProcessedImage {
  file: File;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  format: string;
}

export class ImageProcessor {
  private static DEFAULT_OPTIONS: ImageProcessingOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    convertToWebP: true,
    maxFileSize: 2 * 1024 * 1024, // 2MB
  };

  private static AGGRESSIVE_OPTIONS: ImageProcessingOptions = {
    maxWidth: 1200,
    maxHeight: 800,
    quality: 0.6,
    convertToWebP: true,
    maxFileSize: 500 * 1024, // 500KB
  };

  private static ULTRA_OPTIONS: ImageProcessingOptions = {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.4,
    convertToWebP: true,
    maxFileSize: 200 * 1024, // 200KB
  };

  /**
   * Process an image file with compression and optional WebP conversion
   */
  static async processImage(
    file: File, 
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const originalSize = file.size;

    try {
      // Multi-pass compression for maximum efficiency
      let currentFile = file;
      let compressionPasses = 0;
      const maxPasses = 3;

      while (compressionPasses < maxPasses) {
        compressionPasses++;
        
        // Determine compression settings based on current file size
        const currentSizeMB = currentFile.size / (1024 * 1024);
        let compressionOptions;
        
        if (currentSizeMB > 3) {
          // Very large files: ultra aggressive
          compressionOptions = this.ULTRA_OPTIONS;
        } else if (currentSizeMB > 1) {
          // Large files: aggressive
          compressionOptions = this.AGGRESSIVE_OPTIONS;
        } else {
          // Smaller files: standard
          compressionOptions = opts;
        }

        // Apply compression
        const compressedFile = await imageCompression(currentFile, {
          maxWidthOrHeight: Math.max(compressionOptions.maxWidth || 1920, compressionOptions.maxHeight || 1080),
          useWebWorker: true,
          fileType: compressionOptions.convertToWebP ? 'image/webp' : file.type,
          quality: compressionOptions.quality || 0.8,
        });

        // Check if we've reached target size or diminishing returns
        const sizeReduction = (currentFile.size - compressedFile.size) / currentFile.size;
        
        if (compressedFile.size >= currentFile.size || sizeReduction < 0.05) {
          // No more significant improvement, stop
          currentFile = compressedFile;
          break;
        }

        currentFile = compressedFile;

        // If we've reached target size, stop
        if (compressionOptions.maxFileSize && compressedFile.size <= compressionOptions.maxFileSize) {
          break;
        }
      }

      // Generate a new filename with appropriate extension
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      const extension = opts.convertToWebP ? 'webp' : file.name.split('.').pop();
      const newFileName = `${fileName}.${extension}`;

      // Create a new File object with the processed data
      const processedFile = new File([currentFile], newFileName, {
        type: opts.convertToWebP ? 'image/webp' : file.type,
        lastModified: Date.now(),
      });

      const processedSize = processedFile.size;
      const compressionRatio = ((originalSize - processedSize) / originalSize) * 100;

      console.log(`Image processed in ${compressionPasses} passes: ${originalSize} → ${processedSize} bytes (${compressionRatio.toFixed(1)}% reduction)`);

      return {
        file: processedFile,
        originalSize,
        processedSize,
        compressionRatio,
        format: opts.convertToWebP ? 'webp' : file.type.split('/')[1],
      };
    } catch (error) {
      console.error('Error processing image:', error);
      // Return original file if processing fails
      return {
        file,
        originalSize,
        processedSize: originalSize,
        compressionRatio: 0,
        format: file.type.split('/')[1],
      };
    }
  }

  /**
   * Process multiple images
   */
  static async processImages(
    files: File[], 
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    
    for (const file of files) {
      try {
        const result = await this.processImage(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        // Add original file if processing fails
        results.push({
          file,
          originalSize: file.size,
          processedSize: file.size,
          compressionRatio: 0,
          format: file.type.split('/')[1],
        });
      }
    }
    
    return results;
  }

  /**
   * Ultra-compress an image for maximum size reduction
   */
  static async ultraCompressImage(file: File): Promise<ProcessedImage> {
    return this.processImage(file, {
      maxWidth: 600,
      maxHeight: 400,
      quality: 0.3,
      convertToWebP: true,
      maxFileSize: 100 * 1024, // 100KB target
    });
  }

  /**
   * Get compression statistics for a file
   */
  static async getCompressionStats(file: File): Promise<{
    originalSize: string;
    estimatedCompressedSize: string;
    estimatedReduction: string;
    recommendedQuality: number;
  }> {
    const originalSize = this.formatFileSize(file.size);
    const sizeMB = file.size / (1024 * 1024);
    
    let estimatedCompressedSize: string;
    let estimatedReduction: string;
    let recommendedQuality: number;
    
    if (sizeMB > 8) {
      estimatedCompressedSize = this.formatFileSize(file.size * 0.05); // 95% reduction
      estimatedReduction = '95%';
      recommendedQuality = 0.3;
    } else if (sizeMB > 5) {
      estimatedCompressedSize = this.formatFileSize(file.size * 0.1); // 90% reduction
      estimatedReduction = '90%';
      recommendedQuality = 0.4;
    } else if (sizeMB > 2) {
      estimatedCompressedSize = this.formatFileSize(file.size * 0.15); // 85% reduction
      estimatedReduction = '85%';
      recommendedQuality = 0.5;
    } else if (sizeMB > 1) {
      estimatedCompressedSize = this.formatFileSize(file.size * 0.25); // 75% reduction
      estimatedReduction = '75%';
      recommendedQuality = 0.6;
    } else {
      estimatedCompressedSize = this.formatFileSize(file.size * 0.4); // 60% reduction
      estimatedReduction = '60%';
      recommendedQuality = 0.7;
    }
    
    return {
      originalSize,
      estimatedCompressedSize,
      estimatedReduction,
      recommendedQuality,
    };
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if file is an image
   */
  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Get recommended processing options based on file size
   */
  static getRecommendedOptions(file: File): ImageProcessingOptions {
    const sizeMB = file.size / (1024 * 1024);
    
    if (sizeMB > 8) {
      // Very large files: ultra aggressive compression
      return {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.4,
        convertToWebP: true,
        maxFileSize: 200 * 1024, // 200KB
      };
    } else if (sizeMB > 5) {
      // Large files: aggressive compression
      return {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.6,
        convertToWebP: true,
        maxFileSize: 500 * 1024, // 500KB
      };
    } else if (sizeMB > 2) {
      // Medium files: moderate compression
      return {
        maxWidth: 1600,
        maxHeight: 900,
        quality: 0.7,
        convertToWebP: true,
        maxFileSize: 1 * 1024 * 1024, // 1MB
      };
    } else if (sizeMB > 1) {
      // Small-medium files: light compression
      return {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.75,
        convertToWebP: true,
        maxFileSize: 1.5 * 1024 * 1024, // 1.5MB
      };
    } else {
      // Very small files: minimal compression
      return {
        maxWidth: 2048,
        maxHeight: 1152,
        quality: 0.8,
        convertToWebP: true,
        maxFileSize: 2 * 1024 * 1024, // 2MB
      };
    }
  }
} 