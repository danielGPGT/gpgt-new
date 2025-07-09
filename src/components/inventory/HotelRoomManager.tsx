import React, { useState } from 'react';
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
  Settings
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { HotelRoomService, type HotelRoom, type HotelRoomInsert } from '@/lib/hotelRoomService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { HotelRoomForm } from './HotelRoomForm';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface HotelRoomManagerProps {
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

export function HotelRoomManager({ hotelId, hotelName, onBack }: HotelRoomManagerProps) {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoomType, setFilterRoomType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'room_type_id', 'quantity_total', 'quantity_available', 'quantity_reserved', 'quantity_provisional', 'supplier', 'supplier_ref', 'actions'
  ]));

  // Fetch rooms
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['hotel-rooms', hotelId],
    queryFn: () => HotelRoomService.getHotelRooms(hotelId),
  });

  // Debug: Log the first room to see what fields are available
  console.log('DEBUG - Component: First room data:', rooms[0]);
  console.log('DEBUG - Component: is_provisional value:', rooms[0]?.is_provisional);
  console.log('DEBUG - Component: typeof is_provisional:', typeof rooms[0]?.is_provisional);
  console.log('DEBUG - Component: Boolean(rooms[0]?.is_provisional):', Boolean(rooms[0]?.is_provisional));

  // Fetch room stats
  const { data: roomStats } = useQuery({
    queryKey: ['hotel-room-stats', hotelId],
    queryFn: () => HotelRoomService.getRoomStats(hotelId),
  });

  // Delete room mutation
  const deleteMutation = useMutation({
    mutationFn: (roomId: string) => HotelRoomService.deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel-rooms', hotelId] });
      queryClient.invalidateQueries({ queryKey: ['hotel-room-stats', hotelId] });
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
                         (filterStatus === 'provisional' && room.is_provisional);

    return matchesSearch && matchesRoomType && matchesStatus;
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

  const getAvailabilityColor = (available: number | null | undefined, total: number) => {
    const availableNum = available ?? 0;
    const percentage = (availableNum / total) * 100;
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityBadge = (available: number | null | undefined, total: number) => {
    const availableNum = available ?? 0;
    const percentage = (availableNum / total) * 100;
    if (percentage >= 70) return <Badge variant="default" className="bg-green-100 text-green-800">High</Badge>;
    if (percentage >= 30) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="destructive">Low</Badge>;
  };

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
      <Card className="mt-0 p-0">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <CardTitle>Rooms</CardTitle>
              {/* Columns Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                    <Settings className="h-3 w-3 mr-1" /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[
                    { key: 'room_type_id', label: 'Room Type' },
                    { key: 'quantity_total', label: 'Total' },
                    { key: 'quantity_available', label: 'Available' },
                    { key: 'quantity_reserved', label: 'Reserved' },
                    { key: 'quantity_provisional', label: 'Provisional' },
                    { key: 'supplier', label: 'Supplier' },
                    { key: 'supplier_ref', label: 'Supplier Ref' },
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
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
                  }}
                >
                  Clear All
                </Button>
              </div>
              {/* Filters at flex-end */}
              <div className="flex flex-wrap gap-2 items-center justify-end">
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
                {/* Active Filters Count */}
                <div>
                  <div className={`h-8 min-w-[40px] flex items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors ${[
                    filterRoomType !== 'all' ? filterRoomType : null,
                    filterStatus !== 'all' ? filterStatus : null,
                    searchTerm ? 'search' : null
                  ].filter(Boolean).length > 0
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted/30 text-muted-foreground border-muted/30'}`}
                  >
                    {[
                      filterRoomType !== 'all' ? filterRoomType : null,
                      filterStatus !== 'all' ? filterStatus : null,
                      searchTerm ? 'search' : null
                    ].filter(Boolean).length}
                  </div>
                </div>
              </div>
            </div>
            <Separator className="my-2" />
          </div>
        </div>
      </Card>

      {/* Filters and Search */}
      <Card className='p-0'>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={filterRoomType} onValueChange={setFilterRoomType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Room Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ROOM_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="provisional">Provisional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                Cards
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Bed Type</TableHead>
                  <TableHead>Flexibility</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{room.room_type_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.ceil((new Date(room.check_out).getTime() - new Date(room.check_in).getTime()) / (1000 * 60 * 60 * 24))} nights
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{room.bed_type}</TableCell>
                    <TableCell>{room.flexibility}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(room.check_in), 'MMM dd')}</div>
                        <div className="text-muted-foreground">to {format(new Date(room.check_out), 'MMM dd, yyyy')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            Available: {(() => {
                              console.log('DEBUG - Render: room.is_provisional =', room.is_provisional, 'type:', typeof room.is_provisional);
                              if (room.is_provisional) {
                                console.log('DEBUG - Render: Showing PTO');
                                return (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="font-semibold text-orange-600">PTO</span>
                                      </TooltipTrigger>
                                      <TooltipContent>Provisional</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              } else {
                                console.log('DEBUG - Render: Showing quantity:', room.quantity_available ?? 0);
                                return (room.quantity_available ?? 0);
                              }
                            })()}
                          </span>
                          {!room.is_provisional && (
                            <span className={getAvailabilityColor(room.quantity_available, room.quantity_total)}>
                              {Math.round(((room.quantity_available ?? 0) / room.quantity_total) * 100)}%
                            </span>
                          )}
                        </div>
                        {!room.is_provisional && (
                          <Progress 
                            value={((room.quantity_available ?? 0) / room.quantity_total) * 100} 
                            className="h-2"
                          />
                        )}
                        {room.is_provisional && (
                          <div className="text-xs text-muted-foreground">Purchased to order</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">£{room.total_price_per_night_gbp_with_markup ?? 0}</div>
                        <div className="text-sm text-muted-foreground">
                          {room.supplier_price_per_night} {room.supplier_currency}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{room.supplier || 'N/A'}</div>
                        {room.supplier_ref && (
                          <div className="text-muted-foreground">Ref: {room.supplier_ref}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAvailabilityBadge(room.quantity_available, room.quantity_total)}
                    </TableCell>
                    <TableCell>{room.commission_percent ?? 0}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRoom(room)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room) => (
                <Card key={room.id} className='p-0'>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{room.room_type_id}</CardTitle>
                      {getAvailabilityBadge(room.quantity_available, room.quantity_total)}
                    </div>
                    <CardDescription>
                      {format(new Date(room.check_in), 'MMM dd')} - {format(new Date(room.check_out), 'MMM dd, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">£{room.total_price_per_night_gbp_with_markup ?? 0}</div>
                        <div className="text-muted-foreground">Per night</div>
                      </div>
                      <div>
                        <div className="font-medium">
                          {room.is_provisional ? (
                            <span className="text-primary">PTO</span>
                          ) : room.quantity_available}
                        </div>
                        <div className="text-muted-foreground">
                          {room.is_provisional ? 'Purchased to order' : 'Available'}
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {room.supplier || 'No supplier'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRoom(room)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRoom(room.id)}
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
        </CardContent>
      </Card>

      {/* Room Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRoom ? 'Edit Room' : 'Add New Room'}
            </DialogTitle>
            <DialogDescription>
              Configure room details, pricing, and availability.
            </DialogDescription>
          </DialogHeader>
          <HotelRoomForm
            hotelId={hotelId}
            room={selectedRoom}
            onClose={handleFormClose}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['hotel-rooms', hotelId] });
              queryClient.invalidateQueries({ queryKey: ['hotel-room-stats', hotelId] });
              handleFormClose();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 