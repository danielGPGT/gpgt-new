import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import { PackageManagerService } from '@/lib/packageManagerService';
import { InventoryService } from '@/lib/inventoryService';
import type { Venue, VenueInsert, VenueUpdate } from '@/lib/packageManagerService';
import MediaLibrarySelector from '../MediaLibrarySelector';
import type { MediaItem } from '@/lib/mediaLibrary';

interface VenueFormProps {
  // For standalone drawer mode
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  venue?: Venue;
  
  // For embedded form mode
  onSubmit?: (data: VenueInsert | VenueUpdate) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  
  // Service to use (defaults to PackageManagerService)
  service?: 'packageManager' | 'inventory';
  
  // Additional options
  showDeleteButton?: boolean;
}

export function VenueForm({ 
  open, 
  onOpenChange, 
  venue, 
  onSubmit, 
  onCancel, 
  isLoading: externalLoading,
  service = 'packageManager',
  showDeleteButton = false
}: VenueFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<VenueInsert>({
    name: venue?.name || '',
    slug: venue?.slug || '',
    country: venue?.country || '',
    city: venue?.city || '',
    timezone: venue?.timezone || '',
    latitude: venue?.latitude || undefined,
    longitude: venue?.longitude || undefined,
    description: venue?.description || '',
    map_url: venue?.map_url || '',
    website: venue?.website || '',
    images: venue?.images || [],
  });
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Determine if we're in standalone mode (with drawer) or embedded mode
  const isStandalone = open !== undefined && onOpenChange !== undefined;

  // Use the appropriate service
  const serviceInstance = service === 'inventory' ? InventoryService : PackageManagerService;

  // Reset form when venue changes
  useEffect(() => {
    setFormData({
      name: venue?.name || '',
      slug: venue?.slug || '',
      country: venue?.country || '',
      city: venue?.city || '',
      timezone: venue?.timezone || '',
      latitude: venue?.latitude || undefined,
      longitude: venue?.longitude || undefined,
      description: venue?.description || '',
      map_url: venue?.map_url || '',
      website: venue?.website || '',
      images: venue?.images || [],
    });
    setSlugManuallyEdited(false);
  }, [venue]);

  const createVenueMutation = useMutation({
    mutationFn: (data: VenueInsert) => serviceInstance.createVenue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      if (isStandalone) {
        onOpenChange!(false);
      }
      toast.success('Venue created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create venue: ${error.message}`);
    },
  });

  const updateVenueMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VenueUpdate }) =>
      serviceInstance.updateVenue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      if (isStandalone) {
        onOpenChange!(false);
      }
      toast.success('Venue updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update venue: ${error.message}`);
    },
  });

  const deleteVenueMutation = useMutation({
    mutationFn: (id: string) => serviceInstance.deleteVenue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      if (isStandalone) {
        onOpenChange!(false);
      }
      toast.success('Venue deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete venue: ${error.message}`);
    },
  });

  const handleDelete = async () => {
    if (!venue) return;
    if (!window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await deleteVenueMutation.mutateAsync(venue.id);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Always send images as array of objects (id, image_url, thumbnail_url, description)
    const images = (formData.images || []).map((img: any) => ({
      id: img.id,
      image_url: img.image_url,
      thumbnail_url: img.thumbnail_url,
      description: img.description,
    }));
    const payload = { ...formData, images };
    
    if (isStandalone) {
      // Standalone mode - use internal mutations
      if (venue) {
        updateVenueMutation.mutate({ id: venue.id, data: payload });
      } else {
        createVenueMutation.mutate(payload);
      }
    } else {
      // Embedded mode - call external onSubmit
      onSubmit?.(payload);
    }
  };

  const isLoading = externalLoading || createVenueMutation.isPending || updateVenueMutation.isPending;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Venue Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData(prev => {
                let slug = prev.slug;
                if (!slugManuallyEdited) {
                  slug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '');
                }
                return { ...prev, name, slug };
              });
            }}
            placeholder="e.g., Circuit de Monaco"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setFormData(prev => ({ ...prev, slug: e.target.value }));
            }}
            placeholder="e.g., circuit-de-monaco"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            placeholder="e.g., Monaco"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="e.g., Monte Carlo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={formData.timezone}
            onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
            placeholder="e.g., Europe/Monaco"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={formData.latitude || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              latitude: e.target.value ? parseFloat(e.target.value) : undefined 
            }))}
            placeholder="e.g., 43.7384"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={formData.longitude || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              longitude: e.target.value ? parseFloat(e.target.value) : undefined 
            }))}
            placeholder="e.g., 7.4246"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="e.g., https://www.monaco-grand-prix.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="map_url">Map URL</Label>
        <Input
          id="map_url"
          type="url"
          value={formData.map_url}
          onChange={(e) => setFormData(prev => ({ ...prev, map_url: e.target.value }))}
          placeholder="e.g., https://maps.google.com/..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the venue..."
          rows={3}
        />
      </div>

      {/* Images Section */}
      <div className="space-y-2">
        <Label>Venue Images</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(formData.images || []).length > 0 ? (
            (formData.images as MediaItem[]).map((img) => (
              <div key={img.id} className="relative group w-24 h-24 border rounded overflow-hidden">
                <img src={img.thumbnail_url || img.image_url} alt={img.description || ''} className="object-cover w-full h-full" />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    images: (prev.images || []).filter((i: any) => i.id !== img.id) 
                  }))}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No images selected</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowImageSelector(true)}
        >
          {(formData.images || []).length > 0 ? 'Edit Images' : 'Select Images'}
        </Button>
        <Dialog open={showImageSelector} onOpenChange={setShowImageSelector}>
          <DialogContent className="!max-w-6xl">
            <DialogHeader>
              <DialogTitle>Select Venue Images</DialogTitle>
            </DialogHeader>
            <MediaLibrarySelector
              selectedItems={formData.images || []}
              onSelect={(item) => {
                setFormData(prev => {
                  const currentImages = prev.images || [];
                  const exists = currentImages.find((img: any) => img.id === item.id);
                  if (exists) {
                    return { 
                      ...prev, 
                      images: currentImages.filter((img: any) => img.id !== item.id) 
                    };
                  } else {
                    return { 
                      ...prev, 
                      images: [...currentImages, item] 
                    };
                  }
                });
              }}
              multiple={true}
            />
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setShowImageSelector(false)}
              >
                Confirm Selection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!isStandalone && (
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {showDeleteButton && venue && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : venue ? 'Update Venue' : 'Create Venue'}
          </Button>
        </div>
      )}
    </form>
  );

  // If in standalone mode, wrap in drawer
  if (isStandalone) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{venue ? 'Edit Venue' : 'Add New Venue'}</DrawerTitle>
            <DrawerDescription>
              {venue ? 'Update venue information' : 'Create a new venue for events'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {formContent}
          </div>
          <DrawerFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {showDeleteButton && venue && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? 'Saving...' : venue ? 'Update Venue' : 'Create Venue'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Embedded mode - return just the form content
  return formContent;
} 