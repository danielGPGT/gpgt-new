import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Plus, Edit, Trash2, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Coffee, Settings, Download, Upload, MoreHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { InventoryService } from '@/lib/inventoryService';
import type { LoungePass, LoungePassInsert, LoungePassUpdate, Event } from '@/types/inventory';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

// Zod schema for lounge pass form validation
const loungePassFormSchema = z.object({
  event_id: z.string().uuid('Event is required'),
  variant: z.string().min(1, 'Variant is required'),
  cost: z.number().min(0, 'Cost must be at least 0'),
  markup: z.number().min(0, 'Markup must be at least 0'),
  sell_price: z.number().min(0, 'Price must be at least 0'),
  currency: z.string().min(1, 'Currency is required'),
  is_active: z.boolean(),
  notes: z.string().optional().nullable(),
});

type LoungePassFormData = z.infer<typeof loungePassFormSchema>;

export function LoungePassesManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPass, setEditingPass] = useState<LoungePass | null>(null);
  const [confirmDeletePass, setConfirmDeletePass] = useState<LoungePass | null>(null);
  const [selectedPasses, setSelectedPasses] = useState<Set<string>>(new Set());
  const [formRef, setFormRef] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Column visibility with localStorage persistence
  const COLUMN_STORAGE_KEY = 'loungePassesManagerTableVisibleColumns_v1';
  const defaultColumns = [
    'variant', 'event', 'cost', 'markup', 'sell_price', 'currency', 'is_active', 'notes'
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
  const [columnOrder] = useState<string[]>(defaultColumns);

  useEffect(() => {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(Array.from(visibleColumns)));
  }, [visibleColumns]);

  // Fetch events for dropdown
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => InventoryService.getEvents(),
  });

  // Fetch lounge passes
  const { data: passes = [], isLoading } = useQuery({
    queryKey: ['lounge-passes'],
    queryFn: () => InventoryService.getLoungePasses(),
  });

  // Mutations
  const createPassMutation = useMutation({
    mutationFn: (data: LoungePassInsert) => InventoryService.createLoungePass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lounge-passes'] });
      setDrawerOpen(false);
      toast.success('Lounge pass created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create lounge pass: ${error.message}`);
    },
  });

  const updatePassMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoungePassUpdate }) => InventoryService.updateLoungePass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lounge-passes'] });
      setDrawerOpen(false);
      setEditingPass(null);
      toast.success('Lounge pass updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update lounge pass: ${error.message}`);
    },
  });

  const deletePassMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteLoungePass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lounge-passes'] });
      setConfirmDeletePass(null);
      toast.success('Lounge pass deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete lounge pass: ${error.message}`);
    },
  });

  // Filtered passes
  const filteredPasses = useMemo(() => passes.filter(pass => {
    // Event filter
    if (selectedEvent && pass.event_id !== selectedEvent.id) return false;
    // Delivery method filter
    if (deliveryMethod !== 'all' && pass.delivery_method !== deliveryMethod) return false;
    // Active status filter
    if (activeStatus !== 'all' && (activeStatus === 'active' ? !pass.is_active : pass.is_active)) return false;
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!pass.variant.toLowerCase().includes(searchLower) &&
          !pass.currency?.toLowerCase().includes(searchLower) &&
          !events.find(evt => evt.id === pass.event_id)?.name?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  }), [passes, searchTerm, events, selectedEvent, deliveryMethod, activeStatus]);

  // Add sorting state
  const [sortKey, setSortKey] = useState<string>('variant');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Add sortedPasses memo
  const sortedPasses = useMemo(() => {
    return [...filteredPasses].sort((a, b) => {
      let aValue: any = a[sortKey as keyof typeof a];
      let bValue: any = b[sortKey as keyof typeof b];
      // For event, sort by event name
      if (sortKey === 'event') {
        aValue = events.find(evt => evt.id === a.event_id)?.name || '';
        bValue = events.find(evt => evt.id === b.event_id)?.name || '';
      }
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPasses, sortKey, sortDir, events]);

  // Utility functions
  const togglePassSelection = useCallback((passId: string) => {
    setSelectedPasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(passId)) {
        newSet.delete(passId);
      } else {
        newSet.add(passId);
      }
      return newSet;
    });
  }, []);

  const toggleAllPasses = useCallback(() => {
    if (selectedPasses.size === filteredPasses.length) {
      setSelectedPasses(new Set());
    } else {
      setSelectedPasses(new Set(filteredPasses.map(p => p.id)));
    }
  }, [selectedPasses.size, filteredPasses]);

  // Export to CSV
  const exportToCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const selectedPassesData = filteredPasses.filter(p => selectedPasses.has(p.id));
      const passesToExport = selectedPassesData.length > 0 ? selectedPassesData : filteredPasses;
      const csvContent = [
        ['Variant', 'Event', 'Cost', 'Markup', 'Sell Price', 'Currency', 'Active', 'Notes'].join(','),
        ...passesToExport.map(pass => {
          const event = events.find(evt => evt.id === pass.event_id);
          return [
            `"${pass.variant}"`,
            `"${event?.name || ''}"`,
            pass.cost,
            pass.markup,
            pass.sell_price,
            pass.currency,
            pass.is_active ? 'Yes' : 'No',
            `"${pass.notes || ''}"`
          ].join(',');
        })
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lounge-passes-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Lounge passes exported successfully');
    } catch (error) {
      toast.error('Failed to export lounge passes');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [filteredPasses, selectedPasses, events]);

  // Bulk delete
  const bulkDeletePasses = useCallback(async () => {
    if (selectedPasses.size === 0) return;
    try {
      await Promise.all(Array.from(selectedPasses).map(id => deletePassMutation.mutateAsync(id)));
      setSelectedPasses(new Set());
      toast.success(`Deleted ${selectedPasses.size} lounge passes successfully`);
    } catch (error) {
      toast.error('Failed to delete some lounge passes');
    }
  }, [selectedPasses, deletePassMutation]);

  // Column toggle
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

  // Table columns
  const columns = [
    { key: 'variant', label: 'Variant' },
    { key: 'event', label: 'Event' },
    { key: 'cost', label: 'Cost' },
    { key: 'markup', label: 'Markup' },
    { key: 'sell_price', label: 'Sell Price' },
    { key: 'currency', label: 'Currency' },
    { key: 'is_active', label: 'Active' },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-6">
              <CardTitle>Lounge Passes</CardTitle>
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
                    { key: 'variant', label: 'Variant' },
                    { key: 'event', label: 'Event' },
                    { key: 'cost', label: 'Cost' },
                    { key: 'markup', label: 'Markup' },
                    { key: 'sell_price', label: 'Sell Price' },
                    { key: 'currency', label: 'Currency' },
                    { key: 'is_active', label: 'Active' },
                    { key: 'notes', label: 'Notes' },
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
              {selectedPasses.size > 0 && (
                <div className="flex items-center gap-3 mr-4 p-3 bg-muted rounded-lg shadow-sm animate-slide-in-up">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-semibold bg-primary-100 text-primary-800 border-primary-200">
                      {selectedPasses.size} selected
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
                      onClick={bulkDeletePasses}
                      className="text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Selected
                    </Button>
                  </div>
                </div>
              )}
              <Button variant="default" className="font-semibold shadow-md gap-2" onClick={() => { setEditingPass(null); setDrawerOpen(true); }}>
                <Plus className="h-5 w-5" />
                Add Lounge Pass
              </Button>
            </div>
          </div>
        </CardHeader>
        <div className="px-6 pb-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filters</span>
            </div>
            <div className="flex items-center justify-end flex-wrap gap-2">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lounge passes..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 rounded-md text-sm"
                />
              </div>
              {/* Event Filter */}
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
          </div>
        </div>
      </Card>
      <Card className="border py-0 mt-4 border-border rounded-2xl shadow-sm overflow-hidden">
      <Table className="">
        <TableHeader className="bg-muted z-10 border-b border-primary-200">
          <TableRow>
            <TableHead>
              <Checkbox
                checked={selectedPasses.size === filteredPasses.length && filteredPasses.length > 0}
                onCheckedChange={toggleAllPasses}
                aria-label="Select all passes"
              />
            </TableHead>
            {columnOrder.filter(col => visibleColumns.has(col)).map(col => (
              <TableHead
                key={col}
                className="cursor-pointer select-none"
                onClick={() => {
                  setSortKey(col);
                  setSortDir(sortKey === col && sortDir === 'asc' ? 'desc' : 'asc');
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {columns.find(c => c.key === col)?.label}
                  {sortKey === col ? (
                    sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </span>
              </TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPasses.length > 0 ? (
            sortedPasses.map((pass, index) => (
              <TableRow key={pass.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedPasses.has(pass.id)}
                    onCheckedChange={() => togglePassSelection(pass.id)}
                    aria-label={`Select pass ${pass.id}`}
                  />
                </TableCell>
                {columnOrder.filter(col => visibleColumns.has(col)).map(col => (
                  <TableCell key={col}>
                    {col === 'event'
                      ? (() => {
                          const eventName = events.find(evt => evt.id === pass.event_id)?.name;
                          return typeof eventName === 'string' ? eventName : '-';
                        })()
                      : col === 'is_active'
                        ? pass.is_active ? 'Yes' : 'No'
                        : col === 'cost' || col === 'markup' || col === 'sell_price'
                          ? pass[col as 'cost' | 'markup' | 'sell_price'] !== null && pass[col as 'cost' | 'markup' | 'sell_price'] !== undefined
                            ? (pass[col as 'cost' | 'markup' | 'sell_price'] as number).toFixed(2)
                            : '-'
                          : typeof pass[col as keyof typeof pass] === 'string' || typeof pass[col as keyof typeof pass] === 'number'
                            ? pass[col as keyof typeof pass]
                            : '-'}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingPass(pass); setDrawerOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setConfirmDeletePass(pass)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columnOrder.length + 2} className="text-center py-12 text-muted-foreground bg-muted/10 border-b border-border/30">
                <div className="flex flex-col items-center gap-2">
                  <Coffee className="h-8 w-8 text-muted-foreground/50" />
                  <span className="text-sm font-medium">No lounge passes found</span>
                  <span className="text-xs text-muted-foreground/70">Try adjusting your filters or add a new lounge pass</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </Card>
      {/* Drawer for create/edit */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="!max-w-2xl !max-h-none h-full">
          <DrawerHeader>
            <DrawerTitle>{editingPass ? 'Edit Lounge Pass' : 'Add New Lounge Pass'}</DrawerTitle>
            <DrawerDescription>
              {editingPass ? 'Update lounge pass information' : 'Create a new lounge pass for events'}
            </DrawerDescription>
          </DrawerHeader>
          <LoungePassFormDrawer
            pass={editingPass || undefined}
            events={events}
            onSubmit={(data: any) => {
              if (editingPass) {
                updatePassMutation.mutate({ id: editingPass.id, data });
              } else {
                createPassMutation.mutate(data);
              }
            }}
            onCancel={() => setDrawerOpen(false)}
            isLoading={createPassMutation.isPending || updatePassMutation.isPending}
            onFormReady={setFormRef}
          />
          <DrawerFooter>
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={() => { formRef?.reset(); }}>
                Reset Form
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPassMutation.isPending || updatePassMutation.isPending}
                  onClick={() => {
                    if (formRef) {
                      formRef.handleSubmit((data: any) => {
                        if (editingPass) {
                          updatePassMutation.mutate({ id: editingPass.id, data });
                        } else {
                          createPassMutation.mutate(data);
                        }
                      })();
                    }
                  }}
                >
                  {createPassMutation.isPending || updatePassMutation.isPending ? 'Saving...' : editingPass ? 'Update Pass' : 'Create Pass'}
                </Button>
              </div>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeletePass} onOpenChange={open => { if (!open) setConfirmDeletePass(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lounge Pass</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this lounge pass?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeletePass(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (confirmDeletePass) { deletePassMutation.mutate(confirmDeletePass.id); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Lounge Pass Form Drawer Component
function LoungePassFormDrawer({
  pass,
  events,
  onSubmit,
  onCancel,
  isLoading,
  onFormReady,
}: {
  pass?: LoungePass;
  events: Event[];
  onSubmit: (data: LoungePassInsert | LoungePassUpdate) => void;
  onCancel: () => void;
  isLoading: boolean;
  onFormReady: (form: any) => void;
}) {
  const form = useForm<LoungePassFormData>({
    resolver: zodResolver(loungePassFormSchema),
    defaultValues: {
      event_id: typeof pass?.event_id === 'string' ? pass.event_id : '',
      variant: typeof pass?.variant === 'string' ? pass.variant : '',
      cost: typeof pass?.cost === 'number' ? pass.cost : 0,
      markup: typeof pass?.markup === 'number' ? pass.markup : 0,
      sell_price: typeof pass?.sell_price === 'number' ? pass.sell_price : 0,
      currency: typeof pass?.currency === 'string' ? pass.currency : 'GBP',
      is_active: typeof pass?.is_active === 'boolean' ? pass.is_active : true,
      notes: typeof pass?.notes === 'string' ? pass.notes ?? '' : '',
    },
  });

  useEffect(() => {
    onFormReady(form);
  }, [form, onFormReady]);

  const handleSubmit = (data: LoungePassFormData) => {
    onSubmit(data);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
            <Label htmlFor="variant" className="text-sm font-medium text-muted-foreground">Variant *</Label>
            <Controller
              name="variant"
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  className="h-9"
                  placeholder="Variant"
                />
              )}
            />
            {form.formState.errors.variant && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.variant.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cost" className="text-sm font-medium text-muted-foreground">Cost *</Label>
            <Controller
              name="cost"
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
            {form.formState.errors.cost && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.cost.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="markup" className="text-sm font-medium text-muted-foreground">Markup *</Label>
            <Controller
              name="markup"
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
            {form.formState.errors.markup && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.markup.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sell_price" className="text-sm font-medium text-muted-foreground">Sell Price *</Label>
            <Controller
              name="sell_price"
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
            {form.formState.errors.sell_price && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.sell_price.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency" className="text-sm font-medium text-muted-foreground">Currency *</Label>
            <Controller
              name="currency"
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  className="h-9"
                  placeholder="Currency"
                />
              )}
            />
            {form.formState.errors.currency && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.currency.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="is_active" className="text-sm font-medium text-muted-foreground">Active</Label>
            <Controller
              name="is_active"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">Notes</Label>
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="notes"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="Additional notes"
                />
              )}
            />
          </div>
        </div>
      </form>
    </div>
  );
} 