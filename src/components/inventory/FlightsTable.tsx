import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal, Plane, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import { InventoryService } from '@/lib/inventoryService';
import type { FlightWithEvent, FlightFormData, FlightFilters } from '@/types/inventory';

export function FlightsTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FlightFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<FlightWithEvent | null>(null);
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);

  // Fetch flights
  const { data: flights, isLoading } = useQuery({
    queryKey: ['flights', filters],
    queryFn: () => InventoryService.getFlights(filters),
  });

  // Fetch events for dropdown
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });

  // Create flight mutation
  const createFlightMutation = useMutation({
    mutationFn: (data: FlightFormData) => InventoryService.createFlight(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      setIsCreateDialogOpen(false);
      toast.success('Flight created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create flight: ${error.message}`);
    },
  });

  // Update flight mutation
  const updateFlightMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FlightFormData> }) =>
      InventoryService.updateFlight(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      setEditingFlight(null);
      toast.success('Flight updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update flight: ${error.message}`);
    },
  });

  // Delete flight mutation
  const deleteFlightMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteFlight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      toast.success('Flight deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete flight: ${error.message}`);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => InventoryService.bulkDelete({ ids, component_type: 'flight' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      setSelectedFlights([]);
      toast.success('Flights deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete flights: ${error.message}`);
    },
  });

  const handleCreateFlight = (data: FlightFormData) => {
    createFlightMutation.mutate(data);
  };

  const handleUpdateFlight = (id: string, data: Partial<FlightFormData>) => {
    updateFlightMutation.mutate({ id, data });
  };

  const handleDeleteFlight = (id: string) => {
    deleteFlightMutation.mutate(id);
  };

  const handleBulkDelete = () => {
    if (selectedFlights.length === 0) return;
    bulkDeleteMutation.mutate(selectedFlights);
  };

  const getFlightTypeBadge = (flight: FlightWithEvent) => {
    if (flight.return_departure_airport_code) {
      return <Badge variant="default">Round Trip</Badge>;
    }
    return <Badge variant="outline">One Way</Badge>;
  };

  const getStopsBadge = (stops: number) => {
    if (stops === 0) {
      return <Badge variant="default">Direct</Badge>;
    }
    return <Badge variant="secondary">{stops} stop{stops > 1 ? 's' : ''}</Badge>;
  };

  const formatFlightTime = (datetime: string | null) => {
    if (!datetime) return '-';
    return format(new Date(datetime), 'MMM dd, HH:mm');
  };

  const filteredFlights = flights?.filter(flight => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        flight.airline?.toLowerCase().includes(searchLower) ||
        flight.outbound_flight_number?.toLowerCase().includes(searchLower) ||
        flight.return_flight_number?.toLowerCase().includes(searchLower) ||
        flight.departure_airport_code.toLowerCase().includes(searchLower) ||
        flight.arrival_airport_code.toLowerCase().includes(searchLower) ||
        flight.event?.name?.toLowerCase().includes(searchLower) ||
        flight.supplier?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Flights</h2>
          <p className="text-muted-foreground">
            Manage flight inventory and bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedFlights.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              Delete Selected ({selectedFlights.length})
            </Button>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Flight
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Flight</DialogTitle>
                <DialogDescription>
                  Add a new flight to the inventory
                </DialogDescription>
              </DialogHeader>
              <FlightForm
                events={events || []}
                onSubmit={handleCreateFlight}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={createFlightMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search flights..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Event</Label>
              <Select
                value={filters.event_id || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, event_id: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Airline</Label>
              <Input
                placeholder="Airline name"
                value={filters.airline || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, airline: e.target.value || undefined }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Flight Class</Label>
              <Select
                value={filters.flight_class || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, flight_class: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium_economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedFlights.length === filteredFlights.length && filteredFlights.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFlights(filteredFlights.map(f => f.id));
                      } else {
                        setSelectedFlights([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Airline</TableHead>
                <TableHead>Flight Numbers</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Loading flights...
                  </TableCell>
                </TableRow>
              ) : filteredFlights.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    No flights found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFlights.map((flight) => (
                  <TableRow key={flight.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFlights.includes(flight.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFlights(prev => [...prev, flight.id]);
                          } else {
                            setSelectedFlights(prev => prev.filter(id => id !== flight.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        <div>
                          <div className="font-medium">
                            {flight.departure_airport_code} → {flight.arrival_airport_code}
                          </div>
                          {flight.return_departure_airport_code && (
                            <div className="text-sm text-muted-foreground">
                              {flight.return_departure_airport_code} → {flight.return_arrival_airport_code}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{flight.event?.name || '-'}</div>
                        <div className="text-sm text-muted-foreground">
                          {flight.event?.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{flight.airline || '-'}</div>
                        {flight.flight_class && (
                          <div className="text-sm text-muted-foreground capitalize">
                            {flight.flight_class.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{flight.outbound_flight_number || '-'}</div>
                        {flight.return_flight_number && (
                          <div className="text-sm text-muted-foreground">
                            {flight.return_flight_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatFlightTime(flight.outbound_departure_datetime)}
                        </div>
                        {flight.return_departure_datetime && (
                          <div className="text-sm text-muted-foreground">
                            {formatFlightTime(flight.return_departure_datetime)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{getStopsBadge(flight.stops_outbound)}</div>
                        {flight.return_departure_airport_code && (
                          <div>{getStopsBadge(flight.stops_return)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {flight.price_gbp.toFixed(2)} {flight.quote_currency}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {flight.markup_percent > 0 && `+${flight.markup_percent}% markup`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getFlightTypeBadge(flight)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingFlight(flight)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteFlight(flight.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingFlight && (
        <Dialog open={!!editingFlight} onOpenChange={() => setEditingFlight(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Flight</DialogTitle>
              <DialogDescription>
                Update flight information
              </DialogDescription>
            </DialogHeader>
            <FlightForm
              events={events || []}
              flight={editingFlight}
              onSubmit={(data) => handleUpdateFlight(editingFlight.id, data)}
              onCancel={() => setEditingFlight(null)}
              isLoading={updateFlightMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Flight Form Component
interface FlightFormProps {
  events: any[];
  flight?: FlightWithEvent;
  onSubmit: (data: FlightFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function FlightForm({ events, flight, onSubmit, onCancel, isLoading }: FlightFormProps) {
  const [formData, setFormData] = useState<FlightFormData>({
    event_id: flight?.event_id || '',
    departure_airport_code: flight?.departure_airport_code || '',
    arrival_airport_code: flight?.arrival_airport_code || '',
    return_departure_airport_code: flight?.return_departure_airport_code || '',
    return_arrival_airport_code: flight?.return_arrival_airport_code || '',
    airline: flight?.airline || '',
    flight_class: flight?.flight_class || '',
    outbound_flight_number: flight?.outbound_flight_number || '',
    return_flight_number: flight?.return_flight_number || '',
    outbound_departure_datetime: flight?.outbound_departure_datetime || '',
    outbound_arrival_datetime: flight?.outbound_arrival_datetime || '',
    return_departure_datetime: flight?.return_departure_datetime || '',
    return_arrival_datetime: flight?.return_arrival_datetime || '',
    stops_outbound: flight?.stops_outbound || 0,
    stops_return: flight?.stops_return || 0,
    layovers_outbound: flight?.layovers_outbound || [],
    layovers_return: flight?.layovers_return || [],
    supplier: flight?.supplier || '',
    quote_currency: flight?.quote_currency || 'GBP',
    supplier_quote: flight?.supplier_quote || 0,
    markup_percent: flight?.markup_percent || 0,
    baggage_policy: flight?.baggage_policy || '',
    notes: flight?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_id">Event</Label>
          <Select
            value={formData.event_id || 'none'}
            onValueChange={(value) => setFormData(prev => ({ ...prev, event_id: value === 'none' ? undefined : value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
                            <SelectContent>
                  <SelectItem value="none">No event</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="airline">Airline</Label>
          <Input
            id="airline"
            value={formData.airline}
            onChange={(e) => setFormData(prev => ({ ...prev, airline: e.target.value }))}
            placeholder="e.g., British Airways, Lufthansa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="departure_airport_code">Departure Airport *</Label>
          <Input
            id="departure_airport_code"
            value={formData.departure_airport_code}
            onChange={(e) => setFormData(prev => ({ ...prev, departure_airport_code: e.target.value }))}
            placeholder="e.g., LHR, JFK"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="arrival_airport_code">Arrival Airport *</Label>
          <Input
            id="arrival_airport_code"
            value={formData.arrival_airport_code}
            onChange={(e) => setFormData(prev => ({ ...prev, arrival_airport_code: e.target.value }))}
            placeholder="e.g., CDG, FCO"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="return_departure_airport_code">Return Departure Airport</Label>
          <Input
            id="return_departure_airport_code"
            value={formData.return_departure_airport_code}
            onChange={(e) => setFormData(prev => ({ ...prev, return_departure_airport_code: e.target.value }))}
            placeholder="e.g., CDG, FCO"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="return_arrival_airport_code">Return Arrival Airport</Label>
          <Input
            id="return_arrival_airport_code"
            value={formData.return_arrival_airport_code}
            onChange={(e) => setFormData(prev => ({ ...prev, return_arrival_airport_code: e.target.value }))}
            placeholder="e.g., LHR, JFK"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="flight_class">Flight Class</Label>
          <Select
            value={formData.flight_class}
            onValueChange={(value) => setFormData(prev => ({ ...prev, flight_class: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="premium_economy">Premium Economy</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="first">First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="outbound_flight_number">Outbound Flight Number</Label>
          <Input
            id="outbound_flight_number"
            value={formData.outbound_flight_number}
            onChange={(e) => setFormData(prev => ({ ...prev, outbound_flight_number: e.target.value }))}
            placeholder="e.g., BA123"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="return_flight_number">Return Flight Number</Label>
          <Input
            id="return_flight_number"
            value={formData.return_flight_number}
            onChange={(e) => setFormData(prev => ({ ...prev, return_flight_number: e.target.value }))}
            placeholder="e.g., BA124"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="outbound_departure_datetime">Outbound Departure</Label>
          <Input
            id="outbound_departure_datetime"
            type="datetime-local"
            value={formData.outbound_departure_datetime}
            onChange={(e) => setFormData(prev => ({ ...prev, outbound_departure_datetime: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="outbound_arrival_datetime">Outbound Arrival</Label>
          <Input
            id="outbound_arrival_datetime"
            type="datetime-local"
            value={formData.outbound_arrival_datetime}
            onChange={(e) => setFormData(prev => ({ ...prev, outbound_arrival_datetime: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="return_departure_datetime">Return Departure</Label>
          <Input
            id="return_departure_datetime"
            type="datetime-local"
            value={formData.return_departure_datetime}
            onChange={(e) => setFormData(prev => ({ ...prev, return_departure_datetime: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="return_arrival_datetime">Return Arrival</Label>
          <Input
            id="return_arrival_datetime"
            type="datetime-local"
            value={formData.return_arrival_datetime}
            onChange={(e) => setFormData(prev => ({ ...prev, return_arrival_datetime: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stops_outbound">Outbound Stops</Label>
          <Input
            id="stops_outbound"
            type="number"
            value={formData.stops_outbound}
            onChange={(e) => setFormData(prev => ({ ...prev, stops_outbound: parseInt(e.target.value) }))}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stops_return">Return Stops</Label>
          <Input
            id="stops_return"
            type="number"
            value={formData.stops_return}
            onChange={(e) => setFormData(prev => ({ ...prev, stops_return: parseInt(e.target.value) }))}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier_quote">Supplier Quote</Label>
          <Input
            id="supplier_quote"
            type="number"
            step="0.01"
            value={formData.supplier_quote}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier_quote: parseFloat(e.target.value) }))}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="markup_percent">Markup %</Label>
          <Input
            id="markup_percent"
            type="number"
            step="0.01"
            value={formData.markup_percent}
            onChange={(e) => setFormData(prev => ({ ...prev, markup_percent: parseFloat(e.target.value) }))}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quote_currency">Currency</Label>
          <Select
            value={formData.quote_currency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, quote_currency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
            placeholder="Supplier name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="baggage_policy">Baggage Policy</Label>
        <Input
          id="baggage_policy"
          value={formData.baggage_policy}
          onChange={(e) => setFormData(prev => ({ ...prev, baggage_policy: e.target.value }))}
          placeholder="e.g., 23kg checked, 7kg hand luggage"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : flight ? 'Update Flight' : 'Create Flight'}
        </Button>
      </DialogFooter>
    </form>
  );
} 