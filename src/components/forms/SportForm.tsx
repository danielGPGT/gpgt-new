import React, { useState } from 'react';
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

import { PackageManagerService } from '@/lib/packageManagerService';
import { InventoryService } from '@/lib/inventoryService';
import type { Sport, SportInsert, SportUpdate } from '@/lib/packageManagerService';

interface SportFormProps {
  // For standalone drawer mode
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  sport?: Sport;
  
  // For embedded form mode
  onSubmit?: (data: SportInsert) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  
  // Service to use (defaults to PackageManagerService)
  service?: 'packageManager' | 'inventory';
}

export function SportForm({ 
  open, 
  onOpenChange, 
  sport, 
  onSubmit, 
  onCancel, 
  isLoading: externalLoading,
  service = 'packageManager'
}: SportFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SportInsert>({
    name: sport?.name || '',
  });

  // Determine if we're in standalone mode (with drawer) or embedded mode
  const isStandalone = open !== undefined && onOpenChange !== undefined;

  // Use the appropriate service
  const serviceInstance = service === 'inventory' ? InventoryService : PackageManagerService;

  const createSportMutation = useMutation({
    mutationFn: (data: SportInsert) => serviceInstance.createSport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      if (isStandalone) {
        onOpenChange!(false);
      }
      toast.success('Sport created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create sport: ${error.message}`);
    },
  });

  const updateSportMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SportUpdate }) =>
      serviceInstance.updateSport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      if (isStandalone) {
        onOpenChange!(false);
      }
      toast.success('Sport updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update sport: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isStandalone) {
      // Standalone mode - use internal mutations
      if (sport) {
        updateSportMutation.mutate({ id: sport.id, data: formData });
      } else {
        createSportMutation.mutate(formData);
      }
    } else {
      // Embedded mode - call external onSubmit
      onSubmit?.(formData);
    }
  };

  const isLoading = externalLoading || createSportMutation.isPending || updateSportMutation.isPending;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Sport Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Formula 1, Tennis, Football"
          required
        />
      </div>
      {!isStandalone && (
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : sport ? 'Update Sport' : 'Create Sport'}
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
            <DrawerTitle>{sport ? 'Edit Sport' : 'Add New Sport'}</DrawerTitle>
            <DrawerDescription>
              {sport ? 'Update sport information' : 'Create a new sport for events'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {formContent}
          </div>
          <DrawerFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? 'Saving...' : sport ? 'Update Sport' : 'Create Sport'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Embedded mode - return just the form content
  return formContent;
} 