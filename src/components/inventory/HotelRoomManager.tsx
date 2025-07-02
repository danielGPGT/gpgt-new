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
  Upload
} from 'lucide-react';
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

interface HotelRoomManagerProps {
  hotelId: string;
  hotelName: string;
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

export function HotelRoomManager({ hotelId, hotelName }: HotelRoomManagerProps) {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoomType, setFilterRoomType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Fetch rooms
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['hotel-rooms', hotelId],
    queryFn: () => HotelRoomService.getHotelRooms(hotelId),
  });

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
                         (filterStatus === 'available' && room.quantity_available > 0) ||
                         (filterStatus === 'reserved' && room.quantity_reserved > 0) ||
                         (filterStatus === 'provisional' && room.quantity_provisional > 0);

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

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityBadge = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return <Badge variant="default" className="bg-green-100 text-green-800">High</Badge>;
    if (percentage >= 30) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="destructive">Low</Badge>;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Room Management</h2>
          <p className="text-muted-foreground">Manage rooms and availability for {hotelName}</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Room
        </Button>
      </div>

    

      {/* Filters and Search */}
      <Card>
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
                  <TableHead>Dates</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{room.room_type_id}</div>
                        <div className="text-sm text-muted-foreground">{room.nights} nights</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(room.check_in), 'MMM dd')}</div>
                        <div className="text-muted-foreground">to {format(new Date(room.check_out), 'MMM dd, yyyy')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>Available: {room.quantity_available}</span>
                          <span className={getAvailabilityColor(room.quantity_available, room.quantity_total)}>
                            {Math.round((room.quantity_available / room.quantity_total) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={(room.quantity_available / room.quantity_total) * 100} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">£{room.price_gbp}</div>
                        <div className="text-sm text-muted-foreground">
                          {room.supplier_price} {room.supplier_currency}
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
                <Card key={room.id}>
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
                        <div className="font-medium">£{room.price_gbp}</div>
                        <div className="text-muted-foreground">Per night</div>
                      </div>
                      <div>
                        <div className="font-medium">{room.quantity_available}</div>
                        <div className="text-muted-foreground">Available</div>
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