import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal, Bus, Car } from 'lucide-react';
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
import type { CircuitTransferWithEvent, CircuitTransferFormData, CircuitTransferFilters } from '@/types/inventory';

export function CircuitTransfersTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CircuitTransferFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<CircuitTransferWithEvent | null>(null);
  const [selectedTransfers, setSelectedTransfers] = useState<string[]>([]);

  // Fetch circuit transfers
  const { data: transfers, isLoading } = useQuery({
    queryKey: ['circuit-transfers', filters],
    queryFn: () => InventoryService.getCircuitTransfers(filters),
  });

  // Fetch events for dropdown
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });

  // Create transfer mutation
  const createTransferMutation = useMutation({
    mutationFn: (data: CircuitTransferFormData) => InventoryService.createCircuitTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuit-transfers'] });
      setIsCreateDialogOpen(false);
      toast.success('Circuit transfer created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create circuit transfer: ${error.message}`);
    },
  });

  // Update transfer mutation
  const updateTransferMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CircuitTransferFormData> }) =>
      InventoryService.updateCircuitTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuit-transfers'] });
      setEditingTransfer(null);
      toast.success('Circuit transfer updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update circuit transfer: ${error.message}`);
    },
  });

  // Delete transfer mutation
  const deleteTransferMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteCircuitTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuit-transfers'] });
      toast.success('Circuit transfer deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete circuit transfer: ${error.message}`);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => InventoryService.bulkDelete({ ids, component_type: 'circuit_transfer' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuit-transfers'] });
      setSelectedTransfers([]);
      toast.success('Circuit transfers deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete circuit transfers: ${error.message}`);
    },
  });

  const handleCreateTransfer = (data: CircuitTransferFormData) => {
    createTransferMutation.mutate(data);
  };

  const handleUpdateTransfer = (id: string, data: Partial<CircuitTransferFormData>) => {
    updateTransferMutation.mutate({ id, data });
  };

  const handleDeleteTransfer = (id: string) => {
    deleteTransferMutation.mutate(id);
  };

  const handleBulkDelete = () => {
    if (selectedTransfers.length === 0) return;
    bulkDeleteMutation.mutate(selectedTransfers);
  };

  const getStatusBadge = (transfer: CircuitTransferWithEvent) => {
    if (transfer.seats_available === 0) {
      return <Badge variant="destructive">Full</Badge>;
    }
    if (transfer.seats_available <= 2) {
      return <Badge variant="secondary">Almost Full</Badge>;
    }
    if (transfer.seats_provisional > 0) {
      return <Badge variant="outline">Provisional</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  const getTransferTypeIcon = (type: string) => {
    return type === 'coach' ? <Bus className="h-4 w-4" /> : <Car className="h-4 w-4" />;
  };

  const filteredTransfers = transfers?.filter(transfer => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        transfer.vehicle_name?.toLowerCase().includes(searchLower) ||
        transfer.event?.name?.toLowerCase().includes(searchLower) ||
        transfer.supplier?.toLowerCase().includes(searchLower) ||
        transfer.transfer_type.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Circuit Transfers</h2>
          <p className="text-muted-foreground">
            Manage transportation between venues and hotels
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
                <DialogTitle>Create New Circuit Transfer</DialogTitle>
                <DialogDescription>
                  Add a new circuit transfer to the inventory
                </DialogDescription>
              </DialogHeader>
              <CircuitTransferForm
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
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="mpv">MPV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Availability</Label>
              <Select
                value={filters.seats_available_min?.toString() || 'all'}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  seats_available_min: value === 'all' ? undefined : parseInt(value)
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All seats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All seats</SelectItem>
                  <SelectItem value="1">Available (1+)</SelectItem>
                  <SelectItem value="5">Good availability (5+)</SelectItem>
                  <SelectItem value="10">High availability (10+)</SelectItem>
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
                <TableHead>Times</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Guide</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Loading circuit transfers...
                  </TableCell>
                </TableRow>
              ) : filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    No circuit transfers found
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
                        {getTransferTypeIcon(transfer.transfer_type)}
                        <div>
                          <div className="font-medium">{transfer.vehicle_name || transfer.transfer_type}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {transfer.transfer_type}
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
                    <TableCell>
                      <div>
                        {transfer.pickup_time && (
                          <div className="font-medium">
                            {format(new Date(`2000-01-01T${transfer.pickup_time}`), 'HH:mm')}
                          </div>
                        )}
                        {transfer.return_time && (
                          <div className="text-sm text-muted-foreground">
                            Return: {format(new Date(`2000-01-01T${transfer.return_time}`), 'HH:mm')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transfer.seats_available}</div>
                        <div className="text-sm text-muted-foreground">
                          of {transfer.seat_capacity}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transfer.price_per_seat.toFixed(2)} {transfer.currency}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per seat
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(transfer)}</TableCell>
                    <TableCell>
                      {transfer.guide_included ? (
                        <Badge variant="outline">Guide included</Badge>
                      ) : (
                        <span className="text-muted-foreground">No guide</span>
                      )}
                    </TableCell>
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
              <DialogTitle>Edit Circuit Transfer</DialogTitle>
              <DialogDescription>
                Update circuit transfer information
              </DialogDescription>
            </DialogHeader>
            <CircuitTransferForm
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

// Circuit Transfer Form Component
interface CircuitTransferFormProps {
  events: any[];
  transfer?: CircuitTransferWithEvent;
  onSubmit: (data: CircuitTransferFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function CircuitTransferForm({ events, transfer, onSubmit, onCancel, isLoading }: CircuitTransferFormProps) {
  const [formData, setFormData] = useState<CircuitTransferFormData>({
    event_id: transfer?.event_id || '',
    hotel_id: transfer?.hotel_id || '',
    transfer_type: transfer?.transfer_type || 'coach',
    vehicle_name: transfer?.vehicle_name || '',
    seat_capacity: transfer?.seat_capacity || 0,
    pickup_time: transfer?.pickup_time || '',
    return_time: transfer?.return_time || '',
    total_cost: transfer?.total_cost || 0,
    currency: transfer?.currency || 'EUR',
    markup_percent: transfer?.markup_percent || 0,
    min_fill_percent: transfer?.min_fill_percent || 100,
    guide_included: transfer?.guide_included ?? true,
    guide_name: transfer?.guide_name || '',
    guide_cost: transfer?.guide_cost || undefined,
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
          <Label htmlFor="transfer_type">Transfer Type *</Label>
          <Select
            value={formData.transfer_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, transfer_type: value as 'coach' | 'mpv' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="mpv">MPV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle_name">Vehicle Name</Label>
          <Input
            id="vehicle_name"
            value={formData.vehicle_name}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicle_name: e.target.value }))}
            placeholder="e.g., Mercedes Sprinter, Volvo Coach"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seat_capacity">Seat Capacity *</Label>
          <Input
            id="seat_capacity"
            type="number"
            value={formData.seat_capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, seat_capacity: parseInt(e.target.value) }))}
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_cost">Total Cost *</Label>
          <Input
            id="total_cost"
            type="number"
            step="0.01"
            value={formData.total_cost}
            onChange={(e) => setFormData(prev => ({ ...prev, total_cost: parseFloat(e.target.value) }))}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickup_time">Pickup Time</Label>
          <Input
            id="pickup_time"
            type="time"
            value={formData.pickup_time}
            onChange={(e) => setFormData(prev => ({ ...prev, pickup_time: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="return_time">Return Time</Label>
          <Input
            id="return_time"
            type="time"
            value={formData.return_time}
            onChange={(e) => setFormData(prev => ({ ...prev, return_time: e.target.value }))}
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
          <Label htmlFor="min_fill_percent">Min Fill %</Label>
          <Input
            id="min_fill_percent"
            type="number"
            step="0.01"
            value={formData.min_fill_percent}
            onChange={(e) => setFormData(prev => ({ ...prev, min_fill_percent: parseFloat(e.target.value) }))}
            min="0"
            max="100"
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

        <div className="space-y-2">
          <Label htmlFor="guide_name">Guide Name</Label>
          <Input
            id="guide_name"
            value={formData.guide_name}
            onChange={(e) => setFormData(prev => ({ ...prev, guide_name: e.target.value }))}
            placeholder="Guide name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guide_cost">Guide Cost</Label>
          <Input
            id="guide_cost"
            type="number"
            step="0.01"
            value={formData.guide_cost || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, guide_cost: e.target.value ? parseFloat(e.target.value) : undefined }))}
            min="0"
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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="guide_included"
          checked={formData.guide_included}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, guide_included: !!checked }))}
        />
        <Label htmlFor="guide_included">Guide included</Label>
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