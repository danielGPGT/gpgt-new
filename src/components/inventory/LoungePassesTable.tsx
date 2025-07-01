import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreHorizontal, Coffee } from 'lucide-react';
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
import type { LoungePassWithEvent, LoungePassFormData, LoungePassFilters } from '@/types/inventory';

export function LoungePassesTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<LoungePassFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPass, setEditingPass] = useState<LoungePassWithEvent | null>(null);
  const [selectedPasses, setSelectedPasses] = useState<string[]>([]);

  // Fetch lounge passes
  const { data: passes, isLoading } = useQuery({
    queryKey: ['lounge-passes', filters],
    queryFn: () => InventoryService.getLoungePasses(filters),
  });

  // Fetch events for dropdown
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });

  // Create pass mutation
  const createPassMutation = useMutation({
    mutationFn: (data: LoungePassFormData) => InventoryService.createLoungePass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lounge-passes'] });
      setIsCreateDialogOpen(false);
      toast.success('Lounge pass created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create lounge pass: ${error.message}`);
    },
  });

  // Update pass mutation
  const updatePassMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LoungePassFormData> }) =>
      InventoryService.updateLoungePass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lounge-passes'] });
      setEditingPass(null);
      toast.success('Lounge pass updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update lounge pass: ${error.message}`);
    },
  });

  // Delete pass mutation
  const deletePassMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteLoungePass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lounge-passes'] });
      toast.success('Lounge pass deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete lounge pass: ${error.message}`);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => InventoryService.bulkDelete({ ids, component_type: 'lounge_pass' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lounge-passes'] });
      setSelectedPasses([]);
      toast.success('Lounge passes deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete lounge passes: ${error.message}`);
    },
  });

  const handleCreatePass = (data: LoungePassFormData) => {
    createPassMutation.mutate(data);
  };

  const handleUpdatePass = (id: string, data: Partial<LoungePassFormData>) => {
    updatePassMutation.mutate({ id, data });
  };

  const handleDeletePass = (id: string) => {
    deletePassMutation.mutate(id);
  };

  const handleBulkDelete = () => {
    if (selectedPasses.length === 0) return;
    bulkDeleteMutation.mutate(selectedPasses);
  };

  const getStatusBadge = (pass: LoungePassWithEvent) => {
    if (pass.capacity && pass.capacity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (pass.capacity && pass.capacity <= 5) {
      return <Badge variant="secondary">Low Stock</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  const getDeliveryMethodBadge = (method: string) => {
    const variants = {
      'e-ticket': 'default',
      'physical': 'secondary',
      'mobile': 'outline'
    } as const;
    
    return (
      <Badge variant={variants[method as keyof typeof variants] || 'default'}>
        {method.charAt(0).toUpperCase() + method.slice(1)}
      </Badge>
    );
  };

  const filteredPasses = passes?.filter(pass => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        pass.lounge_name.toLowerCase().includes(searchLower) ||
        pass.airport_code?.toLowerCase().includes(searchLower) ||
        pass.event?.name?.toLowerCase().includes(searchLower) ||
        pass.supplier?.toLowerCase().includes(searchLower) ||
        pass.terminal?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lounge Passes</h2>
          <p className="text-muted-foreground">
            Manage airport lounge access passes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPasses.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              Delete Selected ({selectedPasses.length})
            </Button>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Pass
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Lounge Pass</DialogTitle>
                <DialogDescription>
                  Add a new lounge pass to the inventory
                </DialogDescription>
              </DialogHeader>
              <LoungePassForm
                events={events || []}
                onSubmit={handleCreatePass}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={createPassMutation.isPending}
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
                  placeholder="Search passes..."
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
              <Label>Airport Code</Label>
              <Input
                placeholder="e.g., LHR, JFK"
                value={filters.airport_code || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, airport_code: e.target.value || undefined }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <Select
                value={filters.delivery_method || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, delivery_method: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="e-ticket">E-Ticket</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
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
                    checked={selectedPasses.length === filteredPasses.length && filteredPasses.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPasses(filteredPasses.map(p => p.id));
                      } else {
                        setSelectedPasses([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Lounge</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Airport</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Loading lounge passes...
                  </TableCell>
                </TableRow>
              ) : filteredPasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    No lounge passes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPasses.map((pass) => (
                  <TableRow key={pass.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPasses.includes(pass.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPasses(prev => [...prev, pass.id]);
                          } else {
                            setSelectedPasses(prev => prev.filter(id => id !== pass.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{pass.lounge_name}</div>
                          {pass.terminal && (
                            <div className="text-sm text-muted-foreground">
                              Terminal {pass.terminal}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pass.event?.name || '-'}</div>
                        <div className="text-sm text-muted-foreground">
                          {pass.event?.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pass.airport_code || '-'}</div>
                        {pass.description && (
                          <div className="text-sm text-muted-foreground">
                            {pass.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {pass.price_gbp.toFixed(2)} {pass.quote_currency}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {pass.markup_percent > 0 && `+${pass.markup_percent}% markup`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {pass.capacity ? (
                          <>
                            <div className="font-medium">{pass.capacity}</div>
                            <div className="text-sm text-muted-foreground">available</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Unlimited</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {pass.delivery_method ? getDeliveryMethodBadge(pass.delivery_method) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(pass)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {pass.supplier || '-'}
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
                          <DropdownMenuItem onClick={() => setEditingPass(pass)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeletePass(pass.id)}
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
      {editingPass && (
        <Dialog open={!!editingPass} onOpenChange={() => setEditingPass(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Lounge Pass</DialogTitle>
              <DialogDescription>
                Update lounge pass information
              </DialogDescription>
            </DialogHeader>
            <LoungePassForm
              events={events || []}
              pass={editingPass}
              onSubmit={(data) => handleUpdatePass(editingPass.id, data)}
              onCancel={() => setEditingPass(null)}
              isLoading={updatePassMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Lounge Pass Form Component
interface LoungePassFormProps {
  events: any[];
  pass?: LoungePassWithEvent;
  onSubmit: (data: LoungePassFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function LoungePassForm({ events, pass, onSubmit, onCancel, isLoading }: LoungePassFormProps) {
  const [formData, setFormData] = useState<LoungePassFormData>({
    event_id: pass?.event_id || '',
    airport_code: pass?.airport_code || '',
    lounge_name: pass?.lounge_name || '',
    terminal: pass?.terminal || '',
    supplier: pass?.supplier || '',
    quote_currency: pass?.quote_currency || 'GBP',
    supplier_quote: pass?.supplier_quote || 0,
    markup_percent: pass?.markup_percent || 0,
    capacity: pass?.capacity || undefined,
    delivery_method: pass?.delivery_method || '',
    description: pass?.description || '',
    notes: pass?.notes || '',
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
          <Label htmlFor="airport_code">Airport Code</Label>
          <Input
            id="airport_code"
            value={formData.airport_code}
            onChange={(e) => setFormData(prev => ({ ...prev, airport_code: e.target.value }))}
            placeholder="e.g., LHR, JFK, CDG"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lounge_name">Lounge Name *</Label>
          <Input
            id="lounge_name"
            value={formData.lounge_name}
            onChange={(e) => setFormData(prev => ({ ...prev, lounge_name: e.target.value }))}
            placeholder="e.g., Plaza Premium Lounge, No1 Lounge"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="terminal">Terminal</Label>
          <Input
            id="terminal"
            value={formData.terminal}
            onChange={(e) => setFormData(prev => ({ ...prev, terminal: e.target.value }))}
            placeholder="e.g., 1, 2, 3, 4, 5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier_quote">Supplier Quote</Label>
          <Input
            id="supplier_quote"
            type="number"
            step="0.01"
            value={formData.supplier_quote}
            onChange={(e) => setFormData(prev => ({ ...prev, supplier_quote: parseFloat(e.target.value) }))}
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
          <Label htmlFor="quote_currency">Currency</Label>
          <Select
            value={formData.quote_currency}
            onValueChange={(value) => setFormData(prev => ({ ...prev, quote_currency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            value={formData.capacity || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value ? parseInt(e.target.value) : undefined }))}
            min="0"
            placeholder="Leave empty for unlimited"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery_method">Delivery Method</Label>
          <Select
            value={formData.delivery_method}
            onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_method: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="e-ticket">E-Ticket</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the lounge"
        />
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
          {isLoading ? 'Saving...' : pass ? 'Update Pass' : 'Create Pass'}
        </Button>
      </DialogFooter>
    </form>
  );
} 