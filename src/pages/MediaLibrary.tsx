import React, { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { useAuth } from '../lib/AuthProvider';
import { MediaLibraryService, MediaItem } from '../lib/mediaLibrary';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Loader2, Upload, Search, Edit, Trash2, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { TierRestriction } from '../components/TierRestriction';
import UnsplashSearch from '../components/UnsplashSearch';

export default function MediaLibrary() {
  const { user } = useAuth();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [regeneratingTags, setRegeneratingTags] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
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

  const handleImageAdded = () => {
    loadMediaLibrary();
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

  const handleUpdateItem = async (updates: Partial<MediaItem>) => {
    if (!editingItem) return;
    
    try {
      const updatedItem = await MediaLibraryService.updateMediaItem(editingItem.id, updates);
      setMediaItems(prev => 
        prev.map(item => 
          item.id === editingItem.id ? updatedItem : item
        )
      );
      setEditingItem(null);
      toast.success('Media item updated successfully');
    } catch (error) {
      console.error('Error updating media item:', error);
      toast.error('Failed to update media item');
    }
  };

  const handleDeleteItem = async (mediaItemId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await MediaLibraryService.deleteMediaItem(mediaItemId);
      setMediaItems(prev => prev.filter(item => item.id !== mediaItemId));
      toast.success('Media item deleted successfully');
    } catch (error) {
      console.error('Error deleting media item:', error);
      toast.error('Failed to delete media item');
    }
  };

  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <TierRestriction type="media_library">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-muted-foreground">
              Your personal image collection with AI-powered tagging.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowUnsplashSearch(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Unsplash Search
            </Button>
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <Button disabled={uploading} className="flex items-center gap-2">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload Images'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search descriptions or tags..."
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
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex w-auto -ml-4"
            columnClassName="pl-4 bg-clip-padding"
          >
            {filteredItems.map((item) => (
              <div key={item.id} className="group relative mb-4 break-inside-avoid rounded-lg overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.description}
                  className="w-full h-auto block"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="p-4 h-full flex flex-col justify-between">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="secondary" onClick={() => setSelectedItem(item)} className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="secondary" onClick={() => setEditingItem(item)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="destructive" onClick={() => handleDeleteItem(item.id)} className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
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
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-white/70 capitalize">{item.category}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerateTags(item.id);
                          }}
                          disabled={regeneratingTags === item.id}
                          className="h-6 w-6 p-0"
                        >
                          {regeneratingTags === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Masonry>
        )}

        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>View Image</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.description}
                  className="w-full rounded-lg"
                />
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedItem.description}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedItem.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      {selectedItem.category}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedItem.location || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Media Details</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const tags = (formData.get('tags') as string)
                  .split(',')
                  .map(tag => tag.trim())
                  .filter(Boolean);

                handleUpdateItem({
                  description: formData.get('description') as string,
                  tags,
                  category: formData.get('category') as string,
                  location: formData.get('location') as string || undefined,
                });
              }} className="space-y-4">
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingItem.description}
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Textarea
                    id="tags"
                    name="tags"
                    defaultValue={editingItem.tags.join(', ')}
                    placeholder="Enter tags separated by commas"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingItem.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                      <SelectItem value="cityscape">Cityscape</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="beach">Beach</SelectItem>
                      <SelectItem value="mountain">Mountain</SelectItem>
                      <SelectItem value="urban">Urban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={editingItem.location || ''}
                    placeholder="e.g., Paris, France"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Save Changes</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <UnsplashSearch 
          open={showUnsplashSearch} 
          onOpenChange={setShowUnsplashSearch}
          onImageAdded={handleImageAdded}
        />
      </div>
    </TierRestriction>
  );
}