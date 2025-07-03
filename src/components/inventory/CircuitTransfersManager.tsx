import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Plus, Edit, Trash2, Settings, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { InventoryService } from '@/lib/inventoryService';
import { HotelService } from '@/lib/hotelService';
import type { CircuitTransfer, CircuitTransferInsert, CircuitTransferUpdate, Event, Hotel, TransferType, CircuitTransferFormData } from '@/types/inventory';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const COLUMN_CONFIG = [
  { key: 'event', label: 'Event' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'transfer_type', label: 'Type' },
  { key: 'coach_capacity', label: 'Coach Capacity' },
  { key: 'coaches_required', label: 'Coaches Required' },
  { key: 'days', label: 'Days' },
  { key: 'quote_hours', label: 'Quote Hours' },
  { key: 'expected_hours', label: 'Expected Hours' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'coach_cost_per_day_local', label: 'Coach Cost/Day (Local)' },
  { key: 'cost_per_extra_hour_per_coach_per_day', label: 'Extra Hour/Coach/Day' },
  { key: 'coach_vat_tax_if_not_included_in_price', label: 'Coach VAT %' },
  { key: 'parking_ticket_per_coach_per_day', label: 'Parking/Coach/Day' },
  { key: 'supplier_currency', label: 'Supplier Currency' },
  { key: 'guide_included_in_coach_cost', label: 'Guide Included in Coach Cost' },
  { key: 'guide_cost_per_day', label: 'Guide Cost/Day' },
  { key: 'cost_per_extra_hour_per_guide_per_day', label: 'Extra Hour/Guide/Day' },
  { key: 'vat_tax_if_not_included_in_guide_price', label: 'Guide VAT %' },
  { key: 'total_coach_cost_local', label: 'Total Coach Cost Local' },
  { key: 'total_coach_cost_gbp', label: 'Total Coach Cost GBP' },
  { key: 'total_guide_cost_local', label: 'Total Guide Cost Local' },
  { key: 'total_guide_cost_gbp', label: 'Total Guide Cost GBP' },
  { key: 'provider_guides', label: 'Provider Guides' },
  { key: 'utilisation_percent', label: 'Utilisation %' },
  { key: 'utilisation_cost_per_seat_local', label: 'Utilisation/Seat Local' },
  { key: 'utilisation_cost_per_seat_gbp', label: 'Utilisation/Seat GBP' },
  { key: 'markup_percent', label: 'Markup %' },
  { key: 'sell_price_per_seat_gbp', label: 'Sell Price/Seat GBP' },
  { key: 'active', label: 'Active' },
  { key: 'notes', label: 'Notes' },
  { key: 'actions', label: 'Actions' },
];
const DEFAULT_COLUMNS = COLUMN_CONFIG.map(c => c.key);
const COLUMN_STORAGE_KEY = 'circuitTransfersManagerTableVisibleColumns_v1';

// Utility to calculate price with markup
const calcPriceWithMarkup = (price: number, markup: number) =>
  parseFloat((price + price * (markup / 100)).toFixed(2));

// Live FX rate API using exchangerate-api.com (free tier)
const EXCHANGE_RATE_API_BASE = 'https://api.exchangerate-api.com/v4/latest';

// Cache for exchange rates to avoid excessive API calls
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Utility to get currency symbol
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

