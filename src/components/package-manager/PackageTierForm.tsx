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

import { PackageManagerService } from '@/lib/packageManagerService';
import type { PackageTier, PackageTierInsert, PackageTierUpdate } from '@/lib/packageManagerService';

interface PackageTierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier?: PackageTier;
  packageId?: string;
}

export function PackageTierForm({ open, onOpenChange, tier, packageId }: PackageTierFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<PackageTierInsert>({
    name: tier?.name || '',
    short_label: tier?.short_label || '',
    description: tier?.description || '',
    display_order: tier?.display_order || 0,
    price_override: tier?.price_override || undefined,
    package_id: tier?.package_id || packageId || '',
  });

  const createTierMutation = useMutation({
    mutationFn: (data: PackageTierInsert) => PackageManagerService.createPackageTier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      onOpenChange(false);
      toast.success('Package tier created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create package tier: ${error.message}`);
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PackageTierUpdate }) =>
      PackageManagerService.updatePackageTier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      onOpenChange(false);
      toast.success('Package tier updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update package tier: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tier) {
      updateTierMutation.mutate({ id: tier.id, data: formData });
    } else {
      createTierMutation.mutate(formData);
    }
  };

  const isLoading = createTierMutation.isPending || updateTierMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tier ? 'Edit Package Tier' : 'Add New Package Tier'}</DialogTitle>
          <DialogDescription>
            {tier ? 'Update tier information' : 'Create a new tier for this package (e.g., Bronze, Silver, Gold)'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Bronze, Silver, Gold"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_label">Short Label</Label>
              <Input
                id="short_label"
                value={formData.short_label}
                onChange={(e) => setFormData(prev => ({ ...prev, short_label: e.target.value }))}
                placeholder="e.g., BRZ, SIL, GLD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_override">Price Override (EUR)</Label>
              <Input
                id="price_override"
                type="number"
                step="0.01"
                value={formData.price_override || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  price_override: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what's included in this tier..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : tier ? 'Update Tier' : 'Create Tier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 