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
import { useRole } from '@/lib/RoleContext';

export function TicketsTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TicketFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketWithEvent | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const { role } = useRole(); // Role-based UI

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
    // Convert null values to undefined for Supabase
    const submitData = {
      ...data,
      quantity_provisional: data.quantity_provisional || undefined,
      ticket_type: data.ticket_type || undefined,
      supplier: data.supplier || undefined,
      supplier_ref: data.supplier_ref || undefined,
      ticket_days: data.ticket_days || undefined,
      ordered_at: data.ordered_at || undefined,
      paid_at: data.paid_at || undefined,
      tickets_received_at: data.tickets_received_at || undefined,
    };
    createTicketMutation.mutate(submitData);
  };

  const handleUpdateTicket = (id: string, data: Partial<TicketFormData>) => {
    // Convert null values to undefined for Supabase
    const submitData = {
      ...data,
      quantity_provisional: data.quantity_provisional || undefined,
      ticket_type: data.ticket_type || undefined,
      supplier: data.supplier || undefined,
      supplier_ref: data.supplier_ref || undefined,
      ticket_days: data.ticket_days || undefined,
      ordered_at: data.ordered_at || undefined,
      paid_at: data.paid_at || undefined,
      tickets_received_at: data.tickets_received_at || undefined,
    };
    updateTicketMutation.mutate({ id, data: submitData });
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
          {/* Only show bulk delete for operations */}
          {role === 'operations' && selectedTickets.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              Delete Selected ({selectedTickets.length})
            </Button>
          )}
          {/* Only show Add Ticket for operations */}
          {role === 'operations' && (
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
                  role={role}
                />
              </DialogContent>
            </Dialog>
          )}
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
                {/* Only show checkbox for operations */}
                {role === 'operations' && (
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
                )}
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Supplier</TableHead>
                {/* Only show actions for operations */}
                {role === 'operations' && <TableHead className="w-12">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={role === 'operations' ? 9 : 8} className="text-center py-8">
                    Loading tickets...
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === 'operations' ? 9 : 8} className="text-center py-8">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    {/* Only show checkbox for operations */}
                    {role === 'operations' && (
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
                    )}
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
                    {/* Only show actions for operations */}
                    {role === 'operations' && (
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
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingTicket && role === 'operations' && (
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
              role={role}
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
  role: 'operations' | 'sales';
}

function TicketForm({ events, ticket, onSubmit, onCancel, isLoading, role }: TicketFormProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    event_id: ticket?.event_id || '',
    ticket_category_id: ticket?.ticket_category_id || '',
    quantity_total: ticket?.quantity_total || 0,
    supplier_currency: ticket?.supplier_currency || 'EUR',
    supplier_price: ticket?.supplier_price || 0,
    currency: ticket?.currency || 'GBP',
    price: ticket?.price || 0,
    markup_percent: ticket?.markup_percent || 0,
    ticket_days: ticket?.ticket_days || null,
    refundable: ticket?.refundable || false,
    resellable: ticket?.resellable || false,
    quantity_provisional: ticket?.quantity_provisional || null,
    ticket_type: ticket?.ticket_type || undefined,
    supplier: ticket?.supplier || undefined,
    supplier_ref: ticket?.supplier_ref || undefined,
    ordered: ticket?.ordered || false,
    ordered_at: ticket?.ordered_at || null,
    paid: ticket?.paid || false,
    paid_at: ticket?.paid_at || null,
    tickets_received: ticket?.tickets_received || false,
    tickets_received_at: ticket?.tickets_received_at || null,
    metadata: (ticket?.metadata as Record<string, any>) || {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'sales') return; // Prevent submit for sales
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
            disabled={role === 'sales'}
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
            value={formData.ticket_type || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, ticket_type: e.target.value || undefined }))}
            placeholder="e.g., VIP, General Admission"
            disabled={role === 'sales'}
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
            disabled={role === 'sales'}
          />
        </div>

        {/* Hide/disable price, markup, supplier, supplier_ref for sales */}
        {role === 'operations' && (
          <>
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
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value || undefined }))}
                placeholder="Supplier name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_ref">Supplier Reference</Label>
              <Input
                id="supplier_ref"
                value={formData.supplier_ref || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_ref: e.target.value || undefined }))}
                placeholder="Reference number"
              />
            </div>
          </>
        )}

        {/* For sales, show these fields as read-only text if needed */}
        {role === 'sales' && (
          <>
            <div className="space-y-2">
              <Label>Base Price</Label>
              <div className="p-2 border rounded bg-muted-foreground/5">{formData.price}</div>
            </div>
            <div className="space-y-2">
              <Label>Markup %</Label>
              <div className="p-2 border rounded bg-muted-foreground/5">{formData.markup_percent}</div>
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <div className="p-2 border rounded bg-muted-foreground/5">{formData.supplier}</div>
            </div>
            <div className="space-y-2">
              <Label>Supplier Reference</Label>
              <div className="p-2 border rounded bg-muted-foreground/5">{formData.supplier_ref}</div>
            </div>
          </>
        )}


      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="refundable"
          checked={formData.refundable}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, refundable: !!checked }))}
          disabled={role === 'sales'}
        />
        <Label htmlFor="refundable">Refundable</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="resellable"
          checked={formData.resellable}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, resellable: !!checked }))}
          disabled={role === 'sales'}
        />
        <Label htmlFor="resellable">Resellable</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {/* Only show submit for operations */}
        {role === 'operations' && (
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : ticket ? 'Update Ticket' : 'Create Ticket'}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
} 