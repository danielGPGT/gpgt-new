import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Plus, Edit, Trash2, Search, Upload, Settings, Filter, ArrowUp, ArrowDown, ArrowUpDown, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryService } from '@/lib/inventoryService';
import { HotelService } from '@/lib/hotelService';
import type { AirportTransferWithRelations, AirportTransferFormData, Event, Hotel } from '@/types/inventory';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const transportTypes = [
  { value: 'all', label: 'All types' },
  { value: 'hotel_chauffeur', label: 'Hotel Chauffeur' },
  { value: 'private_car', label: 'Private Car' },
];

const EXCHANGE_RATE_API_BASE = 'https://api.exchangerate-api.com/v4/latest';
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const getCurrencySymbol = (currency: string): string => {
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
};
const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return parseFloat((amount * cached.rate).toFixed(2));
  }
  try {
    const response = await fetch(`${EXCHANGE_RATE_API_BASE}/${fromCurrency}`);
    if (!response.ok) throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
    const data = await response.json();
    const rate = data.rates[toCurrency];
    if (!rate) throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    rateCache.set(cacheKey, { rate, timestamp: Date.now() });
    return parseFloat((amount * rate).toFixed(2));
  } catch (error) {
    const fallbackRates: Record<string, Record<string, number>> = {
      EUR: { GBP: 0.85, USD: 1.08, EUR: 1.0 },
      GBP: { EUR: 1.18, USD: 1.27, GBP: 1.0 },
      USD: { EUR: 0.93, GBP: 0.79, USD: 1.0 },
    };
    const fallbackRate = fallbackRates[fromCurrency]?.[toCurrency];
    if (fallbackRate) return parseFloat((amount * fallbackRate).toFixed(2));
    return amount;
  }
};
const calcPriceWithMarkup = (price: number, markup: number) =>
  parseFloat((price + price * (markup / 100)).toFixed(2));

const COLUMN_STORAGE_KEY = 'airportTransfersVisibleColumns';

const columnOrder = [
  'event', 'hotel', 'event_id', 'hotel_id', 'transport_type', 'supplier', 'max_capacity', 'quote_currency', 'supplier_quote_per_car_local', 'supplier_quote_per_car_gbp', 'markup_price', 'paid_to_supplier', 'outstanding', 'markup', 'notes', 'created_at', 'updated_at', 'actions'
];

function getTransferCellContent(
  transfer: AirportTransferWithRelations,
  col: string,
  events: Event[],
  hotels: Hotel[]
) {
  switch (col) {
    case 'event':
      return events.find(evt => evt.id === transfer.event_id)?.name || '';
    case 'hotel':
      return hotels.find(h => h.id === transfer.hotel_id)?.name || '';
    case 'event_id':
      return transfer.event_id || '-';
    case 'hotel_id':
      return transfer.hotel_id || '-';
    case 'transport_type':
      return transfer.transport_type === 'hotel_chauffeur' ? 'Hotel Chauffeur' : transfer.transport_type === 'private_car' ? 'Private Car' : transfer.transport_type;
    case 'supplier':
      return transfer.supplier || '-';
    case 'max_capacity':
      return transfer.max_capacity;
    case 'quote_currency':
      return transfer.quote_currency;
    case 'supplier_quote_per_car_local':
      return `${getCurrencySymbol(transfer.quote_currency)}${transfer.supplier_quote_per_car_local?.toFixed(2)}`;
    case 'supplier_quote_per_car_gbp':
      return `£${transfer.supplier_quote_per_car_gbp?.toFixed(2)}`;
    case 'markup_price':
      const markupPrice = calcPriceWithMarkup(transfer.supplier_quote_per_car_gbp ?? 0, transfer.markup ?? 0);
      return `£${markupPrice.toFixed(2)}`;
    case 'paid_to_supplier':
      return transfer.paid_to_supplier ? <span className="text-green-600 font-semibold">Yes</span> : <span className="text-muted-foreground">No</span>;
    case 'outstanding':
      return transfer.outstanding ? <span className="text-red-600 font-semibold">Yes</span> : <span className="text-muted-foreground">No</span>;
    case 'markup':
      return `${transfer.markup}%`;
    case 'notes':
      return transfer.notes || '-';
    case 'created_at':
      return transfer.created_at ? new Date(transfer.created_at).toLocaleString() : '-';
    case 'updated_at':
      return transfer.updated_at ? new Date(transfer.updated_at).toLocaleString() : '-';
    case 'actions':
      return null; // handled in table body
    default:
      return '';
  }
}

