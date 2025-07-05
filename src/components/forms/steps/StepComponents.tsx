import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Ticket, Hotel, Car, Plane, Users, ArrowRight, CheckCircle, AlertCircle, Package, Star, Info, Calendar, Clock, Tag, Building, BedDouble, Plus, Minus } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface PackageComponent {
  id: string;
  tier_id: string;
  event_id: string;
  component_type: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight';
  component_id: string;
  default_quantity: number;
  price_override: number | null;
  notes: string | null;
  component_data?: any; // Will be populated with actual component details
}

interface TicketCategory {
  id: string;
  category_name: string;
  venue_id: string | null;
  sport_type: string | null;
  category_type: string | null;
  description: any;
  options: any;
  ticket_delivery_days: number | null;
  media_files: any;
}

interface TicketType {
  id: string;
  event_id: string;
  ticket_category_id: string | null;
  quantity_total: number;
  quantity_reserved: number;
  quantity_provisional: number;
  quantity_available: number;
  price: number;
  markup_percent: number;
  price_with_markup: number;
  currency: string;
  ticket_type: string | null;
  refundable: boolean;
  resellable: boolean;
  supplier: string | null;
  supplier_ref: string | null;
  ticket_days: string | null;
  active: boolean;
  ticket_category?: TicketCategory;
}

