import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

import { InventoryService } from '@/lib/inventoryService';
import type { TicketWithEvent, TicketFormData, TicketFilters } from '@/types/inventory';

export function TicketsTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TicketFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketWithEvent | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);

  // Fetch tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => InventoryService.getTickets(filters),
  });

  // Fetch events for dropdown
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: (data: TicketFormData) => InventoryService.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setIsCreateDialogOpen(false);
      toast.success('Ticket created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create ticket: ${error.message}`);
    },
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TicketFormData> }) =>
      InventoryService.updateTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setEditingTicket(null);
      toast.success('Ticket updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update ticket: ${error.message}`);
    },
  });

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete ticket: ${error.message}`);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => InventoryService.bulkDelete({ ids, component_type: 'ticket' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTickets([]);
      toast.success('Tickets deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete tickets: ${error.message}`);
    },
  });

  const handleCreateTicket = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
  };

  const handleUpdateTicket = (id: string, data: Partial<TicketFormData>) => {
    updateTicketMutation.mutate({ id, data });
  };

  const handleDeleteTicket = (id: string) => {
    deleteTicketMutation.mutate(id);
  };

  const handleBulkDelete = () => {
    if (selectedTickets.length === 0) return;
    bulkDeleteMutation.mutate(selectedTickets);
  };

  const getStatusBadge = (ticket: TicketWithEvent) => {
    if (ticket.quantity_available === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (ticket.quantity_available <= 5) {
      return <Badge variant="secondary">Low Stock</Badge>;
    }
    if (ticket.quantity_provisional > 0) {
      return <Badge variant="outline">Provisional</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  const getOrderStatusBadge = (ticket: TicketWithEvent) => {
    if (ticket.tickets_received) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Received</Badge>;
    }
    if (ticket.paid) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Paid</Badge>;
    }
    if (ticket.ordered) {
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Ordered</Badge>;
    }
    return <Badge variant="outline">Not Ordered</Badge>;
  };

  const filteredTickets = tickets?.filter(ticket => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        ticket.event?.name?.toLowerCase().includes(searchLower) ||
        ticket.ticket_type?.toLowerCase().includes(searchLower) ||
        ticket.supplier?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tickets</h2>
          <p className="text-muted-foreground">
            Manage event tickets and passes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedTickets.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              Delete Selected ({selectedTickets.length})
            </Button>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>
                  Add a new ticket to the inventory
                </DialogDescription>
              </DialogHeader>
              <TicketForm
                events={events || []}
                onSubmit={handleCreateTicket}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={createTicketMutation.isPending}
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
                  placeholder="Search tickets..."
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
              <Label>Status</Label>
              <Select
                value={filters.ordered?.toString() || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, ordered: value === 'all' ? undefined : value === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="false">Not ordered</SelectItem>
                  <SelectItem value="true">Ordered</SelectItem>
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
                  <SelectItem value="5">Low stock (5+)</SelectItem>
                  <SelectItem value="10">Good stock (10+)</SelectItem>
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
                    checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTickets(filteredTickets.map(t => t.id));
                      } else {
                        setSelectedTickets([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading tickets...
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTickets.includes(ticket.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTickets(prev => [...prev, ticket.id]);
                          } else {
                            setSelectedTickets(prev => prev.filter(id => id !== ticket.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.event?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.event?.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.ticket_type || 'Standard'}</div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.delivery_method}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.quantity_available}</div>
                        <div className="text-sm text-muted-foreground">
                          of {ticket.quantity_total}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {ticket.price_with_markup.toFixed(2)} {ticket.currency}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.markup_percent > 0 && `+${ticket.markup_percent}% markup`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket)}</TableCell>
                    <TableCell>{getOrderStatusBadge(ticket)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ticket.supplier || '-'}
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
                          <DropdownMenuItem onClick={() => setEditingTicket(ticket)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteTicket(ticket.id)}
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
      {editingTicket && (
        <Dialog open={!!editingTicket} onOpenChange={() => setEditingTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Ticket</DialogTitle>
              <DialogDescription>
                Update ticket information
              </DialogDescription>
            </DialogHeader>
            <TicketForm
              events={events || []}
              ticket={editingTicket}
              onSubmit={(data) => handleUpdateTicket(editingTicket.id, data)}
              onCancel={() => setEditingTicket(null)}
              isLoading={updateTicketMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Ticket Form Component
interface TicketFormProps {
  events: any[];
  ticket?: TicketWithEvent;
  onSubmit: (data: TicketFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function TicketForm({ events, ticket, onSubmit, onCancel, isLoading }: TicketFormProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    event_id: ticket?.event_id || '',
    ticket_category_id: ticket?.ticket_category_id || '',
    quantity_total: ticket?.quantity_total || 0,
    price: ticket?.price || 0,
    markup_percent: ticket?.markup_percent || 0,
    currency: ticket?.currency || 'EUR',
    delivery_method: ticket?.delivery_method || '',
    ticket_format: ticket?.ticket_format || '',
    ticket_type: ticket?.ticket_type || '',
    ticket_delivery_days: ticket?.ticket_delivery_days || undefined,
    available_from: ticket?.available_from || '',
    available_until: ticket?.available_until || '',
    refundable: ticket?.refundable || false,
    resellable: ticket?.resellable || false,
    party_size_together: ticket?.party_size_together || undefined,
    supplier: ticket?.supplier || '',
    supplier_ref: ticket?.supplier_ref || '',
    distribution_channel: ticket?.distribution_channel || '',
    metadata: ticket?.metadata || {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_id">Event *</Label>
          <Select
            value={formData.event_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, event_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticket_type">Ticket Type</Label>
          <Input
            id="ticket_type"
            value={formData.ticket_type}
            onChange={(e) => setFormData(prev => ({ ...prev, ticket_type: e.target.value }))}
            placeholder="e.g., VIP, General Admission"
          />
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
          <Label htmlFor="price">Base Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
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
          <Label htmlFor="delivery_method">Delivery Method</Label>
          <Input
            id="delivery_method"
            value={formData.delivery_method}
            onChange={(e) => setFormData(prev => ({ ...prev, delivery_method: e.target.value }))}
            placeholder="e.g., Email, Mobile, Physical"
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
          id="refundable"
          checked={formData.refundable}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, refundable: !!checked }))}
        />
        <Label htmlFor="refundable">Refundable</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="resellable"
          checked={formData.resellable}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, resellable: !!checked }))}
        />
        <Label htmlFor="resellable">Resellable</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : ticket ? 'Update Ticket' : 'Create Ticket'}
        </Button>
      </DialogFooter>
    </form>
  );
} 