export default function AirportTransfersManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [selectedTransportType, setSelectedTransportType] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<AirportTransferWithRelations | undefined>(undefined);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (saved) return new Set(JSON.parse(saved));
    return new Set([
      'event', 'hotel', 'transport_type', 'supplier', 'max_capacity', 'quote_currency', 'supplier_quote_per_car_local', 'supplier_quote_per_car_gbp', 'paid_to_supplier', 'outstanding', 'markup', 'notes', 'actions'
    ]);
  });
  useEffect(() => {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedTransfers, setSelectedTransfers] = useState<Set<string>>(new Set());

  // Fetch airport transfers
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['new-airport-transfers'],
    queryFn: () => InventoryService.getNewAirportTransfers(),
  });

  // Fetch events and hotels for dropdowns
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });
  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => HotelService.getHotels(),
  });

  // Supplier list (from hotels or static for now)
  const suppliers = Array.from(new Set(hotels.map(h => h.supplier).filter(Boolean)));

  // Active filter count
  const activeFilterCount = [
    selectedEvent,
    selectedHotel,
    selectedTransportType !== 'all' ? selectedTransportType : null,
    selectedSupplier !== 'all' ? selectedSupplier : null,
    searchTerm ? 'search' : null
  ].filter(Boolean).length;

  // Create
  const createMutation = useMutation({
    mutationFn: (data: AirportTransferFormData) => InventoryService.createNewAirportTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-airport-transfers'] });
      setDrawerOpen(false);
      toast.success('Airport transfer created');
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AirportTransferFormData }) => InventoryService.updateNewAirportTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-airport-transfers'] });
      setDrawerOpen(false);
      setEditingTransfer(undefined);
      toast.success('Airport transfer updated');
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteNewAirportTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-airport-transfers'] });
      toast.success('Airport transfer deleted');
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  const handleEdit = (transfer: AirportTransferWithRelations) => {
    setEditingTransfer(transfer);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this airport transfer?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setEditingTransfer(undefined);
  };

  // Filtering
  const filteredTransfers = transfers.filter(t => {
    if (!searchTerm) return true;
    return (
      t.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.transport_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination logic (must come after filteredTransfers)
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTransfers.length / rowsPerPage));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);
  const paginatedTransfers = filteredTransfers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const toggleTransferSelection = (id: string) => {
    setSelectedTransfers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleAllTransfers = () => {
    if (selectedTransfers.size === paginatedTransfers.length) {
      setSelectedTransfers(new Set());
    } else {
      setSelectedTransfers(new Set(paginatedTransfers.map(t => t.id)));
    }
  };

  return (
    <div className="">
      <div className="w-full">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-6">
                <CardTitle>Airport Transfers</CardTitle>
                {/* Column Settings */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {[
                      { key: 'event', label: 'Event' },
                      { key: 'hotel', label: 'Hotel' },
                      { key: 'event_id', label: 'Event ID' },
                      { key: 'hotel_id', label: 'Hotel ID' },
                      { key: 'transport_type', label: 'Type' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: 'max_capacity', label: 'Max Capacity' },
                      { key: 'quote_currency', label: 'Currency' },
                      { key: 'supplier_quote_per_car_local', label: 'Quote (Local)' },
                      { key: 'supplier_quote_per_car_gbp', label: 'Quote (GBP)' },
                      { key: 'markup_price', label: 'Markup Price' },
                      { key: 'paid_to_supplier', label: 'Paid' },
                      { key: 'outstanding', label: 'Outstanding' },
                      { key: 'markup', label: 'Markup' },
                      { key: 'notes', label: 'Notes' },
                      { key: 'created_at', label: 'Created At' },
                      { key: 'updated_at', label: 'Updated At' },
                      { key: 'actions', label: 'Actions' },
                    ].map(column => (
                      <DropdownMenuCheckboxItem
                        key={column.key}
                        checked={visibleColumns.has(column.key)}
                        onCheckedChange={() => {
                          setVisibleColumns(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(column.key)) newSet.delete(column.key);
                            else newSet.add(column.key);
                            return newSet;
                          });
                        }}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setVisibleColumns(new Set([
                      'event', 'hotel', 'transport_type', 'supplier', 'max_capacity', 'quote_currency', 'supplier_quote_per_car_local', 'supplier_quote_per_car_gbp', 'paid_to_supplier', 'outstanding', 'markup', 'notes', 'actions'
                    ]))}>
                      Reset Columns
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2">
                {/* Bulk Actions */}
                {selectedTransfers.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs font-semibold">
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => {
                          if (window.confirm(`Delete ${selectedTransfers.size} selected transfers?`)) {
                            selectedTransfers.forEach(id => deleteMutation.mutate(id));
                            setSelectedTransfers(new Set());
                          }
                        }}
                        className="text-red-600"
                      >
                        Delete Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        Export Selected (coming soon)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button variant="outline" className="font-semibold shadow-md gap-2">
                  <Upload className="h-5 w-5" />
                  Import CSV
                </Button>
                <Button variant="default" className="font-semibold shadow-md gap-2" onClick={() => { setEditingTransfer(undefined); setDrawerOpen(true); }}>
                  <Plus className="h-5 w-5" />
                  Add Transfer
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
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transfers..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-8 h-8 rounded-md text-sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      setSelectedEvent(null);
                      setSelectedHotel(null);
                      setSelectedTransportType('all');
                      setSelectedSupplier('all');
                      setSearchTerm('');
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
                      value={selectedEvent?.id || 'all'}
                      onValueChange={id => setSelectedEvent(id === 'all' ? null : events.find(e => e.id === id) || null)}
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
                  {/* Hotel Filter */}
                  <div>
                    <Select
                      value={selectedHotel?.id || 'all'}
                      onValueChange={id => setSelectedHotel(id === 'all' ? null : hotels.find(h => h.id === id) || null)}
                    >
                      <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
                        <SelectValue placeholder="All hotels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All hotels</SelectItem>
                        {hotels.map(hotel => (
                          <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Transport Type Filter */}
                  <div>
                    <Select
                      value={selectedTransportType}
                      onValueChange={setSelectedTransportType}
                    >
                      <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transportTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Supplier Filter */}
                  <div>
                    <Select
                      value={selectedSupplier}
                      onValueChange={setSelectedSupplier}
                    >
                      <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
                        <SelectValue placeholder="All suppliers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All suppliers</SelectItem>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Active Filters Count */}
                  <div>
                    <div className={`h-8 min-w-[40px] flex items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors ${activeFilterCount > 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/30 text-muted-foreground border-muted/30'}`}>{activeFilterCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div className="overflow-x-auto">
      <Card className="border py-0 mt-4 border-border rounded-2xl shadow-sm overflow-hidden">
        <Table className="">
          <TableHeader className="bg-muted z-10 border-b border-primary-200">
            <TableRow className="">
              <TableHead className="border-r border-border/30 bg-muted/10">
                <Checkbox
                  ref={el => {
                    if (el) {
                      const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
                      if (input) {
                        input.indeterminate = selectedTransfers.size > 0 && selectedTransfers.size < paginatedTransfers.length;
                      }
                    }
                  }}
                  checked={selectedTransfers.size === paginatedTransfers.length && paginatedTransfers.length > 0}
                  onCheckedChange={toggleAllTransfers}
                  aria-label="Select all transfers"
                />
              </TableHead>
              {columnOrder.filter(col => visibleColumns.has(col)).map(col => (
                <TableHead
                  key={col}
                  className={
                    col !== 'actions' ? 'cursor-pointer select-none' : 'text-right'
                  }
                  onClick={col !== 'actions' ? () => {
                    setSortKey(col);
                    setSortDir(sortKey === col && sortDir === 'asc' ? 'desc' : 'asc');
                  } : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col === 'event' ? 'Event' :
                      col === 'hotel' ? 'Hotel' :
                      col === 'transport_type' ? 'Type' :
                      col === 'supplier' ? 'Supplier' :
                      col === 'max_capacity' ? 'Max Capacity' :
                      col === 'quote_currency' ? 'Currency' :
                      col === 'supplier_quote_per_car_local' ? 'Quote (Local)' :
                      col === 'supplier_quote_per_car_gbp' ? 'Quote (GBP)' :
                      col === 'markup_price' ? 'Markup Price' :
                      col === 'paid_to_supplier' ? 'Paid' :
                      col === 'outstanding' ? 'Outstanding' :
                      col === 'markup' ? 'Markup' :
                      col === 'notes' ? 'Notes' :
                      col === 'created_at' ? 'Created At' :
                      col === 'updated_at' ? 'Updated At' :
                      col === 'actions' ? 'Actions' : col}
                    {col !== 'actions' && (
                      sortKey === col ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransfers.length > 0 ? (
              paginatedTransfers.map((transfer, index) => (
                <TableRow
                  key={transfer.id}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    selectedTransfers.has(transfer.id)
                      ? 'bg-primary-50/20 border-primary-200'
                      : index % 2 === 0
                        ? 'bg-card'
                        : 'bg-muted/20'
                  }`}
                >
                  <TableCell className="border-r border-border/30 bg-muted/10">
                    <Checkbox
                      checked={selectedTransfers.has(transfer.id)}
                      onCheckedChange={() => toggleTransferSelection(transfer.id)}
                      aria-label={`Select transfer ${transfer.id}`}
                    />
                  </TableCell>
                  {columnOrder.filter(col => visibleColumns.has(col)).map(col => (
                    <TableCell key={col} className={col === 'actions' ? 'text-right' : ''}>
                      {col === 'actions' ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(transfer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(transfer.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ) : getTransferCellContent(transfer, col, events, hotels)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.size + 1} className="text-center py-12 text-muted-foreground bg-muted/10 border-b border-border/30">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                    <span className="text-sm font-medium">No transfers found</span>
                    <span className="text-xs text-muted-foreground/70">Try adjusting your filters or add a new transfer</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
        {/* Pagination Controls */}
        <div className="flex justify-center py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={e => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                  aria-disabled={page === 1}
                />
              </PaginationItem>
              {/* Page numbers with ellipsis if needed */}
              {Array.from({ length: totalPages }).map((_, i) => {
                if (
                  i === 0 ||
                  i === totalPages - 1 ||
                  Math.abs(i + 1 - page) <= 1
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        isActive={page === i + 1}
                        onClick={e => { e.preventDefault(); setPage(i + 1); }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                if (
                  (i === 1 && page > 3) ||
                  (i === totalPages - 2 && page < totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={e => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                  aria-disabled={page === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      <Drawer open={drawerOpen} onOpenChange={open => { if (!open) handleDrawerClose(); }} direction="right">
        <DrawerContent className="!max-w-3xl !max-h-none h-full px-4">
          <DrawerHeader className="pl-0">
            <DrawerTitle>{editingTransfer ? 'Edit' : 'Add'} Airport Transfer</DrawerTitle>
          </DrawerHeader>
          <AirportTransferForm
            transfer={editingTransfer || undefined}
            onSubmit={data => {
              const formattedType = data.transport_type === 'hotel_chauffeur' ? 'Hotel Chauffeur' : data.transport_type === 'private_car' ? 'Private Car' : data.transport_type;
              if (editingTransfer) {
                updateMutation.mutate({ id: editingTransfer.id, data: { ...data, transport_type: formattedType } as any });
              } else {
                createMutation.mutate({ ...data, transport_type: formattedType } as any);
              }
            }}
            onCancel={handleDrawerClose}
            isLoading={Boolean(createMutation.isPending) || Boolean(updateMutation.isPending)}
          />
          <DrawerFooter className="pl-0 flex flex-row gap-4">
            <Button type="submit" form="airport-transfer-form" disabled={isLoading} variant="default">{isLoading ? 'Saving...' : 'Save'}</Button>
            <Button type="button" variant="secondary" onClick={handleDrawerClose}>Cancel</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function AirportTransferForm({ transfer, onSubmit, onCancel, isLoading }: {
  transfer?: AirportTransferWithRelations;
  onSubmit: (data: AirportTransferFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<AirportTransferFormData>({
    event_id: transfer?.event_id ?? '',
    hotel_id: transfer?.hotel_id ?? '',
    transport_type: transfer?.transport_type ?? 'hotel_chauffeur',
    max_capacity: transfer?.max_capacity ?? 4,
    used: transfer?.used ?? 0,
    supplier: transfer?.supplier ?? '',
    quote_currency: transfer?.quote_currency ?? 'EUR',
    supplier_quote_per_car_local: transfer?.supplier_quote_per_car_local ?? 0,
    supplier_quote_per_car_gbp: transfer?.supplier_quote_per_car_gbp ?? 0,
    paid_to_supplier: transfer?.paid_to_supplier ?? false,
    outstanding: transfer?.outstanding ?? true,
    markup: transfer?.markup ?? 60,
    notes: transfer?.notes ?? '',
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelOptions, setHotelOptions] = useState<Hotel[]>([]);
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false);
  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);
  const [hotelPopoverOpen, setHotelPopoverOpen] = useState(false);

  useEffect(() => {
    InventoryService.getEvents().then(setEvents);
  }, []);

  useEffect(() => {
    HotelService.getHotels().then(setHotels);
  }, []);

  useEffect(() => {
    setHotelOptions(hotels);
  }, [hotels]);

  // Auto-convert supplier_quote_per_car_local to GBP
  useEffect(() => {
    let ignore = false;
    const doConvert = async () => {
      setIsConvertingCurrency(true);
      try {
        const gbp = await convertCurrency(form.supplier_quote_per_car_local ?? 0, form.quote_currency ?? 'GBP', 'GBP');
        if (!ignore) setForm(f => ({ ...f, supplier_quote_per_car_gbp: gbp }));
      } catch (e) {
        // fallback: do nothing, keep previous value
      } finally {
        if (!ignore) setIsConvertingCurrency(false);
      }
    };
    if ((form.supplier_quote_per_car_local ?? 0) > 0 && (form.quote_currency ?? 'GBP')) {
      doConvert();
    } else {
      setForm(f => ({ ...f, supplier_quote_per_car_gbp: 0 }));
    }
    return () => { ignore = true; };
  }, [form.supplier_quote_per_car_local, form.quote_currency]);

  return (
    <form id="airport-transfer-form" onSubmit={e => {
      e.preventDefault();
      onSubmit(form);
    }} className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
          <h3 className="text-base font-semibold text-card-foreground">Required Fields</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Event ComboBox */}
          <div className="space-y-1.5">
            <Label htmlFor="event_id" className="text-sm font-medium text-muted-foreground">Event *</Label>
            <Popover open={eventPopoverOpen} onOpenChange={setEventPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={eventPopoverOpen}
                  className="w-full justify-between h-9"
                >
                  {events.find(e => e.id === form.event_id)?.name || 'Select event'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search events..." />
                  <CommandList>
                    <CommandEmpty>No events found.</CommandEmpty>
                    {events.map(event => (
                      <CommandItem
                        key={event.id}
                        value={event.name}
                        onSelect={() => {
                          setForm(f => ({ ...f, event_id: event.id }));
                          setEventPopoverOpen(false);
                        }}
                      >
                        {event.name}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {/* Hotel ComboBox */}
          <div className="space-y-1.5">
            <Label htmlFor="hotel_id" className="text-sm font-medium text-muted-foreground">Hotel *</Label>
            <Popover open={hotelPopoverOpen} onOpenChange={setHotelPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={hotelPopoverOpen}
                  className="w-full justify-between h-9"
                >
                  {hotels.find(h => h.id === form.hotel_id)?.name || 'Select hotel'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search hotels..." />
                  <CommandList>
                    <CommandEmpty>No hotels found.</CommandEmpty>
                    {hotels.map(hotel => (
                      <CommandItem
                        key={hotel.id}
                        value={hotel.name}
                        onSelect={() => {
                          setForm(f => ({ ...f, hotel_id: hotel.id }));
                          setHotelPopoverOpen(false);
                        }}
                      >
                        {hotel.name}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transport_type" className="text-sm font-medium text-muted-foreground">Transport Type *</Label>
            <Select value={form.transport_type} onValueChange={val => setForm(f => ({ ...f, transport_type: val as any }))}>
              <SelectTrigger id="transport_type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel_chauffeur">Hotel Chauffeur</SelectItem>
                <SelectItem value="private_car">Private Car</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_capacity" className="text-sm font-medium text-muted-foreground">Max Capacity *</Label>
            <Input id="max_capacity" name="max_capacity" type="number" value={form.max_capacity} onChange={e => setForm(f => ({ ...f, max_capacity: Number(e.target.value) }))} className="h-9" required />
          </div>
        </div>
        {/* Supplier & Pricing Section */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <h3 className="text-base font-semibold text-card-foreground">Supplier & Pricing</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Row 1: Supplier, Quote Currency */}
            <div className="space-y-1.5">
              <Label htmlFor="supplier" className="text-sm font-medium text-muted-foreground">Supplier</Label>
              <Input id="supplier" name="supplier" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quote_currency" className="text-sm font-medium text-muted-foreground">Quote Currency</Label>
              <Select value={form.quote_currency} onValueChange={val => setForm(f => ({ ...f, quote_currency: val }))}>
                <SelectTrigger id="quote_currency" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                  <SelectItem value="SEK">SEK</SelectItem>
                  <SelectItem value="NOK">NOK</SelectItem>
                  <SelectItem value="DKK">DKK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Row 2: Supplier Quote (Local), Supplier Quote (GBP) */}
            <div className="space-y-1.5">
              <Label htmlFor="supplier_quote_per_car_local" className="text-sm font-medium text-muted-foreground">Supplier Quote (Local)</Label>
              <Input id="supplier_quote_per_car_local" name="supplier_quote_per_car_local" type="number" value={form.supplier_quote_per_car_local} onChange={e => setForm(f => ({ ...f, supplier_quote_per_car_local: Number(e.target.value) }))} className="h-9" />
              <div className="text-xs text-muted-foreground">In selected currency</div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier_quote_per_car_gbp" className="text-sm font-medium text-muted-foreground">Supplier Quote (GBP)</Label>
              <Input id="supplier_quote_per_car_gbp" name="supplier_quote_per_car_gbp" type="number" value={form.supplier_quote_per_car_gbp} readOnly className="h-9 bg-muted" />
              <div className="text-xs text-muted-foreground">Auto-converted to GBP</div>
              {isConvertingCurrency && <span className="text-xs text-muted-foreground">Converting...</span>}
            </div>
            {/* Row 3: Markup (%), Live Markup Price */}
            <div className="space-y-1.5">
              <Label htmlFor="markup" className="text-sm font-medium text-muted-foreground">Markup (%)</Label>
              <Input id="markup" name="markup" type="number" value={form.markup} onChange={e => setForm(f => ({ ...f, markup: Number(e.target.value) }))} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Live Markup Price</Label>
              <div className="h-9 flex items-center px-3 rounded-md border bg-muted font-semibold text-base">
                £{calcPriceWithMarkup(form.supplier_quote_per_car_gbp ?? 0, form.markup ?? 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
        {/* Status Section */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <h3 className="text-base font-semibold text-card-foreground">Status</h3>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="paid_to_supplier" checked={form.paid_to_supplier} onCheckedChange={val => setForm(f => ({ ...f, paid_to_supplier: !!val }))} />
              <Label htmlFor="paid_to_supplier" className="text-sm font-medium text-muted-foreground">Paid to Supplier</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="outstanding" checked={form.outstanding} onCheckedChange={val => setForm(f => ({ ...f, outstanding: !!val }))} />
              <Label htmlFor="outstanding" className="text-sm font-medium text-muted-foreground">Outstanding</Label>
            </div>
          </div>
        </div>
        {/* Details Section */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <h3 className="text-base font-semibold text-card-foreground">Details</h3>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">Notes</Label>
            <Input id="notes" name="notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="h-9" />
          </div>
        </div>
      </div>
    </form>
  );
} 