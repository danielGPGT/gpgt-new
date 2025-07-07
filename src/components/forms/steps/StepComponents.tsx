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
import { Switch } from '@/components/ui/switch';
import { Loader2, Ticket, Hotel, Car, Plane, Users, ArrowRight, CheckCircle, AlertCircle, Package, Star, Info, Calendar, Clock, Tag, Building, BedDouble, Plus, Minus } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { StepFlights, FlightSource, SelectedFlight } from './StepFlights';

interface PackageComponent {
  id: string;
  tier_id: string;
  event_id: string;
  component_type: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight' | 'lounge_pass';
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
  type: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight' | 'lounge_pass';
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
  },
  {
    type: 'lounge_pass',
    label: 'Lounge Passes',
    icon: Star, // Use a suitable icon
    description: 'Add airport lounge passes to your package',
    color: 'from-[var(--color-primary-800)] to-[var(--color-primary-900)]'
  },
];

export function StepComponents({ setCurrentStep, currentStep }: { setCurrentStep: (step: number) => void; currentStep: number }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = { setCurrentStep, currentStep };
  const { watch, setValue } = useFormContext();
  const selectedEvent = watch('selectedEvent');
  const selectedTier = watch('selectedTier');
  const selectedPackage = watch('selectedPackage');
  const adults = watch('travelers.adults') || 1;
  const components = watch('components') || { tickets: [], hotels: [], circuitTransfers: [], airportTransfers: [], flights: [], flightsSource: 'none' };

  const [packageComponents, setPackageComponents] = useState<PackageComponent[]>([]);
  const [availableTickets, setAvailableTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeComponent, setActiveComponent] = useState<'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight' | 'lounge_pass'>('ticket');
  
  // Use form state for toggles
  const circuitTransfersEnabled = watch('toggles.circuitTransfersEnabled') ?? true;
  const airportTransfersEnabled = watch('toggles.airportTransfersEnabled') ?? true;

  const loungePass = watch('components.loungePass') || { id: null, variant: 'none', price: 0 };

  const [loungePasses, setLoungePasses] = useState<any[]>([]);
  const [loungeLoading, setLoungeLoading] = useState(false);

  // Fetch package components for the selected tier
  useEffect(() => {
    if (!selectedTier?.id) return;
    setLoading(true);
    
    supabase
      .from('package_components')
      .select('*')
      .eq('tier_id', selectedTier.id)
      .then(({ data: packageComps }) => {
        console.log('[PACKAGE_COMPONENTS] Fetched package components:', packageComps);
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
    // --- TICKETS ---
    if (packageComponents.length > 0 && !components.tickets.length) {
      const ticketComponents = packageComponents.filter(comp => comp.component_type === 'ticket');
      if (ticketComponents.length > 0) {
        const ticketIds = ticketComponents.map(comp => comp.component_id);
        supabase
          .from('tickets')
          .select('*,ticket_category:ticket_categories(*)')
          .in('id', ticketIds)
          .eq('active', true)
          .then(({ data: tickets }) => {
            if (tickets && tickets.length > 0) {
              const initialTickets = tickets.map(ticket => ({
                id: ticket.id,
                quantity: adults || 1,
                price: ticket.price_with_markup || 0,
                category: ticket.ticket_category?.category_name || 'General',
                packageComponentId: ticketComponents.find(comp => comp.component_id === ticket.id)?.id
              }));
              setValue('components.tickets', initialTickets);
            }
          });
      }
    }

    // --- HOTEL ROOMS (unchanged) ---
    if (packageComponents.length > 0 && !components.hotels?.length) {
      const hotelRoomComponents = packageComponents.filter(comp => comp.component_type === 'hotel_room');
      console.log('[HOTEL_INIT] Found hotel room components:', hotelRoomComponents);
      if (hotelRoomComponents.length > 0) {
        const roomIds = hotelRoomComponents.map(comp => comp.component_id);
        supabase
          .from('hotel_rooms')
          .select('*')
          .in('id', roomIds)
          .eq('active', true)
          .then(({ data: rooms }) => {
            console.log('[HOTEL_INIT] Fetched rooms:', rooms);
            if (rooms && rooms.length > 0) {
              const initialRooms = rooms.map(room => {
                console.log('[HOTEL_INIT] Room:', room.id, 'check_in:', room.check_in, 'check_out:', room.check_out);
                return {
                  hotelId: room.hotel_id,
                  roomId: room.id,
                  quantity: 1,
                  checkIn: room.check_in,
                  checkOut: room.check_out,
                  packageComponentId: hotelRoomComponents.find(comp => comp.component_id === room.id)?.id
                };
              });
              console.log('[HOTEL_INIT] Setting initial rooms:', initialRooms);
              setValue('components.hotels', initialRooms);
            }
          });
      }
    }

    // --- CIRCUIT TRANSFERS (unchanged) ---
    if (circuitTransfersEnabled && packageComponents.length > 0 && !components.circuitTransfers?.length) {
      const circuitTransferComponents = packageComponents.filter(comp => comp.component_type === 'circuit_transfer');
      if (circuitTransferComponents.length > 0) {
        const transferIds = circuitTransferComponents.map(comp => comp.component_id);
        supabase
          .from('circuit_transfers')
          .select('*')
          .in('id', transferIds)
          .eq('active', true)
          .then(({ data: transfers }) => {
            if (transfers && transfers.length > 0) {
              const initialTransfers = transfers.map(transfer => ({
                id: transfer.id,
                quantity: adults || 1,
                price: transfer.sell_price_per_seat_gbp || 0,
                packageComponentId: circuitTransferComponents.find(comp => comp.component_id === transfer.id)?.id
              }));
              setValue('components.circuitTransfers', initialTransfers);
            }
          });
      }
    }

    // --- AIRPORT TRANSFERS ---
    if (airportTransfersEnabled && packageComponents.length > 0 && !components.airportTransfers?.length) {
      const airportTransferComponents = packageComponents.filter(comp => comp.component_type === 'airport_transfer');
      if (airportTransferComponents.length > 0) {
        const transferIds = airportTransferComponents.map(comp => comp.component_id);
        supabase
          .from('airport_transfers')
          .select('*')
          .in('id', transferIds)
          .eq('active', true)
          .then(({ data: transfers }) => {
            if (transfers && transfers.length > 0) {
              const initialTransfers = transfers.map(transfer => ({
                id: transfer.id,
                quantity: 1, // Default to 1 vehicle
                price: transfer.price_per_car_gbp_markup || 0,
                transferDirection: 'both' as const, // Default to both (outbound + return)
                packageComponentId: airportTransferComponents.find(comp => comp.component_id === transfer.id)?.id
              }));
              console.log('[AIRPORT TRANSFER INIT] Setting initial transfers:', initialTransfers);
              setValue('components.airportTransfers', initialTransfers);
            }
          });
      }
    }
  }, [packageComponents, adults, components.tickets.length, components.hotels?.length, components.circuitTransfers?.length, components.airportTransfers?.length, setValue, circuitTransfersEnabled, airportTransfersEnabled]);

  // Fetch lounge passes for the selected event
  useEffect(() => {
    if (!selectedEvent?.id) return;
    setLoungeLoading(true);
    supabase
      .from('lounge_passes')
      .select('*')
      .eq('event_id', selectedEvent.id)
      .eq('is_active', true)
      .order('sell_price', { ascending: true })
      .then(({ data }) => {
        setLoungePasses(data || []);
        setLoungeLoading(false);
      });
  }, [selectedEvent]);

  // Clamp ticket quantities if adults changes
  useEffect(() => {
    if (components.tickets.length > 0 && availableTickets.length > 0) {
      const updated = components.tickets.map((ticket: any) => {
        const ticketData = availableTickets.find((t: any) => t.id === ticket.id);
        const available = ticketData?.quantity_available ?? 1;
        const max = Math.min(adults || 1, available || 1);
        const clamped = Math.max(1, Math.min(ticket.quantity, max));
        console.log('[CLAMP] ticket', ticket.id, 'adults:', adults, 'available:', available, 'max:', max, 'clamped:', clamped, 'original price:', ticket.price);
        return {
          ...ticket,
          quantity: clamped,
          // Preserve the price from the original ticket
          price: ticket.price || 0,
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
    if (category && category.ticket_delivery_days !== null) {
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

  // Update toggle handlers to use setValue
  const handleCircuitTransfersToggle = (enabled: boolean) => {
    setValue('toggles.circuitTransfersEnabled', enabled);
    if (!enabled) {
      // Clear circuit transfers from form state
      setValue('components.circuitTransfers', []);
    } else {
      // When enabling, trigger a fresh fetch by clearing the array first
      // This will allow the useEffect to re-initialize with fresh data
      setValue('components.circuitTransfers', []);
    }
  };

  // Handle airport transfers toggle
  const handleAirportTransfersToggle = (enabled: boolean) => {
    setValue('toggles.airportTransfersEnabled', enabled);
    if (!enabled) {
      setValue('components.airportTransfers', []);
    }
  };

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
                    const priceEach = ticketData && Number.isFinite(ticketData.price_with_markup) ? ticketData.price_with_markup : (Number.isFinite(ticket.price) ? ticket.price : 0);
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

        {activeComponent === 'circuit_transfer' && (
          <CircuitTransfersTab
            adults={adults}
            selectedEvent={selectedEvent}
            selectedTier={selectedTier}
            setValue={setValue}
            enabled={circuitTransfersEnabled}
            onToggle={handleCircuitTransfersToggle}
          />
        )}

        {activeComponent === 'airport_transfer' && (
          <AirportTransfersTab
            adults={adults}
            selectedEvent={selectedEvent}
            selectedTier={selectedTier}
            setValue={setValue}
            enabled={airportTransfersEnabled}
            onToggle={handleAirportTransfersToggle}
          />
        )}

        {activeComponent === 'flight' && (
          <StepFlights
            adults={adults}
            eventId={selectedEvent?.id}
            value={components.flights || []}
            source={components.flightsSource || 'none'}
            onSourceChange={src => setValue('components.flightsSource', src)}
            onChange={flights => setValue('components.flights', flights)}
          />
        )}

        {activeComponent === 'lounge_pass' && (
          <LoungePassTab
            loungePasses={loungePasses}
            loading={loungeLoading}
            selected={loungePass}
            setValue={setValue}
          />
        )}

        {/* Other Components Placeholder */}
        {['ticket', 'hotel_room', 'circuit_transfer', 'airport_transfer', 'flight', 'lounge_pass'].indexOf(activeComponent) === -1 && (
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
    </div>
  );
}

function HotelRoomsTab({ adults, selectedEvent, setValue }: { adults: number, selectedEvent: any, setValue: any }) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use form state instead of local state
  const { watch } = useFormContext();
  const selectedRooms = watch('components.hotels') || [];

  useEffect(() => {
    async function fetchData() {
      console.log('[HOTEL_ROOMS_DEBUG] Starting fetchData...');
      console.log('[HOTEL_ROOMS_DEBUG] selectedEvent:', selectedEvent?.id);
      console.log('[HOTEL_ROOMS_DEBUG] current selectedRooms:', selectedRooms);
      
      setLoading(true);
      // Fetch hotel rooms for the event
      const { data: rooms } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('event_id', selectedEvent?.id)
        .eq('active', true);
      
      console.log('[HOTEL_ROOMS_DEBUG] fetched rooms:', rooms);
      
      // Fetch hotels for these rooms
      const hotelIds = rooms?.map((r: any) => r.hotel_id) || [];
      const { data: hotelsData } = await supabase
        .from('gpgt_hotels')
        .select('*')
        .in('id', hotelIds);
      
      console.log('[HOTEL_ROOMS_DEBUG] fetched hotels:', hotelsData);
      
      setHotelRooms(rooms || []);
      setHotels(hotelsData || []);
      setLoading(false);
      
      // Note: Default room selection is now handled in the main component initialization
      console.log('[HOTEL_ROOMS_DEBUG] Hotel rooms loaded, current selectedRooms:', selectedRooms);
    }
    if (selectedEvent?.id) fetchData();
  }, [selectedEvent, selectedRooms.length]);

  // Helper: get hotel for a room
  function getHotel(hotelId: string) {
    return hotels.find(h => h.id === hotelId);
  }
  // Helper: get room by id
  function getRoom(roomId: string) {
    return hotelRooms.find(r => r.id === roomId);
  }

  // Calculate total rooms selected
  const totalRooms = selectedRooms.reduce((sum: number, r: any) => sum + (r.quantity || 0), 0);

  // Add another room type (if not all adults are covered)
  function handleAddRoom() {
    // Find a room not already selected
    const selectedIds = selectedRooms.map((r: any) => r.roomId);
    const nextRoom = hotelRooms.find((r: any) => !selectedIds.includes(r.id));
    if (!nextRoom) return;
    const newRooms = [
      ...selectedRooms,
      {
        hotelId: nextRoom.hotel_id,
        roomId: nextRoom.id,
        quantity: 1,
        checkIn: nextRoom.check_in,
        checkOut: nextRoom.check_out,
      },
    ];
    setValue('components.hotels', newRooms);
  }

  // UI for each hotel room card
  function RoomCard({ hotel, room, selected, onChange }: any) {
    const [calendarKey, setCalendarKey] = useState(0);

    // Helper: Parse as local date (no UTC)
    function parseDate(dateString?: string) {
      if (!dateString) return undefined;
      return parse(dateString, 'yyyy-MM-dd', new Date());
    }

    // On mount, if no user selection, set to room defaults
    useEffect(() => {
      if (!room.check_in || !room.check_out) return;
      let changed = false;
      let newSelected = { ...selected };
      if (!selected.checkIn && room.check_in) {
        newSelected.checkIn = room.check_in;
        changed = true;
      }
      if (!selected.checkOut && room.check_out) {
        newSelected.checkOut = room.check_out;
        changed = true;
      }
      if (changed) {
        onChange(newSelected);
      }
      // Only run when room.id, room.check_in, or room.check_out changes
      // eslint-disable-next-line
    }, [room.id, room.check_in, room.check_out]);

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
    
    // Debug calendar dates
    console.log('[ROOM_CARD] Room:', room.id, 'checkIn:', checkIn, 'checkOut:', checkOut);
    console.log('[ROOM_CARD] Selected checkIn:', selected.checkIn, 'selected checkOut:', selected.checkOut);
    console.log('[ROOM_CARD] Room check_in:', room.check_in, 'room check_out:', room.check_out);
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
          <div className="flex-1 p-6 flex flex-col gap-0 justify-between h-full min-h-[340px] str">
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
              <div className="flex flex-col items-start gap-1 min-w-[180px]">
                <div className="flex gap-2 items-center">
                  {/* Check-in */}
                  <div className="flex flex-col items-start">
                    <label className="text-xs font-semibold mb-1">Check-in</label>
                    <DatePicker
                      selected={selected.checkIn ? new Date(selected.checkIn) : null}
                      onChange={date =>
                        onChange({ ...selected, checkIn: date ? date.toISOString().slice(0, 10) : null })
                      }
                      dateFormat="yyyy-MM-dd"
                      minDate={new Date()}
                      className="w-[120px] border rounded px-2 py-1"
                      placeholderText="Select date"
                    />
                  </div>
                  {/* Check-out */}
                  <div className="flex flex-col items-start">
                    <label className="text-xs font-semibold mb-1">Check-out</label>
                    <DatePicker
                      selected={selected.checkOut ? new Date(selected.checkOut) : null}
                      onChange={date =>
                        onChange({ ...selected, checkOut: date ? date.toISOString().slice(0, 10) : null })
                      }
                      dateFormat="yyyy-MM-dd"
                      minDate={selected.checkIn ? new Date(selected.checkIn) : new Date()}
                      className="w-[120px] border rounded px-2 py-1"
                      placeholderText="Select date"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Room Info & Amenities */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-16">
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
      {selectedRooms.map((sel: any, idx: number) => {
        const hotel = getHotel(sel.hotelId);
        const room = getRoom(sel.roomId);
        if (!hotel || !room) return null;
        return (
          <RoomCard
            key={sel.hotelId + sel.roomId}
            hotel={hotel}
            room={room}
            selected={sel}
            onChange={(updated: any) => {
              const newRooms = [...selectedRooms];
              newRooms[idx] = updated;
              setValue('components.hotels', newRooms);
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

function CircuitTransfersTab({ adults, selectedEvent, selectedTier, setValue, enabled, onToggle }: { 
  adults: number, 
  selectedEvent: any, 
  selectedTier: any,
  setValue: any,
  enabled: boolean,
  onToggle: (enabled: boolean) => void
}) {
  const [circuitTransfers, setCircuitTransfers] = useState<any[]>([]);
  const [availableTransfers, setAvailableTransfers] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfers, setSelectedTransfers] = useState<any[]>([]);

  // Get selected hotel rooms to filter circuit transfers
  const { watch } = useFormContext();
  const selectedRooms = watch('components.hotels') || [];

  useEffect(() => {
    if (!enabled) {
      setSelectedTransfers([]);
      setValue('components.circuitTransfers', []);
      setLoading(false);
      return;
    }
    
    // Always fetch data when enabled, regardless of current state
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch circuit transfer components from the selected tier
        const { data: packageComps } = await supabase
          .from('package_components')
          .select('*')
          .eq('tier_id', selectedTier?.id)
          .eq('component_type', 'circuit_transfer');

        console.log('[CIRCUIT_TRANSFERS_DEBUG] packageComps:', packageComps);

        if (packageComps && packageComps.length > 0) {
          const transferIds = packageComps.map(comp => comp.component_id);
          
          // Fetch circuit transfer details
          const { data: transfers } = await supabase
            .from('circuit_transfers')
            .select('*')
            .in('id', transferIds)
            .eq('active', true);

          console.log('[CIRCUIT_TRANSFERS_DEBUG] transfers:', transfers);

          // Fetch hotels for these transfers
          const hotelIds = transfers?.map((t: any) => t.hotel_id).filter(Boolean) || [];
          const { data: hotelsData } = await supabase
            .from('gpgt_hotels')
            .select('*')
            .in('id', hotelIds);

          console.log('[CIRCUIT_TRANSFERS_DEBUG] hotelsData:', hotelsData);

          setCircuitTransfers(transfers || []);
          setHotels(hotelsData || []);

          // Initialize with default selections (only if not already initialized and enabled)
          if (transfers && transfers.length > 0 && enabled) {
            const currentTransfers = watch('components.circuitTransfers') || [];
            if (currentTransfers.length === 0) {
              const initialTransfers = transfers.map(transfer => ({
                id: transfer.id,
                quantity: adults || 1,
                price: transfer.sell_price_per_seat_gbp || 0,
                packageComponentId: packageComps.find(comp => comp.component_id === transfer.id)?.id
              }));
              setSelectedTransfers(initialTransfers);
              setValue('components.circuitTransfers', initialTransfers);
            } else {
              setSelectedTransfers(currentTransfers);
            }
          }
        }

        // Fetch all available circuit transfers for the event (for swapping)
        const { data: allTransfers } = await supabase
          .from('circuit_transfers')
          .select('*')
          .eq('event_id', selectedEvent?.id)
          .eq('active', true);

        console.log('[CIRCUIT_TRANSFERS_DEBUG] allTransfers:', allTransfers);

        setAvailableTransfers(allTransfers || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching circuit transfers:', error);
        setLoading(false);
      }
    }

    // Only fetch data if we have the required dependencies AND hotel rooms have been loaded
    console.log('[CIRCUIT_TRANSFERS_DEBUG] Checking conditions:', {
      hasEvent: !!selectedEvent?.id,
      hasTier: !!selectedTier?.id,
      hasRooms: selectedRooms.length > 0,
      selectedRooms,
      enabled
    });

    if (selectedEvent?.id && selectedTier?.id && selectedRooms.length > 0) {
      console.log('[CIRCUIT_TRANSFERS_DEBUG] All conditions met, fetching data...');
      fetchData();
    } else {
      console.log('[CIRCUIT_TRANSFERS_DEBUG] Conditions not met, setting loading to false');
      setLoading(false);
    }
  }, [selectedEvent, selectedTier, adults, setValue, selectedRooms, enabled]);

  // Filter available transfers based on selected hotel rooms
  const getCompatibleTransfers = () => {
    console.log('[CIRCUIT_TRANSFERS_DEBUG] getCompatibleTransfers called');
    console.log('[CIRCUIT_TRANSFERS_DEBUG] selectedRooms:', selectedRooms);
    console.log('[CIRCUIT_TRANSFERS_DEBUG] availableTransfers:', availableTransfers);
    
    if (selectedRooms.length === 0) {
      console.log('[CIRCUIT_TRANSFERS_DEBUG] No selected rooms, returning empty array');
      return [];
    }
    
    const selectedHotelIds = selectedRooms.map((room: any) => room.hotelId).filter(Boolean);
    console.log('[CIRCUIT_TRANSFERS_DEBUG] selectedHotelIds:', selectedHotelIds);
    
    const compatible = availableTransfers.filter(transfer => 
      selectedHotelIds.includes(transfer.hotel_id)
    );
    console.log('[CIRCUIT_TRANSFERS_DEBUG] compatible transfers:', compatible);
    
    return compatible;
  };

  // Helper: get hotel for a transfer
  function getHotel(hotelId: string) {
    return hotels.find(h => h.id === hotelId);
  }

  // Helper: get transfer by id
  function getTransfer(transferId: string) {
    return circuitTransfers.find(t => t.id === transferId);
  }

  // Calculate total seats selected
  const totalSeats = selectedTransfers.reduce((sum, t) => sum + (t.quantity || 0), 0);

  // Add another transfer type (if not all adults are covered)
  function handleAddTransfer() {
    const compatibleTransfers = getCompatibleTransfers();
    const selectedIds = selectedTransfers.map(t => t.id);
    const nextTransfer = compatibleTransfers.find((t: any) => !selectedIds.includes(t.id));
    
    if (!nextTransfer) return;
    
    const newTransfer = {
      id: nextTransfer.id,
      quantity: adults || 1,
      price: nextTransfer.sell_price_per_seat_gbp || 0,
      packageComponentId: null
    };
    
    const updated = [...selectedTransfers, newTransfer];
    setSelectedTransfers(updated);
    setValue('components.circuitTransfers', updated);
  }

  // Handle transfer change (swapping)
  function handleTransferChange(transferId: string, index: number) {
    const selectedTransfer = availableTransfers.find(t => t.id === transferId);
    if (!selectedTransfer) return;
    
    const updatedTransfers = [...selectedTransfers];
    updatedTransfers[index] = {
      ...updatedTransfers[index],
      id: transferId,
      quantity: adults || 1,
      price: selectedTransfer.sell_price_per_seat_gbp || 0
    };
    
    setSelectedTransfers(updatedTransfers);
    setValue('components.circuitTransfers', updatedTransfers);
  }

  // Handle quantity change
  function handleQuantityChange(quantity: number, index: number) {
    const updatedTransfers = [...selectedTransfers];
    updatedTransfers[index] = { ...updatedTransfers[index], quantity };
    setSelectedTransfers(updatedTransfers);
    setValue('components.circuitTransfers', updatedTransfers);
  }

  // Handle toggle change
  const handleToggleChange = (newEnabled: boolean) => {
    onToggle(newEnabled);
    if (newEnabled) {
      // When enabling, refetch data and reinitialize if needed
      setLoading(true);
      // The useEffect will handle the refetch
    } else {
      // When disabling, clear selections
      setSelectedTransfers([]);
      setValue('components.circuitTransfers', []);
    }
  };

  // UI for each circuit transfer card
  function TransferCard({ transfer, selected, onChange, index }: any) {
    const hotel = getHotel(transfer.hotel_id);
    const pricePerSeat = transfer.sell_price_per_seat_gbp || 0;
    const totalPrice = pricePerSeat * (selected.quantity || 1);
    const coachesRequired = Math.ceil((selected.quantity || 1) / transfer.coach_capacity);

    return (
      <Card className="mb-6 bg-[var(--color-card)]/95 py-0 border border-[var(--color-border)] shadow-lg rounded-2xl overflow-hidden">
        <div className="p-6">
          {/* Top row: Transfer Type Dropdown (left), Price (right) */}
          <div className="flex flex-row items-center justify-between mb-4 gap-3">
            <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
              <Label className="text-sm font-semibold text-[var(--color-foreground)] mr-2 min-w-[90px]">Transfer Type</Label>
              <Select
                value={transfer.id}
                onValueChange={(value) => onChange(value)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select transfer type" />
                </SelectTrigger>
                <SelectContent>
                  {getCompatibleTransfers()
                    .filter((t: any) => {
                      // Allow the current transfer id, but not any others already selected
                      const selectedIds = selectedTransfers.map((tr: any, i: number) => i !== index && tr.id).filter(Boolean);
                      return t.id === transfer.id || !selectedIds.includes(t.id);
                    })
                    .map((t: any) => {
                      const tHotel = getHotel(t.hotel_id);
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{tHotel?.name || 'Unknown Hotel'} - {t.transfer_type}</span>
                            <span className="text-[var(--color-muted-foreground)] ml-2">
                              £{t.sell_price_per_seat_gbp?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            {/* Price (top right) */}
            <div className="flex flex-col items-end flex-shrink-0 min-w-[120px]">
              <span className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-1">Total Price</span>
              <span className="text-2xl font-extrabold text-[var(--color-primary)]">
                £{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                £{pricePerSeat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per seat
              </span>
            </div>
          </div>

          {/* Second row: Transfer Info (left), Quantity, Remove (right) */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 w-full justify-between">
            {/* Left: Icon, hotel, details */}
            <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-700)] flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-lg text-[var(--color-foreground)] truncate">
                  {hotel?.name || 'Unknown Hotel'}
                </div>
                <div className="text-[var(--color-muted-foreground)] text-xs truncate">
                  {transfer.transfer_type} • {transfer.supplier || 'Standard'}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] mt-1">
                  <Users className="h-3 w-3" />
                  {transfer.coach_capacity} seats per coach
                  <span className="mx-1">•</span>
                  <Calendar className="h-3 w-3" />
                  {transfer.days} day{transfer.days !== 1 ? 's' : ''}
                  {transfer.expected_hours && (
                    <>
                      <span className="mx-1">•</span>
                      <Clock className="h-3 w-3" />
                      {transfer.expected_hours}h
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quantity Selector, Remove */}
            <div className="flex flex-row items-center gap-2 flex-shrink-0 justify-end">
              <Label htmlFor={`quantity-${transfer.id}`} className="text-xs font-semibold text-[var(--color-muted-foreground)] mr-2">
                Vehicles
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange((selected.quantity || 1) - 1, index)}
                disabled={(selected.quantity || 1) <= 1}
                className="w-8 h-8 p-0"
                tabIndex={-1}
              >
                -
              </Button>
              <Input
                id={`quantity-${transfer.id}`}
                type="number"
                value={selected.quantity || 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  handleQuantityChange(Number.isFinite(val) && val > 0 ? val : 1, index);
                }}
                min={1}
                max={10} // Reasonable max for vehicles
                className="w-12 text-center font-bold text-base bg-transparent border-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange((selected.quantity || 1) + 1, index)}
                disabled={(selected.quantity || 1) >= 10}
                className="w-8 h-8 p-0"
                tabIndex={-1}
              >
                +
              </Button>
              <span className="text-xs text-[var(--color-muted-foreground)] ml-2">
                Max: 10
              </span>
              {selectedTransfers.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 text-destructive"
                  aria-label="Remove transfer"
                  onClick={() => {
                    const updated = selectedTransfers.filter((_: any, i: number) => i !== index);
                    setSelectedTransfers(updated);
                    setValue('components.circuitTransfers', updated);
                  }}
                >
                  ×
                </Button>
              )}
            </div>
          </div>

          {/* Bottom row: Price breakdown */}
          <div className="mt-4 p-3 bg-[var(--color-muted)]/20 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--color-muted-foreground)]">Price Breakdown:</span>
              <div className="text-right">
                <div className="font-medium">
                  {selected.quantity || 1} seat{(selected.quantity || 1) !== 1 ? 's' : ''} × £{pricePerSeat.toFixed(2)}
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  {coachesRequired} coach{coachesRequired !== 1 ? 'es' : ''} required
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin h-8 w-8 text-[var(--color-muted-foreground)] mx-auto" />
          <p className="text-[var(--color-muted-foreground)]">Loading circuit transfers...</p>
        </div>
      </div>
    );
  }

  const compatibleTransfers = getCompatibleTransfers();

  if (selectedRooms.length === 0) {
    return (
      <Card className="text-center py-16 border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-card)] to-[var(--color-background)]">
        <CardContent>
          <div className="mx-auto w-16 h-16 bg-[var(--color-muted)] rounded-xl flex items-center justify-center mb-6">
            <Hotel className="h-8 w-8 text-[var(--color-muted-foreground)]" />
          </div>
          <h3 className="text-lg font-semibold mb-3 text-[var(--color-foreground)]">Select Hotel Rooms First</h3>
          <p className="text-[var(--color-muted-foreground)]">
            Please select hotel rooms in the Hotel Rooms tab to see available circuit transfers.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compatibleTransfers.length === 0) {
    return (
      <Card className="text-center py-16 border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-card)] to-[var(--color-background)]">
        <CardContent>
          <div className="mx-auto w-16 h-16 bg-[var(--color-muted)] rounded-xl flex items-center justify-center mb-6">
            <Car className="h-8 w-8 text-[var(--color-muted-foreground)]" />
          </div>
          <h3 className="text-lg font-semibold mb-3 text-[var(--color-foreground)]">No Circuit Transfers Available</h3>
          <p className="text-[var(--color-muted-foreground)]">
            No circuit transfers are available for the selected hotel rooms and event.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle for Circuit Transfers */}
      <Card className="bg-gradient-to-br from-[var(--color-card)] via-[var(--color-card)]/95 to-[var(--color-background)]/30 border border-[var(--color-border)] rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium text-[var(--color-foreground)]">Include Circuit Transfers</Label>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Transportation between venues and hotels
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggleChange}
            />
          </div>
        </CardContent>
      </Card>

      {!enabled ? (
        <Card className="bg-gradient-to-br from-[var(--color-card)]/50 to-[var(--color-background)]/20 border border-[var(--color-border)] rounded-2xl p-6">
          <CardContent className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-[var(--color-muted)] rounded-xl flex items-center justify-center mb-4">
              <Car className="h-8 w-8 text-[var(--color-muted-foreground)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[var(--color-foreground)]">Circuit Transfers Disabled</h3>
            <p className="text-[var(--color-muted-foreground)]">
              No circuit transfers will be included in your package.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <Car className="h-5 w-5 text-[var(--color-primary-600)]" />
              Circuit Transfers
            </h4>
            <Badge variant="secondary" className="text-sm">
              {selectedTransfers.length} selected
            </Badge>
          </div>

          {/* Transfer Cards */}
          <div className="space-y-4">
            {selectedTransfers.map((selectedTransfer: any, index: number) => {
              const transfer = getTransfer(selectedTransfer.id);
              if (!transfer) return null;
              
              return (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  selected={selectedTransfer}
                  onChange={(transferId: string) => handleTransferChange(transferId, index)}
                  index={index}
                />
              );
            })}
          </div>

          {/* Add/Remove Transfer Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            {/* Add Another Transfer Type */}
            {compatibleTransfers.length > selectedTransfers.length && (
              <Button
                type="button"
                variant="outline"
                disabled={totalSeats >= adults}
                onClick={handleAddTransfer}
                className="rounded-xl px-5 py-2"
              >
                + Add Another Transfer Type
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AirportTransfersTab({ adults, selectedEvent, selectedTier, setValue, enabled, onToggle }: { 
  adults: number, 
  selectedEvent: any, 
  selectedTier: any,
  setValue: any,
  enabled: boolean,
  onToggle: (enabled: boolean) => void
}) {
  const [airportTransfers, setAirportTransfers] = useState<any[]>([]);
  const [availableTransfers, setAvailableTransfers] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransfers, setSelectedTransfers] = useState<any[]>([]);

  // Get selected hotel rooms to filter airport transfers
  const { watch } = useFormContext();
  const selectedRooms = watch('components.hotels') || [];

  useEffect(() => {
    if (!enabled) {
      setSelectedTransfers([]);
      setValue('components.airportTransfers', []);
      setLoading(false);
      return;
    }
    
    // Always fetch data when enabled, regardless of current state
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch airport transfer components from the selected tier
        const { data: packageComps } = await supabase
          .from('package_components')
          .select('*')
          .eq('tier_id', selectedTier?.id)
          .eq('component_type', 'airport_transfer');
        if (packageComps && packageComps.length > 0) {
          const transferIds = packageComps.map(comp => comp.component_id);
          // Fetch airport transfer details
          const { data: transfers } = await supabase
            .from('airport_transfers')
            .select('*')
            .in('id', transferIds)
            .eq('active', true);
          // Fetch hotels for these transfers
          const hotelIds = transfers?.map((t: any) => t.hotel_id).filter(Boolean) || [];
          const { data: hotelsData } = await supabase
            .from('gpgt_hotels')
            .select('*')
            .in('id', hotelIds);
          setAirportTransfers(transfers || []);
          setHotels(hotelsData || []);
          // Initialize with default selections (only if not already initialized and enabled)
          if (transfers && transfers.length > 0 && enabled) {
            const currentTransfers = watch('components.airportTransfers') || [];
            if (currentTransfers.length === 0) {
              const initialTransfers = transfers.map(transfer => ({
                id: transfer.id,
                quantity: 1, // Default to 1 vehicle
                price: transfer.price_per_car_gbp_markup || 0,
                transferDirection: 'both' as const, // Default to both (outbound + return)
                packageComponentId: packageComps.find(comp => comp.component_id === transfer.id)?.id
              }));
              setSelectedTransfers(initialTransfers);
              setValue('components.airportTransfers', initialTransfers);
            } else {
              setSelectedTransfers(currentTransfers);
            }
          }
        }
        // Fetch all available airport transfers for the event (for swapping)
        const { data: allTransfers } = await supabase
          .from('airport_transfers')
          .select('*')
          .eq('event_id', selectedEvent?.id)
          .eq('active', true);
        setAvailableTransfers(allTransfers || []);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    }
    // Only fetch data if we have the required dependencies AND hotel rooms have been loaded
    if (selectedEvent?.id && selectedTier?.id && selectedRooms.length > 0) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [selectedEvent, selectedTier, setValue, selectedRooms, enabled]);

  // Filter available transfers based on selected hotel rooms
  const getCompatibleTransfers = () => {
    if (selectedRooms.length === 0) return [];
    const selectedHotelIds = selectedRooms.map((room: any) => room.hotelId).filter(Boolean);
    return availableTransfers.filter(transfer => 
      selectedHotelIds.includes(transfer.hotel_id)
    );
  };

  // Helper: get hotel for a transfer
  function getHotel(hotelId: string) {
    return hotels.find(h => h.id === hotelId);
  }

  // Helper: get transfer by id
  function getTransfer(transferId: string) {
    return airportTransfers.find(t => t.id === transferId);
  }

  // Calculate total vehicles selected
  const totalVehicles = selectedTransfers.reduce((sum, t) => sum + (t.quantity || 0), 0);
  // Calculate total capacity across all selected vehicles
  const totalCapacity = selectedTransfers.reduce((sum, t) => {
    const transfer = getTransfer(t.id);
    return sum + ((transfer?.max_capacity || 0) * (t.quantity || 0));
  }, 0);

  // Add another transfer type
  function handleAddTransfer() {
    const compatibleTransfers = getCompatibleTransfers();
    const selectedIds = selectedTransfers.map(t => t.id);
    const nextTransfer = compatibleTransfers.find((t: any) => !selectedIds.includes(t.id));
    if (!nextTransfer) return;
    const newTransfer = {
      id: nextTransfer.id,
      quantity: 1, // Default to 1 vehicle
      price: nextTransfer.price_per_car_gbp_markup || 0,
      transferDirection: 'both' as const, // Default to both (outbound + return)
      packageComponentId: null
    };
    const updated = [...selectedTransfers, newTransfer];
    setSelectedTransfers(updated);
    setValue('components.airportTransfers', updated);
  }

  // Handle transfer change (swapping)
  function handleTransferChange(transferId: string, index: number) {
    const selectedTransfer = availableTransfers.find(t => t.id === transferId);
    if (!selectedTransfer) return;
    const updatedTransfers = [...selectedTransfers];
    updatedTransfers[index] = {
      ...updatedTransfers[index],
      id: transferId,
      quantity: 1, // Reset to 1 vehicle when changing transfer type
      price: selectedTransfer.price_per_car_gbp_markup || 0,
      transferDirection: updatedTransfers[index].transferDirection || 'outbound' // Preserve existing direction
    };
    setSelectedTransfers(updatedTransfers);
    setValue('components.airportTransfers', updatedTransfers);
  }

  // Handle quantity change
  function handleQuantityChange(quantity: number, index: number) {
    const updatedTransfers = [...selectedTransfers];
    updatedTransfers[index] = { ...updatedTransfers[index], quantity };
    setSelectedTransfers(updatedTransfers);
    setValue('components.airportTransfers', updatedTransfers);
  }

  // Handle toggle change
  const handleToggleChange = (newEnabled: boolean) => {
    onToggle(newEnabled);
    if (newEnabled) {
      // When enabling, refetch data and reinitialize if needed
      setLoading(true);
      // The useEffect will handle the refetch
    } else {
      // When disabling, clear selections
      setSelectedTransfers([]);
      setValue('components.airportTransfers', []);
    }
  };

  // UI for each airport transfer card
  function TransferCard({ transfer, selected, onChange, index }: any) {
    const hotel = getHotel(transfer.hotel_id);
    const pricePerVehicle = transfer.price_per_car_gbp_markup || 0;
    const transferDirection = selected.transferDirection || 'outbound';
    const directionMultiplier = transferDirection === 'both' ? 2 : 1;
    // For 'both', we need quantity * 2 transfers (e.g., 2 vehicles = 2 outbound + 2 return = 4 total)
    const totalTransfers = (selected.quantity || 1) * directionMultiplier;
    const totalPrice = pricePerVehicle * totalTransfers; // Price doubles when 'both' is selected
    const vehicleCapacity = transfer.max_capacity || 0;
    const totalCapacityForThisTransfer = vehicleCapacity * totalTransfers; // Capacity based on doubled quantity
    return (
      <Card className="mb-6 bg-[var(--color-card)]/95 py-0 border border-[var(--color-border)] shadow-lg rounded-2xl overflow-hidden">
        <div className="p-6">
          {/* Top row: Transfer Type Dropdown (left), Price (right) */}
          <div className="flex flex-row items-center justify-between mb-4 gap-3">
            <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
              <Label className="text-sm font-semibold text-[var(--color-foreground)] mr-2 min-w-[90px]">Transfer Type</Label>
              <Select
                value={transfer.id}
                onValueChange={(value) => onChange(value)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select transfer type" />
                </SelectTrigger>
                <SelectContent>
                  {getCompatibleTransfers()
                    .filter((t: any) => {
                      // Allow the current transfer id, but not any others already selected
                      const selectedIds = selectedTransfers.map((tr: any, i: number) => i !== index && tr.id).filter(Boolean);
                      return t.id === transfer.id || !selectedIds.includes(t.id);
                    })
                    .map((t: any) => {
                      const tHotel = getHotel(t.hotel_id);
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{tHotel?.name || 'Unknown Hotel'} - {t.transport_type}</span>
                            <span className="text-[var(--color-muted-foreground)] ml-2">
                              £{t.price_per_car_gbp_markup?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            {/* Price (top right) */}
            <div className="flex flex-col items-end flex-shrink-0 min-w-[120px]">
              <span className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-1">Total Price</span>
              <span className="text-2xl font-extrabold text-[var(--color-primary)]">
                £{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                £{pricePerVehicle.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per vehicle
                {directionMultiplier > 1 && ` × ${directionMultiplier} (${transferDirection})`}
              </span>
            </div>
          </div>

          {/* Transfer Direction Badges - placed under transfer type */}
          <div className="mb-4">
            <Label className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-2 block">Transfer Direction</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const updated = { ...selected, transferDirection: 'outbound' as const };
                  console.log('[AIRPORT_TRANSFER] Direction changed: outbound for transfer:', transfer.id);
                  setSelectedTransfers(prev => {
                    const newTransfers = [...prev];
                    newTransfers[index] = updated;
                    console.log('[AIRPORT_TRANSFER] Updated transfers:', newTransfers);
                    setValue('components.airportTransfers', newTransfers);
                    return newTransfers;
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  transferDirection === 'outbound'
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
                }`}
              >
                Outbound
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...selected, transferDirection: 'return' as const };
                  console.log('[AIRPORT_TRANSFER] Direction changed: return for transfer:', transfer.id);
                  setSelectedTransfers(prev => {
                    const newTransfers = [...prev];
                    newTransfers[index] = updated;
                    console.log('[AIRPORT_TRANSFER] Updated transfers:', newTransfers);
                    setValue('components.airportTransfers', newTransfers);
                    return newTransfers;
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  transferDirection === 'return'
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
                }`}
              >
                Return
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...selected, transferDirection: 'both' as const };
                  console.log('[AIRPORT_TRANSFER] Direction changed: both for transfer:', transfer.id);
                  setSelectedTransfers(prev => {
                    const newTransfers = [...prev];
                    newTransfers[index] = updated;
                    console.log('[AIRPORT_TRANSFER] Updated transfers:', newTransfers);
                    setValue('components.airportTransfers', newTransfers);
                    return newTransfers;
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  transferDirection === 'both'
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
                }`}
              >
                Both (×2)
              </button>
            </div>
          </div>

                    {/* Second row: Transfer Info (left), Quantity, Remove (right) */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 w-full justify-between">
            {/* Left: Icon, hotel, details */}
            <div className="flex flex-row items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-secondary-600)] to-[var(--color-secondary-700)] flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-lg text-[var(--color-foreground)] truncate">
                  {hotel?.name || 'Unknown Hotel'}
                </div>
                <div className="text-[var(--color-muted-foreground)] text-xs truncate">
                  {transfer.transport_type} • {transfer.supplier || 'Standard'}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] mt-1">
                  <Users className="h-3 w-3" />
                  {vehicleCapacity} passengers per vehicle
                  <span className="mx-1">•</span>
                  <Tag className="h-3 w-3" />
                  {transfer.transport_type === 'hotel_chauffeur' ? 'Hotel Chauffeur' : 'Private Car'}
                </div>
              </div>
            </div>
            
            {/* Right: Quantity Selector, Remove */}
            <div className="flex flex-row items-center gap-2 flex-shrink-0 justify-end">
              <Label htmlFor={`quantity-${transfer.id}`} className="text-xs font-semibold text-[var(--color-muted-foreground)] mr-2">
                {transferDirection === 'both' ? 'Total Transfers' : 'Vehicles'}
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newTotalTransfers = Math.max(1, totalTransfers - directionMultiplier);
                  const newQuantity = Math.ceil(newTotalTransfers / directionMultiplier);
                  handleQuantityChange(newQuantity, index);
                }}
                disabled={totalTransfers <= directionMultiplier}
                className="w-8 h-8 p-0"
                tabIndex={-1}
              >
                -
              </Button>
              <Input
                id={`quantity-${transfer.id}`}
                type="number"
                value={totalTransfers}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  const newTotalTransfers = Number.isFinite(val) && val > 0 ? val : 1;
                  const newQuantity = Math.ceil(newTotalTransfers / directionMultiplier);
                  handleQuantityChange(newQuantity, index);
                }}
                min={1}
                max={10 * directionMultiplier} // Reasonable max for total transfers
                className="w-12 text-center font-bold text-base bg-transparent border-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newTotalTransfers = Math.min(10 * directionMultiplier, totalTransfers + directionMultiplier);
                  const newQuantity = Math.ceil(newTotalTransfers / directionMultiplier);
                  handleQuantityChange(newQuantity, index);
                }}
                disabled={totalTransfers >= 10 * directionMultiplier}
                className="w-8 h-8 p-0"
                tabIndex={-1}
              >
                +
              </Button>
              <span className="text-xs text-[var(--color-muted-foreground)] ml-2">
                Max: {10 * directionMultiplier}
              </span>
              {selectedTransfers.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0 text-destructive"
                  aria-label="Remove transfer"
                  onClick={() => {
                    const updated = selectedTransfers.filter((_: any, i: number) => i !== index);
                    setSelectedTransfers(updated);
                    setValue('components.airportTransfers', updated);
                  }}
                >
                  ×
                </Button>
              )}
            </div>
          </div>
          {/* Bottom row: Price breakdown and capacity info */}
          <div className="mt-4 p-3 bg-[var(--color-muted)]/20 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--color-muted-foreground)]">Price Breakdown:</span>
              <div className="text-right">
                <div className="font-medium">
                  {selected.quantity || 1} vehicle{(selected.quantity || 1) !== 1 ? 's' : ''} × {directionMultiplier} direction{directionMultiplier > 1 ? 's' : ''} × £{pricePerVehicle.toFixed(2)}
                </div>

                {transferDirection === 'both' && (
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    (Covers both outbound and return)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin h-8 w-8 text-[var(--color-muted-foreground)] mx-auto" />
          <p className="text-[var(--color-muted-foreground)]">Loading airport transfers...</p>
        </div>
      </div>
    );
  }

  const compatibleTransfers = getCompatibleTransfers();

  if (selectedRooms.length === 0) {
    return (
      <Card className="text-center py-16 border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-card)] to-[var(--color-background)]">
        <CardContent>
          <div className="mx-auto w-16 h-16 bg-[var(--color-muted)] rounded-xl flex items-center justify-center mb-6">
            <Hotel className="h-8 w-8 text-[var(--color-muted-foreground)]" />
          </div>
          <h3 className="text-lg font-semibold mb-3 text-[var(--color-foreground)]">Select Hotel Rooms First</h3>
          <p className="text-[var(--color-muted-foreground)]">
            Please select hotel rooms in the Hotel Rooms tab to see available airport transfers.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compatibleTransfers.length === 0) {
    return (
      <Card className="text-center py-16 border border-[var(--color-border)] bg-gradient-to-b from-[var(--color-card)] to-[var(--color-background)]">
        <CardContent>
          <div className="mx-auto w-16 h-16 bg-[var(--color-muted)] rounded-xl flex items-center justify-center mb-6">
            <Car className="h-8 w-8 text-[var(--color-muted-foreground)]" />
          </div>
          <h3 className="text-lg font-semibold mb-3 text-[var(--color-foreground)]">No Airport Transfers Available</h3>
          <p className="text-[var(--color-muted-foreground)]">
            No airport transfers are available for the selected hotel rooms and event.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle for Airport Transfers */}
      <Card className="bg-gradient-to-br from-[var(--color-card)] via-[var(--color-card)]/95 to-[var(--color-background)]/30 border border-[var(--color-border)] rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium text-[var(--color-foreground)]">Include Airport Transfers</Label>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Transportation to/from airport
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggleChange}
            />
          </div>
        </CardContent>
      </Card>

      {!enabled ? (
        <Card className="bg-gradient-to-br from-[var(--color-card)]/50 to-[var(--color-background)]/20 border border-[var(--color-border)] rounded-2xl p-6">
          <CardContent className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-[var(--color-muted)] rounded-xl flex items-center justify-center mb-4">
              <Car className="h-8 w-8 text-[var(--color-muted-foreground)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[var(--color-foreground)]">Airport Transfers Disabled</h3>
            <p className="text-[var(--color-muted-foreground)]">
              No airport transfers will be included in your package.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <Car className="h-5 w-5 text-[var(--color-secondary-600)]" />
              Airport Transfers
            </h4>
            <Badge variant="secondary" className="text-sm">
              {selectedTransfers.length} selected
            </Badge>
          </div>
          {/* Capacity Summary */}
          <div className="p-4 bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/20 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Capacity Summary:</span>
              <div className="text-right">
                <div className="font-medium">
                  {totalVehicles} vehicle{totalVehicles !== 1 ? 's' : ''} • {totalCapacity} total capacity
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">
                  {adults} passengers to accommodate
                </div>
                {totalCapacity < adults && (
                  <div className="text-xs text-orange-600 font-medium">
                    ⚠️ Need more vehicles for all passengers
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Transfer Cards */}
          <div className="space-y-4">
            {selectedTransfers.map((selectedTransfer: any, index: number) => {
              const transfer = getTransfer(selectedTransfer.id);
              if (!transfer) return null;
              return (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  selected={selectedTransfer}
                  onChange={(transferId: string) => handleTransferChange(transferId, index)}
                  index={index}
                />
              );
            })}
          </div>
          {/* Add/Remove Transfer Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            {/* Add Another Transfer Type */}
            {compatibleTransfers.length > selectedTransfers.length && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTransfer}
                className="rounded-xl px-5 py-2"
              >
                + Add Another Transfer Type
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
} 

// Helper: Parse as local date (no UTC)
function parseDate(dateString?: string) {
  if (!dateString) return undefined;
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

// Add LoungePassTab component
function LoungePassTab({ loungePasses, loading, selected, setValue }: { loungePasses: any[], loading: boolean, selected: any, setValue: any }) {
  // Get number of adults from form context
  const { watch } = useFormContext();
  const adults = watch('travelers.adults') || 1;
  // Default quantity logic
  const quantity = selected?.quantity || adults;
  // Helper to update lounge pass selection
  const handleSelect = (lp: any) => {
    setValue('components.loungePass', { id: lp.id, variant: lp.variant, price: lp.sell_price, currency: lp.currency, quantity: quantity });
  };
  // Helper to update quantity
  const handleQuantityChange = (newQty: number) => {
    if (selected && selected.id) {
      setValue('components.loungePass', { ...selected, quantity: newQty });
    }
  };
  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">Select Lounge Pass</h3>
      {loading ? (
        <div className="py-12 text-center text-[var(--color-muted-foreground)]">Loading lounge passes...</div>
      ) : (
        <div className="space-y-4">
          <Card
            className={`cursor-pointer py-0 border-2 ${!selected?.id ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'} transition-all`}
            onClick={() => setValue('components.loungePass', { id: null, variant: 'none', price: 0, quantity: 0 })}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <Star className="h-6 w-6 text-[var(--color-muted-foreground)]" />
              <div className="flex-1">
                <div className="font-semibold text-lg text-[var(--color-foreground)]">No Lounge Pass</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Do not include a lounge pass in this package</div>
              </div>
              {!selected?.id && <Badge variant="secondary">Selected</Badge>}
            </CardContent>
          </Card>
          {loungePasses.map((lp: any) => {
            const isSelected = selected?.id === lp.id;
            const selectedQty = isSelected ? (selected.quantity || adults) : adults;
            const totalPrice = lp.sell_price * selectedQty;
            return (
              <Card
                key={lp.id}
                className={`cursor-pointer border-2 ${isSelected ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'} transition-all`}
                onClick={() => handleSelect(lp)}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <Star className="h-6 w-6 text-[var(--color-primary)]" />
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-[var(--color-foreground)]">{lp.variant}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">{lp.notes || 'Lounge pass for this event'}</div>
                  </div>
                  {/* Quantity selector if selected */}
                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--color-muted-foreground)] mr-2">Quantity</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => { e.stopPropagation(); handleQuantityChange(Math.max(1, selectedQty - 1)); }}
                        disabled={selectedQty <= 1}
                        className="w-8 h-8 p-0"
                        tabIndex={-1}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={selectedQty}
                        onClick={e => e.stopPropagation()}
                        onChange={e => {
                          e.stopPropagation();
                          const val = parseInt(e.target.value, 10);
                          handleQuantityChange(Number.isFinite(val) && val > 0 ? Math.min(val, adults) : 1);
                        }}
                        min={1}
                        max={adults}
                        className="w-12 text-center font-bold text-base bg-transparent border-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => { e.stopPropagation(); handleQuantityChange(Math.min(adults, selectedQty + 1)); }}
                        disabled={selectedQty >= adults}
                        className="w-8 h-8 p-0"
                        tabIndex={-1}
                      >
                        +
                      </Button>
                      <span className="text-xs text-[var(--color-muted-foreground)] ml-2">Max: {adults}</span>
                    </div>
                  )}
                  <div className="text-xl font-bold text-[var(--color-primary)] ml-6">£{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  {isSelected && <Badge variant="secondary">Selected</Badge>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}