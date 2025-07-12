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
  Euro,
  Crown,
  Star,
  Zap,
  ChevronRight,
  Eye,
  Copy,
  MoreHorizontal,
  Ticket,
  Hotel,
  Bus,
  Car,
  Plane
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

import { PackageManagerService } from '@/lib/packageManagerService';
import type { Package as PackageType, PackageTier, PackageComponent } from '@/lib/packageManagerService';

import { PackageComponentForm } from './PackageComponentForm';
import { PackageForm } from './PackageForm';

interface PackageDetailsProps {
  event: any;
  packages: PackageType[];
  onClose: () => void;
}

// Tier configuration based on package type (max 3 tiers)
const TIER_CONFIG = {
  Grandstand: [
    { name: 'Bronze', shortLabel: 'B', color: 'bg-amber-500', displayOrder: 1 },
    { name: 'Silver', shortLabel: 'S', color: 'bg-gray-400', displayOrder: 2 },
    { name: 'Gold', shortLabel: 'G', color: 'bg-yellow-500', displayOrder: 3 }
  ],
  VIP: [
    { name: 'VIP', shortLabel: 'V', color: 'bg-purple-500', displayOrder: 1 },
    { name: 'Platinum', shortLabel: 'P', color: 'bg-slate-500', displayOrder: 2 },
    { name: 'Diamond', shortLabel: 'D', color: 'bg-blue-500', displayOrder: 3 }
  ]
};

