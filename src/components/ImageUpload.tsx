import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Loader2, Library, Crown } from 'lucide-react';
import { searchDestinationImage, searchActivityImage, type UnsplashImage } from '@/lib/unsplash';
import { ImageUploadService } from '@/lib/imageUpload';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';
import MediaLibrarySelector from './MediaLibrarySelector';
import { MediaItem } from '@/lib/mediaLibrary';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { TierManager } from '@/lib/tierManager';

// Helper function to detect blob URLs
const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

// Helper function to check if an image URL is valid
const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  if (isBlobUrl(url)) return false; // Blob URLs are temporary and likely invalid
  return true;
};

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  destination?: string;
  activity?: string;
  className?: string;
}

// Reusable image component with error handling
interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function SafeImage({ src, alt, className, fallback }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset states when src changes
  useEffect(() => {
    console.log('🖼️ SafeImage: src changed to:', src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  if (!src) {
    console.log('🖼️ SafeImage: no src provided');
    return fallback ? <>{fallback}</> : (
      <div className="flex flex-col items-center justify-center w-full h-full text-gray-300">
        <ImageIcon className="h-10 w-10 mb-2" />
        <span className="text-xs">No Image</span>
      </div>
    );
  }

  if (hasError) {
    console.log('🖼️ SafeImage: image failed to load');
    return fallback ? <>{fallback}</> : (
      <div className="flex flex-col items-center justify-center w-full h-full text-gray-300">
        <ImageIcon className="h-10 w-10 mb-2" />
        <span className="text-xs">Image Unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => {
          console.log('🖼️ SafeImage: image loaded successfully');
          setIsLoading(false);
        }}
        onError={() => {
          console.log('🖼️ SafeImage: image failed to load, URL:', src);
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}

export function ImageUpload({ 
  currentImage, 
  onImageChange, 
  destination, 
  activity, 
  className = "" 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [hasMediaLibraryAccess, setHasMediaLibraryAccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      const tierManager = TierManager.getInstance();
      tierManager.initialize(user.id).then(() => {
        setHasMediaLibraryAccess(tierManager.hasFeature('media_library'));
      });
    }
  }, [user?.id]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!user) {
      toast.error('Please log in to upload images');
      return;
    }

    setIsUploading(true);
    try {
      console.log('🖼️ Starting image upload for file:', file.name, 'Size:', file.size);
      
      // Upload to Supabase Storage
      const uploadedImage = await ImageUploadService.uploadImage(file, user.id);
      
      console.log('✅ Image uploaded successfully:', uploadedImage.url);
      
      // Update the image URL with the permanent URL
      onImageChange(uploadedImage.url);
      
      // Small delay to ensure the image URL is properly set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(errorMessage);
      
      // If it's a bucket not found error, show setup instructions
      if (errorMessage.includes('bucket not found')) {
        toast.error('Please set up the storage bucket first. Check IMAGE_UPLOAD_SETUP.md for instructions.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const loadStockImage = async () => {
    if (!destination) return;
    
    setIsLoadingStock(true);
    try {
      const searchQuery = activity ? `${activity} ${destination}` : destination;
      const image = await searchActivityImage(searchQuery, destination);
      if (image) {
        onImageChange(image.urls.regular);
        toast.success('Stock image loaded!');
      }
    } catch (error) {
      console.error('Error loading stock image:', error);
      toast.error('Failed to load stock image');
    } finally {
      setIsLoadingStock(false);
    }
  };

  const removeImage = () => {
    onImageChange('');
    toast.success('Image removed');
  };

  const handleMediaLibrarySelect = (mediaItem: MediaItem) => {
    onImageChange(mediaItem.image_url);
    setShowMediaLibrary(false);
    toast.success('Image selected from media library');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {currentImage ? (
        <div className="relative group">
          <SafeImage
            src={currentImage}
            alt="Itinerary"
            className="w-full h-48 object-cover rounded-lg shadow-md"
            fallback={
              <div className="w-full h-48 bg-gray-100 rounded-lg shadow-md flex flex-col items-center justify-center">
                <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Image Unavailable</span>
              </div>
            }
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={removeImage}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">
            Drag and drop an image here, or click to select
          </p>
          <p className="text-sm text-gray-500">
            Supports JPG, PNG, WebP, GIF up to 10MB
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMediaLibrary(true)}
          className="flex-1 relative"
        >
          <Library className="h-4 w-4 mr-2" />
          Media Library
          <Crown className={`h-3 w-3 absolute -top-1 -right-1 ${hasMediaLibraryAccess ? 'text-yellow-500' : 'text-muted-foreground'}`} />
        </Button>
        
        {destination && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadStockImage}
            disabled={isLoadingStock}
            className="flex-1"
          >
            {isLoadingStock ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                Stock Photo
              </>
            )}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className="hidden"
      />

      {/* Media Library Dialog */}
      <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[1400px] h-[900px] overflow-hidden flex flex-col !max-w-none sm:!max-w-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" />
              Select from Media Library
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <MediaLibrarySelector
              onSelect={handleMediaLibrarySelect}
              multiple={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 