interface ComponentConfig {
  type: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight';
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

const COMPONENT_CONFIG: ComponentConfig[] = [
  {
    type: 'ticket',
    label: 'Event Tickets',
    icon: Ticket,
    description: 'Select your event tickets and quantities',
    color: 'from-[var(--color-primary-600)] to-[var(--color-primary-700)]'
  },
  {
    type: 'hotel_room',
    label: 'Hotel Rooms',
    icon: Hotel,
    description: 'Choose accommodation for your stay',
    color: 'from-[var(--color-secondary-600)] to-[var(--color-secondary-700)]'
  },
  {
    type: 'circuit_transfer',
    label: 'Circuit Transfers',
    icon: Car,
    description: 'Transportation between venues',
    color: 'from-[var(--color-primary-500)] to-[var(--color-primary-600)]'
  },
  {
    type: 'airport_transfer',
    label: 'Airport Transfers',
    icon: Car,
    description: 'Transportation to/from airport',
    color: 'from-[var(--color-secondary-500)] to-[var(--color-secondary-600)]'
  },
  {
    type: 'flight',
    label: 'Flights',
    icon: Plane,
    description: 'Flight arrangements',
    color: 'from-[var(--color-primary-700)] to-[var(--color-primary-800)]'
  }
];

export function StepComponents({ setCurrentStep, currentStep }: { setCurrentStep: (step: number) => void; currentStep: number }) {
  const { watch, setValue } = useFormContext();
  const selectedEvent = watch('selectedEvent');
  const selectedTier = watch('selectedTier');
  const selectedPackage = watch('selectedPackage');
  const adults = watch('travelers.adults') || 1;
  const components = watch('components') || { tickets: [], hotels: [], circuitTransfers: [], airportTransfers: [] };

  const [packageComponents, setPackageComponents] = useState<PackageComponent[]>([]);
  const [availableTickets, setAvailableTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight'>('ticket');

  // Fetch package components for the selected tier
  useEffect(() => {
    if (!selectedTier?.id) return;
    setLoading(true);
    
    supabase
      .from('package_components')
      .select('*')
      .eq('tier_id', selectedTier.id)
      .then(({ data: packageComps }) => {
        setPackageComponents(packageComps || []);
        
        // If we have ticket components, fetch the ticket details
        const ticketComponents = packageComps?.filter(comp => comp.component_type === 'ticket') || [];
        if (ticketComponents.length > 0) {
          const ticketIds = ticketComponents.map(comp => comp.component_id);
          
          supabase
            .from('tickets')
            .select(`
              *,
              ticket_category:ticket_categories(*)
            `)
            .in('id', ticketIds)
            .eq('active', true)
            .then(({ data: tickets }) => {
              // Merge ticket data with package components
              const enrichedComponents = packageComps?.map(comp => {
                if (comp.component_type === 'ticket') {
                  const ticketData = tickets?.find(t => t.id === comp.component_id);
                  return {
                    ...comp,
                    component_data: ticketData
                  };
                }
                return comp;
              }) || [];
              
              setPackageComponents(enrichedComponents);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      });
  }, [selectedTier]);

  // Fetch all available tickets for swapping
  useEffect(() => {
    if (!selectedEvent?.id) return;
    
    supabase
      .from('tickets')
      .select(`
        *,
        ticket_category:ticket_categories(*)
      `)
      .eq('event_id', selectedEvent.id)
      .eq('active', true)
      .gt('quantity_available', 0)
      .order('price_with_markup', { ascending: true })
      .then(({ data }) => {
        setAvailableTickets(data || []);
      });
  }, [selectedEvent]);

  // Initialize components with package components data
  useEffect(() => {
    if (packageComponents.length > 0 && !components.tickets.length) {
      const ticketComponents = packageComponents.filter(comp => comp.component_type === 'ticket');
      const initialTickets = ticketComponents.map(comp => {
        const initialQty = adults || 1;
        console.log('[INIT] ticket', comp.component_id, 'adults:', adults, 'initialQty:', initialQty);
        return {
          id: comp.component_id,
          quantity: initialQty,
          price: comp.component_data?.price_with_markup || 0,
          category: comp.component_data?.ticket_category?.category_name || 'General',
          packageComponentId: comp.id
        };
      });
      setValue('components.tickets', initialTickets);
    }
  }, [packageComponents, adults, components.tickets.length, setValue]);

  // Clamp ticket quantities if adults changes
  useEffect(() => {
    if (components.tickets.length > 0) {
      const updated = components.tickets.map((ticket: any) => {
        const ticketData = availableTickets.find((t: any) => t.id === ticket.id);
        const available = ticketData?.quantity_available ?? 1;
        const max = Math.min(adults || 1, available || 1);
        const clamped = Math.max(1, Math.min(ticket.quantity, max));
        console.log('[CLAMP] ticket', ticket.id, 'adults:', adults, 'available:', available, 'max:', max, 'clamped:', clamped);
        return {
          ...ticket,
          quantity: clamped,
        };
      });
      setValue('components.tickets', updated);
    }
  }, [adults, availableTickets, setValue]);

  const handleTicketChange = (ticketId: string, index: number) => {
    const selectedTicket = availableTickets.find(t => t.id === ticketId);
    if (!selectedTicket) return;
    const updatedTickets = [...components.tickets];
    updatedTickets[index] = {
      ...updatedTickets[index],
      id: ticketId,
      quantity: adults || 1,
      price: selectedTicket.price_with_markup,
      category: selectedTicket.ticket_category?.category_name || 'General'
    };
    setValue('components.tickets', updatedTickets);
  };

  const handleQuantityChange = (quantity: number, index: number) => {
    const currentTicket = availableTickets.find(t => t.id === components.tickets[index].id);
    const maxQuantity = Math.min(adults || 1, currentTicket?.quantity_available || 0);
    const clampedQuantity = Math.max(1, Math.min(quantity, maxQuantity));
    
    const updatedTickets = [...components.tickets];
    updatedTickets[index] = { ...updatedTickets[index], quantity: clampedQuantity };
    setValue('components.tickets', updatedTickets);
  };

  const getTotalPrice = () => {
    return components.tickets.reduce((total: number, ticket: any) => {
      return total + (ticket.price * ticket.quantity);
    }, 0);
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'ticket': return <Ticket className="h-4 w-4" />;
      case 'hotel_room': return <Hotel className="h-4 w-4" />;
      case 'circuit_transfer': return <Car className="h-4 w-4" />;
      case 'airport_transfer': return <Car className="h-4 w-4" />;
      case 'flight': return <Plane className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTicketInfo = (ticket: TicketType) => {
    const category = ticket.ticket_category;
    const info = [];

    // Static info from ticket category
    if (category?.description) {
      info.push({ label: 'Description', value: category.description });
    }
    if (category?.category_type) {
      info.push({ label: 'Type', value: category.category_type });
    }
    if (category?.ticket_delivery_days !== null) {
      info.push({ label: 'Delivery Days', value: `${category.ticket_delivery_days} days before event` });
    }

    // Dynamic info from ticket
    if (ticket.ticket_days) {
      info.push({ label: 'Valid Days', value: ticket.ticket_days });
    }
    if (ticket.refundable !== null) {
      info.push({ label: 'Refundable', value: ticket.refundable ? 'Yes' : 'No' });
    }
    if (ticket.resellable !== null) {
      info.push({ label: 'Resellable', value: ticket.resellable ? 'Yes' : 'No' });
    }
    if (ticket.supplier) {
      info.push({ label: 'Supplier', value: ticket.supplier });
    }

    return info;
  };

  const getMaxQuantity = (ticket: TicketType) => {
    return Math.min(adults || 1, ticket.quantity_available);
  };

  // Calculate total tickets selected
  const totalTickets = components.tickets.reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);

  return (
    <div className="space-y-8">

      {/* Selected Tier Info */}
      {selectedTier && (
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Left: Package and Tier Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-600)] flex items-center justify-center">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div>
              {/* Show selected package name from selectedPackage */}
              {selectedPackage?.name && (
                <div className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-1 uppercase tracking-wider">
                  Package: <span className="text-[var(--color-foreground)]">{selectedPackage.name}</span>
                </div>
              )}
              <h4 className="text-lg font-semibold text-[var(--color-foreground)]">{selectedTier.name}</h4>
              <p className="text-[var(--color-muted-foreground)]">{selectedTier.description}</p>
              {selectedTier.priceOverride && (
                <p className="text-sm text-[var(--color-primary)] font-medium">
                  Tier Price: £{selectedTier.priceOverride.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          {/* Right: Group Size Info */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-muted)]/40 px-3 py-1 rounded-lg font-medium">
              <Users className="h-4 w-4 mr-1" />
              {adults} adult{adults !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Component Navigation */}
      <div className="flex flex-wrap gap-3 justify-start">
        {COMPONENT_CONFIG.map((config) => {
          const hasComponents = packageComponents.some(comp => comp.component_type === config.type);
          return (
            <Button
              key={config.type}
              variant={activeComponent === config.type ? "default" : "outline"}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeComponent === config.type 
                  ? 'bg-gradient-to-r ' + config.color + ' text-white shadow-lg' 
                  : hasComponents 
                    ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5' 
                    : 'hover:bg-[var(--color-muted)]'
              }`}
              onClick={() => setActiveComponent(config.type)}
            >
              <config.icon className="h-4 w-4" />
              {config.label}
              {hasComponents && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {packageComponents.filter(comp => comp.component_type === config.type).length}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Component Content */}
      <div className="space-y-6">
        {activeComponent === 'ticket' && (
          <div className="space-y-6">


            {/* Tickets Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-[var(--color-primary-600)]" />
                  Package Tickets
                </h4>
                <Badge variant="secondary" className="text-sm">
                  {components.tickets.length} included
                </Badge>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="text-center space-y-3">
                    <Loader2 className="animate-spin h-8 w-8 text-[var(--color-muted-foreground)] mx-auto" />
                    <p className="text-[var(--color-muted-foreground)]">Loading package components...</p>
                  </div>
                </div>
              ) : components.tickets.length === 0 ? (
                <Card className="text-center py-12 border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-card)] to-[var(--color-background)]">
                  <CardContent>
                    <div className="mx-auto w-16 h-16 bg-[var(--color-muted)] rounded-xl flex items-center justify-center mb-6">
                      <Ticket className="h-8 w-8 text-[var(--color-muted-foreground)]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3 text-[var(--color-foreground)]">No tickets included</h3>
                    <p className="text-[var(--color-muted-foreground)]">This package tier doesn't include any tickets.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {components.tickets.map((ticket: any, index: number) => {
                    const ticketData = availableTickets.find((t: any) => t.id === ticket.id);
                    // Defensive defaults
                    const available = ticketData?.quantity_available ?? 1;
                    const maxQuantityRaw = Math.max(1, Math.min(adults || 1, available || 1));
                    const maxQuantity = Number.isFinite(maxQuantityRaw) ? maxQuantityRaw : 1;
                    const ticketInfo = ticketData ? getTicketInfo(ticketData) : [];
                    // Always use ticketData.price_with_markup if available, fallback to ticket.price
                    const priceEach = Number.isFinite(ticketData?.price_with_markup) ? ticketData.price_with_markup : (Number.isFinite(ticket.price) ? ticket.price : 0);
                    const quantity = Number.isFinite(ticket.quantity) && ticket.quantity > 0 ? ticket.quantity : 1;
                    const totalPrice = priceEach * quantity;

                    console.log('[RENDER] ticket', ticket.id, 'adults:', adults, 'available:', available, 'maxQuantity:', maxQuantity, 'quantity:', quantity);

                    return (
                      <Card key={index} className="bg-[var(--color-card)]/95 shadow-md rounded-2xl border border-[var(--color-border)] px-0 py-0 mb-4 overflow-hidden transition-all">
                        <div className="p-4">
                          {/* Top row: Ticket Type Dropdown (left), Price (right) */}
                          <div className="flex flex-row items-center justify-between mb-4 gap-3">
                            <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
                              <Label className="text-sm font-semibold text-[var(--color-foreground)] mr-2 min-w-[90px]">Ticket Type</Label>
                              <Select
                                value={ticket.id}
                                onValueChange={(value) => handleTicketChange(value, index)}
                              >
                                <SelectTrigger className="w-full max-w-xs">
                                  <SelectValue placeholder="Select ticket category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTickets
                                    .filter((t: any) => {
                                      // Allow the current ticket id, but not any others already selected
                                      const selectedIds = components.tickets.map((tk: any, i: number) => i !== index && tk.id).filter(Boolean);
                                      return t.id === ticket.id || !selectedIds.includes(t.id);
                                    })
                                    .map((t: any) => (
                                      <SelectItem key={t.id} value={t.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{t.ticket_category?.category_name || 'General'}</span>
                                          <span className="text-[var(--color-muted-foreground)] ml-2">
                                            £{t.price_with_markup.toFixed(2)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {/* Price (top right) */}
                            <div className="flex flex-col items-end flex-shrink-0 min-w-[120px]">
                              <span className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-1">Price</span>
                              <span className="text-2xl font-extrabold text-[var(--color-primary)]">
                                £{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-xs text-[var(--color-muted-foreground)]">
                                £{priceEach.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                              </span>
                            </div>
                          </div>

                          {/* Second row: Ticket Info (left), Quantity, Info, Remove (right) */}
                          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 w-full justify-between">
                            {/* Left: Icon, name, details */}
                            <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-700)] flex items-center justify-center">
                                <Ticket className="h-5 w-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-lg text-[var(--color-foreground)] truncate">
                                  {ticketData?.ticket_category?.category_name || 'Ticket'}
                                </div>
                                <div className="text-[var(--color-muted-foreground)] text-xs truncate">
                                  {ticketData?.ticket_category?.category_type || 'General'}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] mt-1">
                                  <Tag className="h-3 w-3" />
                                  {ticketData?.ticket_type || 'Standard'}
                                  {ticketData?.ticket_days && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <Calendar className="h-3 w-3" /> {ticketData.ticket_days}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Quantity Selector, Info Button, Remove */}
                            <div className="flex flex-row items-center gap-2 flex-shrink-0 justify-end">
                              <Label htmlFor={`quantity-${index}`} className="text-xs font-semibold text-[var(--color-muted-foreground)] mr-2">
                                Quantity
                              </Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(quantity - 1, index)}
                                disabled={quantity <= 1}
                                className="w-8 h-8 p-0"
                                tabIndex={-1}
                              >
                                -
                              </Button>
                              <Input
                                id={`quantity-${index}`}
                                type="number"
                                value={quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  handleQuantityChange(Number.isFinite(val) && val > 0 ? val : 1, index);
                                }}
                                min={1}
                                max={maxQuantity}
                                className="w-12 text-center font-bold text-base bg-transparent border-none focus:ring-2 focus:ring-[var(--color-primary)]"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(quantity + 1, index)}
                                disabled={quantity >= maxQuantity}
                                className="w-8 h-8 p-0"
                                tabIndex={-1}
                              >
                                +
                              </Button>
                              <span className="text-xs text-[var(--color-muted-foreground)] ml-2">
                                Max: {maxQuantity} <span className="text-[var(--color-border)]">({available} available)</span>
                              </span>
                              {ticketData && ticketInfo.length > 0 && (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0" aria-label="Ticket info">
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-[var(--color-foreground)]">
                                        {ticketData.ticket_category?.category_name || 'Ticket'} Details
                                      </h4>
                                      <div className="space-y-2">
                                        {ticketInfo.map((info: any, i: number) => (
                                          <div key={i} className="flex justify-between text-sm">
                                            <span className="text-[var(--color-muted-foreground)]">{info.label}:</span>
                                            <span className="font-medium">{info.value}</span>
                                          </div>
                                        ))}
                                      </div>
                                      {available < 10 && (
                                        <Alert>
                                          <AlertCircle className="h-4 w-4" />
                                          <AlertDescription>
                                            Only {available} tickets remaining!
                                          </AlertDescription>
                                        </Alert>
                                      )}
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                              {components.tickets.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-destructive"
                                  aria-label="Remove ticket type"
                                  onClick={() => {
                                    const updated = components.tickets.filter((_: any, i: number) => i !== index);
                                    setValue('components.tickets', updated);
                                  }}
                                >
                                  ×
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  {/* Add/Remove Ticket Controls */}
                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    {/* Add Another Ticket Type */}
                    {availableTickets.length > components.tickets.length && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={totalTickets >= adults}
                        onClick={() => {
                          // Find first available ticket not already selected
                          const selectedIds = components.tickets.map((t: any) => t.id);
                          const nextTicket = availableTickets.find((t: any) => !selectedIds.includes(t.id));
                          if (!nextTicket) return;
                          const remaining = Math.max(1, adults - totalTickets);
                          const addQty = remaining;
                          console.log('[ADD] ticket', nextTicket.id, 'adults:', adults, 'addQty:', addQty, 'totalTickets:', totalTickets);
                          const newTicket = {
                            id: nextTicket.id,
                            quantity: addQty,
                            price: nextTicket.price_with_markup || 0,
                            category: nextTicket.ticket_category?.category_name || 'General',
                            packageComponentId: null
                          };
                          setValue('components.tickets', [...components.tickets, newTicket]);
                        }}
                        className="rounded-xl px-5 py-2"
                      >
                        + Add Another Ticket Type
                      </Button>
                    )}
                  </div>
                </div>
              )}

             
            </div>
          </div>
        )}

        {activeComponent === 'hotel_room' && (
          <HotelRoomsTab
            adults={adults}
            selectedEvent={selectedEvent}
            setValue={setValue}
          />
        )}

        {/* Other Components Placeholder */}
        {activeComponent !== 'ticket' && activeComponent !== 'hotel_room' && (
          <Card className="text-center py-16 border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-card)] to-[var(--color-background)]">
            <CardContent>
              <div className="mx-auto w-16 h-16 bg-[var(--color-muted)] rounded-xl flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-[var(--color-muted-foreground)]" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-[var(--color-foreground)]">
                {COMPONENT_CONFIG.find(c => c.type === activeComponent)?.label} Coming Soon
              </h3>
              <p className="text-[var(--color-muted-foreground)]">
                {COMPONENT_CONFIG.find(c => c.type === activeComponent)?.description}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <div className="text-sm text-[var(--color-muted-foreground)]">
          Step 5 of 8 • Components Configuration
        </div>
        <Button 
          onClick={() => setCurrentStep(currentStep + 1)}
          className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-700)] text-white px-8 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function HotelRoomsTab({ adults, selectedEvent, setValue }: { adults: number, selectedEvent: any, setValue: any }) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch hotel rooms for the event
      const { data: rooms } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('event_id', selectedEvent?.id)
        .eq('active', true);
      // Fetch hotels for these rooms
      const hotelIds = rooms?.map((r: any) => r.hotel_id) || [];
      const { data: hotelsData } = await supabase
        .from('gpgt_hotels')
        .select('*')
        .in('id', hotelIds);
      setHotelRooms(rooms || []);
      setHotels(hotelsData || []);
      setLoading(false);
      // Default: select first available room type if none selected
      if ((rooms?.length ?? 0) > 0 && selectedRooms.length === 0) {
        setSelectedRooms([
          {
            hotelId: rooms[0].hotel_id,
            roomId: rooms[0].id,
            quantity: 1,
            checkIn: rooms[0].check_in,
            checkOut: rooms[0].check_out,
          },
        ]);
      }
    }
    if (selectedEvent?.id) fetchData();
  }, [selectedEvent]);

  // Helper: get hotel for a room
  function getHotel(hotelId: string) {
    return hotels.find(h => h.id === hotelId);
  }
  // Helper: get room by id
  function getRoom(roomId: string) {
    return hotelRooms.find(r => r.id === roomId);
  }

  // Calculate total rooms selected
  const totalRooms = selectedRooms.reduce((sum, r) => sum + (r.quantity || 0), 0);

  // Add another room type (if not all adults are covered)
  function handleAddRoom() {
    // Find a room not already selected
    const selectedIds = selectedRooms.map(r => r.roomId);
    const nextRoom = hotelRooms.find((r: any) => !selectedIds.includes(r.id));
    if (!nextRoom) return;
    setSelectedRooms([
      ...selectedRooms,
      {
        hotelId: nextRoom.hotel_id,
        roomId: nextRoom.id,
        quantity: 1,
        checkIn: nextRoom.check_in,
        checkOut: nextRoom.check_out,
      },
    ]);
  }

  // UI for each hotel room card
  function RoomCard({ hotel, room, selected, onChange }: any) {
    // Images: prefer room images, fallback to hotel images
    const images = (room.images && room.images.length > 0 ? room.images : hotel.images) || [];
    // Amenities: merge hotel and room amenities
    const amenities = [
      ...(hotel.amenities || []),
      ...(room.amenities || []),
    ];
    // Price logic
    const checkIn = selected.checkIn || room.check_in;
    const checkOut = selected.checkOut || room.check_out;
    // Correct nights calculation: difference in days
    const nights = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24);
    console.log('checkIn:', checkIn, 'checkOut:', checkOut, 'nights:', nights);
    // Base stay is the contract stay for this room
    const baseNights = (new Date(room.check_out).getTime() - new Date(room.check_in).getTime()) / (1000 * 60 * 60 * 24);
    const extraNights = Math.max(0, nights - baseNights);
    const basePrice = (room.total_price_per_stay_gbp_with_markup || room.total_price_per_stay_gbp || 0) * (selected.quantity || 1);
    const extraNightPrice = (room.extra_night_price_gbp || 0) * (selected.quantity || 1);
    const total = basePrice + extraNights * extraNightPrice;
    return (
      <Card className="mb-8 bg-[var(--color-card)]/95 py-0 border border-[var(--color-border)] shadow-lg rounded-2xl overflow-hidden min-h-[340px] h-full">
        <div className="flex flex-col md:flex-row h-full min-h-[340px] items-stretch">
          {/* Images Carousel */}
          <div className="md:w-[340px] w-full bg-black/10 flex-shrink-0 h-full min-h-[340px]">
            <Carousel className="w-full h-full">
              <CarouselContent className="h-full">
                {images.map((img: string, idx: number) => (
                  <CarouselItem key={idx} className="w-full h-full">
                    <img src={img} alt={room.room_type_id} className="w-full h-full object-cover md:rounded-l-2xl" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
          {/* Info & Controls */}
          <div className="flex-1 p-6 flex flex-col gap-4 justify-between h-full min-h-[340px]">
            {/* Top: Hotel Info */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex items-center gap-3">
                <Hotel className="h-6 w-6 text-[var(--color-primary-600)]" />
                <div>
                  <div className="font-bold text-xl text-[var(--color-foreground)] leading-tight">{hotel.name}</div>
                  <div className="text-xs text-[var(--color-muted-foreground)] font-medium">{hotel.brand} • {hotel.city}, {hotel.country}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(hotel.star_rating || 0)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400" />)}
                  </div>
                </div>
              </div>
              {/* Editable Dates */}
              <div className="flex flex-col items-end gap-1 min-w-[180px]">
                <div className="flex gap-2 items-center">
                  <div className="flex flex-col items-start">
                    <Label className="text-xs font-semibold mb-1">Check-in</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[120px] justify-start text-left font-normal">
                          {selected.checkIn ? format(new Date(selected.checkIn), 'dd/MM/yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <ShadCalendar
                          mode="single"
                          selected={selected.checkIn ? new Date(selected.checkIn) : undefined}
                          onSelect={date => {
                            if (!date) return;
                            onChange({ ...selected, checkIn: format(date, 'yyyy-MM-dd') });
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col items-start">
                    <Label className="text-xs font-semibold mb-1">Check-out</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[120px] justify-start text-left font-normal">
                          {selected.checkOut ? format(new Date(selected.checkOut), 'dd/MM/yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <ShadCalendar
                          mode="single"
                          selected={selected.checkOut ? new Date(selected.checkOut) : undefined}
                          onSelect={date => {
                            if (!date) return;
                            onChange({ ...selected, checkOut: format(date, 'yyyy-MM-dd') });
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
            {/* Room Info & Amenities */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-base text-[var(--color-foreground)]">{room.room_type_id}</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">Max {room.max_people || 2} people</Badge>
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)] mb-2">{room.description}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {amenities.map((a: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs font-medium px-2 py-0.5 bg-[var(--color-muted)]/40 border-none text-[var(--color-muted-foreground)]">{a}</Badge>
                  ))}
                </div>
              </div>
              {/* Quantity Selector */}
              <div className="flex flex-col items-end gap-1 min-w-[120px]">
                <Label className="text-xs font-semibold mb-1">Rooms</Label>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onChange({ ...selected, quantity: Math.max(1, selected.quantity - 1) })} disabled={selected.quantity <= 1}>-</Button>
                  <Input type="number" min={1} max={room.quantity_available || 1} value={selected.quantity} onChange={e => onChange({ ...selected, quantity: Math.max(1, Math.min(room.quantity_available || 1, parseInt(e.target.value) || 1)) })} className="w-14 text-center font-bold text-lg" />
                  <Button size="sm" variant="outline" onClick={() => onChange({ ...selected, quantity: Math.min(room.quantity_available || 1, selected.quantity + 1) })} disabled={selected.quantity >= (room.quantity_available || 1)} >+</Button>
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Available: {room.quantity_available || 1}</div>
              </div>
            </div>
            {/* Price Breakdown */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-2 border-t border-[var(--color-border)] pt-4">
              <div className="flex-1">
                <div className="text-xs text-[var(--color-muted-foreground)]">Base stay <span className="font-semibold">({baseNights} night{baseNights !== 1 ? 's' : ''})</span>:</div>
                <div className="font-bold text-lg text-[var(--color-primary)]">£{basePrice.toLocaleString()}</div>
                {extraNights > 0 && (
                  <div className="text-xs text-[var(--color-muted-foreground)]">Extra nights ({extraNights}): <span className="font-semibold">£{(extraNightPrice * extraNights).toLocaleString()}</span></div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xs text-[var(--color-muted-foreground)]">Total for this room</div>
                <div className="text-2xl font-extrabold text-[var(--color-primary)]">£{total.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return <div className="py-12 text-center text-[var(--color-muted-foreground)]">Loading hotel rooms...</div>;
  }
  if (!hotelRooms.length) {
    return <div className="py-12 text-center text-[var(--color-muted-foreground)]">No hotel rooms available for this event.</div>;
  }

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">Select Your Hotel Rooms</h3>
      {selectedRooms.map((sel, idx) => {
        const hotel = getHotel(sel.hotelId);
        const room = getRoom(sel.roomId);
        if (!hotel || !room) return null;
        return (
          <RoomCard
            key={sel.hotelId + sel.roomId}
            hotel={hotel}
            room={room}
            selected={sel}
            onChange={updated => {
              const newRooms = [...selectedRooms];
              newRooms[idx] = updated;
              setSelectedRooms(newRooms);
            }}
          />
        );
      })}
      {/* Add another room type if not all adults are covered and there are more room types */}
      {selectedRooms.length < hotelRooms.length && totalRooms < adults && (
        <Button
          variant="outline"
          onClick={handleAddRoom}
          className="rounded-xl px-5 py-2"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Another Room Type
        </Button>
      )}
    </div>
  );
} 