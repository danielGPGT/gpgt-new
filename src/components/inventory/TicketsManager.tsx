import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Plus, Edit, Trash2, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Package, CreditCard, Truck, CheckCircle, XCircle, ShoppingCart, Receipt, Download, Upload, MoreHorizontal, Eye, EyeOff, Settings, Copy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { InventoryService } from '@/lib/inventoryService';
import type { Ticket, TicketInsert, TicketUpdate, Sport, Event, Venue, TicketCategory } from '@/types/inventory';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

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
  
  // Check if we have a valid cached rate
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
    
    // Cache the rate
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

// Helper function to get cell content for dynamic columns
function getTicketCellContent(
  ticket: Ticket,
  col: string,
  events: Event[],
  ticketCategories: TicketCategory[]
) {
  switch (col) {
    case 'event':
      return events.find(evt => evt.id === ticket.event_id)?.name || '';
    case 'category':
      return ticketCategories.find(cat => cat.id === ticket.ticket_category_id)?.category_name || '';
    case 'quantity_total':
      return ticket.quantity_total;
    case 'quantity_reserved':
      return ticket.quantity_reserved ?? 0;
    case 'quantity_available':
      return ticket.quantity_available ?? (ticket.quantity_total - (ticket.quantity_reserved ?? 0));
    case 'supplier_price':
      const supplierSymbol = getCurrencySymbol(ticket.supplier_currency);
      return `${supplierSymbol}${ticket.supplier_price?.toFixed(2)}`;
    case 'supplier_currency':
      return ticket.supplier_currency;
    case 'price':
      const priceSymbol = getCurrencySymbol(ticket.currency);
      return `${priceSymbol}${ticket.price?.toFixed(2)}`;
    case 'currency':
      return ticket.currency;
    case 'markup_percent':
      return `${ticket.markup_percent}%`;
    case 'price_with_markup':
      const markupSymbol = getCurrencySymbol(ticket.currency);
      const markupPrice = calcPriceWithMarkup(ticket.price, ticket.markup_percent);
      return `${markupSymbol}${markupPrice.toFixed(2)}`;
    case 'ticket_type':
      return ticket.ticket_type || 'e-ticket';
    case 'supplier':
      return ticket.supplier || '-';
    case 'supplier_ref':
      return ticket.supplier_ref || '-';
    case 'refundable':
      return ticket.refundable ? 'Yes' : 'No';
    case 'resellable':
      return ticket.resellable ? 'Yes' : 'No';
    case 'ordered':
      return ticket.ordered ? 'Yes' : 'No';
    case 'paid':
      return ticket.paid ? 'Yes' : 'No';
    case 'tickets_received':
      return ticket.tickets_received ? 'Yes' : 'No';
    case 'ticket_days':
      return ticket.ticket_days || '-';
    case 'status': {
      // All icons use primary color for true, gray for false
      const iconClass = 'w-4 h-4';
      const activeColor = 'var(--primary-600)';
      const inactiveColor = 'var(--base-700)';
      return (
        <TooltipProvider>
          <div className="flex items-center gap-1.5">
            {/* Ordered */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`inline-flex items-center justify-center rounded border px-1.5 py-0.5 ${ticket.ordered ? '' : ''}`} style={{ minWidth: 0, borderColor: ticket.ordered ? activeColor : inactiveColor }}>
                  <ShoppingCart className={iconClass} style={{ color: ticket.ordered ? activeColor : inactiveColor }} />
                </span>
              </TooltipTrigger>
              <TooltipContent>Ordered</TooltipContent>
            </Tooltip>
            {/* Paid */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`inline-flex items-center justify-center rounded border px-1.5 py-0.5 ${ticket.paid ? '' : ''}`} style={{ minWidth: 0, borderColor: ticket.paid ? activeColor : inactiveColor }}>
                  <CreditCard className={iconClass} style={{ color: ticket.paid ? activeColor : inactiveColor }} />
                </span>
              </TooltipTrigger>
              <TooltipContent>Paid</TooltipContent>
            </Tooltip>
            {/* Received */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`inline-flex items-center justify-center rounded border px-1.5 py-0.5 ${ticket.tickets_received ? '' : ''}`} style={{ minWidth: 0, borderColor: ticket.tickets_received ? activeColor : inactiveColor }}>
                  <Package className={iconClass} style={{ color: ticket.tickets_received ? activeColor : inactiveColor }} />
                </span>
              </TooltipTrigger>
              <TooltipContent>Received</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );
    }
    default:
      return '';
  }
}

