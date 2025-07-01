import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Plus, Edit, Trash2, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Package, CreditCard, Truck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { InventoryService } from '@/lib/inventoryService';
import type { Ticket, TicketInsert, TicketUpdate, Sport, Event, Venue, TicketCategory } from '@/types/inventory';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Utility to calculate price with markup
const calcPriceWithMarkup = (price: number, markup: number) =>
  parseFloat((price + price * (markup / 100)).toFixed(2));

// Zod schema for ticket form validation
const ticketFormSchema = z.object({
  event_id: z.string().uuid('Event is required'),
  ticket_category_id: z.string().uuid('Ticket category is required'),
  quantity_total: z.number().min(0, 'Quantity must be at least 0'),
  quantity_reserved: z.number().min(0, 'Reserved quantity must be at least 0').default(0),
  quantity_provisional: z.number().min(0, 'Provisional quantity must be at least 0').default(0),
  price: z.number().min(0, 'Price must be at least 0'),
  supplier_currency: z.string().min(1, 'Supplier currency is required'),
  supplier_price: z.number().min(0, 'Supplier price must be at least 0'),
  markup_percent: z.number().min(0).max(100, 'Markup must be between 0-100%').default(0),
  currency: z.string().min(1, 'Currency is required'),
  ticket_days: z.string().optional(),
  ticket_format: z.string().optional(),
  ticket_type: z.string().optional(),
  delivery_method: z.string().optional(),
  ticket_delivery_days: z.number().min(0).optional(),
  refundable: z.boolean().default(false),
  resellable: z.boolean().default(false),
  party_size_together: z.number().min(1).optional(),
  supplier: z.string().optional(),
  supplier_ref: z.string().optional(),
  distribution_channel: z.string().optional(),
  ordered: z.boolean().default(false),
  ordered_at: z.string().optional(),
  paid: z.boolean().default(false),
  paid_at: z.string().optional(),
  tickets_received: z.boolean().default(false),
  tickets_received_at: z.string().optional(),
  metadata: z.record(z.any()).optional(),
}).refine((data) => {
  if (data.ordered && !data.ordered_at) {
    return false;
  }
  if (data.paid && !data.paid_at) {
    return false;
  }
  if (data.tickets_received && !data.tickets_received_at) {
    return false;
  }
  return true;
}, {
  message: "Timestamps are required when status is checked",
  path: ["ordered_at", "paid_at", "tickets_received_at"]
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

export function TicketsManager() {
  const queryClient = useQueryClient();
  
  // State
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in_stock' | 'sold_out'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [confirmDeleteTicket, setConfirmDeleteTicket] = useState<Ticket | null>(null);
  
  // Sorting state
  const [sortKey, setSortKey] = useState<'category' | 'price' | 'quantity' | 'delivery' | 'dates'>('category');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Fetch data
  const { data: sports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn: () => InventoryService.getSports(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', selectedSport?.id],
    queryFn: () => selectedSport ? InventoryService.getEvents({ sport_id: selectedSport.id }) : InventoryService.getEvents(),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => InventoryService.getVenues(),
  });

  const { data: ticketCategories = [] } = useQuery({
    queryKey: ['ticket-categories', selectedEvent?.venue_id],
    queryFn: () => {
      if (selectedEvent?.venue_id) {
        return InventoryService.getTicketCategories({ venue_id: selectedEvent.venue_id });
      }
      return InventoryService.getTicketCategories();
    },
    enabled: true,
  });

  const { data: allTicketCategories = [] } = useQuery({
    queryKey: ['all-ticket-categories'],
    queryFn: () => InventoryService.getTicketCategories(),
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets', selectedEvent?.id, selectedCategory?.id],
    queryFn: () => {
      const filters: any = {};
      if (selectedEvent) filters.event_id = selectedEvent.id;
      if (selectedCategory) filters.ticket_category_id = selectedCategory.id;
      return InventoryService.getTickets(filters);
    },
  });

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: (data: TicketInsert) => InventoryService.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setTicketDrawerOpen(false);
      toast.success('Ticket created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create ticket: ${error.message}`);
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TicketUpdate }) => InventoryService.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setTicketDrawerOpen(false);
      setEditingTicket(null);
      toast.success('Ticket updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update ticket: ${error.message}`);
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setConfirmDeleteTicket(null);
      toast.success('Ticket deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete ticket: ${error.message}`);
    },
  });

  // Filtered and sorted tickets
  const filteredTickets = tickets.filter(ticket => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const categoryName = ticketCategories.find(cat => cat.id === ticket.ticket_category_id)?.category_name || '';
      const eventName = events.find(evt => evt.id === ticket.event_id)?.name || '';
      if (!categoryName.toLowerCase().includes(searchLower) && 
          !eventName.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Availability filter
    if (availabilityFilter === 'in_stock' && ticket.quantity_available <= 0) return false;
    if (availabilityFilter === 'sold_out' && ticket.quantity_available > 0) return false;

    return true;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let aValue: any, bValue: any;
    switch (sortKey) {
      case 'category':
        const aCategory = ticketCategories.find(cat => cat.id === a.ticket_category_id)?.category_name || '';
        const bCategory = ticketCategories.find(cat => cat.id === b.ticket_category_id)?.category_name || '';
        aValue = aCategory.toLowerCase();
        bValue = bCategory.toLowerCase();
        break;
      case 'price':
        aValue = a.price_with_markup || 0;
        bValue = b.price_with_markup || 0;
        break;
      case 'quantity':
        aValue = a.quantity_available || 0;
        bValue = b.quantity_available || 0;
        break;
      case 'delivery':
        aValue = a.delivery_method || '';
        bValue = b.delivery_method || '';
        break;
      case 'dates':
        aValue = a.available_from || '';
        bValue = b.available_from || '';
        break;
      default:
        aValue = '';
        bValue = '';
    }
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Reset filters when parent selection changes
  useEffect(() => {
    if (selectedSport && selectedEvent && selectedEvent.sport_id !== selectedSport.id) {
      setSelectedEvent(null);
    }
    if (selectedEvent && selectedVenue && selectedEvent.venue_id !== selectedVenue.id) {
      setSelectedVenue(null);
    }
  }, [selectedSport, selectedEvent, selectedVenue]);

  return (
    <div className="flex gap-6">
      {/* Filter Panel */}
      <div className="w-1/4 min-w-[300px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Sport Filter */}
            <div className="space-y-2">
              <Label>Sport</Label>
              <Select
                value={selectedSport?.id || 'all'}
                onValueChange={id => setSelectedSport(id === 'all' ? null : sports.find(s => s.id === id) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sports</SelectItem>
                  {sports.map(sport => (
                    <SelectItem key={sport.id} value={sport.id}>{sport.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Filter */}
            <div className="space-y-2">
              <Label>Event</Label>
              <Select
                value={selectedEvent?.id || 'all'}
                onValueChange={id => setSelectedEvent(id === 'all' ? null : events.find(e => e.id === id) || null)}
                disabled={!selectedSport}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Venue Filter */}
            <div className="space-y-2">
              <Label>Venue</Label>
              <Select
                value={selectedVenue?.id || 'all'}
                onValueChange={id => setSelectedVenue(id === 'all' ? null : venues.find(v => v.id === id) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All venues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All venues</SelectItem>
                  {venues.map(venue => (
                    <SelectItem key={venue.id} value={venue.id}>{venue.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ticket Category Filter */}
            <div className="space-y-2">
              <Label>Ticket Category</Label>
              <Select
                value={selectedCategory?.id || 'all'}
                onValueChange={id => setSelectedCategory(id === 'all' ? null : ticketCategories.find(c => c.id === id) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {ticketCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.category_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Availability Status */}
            <div className="space-y-2">
              <Label>Availability</Label>
              <Select
                value={availabilityFilter}
                onValueChange={value => setAvailabilityFilter(value as 'all' | 'in_stock' | 'sold_out')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tickets</SelectItem>
                  <SelectItem value="in_stock">In stock</SelectItem>
                  <SelectItem value="sold_out">Sold out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSport(null);
                setSelectedEvent(null);
                setSelectedVenue(null);
                setSelectedCategory(null);
                setAvailabilityFilter('all');
                setSearchTerm('');
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Table View */}
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Tickets
              <Button size="icon" variant="outline" onClick={() => { setEditingTicket(null); setTicketDrawerOpen(true); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setSortKey('category');
                    setSortDir(sortKey === 'category' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Category Name
                      {sortKey === 'category' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setSortKey('price');
                    setSortDir(sortKey === 'price' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Price
                      {sortKey === 'price' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setSortKey('quantity');
                    setSortDir(sortKey === 'quantity' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Quantity
                      {sortKey === 'quantity' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setSortKey('delivery');
                    setSortDir(sortKey === 'delivery' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Delivery Method
                      {sortKey === 'delivery' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead>Ticket Type</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setSortKey('dates');
                    setSortDir(sortKey === 'dates' && sortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Available From
                      {sortKey === 'dates' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTickets.length > 0 ? (
                  sortedTickets.map(ticket => {
                    const category = ticketCategories.find(cat => cat.id === ticket.ticket_category_id);
                    const event = events.find(evt => evt.id === ticket.event_id);
                    const venue = venues.find(v => v.id === event?.venue_id);
                    
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{category?.category_name || 'Unknown Category'}</div>
                            <div className="text-sm text-muted-foreground">
                              {event?.name} {venue && `• ${venue.name}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">€{ticket.price_with_markup?.toFixed(2) || ticket.price.toFixed(2)}</div>
                            {ticket.markup_percent > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Base: €{ticket.price.toFixed(2)} (+{ticket.markup_percent}%)
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.quantity_available}</div>
                            <div className="text-xs text-muted-foreground">
                              {ticket.quantity_reserved} reserved, {ticket.quantity_provisional} provisional
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {ticket.delivery_method === 'e-ticket' && <Package className="h-3 w-3" />}
                            {ticket.delivery_method === 'physical' && <Truck className="h-3 w-3" />}
                            {ticket.delivery_method === 'mobile' && <CreditCard className="h-3 w-3" />}
                            <span>{ticket.delivery_method || 'Not specified'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{ticket.ticket_type || '-'}</TableCell>
                        <TableCell>
                          {ticket.available_from ? format(new Date(ticket.available_from), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {ticket.quantity_available === 0 ? (
                            <Badge variant="destructive">Sold Out</Badge>
                          ) : ticket.quantity_available <= 5 ? (
                            <Badge variant="secondary">Low Stock</Badge>
                          ) : (
                            <Badge variant="default">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => { setEditingTicket(ticket); setTicketDrawerOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setConfirmDeleteTicket(ticket)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Form Drawer */}
      <Drawer open={ticketDrawerOpen} onOpenChange={setTicketDrawerOpen} direction="right">
        <DrawerContent className="!w-[600px] max-w-none">
          <DrawerHeader>
            <DrawerTitle>{editingTicket ? 'Edit Ticket' : 'Add New Ticket'}</DrawerTitle>
            <DrawerDescription>
              {editingTicket ? 'Update ticket information' : 'Create a new ticket for events'}
            </DrawerDescription>
          </DrawerHeader>
          <TicketFormDrawer
            ticket={editingTicket || undefined}
            events={events}
            ticketCategories={selectedEvent ? ticketCategories : allTicketCategories}
            onSubmit={data => {
              if (editingTicket) {
                updateTicketMutation.mutate({ id: editingTicket.id, data });
              } else {
                createTicketMutation.mutate(data);
              }
            }}
            onCancel={() => setTicketDrawerOpen(false)}
            isLoading={createTicketMutation.isPending || updateTicketMutation.isPending}
          />
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteTicket} onOpenChange={open => { if (!open) setConfirmDeleteTicket(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this ticket?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteTicket(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (confirmDeleteTicket) { deleteTicketMutation.mutate(confirmDeleteTicket.id); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Ticket Form Drawer Component
function TicketFormDrawer({ ticket, events, ticketCategories, onSubmit, onCancel, isLoading }: {
  ticket?: Ticket;
  events: Event[];
  ticketCategories: TicketCategory[];
  onSubmit: (data: TicketInsert | TicketUpdate) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      event_id: ticket?.event_id || '',
      ticket_category_id: ticket?.ticket_category_id || '',
      quantity_total: ticket?.quantity_total || 0,
      quantity_reserved: ticket?.quantity_reserved || 0,
      quantity_provisional: ticket?.quantity_provisional || 0,
      price: ticket?.price || 0,
      supplier_currency: ticket?.supplier_currency || 'EUR',
      supplier_price: ticket?.supplier_price || 0,
      markup_percent: ticket?.markup_percent || 0,
      currency: ticket?.currency || 'GBP',
      ticket_days: ticket?.ticket_days || '',
      ticket_format: ticket?.ticket_format || '',
      ticket_type: ticket?.ticket_type || '',
      delivery_method: ticket?.delivery_method || '',
      ticket_delivery_days: ticket?.ticket_delivery_days || undefined,
      refundable: ticket?.refundable || false,
      resellable: ticket?.resellable || false,
      party_size_together: ticket?.party_size_together || undefined,
      supplier: ticket?.supplier || '',
      supplier_ref: ticket?.supplier_ref || '',
      distribution_channel: ticket?.distribution_channel || '',
      ordered: ticket?.ordered || false,
      ordered_at: ticket?.ordered_at || '',
      paid: ticket?.paid || false,
      paid_at: ticket?.paid_at || '',
      tickets_received: ticket?.tickets_received || false,
      tickets_received_at: ticket?.tickets_received_at || '',
      metadata: ticket?.metadata || {},
    },
  });

  const watchedValues = form.watch();
  const selectedEventId = watchedValues.event_id;
  const selectedEvent = events.find(e => e.id === selectedEventId);
  
  // Get available ticket categories for the selected event
  const availableTicketCategories = React.useMemo(() => {
    if (!selectedEvent?.venue_id) return ticketCategories;
    return ticketCategories.filter(cat => cat.venue_id === selectedEvent.venue_id);
  }, [selectedEvent?.venue_id, ticketCategories]);

  // Calculate derived values
  const priceWithMarkup = calcPriceWithMarkup(watchedValues.price, watchedValues.markup_percent);
  const quantityAvailable = watchedValues.quantity_total - watchedValues.quantity_reserved - watchedValues.quantity_provisional;

  // Reset ticket category when event changes
  useEffect(() => {
    if (selectedEventId && watchedValues.ticket_category_id) {
      const currentCategory = ticketCategories.find(cat => cat.id === watchedValues.ticket_category_id);
      if (selectedEvent?.venue_id && currentCategory?.venue_id !== selectedEvent.venue_id) {
        form.setValue('ticket_category_id', '');
      }
    }
  }, [selectedEventId, watchedValues.ticket_category_id, selectedEvent?.venue_id, ticketCategories, form]);

  const handleSubmit = (data: TicketFormData) => {
    // Add timestamps if status is checked
    const submitData = {
      ...data,
      ordered_at: data.ordered ? (data.ordered_at || new Date().toISOString()) : null,
      paid_at: data.paid ? (data.paid_at || new Date().toISOString()) : null,
      tickets_received_at: data.tickets_received ? (data.tickets_received_at || new Date().toISOString()) : null,
    };
    onSubmit(submitData);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable form content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <h3 className="text-base font-semibold text-card-foreground">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="event_id" className="text-sm font-medium text-muted-foreground">Event *</Label>
                <Controller
                  name="event_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map(event => (
                          <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.event_id && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.event_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ticket_category_id" className="text-sm font-medium text-muted-foreground">Ticket Category *</Label>
                <Controller
                  name="ticket_category_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedEventId}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={!selectedEventId ? "Select event first" : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTicketCategories.map(category => (
                          <SelectItem key={category.id} value={category.id}>{category.category_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.ticket_category_id && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.ticket_category_id.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <h3 className="text-base font-semibold text-card-foreground">Stock Information</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity_total" className="text-sm font-medium text-muted-foreground">Total Quantity *</Label>
                <Controller
                  name="quantity_total"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
                {form.formState.errors.quantity_total && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.quantity_total.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quantity_reserved" className="text-sm font-medium text-muted-foreground">Reserved</Label>
                <Controller
                  name="quantity_reserved"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quantity_provisional" className="text-sm font-medium text-muted-foreground">Provisional</Label>
                <Controller
                  name="quantity_provisional"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">Available (Read-only)</Label>
                <div className="h-9 px-3 bg-muted border border-border rounded-md flex items-center">
                  <span className="font-medium text-card-foreground">{quantityAvailable}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <h3 className="text-base font-semibold text-card-foreground">Pricing Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="supplier_currency" className="text-sm font-medium text-muted-foreground">Supplier Currency *</Label>
                <Controller
                  name="supplier_currency"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supplier_price" className="text-sm font-medium text-muted-foreground">Supplier Price *</Label>
                <Controller
                  name="supplier_price"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="markup_percent" className="text-sm font-medium text-muted-foreground">Markup %</Label>
                <Controller
                  name="markup_percent"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-sm font-medium text-muted-foreground">Selling Currency *</Label>
                <Controller
                  name="currency"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">Price with Markup (Read-only)</Label>
                <div className="h-9 px-3 bg-muted border border-border rounded-md flex items-center">
                  <span className="font-medium text-card-foreground">£{priceWithMarkup.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              <h3 className="text-base font-semibold text-card-foreground">Ticket Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label htmlFor="ticket_days" className="text-sm font-medium text-muted-foreground">Ticket Days</Label>
                <Controller
                  name="ticket_days"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Tuesday">Tuesday</SelectItem>
                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                        <SelectItem value="Thursday">Thursday</SelectItem>
                        <SelectItem value="Friday">Friday</SelectItem>
                        <SelectItem value="Saturday">Saturday</SelectItem>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                        <SelectItem value="Friday-Saturday">Friday-Saturday</SelectItem>
                        <SelectItem value="Saturday-Sunday">Saturday-Sunday</SelectItem>
                        <SelectItem value="Friday-Sunday">Friday-Sunday</SelectItem>
                        <SelectItem value="Thursday-Sunday">Thursday-Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ticket_format" className="text-sm font-medium text-muted-foreground">Ticket Format</Label>
                <Controller
                  name="ticket_format"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="e-ticket">E-Ticket</SelectItem>
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="will_call">Will Call</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ticket_type" className="text-sm font-medium text-muted-foreground">Ticket Type</Label>
                <Controller
                  name="ticket_type"
                  control={form.control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      className="h-9"
                      placeholder="e.g., General Admission, VIP" 
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="delivery_method" className="text-sm font-medium text-muted-foreground">Delivery Method</Label>
                <Controller
                  name="delivery_method"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="e-ticket">E-Ticket</SelectItem>
                        <SelectItem value="physical">Physical</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="will_call">Will Call</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ticket_delivery_days" className="text-sm font-medium text-muted-foreground">Delivery Days</Label>
                <Controller
                  name="ticket_delivery_days"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="0"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      placeholder="Days before event"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="party_size_together" className="text-sm font-medium text-muted-foreground">Party Size Together</Label>
                <Controller
                  name="party_size_together"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="1"
                      className="h-9"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      placeholder="Max seats together"
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="refundable"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label className="text-sm font-medium text-muted-foreground">Refundable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Controller
                  name="resellable"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label className="text-sm font-medium text-muted-foreground">Resellable</Label>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
              <h3 className="text-base font-semibold text-card-foreground">Supplier Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="supplier" className="text-sm font-medium text-muted-foreground">Supplier</Label>
                <Controller
                  name="supplier"
                  control={form.control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      className="h-9"
                      placeholder="Supplier name" 
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supplier_ref" className="text-sm font-medium text-muted-foreground">Supplier Reference</Label>
                <Controller
                  name="supplier_ref"
                  control={form.control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      className="h-9"
                      placeholder="Supplier reference" 
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="distribution_channel" className="text-sm font-medium text-muted-foreground">Distribution Channel</Label>
                <Controller
                  name="distribution_channel"
                  control={form.control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      className="h-9"
                      placeholder="e.g., Direct, Partner, Online" 
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <h3 className="text-base font-semibold text-card-foreground">Status Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="ordered"
                    control={form.control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label className="text-sm font-medium text-muted-foreground">Ordered</Label>
                </div>
                {watchedValues.ordered && (
                  <Controller
                    name="ordered_at"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        type="datetime-local"
                        className="h-9"
                        {...field}
                        value={field.value || ''}
                      />
                    )}
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="paid"
                    control={form.control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label className="text-sm font-medium text-muted-foreground">Paid</Label>
                </div>
                {watchedValues.paid && (
                  <Controller
                    name="paid_at"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        type="datetime-local"
                        className="h-9"
                        {...field}
                        value={field.value || ''}
                      />
                    )}
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="tickets_received"
                    control={form.control}
                    render={({ field }) => (
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label className="text-sm font-medium text-muted-foreground">Tickets Received</Label>
                </div>
                {watchedValues.tickets_received && (
                  <Controller
                    name="tickets_received_at"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        type="datetime-local"
                        className="h-9"
                        {...field}
                        value={field.value || ''}
                      />
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Fixed footer */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex justify-between items-center">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset Form
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !form.formState.isValid}
              onClick={form.handleSubmit(handleSubmit)}
            >
              {isLoading ? 'Saving...' : ticket ? 'Update Ticket' : 'Create Ticket'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 