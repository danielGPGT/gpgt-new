import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

import { PackageManagerService } from '@/lib/packageManagerService';
import type { PackageComponent, PackageComponentInsert, PackageComponentUpdate } from '@/lib/packageManagerService';
import { supabase } from '@/lib/supabase';

// Icons
import { 
  Ticket, 
  Hotel, 
  Bus, 
  Car, 
  Plane, 
  Euro, 
  Trash2,
  Package
} from 'lucide-react';

interface PackageComponentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component?: PackageComponent;
  tierId?: string;
  eventId?: string;
  existingComponents?: PackageComponent[];
}

// Component configuration with required/optional status
const COMPONENT_CONFIG = {
  ticket: { 
    label: 'Tickets', 
    required: true, 
    icon: Ticket,
    description: 'Event tickets for this tier',
    color: 'bg-blue-500'
  },
  hotel_room: { 
    label: 'Hotel Rooms', 
    required: true, 
    icon: Hotel,
    description: 'Accommodation for this tier',
    color: 'bg-green-500'
  },
  circuit_transfer: { 
    label: 'Circuit Transfers', 
    required: false, 
    icon: Bus,
    description: 'Transportation between venues',
    color: 'bg-purple-500'
  },
  airport_transfer: { 
    label: 'Airport Transfers', 
    required: false, 
    icon: Car,
    description: 'Transportation to/from airport',
    color: 'bg-orange-500'
  },
  flight: { 
    label: 'Flights', 
    required: false, 
    icon: Plane,
    description: 'Flight arrangements',
    color: 'bg-red-500'
  }
};

interface SelectedComponent {
  componentType: string;
  componentId: string;
  componentData: any;
  priceOverride?: number;
}