// Zod schema for ticket form validation
const ticketFormSchema = z.object({
  // Required fields
  event_id: z.string().uuid('Event is required'),
  ticket_category_id: z.string().uuid('Ticket category is required'),
  quantity_total: z.number().min(0, 'Quantity must be at least 0'),
  supplier_currency: z.string().min(1, 'Supplier currency is required'),
  supplier_price: z.number().min(0, 'Supplier price must be at least 0'),
  currency: z.string().min(1, 'Selling currency is required'),
  price: z.number().min(0, 'Base price must be at least 0'),
  markup_percent: z.number().min(0).max(100, 'Markup must be between 0-100%'),
  refundable: z.boolean(),
  resellable: z.boolean(),
  
  // Optional fields
  ticket_type: z.string().nullable().optional(),
  supplier: z.string().nullable().optional(),
  supplier_ref: z.string().nullable().optional(),
  ordered: z.boolean(),
  ordered_at: z.string().nullable().optional(),
  paid: z.boolean(),
  paid_at: z.string().nullable().optional(),
  tickets_received: z.boolean(),
  tickets_received_at: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
  ticket_days: z.string().nullable().optional(),
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
  const [formRef, setFormRef] = useState<any>(null);
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false);
  
  // Sorting state
  const [sortKey, setSortKey] = useState<'event' | 'category' | 'quantity' | 'supplier_price' | 'markup' | 'sell_price'>('event');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Enhanced table features state
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  
  // Column visibility with localStorage persistence
  const COLUMN_STORAGE_KEY = 'ticketsManagerTableVisibleColumns_v1';
  const defaultColumns = [
    'event', 'category', 'quantity_total', 'quantity_reserved', 'quantity_available', 
    'supplier_price', 'supplier_currency', 'price', 'currency', 'markup_percent', 'price_with_markup', 
    'ticket_type', 'supplier', 'supplier_ref', 'refundable', 'resellable', 
    'ordered', 'paid', 'tickets_received', 'ticket_days', 'status'
  ];
  
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {}
    return new Set(defaultColumns);
  });
  
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumns);
  const [isExporting, setIsExporting] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  
  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(25); // You can make this user-configurable if desired

  // Fetch data
  const { data: sports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn: () => InventoryService.getSports(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
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
  const filteredTickets = useMemo(() => tickets.filter(ticket => {
    // Sport filter
    if (selectedSport) {
      const event = events.find(evt => evt.id === ticket.event_id);
      if (!event || event.sport_id !== selectedSport.id) return false;
    }
    
    // Event filter
    if (selectedEvent && ticket.event_id !== selectedEvent.id) return false;
    
    // Category filter
    if (selectedCategory && ticket.ticket_category_id !== selectedCategory.id) return false;
    
    // Search filter (using debounced term)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
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
  }), [tickets, selectedSport, selectedEvent, selectedCategory, debouncedSearchTerm, availabilityFilter, events, ticketCategories]);

  const sortedTickets = useMemo(() => [...filteredTickets].sort((a, b) => {
    let aValue: any, bValue: any;
    switch (sortKey) {
      case 'event':
        const aEvent = events.find(evt => evt.id === a.event_id)?.name || '';
        const bEvent = events.find(evt => evt.id === b.event_id)?.name || '';
        aValue = aEvent.toLowerCase();
        bValue = bEvent.toLowerCase();
        break;
      case 'category':
        const aCategory = ticketCategories.find(cat => cat.id === a.ticket_category_id)?.category_name || '';
        const bCategory = ticketCategories.find(cat => cat.id === b.ticket_category_id)?.category_name || '';
        aValue = aCategory.toLowerCase();
        bValue = bCategory.toLowerCase();
        break;
      case 'quantity':
        aValue = a.quantity_available || 0;
        bValue = b.quantity_available || 0;
        break;
      case 'supplier_price':
        aValue = a.supplier_price || 0;
        bValue = b.supplier_price || 0;
        break;
      case 'markup':
        aValue = a.markup_percent || 0;
        bValue = b.markup_percent || 0;
        break;
      case 'sell_price':
        aValue = a.price_with_markup || 0;
        bValue = b.price_with_markup || 0;
        break;
      default:
        aValue = '';
        bValue = '';
    }
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }), [filteredTickets, sortKey, sortDir, events, ticketCategories]);

  // Calculate paginated tickets
  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / rowsPerPage));
  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedTickets.slice(start, start + rowsPerPage);
  }, [sortedTickets, page, rowsPerPage]);

  // Reset to first page if filters change and current page is out of range
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // Reset filters when parent selection changes
  useEffect(() => {
    if (selectedSport && selectedEvent && selectedEvent.sport_id !== selectedSport.id) {
      setSelectedEvent(null);
    }
    if (selectedEvent && selectedVenue && selectedEvent.venue_id !== selectedVenue.id) {
      setSelectedVenue(null);
    }
  }, [selectedSport, selectedEvent, selectedVenue]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns]);

  // Utility functions for enhanced features
  const toggleTicketSelection = useCallback((ticketId: string) => {
    setSelectedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  }, []);

  const toggleAllTickets = useCallback(() => {
    if (selectedTickets.size === sortedTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(sortedTickets.map(t => t.id)));
    }
  }, [selectedTickets.size, sortedTickets]);

  const toggleColumnVisibility = useCallback((column: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  }, []);

  const exportToCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const selectedTicketsData = sortedTickets.filter(t => selectedTickets.has(t.id));
      const ticketsToExport = selectedTicketsData.length > 0 ? selectedTicketsData : sortedTickets;
      
      const csvContent = [
        // Header
        ['Event', 'Category', 'Total Qty', 'Available Qty', 'Supplier Price', 'Currency', 'Markup %', 'Sell Price', 'Status'].join(','),
        // Data rows
        ...ticketsToExport.map(ticket => {
          const category = ticketCategories.find(cat => cat.id === ticket.ticket_category_id);
          const event = events.find(evt => evt.id === ticket.event_id);
          const status = [
            ticket.ordered ? 'Ordered' : '',
            ticket.paid ? 'Paid' : '',
            ticket.tickets_received ? 'Received' : ''
          ].filter(Boolean).join(';');
          
          return [
            `"${event?.name || ''}"`,
            `"${category?.category_name || ''}"`,
            ticket.quantity_total,
            ticket.quantity_available,
            ticket.supplier_price,
            ticket.supplier_currency,
            ticket.markup_percent,
            ticket.price_with_markup,
            `"${status}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Tickets exported successfully');
    } catch (error) {
      toast.error('Failed to export tickets');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [sortedTickets, selectedTickets, ticketCategories, events]);

  const bulkDeleteTickets = useCallback(async () => {
    if (selectedTickets.size === 0) return;
    
    try {
      await Promise.all(Array.from(selectedTickets).map(id => deleteTicketMutation.mutateAsync(id)));
      setSelectedTickets(new Set());
      toast.success(`Deleted ${selectedTickets.size} tickets successfully`);
    } catch (error) {
      toast.error('Failed to delete some tickets');
    }
  }, [selectedTickets, deleteTicketMutation]);

  // CSV Import functionality
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Expected headers based on your schema
        const expectedHeaders = [
          'Event Name', 'Category Name', 'Quantity Total', 'Quantity Reserved', 'Quantity Provisional',
          'Price', 'Markup Percent', 'Currency', 'Supplier Currency', 'Supplier Price',
          'Ticket Type', 'Refundable', 'Resellable', 'Supplier', 'Supplier Ref',
          'Ordered', 'Paid', 'Tickets Received', 'Ticket Days'
        ];

        // Validate headers
        const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          toast.error(`Missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }

        const preview = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        }).filter(row => Object.values(row).some(v => v !== ''));

        setImportPreview(preview);
      } catch (error) {
        toast.error('Failed to parse CSV file');
        console.error('CSV parsing error:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  const importTickets = useCallback(async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      const csv = await importFile.text();
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const ticketsToImport = lines.slice(1)
        .map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        })
        .filter(row => Object.values(row).some(v => v !== ''));

      let successCount = 0;
      let errorCount = 0;

      for (const row of ticketsToImport) {
        try {
          // Find event by name
          const event = events.find(e => e.name.toLowerCase() === row['Event Name'].toLowerCase());
          if (!event) {
            console.error(`Event not found: ${row['Event Name']}`);
            errorCount++;
            continue;
          }

          // Find category by name
          const category = ticketCategories.find(c => c.category_name.toLowerCase() === row['Category Name'].toLowerCase());
          if (!category) {
            console.error(`Category not found: ${row['Category Name']}`);
            errorCount++;
            continue;
          }

          // Validate and convert data
          const ticketData: TicketInsert = {
            event_id: event.id,
            ticket_category_id: category.id,
            quantity_total: parseInt(row['Quantity Total']) || 0,
            quantity_reserved: parseInt(row['Quantity Reserved']) || 0,
            quantity_provisional: parseInt(row['Quantity Provisional']) || 0,
            price: parseFloat(row['Price']) || 0,
            markup_percent: parseFloat(row['Markup Percent']) || 0,
            currency: row['Currency'] || 'EUR',
            supplier_currency: row['Supplier Currency'] || 'EUR',
            supplier_price: parseFloat(row['Supplier Price']) || 0,
            ticket_type: row['Ticket Type'] || null,
            refundable: row['Refundable']?.toLowerCase() === 'true',
            resellable: row['Resellable']?.toLowerCase() === 'true',
            supplier: row['Supplier'] || null,
            supplier_ref: row['Supplier Ref'] || null,
            ordered: row['Ordered']?.toLowerCase() === 'true',
            paid: row['Paid']?.toLowerCase() === 'true',
            tickets_received: row['Tickets Received']?.toLowerCase() === 'true',
            ticket_days: row['Ticket Days'] || null,
            metadata: null
          };

          await createTicketMutation.mutateAsync(ticketData);
          successCount++;
        } catch (error) {
          console.error('Failed to import ticket:', row, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} tickets${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        setImportDialogOpen(false);
        setImportFile(null);
        setImportPreview([]);
      } else {
        toast.error(`Failed to import any tickets. ${errorCount} errors occurred.`);
      }
    } catch (error) {
      toast.error('Failed to import tickets');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  }, [importFile, events, ticketCategories, createTicketMutation]);

  return (
    <div className="space-y-6">
      {/* Main Table View */}
      <div className="w-full">
        <Card >
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-6">
              <CardTitle>Tickets</CardTitle>
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
                      { key: 'category', label: 'Category' },
                      { key: 'quantity_total', label: 'Total Quantity' },
                      { key: 'quantity_reserved', label: 'Reserved Quantity' },
                      { key: 'quantity_available', label: 'Available Quantity' },
                      { key: 'supplier_price', label: 'Supplier Price' },
                      { key: 'supplier_currency', label: 'Supplier Currency' },
                      { key: 'price', label: 'Base Price' },
                      { key: 'currency', label: 'Selling Currency' },
                      { key: 'markup_percent', label: 'Markup %' },
                      { key: 'price_with_markup', label: 'Price with Markup' },
                      { key: 'ticket_type', label: 'Ticket Type' },
                      { key: 'supplier', label: 'Supplier' },
                      { key: 'supplier_ref', label: 'Supplier Ref' },
                      { key: 'refundable', label: 'Refundable' },
                      { key: 'resellable', label: 'Resellable' },
                      { key: 'ordered', label: 'Ordered' },
                      { key: 'paid', label: 'Paid' },
                      { key: 'tickets_received', label: 'Tickets Received' },
                      { key: 'ticket_days', label: 'Ticket Days' },
                      { key: 'status', label: 'Status' },
                      { key: 'actions', label: 'Actions' }
                    ].map(column => (
                      <DropdownMenuCheckboxItem
                        key={column.key}
                        checked={visibleColumns.has(column.key)}
                        onCheckedChange={() => toggleColumnVisibility(column.key)}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setVisibleColumns(new Set(defaultColumns))}>
                      Reset Columns
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              <div className="flex items-center gap-2">
                {/* Bulk Actions */}
                {selectedTickets.size > 0 && (
                  <div className="flex items-center gap-3 mr-4 p-3 bg-muted rounded-lg shadow-sm animate-slide-in-up">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-semibold bg-primary-100 text-primary-800 border-primary-200">
                        {selectedTickets.size} selected
                      </Badge>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportToCSV}
                        disabled={isExporting}
                        className="text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={bulkDeleteTickets}
                        className="text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                )}
                
                
                
                <Button 
                  variant="outline" 
                  className="font-semibold shadow-md gap-2 animate-slide-in-right animation-delay-200  transition-all duration-300 ease-in-out" 
                  onClick={() => setImportDialogOpen(true)}
                >
                  <Upload className="h-5 w-5" />
                  Import CSV
                </Button>
                <Button variant="default" className="font-semibold shadow-md gap-2" onClick={() => { setEditingTicket(null); setTicketDrawerOpen(true); }}>
                  <Plus className="h-5 w-5" />
                  Add Ticket
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
                      placeholder="Search tickets..."
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
                      setSelectedSport(null);
                      setSelectedEvent(null);
                      setSelectedVenue(null);
                      setSelectedCategory(null);
                      setAvailabilityFilter('all');
                      setSearchTerm('');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
                {/* Filters at flex-end */}
                <div className="flex flex-wrap gap-2 items-center justify-end">
                  {/* Sport Filter */}
                  <div>
                    <Select
                      value={selectedSport?.id || 'all'}
                      onValueChange={id => setSelectedSport(id === 'all' ? null : sports.find(s => s.id === id) || null)}
                    >
                      <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
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
                  {/* Venue Filter */}
                  <div>
                    <Select
                      value={selectedVenue?.id || 'all'}
                      onValueChange={id => setSelectedVenue(id === 'all' ? null : venues.find(v => v.id === id) || null)}
                    >
                      <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
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
                  <div>
                    <Select
                      value={selectedCategory?.id || 'all'}
                      onValueChange={id => setSelectedCategory(id === 'all' ? null : ticketCategories.find(c => c.id === id) || null)}
                    >
                      <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
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
                  <div>
                    <Select
                      value={availabilityFilter}
                      onValueChange={value => setAvailabilityFilter(value as 'all' | 'in_stock' | 'sold_out')}
                    >
                      <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All tickets</SelectItem>
                        <SelectItem value="in_stock">In stock</SelectItem>
                        <SelectItem value="sold_out">Sold out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Active Filters Count */}
                  <div>
                    <div className={`h-8 min-w-[40px] flex items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors ${[
                      selectedSport,
                      selectedEvent,
                      selectedVenue,
                      selectedCategory,
                      availabilityFilter !== 'all' ? availabilityFilter : null,
                      searchTerm ? 'search' : null
                    ].filter(Boolean).length > 0
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted/30 text-muted-foreground border-muted/30'}`}
                    >
                      {[
                        selectedSport,
                        selectedEvent,
                        selectedVenue,
                        selectedCategory,
                        availabilityFilter !== 'all' ? availabilityFilter : null,
                        searchTerm ? 'search' : null
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
                    checked={selectedTickets.size === sortedTickets.length && sortedTickets.length > 0}
                    onCheckedChange={toggleAllTickets}
                    aria-label="Select all tickets"
                  />
                </TableHead>
                  
                  {/* Conditional Columns */}
                  {visibleColumns.has('event') && (
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortKey('event');
                      setSortDir(sortKey === 'event' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}>
                      <span className="inline-flex items-center gap-1">
                        Event
                        {sortKey === 'event' ? (
                          sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableHead>
                  )}
                  
                  {visibleColumns.has('category') && (
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortKey('category');
                      setSortDir(sortKey === 'category' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}>
                      <span className="inline-flex items-center gap-1">
                        Ticket Category
                        {sortKey === 'category' ? (
                          sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableHead>
                  )}
                  
                  {visibleColumns.has('quantity_total') && (
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortKey('quantity');
                      setSortDir(sortKey === 'quantity' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}>
                      <span className="inline-flex items-center gap-1">
                        Total
                        {sortKey === 'quantity' ? (
                          sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableHead>
                  )}
                  
                  {visibleColumns.has('quantity_reserved') && (
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortKey('quantity');
                      setSortDir(sortKey === 'quantity' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}>
                      <span className="inline-flex items-center gap-1">
                        Reserved
                        {sortKey === 'quantity' ? (
                          sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableHead>
                  )}
                  
                  {visibleColumns.has('quantity_available') && (
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortKey('quantity');
                      setSortDir(sortKey === 'quantity' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}>
                      <span className="inline-flex items-center gap-1">
                        Available
                        {sortKey === 'quantity' ? (
                          sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableHead>
                  )}
                  
                  {visibleColumns.has('supplier_price') && (
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortKey('supplier_price');
                      setSortDir(sortKey === 'supplier_price' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}>
                      <span className="inline-flex items-center gap-1">
                        Supplier Price
                        {sortKey === 'supplier_price' ? (
                          sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableHead>
                  )}
                  
                  {visibleColumns.has('supplier_currency') && (
                    <TableHead>Supplier Currency</TableHead>
                  )}
                  
                  {visibleColumns.has('price') && (
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortKey('sell_price');
                      setSortDir(sortKey === 'sell_price' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}>
                      <span className="inline-flex items-center gap-1">
                        Base Price
                        {sortKey === 'sell_price' ? (
                          sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableHead>
                  )}
                  
                  {visibleColumns.has('currency') && (
                    <TableHead>Selling Currency</TableHead>
                  )}
                  
                  {visibleColumns.has('markup_percent') && (
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortKey('markup');
                      setSortDir(sortKey === 'markup' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}>
                      <span className="inline-flex items-center gap-1">
                        Markup %
                        {sortKey === 'markup' ? (
                          sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableHead>
                  )}
                  
                  {visibleColumns.has('price_with_markup') && (
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setSortKey('sell_price');
                      setSortDir(sortKey === 'sell_price' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}>
                      <span className="inline-flex items-center gap-1">
                        Price with Markup
                        {sortKey === 'sell_price' ? (
                          sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableHead>
                  )}
                  
                  {visibleColumns.has('ticket_type') && (
                    <TableHead>Ticket Type</TableHead>
                  )}
                  
                  {visibleColumns.has('supplier') && (
                    <TableHead>Supplier</TableHead>
                  )}
                  
                  {visibleColumns.has('supplier_ref') && (
                    <TableHead>Supplier Ref</TableHead>
                  )}
                  
                  {visibleColumns.has('refundable') && (
                    <TableHead>Refundable</TableHead>
                  )}
                  
                  {visibleColumns.has('resellable') && (
                    <TableHead>Resellable</TableHead>
                  )}
                  
                  {visibleColumns.has('ordered') && (
                    <TableHead>Ordered</TableHead>
                  )}
                  
                  {visibleColumns.has('paid') && (
                    <TableHead>Paid</TableHead>
                  )}
                  
                  {visibleColumns.has('tickets_received') && (
                    <TableHead>Tickets Received</TableHead>
                  )}
                  
                  {visibleColumns.has('ticket_days') && (
                    <TableHead>Ticket Days</TableHead>
                  )}
                  
                  {visibleColumns.has('status') && (
                    <TableHead>Status</TableHead>
                  )}
                  
                  {/* Actions column is always visible and at the end */}
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets.length > 0 ? (
                  paginatedTickets.map((ticket, index) => (
                      <TableRow 
                        key={ticket.id} 
                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                          selectedTickets.has(ticket.id) 
                            ? 'bg-primary-50/20 border-primary-200' 
                            : index % 2 === 0 
                              ? 'bg-card' 
                              : 'bg-muted/20'
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <TableCell className="border-r border-border/30 bg-muted/10">
                          <Checkbox
                            checked={selectedTickets.has(ticket.id)}
                            onCheckedChange={() => toggleTicketSelection(ticket.id)}
                            aria-label={`Select ticket ${ticket.id}`}
                          />
                        </TableCell>
                      {/* Render all visible columns in order */}
                      {columnOrder.filter(col => visibleColumns.has(col)).map(col => (
                        <TableCell key={col}>
                          {getTicketCellContent(ticket, col, events, ticketCategories)}
                          </TableCell>
                      ))}
                      {/* Actions column always at the end */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => { setEditingTicket(ticket); setTicketDrawerOpen(true); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setConfirmDeleteTicket(ticket)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                      </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.size + 2} className="text-center py-12 text-muted-foreground bg-muted/10 border-b border-border/30">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                        <span className="text-sm font-medium">No tickets found</span>
                        <span className="text-xs text-muted-foreground/70">Try adjusting your filters or add a new ticket</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
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
                    // Show first, last, current, and neighbors; ellipsis for gaps
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
                    // Ellipsis logic
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

      {/* Ticket Form Drawer */}
      <Drawer open={ticketDrawerOpen} onOpenChange={setTicketDrawerOpen} direction="right">
        <DrawerContent className="!max-w-3xl !max-h-none h-full">
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
            onSubmit={(data: any) => {
              if (editingTicket) {
                updateTicketMutation.mutate({ id: editingTicket.id, data });
              } else {
                createTicketMutation.mutate(data);
              }
            }}
            onCancel={() => setTicketDrawerOpen(false)}
            isLoading={createTicketMutation.isPending || updateTicketMutation.isPending}
            onFormReady={setFormRef}
            isConvertingCurrency={isConvertingCurrency}
            setIsConvertingCurrency={setIsConvertingCurrency}
          />
          <DrawerFooter>
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={() => {
                formRef?.reset();
              }}>
                Reset Form
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setTicketDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTicketMutation.isPending || updateTicketMutation.isPending}
                  onClick={() => {
                    if (formRef) {
                      formRef.handleSubmit((data: any) => {
                        if (editingTicket) {
                          updateTicketMutation.mutate({ id: editingTicket.id, data });
                        } else {
                          createTicketMutation.mutate(data);
                        }
                      })();
                    }
                  }}
                >
                  {createTicketMutation.isPending || updateTicketMutation.isPending ? 'Saving...' : editingTicket ? 'Update Ticket' : 'Create Ticket'}
                </Button>
              </div>
            </div>
          </DrawerFooter>
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

      {/* Import CSV Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Tickets from CSV</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Upload a CSV file with ticket data. The file should include headers matching the expected format.
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* File Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                {importFile && (
                  <Badge variant="secondary" className="text-xs">
                    {importFile.name}
                  </Badge>
                )}
              </div>
              
              {/* Expected Format */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Expected CSV Format:</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Required Headers:</strong> Event Name, Category Name, Quantity Total, Price</p>
                  <p><strong>Optional Headers:</strong> Quantity Reserved, Quantity Provisional, Markup Percent, Currency, Supplier Currency, Supplier Price, Ticket Type, Refundable, Resellable, Supplier, Supplier Ref, Ordered, Paid, Tickets Received, Ticket Days</p>
                  <p><strong>Boolean Values:</strong> Use "true" or "false" for Refundable, Resellable, Ordered, Paid, Tickets Received</p>
                  <p><strong>Ticket Days:</strong> Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, Friday-Saturday, Saturday-Sunday, Friday-Sunday, Thursday-Sunday</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">Preview (first 5 rows):</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(importPreview[0] || {}).map(header => (
                          <TableHead key={header} className="text-xs">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex} className="text-xs">
                              {String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Validation Messages */}
            {importPreview.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-blue-800 mb-2">Validation Notes:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Events and categories will be matched by name (case-insensitive)</li>
                  <li>• Missing events or categories will be skipped</li>
                  <li>• Invalid numeric values will default to 0</li>
                  <li>• Boolean fields accept "true"/"false" (case-insensitive)</li>
                  <li>• Generated fields (quantity_available, price_with_markup) will be calculated automatically</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setImportDialogOpen(false);
              setImportFile(null);
              setImportPreview([]);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={importTickets}
              disabled={!importFile || isImporting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isImporting ? 'Importing...' : 'Import Tickets'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Ticket Form Drawer Component
function TicketFormDrawer({ 
  ticket, 
  events, 
  ticketCategories, 
  onSubmit, 
  onCancel, 
  isLoading, 
  onFormReady,
  isConvertingCurrency,
  setIsConvertingCurrency
}: {
  ticket?: Ticket;
  events: Event[];
  ticketCategories: TicketCategory[];
  onSubmit: (data: TicketInsert | TicketUpdate) => void;
  onCancel: () => void;
  isLoading: boolean;
  onFormReady: (form: any) => void;
  isConvertingCurrency: boolean;
  setIsConvertingCurrency: (loading: boolean) => void;
}) {
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      // Required fields
      event_id: typeof ticket?.event_id === 'string' ? ticket.event_id : '',
      ticket_category_id: typeof ticket?.ticket_category_id === 'string' ? ticket.ticket_category_id : '',
      quantity_total: typeof ticket?.quantity_total === 'number' ? ticket.quantity_total : 0,
      supplier_currency: typeof ticket?.supplier_currency === 'string' ? ticket.supplier_currency : 'EUR',
      supplier_price: typeof ticket?.supplier_price === 'number' ? ticket.supplier_price : 0,
      currency: typeof ticket?.currency === 'string' ? ticket.currency : 'GBP',
      price: typeof ticket?.price === 'number' ? ticket.price : 0,
      markup_percent: typeof ticket?.markup_percent === 'number' ? ticket.markup_percent : 60,
      refundable: !!ticket?.refundable,
      resellable: !!ticket?.resellable,
      
      // Optional fields
      
      ticket_type: typeof ticket?.ticket_type === 'string' ? ticket.ticket_type : 'e-ticket',
      supplier: typeof ticket?.supplier === 'string' ? ticket.supplier : '',
      supplier_ref: typeof ticket?.supplier_ref === 'string' ? ticket.supplier_ref : '',
      ordered: !!ticket?.ordered,
      ordered_at: ticket?.ordered_at || null,
      paid: !!ticket?.paid,
      paid_at: ticket?.paid_at || null,
      tickets_received: !!ticket?.tickets_received,
      tickets_received_at: ticket?.tickets_received_at || null,
      metadata: typeof ticket?.metadata === 'object' && ticket?.metadata !== null ? ticket.metadata : {},
      ticket_days: typeof ticket?.ticket_days === 'string' ? ticket.ticket_days : null,
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
  const quantityAvailable = watchedValues.quantity_total;
  
  // Auto-convert supplier price to base price when currencies differ
  React.useEffect(() => {
    const convertPrice = async () => {
      if (watchedValues.supplier_price > 0 && watchedValues.supplier_currency && watchedValues.currency) {
        setIsConvertingCurrency(true);
        try {
          const convertedPrice = await convertCurrency(watchedValues.supplier_price, watchedValues.supplier_currency, watchedValues.currency);
          if (Math.abs(convertedPrice - watchedValues.price) > 0.01) { // Only update if difference is significant
            form.setValue('price', convertedPrice);
          }
        } catch (error) {
          console.error('Failed to convert currency:', error);
        } finally {
          setIsConvertingCurrency(false);
        }
      }
    };
    
    convertPrice();
  }, [watchedValues.supplier_price, watchedValues.supplier_currency, watchedValues.currency, form]);

  // Reset ticket category when event changes
  useEffect(() => {
    if (selectedEventId && watchedValues.ticket_category_id) {
      const currentCategory = ticketCategories.find(cat => cat.id === watchedValues.ticket_category_id);
      if (selectedEvent?.venue_id && currentCategory?.venue_id !== selectedEvent.venue_id) {
        form.setValue('ticket_category_id', '');
      }
    }
  }, [selectedEventId, watchedValues.ticket_category_id, selectedEvent?.venue_id, ticketCategories, form]);

  // Notify parent component when form is ready
  useEffect(() => {
    onFormReady(form);
  }, [form, onFormReady]);

  // Auto-set timestamps when status is toggled ON
  useEffect(() => {
    if (watchedValues.ordered && !watchedValues.ordered_at) {
      form.setValue('ordered_at', new Date().toISOString().slice(0, 16));
    }
  }, [watchedValues.ordered]);
  useEffect(() => {
    if (watchedValues.paid && !watchedValues.paid_at) {
      form.setValue('paid_at', new Date().toISOString().slice(0, 16));
    }
  }, [watchedValues.paid]);
  useEffect(() => {
    if (watchedValues.tickets_received && !watchedValues.tickets_received_at) {
      form.setValue('tickets_received_at', new Date().toISOString().slice(0, 16));
    }
  }, [watchedValues.tickets_received]);

  const handleSubmit = (data: TicketFormData) => {
    // Clean up the data before submission
    const submitData = {
      ...data,
      event_id: typeof data.event_id === 'string' ? data.event_id : '',
      ticket_category_id: typeof data.ticket_category_id === 'string' ? data.ticket_category_id : '',
      ordered_at: data.ordered && data.ordered_at ? data.ordered_at : null,
      paid_at: data.paid && data.paid_at ? data.paid_at : null,
      tickets_received_at: data.tickets_received && data.tickets_received_at ? data.tickets_received_at : null,

      ticket_type: typeof data.ticket_type === 'string' ? data.ticket_type : 'e-ticket',
      supplier: typeof data.supplier === 'string' ? data.supplier : '',
      supplier_ref: typeof data.supplier_ref === 'string' ? data.supplier_ref : '',
      supplier_price: typeof data.supplier_price === 'number' ? data.supplier_price : 0,
      supplier_currency: typeof data.supplier_currency === 'string' ? data.supplier_currency : 'EUR',
      price: typeof data.price === 'number' ? data.price : 0,
      currency: typeof data.currency === 'string' ? data.currency : 'GBP',
      markup_percent: typeof data.markup_percent === 'number' ? data.markup_percent : 60,
      refundable: !!data.refundable,
      resellable: !!data.resellable,
      ordered: !!data.ordered,
      paid: !!data.paid,
      tickets_received: !!data.tickets_received,
      metadata: typeof data.metadata === 'object' && data.metadata !== null ? data.metadata : {},
      ticket_days: typeof data.ticket_days === 'string' ? data.ticket_days : null,
    };
    
    console.log('Submitting ticket data:', submitData);
    onSubmit(submitData);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Required Fields */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <h3 className="text-base font-semibold text-card-foreground">Required Fields</h3>
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
                {form.formState.errors.supplier_currency && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.supplier_currency.message}</p>
                )}
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
                {form.formState.errors.supplier_price && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.supplier_price.message}</p>
                )}
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
                {form.formState.errors.currency && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.currency.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-medium text-muted-foreground">Base Price (Converted) *</Label>
                <div className="relative">
                <Controller
                    name="price"
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
                  {isConvertingCurrency && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
                  )}
                </div>
                {form.formState.errors.price && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.price.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {isConvertingCurrency ? 'Converting currency...' : 'Auto-converted from supplier price'}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="markup_percent" className="text-sm font-medium text-muted-foreground">Markup % *</Label>
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
                {form.formState.errors.markup_percent && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.markup_percent.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">Price with Markup (Read-only)</Label>
                <div className="h-9 px-3 bg-muted border border-border rounded-md flex items-center">
                  <span className="font-medium text-card-foreground">{watchedValues.currency} {priceWithMarkup.toFixed(2)}</span>
              </div>
            </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">Available Quantity (Read-only)</Label>
                <div className="h-9 px-3 bg-muted border border-border rounded-md flex items-center">
                  <span className="font-medium text-card-foreground">{quantityAvailable}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
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
                <Label className="text-sm font-medium text-muted-foreground">Refundable *</Label>
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
                <Label className="text-sm font-medium text-muted-foreground">Resellable *</Label>
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              <h3 className="text-base font-semibold text-card-foreground">Optional Fields</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">


              <div className="space-y-1.5">
                <Label htmlFor="ticket_type" className="text-sm font-medium text-muted-foreground">Ticket Type</Label>
                <Controller
                  name="ticket_type"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="e-ticket">e-ticket</SelectItem>
                        <SelectItem value="app ticket">app ticket</SelectItem>
                        <SelectItem value="collection ticket">collection ticket</SelectItem>
                        <SelectItem value="paper ticket">paper ticket</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

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
                      value={field.value || ''}
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
                      value={field.value || ''}
                    />
                  )}
                />
              </div>

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
    </>
  ); 
} 



