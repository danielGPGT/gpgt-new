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
  { key: 'used', label: 'Used' },
  { key: 'coach_capacity', label: 'Coach Capacity' },
  { key: 'coaches_required', label: 'Coaches Required' },
  { key: 'days', label: 'Days' },
  { key: 'quote_hours', label: 'Quote Hours' },
  { key: 'expected_hours', label: 'Expected Hours' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'coach_cost_per_day_local', label: 'Coach Cost/Day' },
  { key: 'coach_cost_per_hour_local', label: 'Coach Cost/Hour' },
  { key: 'coach_extra_cost_per_hour_local', label: 'Coach Extra/Hour' },
  { key: 'coach_vat', label: 'Coach VAT' },
  { key: 'parking_ticket_per_coach_per_day', label: 'Parking/Coach/Day' },
  { key: 'supplier_currency', label: 'Currency' },
  { key: 'guide_included', label: 'Guide Included' },
  { key: 'guide_cost_per_day', label: 'Guide Cost/Day' },
  { key: 'guide_cost_per_hour_local', label: 'Guide Cost/Hour' },
  { key: 'guide_extra_cost_per_hour_local', label: 'Guide Extra/Hour' },
  { key: 'guide_vat', label: 'Guide VAT' },
  { key: 'markup_percent', label: 'Markup' },
  { key: 'utilisation_percent', label: 'Utilisation' },
  { key: 'coach_cost_local', label: 'Coach Cost Total' },
  { key: 'guide_cost_local', label: 'Guide Cost Total' },
  { key: 'utilisation_cost_per_seat_local', label: 'Cost/Seat' },
  { key: 'coach_cost_gbp', label: 'Coach Cost (£)' },
  { key: 'guide_cost_gbp', label: 'Guide Cost (£)' },
  { key: 'utilisation_cost_per_seat_gbp', label: 'Cost/Seat (£)' },
  { key: 'sell_price_per_seat_gbp', label: 'Sell Price/Seat (£)' },
  { key: 'active', label: 'Active' },
  { key: 'notes', label: 'Notes' },
  { key: 'actions', label: 'Actions' },
];
const DEFAULT_COLUMNS = [
  'event',
  'hotel', 
  'transfer_type',
  'used',
  'coach_capacity',
  'coaches_required',
  'days',
  'supplier',
  'coach_cost_per_day_local',
  'supplier_currency',
  'guide_included',
  'markup_percent',
  'utilisation_percent',
  'sell_price_per_seat_gbp',
  'active',
  'actions'
];
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

