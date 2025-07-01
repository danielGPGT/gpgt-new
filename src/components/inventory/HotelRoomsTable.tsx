import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal, Calendar } from 'lucide-react';
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
import type { HotelRoomWithEvent, HotelRoomFormData, HotelRoomFilters } from '@/types/inventory';

export function HotelRoomsTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<HotelRoomFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HotelRoomWithEvent | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  // Fetch hotel rooms
  const { data: rooms, isLoading } = useQuery({
    queryKey: ['hotel-rooms', filters],
    queryFn: () => InventoryService.getHotelRooms(filters),
  });

  // Fetch events for dropdown
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: (data: HotelRoomFormData) => InventoryService.createHotelRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel-rooms'] });
      setIsCreateDialogOpen(false);
      toast.success('Hotel room created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create hotel room: ${error.message}`);
    },
  });

  // Update room mutation
  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HotelRoomFormData> }) =>
      InventoryService.updateHotelRoom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel-rooms'] });
      setEditingRoom(null);
      toast.success('Hotel room updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update hotel room: ${error.message}`);
    },
  });

  // Delete room mutation
  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteHotelRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel-rooms'] });
      toast.success('Hotel room deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete hotel room: ${error.message}`);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => InventoryService.bulkDelete({ ids, component_type: 'hotel_room' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel-rooms'] });
      setSelectedRooms([]);
      toast.success('Hotel rooms deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete hotel rooms: ${error.message}`);
    },
  });

  const handleCreateRoom = (data: HotelRoomFormData) => {
    createRoomMutation.mutate(data);
  };

  const handleUpdateRoom = (id: string, data: Partial<HotelRoomFormData>) => {
    updateRoomMutation.mutate({ id, data });
  };

  const handleDeleteRoom = (id: string) => {
    deleteRoomMutation.mutate(id);
  };

  const handleBulkDelete = () => {
    if (selectedRooms.length === 0) return;
    bulkDeleteMutation.mutate(selectedRooms);
  };

  const getStatusBadge = (room: HotelRoomWithEvent) => {
    if (room.quantity_available === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (room.quantity_available <= 2) {
      return <Badge variant="secondary">Low Stock</Badge>;
    }
    if (room.quantity_provisional > 0) {
      return <Badge variant="outline">Provisional</Badge>;
    }
    if (room.contracted) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Contracted</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  const getAttritionBadge = (room: HotelRoomWithEvent) => {
    if (!room.attrition_deadline) return null;
    
    const deadline = new Date(room.attrition_deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < 0) {
      return <Badge variant="destructive">Past Deadline</Badge>;
    }
    if (daysUntilDeadline <= 7) {
      return <Badge variant="secondary">Due Soon</Badge>;
    }
    return <Badge variant="outline">{daysUntilDeadline} days</Badge>;
  };

  const filteredRooms = rooms?.filter(room => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        room.room_type_id.toLowerCase().includes(searchLower) ||
        room.event?.name?.toLowerCase().includes(searchLower) ||
        room.supplier?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hotel Rooms</h2>
          <p className="text-muted-foreground">
            Manage accommodation inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRooms.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              Delete Selected ({selectedRooms.length})
            </Button>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Hotel Room</DialogTitle>
                <DialogDescription>
                  Add a new hotel room to the inventory
                </DialogDescription>
              </DialogHeader>
              <HotelRoomForm
                events={events || []}
                onSubmit={handleCreateRoom}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={createRoomMutation.isPending}
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
                  placeholder="Search rooms..."
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
              <Label>Contract Status</Label>
              <Select
                value={filters.contracted?.toString() || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, contracted: value === 'all' ? undefined : value === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rooms</SelectItem>
                  <SelectItem value="true">Contracted</SelectItem>
                  <SelectItem value="false">Not contracted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Availability</Label>
              <Select
                value={filters.quantity_available_min?.toString() || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  quantity_available_min: value === 'all' ? undefined : parseInt(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All quantities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All quantities</SelectItem>
                  <SelectItem value="1">Available (1+)</SelectItem>
                  <SelectItem value="2">Low stock (2+)</SelectItem>
                  <SelectItem value="5">Good stock (5+)</SelectItem>
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
                    checked={selectedRooms.length === filteredRooms.length && filteredRooms.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRooms(filteredRooms.map(r => r.id));
                      } else {
                        setSelectedRooms([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attrition</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Loading hotel rooms...
                  </TableCell>
                </TableRow>
              ) : filteredRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    No hotel rooms found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRooms.includes(room.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedRooms(prev => [...prev, room.id]);
                          } else {
                            setSelectedRooms(prev => prev.filter(id => id !== room.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{room.room_type_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {room.nights} nights
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{room.event?.name || '-'}</div>
                        <div className="text-sm text-muted-foreground">
                          {room.event?.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(new Date(room.check_in), 'MMM dd')} - {format(new Date(room.check_out), 'MMM dd')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(room.check_in), 'yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{room.quantity_available}</div>
                        <div className="text-sm text-muted-foreground">
                          of {room.quantity_total}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {room.price_with_markup.toFixed(2)} {room.currency}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {room.markup_percent > 0 && `+${room.markup_percent}% markup`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(room)}</TableCell>
                    <TableCell>{getAttritionBadge(room)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {room.supplier || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingRoom(room)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteRoom(room.id)}
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
      {editingRoom && (
        <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Hotel Room</DialogTitle>
              <DialogDescription>
                Update hotel room information
              </DialogDescription>
            </DialogHeader>
            <HotelRoomForm
              events={events || []}
              room={editingRoom}
              onSubmit={(data) => handleUpdateRoom(editingRoom.id, data)}
              onCancel={() => setEditingRoom(null)}
              isLoading={updateRoomMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Hotel Room Form Component
interface HotelRoomFormProps {
  events: any[];
  room?: HotelRoomWithEvent;
  onSubmit: (data: HotelRoomFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function HotelRoomForm({ events, room, onSubmit, onCancel, isLoading }: HotelRoomFormProps) {
  const [formData, setFormData] = useState<HotelRoomFormData>({
    hotel_id: room?.hotel_id || '',
    room_type_id: room?.room_type_id || '',
    event_id: room?.event_id || '',
    check_in: room?.check_in || '',
    check_out: room?.check_out || '',
    quantity_total: room?.quantity_total || 0,
    base_price: room?.base_price || 0,
    markup_percent: room?.markup_percent || 0,
    currency: room?.currency || 'EUR',
    vat_percent: room?.vat_percent || undefined,
    resort_fee: room?.resort_fee || undefined,
    resort_fee_type: room?.resort_fee_type || 'per_night',
    city_tax_per_person_per_night: room?.city_tax_per_person_per_night || undefined,
    contracted: room?.contracted || false,
    attrition_deadline: room?.attrition_deadline || '',
    release_allowed_percent: room?.release_allowed_percent || undefined,
    penalty_terms: room?.penalty_terms || '',
    supplier: room?.supplier || '',
    supplier_ref: room?.supplier_ref || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hotel_id">Hotel ID *</Label>
          <Input
            id="hotel_id"
            value={formData.hotel_id}
            onChange={(e) => setFormData(prev => ({ ...prev, hotel_id: e.target.value }))}
            placeholder="Hotel ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="room_type_id">Room Type *</Label>
          <Input
            id="room_type_id"
            value={formData.room_type_id}
            onChange={(e) => setFormData(prev => ({ ...prev, room_type_id: e.target.value }))}
            placeholder="e.g., Standard Double, Suite"
          />
        </div>

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
          <Label htmlFor="quantity_total">Total Quantity *</Label>
          <Input
            id="quantity_total"
            type="number"
            value={formData.quantity_total}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity_total: parseInt(e.target.value) }))}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="check_in">Check-in Date *</Label>
          <Input
            id="check_in"
            type="date"
            value={formData.check_in}
            onChange={(e) => setFormData(prev => ({ ...prev, check_in: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="check_out">Check-out Date *</Label>
          <Input
            id="check_out"
            type="date"
            value={formData.check_out}
            onChange={(e) => setFormData(prev => ({ ...prev, check_out: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_price">Base Price *</Label>
          <Input
            id="base_price"
            type="number"
            step="0.01"
            value={formData.base_price}
            onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) }))}
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
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vat_percent">VAT %</Label>
          <Input
            id="vat_percent"
            type="number"
            step="0.01"
            value={formData.vat_percent || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, vat_percent: e.target.value ? parseFloat(e.target.value) : undefined }))}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resort_fee">Resort Fee</Label>
          <Input
            id="resort_fee"
            type="number"
            step="0.01"
            value={formData.resort_fee || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, resort_fee: e.target.value ? parseFloat(e.target.value) : undefined }))}
            min="0"
          />
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

        <div className="space-y-2">
          <Label htmlFor="supplier_ref">Supplier Reference</Label>
          <Input
            id="supplier_ref"
            value={formData.supplier_ref}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier_ref: e.target.value }))}
            placeholder="Reference number"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="contracted"
          checked={formData.contracted}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contracted: !!checked }))}
        />
        <Label htmlFor="contracted">Contracted</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
        </Button>
      </DialogFooter>
    </form>
  );
} 