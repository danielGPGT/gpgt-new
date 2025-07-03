import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Bed, 
  Users, 
  DollarSign, 
  TrendingUp,
  Eye,
  EyeOff,
  Filter,
  Search,
  Download,
  Upload,
  Grid3X3,
  List,
  BarChart3,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { HotelRoomService, type HotelRoom, type HotelRoomInsert } from '@/lib/hotelRoomService';
import { InventoryService } from '@/lib/inventoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { HotelRoomForm } from './HotelRoomForm';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

interface HotelRoomsTableProps {
  hotelId: string;
  hotelName: string;
  onBack?: () => void;
}

const ROOM_TYPES = [
  'Standard',
  'Deluxe',
  'Suite',
  'Executive',
  'Presidential',
  'Family',
  'Accessible',
  'Connecting',
  'Ocean View',
  'City View',
  'Garden View',
  'Pool View'
];

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CAD', 'AUD'];

const COLUMN_STORAGE_KEY = 'hotelRoomsTableVisibleColumns_v2';
const defaultColumns = [
  'room_type_id', 'dates', 'quantity_total', 'quantity_reserved', 'quantity_available', 'total_price_per_night_gbp', 'total_price_per_stay_gbp',
  'vat_percentage', 'city_tax', 'resort_fee', 'breakfast_price_per_person_per_night',
  'supplier', 'status', 'actions'
];

