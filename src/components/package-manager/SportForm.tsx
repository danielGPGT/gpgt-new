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

import { PackageManagerService } from '@/lib/packageManagerService';
import type { Sport, SportInsert, SportUpdate } from '@/lib/packageManagerService';

interface SportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sport?: Sport;
}

export function SportForm({ open, onOpenChange, sport }: SportFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SportInsert>({
    name: sport?.name || '',
  });

  const createSportMutation = useMutation({
    mutationFn: (data: SportInsert) => PackageManagerService.createSport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      onOpenChange(false);
      toast.success('Sport created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create sport: ${error.message}`);
    },
  });

  const updateSportMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SportUpdate }) =>
      PackageManagerService.updateSport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sports'] });
      onOpenChange(false);
      toast.success('Sport updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update sport: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sport) {
      updateSportMutation.mutate({ id: sport.id, data: formData });
    } else {
      createSportMutation.mutate(formData);
    }
  };

  const isLoading = createSportMutation.isPending || updateSportMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sport ? 'Edit Sport' : 'Add New Sport'}</DialogTitle>
          <DialogDescription>
            {sport ? 'Update sport information' : 'Create a new sport for events'}
          </DialogDescription>
        </DialogHeader>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : sport ? 'Update Sport' : 'Create Sport'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 