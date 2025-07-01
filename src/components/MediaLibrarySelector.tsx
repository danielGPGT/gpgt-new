import React, { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { useAuth } from '../lib/AuthProvider';
import { MediaLibraryService, MediaItem } from '../lib/mediaLibrary';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Upload, Search, Image as ImageIcon, Sparkles, RefreshCw, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { TierRestriction } from './TierRestriction';
import UnsplashSearch from './UnsplashSearch';

interface MediaLibrarySelectorProps {
  onSelect: (mediaItem: MediaItem) => void;
  selectedItems?: MediaItem[];
  multiple?: boolean;
  maxItems?: number;
}

export default function MediaLibrarySelector({
  onSelect,
  selectedItems = [],
  multiple = false,
  maxItems
}: MediaLibrarySelectorProps) {
  const { user } = useAuth();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [regeneratingTags, setRegeneratingTags] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showUnsplashSearch, setShowUnsplashSearch] = useState(false);

  useEffect(() => {
    if (user) {
      loadMediaLibrary();
    }
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [mediaItems, searchTerm, selectedCategory]);

  const loadMediaLibrary = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const items = await MediaLibraryService.getUserMedia(user.id);
      setMediaItems(items);
      
      const cats = await MediaLibraryService.getCategories(user.id);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading media library:', error);
      toast.error('Failed to load media library');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = mediaItems;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    try {
      setUploading(true);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const toastId = toast.loading(`Uploading ${file.name} and generating AI tags...`);
        
        try {
          const mediaItem = await MediaLibraryService.uploadImageWithAITagging(file, user.id);
          setMediaItems(prev => [mediaItem, ...prev]);
          toast.success(`Successfully uploaded ${file.name}`, { id: toastId });
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`, { id: toastId });
        }
      }
      
      const cats = await MediaLibraryService.getCategories(user.id);
      setCategories(cats);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleRegenerateTags = async (mediaItemId: string) => {
    try {
      setRegeneratingTags(mediaItemId);
      const toastId = toast.loading('Regenerating AI tags...');
      
      const updatedItem = await MediaLibraryService.regenerateAITags(mediaItemId);
      
      setMediaItems(prev => 
        prev.map(item => 
          item.id === mediaItemId ? updatedItem : item
        )
      );
      
      toast.success('AI tags regenerated successfully', { id: toastId });
    } catch (error) {
      console.error('Error regenerating tags:', error);
      toast.error('Failed to regenerate AI tags');
    } finally {
      setRegeneratingTags(null);
    }
  };

  const handleSelect = (item: MediaItem) => {
    if (multiple) {
      if (maxItems && selectedItems.length >= maxItems) {
        toast.error(`Maximum ${maxItems} items allowed`);
        return;
      }
      
      const isSelected = selectedItems.some(selected => selected.id === item.id);
      if (isSelected) {
        // Remove from selection
        const updatedSelection = selectedItems.filter(selected => selected.id !== item.id);
        onSelect(updatedSelection[updatedSelection.length - 1] || item);
      } else {
        // Add to selection
        onSelect(item);
      }
    } else {
      onSelect(item);
    }
  };

  const isSelected = (item: MediaItem) => {
    return selectedItems.some(selected => selected.id === item.id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };

  const handleImageAdded = () => {
    loadMediaLibrary();
  };

  return (
    <TierRestriction type="media_library">
      <div className="flex flex-col h-full">
        {/* Upload Section */}
        <div className="flex items-center gap-4 mb-4 p-4 bg-muted rounded-lg">
          <div className="relative flex-1">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <Button disabled={uploading} className="w-full flex items-center gap-2">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? 'Uploading with AI Tagging...' : 'Upload New Images'}
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowUnsplashSearch(true)}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Unsplash
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            AI-powered tagging
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search images, tags, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
          }}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Masonry Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No images found</h3>
              <p className="text-muted-foreground">
                {mediaItems.length === 0 
                  ? "Upload your first travel image to get started with AI-powered tagging."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          ) : (
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="flex w-auto -ml-4"
              columnClassName="pl-4 bg-clip-padding"
            >
              {filteredItems.map((item) => (
                <div key={item.id} className="group relative mb-4 break-inside-avoid rounded-lg overflow-hidden cursor-pointer">
                  <img
                    src={item.image_url}
                    alt={item.description}
                    className="w-full h-auto block"
                  />
                  
                  {/* Selection indicator */}
                  {isSelected(item) && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </Badge>
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="p-4 h-full flex flex-col justify-between">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerateTags(item.id);
                          }}
                          disabled={regeneratingTags === item.id}
                          className="h-8 w-8 p-0"
                        >
                          {regeneratingTags === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="text-white">
                        <p className="text-sm font-semibold line-clamp-3">{item.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.tags.slice(0, 4).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-white/20 text-white border-none">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-white/70">
                          Click to {isSelected(item) ? 'deselect' : 'select'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Masonry>
          )}
        </div>

        {/* Selection Summary */}
        {multiple && selectedItems.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onSelect(selectedItems[0])}>
                  Clear Selection
                </Button>
                <Button size="sm">
                  Confirm Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        <UnsplashSearch 
          open={showUnsplashSearch} 
          onOpenChange={setShowUnsplashSearch}
          onImageAdded={handleImageAdded}
        />
      </div>
    </TierRestriction>
  );
} 