export function PackageComponentForm({ open, onOpenChange, component, tierId, eventId, existingComponents }: PackageComponentFormProps) {
  const queryClient = useQueryClient();
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ticket');



  // Get hotel_id from existing hotel room components for transfer filtering
  const getHotelIdForTransfers = async () => {
    if (!existingComponents) return undefined;
    
    const hotelRoomComponent = existingComponents.find(comp => comp.component_type === 'hotel_room');
    if (!hotelRoomComponent) return undefined;
    
    try {
      const { data: hotelRoom } = await supabase
        .from('hotel_rooms')
        .select('hotel_id')
        .eq('id', hotelRoomComponent.component_id)
        .single();
      
      return hotelRoom?.hotel_id;
    } catch (error) {
      console.error('Error fetching hotel_id:', error);
      return undefined;
    }
  };

  // Fetch all available components for the event
  const { data: allComponents } = useQuery({
    queryKey: ['all-available-components', eventId, existingComponents?.map(c => c.component_id).join(',')],
    queryFn: async () => {
      if (!eventId) return {};
      
      const hotelId = await getHotelIdForTransfers();
      const components: { [key: string]: any[] } = {};
      
      // Fetch all component types
      const componentTypes = Object.keys(COMPONENT_CONFIG);
      
      for (const type of componentTypes) {
        try {
          const data = await PackageManagerService.getAvailableComponents(eventId, type, hotelId);
          components[type] = data;
        } catch (error) {
          console.error(`Error fetching ${type} components:`, error);
          components[type] = [];
        }
      }
      
      return components;
    },
    enabled: !!eventId,
  });

  // Initialize selected components with existing components when editing
  useEffect(() => {
    if (existingComponents && existingComponents.length > 0 && allComponents) {
      const initialSelected: SelectedComponent[] = [];
      
      for (const existing of existingComponents) {
        // Find the component data from allComponents
        const componentData = allComponents[existing.component_type]?.find(
          comp => comp.id === existing.component_id
        );
        
        if (componentData) {
          initialSelected.push({
            componentType: existing.component_type,
            componentId: existing.component_id,
            componentData: componentData,
            priceOverride: existing.price_override || undefined
          });
        }
      }
      
      setSelectedComponents(initialSelected);
    } else if (!existingComponents || existingComponents.length === 0) {
      // Clear selected components when not editing
      setSelectedComponents([]);
    }
  }, [existingComponents, allComponents]);

  const createComponentMutation = useMutation({
    mutationFn: async (components: PackageComponentInsert[]) => {
      const results = [];
      for (const component of components) {
        const result = await PackageManagerService.createPackageComponent(component);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      onOpenChange(false);
      toast.success(`Added ${selectedComponents.length} components to tier`);
    },
    onError: (error) => {
      toast.error(`Failed to add components: ${error.message}`);
    },
  });

  const updateComponentMutation = useMutation({
    mutationFn: async (components: { id: string; updates: PackageComponentUpdate }[]) => {
      const results = [];
      for (const { id, updates } of components) {
        const result = await PackageManagerService.updatePackageComponent(id, updates);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      onOpenChange(false);
      toast.success(`Updated ${selectedComponents.length} components`);
    },
    onError: (error) => {
      toast.error(`Failed to update components: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedComponents.length === 0) {
      toast.error('Please select at least one component');
      return;
    }

    // Check if we're editing existing components or creating new ones
    const isEditing = existingComponents && existingComponents.length > 0;

    if (isEditing) {
      // Update existing components
      const componentsToUpdate = selectedComponents.map(selected => {
        const existing = existingComponents.find(ec => 
          ec.component_type === selected.componentType && 
          ec.component_id === selected.componentId
        );
        
        return {
          id: existing?.id || '',
          updates: {
            price_override: selected.priceOverride,
          }
        };
      }).filter(item => item.id); // Only include components that exist

      updateComponentMutation.mutate(componentsToUpdate);
    } else {
      // Create new components
      const componentsToCreate: PackageComponentInsert[] = selectedComponents.map(selected => ({
        tier_id: tierId || '',
        event_id: eventId || '',
        component_type: selected.componentType as any,
        component_id: selected.componentId,
        default_quantity: 1,
        price_override: selected.priceOverride,
        notes: '',
      }));

      createComponentMutation.mutate(componentsToCreate);
    }
  };

  const handleComponentToggle = (componentType: string, componentData: any, checked: boolean) => {
    if (checked) {
      setSelectedComponents(prev => [...prev, {
        componentType,
        componentId: componentData.id,
        componentData,
        priceOverride: undefined
      }]);
    } else {
      setSelectedComponents(prev => prev.filter(c => !(c.componentType === componentType && c.componentId === componentData.id)));
    }
  };

  const updateSelectedComponent = (componentType: string, componentId: string, updates: Partial<SelectedComponent>) => {
    setSelectedComponents(prev => prev.map(c => 
      c.componentType === componentType && c.componentId === componentId 
        ? { ...c, ...updates }
        : c
    ));
  };

  const removeSelectedComponent = (componentType: string, componentId: string) => {
    setSelectedComponents(prev => prev.filter(c => !(c.componentType === componentType && c.componentId === componentId)));
  };

  const getComponentDisplayName = (component: any, type: string) => {
    switch (type) {
      case 'ticket':
        const ticketPrice = component.price_with_markup || component.price_gbp || 0;
        const available = component.quantity_available || 0;
        const categoryName = component.ticket_category?.category_name || component.ticket_category_id || 'Ticket';
        return `${categoryName} - £${ticketPrice.toFixed(2)} (${available} available)`;
      case 'hotel_room':
        const roomPrice = component.total_price_per_stay_gbp_with_markup || component.total_price_per_stay_gbp || 0;
        const nights = component.check_out && component.check_in 
          ? Math.ceil((new Date(component.check_out).getTime() - new Date(component.check_in).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        const roomsAvailable = component.quantity_available || 0;
        return `${component.room_type_id} - ${nights} nights - £${roomPrice.toFixed(2)} (${roomsAvailable} available)`;
      case 'circuit_transfer':
        const transferPrice = component.sell_price_per_seat_gbp || component.utilisation_cost_per_seat_gbp || 0;
        const transferType = component.transfer_type;
        const days = component.days;
        const formattedTransferType = transferType?.replace(/_/g, ' ') || 'coach';
        const daysText = days ? ` - ${days} days` : '';
        return `${formattedTransferType}${daysText} - £${transferPrice.toFixed(2)}`;
      case 'airport_transfer':
        const airportPrice = component.price_per_car_gbp_markup || component.supplier_quote_per_car_gbp || 0;
        const airportTransferType = component.transport_type;
        const formattedAirportTransferType = airportTransferType?.replace(/_/g, ' ') || 'transfer';
        return `${formattedAirportTransferType} - £${airportPrice.toFixed(2)}`;
      case 'flight':
        return `${component.airline} ${component.outbound_flight_number} - £${component.total_price_gbp?.toFixed(2) || '0.00'}`;
      default:
        return component.id;
    }
  };

  const getComponentPrice = (component: any, type: string) => {
    switch (type) {
      case 'ticket':
        return component.price_with_markup || component.price_gbp || 0;
      case 'hotel_room':
        return component.total_price_per_stay_gbp_with_markup || component.total_price_per_stay_gbp || 0;
      case 'circuit_transfer':
        return component.sell_price_per_seat_gbp || component.utilisation_cost_per_seat_gbp || 0;
      case 'airport_transfer':
        return component.price_per_car_gbp_markup || component.supplier_quote_per_car_gbp || 0;
      case 'flight':
        return component.total_price_gbp || 0;
      default:
        return 0;
    }
  };

  const calculateTotalPrice = () => {
    return selectedComponents.reduce((total, selected) => {
      const basePrice = getComponentPrice(selected.componentData, selected.componentType);
      const finalPrice = selected.priceOverride !== undefined ? selected.priceOverride : basePrice;
      return total + finalPrice;
    }, 0);
  };

  const calculatePriceForTwoPeople = () => {
    const componentCounts = {
      ticket: 0,
      hotel_room: 0,
      circuit_transfer: 0,
      airport_transfer: 0,
      flight: 0
    };

    // Count components by type
    selectedComponents.forEach(selected => {
      componentCounts[selected.componentType as keyof typeof componentCounts]++;
    });

    // Calculate price for 2 people
    let totalForTwo = 0;

    // Tickets: 2 per person
    if (componentCounts.ticket > 0) {
      const ticketPrice = selectedComponents.find(c => c.componentType === 'ticket');
      if (ticketPrice) {
        const basePrice = getComponentPrice(ticketPrice.componentData, 'ticket');
        const finalPrice = ticketPrice.priceOverride !== undefined ? ticketPrice.priceOverride : basePrice;
        totalForTwo += finalPrice * 2; // 2 tickets
      }
    }

    // Hotel rooms: 1 per booking (shared)
    if (componentCounts.hotel_room > 0) {
      const hotelPrice = selectedComponents.find(c => c.componentType === 'hotel_room');
      if (hotelPrice) {
        const basePrice = getComponentPrice(hotelPrice.componentData, 'hotel_room');
        const finalPrice = hotelPrice.priceOverride !== undefined ? hotelPrice.priceOverride : basePrice;
        totalForTwo += finalPrice; // 1 room
      }
    }

    // Circuit transfers: 2 per person
    if (componentCounts.circuit_transfer > 0) {
      const transferPrice = selectedComponents.find(c => c.componentType === 'circuit_transfer');
      if (transferPrice) {
        const basePrice = getComponentPrice(transferPrice.componentData, 'circuit_transfer');
        const finalPrice = transferPrice.priceOverride !== undefined ? transferPrice.priceOverride : basePrice;
        totalForTwo += finalPrice * 2; // 2 transfers
      }
    }

    // Airport transfers: 1 per booking (shared)
    if (componentCounts.airport_transfer > 0) {
      const airportPrice = selectedComponents.find(c => c.componentType === 'airport_transfer');
      if (airportPrice) {
        const basePrice = getComponentPrice(airportPrice.componentData, 'airport_transfer');
        const finalPrice = airportPrice.priceOverride !== undefined ? airportPrice.priceOverride : basePrice;
        totalForTwo += finalPrice; // 1 transfer
      }
    }

    // Flights: 2 per person
    if (componentCounts.flight > 0) {
      const flightPrice = selectedComponents.find(c => c.componentType === 'flight');
      if (flightPrice) {
        const basePrice = getComponentPrice(flightPrice.componentData, 'flight');
        const finalPrice = flightPrice.priceOverride !== undefined ? flightPrice.priceOverride : basePrice;
        totalForTwo += finalPrice * 2; // 2 flights
      }
    }

    return totalForTwo;
  };

  const isLoading = createComponentMutation.isPending || updateComponentMutation.isPending;
  const isEditing = existingComponents && existingComponents.length > 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="max-w-4xl">
        <DrawerHeader>
          <DrawerTitle>{isEditing ? 'Edit Components' : 'Add Components to Tier'}</DrawerTitle>
          <DrawerDescription>
            {isEditing 
              ? 'Modify existing components and their pricing for this tier.'
              : 'Select components to add to this tier. Required components are marked with a red badge.'
            }
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-5 h-full">
            {/* Left Panel - Component Selection */}
            <div className="border-r border-border col-span-3">
              <div className="p-4 h-full flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
                    {Object.entries(COMPONENT_CONFIG).map(([type, config]) => (
                      <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{config.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <ScrollArea className="flex-1 mt-4">
                    {Object.entries(COMPONENT_CONFIG).map(([type, config]) => (
                      <TabsContent key={type} value={type} className="space-y-3 h-full">
                        <div className="flex items-center gap-2 mb-3">
                          <config.icon className="h-5 w-5" />
                          <h3 className="font-medium">{config.label}</h3>
                          {config.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          {!config.required && (
                            <Badge variant="secondary" className="text-xs">Optional</Badge>
                          )}
                        </div>
                        
                        {allComponents?.[type]?.length > 0 ? (
                          <div className="space-y-2">
                            {allComponents[type].map((component) => {
                              const isSelected = selectedComponents.some(
                                sc => sc.componentType === type && sc.componentId === component.id
                              );
                              
                              return (
                                <Card 
                                  key={component.id} 
                                  className={`cursor-pointer transition-all py-0 ${
                                    isSelected 
                                      ? 'border-primary bg-primary/5' 
                                      : 'hover:bg-muted/50'
                                  }`}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => 
                                          handleComponentToggle(type, component, checked as boolean)
                                        }
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">
                                          {getComponentDisplayName(component, type)}
                                        </p>
                                        {component.hotel?.name && (
                                          <p className="text-xs text-muted-foreground">
                                            Hotel: {component.hotel.name}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <config.icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No {config.label.toLowerCase()} available for this event</p>
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </ScrollArea>
                </Tabs>
              </div>
            </div>

            {/* Right Panel - Selected Components & Pricing */}
            <div className="flex flex-col h-full col-span-2 pr-2">
              <div className="p-4 border-b border-border flex-shrink-0">
                <h3 className="font-medium mb-2">Selected Components</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedComponents.length} component{selectedComponents.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              
              <div className="flex-1 overflow-hidden max-h-[700px]">
                <ScrollArea className="h-full w-full">
                  <div className="p-2 space-y-2">
                    {selectedComponents.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-1 opacity-50" />
                        <p className="text-sm">No components selected</p>
                        <p className="text-xs">Select components from the left panel</p>
                      </div>
                    ) : (
                      selectedComponents.map((selected, index) => {
                        const config = COMPONENT_CONFIG[selected.componentType as keyof typeof COMPONENT_CONFIG];
                        const basePrice = getComponentPrice(selected.componentData, selected.componentType);
                        const finalPrice = selected.priceOverride !== undefined ? selected.priceOverride : basePrice;
                        
                        return (
                          <Card key={`${selected.componentType}-${selected.componentId}`} className="border py-0">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <config.icon className="h-3 w-3 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs">
                                      {selected.componentType === 'ticket' 
                                        ? selected.componentData.ticket_category?.category_name || selected.componentData.ticket_category_id || 'Ticket'
                                        : getComponentDisplayName(selected.componentData, selected.componentType)
                                      }
                                    </div>
                                    {selected.componentType === 'ticket' && (
                                      <div className="text-xs text-muted-foreground">
                                        £{getComponentPrice(selected.componentData, selected.componentType).toFixed(2)} • {selected.componentData.quantity_available || 0} available
                                      </div>
                                    )}
                                    {selected.componentType === 'hotel_room' && (
                                      <div className="text-xs text-muted-foreground">
                                        £{getComponentPrice(selected.componentData, selected.componentType).toFixed(2)} • {selected.componentData.quantity_available || 0} available
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                  onClick={() => removeSelectedComponent(selected.componentType, selected.componentId)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs">Price Override</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={selected.priceOverride || ''}
                                    onChange={(e) => updateSelectedComponent(selected.componentType, selected.componentId, {
                                      priceOverride: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                    placeholder="Default"
                                    className="mt-1 h-7 text-xs"
                                  />
                                </div>
                                
                                <div className="flex items-center gap-2 font-medium text-xs">
                                  <span>Price:</span>
                                  <span className="font-bold">£{finalPrice.toFixed(2)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Total Pricing Summary */}
              {selectedComponents.length > 0 && (
                <div className="p-4 border-t border-border bg-muted/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Per Person Cost</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedComponents.length} component{selectedComponents.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">£{calculateTotalPrice().toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Price for 2 People</p>
                        <p className="text-xs text-muted-foreground">
                          2 tickets • 1 hotel room • 2 circuit transfers • 1 airport transfer • 2 flights
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">£{calculatePriceForTwoPeople().toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DrawerFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedComponents.length} component{selectedComponents.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || selectedComponents.length === 0}
              >
                {isLoading 
                  ? (isEditing ? 'Updating...' : 'Adding...') 
                  : (isEditing 
                      ? `Update ${selectedComponents.length} Component${selectedComponents.length !== 1 ? 's' : ''}`
                      : `Add ${selectedComponents.length} Component${selectedComponents.length !== 1 ? 's' : ''}`
                    )
                }
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
