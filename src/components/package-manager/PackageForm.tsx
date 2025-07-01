import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

import { PackageManagerService } from '@/lib/packageManagerService';
import type { Package as PackageType, PackageInsert, PackageUpdate, Event } from '@/lib/packageManagerService';

interface PackageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package?: PackageType;
  events: Event[];
}

export function PackageForm({ open, onOpenChange, package: packageData, events }: PackageFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<PackageInsert>({
    name: packageData?.name || '',
    slug: packageData?.slug || '',
    description: packageData?.description || '',
    base_type: packageData?.base_type || '',
    event_id: packageData?.event_id || '',
    active: packageData?.active ?? true,
  });

  const createPackageMutation = useMutation({
    mutationFn: (data: PackageInsert) => PackageManagerService.createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      onOpenChange(false);
      toast.success('Package created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create package: ${error.message}`);
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PackageUpdate }) =>
      PackageManagerService.updatePackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      onOpenChange(false);
      toast.success('Package updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update package: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (packageData) {
      updatePackageMutation.mutate({ id: packageData.id, data: formData });
    } else {
      createPackageMutation.mutate(formData);
    }
  };

  const isLoading = createPackageMutation.isPending || updatePackageMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{packageData ? 'Edit Package' : 'Add New Package'}</DialogTitle>
          <DialogDescription>
            {packageData ? 'Update package information' : 'Create a new travel package'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Monaco Grand Prix Experience"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g., monaco-grand-prix-experience"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_id">Event *</Label>
              <Select
                value={formData.event_id || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  event_id: value === 'none' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No event</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_type">Base Type</Label>
              <Select
                value={formData.base_type || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  base_type: value === 'none' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select base type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No base type</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what's included in this package..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: !!checked }))}
            />
            <Label htmlFor="active">Active Package</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : packageData ? 'Update Package' : 'Create Package'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 