// Utility to convert currency using live rates
const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return parseFloat((amount * cached.rate).toFixed(2));
  }
  try {
    const response = await fetch(`${EXCHANGE_RATE_API_BASE}/${fromCurrency}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
    }
    const data = await response.json();
    const rate = data.rates[toCurrency];
    if (!rate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }
    rateCache.set(cacheKey, { rate, timestamp: Date.now() });
    return parseFloat((amount * rate).toFixed(2));
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Fallback to a reasonable estimate if API fails
    const fallbackRates: Record<string, Record<string, number>> = {
      EUR: { GBP: 0.85, USD: 1.08, EUR: 1.0 },
      GBP: { EUR: 1.18, USD: 1.27, GBP: 1.0 },
      USD: { EUR: 0.93, GBP: 0.79, USD: 1.0 },
    };
    const fallbackRate = fallbackRates[fromCurrency]?.[toCurrency];
    if (fallbackRate) {
      return parseFloat((amount * fallbackRate).toFixed(2));
    }
    return amount; // Return original amount if conversion fails
  }
};

// Calculation utilities
function calculateCoachesRequired(seats_reserved: number, seat_capacity: number): number {
  return Math.ceil((seats_reserved || 0) / Math.max(seat_capacity || 1, 1));
}
function calculateCoachCostLocal(total_cost: number): number {
  return total_cost || 0;
}
function calculateGuideCostLocal(guide_included: boolean, guide_cost: number | null): number {
  if (guide_included) return 0;
  return guide_cost || 0;
}
function calculateUtilisationCostPerSeatLocal(coach_cost_local: number, guide_cost_local: number, seat_capacity: number, min_fill_percent: number): number {
  return (
    (Number(coach_cost_local) + Number(guide_cost_local)) /
    (Math.max(seat_capacity || 1, 1) * ((min_fill_percent || 100) / 100))
  );
}
function calculateSellPricePerSeatGBP(utilisation_cost_per_seat_gbp: number | null, markup_percent: number): number | null {
  if (utilisation_cost_per_seat_gbp == null) return null;
  return utilisation_cost_per_seat_gbp * (1 + (markup_percent || 0) / 100);
}

async function fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return 1;
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate;
  }
  try {
    const response = await fetch(`${EXCHANGE_RATE_API_BASE}/${fromCurrency}`);
    if (!response.ok) throw new Error('Failed to fetch exchange rate');
    const data = await response.json();
    const rate = data.rates[toCurrency];
    if (!rate) throw new Error('Exchange rate not available');
    rateCache.set(cacheKey, { rate, timestamp: Date.now() });
    return rate;
  } catch (error) {
    // fallback to 1 if error
    return 1;
  }
}

// Add a utility to safely get a property from a transfer, with fallback
function getSafeProp<T, K extends keyof T>(obj: T, key: K, fallback: any = ''): any {
  return obj && typeof obj === 'object' && key in obj ? obj[key] : fallback;
}

export default function CircuitTransfersManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<CircuitTransfer | null>(null);
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterType, setFilterType] = useState<TransferType | 'all'>('all');
  const [filterHotel, setFilterHotel] = useState<string>('all');
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
  const [sortKey, setSortKey] = useState('event');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Exchange rate for GBP calculations (default 1.0)
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  // Form state for only editable fields
  const [form, setForm] = useState<Partial<CircuitTransferFormData>>({});

  // Fetch events, hotels, and circuit transfers
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });
  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => HotelService.getHotels(),
  });
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['circuit-transfers', filterEvent, filterType, filterHotel, search],
    queryFn: () => InventoryService.getCircuitTransfers({
      event_id: filterEvent !== 'all' ? filterEvent : undefined,
      transfer_type: filterType !== 'all' ? filterType as TransferType : undefined,
      search: search || undefined,
    }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CircuitTransferInsert) => InventoryService.createCircuitTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuit-transfers'] });
      toast.success('Circuit transfer created');
      setDrawerOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CircuitTransferUpdate }) => InventoryService.updateCircuitTransfer(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuit-transfers'] });
      toast.success('Circuit transfer updated');
      setDrawerOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteCircuitTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuit-transfers'] });
      toast.success('Circuit transfer deleted');
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Sorting, filtering, and search
  const filteredTransfers = useMemo(() => transfers.filter(tr => {
    if (filterEvent !== 'all' && tr.event_id !== filterEvent) return false;
    if (filterType !== 'all' && tr.transfer_type !== filterType) return false;
    if (filterHotel !== 'all' && tr.hotel_id !== filterHotel) return false;
    if (search) {
      const eventName = events.find(e => e.id === tr.event_id)?.name || '';
      const hotelName = hotels.find(h => h.id === tr.hotel_id)?.name || '';
      if (!eventName.toLowerCase().includes(search.toLowerCase()) &&
          !hotelName.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
    }
    return true;
  }), [transfers, filterEvent, filterType, filterHotel, search, events, hotels]);

  const sortedTransfers = useMemo(() => [...filteredTransfers].sort((a, b) => {
    let aValue: any, bValue: any;
    switch (sortKey) {
      case 'event':
        aValue = events.find(e => e.id === a.event_id)?.name || '';
        bValue = events.find(e => e.id === b.event_id)?.name || '';
        break;
      case 'hotel':
        aValue = hotels.find(h => h.id === a.hotel_id)?.name || '';
        bValue = hotels.find(h => h.id === b.hotel_id)?.name || '';
        break;
      default:
        aValue = getSafeProp(a, sortKey as keyof typeof a, '');
        bValue = getSafeProp(b, sortKey as keyof typeof b, '');
    }
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }), [filteredTransfers, sortKey, sortDir, events, hotels]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(sortedTransfers.length / pageSize));
  const paginatedTransfers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTransfers.slice(start, start + pageSize);
  }, [sortedTransfers, currentPage, pageSize]);

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
    if (selectedRows.size === paginatedTransfers.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedTransfers.map(tr => tr.id)));
    }
  }, [selectedRows.size, paginatedTransfers]);

  // Handle edit/create
  const handleEdit = (transfer: CircuitTransfer) => {
    setEditingTransfer(transfer);
    setForm(mapTransferToForm(transfer));
    setDrawerOpen(true);
  };
  const handleCreate = () => {
    setEditingTransfer(null);
    setForm({});
    setDrawerOpen(true);
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this circuit transfer?')) {
      deleteMutation.mutate(id);
    }
  };
  const handleSubmit = () => {
    if (editingTransfer) {
      updateMutation.mutate({ id: editingTransfer.id, updates: form as CircuitTransferUpdate });
    } else {
      createMutation.mutate(form as CircuitTransferInsert);
    }
  };

  // Live calculations for derived fields
  const [calculated, setCalculated] = useState({
    coach_cost_local: 0,
    guide_cost_local: 0,
    utilisation_cost_per_seat_local: 0,
    coach_cost_gbp: 0,
    guide_cost_gbp: 0,
    utilisation_cost_per_seat_gbp: 0,
    sell_price_per_seat_gbp: 0,
    coaches_required: 0,
  });

  useEffect(() => {
    // Helper for coalesce
    const coalesce = (v: any, fallback: any) => v != null ? v : fallback;
    // Calculate coaches_required (read-only, backend-calculated, but needed for frontend calculations)
    // If used is not available, fallback to 0
    const used = 0; // You may want to fetch this if needed
    const coach_capacity = coalesce(form.coach_capacity, 1);
    const coaches_required = Math.ceil(used / Math.max(coach_capacity, 1));
    const typedForm = form as import('@/types/inventory').CircuitTransferFormData;
    // Coach cost local
    const coach_cost_local = ((coalesce(form.coach_cost_per_day_local, 0) * coalesce(form.days, 0) + coalesce(form.parking_ticket_per_coach_per_day, 0) * coalesce(form.days, 0) * coaches_required) * (1 + coalesce(typedForm.coach_vat, 0) / 100));
    // Guide cost local
    const guide_cost_local = typedForm.guide_included
      ? 0
      : (coalesce(form.guide_cost_per_day, 0) * coalesce(form.days, 0) * (1 + coalesce(typedForm.guide_vat, 0) / 100));
    // Utilisation cost per seat local
    const utilisation_cost_per_seat_local = (coach_cost_local + guide_cost_local) / (coach_capacity * (coalesce(form.utilisation_percent, 100) / 100));
    // GBP calculations
    const coach_cost_gbp = coach_cost_local * exchangeRate;
    const guide_cost_gbp = guide_cost_local * exchangeRate;
    const utilisation_cost_per_seat_gbp = (coach_cost_gbp + guide_cost_gbp) / (coach_capacity * (coalesce(form.utilisation_percent, 100) / 100));
    const sell_price_per_seat_gbp = utilisation_cost_per_seat_gbp * (1 + coalesce(form.markup_percent, 0) / 100);
    setCalculated({
      coach_cost_local,
      guide_cost_local,
      utilisation_cost_per_seat_local,
      coach_cost_gbp,
      guide_cost_gbp,
      utilisation_cost_per_seat_gbp,
      sell_price_per_seat_gbp,
      coaches_required,
    });
    // Also update these in the form state for submission
    setForm((f: Partial<CircuitTransferFormData>) => ({
      ...f,
      coach_cost_local,
      guide_cost_local,
      utilisation_cost_per_seat_local,
      coach_cost_gbp,
      guide_cost_gbp,
      utilisation_cost_per_seat_gbp,
      sell_price_per_seat_gbp,
    }));
  }, [
    form.coach_cost_per_day_local,
    form.days,
    form.parking_ticket_per_coach_per_day,
    // form.coaches_required, // not in form
    (form as import('@/types/inventory').CircuitTransferFormData).coach_vat,
    (form as import('@/types/inventory').CircuitTransferFormData).guide_included,
    form.guide_cost_per_day,
    (form as import('@/types/inventory').CircuitTransferFormData).guide_vat,
    form.utilisation_percent,
    form.coach_capacity,
    form.markup_percent,
    exchangeRate,
  ]);

  useEffect(() => {
    let ignore = false;
    async function updateRate() {
      if (!form.supplier_currency || form.supplier_currency === 'GBP') {
        setExchangeRate(1.0);
        return;
      }
      setIsFetchingRate(true);
      const rate = await fetchExchangeRate(form.supplier_currency, 'GBP');
      if (!ignore) setExchangeRate(rate);
      setIsFetchingRate(false);
    }
    updateRate();
    return () => { ignore = true; };
  }, [form.supplier_currency]);

  // Move getColumnValue inside the CircuitTransfersManager component, after events, hotels, and form are defined.
  function getColumnValue(tr: CircuitTransfer, key: string) {
    switch (key) {
      case 'event': return events.find(e => e.id === tr.event_id)?.name || '';
      case 'hotel': return hotels.find(h => h.id === tr.hotel_id)?.name || '';
      case 'transfer_type': return tr.transfer_type;
      case 'coach_capacity': return tr.coach_capacity;
      case 'coaches_required': return tr.coaches_required;
      case 'days': return tr.days;
      case 'quote_hours': return tr.quote_hours;
      case 'expected_hours': return tr.expected_hours;
      case 'supplier': return tr.supplier;
      case 'coach_cost_per_day_local': return tr.coach_cost_per_day_local;
      case 'cost_per_extra_hour_per_coach_per_day': return tr.cost_per_extra_hour_per_coach_per_day;
      case 'coach_vat_tax_if_not_included_in_price': return tr.coach_vat_tax_if_not_included_in_price;
      case 'parking_ticket_per_coach_per_day': return tr.parking_ticket_per_coach_per_day;
      case 'supplier_currency': return tr.supplier_currency;
      case 'guide_included_in_coach_cost': return tr.guide_included_in_coach_cost ? 'Yes' : 'No';
      case 'guide_cost_per_day': return tr.guide_cost_per_day;
      case 'cost_per_extra_hour_per_guide_per_day': return tr.cost_per_extra_hour_per_guide_per_day;
      case 'vat_tax_if_not_included_in_guide_price': return tr.vat_tax_if_not_included_in_guide_price;
      case 'total_coach_cost_local': return tr.total_coach_cost_local;
      case 'total_coach_cost_gbp': return tr.total_coach_cost_gbp;
      case 'total_guide_cost_local': return tr.total_guide_cost_local;
      case 'total_guide_cost_gbp': return tr.total_guide_cost_gbp;
      case 'provider_guides': return tr.provider_guides;
      case 'utilisation_percent': return tr.utilisation_percent;
      case 'utilisation_cost_per_seat_local': return tr.utilisation_cost_per_seat_local;
      case 'utilisation_cost_per_seat_gbp': return tr.utilisation_cost_per_seat_gbp;
      case 'markup_percent': return tr.markup_percent;
      case 'sell_price_per_seat_gbp': return tr.sell_price_per_seat_gbp;
      case 'active': return tr.active ? 'Yes' : 'No';
      case 'notes': return tr.notes;
      default: return '';
    }
  }

  // Add a mapping function for handleEdit to ensure all required fields exist
  function mapTransferToForm(transfer: CircuitTransfer): Partial<CircuitTransferFormData> {
    return {
      id: transfer.id,
      event_id: transfer.event_id,
      hotel_id: transfer.hotel_id,
      transfer_type: transfer.transfer_type,
      coach_capacity: transfer.coach_capacity,
      days: transfer.days,
      quote_hours: transfer.quote_hours,
      expected_hours: transfer.expected_hours,
      supplier: transfer.supplier,
      coach_cost_per_day_local: transfer.coach_cost_per_day_local,
      coach_vat: 'coach_vat' in transfer ? (transfer as any).coach_vat ?? 0 : 0,
      parking_ticket_per_coach_per_day: transfer.parking_ticket_per_coach_per_day,
      supplier_currency: transfer.supplier_currency,
      guide_included: 'guide_included' in transfer ? (transfer as any).guide_included ?? false : false,
      guide_cost_per_day: transfer.guide_cost_per_day,
      guide_vat: 'guide_vat' in transfer ? (transfer as any).guide_vat ?? 0 : 0,
      markup_percent: transfer.markup_percent,
      utilisation_percent: transfer.utilisation_percent,
      active: transfer.active,
      notes: transfer.notes,
    };
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-6">
              <CardTitle>Circuit Transfers</CardTitle>
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
            <div className="flex items-center gap-2">
              <Button variant="default" className="font-semibold shadow-md gap-2" onClick={handleCreate}>
                <Plus className="h-5 w-5" />
                Add Circuit Transfer
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
                    placeholder="Search circuit transfers..."
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
                    setFilterType('all');
                    setFilterHotel('all');
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
                {/* Hotel Filter */}
                <div>
                  <Select
                    value={filterHotel}
                    onValueChange={setFilterHotel}
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
                {/* Type Filter */}
                <div>
                  <Select
                    value={filterType}
                    onValueChange={v => setFilterType(v as TransferType | 'all')}
                  >
                    <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="mpv">MPV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Active Filters Count */}
                <div>
                  <div className={`h-8 min-w-[40px] flex items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors ${[
                    filterEvent !== 'all' ? filterEvent : null,
                    filterType !== 'all' ? filterType : null,
                    filterHotel !== 'all' ? filterHotel : null,
                    search ? 'search' : null
                  ].filter(Boolean).length > 0
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted/30 text-muted-foreground border-muted/30'}`}
                  >
                    {[
                      filterEvent !== 'all' ? filterEvent : null,
                      filterType !== 'all' ? filterType : null,
                      filterHotel !== 'all' ? filterHotel : null,
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
                    checked={selectedRows.size === paginatedTransfers.length && paginatedTransfers.length > 0}
                    onCheckedChange={toggleAllRows}
                    aria-label="Select all transfers"
                  />
                </TableHead>
                {COLUMN_CONFIG.filter(col => visibleColumns.has(col.key)).map(col => (
                  <TableHead
                    key={col.key}
                    className={['event', 'hotel', 'transfer_type', 'seat_capacity', 'supplier', 'total_cost', 'currency', 'markup_percent', 'price_per_seat', 'active'].includes(col.key) ? 'cursor-pointer select-none' : ''}
                    onClick={() => {
                      if ([
                        'event', 'hotel', 'transfer_type', 'seat_capacity', 'supplier', 'total_cost', 'currency', 'markup_percent', 'price_per_seat', 'active'
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransfers.map(tr => (
                <TableRow key={tr.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(tr.id)}
                      onCheckedChange={() => toggleRowSelection(tr.id)}
                      aria-label="Select transfer"
                    />
                  </TableCell>
                  {visibleColumns.has('event') && (
                    <TableCell>{getColumnValue(tr, 'event')}</TableCell>
                  )}
                  {visibleColumns.has('hotel') && (
                    <TableCell>{getColumnValue(tr, 'hotel')}</TableCell>
                  )}
                  {visibleColumns.has('transfer_type') && (
                    <TableCell>{getColumnValue(tr, 'transfer_type')}</TableCell>
                  )}
                  {visibleColumns.has('seat_capacity') && (
                    <TableCell>{getColumnValue(tr, 'seat_capacity')}</TableCell>
                  )}
                  {visibleColumns.has('supplier') && (
                    <TableCell>{getColumnValue(tr, 'supplier')}</TableCell>
                  )}
                  {visibleColumns.has('total_cost') && (
                    <TableCell>{getColumnValue(tr, 'total_cost')}</TableCell>
                  )}
                  {visibleColumns.has('currency') && (
                    <TableCell>{getColumnValue(tr, 'currency')}</TableCell>
                  )}
                  {visibleColumns.has('markup_percent') && (
                    <TableCell>{getColumnValue(tr, 'markup_percent')}</TableCell>
                  )}
                  {visibleColumns.has('price_per_seat') && (
                    <TableCell>{getColumnValue(tr, 'price_per_seat')}</TableCell>
                  )}
                  {visibleColumns.has('active') && (
                    <TableCell>{getColumnValue(tr, 'active')}</TableCell>
                  )}
                  {visibleColumns.has('actions') && (
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(tr)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(tr.id)} className="ml-2">
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
            <DrawerTitle>{editingTransfer ? 'Edit Circuit Transfer' : 'New Circuit Transfer'}</DrawerTitle>
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
                    <Select value={form.event_id || ''} onValueChange={(v: string) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, event_id: v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select event" /></SelectTrigger>
                      <SelectContent>
                        {events.map(evt => <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hotel_id">Hotel *</Label>
                    <Select value={form.hotel_id || ''} onValueChange={(v: string) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, hotel_id: v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select hotel" /></SelectTrigger>
                      <SelectContent>
                        {hotels.map(hotel => <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="transfer_type">Transfer Type *</Label>
                    <Select value={form.transfer_type ?? 'coach'} onValueChange={(v: TransferType) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, transfer_type: v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="mpv">MPV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="active">Active</Label>
                    <Checkbox id="active" checked={!!form.active} onCheckedChange={(checked) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, active: Boolean(checked) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={form.notes ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
              </div>
              {/* Section 2: Coach Details */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <h3 className="text-base font-semibold text-card-foreground">Coach Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="coach_capacity">Coach Capacity</Label>
                    <Input type="number" id="coach_capacity" value={form.coach_capacity ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, coach_capacity: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="days">Days</Label>
                    <Input type="number" id="days" value={form.days ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, days: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quote_hours">Quote Hours</Label>
                    <Input type="number" id="quote_hours" value={form.quote_hours ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, quote_hours: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expected_hours">Expected Hours</Label>
                    <Input type="number" id="expected_hours" value={form.expected_hours ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, expected_hours: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input id="supplier" value={form.supplier ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, supplier: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coach_cost_per_day_local">Coach Cost/Day (Local)</Label>
                    <Input type="number" id="coach_cost_per_day_local" value={form.coach_cost_per_day_local ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, coach_cost_per_day_local: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coach_vat">Coach VAT %</Label>
                    <Input type="number" id="coach_vat" value={form.coach_vat ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, coach_vat: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="parking_ticket_per_coach_per_day">Parking/Coach/Day</Label>
                    <Input type="number" id="parking_ticket_per_coach_per_day" value={form.parking_ticket_per_coach_per_day ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, parking_ticket_per_coach_per_day: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier_currency">Supplier Currency</Label>
                    <Input id="supplier_currency" value={form.supplier_currency ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, supplier_currency: e.target.value }))} />
                  </div>
                </div>
              </div>
              {/* Section 3: Guide Details */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <h3 className="text-base font-semibold text-card-foreground">Guide Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex items-center gap-2">
                    <Label htmlFor="guide_included">Guide Included</Label>
                    <Checkbox id="guide_included" checked={!!form.guide_included} onCheckedChange={(checked) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, guide_included: Boolean(checked) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guide_cost_per_day">Guide Cost/Day</Label>
                    <Input type="number" id="guide_cost_per_day" value={form.guide_cost_per_day ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, guide_cost_per_day: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="guide_vat">Guide VAT %</Label>
                    <Input type="number" id="guide_vat" value={form.guide_vat ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, guide_vat: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>
              {/* Section 4: Pricing & Utilisation */}
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <h3 className="text-base font-semibold text-card-foreground">Pricing & Utilisation</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="utilisation_percent">Utilisation %</Label>
                    <Input type="number" id="utilisation_percent" value={form.utilisation_percent ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, utilisation_percent: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="markup_percent">Markup %</Label>
                    <Input type="number" id="markup_percent" value={form.markup_percent ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, markup_percent: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Exchange Rate (to GBP)</Label>
                    <Input type="number" value={exchangeRate} readOnly />
                    {isFetchingRate && <span className="text-xs text-muted-foreground">Fetching rate...</span>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Coach Cost Local</Label>
                    <Input type="number" value={calculated.coach_cost_local} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Guide Cost Local</Label>
                    <Input type="number" value={calculated.guide_cost_local} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Utilisation Cost/Seat Local</Label>
                    <Input type="number" value={calculated.utilisation_cost_per_seat_local} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Coach Cost GBP</Label>
                    <Input type="number" value={calculated.coach_cost_gbp} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Guide Cost GBP</Label>
                    <Input type="number" value={calculated.guide_cost_gbp} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Utilisation Cost/Seat GBP</Label>
                    <Input type="number" value={calculated.utilisation_cost_per_seat_gbp} readOnly />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sell Price/Seat GBP</Label>
                    <Input type="number" value={calculated.sell_price_per_seat_gbp} readOnly />
                  </div>
                </div>
              </div>
            </form>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmit}>
              {editingTransfer ? 'Update' : 'Create'}
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
} 