export function HotelRoomsTable({ hotelId, hotelName, onBack }: HotelRoomsTableProps) {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoomType, setFilterRoomType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Sorting state
  const [sortKey, setSortKey] = useState<'room_type_id' | 'check_in' | 'check_out' | 'quantity_available' | 'quantity_total' | 'quantity_reserved' | 'supplier_price_per_night' | 'total_price_per_night_gbp' | 'supplier'>('room_type_id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
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
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns]);

  // Fetch rooms
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['hotel-rooms', hotelId],
    queryFn: () => HotelRoomService.getHotelRooms(hotelId),
  });

  // Fetch events for filter
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });

  // Delete room mutation
  const deleteMutation = useMutation({
    mutationFn: (roomId: string) => HotelRoomService.deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel-rooms', hotelId] });
      toast.success('Room deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete room: ${error.message}`);
    },
  });

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_type_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.supplier_ref?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoomType = filterRoomType === 'all' || room.room_type_id === filterRoomType;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'available' && (room.quantity_available ?? 0) > 0) ||
      (filterStatus === 'reserved' && (room.quantity_reserved ?? 0) > 0) ||
      (filterStatus === 'provisional' && (room.quantity_provisional ?? 0) > 0);

    const matchesEvent = filterEvent === 'all' || room.event_id === filterEvent;
    
    const matchesSupplier = filterSupplier === 'all' || room.supplier === filterSupplier;

    return matchesSearch && matchesRoomType && matchesStatus && matchesEvent && matchesSupplier;
  });

  // Sort rooms
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    
    // Handle date sorting
    if (sortKey === 'check_in' || sortKey === 'check_out') {
      const aDate = new Date(aVal).getTime();
      const bDate = new Date(bVal).getTime();
      return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
    }
    
    // Handle numeric sorting
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // Handle string sorting
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const handleEditRoom = (room: HotelRoom) => {
    setSelectedRoom(room);
    setIsFormOpen(true);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (confirm('Are you sure you want to delete this room?')) {
      deleteMutation.mutate(roomId);
    }
  };

  const handleFormClose = () => {
    setSelectedRoom(null);
    setIsFormOpen(false);
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityBadge = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">High</Badge>;
    if (percentage >= 30) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>;
    return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Low</Badge>;
  };

  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const toggleAllRooms = () => {
    if (selectedRooms.size === sortedRooms.length) {
      setSelectedRooms(new Set());
    } else {
      setSelectedRooms(new Set(sortedRooms.map(r => r.id)));
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const selectedRoomsData = sortedRooms.filter(r => selectedRooms.has(r.id));
      const roomsToExport = selectedRoomsData.length > 0 ? selectedRoomsData : sortedRooms;
      const csvContent = [
        [
          'Room Type', 'Dates', 'Availability', 'Supplier Price', 'Supplier Total',
          'GBP/Night', 'GBP/Night + Markup', 'GBP/Stay', 'GBP/Stay + Markup',
          'Extra Night GBP', 'VAT %', 'City Tax', 'Resort Fee', 'Breakfast Price',
          'Supplier', 'Status'
        ].join(','),
        ...roomsToExport.map(room => [
          room.room_type_id,
          `${format(new Date(room.check_in), 'MMM dd')} to ${format(new Date(room.check_out), 'MMM dd, yyyy')}`,
          `${room.quantity_available ?? 0}/${room.quantity_total ?? 0}`,
          room.supplier_price_per_night,
          room.total_supplier_price_per_night,
          room.total_price_per_night_gbp,
          room.total_price_per_night_gbp_with_markup,
          room.total_price_per_stay_gbp,
          room.total_price_per_stay_gbp_with_markup,
          room.extra_night_price_gbp,
          room.vat_percentage,
          room.city_tax,
          room.resort_fee,
          room.breakfast_price_per_person_per_night,
          room.supplier,
          (room.quantity_available ?? 0) > 0 ? 'Available' : 'Unavailable',
        ].map(String).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rooms-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Rooms exported successfully');
    } catch (error) {
      toast.error('Failed to export rooms');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const deleteSelectedRooms = async () => {
    if (!window.confirm('Are you sure you want to delete the selected rooms? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await Promise.all(Array.from(selectedRooms).map(id => HotelRoomService.deleteRoom(id)));
      setSelectedRooms(new Set());
      queryClient.invalidateQueries({ queryKey: ['hotel-rooms', hotelId] });
      toast.success('Selected rooms deleted successfully');
    } catch (error) {
      toast.error('Failed to delete selected rooms');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back to Hotels Button */}
      <div className="flex items-center mb-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          &larr; Back to Hotels
        </Button>
      </div>
      {/* Header and Actions Row */}
      <Card className="mt-0">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <CardTitle>Rooms for {hotelName}</CardTitle>
              {/* Columns Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                    <Settings className="h-3 w-3 mr-1" /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[
                    { key: 'room_type_id', label: 'Room Type' },
                    { key: 'dates', label: 'Dates' },
                    { key: 'quantity_total', label: 'Total' },
                    { key: 'quantity_reserved', label: 'Reserved' },
                    { key: 'quantity_available', label: 'Available' },
                    { key: 'supplier_price_per_night', label: 'Supplier Price' },
                    { key: 'total_supplier_price_per_night', label: 'Supplier Total' },
                    { key: 'total_price_per_night_gbp', label: 'GBP/Night' },
                    { key: 'total_price_per_night_gbp_with_markup', label: 'GBP/Night + Markup' },
                    { key: 'total_price_per_stay_gbp', label: 'GBP/Stay' },
                    { key: 'total_price_per_stay_gbp_with_markup', label: 'GBP/Stay + Markup' },
                    { key: 'extra_night_price_gbp', label: 'Extra Night GBP' },
                    { key: 'vat_percentage', label: 'VAT %' },
                    { key: 'city_tax', label: 'City Tax' },
                    { key: 'resort_fee', label: 'Resort Fee' },
                    { key: 'breakfast_price_per_person_per_night', label: 'Breakfast Price' },
                    { key: 'supplier', label: 'Supplier' },
                    { key: 'status', label: 'Status' },
                    { key: 'actions', label: 'Actions' },
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
              {/* Bulk Actions Bar (to the right of Import, before Add) */}
              {selectedRooms.size > 0 && (
                <div className="flex items-center gap-3 p-0 bg-transparent shadow-none animate-slide-in-up">
                  <Badge variant="secondary" className="text-xs font-semibold bg-primary-100 text-primary-800 border-primary-200">
                    {selectedRooms.size} selected
                  </Badge>
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
                    onClick={deleteSelectedRooms}
                    disabled={isDeleting}
                    className="text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {isDeleting ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                </div>
              )}
              <Button variant="outline">
                <Upload className="h-5 w-5" /> Import CSV
              </Button>
              <Button variant="default" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-5 w-5" /> Add Room
              </Button>
            </div>
          </div>
        </CardHeader>
        {/* Filter Bar */}
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
                    placeholder="Search rooms..."
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
                    setSearchTerm('');
                    setFilterRoomType('all');
                    setFilterStatus('all');
                    setFilterEvent('all');
                    setFilterSupplier('all');
                  }}
                >
                  Clear All
                </Button>
              </div>
              {/* Filters at flex-end */}
              <div className="flex flex-wrap gap-2 items-center justify-end">
                <Select value={filterEvent} onValueChange={setFilterEvent}>
                  <SelectTrigger className="h-8 min-w-[140px] text-xs rounded-md">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All events</SelectItem>
                    {events.filter(event => event.id && event.id.trim() !== '').map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {event.start_date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterRoomType} onValueChange={setFilterRoomType}>
                  <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {ROOM_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="provisional">Provisional</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                  <SelectTrigger className="h-8 min-w-[120px] text-xs rounded-md">
                    <SelectValue placeholder="All suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All suppliers</SelectItem>
                    {Array.from(new Set(rooms.map(r => r.supplier).filter(Boolean))).map(supplier => (
                      <SelectItem key={supplier!} value={supplier!}>{supplier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Active Filters Count */}
                <div>
                  <div className={`h-8 min-w-[40px] flex items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors ${[
                    filterEvent !== 'all' ? 'event' : null,
                    filterRoomType !== 'all' ? filterRoomType : null,
                    filterStatus !== 'all' ? filterStatus : null,
                    filterSupplier !== 'all' ? 'supplier' : null,
                    searchTerm ? 'search' : null
                  ].filter(Boolean).length > 0
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted/30 text-muted-foreground border-muted/30'}`}
                  >
                    {[
                      filterEvent !== 'all' ? 'event' : null,
                      filterRoomType !== 'all' ? filterRoomType : null,
                      filterStatus !== 'all' ? filterStatus : null,
                      filterSupplier !== 'all' ? 'supplier' : null,
                      searchTerm ? 'search' : null
                    ].filter(Boolean).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="flex items-center gap-2"
          >
            <Grid3X3 className="w-4 h-4" />
            Cards
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="mt-0">
          <Table className="mt-4 border border-border rounded-lg overflow-hidden shadow-sm">
            <TableHeader className="bg-muted sticky top-0 z-10 border-b border-primary-200">
              <TableRow className="hover:bg-primary-50/30 transition-colors">
                {/* Selection Checkbox */}
                <TableHead className="">
                  <Checkbox
                    checked={selectedRooms.size === sortedRooms.length && sortedRooms.length > 0}
                    onCheckedChange={toggleAllRooms}
                    aria-label="Select all rooms"
                  />
                </TableHead>
                {visibleColumns.has('room_type_id') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('room_type_id');
                      setSortDir(sortKey === 'room_type_id' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Room Type
                      {sortKey === 'room_type_id' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('dates') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('check_in');
                      setSortDir(sortKey === 'check_in' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Dates
                      {sortKey === 'check_in' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('quantity_total') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('quantity_total');
                      setSortDir(sortKey === 'quantity_total' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Total
                      {sortKey === 'quantity_total' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('quantity_reserved') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('quantity_reserved');
                      setSortDir(sortKey === 'quantity_reserved' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Reserved
                      {sortKey === 'quantity_reserved' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('quantity_available') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('quantity_available');
                      setSortDir(sortKey === 'quantity_available' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Available
                      {sortKey === 'quantity_available' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('supplier_price_per_night') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('supplier_price_per_night');
                      setSortDir(sortKey === 'supplier_price_per_night' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Supplier Price
                      {sortKey === 'supplier_price_per_night' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('total_supplier_price_per_night') && <TableHead className="text-muted-foreground font-medium">Supplier Total</TableHead>}
                {visibleColumns.has('total_price_per_night_gbp') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('total_price_per_night_gbp');
                      setSortDir(sortKey === 'total_price_per_night_gbp' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      GBP/Night
                      {sortKey === 'total_price_per_night_gbp' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('total_price_per_night_gbp_with_markup') && <TableHead className="text-muted-foreground font-medium">GBP/Night + Markup</TableHead>}
                {visibleColumns.has('total_price_per_stay_gbp') && <TableHead className="text-muted-foreground font-medium">GBP/Stay</TableHead>}
                {visibleColumns.has('total_price_per_stay_gbp_with_markup') && <TableHead className="text-muted-foreground font-medium">GBP/Stay + Markup</TableHead>}
                {visibleColumns.has('extra_night_price_gbp') && <TableHead className="text-muted-foreground font-medium">Extra Night GBP</TableHead>}
                {visibleColumns.has('vat_percentage') && <TableHead className="text-muted-foreground font-medium">VAT %</TableHead>}
                {visibleColumns.has('city_tax') && <TableHead className="text-muted-foreground font-medium">City Tax</TableHead>}
                {visibleColumns.has('resort_fee') && <TableHead className="text-muted-foreground font-medium">Resort Fee</TableHead>}
                {visibleColumns.has('breakfast_price_per_person_per_night') && <TableHead className="text-muted-foreground font-medium">Breakfast Price</TableHead>}
                {visibleColumns.has('supplier') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('supplier');
                      setSortDir(sortKey === 'supplier' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Supplier
                      {sortKey === 'supplier' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('status') && <TableHead className="text-muted-foreground font-medium">Status</TableHead>}
                {visibleColumns.has('actions') && <TableHead className="text-right font-medium">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRooms.map((room, index) => (
                <TableRow
                  key={room.id}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    selectedRooms.has(room.id)
                      ? 'bg-primary-50/20 border-primary-200'
                      : index % 2 === 0
                        ? 'bg-card'
                        : 'bg-muted/20'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <TableCell className="border-r border-border/30 bg-muted/10">
                    <Checkbox
                      checked={selectedRooms.has(room.id)}
                      onCheckedChange={() => toggleRoomSelection(room.id)}
                      aria-label={`Select room ${room.id}`}
                    />
                  </TableCell>
                  {visibleColumns.has('room_type_id') && <TableCell>{room.room_type_id}</TableCell>}
                  {visibleColumns.has('dates') && <TableCell>{format(new Date(room.check_in), 'MMM dd')} to {format(new Date(room.check_out), 'MMM dd, yyyy')}</TableCell>}
                  {visibleColumns.has('quantity_total') && (
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all hover:bg-muted/80" 
                           style={{
                             backgroundColor: 'var(--color-muted)',
                             color: 'var(--color-muted-foreground)',
                             border: '1px solid var(--color-border)'
                           }}>
                        <span>{room.quantity_total ?? 0}</span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.has('quantity_reserved') && (
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all hover:bg-muted/80"
                           style={{
                             backgroundColor: 'var(--color-muted)',
                             color: 'var(--color-muted-foreground)',
                             border: '1px solid var(--color-border)'
                           }}>
                        <span>{room.quantity_reserved ?? 0}</span>
                        </div>
                    </TableCell>
                  )}
                  {visibleColumns.has('quantity_available') && (
                    <TableCell>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                        (room.quantity_available ?? 0) > 0 ? 'hover:bg-green-50' : 'hover:bg-red-50'
                      }`}
                           style={{
                             backgroundColor: (room.quantity_available ?? 0) > 0 
                               ? 'var(--color-muted)' 
                               : 'var(--color-muted)',
                             color: (room.quantity_available ?? 0) > 0 
                               ? 'var(--color-muted-foreground)' 
                               : 'var(--color-muted-foreground)',
                             border: '1px solid var(--color-border)'
                           }}>
                        <span>{room.quantity_available ?? 0}</span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.has('supplier_price_per_night') && <TableCell>{room.supplier_price_per_night != null ? room.supplier_price_per_night.toFixed(2) : '—'} {room.supplier_currency || 'EUR'}</TableCell>}
                  {visibleColumns.has('total_supplier_price_per_night') && <TableCell>{room.total_supplier_price_per_night != null ? room.total_supplier_price_per_night.toFixed(2) : '—'} {room.supplier_currency || 'EUR'}</TableCell>}
                  {visibleColumns.has('total_price_per_night_gbp') && <TableCell>{room.total_price_per_night_gbp != null ? `£${room.total_price_per_night_gbp.toFixed(2)}` : '—'}</TableCell>}
                  {visibleColumns.has('total_price_per_night_gbp_with_markup') && <TableCell>{room.total_price_per_night_gbp_with_markup != null ? `£${room.total_price_per_night_gbp_with_markup.toFixed(2)}` : '—'}</TableCell>}
                  {visibleColumns.has('total_price_per_stay_gbp') && <TableCell>{room.total_price_per_stay_gbp != null ? `£${room.total_price_per_stay_gbp.toFixed(2)}` : '—'}</TableCell>}
                  {visibleColumns.has('total_price_per_stay_gbp_with_markup') && <TableCell>{room.total_price_per_stay_gbp_with_markup != null ? `£${room.total_price_per_stay_gbp_with_markup.toFixed(2)}` : '—'}</TableCell>}
                  {visibleColumns.has('extra_night_price_gbp') && <TableCell>{room.extra_night_price_gbp != null ? `£${room.extra_night_price_gbp.toFixed(2)}` : '—'}</TableCell>}
                  {visibleColumns.has('vat_percentage') && <TableCell>{room.vat_percentage != null ? `${room.vat_percentage.toFixed(2)}%` : '—'}</TableCell>}
                  {visibleColumns.has('city_tax') && <TableCell>{room.city_tax != null ? `${room.city_tax.toFixed(2)} ${room.supplier_currency || 'EUR'}` : '—'}</TableCell>}
                  {visibleColumns.has('resort_fee') && <TableCell>{room.resort_fee != null ? `${room.resort_fee.toFixed(2)} ${room.supplier_currency || 'EUR'}` : '—'}</TableCell>}
                  {visibleColumns.has('breakfast_price_per_person_per_night') && <TableCell>{room.breakfast_price_per_person_per_night != null ? `${room.breakfast_price_per_person_per_night.toFixed(2)} ${room.supplier_currency || 'EUR'}` : '—'}</TableCell>}
                  {visibleColumns.has('supplier') && <TableCell>{room.supplier || 'N/A'}</TableCell>}
                  {visibleColumns.has('status') && <TableCell>{getAvailabilityBadge(room.quantity_available ?? 0, room.quantity_total ?? 0)}</TableCell>}
                  {visibleColumns.has('actions') && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEditRoom(room)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteRoom(room.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Pagination (simple, below table) */}
          {/* TODO: Add pagination logic if needed */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRooms.map((room) => (
            <Card key={room.id} className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-card-foreground">{room.room_type_id}</CardTitle>
                  {getAvailabilityBadge(room.quantity_available ?? 0, room.quantity_total ?? 0)}
                </div>
                <CardDescription className="text-muted-foreground">
                  {format(new Date(room.check_in), 'MMM dd')} - {format(new Date(room.check_out), 'MMM dd, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 rounded-lg bg-muted/40 border border-border text-center">
                    <div className="font-bold text-card-foreground text-sm">{room.quantity_total ?? 0}</div>
                    <div className="text-muted-foreground text-xs">Total</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 border border-border text-center">
                    <div className="font-bold text-card-foreground text-sm">{room.quantity_reserved ?? 0}</div>
                    <div className="text-muted-foreground text-xs">Reserved</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 border border-border text-center">
                    <div className="font-bold text-card-foreground text-sm">{room.quantity_available ?? 0}</div>
                    <div className="text-muted-foreground text-xs">Available</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="font-bold text-card-foreground text-lg">£{room.total_price_per_night_gbp}</div>
                  <div className="text-muted-foreground text-xs">Per night</div>
                </div>
                <Separator className="bg-border" />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {room.supplier || 'No supplier'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRoom(room)}
                      className="border-border hover:bg-muted group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Room Form Drawer */}
      <Drawer open={isFormOpen} onOpenChange={setIsFormOpen} direction="right">
        <DrawerContent className="!max-w-4xl h-full">
          <DrawerHeader className="border-b border-border">
            <DrawerTitle className="text-foreground">
              {selectedRoom ? 'Edit Room' : 'Add New Room'}
            </DrawerTitle>
            <DrawerDescription className="text-muted-foreground">
              Configure room details, pricing, and availability for {hotelName}.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <HotelRoomForm
              hotelId={hotelId}
              room={selectedRoom}
              onClose={handleFormClose}
              onSuccess={() => {
                handleFormClose();
                queryClient.invalidateQueries({ queryKey: ['hotel-rooms', hotelId] });
                queryClient.invalidateQueries({ queryKey: ['hotel-room-stats', hotelId] });
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
} 