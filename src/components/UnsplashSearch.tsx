import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Loader2, Search, Download, Sparkles } from 'lucide-react';
import { searchUnsplashImages, type UnsplashImage } from '../lib/unsplash';
import { MediaLibraryService } from '../lib/mediaLibrary';
import { useAuth } from '../lib/AuthProvider';
import { toast } from 'sonner';

interface UnsplashSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageAdded?: () => void;
}

export default function UnsplashSearch({ open, onOpenChange, onImageAdded }: UnsplashSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results = await searchUnsplashImages(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      toast.error('Failed to search Unsplash images');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (image: UnsplashImage) => {
    if (!user) return;
    
    setUploading(image.id);
    try {
      const toastId = toast.loading('Adding image to media library...');
      
      await MediaLibraryService.uploadUnsplashImage(image, user.id, searchQuery);
      
      toast.success('Image added to media library!', { id: toastId });
      onImageAdded?.();
    } catch (error) {
      console.error('Error uploading Unsplash image:', error);
      toast.error('Failed to add image to media library');
    } finally {
      setUploading(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[1400px] !h-[90vh] overflow-hidden flex flex-col p-0 sm:!max-w-[1400px]">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6" viewBox="0 0 32 32" fill="currentColor">
                <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v2h12v-2z"/>
              </svg>
              <span>Search Unsplash Images</span>
            </div>
            <Badge variant="outline" className="ml-auto">
              Powered by Unsplash
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="flex gap-2 p-6 pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for images (e.g., 'luxury hotel', 'beach sunset', 'mountain landscape')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()} className="h-12 px-6">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-6">
            {searchResults.length === 0 && !loading ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <svg className="h-12 w-12 text-muted-foreground" viewBox="0 0 32 32" fill="currentColor">
                    <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v2h12v-2z"/>
                  </svg>
                  <Sparkles className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Search for images</h3>
                <p className="text-muted-foreground">
                  Enter a search term to find beautiful images from Unsplash
                </p>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {searchResults.map((image) => (
                  <div key={image.id} className="group relative rounded-lg overflow-hidden border hover:shadow-lg transition-all duration-200 break-inside-avoid">
                    <img
                      src={image.urls.small}
                      alt={image.alt_description}
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="p-4 h-full flex flex-col justify-between">
                        <div className="text-white">
                          <p className="text-sm font-semibold line-clamp-2">
                            {image.alt_description}
                          </p>
                          <p className="text-xs text-white/70 mt-1">
                            by {image.user.name}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUploadImage(image)}
                          disabled={uploading === image.id}
                          className="w-full"
                        >
                          {uploading === image.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          Add to Library
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                {searchResults.length > 0 && (
                  <span>{searchResults.length} images found</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>Powered by</span>
                <svg className="h-4 w-4" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v2h12v-2z"/>
                </svg>
                <span className="font-semibold">Unsplash</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 