export function PackageDetails({ event, packages, onClose }: PackageDetailsProps) {
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [isComponentFormOpen, setIsComponentFormOpen] = useState(false);
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PackageTier | null>(null);
  const [editingComponent, setEditingComponent] = useState<PackageComponent | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'package' | 'tier' | 'component';
    item: any;
    open: boolean;
  }>({ type: 'package', item: null, open: false });

  // Ensure this function is always in scope for all usages
  const handleEditComponents = (tier: PackageTier) => {
    setEditingTier(tier);
    setIsComponentFormOpen(true);
  };

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

  const createTierMutation = useMutation({
    mutationFn: (data: any) => PackageManagerService.createPackageTier(data),
    onSuccess: (newTier) => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Tier created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create tier: ${error.message}`);
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

  const handleCreateTier = (packageId: string, packageType: string, tierName: string) => {
    const tierConfig = TIER_CONFIG[packageType as keyof typeof TIER_CONFIG];
    const tierInfo = tierConfig?.find(t => t.name === tierName);
    
    if (tierInfo) {
      createTierMutation.mutate({
        package_id: packageId,
        name: tierName,
        short_label: tierInfo.shortLabel,
        display_order: tierInfo.displayOrder,
      });
    }
  };

  const getComponentDisplayName = (component: PackageComponent) => {
    // Use actual component data if available
    if (component.component_data) {
      switch (component.component_type) {
        case 'ticket':
          const ticketCategory = component.component_data.ticket_category?.category_name;
          return ticketCategory || 'General Admission';
        case 'hotel_room':
          const hotelName = component.component_data.hotel?.name;
          const roomType = component.component_data.room_type;
          return hotelName && roomType ? `${hotelName} (${roomType})` : hotelName || 'Unknown Hotel';
        case 'circuit_transfer':
          const transferType = component.component_data.transfer_type;
          const days = component.component_data.days;
          const formattedTransferType = transferType?.replace(/_/g, ' ') || 'coach';
          return days ? `${formattedTransferType} - ${days} days` : formattedTransferType;
        case 'airport_transfer':
          const airportTransferType = component.component_data.transport_type;
          const formattedAirportTransferType = airportTransferType?.replace(/_/g, ' ') || 'transfer';
          return formattedAirportTransferType;
        case 'flight':
          const flightNumber = component.component_data.flight_number;
          const departure = component.component_data.departure_airport;
          const arrival = component.component_data.arrival_airport;
          return flightNumber && departure && arrival ? `${flightNumber} (${departure} → ${arrival})` : flightNumber || 'Unknown Flight';
        default:
          return component.component_id;
      }
    }
    
    // Fallback to generic names if no component data
    switch (component.component_type) {
      case 'ticket':
        return 'General Admission';
      case 'hotel_room':
        return 'Hotel Room';
      case 'circuit_transfer':
        return 'Circuit Transfer';
      case 'airport_transfer':
        return 'Airport Transfer';
      case 'flight':
        return 'Flight';
      default:
        return (component.component_type as string).replace('_', ' ');
    }
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

  // Check if there are available package types to create
  const availablePackageTypes = ['Grandstand', 'VIP'].filter(type => 
    !packages.some(pkg => pkg.base_type === type)
  );
  const canCreatePackage = availablePackageTypes.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex justify-between">
          <div>
            <h2 className="text-xl font-semibold">{event.name} Packages</h2>
            <div className="flex items-start pt-5 gap-4 text-sm text-muted-foreground mt-1 flex-col">
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
                <span>{event.start_date} - {event.end_date}</span>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-end gap-2">
            {canCreatePackage && (
              <Button 
                onClick={() => setIsPackageFormOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Package
              </Button>
            )}
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
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No packages yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first package for this event.
            </p>
            {canCreatePackage && (
              <Button onClick={() => setIsPackageFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Package
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Package Type Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Packages</TabsTrigger>
                <TabsTrigger value="Grandstand">Grandstand</TabsTrigger>
                <TabsTrigger value="VIP">VIP</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                <div className="grid gap-4">
                  {packages.map((pkg) => (
                    <PackageCard 
                      key={pkg.id}
                      package={pkg}
                      event={event}
                      onEdit={() => {
                        setSelectedPackage(pkg);
                        setIsPackageFormOpen(true);
                      }}
                      onDelete={() => setDeleteDialog({ type: 'package', item: pkg, open: true })}
                      onViewDetails={() => setSelectedPackage(pkg)}
                      onCreateTier={handleCreateTier}
                      setSelectedPackage={setSelectedPackage}
                      onEditComponents={handleEditComponents}
                      calculateTierPrice={calculateTierPrice}
                      getComponentDisplayName={getComponentDisplayName}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="Grandstand" className="mt-4">
                <div className="grid gap-4">
                  {packages.filter(pkg => pkg.base_type === 'Grandstand').map((pkg) => (
                    <PackageCard 
                      key={pkg.id}
                      package={pkg}
                      event={event}
                      onEdit={() => {
                        setSelectedPackage(pkg);
                        setIsPackageFormOpen(true);
                      }}
                      onDelete={() => setDeleteDialog({ type: 'package', item: pkg, open: true })}
                      onViewDetails={() => setSelectedPackage(pkg)}
                      onCreateTier={handleCreateTier}
                      setSelectedPackage={setSelectedPackage}
                      onEditComponents={handleEditComponents}
                      calculateTierPrice={calculateTierPrice}
                      getComponentDisplayName={getComponentDisplayName}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="VIP" className="mt-4">
                <div className="grid gap-4">
                  {packages.filter(pkg => pkg.base_type === 'VIP').map((pkg) => (
                    <PackageCard 
                      key={pkg.id}
                      package={pkg}
                      event={event}
                      onEdit={() => {
                        setSelectedPackage(pkg);
                        setIsPackageFormOpen(true);
                      }}
                      onDelete={() => setDeleteDialog({ type: 'package', item: pkg, open: true })}
                      onViewDetails={() => setSelectedPackage(pkg)}
                      onCreateTier={handleCreateTier}
                      setSelectedPackage={setSelectedPackage}
                      onEditComponents={handleEditComponents}
                      calculateTierPrice={calculateTierPrice}
                      getComponentDisplayName={getComponentDisplayName}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Package Form */}
      <PackageForm 
        open={isPackageFormOpen}
        onOpenChange={setIsPackageFormOpen}
        package={selectedPackage || undefined}
        events={[event]}
        existingPackages={packages}
      />

      {/* Component Form Drawer */}
      <Drawer open={isComponentFormOpen} onOpenChange={setIsComponentFormOpen} direction="right">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingComponent ? 'Edit Component' : 'Add Component'}</DrawerTitle>
            <DrawerDescription>
              {editingComponent ? 'Update component information' : 'Add a component to this tier'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <PackageComponentForm 
              open={isComponentFormOpen}
              onOpenChange={setIsComponentFormOpen}
              component={editingComponent || undefined}
              tierId={editingTier?.id}
              eventId={event.id}
              existingComponents={editingTier?.components}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteDialog.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Package Card Component
function PackageCard({ 
  package: pkg, 
  event, 
  onEdit, 
  onDelete, 
  onViewDetails,
  onCreateTier,
  setSelectedPackage,
  onEditComponents,
  calculateTierPrice,
  getComponentDisplayName
}: { 
  package: PackageType; 
  event: any; 
  onEdit: () => void; 
  onDelete: () => void; 
  onViewDetails: () => void;
  onCreateTier: (packageId: string, packageType: string, tierName: string) => void;
  setSelectedPackage: (pkg: PackageType) => void;
  onEditComponents: (tier: PackageTier) => void;
  calculateTierPrice: (tier: PackageTier) => number;
  getComponentDisplayName: (component: PackageComponent) => string;
}) {
  const getPackageTypeIcon = (baseType: string) => {
    return baseType === 'VIP' ? <Crown className="h-4 w-4" /> : <Star className="h-4 w-4" />;
  };

  const getAvailableTiers = (packageType: string) => {
    const config = TIER_CONFIG[packageType as keyof typeof TIER_CONFIG];
    const existingTierNames = pkg.tiers?.map(t => t.name) || [];
    return config?.filter(tier => !existingTierNames.includes(tier.name)) || [];
  };

  const availableTiers = getAvailableTiers(pkg.base_type || '');
  const hasMaxTiers = pkg.tiers && pkg.tiers.length >= 3;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4">
        <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{pkg.name}</CardTitle>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant={pkg.base_type === 'VIP' ? 'default' : 'secondary'} className="text-xs">
                  {pkg.base_type || 'Standard'}
                </Badge>
                {pkg.active ? (
                  <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500 border-gray-500 text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Package
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Package
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {/* Package Image */}
      {pkg.package_image && (
        <div className="px-4 pb-2">
          <div className="w-full h-32 rounded-lg overflow-hidden">
            <img 
              src={pkg.package_image.image_url || pkg.package_image.thumbnail_url} 
              alt={pkg.package_image.description || 'Package image'} 
              className="object-cover w-full h-full" 
            />
          </div>
        </div>
      )}
      
      {pkg.description && (
        <CardContent className="pt-0 pb-2">
          <p className="text-xs text-muted-foreground">{pkg.description}</p>
        </CardContent>
      )}

      {/* Tiers Section */}
      <div className="border-t border-border">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Tiers</h4>
            {availableTiers.length > 0 && !hasMaxTiers ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {availableTiers.map((tier) => (
                    <DropdownMenuItem 
                      key={tier.name}
                      onClick={() => onCreateTier(pkg.id, pkg.base_type || '', tier.name)}
                    >
                      <div className={`w-3 h-3 rounded-full ${tier.color} mr-2`} />
                      {tier.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" disabled className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                {hasMaxTiers ? 'Max Tiers (3)' : 'All Added'}
              </Button>
            )}
          </div>
          
          {pkg.tiers && pkg.tiers.length > 0 ? (
            <div className="space-y-1.5">
              {pkg.tiers.map((tier) => (
                <TierCard 
                  key={tier.id} 
                  tier={tier} 
                  packageType={pkg.base_type}
                  onEditComponents={onEditComponents}
                  calculateTierPrice={calculateTierPrice}
                  getComponentDisplayName={getComponentDisplayName}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-muted-foreground">
              <Package className="h-6 w-6 mx-auto mb-1" />
              <p className="text-xs">No tiers yet</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Tier Card Component
function TierCard({ 
  tier, 
  packageType, 
  onEditComponents,
  calculateTierPrice,
  getComponentDisplayName
}: { 
  tier: PackageTier; 
  packageType?: string;
  onEditComponents: (tier: PackageTier) => void;
  calculateTierPrice: (tier: PackageTier) => number;
  getComponentDisplayName: (component: PackageComponent) => string;
}) {
  const tierConfig = TIER_CONFIG[packageType as keyof typeof TIER_CONFIG];
  const tierInfo = tierConfig?.find(t => t.name === tier.name);
  
  const getComponentTypeIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      ticket: <Ticket className="h-3 w-3" />,
      hotel_room: <Hotel className="h-3 w-3" />,
      circuit_transfer: <Bus className="h-3 w-3" />,
      airport_transfer: <Car className="h-3 w-3" />,
      flight: <Plane className="h-3 w-3" />,
    };
    return icons[type] || <Package className="h-3 w-3" />;
  };
  
  const hasComponents = tier.components && tier.components.length > 0;
  
  return (
    <div className="border border-border rounded-lg p-2 bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${tierInfo?.color || 'bg-gray-500'}`} />
          <span className="font-medium text-sm">{tier.name}</span>
          {tier.short_label && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {tier.short_label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const tierPrice = tier.price_override || calculateTierPrice(tier);
            return tierPrice > 0 ? (
              <div className="flex items-center gap-1 text-xs font-medium">
                <Euro className="h-3 w-3" />
                <span>£{tierPrice.toFixed(2)}</span>
              </div>
            ) : null;
          })()}
          <Button 
            variant="outline" 
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => onEditComponents(tier)}
          >
            {hasComponents ? (
              <>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Components Preview */}
      {hasComponents ? (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex flex-wrap gap-1">
            {tier.components?.slice(0, 4).map((component) => (
              <Badge key={component.id} variant="secondary" className="text-xs px-1.5 py-0.5">
                {getComponentTypeIcon(component.component_type)}
                <span className="ml-1 text-xs">
                  {getComponentDisplayName(component)}
                </span>
              </Badge>
            ))}
            {tier.components && tier.components.length > 4 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                +{tier.components.length - 4}
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="text-center py-1 text-muted-foreground">
            <p className="text-xs">No components</p>
          </div>
        </div>
      )}
    </div>
  );
} 