import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Plus, Edit, Trash2, Settings, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { InventoryService } from '@/lib/inventoryService';
import type { Flight, FlightInsert, FlightUpdate, Event } from '@/types/inventory';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AIRPORTS } from '@/data/airports';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const COLUMN_CONFIG = [
  { key: 'event', label: 'Event' },
  { key: 'outbound_flight_number', label: 'Outbound Flight' },
  { key: 'outbound_departure_airport_code', label: 'From (Code)' },
  { key: 'outbound_departure_airport_name', label: 'From (Name)' },
  { key: 'outbound_arrival_airport_code', label: 'To (Code)' },
  { key: 'outbound_arrival_airport_name', label: 'To (Name)' },
  { key: 'outbound_departure_datetime', label: 'Departs' },
  { key: 'outbound_arrival_datetime', label: 'Arrives' },
  { key: 'inbound_flight_number', label: 'Inbound Flight' },
  { key: 'inbound_departure_airport_code', label: 'Return From (Code)' },
  { key: 'inbound_departure_airport_name', label: 'Return From (Name)' },
  { key: 'inbound_arrival_airport_code', label: 'Return To (Code)' },
  { key: 'inbound_arrival_airport_name', label: 'Return To (Name)' },
  { key: 'inbound_departure_datetime', label: 'Return Departs' },
  { key: 'inbound_arrival_datetime', label: 'Return Arrives' },
  { key: 'airline', label: 'Airline' },
  { key: 'cabin', label: 'Cabin' },
  { key: 'total_price_gbp', label: 'Price (£)' },
  { key: 'currency', label: 'Currency' },
  { key: 'refundable', label: 'Refundable' },
  { key: 'baggage_allowance', label: 'Baggage' },
  { key: 'supplier', label: 'Supplier' },

  { key: 'notes', label: 'Notes' },
  { key: 'actions', label: 'Actions' },
];
const DEFAULT_COLUMNS = [
  'event',
  'outbound_flight_number',
  'outbound_departure_airport_code',
  'outbound_arrival_airport_code',
  'outbound_departure_datetime',
  'outbound_arrival_datetime',
  'inbound_flight_number',
  'inbound_departure_airport_code',
  'inbound_arrival_airport_code',
  'total_price_gbp',
  'refundable',
  'airline',
  'cabin',
  'supplier',
  'actions',
];
const COLUMN_STORAGE_KEY = 'flightsManagerTableVisibleColumns_v1';

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'EUR': '€',
    'GBP': '£',
    'USD': '$',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr'
  };
  return symbols[currency] || currency;
}

// Helper to find airport name by code
function getAirportNameByCode(code: string) {
  const found = AIRPORTS.find(a => a.code.toUpperCase() === code.toUpperCase());
  return found ? found.name : '';
}

