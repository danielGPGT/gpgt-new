import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Trophy, 
  Calendar, 
  MapPin,
  Settings,
  Euro
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { PackageManagerService } from '@/lib/packageManagerService';
import type { Package as PackageType, PackageTier, PackageComponent } from '@/lib/packageManagerService';
import { PackageTierForm } from './PackageTierForm';
import { PackageComponentForm } from './PackageComponentForm';
import { PackageForm } from './PackageForm';

interface PackageDetailsProps {
  event: any;
  packages: PackageType[];
  onClose: () => void;
}

export function PackageDetails({ event, packages, onClose }: PackageDetailsProps) {
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [isTierFormOpen, setIsTierFormOpen] = useState(false);
  const [isComponentFormOpen, setIsComponentFormOpen] = useState(false);
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PackageTier | null>(null);
  const [editingComponent, setEditingComponent] = useState<PackageComponent | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'package' | 'tier' | 'component';
    item: any;
    open: boolean;
  }>({ type: 'package', item: null, open: false });

  const deletePackageMutation = useMutation({
    mutationFn: (id: string) => PackageManagerService.deletePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete package: ${error.message}`);
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: (id: string) => PackageManagerService.deletePackageTier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package tier deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete package tier: ${error.message}`);
    },
  });

  const deleteComponentMutation = useMutation({
    mutationFn: (id: string) => PackageManagerService.deletePackageComponent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package component deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete package component: ${error.message}`);
    },
  });

  const handleDelete = () => {
    const { type, item } = deleteDialog;
    
    switch (type) {
      case 'package':
        deletePackageMutation.mutate(item.id);
        break;
      case 'tier':
        deleteTierMutation.mutate(item.id);
        break;
      case 'component':
        deleteComponentMutation.mutate(item.id);
        break;
    }
    
    setDeleteDialog({ type: 'package', item: null, open: false });
  };

  const getComponentTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      ticket: '🎫',
      hotel_room: '🏨',
      circuit_transfer: '🚌',
      airport_transfer: '🚗',
      flight: '✈️',
      lounge_pass: '🍸',
    };
    return icons[type] || '📦';
  };

  const getComponentDisplayName = (component: PackageComponent) => {
    // This would need to be enhanced with actual component data
    return `${component.component_type.replace('_', ' ')} - ${component.component_id.slice(0, 8)}`;
  };

  const calculateTierPrice = (tier: PackageTier) => {
    if (tier.price_override) {
      return tier.price_override;
    }
    
    // Calculate from components
    const componentTotal = tier.components?.reduce((total, comp) => {
      return total + (comp.price_override || 0);
    }, 0) || 0;
    
    return componentTotal;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{event.name}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                <span>{event.sport?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{event.venue?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{event.start_date}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsPackageFormOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {packages.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No packages yet</h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Create your first package for this event.
            </p>
            <Button onClick={() => setIsPackageFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </div>
        ) : (
          <Tabs defaultValue={packages[0]?.id} className="h-full">
            <div className="border-b border-[var(--border)] px-4">
              <TabsList className="grid w-full grid-cols-auto">
                {packages.map((pkg) => (
                  <TabsTrigger key={pkg.id} value={pkg.id} className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {pkg.name}
                    <Badge variant="secondary">{pkg.tiers?.length || 0} tiers</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {packages.map((pkg) => (
              <TabsContent key={pkg.id} value={pkg.id} className="p-4 space-y-6">
                {/* Package Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{pkg.name}</h3>
                    <p className="text-muted-foreground">{pkg.description}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Package Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Package
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setDeleteDialog({ type: 'package', item: pkg, open: true })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Package
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Tiers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium">Package Tiers</h4>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setEditingTier(null);
                        setIsTierFormOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tier
                    </Button>
                  </div>

                  {pkg.tiers?.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Trophy className="h-8 w-8 text-[var(--muted-foreground)] mx-auto mb-2" />
                        <p className="text-[var(--muted-foreground)]">No tiers created yet</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            setEditingTier(null);
                            setIsTierFormOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Tier
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {pkg.tiers?.map((tier) => (
                        <Card key={tier.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <div>
                                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                                  {tier.short_label && (
                                    <Badge variant="outline">{tier.short_label}</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="text-lg font-semibold">
                                    €{calculateTierPrice(tier).toFixed(2)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {tier.components?.length || 0} components
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Tier Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingTier(tier);
                                        setIsTierFormOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Tier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingComponent(null);
                                        setIsComponentFormOpen(true);
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Component
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => setDeleteDialog({ type: 'tier', item: tier, open: true })}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Tier
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            {tier.description && (
                              <p className="text-sm text-muted-foreground">{tier.description}</p>
                            )}
                          </CardHeader>
                          <CardContent>
                            {tier.components?.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground">
                                No components added yet
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {tier.components?.map((component) => (
                                  <div 
                                    key={component.id} 
                                    className="flex items-center justify-between p-2 bg-[var(--muted)] rounded"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{getComponentTypeIcon(component.component_type)}</span>
                                      <span className="text-sm">
                                        {getComponentDisplayName(component)}
                                      </span>
                                      {component.quantity > 1 && (
                                        <Badge variant="secondary">x{component.quantity}</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {component.price_override && (
                                        <div className="text-sm font-medium">
                                          €{component.price_override.toFixed(2)}
                                        </div>
                                      )}
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <Settings className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setEditingComponent(component);
                                              setIsComponentFormOpen(true);
                                            }}
                                          >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Component
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-red-600"
                                            onClick={() => setDeleteDialog({ type: 'component', item: component, open: true })}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove Component
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Forms */}
      <PackageForm
        open={isPackageFormOpen}
        onOpenChange={setIsPackageFormOpen}
        events={[event]}
      />

      <PackageTierForm
        open={isTierFormOpen}
        onOpenChange={setIsTierFormOpen}
        tier={editingTier}
        packageId={selectedPackage?.id}
      />

      <PackageComponentForm
        open={isComponentFormOpen}
        onOpenChange={setIsComponentFormOpen}
        component={editingComponent}
        tierId={editingTier?.id}
        eventId={event.id}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              {deleteDialog.type === 'package' && 'package and all its tiers and components'}
              {deleteDialog.type === 'tier' && 'tier and all its components'}
              {deleteDialog.type === 'component' && 'component'}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 