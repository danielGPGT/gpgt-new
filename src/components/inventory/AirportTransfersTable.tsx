import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal, Plane, Car } from 'lucide-react';
import { toast } from 'sonner';

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
import type { AirportTransferWithEvent, AirportTransferFormData, AirportTransferFilters } from '@/types/inventory';

export function AirportTransfersTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AirportTransferFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<AirportTransferWithEvent | null>(null);
  const [selectedTransfers, setSelectedTransfers] = useState<string[]>([]);

  // Fetch airport transfers
  const { data: transfers, isLoading } = useQuery({
    queryKey: ['airport-transfers', filters],
    queryFn: () => InventoryService.getAirportTransfers(filters),
  });

  // Fetch events for dropdown
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });

  // Create transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: (data: AirportTransferFormData) => InventoryService.createAirportTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airport-transfers'] });
      setIsCreateDialogOpen(false);
      toast.success('Airport transfer created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create airport transfer: ${error.message}`);
    },
  });

  // Update transfer mutation
  const updateTransferMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AirportTransferFormData> }) =>
      InventoryService.updateAirportTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airport-transfers'] });
      setEditingTransfer(null);
      toast.success('Airport transfer updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update airport transfer: ${error.message}`);
    },
  });

  // Delete transfer mutation
  const deleteTransferMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteAirportTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airport-transfers'] });
      toast.success('Airport transfer deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete airport transfer: ${error.message}`);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => InventoryService.bulkDelete({ ids, component_type: 'airport_transfer' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airport-transfers'] });
      setSelectedTransfers([]);
      toast.success('Airport transfers deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete airport transfers: ${error.message}`);
    },
  });

  const handleCreateTransfer = (data: AirportTransferFormData) => {
    createTransferMutation.mutate(data);
  };

  const handleUpdateTransfer = (id: string, data: Partial<AirportTransferFormData>) => {
    updateTransferMutation.mutate({ id, data });
  };

  const handleDeleteTransfer = (id: string) => {
    deleteTransferMutation.mutate(id);
  };

  const handleBulkDelete = () => {
    if (selectedTransfers.length === 0) return;
    bulkDeleteMutation.mutate(selectedTransfers);
  };

  const getStatusBadge = (transfer: AirportTransferWithEvent) => {
    if (transfer.vehicles_available === 0) {
      return <Badge variant="destructive">No Vehicles</Badge>;
    }
    if (transfer.vehicles_available <= 1) {
      return <Badge variant="secondary">Low Availability</Badge>;
    }
    if (transfer.vehicles_provisional > 0) {
      return <Badge variant="outline">Provisional</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  const getTransferTypeBadge = (type: string) => {
    const variants = {
      arrival: 'default',
      departure: 'secondary',
      return: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getVehicleTypeIcon = (type: string) => {
    const icons = {
      'private car': <Car className="h-4 w-4" />,
      'mpv': <Car className="h-4 w-4" />,
      'luxury': <Car className="h-4 w-4" />,
      'chauffeur': <Car className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <Car className="h-4 w-4" />;
  };

  const filteredTransfers = transfers?.filter(transfer => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        transfer.vehicle_name?.toLowerCase().includes(searchLower) ||
        transfer.event?.name?.toLowerCase().includes(searchLower) ||
        transfer.supplier?.toLowerCase().includes(searchLower) ||
        transfer.transfer_type.toLowerCase().includes(searchLower) ||
        transfer.vehicle_type.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Airport Transfers</h2>
          <p className="text-muted-foreground">
            Manage airport transportation services
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedTransfers.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              Delete Selected ({selectedTransfers.length})
            </Button>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Airport Transfer</DialogTitle>
                <DialogDescription>
                  Add a new airport transfer to the inventory
                </DialogDescription>
              </DialogHeader>
              <AirportTransferForm
                events={events || []}
                onSubmit={handleCreateTransfer}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={createTransferMutation.isPending}
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
                  placeholder="Search transfers..."
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
              <Label>Transfer Type</Label>
              <Select
                value={filters.transfer_type || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, transfer_type: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="arrival">Arrival</SelectItem>
                  <SelectItem value="departure">Departure</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select
                value={filters.vehicle_type || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, vehicle_type: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vehicles</SelectItem>
                  <SelectItem value="private car">Private Car</SelectItem>
                  <SelectItem value="mpv">MPV</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="chauffeur">Chauffeur</SelectItem>
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
                    checked={selectedTransfers.length === filteredTransfers.length && filteredTransfers.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTransfers(filteredTransfers.map(t => t.id));
                      } else {
                        setSelectedTransfers([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Vehicles</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Loading airport transfers...
                  </TableCell>
                </TableRow>
              ) : filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    No airport transfers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTransfers.includes(transfer.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTransfers(prev => [...prev, transfer.id]);
                          } else {
                            setSelectedTransfers(prev => prev.filter(id => id !== transfer.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getVehicleTypeIcon(transfer.vehicle_type)}
                        <div>
                          <div className="font-medium">{transfer.vehicle_name || transfer.vehicle_type}</div>
                          <div className="text-sm text-muted-foreground">
                            Max {transfer.max_capacity} pax
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transfer.event?.name || '-'}</div>
                        <div className="text-sm text-muted-foreground">
                          {transfer.event?.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTransferTypeBadge(transfer.transfer_type)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transfer.airport_id ? `Airport ${transfer.airport_id}` : 'Airport'}
                        </div>
                        {transfer.hotel_id && (
                          <div className="text-sm text-muted-foreground">
                            Hotel {transfer.hotel_id}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transfer.vehicles_available}</div>
                        <div className="text-sm text-muted-foreground">
                          of {transfer.total_vehicles}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transfer.client_price.toFixed(2)} {transfer.currency}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per vehicle
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(transfer)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {transfer.supplier || '-'}
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
                          <DropdownMenuItem onClick={() => setEditingTransfer(transfer)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteTransfer(transfer.id)}
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
      {editingTransfer && (
        <Dialog open={!!editingTransfer} onOpenChange={() => setEditingTransfer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Airport Transfer</DialogTitle>
              <DialogDescription>
                Update airport transfer information
              </DialogDescription>
            </DialogHeader>
            <AirportTransferForm
              events={events || []}
              transfer={editingTransfer}
              onSubmit={(data) => handleUpdateTransfer(editingTransfer.id, data)}
              onCancel={() => setEditingTransfer(null)}
              isLoading={updateTransferMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Airport Transfer Form Component
interface AirportTransferFormProps {
  events: any[];
  transfer?: AirportTransferWithEvent;
  onSubmit: (data: AirportTransferFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function AirportTransferForm({ events, transfer, onSubmit, onCancel, isLoading }: AirportTransferFormProps) {
  const [formData, setFormData] = useState<AirportTransferFormData>({
    event_id: transfer?.event_id || '',
    hotel_id: transfer?.hotel_id || '',
    airport_id: transfer?.airport_id || '',
    transfer_type: transfer?.transfer_type || 'arrival',
    vehicle_type: transfer?.vehicle_type || 'private car',
    vehicle_name: transfer?.vehicle_name || '',
    max_capacity: transfer?.max_capacity || 0,
    pickup_window_start: transfer?.pickup_window_start || '',
    pickup_window_end: transfer?.pickup_window_end || '',
    cost: transfer?.cost || 0,
    markup_percent: transfer?.markup_percent || 0,
    currency: transfer?.currency || 'EUR',
    total_vehicles: transfer?.total_vehicles || 1,
    supplier: transfer?.supplier || '',
    supplier_ref: transfer?.supplier_ref || '',
    notes: transfer?.notes || '',
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
          <Label htmlFor="hotel_id">Hotel ID</Label>
          <Input
            id="hotel_id"
            value={formData.hotel_id}
            onChange={(e) => setFormData(prev => ({ ...prev, hotel_id: e.target.value }))}
            placeholder="Hotel ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="airport_id">Airport ID</Label>
          <Input
            id="airport_id"
            value={formData.airport_id}
            onChange={(e) => setFormData(prev => ({ ...prev, airport_id: e.target.value }))}
            placeholder="Airport ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transfer_type">Transfer Type *</Label>
          <Select
            value={formData.transfer_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, transfer_type: value as 'arrival' | 'departure' | 'return' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="arrival">Arrival</SelectItem>
              <SelectItem value="departure">Departure</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle_type">Vehicle Type *</Label>
          <Select
            value={formData.vehicle_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_type: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private car">Private Car</SelectItem>
              <SelectItem value="mpv">MPV</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
              <SelectItem value="chauffeur">Chauffeur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle_name">Vehicle Name</Label>
          <Input
            id="vehicle_name"
            value={formData.vehicle_name}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicle_name: e.target.value }))}
            placeholder="e.g., Mercedes S-Class, BMW 7 Series"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_capacity">Max Capacity *</Label>
          <Input
            id="max_capacity"
            type="number"
            value={formData.max_capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: parseInt(e.target.value) }))}
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_vehicles">Total Vehicles *</Label>
          <Input
            id="total_vehicles"
            type="number"
            value={formData.total_vehicles}
            onChange={(e) => setFormData(prev => ({ ...prev, total_vehicles: parseInt(e.target.value) }))}
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickup_window_start">Pickup Window Start</Label>
          <Input
            id="pickup_window_start"
            type="time"
            value={formData.pickup_window_start}
            onChange={(e) => setFormData(prev => ({ ...prev, pickup_window_start: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickup_window_end">Pickup Window End</Label>
          <Input
            id="pickup_window_end"
            type="time"
            value={formData.pickup_window_end}
            onChange={(e) => setFormData(prev => ({ ...prev, pickup_window_end: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Cost *</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) }))}
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
          {isLoading ? 'Saving...' : transfer ? 'Update Transfer' : 'Create Transfer'}
        </Button>
      </DialogFooter>
    </form>
  );
} 