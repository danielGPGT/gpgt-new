import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { Loader2, Ticket, Hotel, Car, Plane, Users, ArrowRight, CheckCircle, AlertCircle, Package, Star, Info, Calendar, Clock, Tag, Building, BedDouble, Plus, Minus, HelpCircle } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { StepFlights, FlightSource, SelectedFlight } from './StepFlights';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { z } from 'zod';
import { toast } from 'sonner';
import CircuitTransfersTabV2 from './CircuitTransfersTabV2';
import AirportTransfersTabV2 from './AirportTransfersTabV2';

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
  is_provisional: boolean;
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

// Debounced effect hook
function useDebouncedEffect(effect: () => void | (() => void), deps: any[], delay: number) {
  const handler = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (handler.current) clearTimeout(handler.current);
    handler.current = setTimeout(() => {
      effect();
    }, delay);
    return () => {
      if (handler.current) clearTimeout(handler.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Zod schemas for transfer validation
const CircuitTransferSchema = z.object({
  id: z.string(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
  packageComponentId: z.string().optional().nullable(),
});
const AirportTransferSchema = z.object({
  id: z.string(),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
  transferDirection: z.enum(['outbound', 'return', 'both']),
  packageComponentId: z.string().optional().nullable(),
});

function validateAndSetCircuitTransfers(transfers: any[], setValue: any) {
  const result = z.array(CircuitTransferSchema).safeParse(transfers);
  if (result.success) {
    setValue('components.circuitTransfers', transfers);
  } else {
    toast.error('Invalid circuit transfer data. Please review your selections.');
    // Fallback: clear invalid transfers
    setValue('components.circuitTransfers', []);
  }
}
function validateAndSetAirportTransfers(transfers: any[], setValue: any) {
  const result = z.array(AirportTransferSchema).safeParse(transfers);
  if (result.success) {
    setValue('components.airportTransfers', transfers);
  } else {
    toast.error('Invalid airport transfer data. Please review your selections.');
    setValue('components.airportTransfers', []);
  }
}

export function StepComponents({ setCurrentStep, currentStep, showPrices, tickets, hotelRooms }: { setCurrentStep: (step: number) => void; currentStep: number; showPrices: boolean; tickets: any[]; hotelRooms: any[] }) {
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

  // Add state for all event transfers
  const [allCircuitTransfers, setAllCircuitTransfers] = useState<any[]>([]);
  const [allAirportTransfers, setAllAirportTransfers] = useState<any[]>([]);

  // Add state for all hotels (for lookup)
  const [allHotels, setAllHotels] = useState<any[]>([]);

  // Add state for all hotel rooms (for robust global quantity logic)
  const [allHotelRooms, setAllHotelRooms] = useState<any[]>([]);

  // Fetch all hotels for the event (for lookup)
  useEffect(() => {
    if (!selectedEvent?.id) {
      setAllHotels([]);
      return;
    }
    supabase
      .from('hotels')
      .select('id, name')
      .eq('event_id', selectedEvent.id)
      .then(({ data }) => setAllHotels(data || []));
  }, [selectedEvent?.id]);

  // Fetch all hotel rooms for the event (for robust global quantity logic)
  useEffect(() => {
    if (!selectedEvent?.id) {
      setAllHotelRooms([]);
      return;
    }
    supabase
      .from('hotel_rooms')
      .select('*')
      .eq('event_id', selectedEvent.id)
      .eq('active', true)
      .or('is_provisional.eq.true,quantity_available.gt.0')
      .then(({ data }) => setAllHotelRooms(data || []));
  }, [selectedEvent?.id]);

  // Memoize callback functions to prevent infinite re-renders
  const handleFlightSourceChange = useCallback((src: FlightSource) => {
    setValue('components.flightsSource', src);
  }, [setValue]);

  const handleFlightChange = useCallback((flights: SelectedFlight[]) => {
    setValue('components.flights', flights);
  }, [setValue]);

  // Clear components when tier changes
  useEffect(() => {
    if (selectedTier?.id) {
      // Clear all existing components when tier changes
      setValue('components.tickets', []);
      setValue('components.hotels', []);
      setValue('components.circuitTransfers', []);
      setValue('components.airportTransfers', []);
      setValue('components.flights', []);
      setValue('components.loungePass', { id: null, variant: 'none', price: 0 });
      console.log('[TIER_CHANGE] Cleared all components for new tier:', selectedTier.id);
    }
  }, [selectedTier?.id, setValue]);

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
      .or('is_provisional.eq.true,quantity_available.gt.0')
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
          .or('is_provisional.eq.true,quantity_available.gt.0')
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
    if (circuitTransfersEnabled && packageComponents.length > 0 && (!components.circuitTransfers || components.circuitTransfers.length === 0) && !components.noCircuitTransfer) {
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
              const selectedHotelId = (components.hotels && components.hotels.length === 1) ? components.hotels[0].hotelId : null;
              const initialTransfers = transfers.map(transfer => ({
                id: transfer.id,
                quantity: adults || 1,
                price: transfer.sell_price_per_seat_gbp || 0,
                packageComponentId: circuitTransferComponents.find(comp => comp.component_id === transfer.id)?.id,
                hotel_id: transfer.hotel_id || selectedHotelId
              }));
              setValue('components.circuitTransfers', initialTransfers);
            }
          });
      }
    }

    // --- AIRPORT TRANSFERS ---
    if (airportTransfersEnabled && packageComponents.length > 0 && !components.airportTransfers?.length && !components.noAirportTransfer) {
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
                id: String(transfer.id),
                quantity: 1,
                price: transfer.price_per_car_gbp_markup || 0,
                transferDirection: 'both' as const, // Default to both (outbound + return)
                packageComponentId: airportTransferComponents.find(comp => comp.component_id === transfer.id)?.id,
                hotel_id: transfer.hotel_id || (components.hotels && components.hotels[0] && components.hotels[0].hotelId) || null // fallback to selected hotel
              }));
              console.log('[AIRPORT TRANSFER INIT] Setting initial transfers:', initialTransfers);
              setValue('components.airportTransfers', initialTransfers);
            }
          });
      }
    }
  }, [packageComponents, adults, components.tickets.length, components.hotels?.length, components.circuitTransfers?.length, components.airportTransfers?.length, setValue, circuitTransfersEnabled, airportTransfersEnabled, components.noCircuitTransfer, components.noAirportTransfer]);

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

  // Add this effect to StepComponents to clean up transfers when hotel selection changes
  useEffect(() => {
    const selectedRooms = components.hotels || [];
    const selectedHotelIds = selectedRooms.map((room: any) => room.hotelId).filter(Boolean);

    // Clean up circuit transfers
    if (components.circuitTransfers && components.circuitTransfers.length > 0) {
      const validCircuitTransfers = components.circuitTransfers.filter((transfer: any) =>
        selectedHotelIds.includes(
          // Find the hotel_id for this transfer
          (() => {
            // Find the transfer in the availableTransfers (if available)
            // Fallback: use transfer.hotelId if present
            if (transfer.hotelId) return transfer.hotelId;
            // Otherwise, keep it (could not verify)
            return null;
          })()
        )
      );
      if (validCircuitTransfers.length !== components.circuitTransfers.length) {
        setValue('components.circuitTransfers', validCircuitTransfers);
      }
    }

    // Clean up airport transfers
    if (components.airportTransfers && components.airportTransfers.length > 0) {
      const validAirportTransfers = components.airportTransfers.filter((transfer: any) =>
        selectedHotelIds.includes(
          (() => {
            if (transfer.hotelId) return transfer.hotelId;
            return null;
          })()
        )
      );
      if (validAirportTransfers.length !== components.airportTransfers.length) {
        setValue('components.airportTransfers', validAirportTransfers);
      }
    }
  }, [components.hotels, setValue]);

  // --- MINIMAL ROBUST TRANSFER LOGIC ---
  // 1. Fetch all transfers for the event ONCE
  useEffect(() => {
    if (!selectedEvent?.id) {
      setAllCircuitTransfers([]);
      setAllAirportTransfers([]);
      return;
    }
    supabase
      .from('circuit_transfers')
      .select('*, gpgt_hotels(*)')
      .eq('event_id', selectedEvent.id)
      .eq('active', true)
      .then(({ data }) => setAllCircuitTransfers(data || []));
    supabase
      .from('airport_transfers')
      .select('*, gpgt_hotels(*)')
      .eq('event_id', selectedEvent.id)
      .eq('active', true)
      .then(({ data }) => setAllAirportTransfers(data || []));
  }, [selectedEvent?.id]);

  // 2. On hotel selection change, filter compatible transfers and remove invalid selections
  useEffect(() => {
    const selectedHotelIds = (components.hotels || []).map((room: any) => room.hotelId).filter(Boolean);

    // Filter compatible transfers
    const compatibleCircuitTransfers = allCircuitTransfers.filter((t: any) => selectedHotelIds.includes(t.hotel_id));
    const compatibleAirportTransfers = allAirportTransfers.filter((t: any) => selectedHotelIds.includes(t.hotel_id));

    // Remove any selected transfers that are no longer compatible
    const validSelectedCircuitTransfers = (components.circuitTransfers || []).filter((sel: any) =>
      compatibleCircuitTransfers.some((t: any) => t.id === sel.id)
    );
    const validSelectedAirportTransfers = (components.airportTransfers || []).filter((sel: any) =>
      compatibleAirportTransfers.some((t: any) => t.id === sel.id)
    );

    // Only update if changed
    if (validSelectedCircuitTransfers.length !== (components.circuitTransfers || []).length) {
      setValue('components.circuitTransfers', validSelectedCircuitTransfers);
    }
    if (validSelectedAirportTransfers.length !== (components.airportTransfers || []).length) {
      setValue('components.airportTransfers', validSelectedAirportTransfers);
    }
  }, [components.hotels, allCircuitTransfers, allAirportTransfers, setValue]);

  // Add a migration effect to patch all circuit transfers with hotel_id if missing
  useEffect(() => {
    const transfers = components.circuitTransfers || [];
    const selectedRooms = components.hotels || [];
    const selectedHotelId = selectedRooms.length === 1 ? selectedRooms[0].hotelId : null;
    const patchedTransfers = transfers.map((t: any) => ({
      ...t,
      hotel_id: t.hotel_id || selectedHotelId
    }));
    if (JSON.stringify(transfers) !== JSON.stringify(patchedTransfers)) {
      setValue('components.circuitTransfers', patchedTransfers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Find selected hotelId (from selected hotel room)
  const selectedHotelId = components.hotels && components.hotels.length > 0 ? components.hotels[0].hotelId : null;

  // Centralized quantity auto-adjustment for all components when adults changes
  useEffect(() => {
    // --- TICKETS ---
    if (Array.isArray(components.tickets)) {
      const updatedTickets = components.tickets.map((ticket: any) => {
        if (ticket.quantity !== adults) {
          return { ...ticket, quantity: adults };
        }
        return ticket;
      });
      if (JSON.stringify(updatedTickets) !== JSON.stringify(components.tickets)) {
        setValue('components.tickets', updatedTickets);
      }
    }
    // --- HOTEL ROOMS ---
    if (Array.isArray(components.hotels)) {
      let remaining = adults;
      const updatedRooms = components.hotels.map((roomSel: any) => {
        // Find the real room data from allHotelRooms
        const realRoom = allHotelRooms.find((r: any) => r.id === roomSel.roomId);
        const maxQty = realRoom?.is_provisional ? 1 : (realRoom?.quantity_available ?? roomSel.quantity_available ?? 1);
        const maxPeople = realRoom?.max_people ?? roomSel.max_people ?? 1;
        const neededQty = Math.min(maxQty, Math.ceil(remaining / maxPeople));
        const qty = Math.max(1, Math.min(neededQty, remaining > 0 ? neededQty : 0));
        remaining -= qty * maxPeople;
        if (roomSel.quantity !== qty) {
          return { ...roomSel, quantity: qty };
        }
        return roomSel;
      });
      if (JSON.stringify(updatedRooms) !== JSON.stringify(components.hotels)) {
        setValue('components.hotels', updatedRooms);
      }
    }
    // --- CIRCUIT TRANSFERS ---
    if (Array.isArray(components.circuitTransfers) && components.circuitTransfers.length > 0) {
      const updatedCircuitTransfers = components.circuitTransfers.map((transfer: any) => {
        if (transfer.quantity !== adults) {
          return { ...transfer, quantity: adults };
        }
        return transfer;
      });
      if (JSON.stringify(updatedCircuitTransfers) !== JSON.stringify(components.circuitTransfers)) {
        setValue('components.circuitTransfers', updatedCircuitTransfers);
      }
    }
    // --- AIRPORT TRANSFERS ---
    if (Array.isArray(components.airportTransfers) && components.airportTransfers.length > 0 && allAirportTransfers.length > 0) {
      const updatedAirportTransfers = components.airportTransfers.map((transfer: any) => {
        // Find the real transfer data
        const realTransfer = allAirportTransfers.find((t: any) => t.id === transfer.id);
        if (realTransfer && typeof realTransfer.max_capacity === 'number' && realTransfer.max_capacity > 0) {
          const neededQty = Math.max(1, Math.ceil(adults / realTransfer.max_capacity));
          if (transfer.quantity !== neededQty) {
            console.log('[AirportTransfer global effect] Updating quantity to', neededQty, 'for adults', adults, 'max_capacity', realTransfer.max_capacity);
            return { ...transfer, quantity: neededQty };
          }
        }
        // If realTransfer is missing or max_capacity is invalid, do NOT update quantity (leave as-is)
        return transfer;
      });
      if (JSON.stringify(updatedAirportTransfers) !== JSON.stringify(components.airportTransfers)) {
        setValue('components.airportTransfers', updatedAirportTransfers);
      }
    }
  }, [adults, allHotels, allHotelRooms, allAirportTransfers, allCircuitTransfers]);

  // Use the live tickets prop for rendering ticket info
  // Map form-selected tickets to live ticket data
  const ticketsWithLiveData = (components.tickets || []).map((sel: any) => ({
    ...sel,
    ...tickets.find((t: any) => t.id === sel.id)
  }));

  // Use the live hotelRooms prop for rendering hotel room info
  const hotelsWithLiveData = (components.hotels || []).map((sel: any) => ({
    ...sel,
    ...hotelRooms.find((r: any) => r.id === sel.roomId)
  }));

  // Debug: log hotelsWithLiveData to verify live data
  console.log('[StepComponents] hotelsWithLiveData:', hotelsWithLiveData);

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
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="w-6 h-6 p-0"
                onClick={() => {
                  setValue('travelers.adults', Math.max(1, adults - 1));
                  setValue('travelers.total', Math.max(1, adults - 1));
                }}
                disabled={adults <= 1}
                aria-label="Decrease adults"
              >
                -
              </Button>
              <Input
                type="number"
                min={1}
                max={20}
                value={adults}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  const newVal = Math.max(1, Math.min(20, isNaN(val) ? 1 : val));
                  setValue('travelers.adults', newVal);
                  setValue('travelers.total', newVal);
                }}
                className="w-10 text-center mx-1 font-bold h-6 px-1 py-0 text-xs"
                aria-label="Number of adults"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="w-6 h-6 p-0"
                onClick={() => {
                  setValue('travelers.adults', Math.min(20, adults + 1));
                  setValue('travelers.total', Math.min(20, adults + 1));
                }}
                disabled={adults >= 20}
                aria-label="Increase adults"
              >
                +
              </Button>
              adult{adults !== 1 ? 's' : ''}
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
                  {ticketsWithLiveData.map((ticket: any, index: number) => {
                    // Use the live ticket data for rendering
                    const available = ticket.quantity_available ?? 1;
                    const maxQuantityRaw = Math.max(1, Math.min(adults || 1, available || 1));
                    const maxQuantity = Number.isFinite(maxQuantityRaw) ? maxQuantityRaw : 1;
                    const ticketInfo = ticket ? getTicketInfo(ticket) : [];
                    const priceEach = Number.isFinite(ticket.price_with_markup) ? ticket.price_with_markup : (Number.isFinite(ticket.price) ? ticket.price : 0);
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
                                    .map((t: any) => (
                                      <SelectItem key={t.id} value={t.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{t.ticket_category?.category_name || 'General'}</span>
                                          {showPrices && <span className="text-[var(--color-muted-foreground)] ml-2">£{t.price_with_markup.toFixed(2)}</span>}
                                          {showPrices && <span className="text-xs text-[var(--color-muted-foreground)] ml-2">({t.quantity_available || 0} available)</span>}
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {/* Price (top right) */}
                            <div className="flex flex-col items-end flex-shrink-0 min-w-[120px]">
                              <span className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-1">Price</span>
                              {showPrices && <span className="text-2xl font-extrabold text-[var(--color-primary)]">£{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                              {showPrices && <span className="text-xs text-[var(--color-muted-foreground)]">£{priceEach.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each</span>}
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
                                  {ticket.ticket_category?.category_name || 'Ticket'}
                                </div>
                                <div className="text-[var(--color-muted-foreground)] text-xs truncate">
                                  {ticket.ticket_category?.category_type || 'General'}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] mt-1">
                                  <Tag className="h-3 w-3" />
                                  {ticket.ticket_type || 'Standard'}
                                  {ticket.ticket_days && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <Calendar className="h-3 w-3" /> {ticket.ticket_days}
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
                                Max: {maxQuantity} <span className="">
                                  {ticket.is_provisional ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="font-semibold text-orange-600">PTO</span>
                                        </TooltipTrigger>
                                        <TooltipContent>Provisional - Purchased to Order</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    `(${available} available)`
                                  )}
                                </span>
                              </span>
                              {ticket && ticketInfo.length > 0 && (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0" aria-label="Ticket info">
                                      <Info className="h-4 w-4" />
                                    </Button>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <div className="space-y-3">
                                      <h4 className="font-semibold text-[var(--color-foreground)]">
                                        {ticket.ticket_category?.category_name || 'Ticket'} Details
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
            showPrices={showPrices}
            hotelsWithLiveData={hotelsWithLiveData}
          />
        )}

        {activeComponent === 'circuit_transfer' && (
          <CircuitTransfersTabV2
            selectedTierId={selectedTier?.id}
            allHotels={allHotels}
            circuitTransfers={allCircuitTransfers}
            selectedHotelId={selectedHotelId}
            adults={adults}
            value={components.circuitTransfers && components.circuitTransfers.length > 0 ? {
              id: components.circuitTransfers[0].id,
              quantity: components.circuitTransfers[0].quantity
            } : null}
            onChange={val => {
              if (!val) {
                setValue('components.circuitTransfers', []);
                setValue('components.noCircuitTransfer', true);
              } else {
                const transfer = allCircuitTransfers.find(t => t.id === val.id);
                setValue('components.circuitTransfers', [{
                  id: val.id,
                  quantity: val.quantity,
                  price: transfer?.sell_price_per_seat_gbp || 0,
                  packageComponentId: null,
                  hotel_id: transfer?.hotel_id
                }]);
                setValue('components.noCircuitTransfer', false);
              }
            }}
          />
        )}

        {activeComponent === 'airport_transfer' && (
          <AirportTransfersTabV2
            allHotels={allHotels}
            airportTransfers={allAirportTransfers}
            selectedHotelId={selectedHotelId}
            adults={adults}
            value={components.airportTransfers && components.airportTransfers.length > 0 ? {
              id: components.airportTransfers[0].id,
              quantity: components.airportTransfers[0].quantity,
              transferDirection: components.airportTransfers[0].transferDirection || 'both',
            } : null}
            onChange={val => {
              if (!val) {
                setValue('components.airportTransfers', []);
                setValue('components.noAirportTransfer', true);
              } else {
                const transfer = allAirportTransfers.find(t => t.id === val.id);
                let quantity = val.quantity;
                if (transfer && typeof transfer.max_capacity === 'number' && transfer.max_capacity > 0) {
                  quantity = Math.max(1, Math.ceil(adults / transfer.max_capacity));
                  console.log('[AirportTransfer onChange] Setting quantity to', quantity, 'for adults', adults, 'max_capacity', transfer.max_capacity);
                } else {
                  quantity = Math.max(1, adults);
                  console.log('[AirportTransfer onChange] Fallback quantity to', quantity, 'for adults', adults);
                }
                setValue('components.airportTransfers', [{
                  id: val.id,
                  quantity,
                  price: transfer?.price_per_car_gbp_markup || 0,
                  transferDirection: val.transferDirection || 'both',
                  packageComponentId: null,
                  hotel_id: transfer?.hotel_id
                }]);
                setValue('components.noAirportTransfer', false);
              }
            }}
            noAirportTransfer={components.noAirportTransfer}
          />
        )}

        {activeComponent === 'flight' && (
          <StepFlights
            adults={adults}
            eventId={selectedEvent?.id}
            value={components.flights || []}
            source={components.flightsSource || 'none'}
            onSourceChange={handleFlightSourceChange}
            onChange={handleFlightChange}
          />
        )}

        {activeComponent === 'lounge_pass' && (
          <LoungePassTab
            loungePasses={loungePasses}
            loading={loungeLoading}
            selected={loungePass}
            setValue={setValue}
            showPrices={showPrices}
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

function HotelRoomsTab({ adults, selectedEvent, setValue, showPrices, hotelsWithLiveData }: { adults: number, selectedEvent: any, setValue: any, showPrices: boolean, hotelsWithLiveData: any[] }) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use form state instead of local state
  const { watch } = useFormContext();
  const selectedRooms = watch('components.hotels') || [];

  // Robust auto-fill: distribute adults across selected rooms
  useEffect(() => {
    if (!selectedRooms.length || !adults) return;
    // Get room data for all selected rooms
    const roomDatas = selectedRooms.map((sel: any) => getRoom(sel.roomId));
    let remaining = adults;
    const newSelectedRooms = selectedRooms.map((sel: any, idx: number) => {
      const room = roomDatas[idx];
      if (!room) return sel;
      const maxQty = room.is_provisional ? 1 : (room.quantity_available || 1);
      const maxPeople = room.max_people || 1;
      // How many rooms do we need of this type?
      const neededQty = Math.min(maxQty, Math.ceil(remaining / maxPeople));
      const qty = Math.max(1, Math.min(neededQty, remaining > 0 ? neededQty : 0));
      remaining -= qty * maxPeople;
      return { ...sel, quantity: qty };
    });
    // Only update if changed
    if (JSON.stringify(newSelectedRooms) !== JSON.stringify(selectedRooms)) {
      setValue('components.hotels', newSelectedRooms);
    }
  }, [adults, selectedRooms.length, selectedRooms.map((r: any) => r.roomId).join(','), hotelRooms]);

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
        .eq('active', true)
        .or('is_provisional.eq.true,quantity_available.gt.0');
      
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
    // Find a room not already selected (including provisional rooms)
    const selectedIds = selectedRooms.map((r: any) => r.roomId);
    const nextRoom = hotelRooms.find((r: any) => !selectedIds.includes(r.id));
    if (!nextRoom) return;
    // Calculate new total if we add this room
    const newTotalRooms = selectedRooms.reduce((sum: number, r: any) => sum + (r.quantity || 0), 0) + 1;
    if (newTotalRooms > adults) {
      toast.error('Total number of rooms cannot exceed number of adults.');
      return;
    }
    const newRooms = [
      ...selectedRooms,
      {
        hotelId: nextRoom.hotel_id,
        roomId: nextRoom.id,
        quantity: nextRoom.is_provisional ? 1 : 1, // Always start with 1, but provisional rooms will be locked to 1
        checkIn: nextRoom.check_in,
        checkOut: nextRoom.check_out,
      },
    ];
    setValue('components.hotels', newRooms);
  }

  // UI for each hotel room card
  function RoomCard({ hotel, room, selected, onChange, showPrices, idx, hotelsWithLiveData }: any) {
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
    // Calculate the max quantity for this room: can't exceed room.quantity_available, and total across all rooms can't exceed adults
    const otherRoomsTotal = selectedRooms.reduce((sum: number, r: any, i: number) => i === idx ? sum : sum + (r.quantity || 0), 0);
    const maxForThisRoom = room.is_provisional ? 1 : Math.max(1, Math.min(room.quantity_available || 1, adults - otherRoomsTotal));
    // Use live data if available
    const liveRoom = hotelsWithLiveData?.find((r: any) => r.roomId === room.id || r.id === room.id) || room;
    return (
      <Card className="mb-8 bg-[var(--color-card)]/95 py-0 border border-[var(--color-border)] shadow-lg rounded-2xl overflow-hidden min-h-[340px] h-full">
        <div className="grid grid-cols-1 md:grid-cols-12 h-full min-h-[340px]">
          {/* Images Carousel */}
          <div className="col-span-4 w-full flex-shrink-0 h-full min-h-[340px]">
            <Carousel className="w-full h-full [&>div]:h-full [&_[data-slot=carousel-content]]:h-full [&_[data-slot=carousel-content]>div]:h-full [&_[data-slot=carousel-content]>div]:-ml-0">
              <CarouselContent className="h-full">
                {images.map((img: string, idx: number) => (
                  <CarouselItem key={idx} className="w-full h-full pl-0">
                    <div className="w-full h-full">
                      <img src={img} alt={room.room_type_id} className="w-full h-full object-cover md:rounded-l-2xl" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10" />
              <CarouselNext className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10" />
            </Carousel>
          </div>
          {/* Info & Controls */}
          <div className="col-span-8 flex-1 p-6 flex flex-col gap-0 justify-between h-full min-h-[340px] str">
            {/* Top: Hotel Info */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex items-center gap-3">
      
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
                  {/* Show provisional status */}
                  {room.is_provisional && (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">
                      <span className="flex items-center gap-1">
                        <span>PTO</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Purchased to order - provisional availability</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                    </Badge>
                  )}
                  {/* Show bed_type and flexibility if present */}
                  {room.bed_type && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">Bed: {room.bed_type}</Badge>
                  )}
                  {room.flexibility && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">Flexibility: {room.flexibility}</Badge>
                  )}
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
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      if (selected.quantity <= 1) return;
                      onChange({ ...selected, quantity: Math.max(1, (selected.quantity || 1) - 1) });
                    }} 
                    disabled={selected.quantity <= 1 || room.is_provisional}
                  >
                    -
                  </Button>
                  <Input 
                    type="number" 
                    min={1} 
                    max={maxForThisRoom} 
                    value={selected.quantity || 1} 
                    onChange={e => {
                      if (room.is_provisional) return;
                      const val = parseInt(e.target.value, 10);
                      const newQty = Math.max(1, Math.min(room.quantity_available || 1, isNaN(val) ? 1 : val));
                      // Calculate what the new total would be if this room's quantity is changed
                      const otherRoomsTotal = selectedRooms.reduce((sum: number, r: any, i: number) => i === idx ? sum : sum + (r.quantity || 0), 0);
                      if (otherRoomsTotal + newQty > adults) {
                        toast.error('Total number of rooms cannot exceed number of adults.');
                        return;
                      }
                      onChange({ ...selected, quantity: newQty });
                    }} 
                    className="w-14 text-center font-bold text-lg" 
                    disabled={room.is_provisional}
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      if (room.is_provisional) return;
                      const otherRoomsTotal = selectedRooms.reduce((sum: number, r: any, i: number) => i === idx ? sum : sum + (r.quantity || 0), 0);
                      if (otherRoomsTotal + (selected.quantity + 1) > adults) {
                        toast.error('Total number of rooms cannot exceed number of adults.');
                        return;
                      }
                      onChange({ ...selected, quantity: Math.min(maxForThisRoom, (selected.quantity || 1) + 1) });
                    }} 
                    disabled={selected.quantity >= maxForThisRoom || room.is_provisional}
                  >
                    +
                  </Button>
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Available: {liveRoom.quantity_available ?? 1}</div>
              </div>
            </div>
            {/* Price Breakdown */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-2 border-t border-[var(--color-border)] pt-4">
              <div className="flex-1">
                <div className="text-xs text-[var(--color-muted-foreground)]">Base stay <span className="font-semibold">({baseNights} night{baseNights !== 1 ? 's' : ''})</span>:</div>
                <div className="flex items-center gap-2">
                  {showPrices && <div className="font-bold text-lg text-[var(--color-primary)]">£{basePrice.toLocaleString()}</div>}
                  <Badge variant="outline" className="text-xs px-2 py-0.5 text-[var(--color-primary)] font-semibold">
                    £{(room.total_price_per_stay_gbp_with_markup || room.total_price_per_stay_gbp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per room
                  </Badge>
                </div>
                {extraNights > 0 && (
                  <div className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-2">Extra nights ({extraNights}): <span className="font-semibold">£{(extraNightPrice * extraNights).toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-[var(--color-primary)] font-semibold">
                      £{(room.extra_night_price_gbp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per room per extra night
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xs text-[var(--color-muted-foreground)]">Total amount</div>
                {showPrices && <div className="text-2xl font-extrabold text-[var(--color-primary)]">£{total.toLocaleString()}</div>}
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
        // Find available rooms for swapping (not already selected except current)
        const selectedIds = selectedRooms.map((r: any) => r.roomId);
        const swapOptions = hotelRooms.filter((r: any) => r.id === sel.roomId || !selectedIds.includes(r.id));
        return (
          <div key={sel.hotelId + sel.roomId} className="mb-8">
            {/* Swap Room Dropdown */}
            <div className="mb-2 flex items-center gap-2">
              <Label className="text-xs font-semibold">Swap Room:</Label>
              <Select
                value={sel.roomId}
                onValueChange={roomId => {
                  const newRoom = getRoom(roomId);
                  if (!newRoom) return;
                  const newMax = newRoom.is_provisional ? 1 : (newRoom.quantity_available || 1);
                  const clampedQuantity = Math.max(1, Math.min(sel.quantity || 1, newMax));
                  const newRooms = [...selectedRooms];
                  newRooms[idx] = {
                    ...sel,
                    hotelId: newRoom.hotel_id,
                    roomId: newRoom.id,
                    checkIn: newRoom.check_in,
                    checkOut: newRoom.check_out,
                    quantity: clampedQuantity,
                  };
                  setValue('components.hotels', newRooms);
                }}
              >
                <SelectTrigger className="w-96">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {[...swapOptions]
                    .sort((a, b) => {
                      const aPrice = a.total_price_per_stay_gbp_with_markup ?? a.total_price_per_stay_gbp ?? 0;
                      const bPrice = b.total_price_per_stay_gbp_with_markup ?? b.total_price_per_stay_gbp ?? 0;
                      return aPrice - bPrice;
                    })
                    .map((opt: any) => {
                      const optHotel = getHotel(opt.hotel_id);
                      const price = opt.total_price_per_stay_gbp_with_markup ?? opt.total_price_per_stay_gbp ?? 0;
                      return (
                        <SelectItem key={opt.id} value={opt.id}>
                          {optHotel?.name || 'Unknown Hotel'} - {opt.room_type_id} - {opt.bed_type}
                          {' - £' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          {' - '}
                          {opt.is_provisional
                            ? <span className="text-orange-600 font-semibold">PTO</span>
                            : <>Qty: {opt.quantity_available ?? 1}</>
                          }
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {/* Delete Room Button */}
              {selectedRooms.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    const newRooms = selectedRooms.filter((_: any, i: number) => i !== idx);
                    setValue('components.hotels', newRooms);
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
            <RoomCard
              hotel={hotel}
              room={room}
              selected={sel}
              onChange={(updated: any) => {
                const newRooms = [...selectedRooms];
                newRooms[idx] = updated;
                setValue('components.hotels', newRooms);
              }}
              showPrices={showPrices}
              idx={idx}
              hotelsWithLiveData={hotelsWithLiveData}
            />
          </div>
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

function AirportTransfersTab({ adults, selectedEvent, selectedTier, setValue, enabled, onToggle, showPrices, allTransfers, selectedHotels, selectedTransfers, ...rest }: { 
  adults: number, 
  selectedEvent: any, 
  selectedTier: any,
  setValue: any,
  enabled: boolean,
  onToggle: (enabled: boolean) => void,
  showPrices: boolean,
  allTransfers: any[],
  selectedHotels: any[],
  selectedTransfers: any[]
}) {
  const safeSelectedTransfers = Array.isArray(selectedTransfers) ? selectedTransfers : [];
  const [lastSelectedTransfers, setLastSelectedTransfers] = useState<any[]>([]);
  const [availableTransfers, setAvailableTransfers] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);
  const isInitializingRef = useRef(false);

  // Always get selected hotel rooms from form context
  const { watch } = useFormContext();
  const selectedRooms = watch('components.hotels') || [];

  // Helper: get transfer by id (always from allTransfers)
  function getTransfer(transferId: string) {
    return allTransfers.find((t: any) => t.id === transferId);
  }

  // Auto-adjust airport transfer quantities based on adults and max_capacity
  useEffect(() => {
    if (!safeSelectedTransfers.length || !adults) return;
    const updatedTransfers = safeSelectedTransfers.map((sel: any) => {
      const transfer = getTransfer(sel.id);
      if (!transfer || !transfer.max_capacity) return sel;
      const maxCapacity = transfer.max_capacity;
      const autoQty = Math.max(1, Math.ceil(adults / maxCapacity));
      // Only auto-adjust if user hasn't changed it (i.e., if it's 1 or matches previous auto value)
      if (sel.quantity === 1 || sel.quantity === autoQty) {
        return { ...sel, quantity: autoQty };
      }
      return sel;
    });
    if (JSON.stringify(updatedTransfers) !== JSON.stringify(safeSelectedTransfers)) {
      setValue('components.airportTransfers', updatedTransfers);
    }
  }, [adults, safeSelectedTransfers, setValue]);

  // Fetch all available airport transfers for the event when tab is active or event changes
  useEffect(() => {
    let aborted = false;
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    if (!selectedEvent?.id) {
      setAvailableTransfers([]);
      setLoading(false);
      return;
    }
    async function fetchTransfers() {
      try {
        const { data: transfers, error: trErr } = await supabase
          .from('airport_transfers')
          .select('*')
          .eq('event_id', selectedEvent.id)
          .eq('active', true);
        if (trErr) throw trErr;
        if (aborted || fetchIdRef.current !== fetchId) return;
        setAvailableTransfers(transfers || []);
        setLoading(false);
      } catch (err: any) {
        if (aborted || fetchIdRef.current !== fetchId) return;
        setError(err.message || 'Failed to load airport transfers.');
        setAvailableTransfers([]);
        setLoading(false);
      }
    }
    fetchTransfers();
    return () => { aborted = true; };
  }, [selectedEvent?.id]);

  // Initialize airport transfers only after availableTransfers and selectedRooms are loaded and enabled is true
  useEffect(() => {
    if (!enabled) {
      setValue('components.airportTransfers', []);
      return;
    }
    if (selectedRooms.length > 0 && availableTransfers.length > 0) {
      const currentTransfers = watch('components.airportTransfers') || [];
      if ((!currentTransfers || currentTransfers.length === 0) && lastSelectedTransfers.length > 0) {
        // Restore previous selection, but ensure hotel_id is set
        validateAndSetAirportTransfers(
          lastSelectedTransfers.map(t => ({
            ...t,
            hotel_id: t.hotel_id || (selectedRooms.length === 1 ? selectedRooms[0].hotelId : null)
          })),
          setValue
        );
      } else if (!currentTransfers || currentTransfers.length === 0) {
        // Otherwise, initialize as before
        const initialTransfers = availableTransfers.map(transfer => ({
          id: String(transfer.id),
          quantity: 1,
          price: transfer.price_per_car_gbp_markup || 0,
          transferDirection: 'both' as const,
          packageComponentId: null,
          hotel_id: transfer.hotel_id || (selectedRooms.length === 1 ? selectedRooms[0].hotelId : null)
        }));
        validateAndSetAirportTransfers(initialTransfers, setValue);
      }
    }
  }, [enabled, selectedRooms, availableTransfers, setValue, watch, lastSelectedTransfers]);

  // Filter available transfers based on selected hotel rooms
  const getCompatibleTransfers = () => {
    if (selectedRooms.length === 0) return [];
    const selectedHotelIds = selectedRooms.map((room: any) => String(room.hotelId)).filter(Boolean);
    return availableTransfers.filter(transfer => selectedHotelIds.includes(String(transfer.hotel_id)));
  };

  // Defensive debug logs
  useEffect(() => {
    console.log('[DEBUG] availableTransfers (airport):', availableTransfers);
    console.log('[DEBUG] selectedRooms (airport):', selectedRooms);
    console.log('[DEBUG] compatibleTransfers (airport):', getCompatibleTransfers());
  }, [availableTransfers, selectedRooms]);

  // Helper: get hotel for a transfer
  function getHotel(hotelId: string) {
    return hotels.find(h => h.id === hotelId);
  }

  // Add another transfer type
  function handleAddTransfer() {
    const compatibleTransfers = getCompatibleTransfers();
    const selectedIds = safeSelectedTransfers.map(t => t.id);
    const nextTransfer = compatibleTransfers.find((t: any) => !selectedIds.includes(t.id));
    if (!nextTransfer) return;
    const newTransfer = {
      id: nextTransfer.id,
      quantity: 1, // Default to 1 vehicle per direction
      price: nextTransfer.price_per_car_gbp_markup || 0,
      transferDirection: 'both' as const, // Default to both (outbound + return)
      packageComponentId: null,
      hotel_id: nextTransfer.hotel_id || (selectedRooms.length === 1 ? selectedRooms[0].hotelId : null) // fallback
    };
    const updated = [...safeSelectedTransfers, newTransfer];
    setValue('components.airportTransfers', updated);
  }

  // Handle transfer change (swapping)
  function handleTransferChange(transferId: string, index: number) {
    const selectedTransfer = allTransfers.find((t: any) => t.id === transferId);
    console.log('[DEBUG] handleTransferChange called with:', transferId, 'at index', index, 'selectedTransfer:', selectedTransfer);
    if (!selectedTransfer) return;
    const updatedTransfers = [...safeSelectedTransfers];
    updatedTransfers[index] = {
      ...updatedTransfers[index],
      id: transferId,
      quantity: 1, // Reset to 1 vehicle per direction when changing transfer type
      price: selectedTransfer.price_per_car_gbp_markup || 0,
      transferDirection: updatedTransfers[index].transferDirection || 'outbound', // Preserve existing direction
      hotel_id: selectedTransfer.hotel_id || updatedTransfers[index].hotel_id || selectedRooms.length === 1 ? selectedRooms[0].hotelId : null // fallback
    };
    setValue('components.airportTransfers', updatedTransfers);
  }

  // Handle quantity change
  function handleQuantityChange(quantity: number, index: number) {
    const updatedTransfers = [...safeSelectedTransfers];
    updatedTransfers[index] = { ...updatedTransfers[index], quantity };
    setValue('components.airportTransfers', updatedTransfers);
  }

  // Handle toggle change
  const handleToggleChange = (newEnabled: boolean) => {
    if (!newEnabled) {
      setLastSelectedTransfers(safeSelectedTransfers); // Save current selection
      validateAndSetAirportTransfers([], setValue);
      isInitializingRef.current = false;
    }
    onToggle(newEnabled);
  };

  // Add or update this handler in AirportTransfersTab
  function handleDirectionChange(newDirection: string, index: number) {
    const updatedTransfers = [...safeSelectedTransfers];
    updatedTransfers[index] = {
      ...updatedTransfers[index],
      transferDirection: newDirection,
    };
    setValue('components.airportTransfers', updatedTransfers);
  }

  // UI for each airport transfer card
  function TransferCard({ transfer, selected, hotel, onChange, index, showPrices }: any) {
    // Robustly handle hotel prop (object or array)
    const resolvedHotel = Array.isArray(hotel) ? hotel[0] : hotel;
    console.log('[DEBUG] TransferCard hotel prop:', hotel, 'resolvedHotel:', resolvedHotel);
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
                  {allTransfers
                    .filter((t: any) => {
                      // Allow the current transfer id, but not any others already selected
                      const selectedIds = safeSelectedTransfers.map((tr: any, i: number) => i !== index && tr.id).filter(Boolean);
                      return t.id === transfer.id || !selectedIds.includes(t.id);
                    })
                    .map((t: any) => {
                      const tHotel = Array.isArray(t.gpgt_hotels) ? t.gpgt_hotels[0] : t.gpgt_hotels;
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{tHotel?.name || 'Unknown Hotel'} - {t.transport_type}</span>
                            {showPrices && <span className="text-[var(--color-muted-foreground)] ml-2">£{(t.price_per_car_gbp_markup || t.sell_price_per_seat_gbp)?.toFixed(2) || '0.00'}</span>}
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
              {showPrices && <span className="text-2xl font-extrabold text-[var(--color-primary)]">£{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
              {showPrices && <span className="text-xs text-[var(--color-muted-foreground)]">£{pricePerVehicle.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per vehicle per trip</span>}
              {directionMultiplier > 1 && ` × 2 trips (both ways)`}
            </div>
          </div>

          {/* Transfer Direction Badges - placed under transfer type */}
          <div className="mb-4">
            <Label className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-2 block">Transfer Direction</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDirectionChange('outbound', index)}
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
                onClick={() => handleDirectionChange('return', index)}
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
                onClick={() => handleDirectionChange('both', index)}
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
                  {resolvedHotel?.name || 'Unknown Hotel'}
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
                Vehicles per direction
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newQuantity = Math.max(1, (selected.quantity || 1) - 1);
                  handleQuantityChange(newQuantity, index);
                }}
                disabled={selected.quantity <= 1}
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
                  const newQuantity = Number.isFinite(val) && val > 0 ? val : 1;
                  handleQuantityChange(newQuantity, index);
                }}
                min={1}
                max={10}
                className="w-12 text-center font-bold text-base bg-transparent border-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newQuantity = Math.min(10, (selected.quantity || 1) + 1);
                  handleQuantityChange(newQuantity, index);
                }}
                disabled={selected.quantity >= 10}
                className="w-8 h-8 p-0"
                tabIndex={-1}
              >
                +
              </Button>
              <span className="text-xs text-[var(--color-muted-foreground)] ml-2">
                Max: 10
              </span>
              {safeSelectedTransfers.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove transfer"
                  onClick={() => {
                    const updatedTransfers = safeSelectedTransfers.filter((_: any, i: number) => i !== index);
                    setValue('components.airportTransfers', updatedTransfers);
                  }}
                >
                  ×
                </Button>
              )}
            </div>
          </div>
          {/* Bottom row: Price breakdown and capacity info */}
          {showPrices && (
            <div className="mt-4 p-3 bg-[var(--color-muted)]/20 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--color-muted-foreground)]">Price Breakdown:</span>
                <div className="text-right">
                  <div className="font-medium">
                    {selected.quantity || 1} vehicle{(selected.quantity || 1) !== 1 ? 's' : ''} × {directionMultiplier} trip{directionMultiplier > 1 ? 's' : ''} × £{pricePerVehicle.toFixed(2)}
                  </div>
                  {transferDirection === 'both' && (
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      (Covers both outbound and return)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
  if (error) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
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
            No airport transfers are available for the selected hotel(s) and event.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total vehicles and total capacity for summary
  const totalVehicles = safeSelectedTransfers.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const totalCapacity = safeSelectedTransfers.reduce((sum, t) => {
    const transfer = getTransfer(t.id);
    const vehicleCapacity = transfer ? transfer.max_capacity || 0 : 0;
    return sum + (t.quantity || 0) * vehicleCapacity;
  }, 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Switch checked={enabled} onCheckedChange={handleToggleChange} />
        <span className="font-medium">Include Airport Transfers</span>
      </div>
      {!enabled ? (
        <div className="p-4 text-center text-muted-foreground">
          No transfers will be included in your package.
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <Car className="h-5 w-5 text-[var(--color-secondary-600)]" />
              Airport Transfers
            </h4>
            <Badge variant="secondary" className="text-sm">
              {safeSelectedTransfers.length} selected
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
            {safeSelectedTransfers.map((selectedTransfer: any, index: number) => {
              const transfer = getTransfer(selectedTransfer.id);
              console.log('[DEBUG] Rendering card for selectedTransfer:', selectedTransfer, 'resolved transfer:', transfer);
              if (!transfer) return null;
              return (
                <TransferCard
                  key={transfer.id}
                  transfer={transfer}
                  selected={selectedTransfer}
                  hotel={getHotelFromTransfer(transfer)}
                  onChange={(transferId: string) => handleTransferChange(transferId, index)}
                  index={index}
                  showPrices={showPrices}
                />
              );
            })}
          </div>
          {/* Add/Remove Transfer Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            {/* Add Another Transfer Type */}
            {compatibleTransfers.length > safeSelectedTransfers.length && (
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

// Move getHotelFromTransfer above its first usage
function getHotelFromTransfer(transfer: any) {
  if (!transfer) return null;
  if (Array.isArray(transfer.gpgt_hotels)) return transfer.gpgt_hotels[0];
  return transfer.gpgt_hotels || null;
}

// Move LoungePassTab above its first usage
function LoungePassTab({ loungePasses, loading, selected, setValue, showPrices }: { loungePasses: any[], loading: boolean, selected: any, setValue: any, showPrices: boolean }) {
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
                  {showPrices && <div className="text-xl font-bold text-[var(--color-primary)] ml-6">£{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>}
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

// Utility function to robustly filter transfers by selected hotels
function filterTransfersByHotels(transfers: any[], selectedRooms: any[]): any[] {
  const selectedHotelIds = (selectedRooms || []).map(r => String(r.hotelId)).filter(Boolean);
  return (transfers || []).filter(t => selectedHotelIds.includes(String(t.hotel_id || t.hotelId)));
}