// Utility to round to 2 decimals
function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
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

  // Add state for validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
    setForm({ markup_percent: 60 });
    setDrawerOpen(true);
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this circuit transfer?')) {
      deleteMutation.mutate(id);
    }
  };
  const handleSubmit = () => {
    if (!validateForm()) return;
    const payload = {
      event_id: form.event_id,
      hotel_id: form.hotel_id,
      transfer_type: form.transfer_type,
      coach_capacity: form.coach_capacity,
      days: form.days,
      quote_hours: form.quote_hours,
      expected_hours: form.expected_hours,
      supplier: form.supplier,
      coach_cost_per_day_local: form.coach_cost_per_day_local,
      coach_cost_per_hour_local: calculated.coach_cost_per_hour_local,
      coach_vat: form.coach_vat,
      parking_ticket_per_coach_per_day: form.parking_ticket_per_coach_per_day,
      supplier_currency: form.supplier_currency,
      guide_included: form.guide_included,
      guide_cost_per_day: form.guide_cost_per_day,
      guide_cost_per_hour_local: calculated.guide_cost_per_hour_local,
      guide_vat: form.guide_vat,
      markup_percent: form.markup_percent,
      utilisation_percent: form.utilisation_percent,
      active: form.active,
      notes: form.notes,
      // Calculated fields
      coach_extra_cost_per_hour_local: calculated.coach_extra_cost_per_hour_local,
      guide_extra_cost_per_hour_local: !form.guide_included ? calculated.guide_extra_cost_per_hour_local : 0,
      coach_cost_local: calculated.coach_cost_local,
      guide_cost_local: !form.guide_included ? calculated.guide_cost_local : 0,
      utilisation_cost_per_seat_local: calculated.utilisation_cost_per_seat_local,
      coach_cost_gbp: calculated.coach_cost_gbp,
      guide_cost_gbp: !form.guide_included ? calculated.guide_cost_gbp : 0,
      utilisation_cost_per_seat_gbp: calculated.utilisation_cost_per_seat_gbp,
      sell_price_per_seat_gbp: calculated.sell_price_per_seat_gbp,
    };
    if (editingTransfer) {
      updateMutation.mutate({ id: editingTransfer.id, updates: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Live calculations for derived fields
  const [calculated, setCalculated] = useState({
    coach_cost_per_hour_local: 0,
    guide_cost_per_hour_local: 0,
    coach_extra_cost_per_hour_local: 0,
    guide_extra_cost_per_hour_local: 0,
    coach_cost_local: 0,
    guide_cost_local: 0,
    utilisation_cost_per_seat_local: 0,
    coach_cost_gbp: 0,
    guide_cost_gbp: 0,
    utilisation_cost_per_seat_gbp: 0,
    sell_price_per_seat_gbp: 0,
  });

  useEffect(() => {
    const coalesce = (v: any, fallback: any) => v != null ? v : fallback;
    const used = coalesce(form.used, 0);
    const coach_capacity = coalesce(form.coach_capacity, 1);
    const days = coalesce(form.days, 0);
    const quote_hours = coalesce(form.quote_hours, 1);
    const expected_hours = coalesce(form.expected_hours, quote_hours);
    const coach_cost_per_day_local = coalesce(form.coach_cost_per_day_local, 0);
    const coach_vat = coalesce(form.coach_vat, 0);
    const parking_ticket_per_coach_per_day = coalesce(form.parking_ticket_per_coach_per_day, 0);
    const supplier_currency = form.supplier_currency || 'EUR';
    const guide_included = !!form.guide_included;
    const guide_cost_per_day = coalesce(form.guide_cost_per_day, 0);
    const guide_vat = coalesce(form.guide_vat, 0);
    const markup_percent = coalesce(form.markup_percent, 0);
    const utilisation_percent = coalesce(form.utilisation_percent, 100);
    const exchange_rate = exchangeRate;
    // Calculated fields
    const coaches_required = Math.ceil(used / Math.max(coach_capacity, 1));
    // Coach cost per hour
    const coach_cost_per_hour_local = quote_hours > 0 ? round2(coach_cost_per_day_local / quote_hours) : 0;
    // Guide cost per hour
    const guide_cost_per_hour_local = (!guide_included && quote_hours > 0) ? round2(guide_cost_per_day / quote_hours) : 0;
    // Coach extra cost per hour
    const coach_extra_cost_per_hour_local = quote_hours > 0 ? round2(coach_cost_per_day_local / quote_hours) : 0;
    // Guide extra cost per hour
    const guide_extra_cost_per_hour_local = (!guide_included && quote_hours > 0) ? round2(guide_cost_per_day / quote_hours) : 0;
    // Coach cost local
    const coach_cost_local = round2((
      (coach_cost_per_day_local * days) +
      (coach_extra_cost_per_hour_local * (expected_hours - quote_hours) * days) +
      (parking_ticket_per_coach_per_day * days)
    ) * (1 + coach_vat / 100));
    // Guide cost local
    let guide_cost_local = 0;
    if (!guide_included) {
      guide_cost_local = round2((
        (guide_cost_per_day * days) +
        (guide_extra_cost_per_hour_local * (expected_hours - quote_hours) * days)
      ) * (1 + guide_vat / 100));
    }
    // Utilisation cost per seat local
    const utilisation_cost_per_seat_local = round2((coach_cost_local + guide_cost_local) / (coach_capacity * (utilisation_percent / 100)));
    // GBP conversions
    const coach_cost_gbp = round2(coach_cost_local * exchange_rate);
    const guide_cost_gbp = !guide_included ? round2(guide_cost_local * exchange_rate) : 0;
    // Utilisation cost per seat GBP
    const utilisation_cost_per_seat_gbp = round2((coach_cost_gbp + guide_cost_gbp) / (coach_capacity * (utilisation_percent / 100)));
    // Sell price per seat GBP
    const sell_price_per_seat_gbp = round2(utilisation_cost_per_seat_gbp * (1 + markup_percent / 100));
    setCalculated({
      coach_cost_per_hour_local,
      guide_cost_per_hour_local,
      coach_extra_cost_per_hour_local,
      guide_extra_cost_per_hour_local,
      coach_cost_local,
      guide_cost_local,
      utilisation_cost_per_seat_local,
      coach_cost_gbp,
      guide_cost_gbp,
      utilisation_cost_per_seat_gbp,
      sell_price_per_seat_gbp,
    });
  }, [
    form.used,
    form.coach_capacity,
    form.days,
    form.quote_hours,
    form.expected_hours,
    form.coach_cost_per_day_local,
    form.coach_vat,
    form.parking_ticket_per_coach_per_day,
    form.supplier_currency,
    form.guide_included,
    form.guide_cost_per_day,
    form.guide_vat,
    form.markup_percent,
    form.utilisation_percent,
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
    const formatCurrency = (amount: number | null, currency: string) => {
      if (amount == null) return '';
      const symbol = getCurrencySymbol(currency);
      return `${symbol}${amount.toFixed(2)}`;
    };

    const formatPercent = (value: number | null) => {
      if (value == null) return '';
      return `${value.toFixed(1)}%`;
    };

    switch (key) {
      case 'event': return events.find(e => e.id === tr.event_id)?.name || '';
      case 'hotel': return hotels.find(h => h.id === tr.hotel_id)?.name || '';
      case 'transfer_type': return tr.transfer_type;
      case 'used': return tr.used;
      case 'coach_capacity': return tr.coach_capacity;
      case 'coaches_required': return tr.coaches_required;
      case 'days': return tr.days;
      case 'quote_hours': return tr.quote_hours;
      case 'expected_hours': return tr.expected_hours;
      case 'supplier': return tr.supplier;
      case 'coach_cost_per_day_local': return formatCurrency(tr.coach_cost_per_day_local, tr.supplier_currency);
      case 'coach_cost_per_hour_local': return formatCurrency(tr.coach_cost_per_hour_local, tr.supplier_currency);
      case 'coach_extra_cost_per_hour_local': return formatCurrency(tr.coach_extra_cost_per_hour_local, tr.supplier_currency);
      case 'coach_vat': return formatPercent(tr.coach_vat);
      case 'parking_ticket_per_coach_per_day': return formatCurrency(tr.parking_ticket_per_coach_per_day, tr.supplier_currency);
      case 'supplier_currency': return tr.supplier_currency;
      case 'guide_included': return tr.guide_included ? 'Yes' : 'No';
      case 'guide_cost_per_day': return formatCurrency(tr.guide_cost_per_day, tr.supplier_currency);
      case 'guide_cost_per_hour_local': return formatCurrency(tr.guide_cost_per_hour_local, tr.supplier_currency);
      case 'guide_extra_cost_per_hour_local': return formatCurrency(tr.guide_extra_cost_per_hour_local, tr.supplier_currency);
      case 'guide_vat': return formatPercent(tr.guide_vat);
      case 'markup_percent': return formatPercent(tr.markup_percent);
      case 'utilisation_percent': return formatPercent(tr.utilisation_percent);
      case 'coach_cost_local': return formatCurrency(tr.coach_cost_local, tr.supplier_currency);
      case 'guide_cost_local': return formatCurrency(tr.guide_cost_local, tr.supplier_currency);
      case 'utilisation_cost_per_seat_local': return formatCurrency(tr.utilisation_cost_per_seat_local, tr.supplier_currency);
      case 'coach_cost_gbp': return formatCurrency(tr.coach_cost_gbp, 'GBP');
      case 'guide_cost_gbp': return formatCurrency(tr.guide_cost_gbp, 'GBP');
      case 'utilisation_cost_per_seat_gbp': return formatCurrency(tr.utilisation_cost_per_seat_gbp, 'GBP');
      case 'sell_price_per_seat_gbp': return formatCurrency(tr.sell_price_per_seat_gbp, 'GBP');
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

  // Validation logic before submit
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    // Coach details required
    if (!form.event_id) newErrors.event_id = 'Event is required';
    if (!form.hotel_id) newErrors.hotel_id = 'Hotel is required';
    if (!form.transfer_type) newErrors.transfer_type = 'Transfer type is required';
    if (form.coach_capacity == null || form.coach_capacity <= 0) newErrors.coach_capacity = 'Coach capacity is required';
    if (form.days == null || form.days <= 0) newErrors.days = 'Days is required';
    if (form.quote_hours == null || form.quote_hours <= 0) newErrors.quote_hours = 'Quote hours is required';
    if (form.expected_hours == null || form.expected_hours <= 0) newErrors.expected_hours = 'Expected hours is required';
    if (form.coach_cost_per_day_local == null || form.coach_cost_per_day_local < 0) newErrors.coach_cost_per_day_local = 'Coach cost/day is required';
    if (form.coach_vat == null || form.coach_vat < 0) newErrors.coach_vat = 'Coach VAT is required';
    if (form.parking_ticket_per_coach_per_day == null || form.parking_ticket_per_coach_per_day < 0) newErrors.parking_ticket_per_coach_per_day = 'Parking/Coach/Day is required';
    if (!form.supplier_currency) newErrors.supplier_currency = 'Supplier currency is required';
    // Guide fields required if not included in cost
    if (!form.guide_included) {
      if (form.guide_cost_per_day == null || form.guide_cost_per_day < 0) newErrors.guide_cost_per_day = 'Guide cost/day is required';
      if (form.guide_vat == null || form.guide_vat < 0) newErrors.guide_vat = 'Guide VAT is required';
    }
    // Utilisation and markup required
    if (form.utilisation_percent == null || form.utilisation_percent <= 0) newErrors.utilisation_percent = 'Utilisation % is required';
    if (form.markup_percent == null || form.markup_percent < 0) newErrors.markup_percent = 'Markup % is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
                    className={['event', 'hotel', 'transfer_type', 'used', 'coach_capacity', 'coaches_required', 'days', 'quote_hours', 'expected_hours', 'supplier', 'coach_cost_per_day_local', 'coach_cost_per_hour_local', 'coach_extra_cost_per_hour_local', 'coach_vat', 'parking_ticket_per_coach_per_day', 'supplier_currency', 'guide_included', 'guide_cost_per_day', 'guide_cost_per_hour_local', 'guide_extra_cost_per_hour_local', 'guide_vat', 'markup_percent', 'utilisation_percent', 'coach_cost_local', 'guide_cost_local', 'utilisation_cost_per_seat_local', 'coach_cost_gbp', 'guide_cost_gbp', 'utilisation_cost_per_seat_gbp', 'sell_price_per_seat_gbp', 'active'].includes(col.key) ? 'cursor-pointer select-none' : ''}
                    onClick={() => {
                      if ([
                        'event', 'hotel', 'transfer_type', 'used', 'coach_capacity', 'coaches_required', 'days', 'quote_hours', 'expected_hours', 'supplier', 'coach_cost_per_day_local', 'coach_cost_per_hour_local', 'coach_extra_cost_per_hour_local', 'coach_vat', 'parking_ticket_per_coach_per_day', 'supplier_currency', 'guide_included', 'guide_cost_per_day', 'guide_cost_per_hour_local', 'guide_extra_cost_per_hour_local', 'guide_vat', 'markup_percent', 'utilisation_percent', 'coach_cost_local', 'guide_cost_local', 'utilisation_cost_per_seat_local', 'coach_cost_gbp', 'guide_cost_gbp', 'utilisation_cost_per_seat_gbp', 'sell_price_per_seat_gbp', 'active'
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
                  {visibleColumns.has('used') && (
                    <TableCell>{getColumnValue(tr, 'used')}</TableCell>
                  )}
                  {visibleColumns.has('coach_capacity') && (
                    <TableCell>{getColumnValue(tr, 'coach_capacity')}</TableCell>
                  )}
                  {visibleColumns.has('coaches_required') && (
                    <TableCell>{getColumnValue(tr, 'coaches_required')}</TableCell>
                  )}
                  {visibleColumns.has('days') && (
                    <TableCell>{getColumnValue(tr, 'days')}</TableCell>
                  )}
                  {visibleColumns.has('quote_hours') && (
                    <TableCell>{getColumnValue(tr, 'quote_hours')}</TableCell>
                  )}
                  {visibleColumns.has('expected_hours') && (
                    <TableCell>{getColumnValue(tr, 'expected_hours')}</TableCell>
                  )}
                  {visibleColumns.has('supplier') && (
                    <TableCell>{getColumnValue(tr, 'supplier')}</TableCell>
                  )}
                  {visibleColumns.has('coach_cost_per_day_local') && (
                    <TableCell>{getColumnValue(tr, 'coach_cost_per_day_local')}</TableCell>
                  )}
                  {visibleColumns.has('coach_cost_per_hour_local') && (
                    <TableCell>{getColumnValue(tr, 'coach_cost_per_hour_local')}</TableCell>
                  )}
                  {visibleColumns.has('coach_extra_cost_per_hour_local') && (
                    <TableCell>{getColumnValue(tr, 'coach_extra_cost_per_hour_local')}</TableCell>
                  )}
                  {visibleColumns.has('coach_vat') && (
                    <TableCell>{getColumnValue(tr, 'coach_vat')}</TableCell>
                  )}
                  {visibleColumns.has('parking_ticket_per_coach_per_day') && (
                    <TableCell>{getColumnValue(tr, 'parking_ticket_per_coach_per_day')}</TableCell>
                  )}
                  {visibleColumns.has('supplier_currency') && (
                    <TableCell>{getColumnValue(tr, 'supplier_currency')}</TableCell>
                  )}
                  {visibleColumns.has('guide_included') && (
                    <TableCell>{getColumnValue(tr, 'guide_included')}</TableCell>
                  )}
                  {visibleColumns.has('guide_cost_per_day') && (
                    <TableCell>{getColumnValue(tr, 'guide_cost_per_day')}</TableCell>
                  )}
                  {visibleColumns.has('guide_cost_per_hour_local') && (
                    <TableCell>{getColumnValue(tr, 'guide_cost_per_hour_local')}</TableCell>
                  )}
                  {visibleColumns.has('guide_extra_cost_per_hour_local') && (
                    <TableCell>{getColumnValue(tr, 'guide_extra_cost_per_hour_local')}</TableCell>
                  )}
                  {visibleColumns.has('guide_vat') && (
                    <TableCell>{getColumnValue(tr, 'guide_vat')}</TableCell>
                  )}
                  {visibleColumns.has('markup_percent') && (
                    <TableCell>{getColumnValue(tr, 'markup_percent')}</TableCell>
                  )}
                  {visibleColumns.has('utilisation_percent') && (
                    <TableCell>{getColumnValue(tr, 'utilisation_percent')}</TableCell>
                  )}
                  {visibleColumns.has('coach_cost_local') && (
                    <TableCell>{getColumnValue(tr, 'coach_cost_local')}</TableCell>
                  )}
                  {visibleColumns.has('guide_cost_local') && (
                    <TableCell>{getColumnValue(tr, 'guide_cost_local')}</TableCell>
                  )}
                  {visibleColumns.has('utilisation_cost_per_seat_local') && (
                    <TableCell>{getColumnValue(tr, 'utilisation_cost_per_seat_local')}</TableCell>
                  )}
                  {visibleColumns.has('coach_cost_gbp') && (
                    <TableCell>{getColumnValue(tr, 'coach_cost_gbp')}</TableCell>
                  )}
                  {visibleColumns.has('guide_cost_gbp') && (
                    <TableCell>{getColumnValue(tr, 'guide_cost_gbp')}</TableCell>
                  )}
                  {visibleColumns.has('utilisation_cost_per_seat_gbp') && (
                    <TableCell>{getColumnValue(tr, 'utilisation_cost_per_seat_gbp')}</TableCell>
                  )}
                  {visibleColumns.has('sell_price_per_seat_gbp') && (
                    <TableCell>{getColumnValue(tr, 'sell_price_per_seat_gbp')}</TableCell>
                  )}
                  {visibleColumns.has('active') && (
                    <TableCell>{getColumnValue(tr, 'active')}</TableCell>
                  )}
                  {visibleColumns.has('notes') && (
                    <TableCell>{getColumnValue(tr, 'notes')}</TableCell>
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
                    {errors.event_id && <div className="text-destructive text-xs mt-1">{errors.event_id}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hotel_id">Hotel *</Label>
                    <Select value={form.hotel_id || ''} onValueChange={(v: string) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, hotel_id: v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select hotel" /></SelectTrigger>
                      <SelectContent>
                        {hotels.map(hotel => <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.hotel_id && <div className="text-destructive text-xs mt-1">{errors.hotel_id}</div>}
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
                    {errors.transfer_type && <div className="text-destructive text-xs mt-1">{errors.transfer_type}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="active">Active</Label>
                    <Checkbox id="active" checked={!!form.active} onCheckedChange={(checked) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, active: Boolean(checked) }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={form.notes ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes..." />
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
                    <Input type="number" id="coach_capacity" value={form.coach_capacity ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, coach_capacity: Number(e.target.value) }))} placeholder="e.g. 50" />
                    {errors.coach_capacity && <div className="text-destructive text-xs mt-1">{errors.coach_capacity}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="days">Days</Label>
                    <Input type="number" id="days" value={form.days ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, days: Number(e.target.value) }))} placeholder="e.g. 3" />
                    {errors.days && <div className="text-destructive text-xs mt-1">{errors.days}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quote_hours">Quote Hours</Label>
                    <Input type="number" id="quote_hours" value={form.quote_hours ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, quote_hours: Number(e.target.value) }))} placeholder="e.g. 8" />
                    {errors.quote_hours && <div className="text-destructive text-xs mt-1">{errors.quote_hours}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="expected_hours">Expected Hours</Label>
                    <Input type="number" id="expected_hours" value={form.expected_hours ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, expected_hours: Number(e.target.value) }))} placeholder="e.g. 10" />
                    {errors.expected_hours && <div className="text-destructive text-xs mt-1">{errors.expected_hours}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input id="supplier" value={form.supplier ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, supplier: e.target.value }))} placeholder="e.g. ABC Coaches Ltd" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coach_cost_per_day_local">Coach Cost/Day (Local)</Label>
                    <Input type="number" id="coach_cost_per_day_local" value={form.coach_cost_per_day_local ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, coach_cost_per_day_local: Number(e.target.value) }))} placeholder="e.g. 500" />
                    {errors.coach_cost_per_day_local && <div className="text-destructive text-xs mt-1">{errors.coach_cost_per_day_local}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="coach_vat">Coach VAT %</Label>
                    <Input type="number" id="coach_vat" value={form.coach_vat ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, coach_vat: Number(e.target.value) }))} placeholder="e.g. 20" />
                    {errors.coach_vat && <div className="text-destructive text-xs mt-1">{errors.coach_vat}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="parking_ticket_per_coach_per_day">Parking/Coach/Day</Label>
                    <Input type="number" id="parking_ticket_per_coach_per_day" value={form.parking_ticket_per_coach_per_day ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, parking_ticket_per_coach_per_day: Number(e.target.value) }))} placeholder="e.g. 25" />
                    {errors.parking_ticket_per_coach_per_day && <div className="text-destructive text-xs mt-1">{errors.parking_ticket_per_coach_per_day}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="supplier_currency">Supplier Currency</Label>
                    <Select
                      value={form.supplier_currency || 'EUR'}
                      onValueChange={v => setForm(f => ({ ...f, supplier_currency: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                        <SelectItem value="AUD">AUD (A$)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                        <SelectItem value="CHF">CHF</SelectItem>
                        <SelectItem value="SEK">SEK (kr)</SelectItem>
                        <SelectItem value="NOK">NOK (kr)</SelectItem>
                        <SelectItem value="DKK">DKK (kr)</SelectItem>
                        <SelectItem value="AED">AED (د.إ)</SelectItem>
                        <SelectItem value="BHD">BHD (BD)</SelectItem>
                        <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                        <SelectItem value="QAR">QAR (ر.ق)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.supplier_currency && <div className="text-destructive text-xs mt-1">{errors.supplier_currency}</div>}
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
                    <Label htmlFor="guide_included">Guide Included in Cost</Label>
                    <Checkbox id="guide_included" checked={!!form.guide_included} onCheckedChange={(checked) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, guide_included: Boolean(checked) }))} />
                  </div>
                  {!form.guide_included && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="guide_cost_per_day">Guide Cost/Day</Label>
                        <Input type="number" id="guide_cost_per_day" value={form.guide_cost_per_day ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, guide_cost_per_day: Number(e.target.value) }))} placeholder="e.g. 150" />
                        {errors.guide_cost_per_day && <div className="text-destructive text-xs mt-1">{errors.guide_cost_per_day}</div>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="guide_vat">Guide VAT %</Label>
                        <Input type="number" id="guide_vat" value={form.guide_vat ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, guide_vat: Number(e.target.value) }))} placeholder="e.g. 10" />
                        {errors.guide_vat && <div className="text-destructive text-xs mt-1">{errors.guide_vat}</div>}
                      </div>
                    </>
                  )}
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
                    <Input type="number" id="utilisation_percent" value={form.utilisation_percent ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, utilisation_percent: Number(e.target.value) }))} placeholder="e.g. 90" />
                    {errors.utilisation_percent && <div className="text-destructive text-xs mt-1">{errors.utilisation_percent}</div>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="markup_percent">Markup %</Label>
                    <Input type="number" id="markup_percent" value={form.markup_percent ?? ''} onChange={(e) => setForm((f: Partial<CircuitTransferFormData>) => ({ ...f, markup_percent: Number(e.target.value) }))} placeholder="e.g. 15" />
                    {errors.markup_percent && <div className="text-destructive text-xs mt-1">{errors.markup_percent}</div>}
                  </div>
                </div>
              </div>
              {/* Cost Breakdown */}
              <Card className="mt-6 border-primary/30 bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Coach Extra Cost/Hour (Local)</span>
                        <span className="text-right">{calculated.coach_extra_cost_per_hour_local.toFixed(2)}</span>
                      </div>
                      {!form.guide_included && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Guide Extra Cost/Hour (Local)</span>
                          <span className="text-right">{calculated.guide_extra_cost_per_hour_local.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Coach Cost Local</span>
                        <span className="text-right">{calculated.coach_cost_local.toFixed(2)}</span>
                      </div>
                      {!form.guide_included && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Guide Cost Local</span>
                          <span className="text-right">{calculated.guide_cost_local.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Utilisation Cost/Seat Local</span>
                        <span className="text-right">{calculated.utilisation_cost_per_seat_local.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Coach Cost GBP</span>
                        <span className="text-right">{calculated.coach_cost_gbp.toFixed(2)}</span>
                      </div>
                      {!form.guide_included && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Guide Cost GBP</span>
                          <span className="text-right">{calculated.guide_cost_gbp.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Utilisation Cost/Seat GBP</span>
                        <span className="text-right">{calculated.utilisation_cost_per_seat_gbp.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Sell Price/Seat GBP</span>
                        <span className="text-right">{calculated.sell_price_per_seat_gbp.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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