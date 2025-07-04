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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

import { PackageManagerService } from '@/lib/packageManagerService';
import type { Package as PackageType, PackageInsert, PackageUpdate, Event } from '@/lib/packageManagerService';

interface PackageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package?: PackageType;
  events: Event[];
  existingPackages?: PackageType[];
}

// Helper function to create slug from string
function createSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function PackageForm({ open, onOpenChange, package: packageData, events, existingPackages }: PackageFormProps) {
  const queryClient = useQueryClient();
  const event = events[0]; // We're always in the context of a specific event
  
  const [formData, setFormData] = useState<PackageInsert>({
    name: packageData?.name || '',
    slug: packageData?.slug || '',
    description: packageData?.description || '',
    base_type: packageData?.base_type || '',
    event_id: event?.id || '',
    active: packageData?.active ?? true,
  });

  // Check if a package of the selected type already exists
  const existingPackageOfType = existingPackages?.find(pkg => 
    pkg.base_type === formData.base_type && pkg.id !== packageData?.id
  );

  // Get available package types (types that don't have packages yet)
  const availableTypes = ['Grandstand', 'VIP'].filter(type => 
    !existingPackages?.some(pkg => pkg.base_type === type)
  );

  // Auto-generate name and slug when base_type changes (for new packages)
  useEffect(() => {
    if (!packageData && formData.base_type && event) {
      const generatedName = `${event.name} ${formData.base_type} Package`;
      const generatedSlug = createSlug(generatedName);
      
      setFormData(prev => ({
        ...prev,
        name: generatedName,
        slug: generatedSlug,
      }));
    }
  }, [formData.base_type, event, packageData]);

  // Auto-generate slug when name changes (for existing packages)
  useEffect(() => {
    if (packageData && formData.name) {
      const generatedSlug = createSlug(formData.name);
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug,
      }));
    }
  }, [formData.name, packageData]);

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
    
    if (existingPackageOfType && !packageData) {
      toast.error(`A ${formData.base_type} package already exists for this event`);
      return;
    }
    
    if (packageData) {
      updatePackageMutation.mutate({ id: packageData.id, data: formData });
    } else {
      createPackageMutation.mutate(formData);
    }
  };

  const isLoading = createPackageMutation.isPending || updatePackageMutation.isPending;

  // If no package types are available, show message
  if (!packageData && availableTypes.length === 0) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="right">
        <DrawerContent className="!max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>No Available Package Types</DrawerTitle>
            <DrawerDescription>
              Both Grandstand and VIP packages have already been created for this event.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can only create one Grandstand and one VIP package per event. 
                Both packages have already been created for "{event?.name}".
              </AlertDescription>
            </Alert>
          </div>
          <DrawerFooter>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!max-w-2xl">
        <DrawerHeader>
          <DrawerTitle>{packageData ? 'Edit Package' : 'Add New Package'}</DrawerTitle>
          <DrawerDescription>
            {packageData ? 'Update package information' : 'Create a new travel package'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 py-3">
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
                  placeholder="Auto-generated from name"
                  readOnly={!packageData} // Read-only for new packages
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_type">Base Type *</Label>
                <Select
                  value={formData.base_type || ''}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    base_type: value 
                  }))}
                  disabled={!!packageData} // Disabled for existing packages
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select base type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {existingPackageOfType && !packageData && (
              <Alert className="border-orange-200 bg-orange-50">
                <Info className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  A {formData.base_type} package already exists for this event. 
                  You can only create one package of each type per event.
                </AlertDescription>
              </Alert>
            )}

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
          </form>
        </div>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || (existingPackageOfType && !packageData)}
            onClick={handleSubmit}
          >
            {isLoading ? 'Saving...' : packageData ? 'Update Package' : 'Create Package'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 