export default function FlightsManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterAirline, setFilterAirline] = useState<string>('all');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {}
    return new Set(DEFAULT_COLUMNS);
  });
  const [sortKey, setSortKey] = useState('outbound_departure_datetime');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  // Define a proper form data type that matches our database schema
  interface FlightFormData {
    event_id?: string | null;
    outbound_flight_number?: string;
    outbound_departure_airport_code?: string;
    outbound_departure_airport_name?: string;
    outbound_arrival_airport_code?: string;
    outbound_arrival_airport_name?: string;
    outbound_departure_datetime?: string;
    outbound_arrival_datetime?: string;
    inbound_flight_number?: string | null;
    inbound_departure_airport_code?: string | null;
    inbound_departure_airport_name?: string | null;
    inbound_arrival_airport_code?: string | null;
    inbound_arrival_airport_name?: string | null;
    inbound_departure_datetime?: string | null;
    inbound_arrival_datetime?: string | null;
    airline?: string | null;
    cabin?: string | null;
    total_price_gbp?: number;
    currency?: string;
    refundable?: boolean;
    baggage_allowance?: string | null;
    notes?: string | null;
    supplier?: string | null;
  }

  const [form, setForm] = useState<FlightFormData>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch events and flights
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });
  const { data: flights = [], isLoading } = useQuery({
    queryKey: ['flights', filterEvent, filterAirline, search],
    queryFn: () => InventoryService.getFlights({
      event_id: filterEvent !== 'all' ? filterEvent : undefined,
      airline: filterAirline !== 'all' ? filterAirline : undefined,
      search: search || undefined,
    }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: FlightInsert) => InventoryService.createFlight(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      toast.success('Flight created');
      setDrawerOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: FlightUpdate }) => InventoryService.updateFlight(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      toast.success('Flight updated');
      setDrawerOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteFlight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flights'] });
      toast.success('Flight deleted');
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Sorting, filtering, and search
  const filteredFlights = useMemo(() => flights.filter(f => {
    if (filterEvent !== 'all' && f.event_id !== filterEvent) return false;
    if (filterAirline !== 'all' && f.airline !== filterAirline) return false;
    if (search) {
      const eventName = events.find(e => e.id === f.event_id)?.name || '';
      const airline = f.airline || '';
      if (!eventName.toLowerCase().includes(search.toLowerCase()) &&
          !airline.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
    }
    return true;
  }), [flights, filterEvent, filterAirline, search, events]);

  // Unique airlines for filter
  const airlineOptions = useMemo(() => {
    const set = new Set<string>();
    flights.forEach(f => { if (f.airline) set.add(f.airline); });
    return Array.from(set).sort();
  }, [flights]);

  const sortedFlights = useMemo(() => [...filteredFlights].sort((a, b) => {
    let aValue: any, bValue: any;
    switch (sortKey) {
      case 'event':
        aValue = events.find(e => e.id === a.event_id)?.name || '';
        bValue = events.find(e => e.id === b.event_id)?.name || '';
        break;
      default:
        aValue = a[sortKey as keyof typeof a] || '';
        bValue = b[sortKey as keyof typeof b] || '';
    }
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }), [filteredFlights, sortKey, sortDir, events]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(sortedFlights.length / pageSize));
  const paginatedFlights = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFlights.slice(start, start + pageSize);
  }, [sortedFlights, currentPage, pageSize]);

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns]);

  // Row selection
  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  const toggleAllRows = useCallback(() => {
    if (selectedRows.size === paginatedFlights.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedFlights.map(f => f.id)));
    }
  }, [selectedRows.size, paginatedFlights]);

  // Handle edit/create
  const handleEdit = (flight: Flight) => {
    setEditingFlight(flight);
    setForm({ ...flight });
    setDrawerOpen(true);
  };
  const handleCreate = () => {
    setEditingFlight(null);
    setForm({});
    setDrawerOpen(true);
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this flight?')) {
      deleteMutation.mutate(id);
    }
  };
  const handleSubmit = () => {
    if (!validateForm()) return;
    if (editingFlight) {
      updateMutation.mutate({ id: editingFlight.id, updates: form });
    } else {
      createMutation.mutate(form as FlightInsert);
    }
  };

  // Validation logic before submit
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.event_id) newErrors.event_id = 'Event is required';
    if (!form.outbound_flight_number) newErrors.outbound_flight_number = 'Outbound flight number is required';
    if (!form.outbound_departure_airport_code) newErrors.outbound_departure_airport_code = 'Outbound departure airport code is required';
    if (!form.outbound_departure_airport_name) newErrors.outbound_departure_airport_name = 'Outbound departure airport name is required';
    if (!form.outbound_arrival_airport_code) newErrors.outbound_arrival_airport_code = 'Outbound arrival airport code is required';
    if (!form.outbound_arrival_airport_name) newErrors.outbound_arrival_airport_name = 'Outbound arrival airport name is required';
    if (!form.outbound_departure_datetime) newErrors.outbound_departure_datetime = 'Outbound departure datetime is required';
    if (!form.outbound_arrival_datetime) newErrors.outbound_arrival_datetime = 'Outbound arrival datetime is required';
    if (form.total_price_gbp == null || form.total_price_gbp < 0) newErrors.total_price_gbp = 'Total price is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Table cell value
  function getColumnValue(f: Flight, key: string) {
    const formatDate = (dt: string | null) => dt ? new Date(dt).toLocaleString() : '';
    switch (key) {
      case 'event': return events.find(e => e.id === f.event_id)?.name || '';
      case 'outbound_flight_number': return f.outbound_flight_number;
      case 'outbound_departure_airport_code': return f.outbound_departure_airport_code;
      case 'outbound_departure_airport_name': return f.outbound_departure_airport_name;
      case 'outbound_arrival_airport_code': return f.outbound_arrival_airport_code;
      case 'outbound_arrival_airport_name': return f.outbound_arrival_airport_name;
      case 'outbound_departure_datetime': return formatDate(f.outbound_departure_datetime);
      case 'outbound_arrival_datetime': return formatDate(f.outbound_arrival_datetime);
      case 'inbound_flight_number': return f.inbound_flight_number || '';
      case 'inbound_departure_airport_code': return f.inbound_departure_airport_code || '';
      case 'inbound_departure_airport_name': return f.inbound_departure_airport_name || '';
      case 'inbound_arrival_airport_code': return f.inbound_arrival_airport_code || '';
      case 'inbound_arrival_airport_name': return f.inbound_arrival_airport_name || '';
      case 'inbound_departure_datetime': return formatDate(f.inbound_departure_datetime || null);
      case 'inbound_arrival_datetime': return formatDate(f.inbound_arrival_datetime || null);
      case 'airline': return f.airline || '';
      case 'cabin': return f.cabin || '';
      case 'total_price_gbp': return `£${f.total_price_gbp?.toFixed(2)}`;
      case 'currency': return f.currency || 'GBP';
      case 'refundable': return f.refundable ? 'Yes' : 'No';
      case 'baggage_allowance': return f.baggage_allowance || '';
      case 'supplier': return f.supplier || '';

      case 'notes': return f.notes || '';
      default: return '';
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-6">
              <CardTitle>Flights</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Settings className="h-3 w-3 mr-1" /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {COLUMN_CONFIG.map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.key}
                      checked={visibleColumns.has(column.key)}
                      onCheckedChange={() => setVisibleColumns(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(column.key)) {
                          newSet.delete(column.key);
                        } else {
                          newSet.add(column.key);
                        }
                        return newSet;
                      })}
                    >
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setVisibleColumns(new Set(DEFAULT_COLUMNS))}>
                    Reset Columns
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="default" className="font-semibold shadow-md gap-2" onClick={handleCreate}>
                <Plus className="h-5 w-5" />
                Add Flight
              </Button>
            </div>
          </div>
        </CardHeader>
        {/* Filters Section */}
        <div className="px-6 pb-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filters</span>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Search and Clear All at flex-start */}
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Input
                    placeholder="Search flights..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-3 h-8 rounded-md text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    setFilterEvent('all');
                    setFilterAirline('all');
                    setSearch('');
                  }}
                >
                  Clear All
                </Button>
              </div>
              {/* Filters at flex-end */}
              <div className="flex flex-wrap gap-2 items-center justify-end">
                {/* Event Filter */}
                <div>
                  <Select
                    value={filterEvent}
                    onValueChange={setFilterEvent}
                  >
                    <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
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
                {/* Airline Filter */}
                <div>
                  <Select
                    value={filterAirline}
                    onValueChange={setFilterAirline}
                  >
                    <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
                      <SelectValue placeholder="All airlines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All airlines</SelectItem>
                      {airlineOptions.map(airline => (
                        <SelectItem key={airline} value={airline}>{airline}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Active Filters Count */}
                <div>
                  <div className={`h-8 min-w-[40px] flex items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors ${[
                    filterEvent !== 'all' ? filterEvent : null,
                    filterAirline !== 'all' ? filterAirline : null,
                    search ? 'search' : null
                  ].filter(Boolean).length > 0
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted/30 text-muted-foreground border-muted/30'}`}
                  >
                    {[
                      filterEvent !== 'all' ? filterEvent : null,
                      filterAirline !== 'all' ? filterAirline : null,
                      search ? 'search' : null
                    ].filter(Boolean).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      {/* Table */}
      <Card className="border py-0 mt-4 border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted z-10 border-b border-primary-200">
              <TableRow className="bg-muted">
                {/* Selection Checkbox */}
                <TableHead className="">
                  <Checkbox
                    checked={selectedRows.size === paginatedFlights.length && paginatedFlights.length > 0}
                    onCheckedChange={toggleAllRows}
                    aria-label="Select all flights"
                  />
                </TableHead>
                {/* Render all columns except actions */}
                {COLUMN_CONFIG.filter(col => col.key !== 'actions' && visibleColumns.has(col.key)).map(col => (
                  <TableHead
                    key={col.key}
                    className={['event', 'outbound_flight_number', 'outbound_departure_airport_code', 'outbound_arrival_airport_code', 'total_price_gbp', 'refundable', 'airline', 'cabin', 'supplier'].includes(col.key) ? 'cursor-pointer select-none' : ''}
                    onClick={() => {
                      if ([
                        'event', 'outbound_flight_number', 'outbound_departure_airport_code', 'outbound_arrival_airport_code', 'total_price_gbp', 'refundable', 'airline', 'cabin', 'supplier'
                      ].includes(col.key)) {
                        setSortKey(col.key);
                        setSortDir(sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc');
                      }
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                ))}
                {/* Always render actions column last if visible */}
                {visibleColumns.has('actions') && (
                  <TableHead key="actions">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFlights.map(f => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(f.id)}
                      onCheckedChange={() => toggleRowSelection(f.id)}
                      aria-label="Select flight"
                    />
                  </TableCell>
                  {/* Render all columns except actions */}
                  {COLUMN_CONFIG.filter(col => col.key !== 'actions' && visibleColumns.has(col.key)).map(col => (
                    <TableCell key={col.key}>{getColumnValue(f, col.key)}</TableCell>
                  ))}
                  {/* Always render actions column last if visible */}
                  {visibleColumns.has('actions') && (
                    <TableCell key="actions">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(f)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(f.id)} className="ml-2">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        <Pagination className="mt-4 px-6 pb-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : 0}
                style={{ pointerEvents: currentPage === 1 ? 'none' : undefined, opacity: currentPage === 1 ? 0.5 : 1 }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, idx) => {
              // Show first, last, current, and neighbors; ellipsis for gaps
              const page = idx + 1;
              const isCurrent = page === currentPage;
              const isEdge = page === 1 || page === totalPages;
              const isNear = Math.abs(page - currentPage) <= 1;
              if (isEdge || isNear) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={isCurrent}
                      onClick={() => setCurrentPage(page)}
                      tabIndex={isCurrent ? -1 : 0}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              if (
                (page === currentPage - 2 && page > 1) ||
                (page === currentPage + 2 && page < totalPages)
              ) {
                return (
                  <PaginationItem key={page + '-ellipsis'}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-disabled={currentPage === totalPages}
                tabIndex={currentPage === totalPages ? -1 : 0}
                style={{ pointerEvents: currentPage === totalPages ? 'none' : undefined, opacity: currentPage === totalPages ? 0.5 : 1 }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Card>
      {/* Drawer for create/edit */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="!max-w-4xl h-full">
          <DrawerHeader>
            <DrawerTitle>{editingFlight ? 'Edit Flight' : 'New Flight'}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <form className="space-y-8">
              {/* Section 1: Basic Info */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <h3 className="text-base font-semibold text-card-foreground">Basic Info</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="event_id">Event *</Label>
                    <Select value={form.event_id || ''} onValueChange={(v: string) => setForm((f) => ({ ...f, event_id: v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select event" /></SelectTrigger>
                      <SelectContent>
                        {events.map(evt => <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.event_id && <div className="text-destructive text-xs mt-1">{errors.event_id}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="airline">Airline</Label>
                    <Input id="airline" value={form.airline ?? ''} onChange={e => setForm(f => ({ ...f, airline: e.target.value }))} placeholder="e.g. British Airways" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cabin">Cabin</Label>
                    <Input id="cabin" value={form.cabin ?? ''} onChange={e => setForm(f => ({ ...f, cabin: e.target.value }))} placeholder="e.g. Economy" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="refundable">Refundable</Label>
                    <Checkbox id="refundable" checked={!!form.refundable} onCheckedChange={checked => setForm(f => ({ ...f, refundable: Boolean(checked) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="baggage_allowance">Baggage Allowance</Label>
                    <Input id="baggage_allowance" value={form.baggage_allowance ?? ''} onChange={e => setForm(f => ({ ...f, baggage_allowance: e.target.value }))} placeholder="e.g. 1 checked bag" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input id="supplier" value={form.supplier ?? ''} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="e.g. Expedia" />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes..." />
                  </div>
                </div>
              </div>
              {/* Section 2: Outbound Flight */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <h3 className="text-base font-semibold text-card-foreground">Outbound Flight</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="outbound_flight_number">Flight Number *</Label>
                    <Input id="outbound_flight_number" value={form.outbound_flight_number ?? ''} onChange={e => setForm(f => ({ ...f, outbound_flight_number: e.target.value }))} placeholder="e.g. BA123" />
                    {errors.outbound_flight_number && <div className="text-destructive text-xs mt-1">{errors.outbound_flight_number}</div>}
                  </div>
                                      <div className="space-y-1.5">
                      <Label htmlFor="outbound_departure_airport_code">Departure Airport Code *</Label>
                      <Input id="outbound_departure_airport_code" value={form.outbound_departure_airport_code ?? ''} onChange={e => {
                        const code = e.target.value;
                        const name = getAirportNameByCode(code);
                        setForm(f => ({
                          ...f,
                          outbound_departure_airport_code: code,
                          outbound_departure_airport_name: name || f.outbound_departure_airport_name,
                          // Auto-fill inbound arrival (return destination)
                          inbound_arrival_airport_code: code,
                          inbound_arrival_airport_name: name || f.inbound_arrival_airport_name
                        }));
                      }} placeholder="e.g. LHR" />
                      {errors.outbound_departure_airport_code && <div className="text-destructive text-xs mt-1">{errors.outbound_departure_airport_code}</div>}
                    </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="outbound_departure_airport_name">Departure Airport Name (Auto-filled) *</Label>
                    <Input id="outbound_departure_airport_name" value={form.outbound_departure_airport_name ?? ''} readOnly className="bg-muted" placeholder="Auto-filled from airport code" />
                    {errors.outbound_departure_airport_name && <div className="text-destructive text-xs mt-1">{errors.outbound_departure_airport_name}</div>}
                  </div>
                                      <div className="space-y-1.5">
                      <Label htmlFor="outbound_arrival_airport_code">Arrival Airport Code *</Label>
                      <Input id="outbound_arrival_airport_code" value={form.outbound_arrival_airport_code ?? ''} onChange={e => {
                        const code = e.target.value;
                        const name = getAirportNameByCode(code);
                        setForm(f => ({
                          ...f,
                          outbound_arrival_airport_code: code,
                          outbound_arrival_airport_name: name || f.outbound_arrival_airport_name,
                          // Auto-fill inbound departure (return origin)
                          inbound_departure_airport_code: code,
                          inbound_departure_airport_name: name || f.inbound_departure_airport_name
                        }));
                      }} placeholder="e.g. CDG" />
                      {errors.outbound_arrival_airport_code && <div className="text-destructive text-xs mt-1">{errors.outbound_arrival_airport_code}</div>}
                    </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="outbound_arrival_airport_name">Arrival Airport Name (Auto-filled) *</Label>
                    <Input id="outbound_arrival_airport_name" value={form.outbound_arrival_airport_name ?? ''} readOnly className="bg-muted" placeholder="Auto-filled from airport code" />
                    {errors.outbound_arrival_airport_name && <div className="text-destructive text-xs mt-1">{errors.outbound_arrival_airport_name}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="outbound_departure_datetime">Departure Datetime *</Label>
                    <DatePicker
                      selected={form.outbound_departure_datetime ? new Date(form.outbound_departure_datetime) : null}
                      onChange={(date) => setForm(f => ({ ...f, outbound_departure_datetime: date ? date.toISOString() : '' }))}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholderText="Select departure date and time"
                    />
                    {errors.outbound_departure_datetime && <div className="text-destructive text-xs mt-1">{errors.outbound_departure_datetime}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="outbound_arrival_datetime">Arrival Datetime *</Label>
                    <DatePicker
                      selected={form.outbound_arrival_datetime ? new Date(form.outbound_arrival_datetime) : null}
                      onChange={(date) => setForm(f => ({ ...f, outbound_arrival_datetime: date ? date.toISOString() : '' }))}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholderText="Select arrival date and time"
                    />
                    {errors.outbound_arrival_datetime && <div className="text-destructive text-xs mt-1">{errors.outbound_arrival_datetime}</div>}
                  </div>
                </div>
              </div>
              {/* Section 3: Inbound Flight (optional) */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <h3 className="text-base font-semibold text-card-foreground">Inbound Flight (Optional)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="inbound_flight_number">Flight Number</Label>
                    <Input id="inbound_flight_number" value={form.inbound_flight_number ?? ''} onChange={e => setForm(f => ({ ...f, inbound_flight_number: e.target.value }))} placeholder="e.g. BA124" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inbound_departure_airport_code">Departure Airport Code (Auto-filled)</Label>
                    <Input id="inbound_departure_airport_code" value={form.inbound_departure_airport_code ?? ''} readOnly className="bg-muted" placeholder="Auto-filled from outbound arrival" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inbound_departure_airport_name">Departure Airport Name (Auto-filled)</Label>
                    <Input id="inbound_departure_airport_name" value={form.inbound_departure_airport_name ?? ''} readOnly className="bg-muted" placeholder="Auto-filled from outbound arrival" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inbound_arrival_airport_code">Arrival Airport Code (Auto-filled)</Label>
                    <Input id="inbound_arrival_airport_code" value={form.inbound_arrival_airport_code ?? ''} readOnly className="bg-muted" placeholder="Auto-filled from outbound departure" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inbound_arrival_airport_name">Arrival Airport Name (Auto-filled)</Label>
                    <Input id="inbound_arrival_airport_name" value={form.inbound_arrival_airport_name ?? ''} readOnly className="bg-muted" placeholder="Auto-filled from outbound departure" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inbound_departure_datetime">Departure Datetime</Label>
                    <DatePicker
                      selected={form.inbound_departure_datetime ? new Date(form.inbound_departure_datetime) : null}
                      onChange={(date) => setForm(f => ({ ...f, inbound_departure_datetime: date ? date.toISOString() : '' }))}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholderText="Select return departure date and time"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inbound_arrival_datetime">Arrival Datetime</Label>
                    <DatePicker
                      selected={form.inbound_arrival_datetime ? new Date(form.inbound_arrival_datetime) : null}
                      onChange={(date) => setForm(f => ({ ...f, inbound_arrival_datetime: date ? date.toISOString() : '' }))}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholderText="Select return arrival date and time"
                    />
                  </div>
                </div>
              </div>
              {/* Section 4: Pricing */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <h3 className="text-base font-semibold text-card-foreground">Pricing</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="total_price_gbp">Total Price (£) *</Label>
                    <Input type="number" id="total_price_gbp" value={form.total_price_gbp ?? ''} onChange={e => setForm(f => ({ ...f, total_price_gbp: Number(e.target.value) }))} placeholder="e.g. 350" />
                    {errors.total_price_gbp && <div className="text-destructive text-xs mt-1">{errors.total_price_gbp}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" value={form.currency ?? 'GBP'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} placeholder="e.g. GBP" />
                  </div>
                </div>
              </div>
            </form>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit}>
              {editingFlight ? 'Update' : 'Create'}
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
} 