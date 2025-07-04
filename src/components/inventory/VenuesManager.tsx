import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Monitor, Hash, Umbrella } from 'lucide-react';
import { InventoryService } from '@/lib/inventoryService';
import type { Venue, VenueInsert, VenueUpdate, TicketCategory, TicketCategoryInsert, TicketCategoryUpdate } from '@/types/inventory';
import { Textarea } from '@/components/ui/textarea';
import MediaLibrarySelector from '../MediaLibrarySelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VenueForm } from '@/components/forms/VenueForm';

export function VenuesManager() {
  const queryClient = useQueryClient();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venueSearch, setVenueSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [venueDrawerOpen, setVenueDrawerOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TicketCategory | null>(null);
  // State for confirmation dialogs
  const [confirmDeleteVenue, setConfirmDeleteVenue] = useState<Venue | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<TicketCategory | null>(null);
  // Sorting state
  const [venueSortKey, setVenueSortKey] = useState<'name' | 'city'>('name');
  const [venueSortDir, setVenueSortDir] = useState<'asc' | 'desc'>('asc');
  const [catSortKey, setCatSortKey] = useState<'name' | 'type' | 'delivery' | 'venue'>('name');
  const [catSortDir, setCatSortDir] = useState<'asc' | 'desc'>('asc');

  // Venues
  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => InventoryService.getVenues(),
  });

  // Ticket Categories for selected venue
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['ticket-categories', selectedVenue?.id],
    queryFn: () => selectedVenue ? InventoryService.getTicketCategories({ venue_id: selectedVenue.id }) : InventoryService.getTicketCategories(),
    enabled: true,
  });

  // Venue mutations
  const createVenueMutation = useMutation({
    mutationFn: (data: VenueInsert) => {
      console.log('[CREATE VENUE] Payload:', data);
      return InventoryService.createVenue(data);
    },
    onSuccess: (data) => {
      console.log('[CREATE VENUE] Success:', data);
      queryClient.invalidateQueries({ queryKey: ['venues'] }); setVenueDrawerOpen(false);
    },
    onError: (error) => {
      console.error('[CREATE VENUE] Error:', error);
    },
  });
  const updateVenueMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VenueUpdate }) => {
      console.log('[UPDATE VENUE] Payload:', { id, data });
      return InventoryService.updateVenue(id, data);
    },
    onSuccess: (data) => {
      console.log('[UPDATE VENUE] Success:', data);
      queryClient.invalidateQueries({ queryKey: ['venues'] }); setVenueDrawerOpen(false); setEditingVenue(null);
    },
    onError: (error) => {
      console.error('[UPDATE VENUE] Error:', error);
    },
  });
  const deleteVenueMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteVenue(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['venues'] }); setSelectedVenue(null); },
  });

  // Ticket Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: TicketCategoryInsert) => {
      // Always provide a unique id for new categories
      const id = data.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
      return InventoryService.createTicketCategory({ ...data, id });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ticket-categories', selectedVenue?.id] }); setCategoryDrawerOpen(false); },
  });
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TicketCategoryUpdate }) => InventoryService.updateTicketCategory(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ticket-categories', selectedVenue?.id] }); setCategoryDrawerOpen(false); setEditingCategory(null); },
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteTicketCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ticket-categories', selectedVenue?.id] }); },
  });

  // Filtered venues
  const filteredVenues = venues.filter(v => v.name.toLowerCase().includes(venueSearch.toLowerCase()));
  // Filtered categories
  const filteredCategories = categories.filter(c => c.category_name.toLowerCase().includes(categorySearch.toLowerCase()));

  // Sorted venues
  const sortedVenues = [...filteredVenues].sort((a, b) => {
    let aValue: any, bValue: any;
    switch (venueSortKey) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'city':
        aValue = a.city?.toLowerCase() || '';
        bValue = b.city?.toLowerCase() || '';
        break;
      default:
        aValue = '';
        bValue = '';
    }
    if (aValue < bValue) return venueSortDir === 'asc' ? -1 : 1;
    if (aValue > bValue) return venueSortDir === 'asc' ? 1 : -1;
    return 0;
  });
  // Sorted categories
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    let aValue: any, bValue: any;
    switch (catSortKey) {
      case 'name':
        aValue = a.category_name?.toLowerCase() || '';
        bValue = b.category_name?.toLowerCase() || '';
        break;
      case 'type':
        aValue = a.category_type?.toLowerCase() || '';
        bValue = b.category_type?.toLowerCase() || '';
        break;
      case 'delivery':
        aValue = a.ticket_delivery_days || 0;
        bValue = b.ticket_delivery_days || 0;
        break;
      case 'venue':
        aValue = venues.find(v => v.id === a.venue_id)?.name?.toLowerCase() || '';
        bValue = venues.find(v => v.id === b.venue_id)?.name?.toLowerCase() || '';
        break;
      default:
        aValue = '';
        bValue = '';
    }
    if (aValue < bValue) return catSortDir === 'asc' ? -1 : 1;
    if (aValue > bValue) return catSortDir === 'asc' ? 1 : -1;
    return 0;
  });



  // Ticket Category Drawer Form
  function CategoryFormDrawer({ category, onSubmit, onCancel, isLoading }: { category?: TicketCategory; onSubmit: (data: TicketCategoryInsert | TicketCategoryUpdate) => void; onCancel: () => void; isLoading: boolean; }) {
    const [formData, setFormData] = useState<TicketCategoryInsert | TicketCategoryUpdate>({
      venue_id: category?.venue_id || '',
      category_name: category?.category_name || '',
      category_type: category?.category_type || '',
      sport_type: null,
      description: category?.description ? (typeof category.description === 'string' ? category.description : JSON.stringify(category.description, null, 2)) : '',
      ticket_delivery_days: category?.ticket_delivery_days || undefined,
      media_files: category?.media_files || [],
      options: category?.options || { video_wall: false, numbered_seating: false, covered_seating: false },
    });
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<any[]>(Array.isArray(formData.media_files) ? formData.media_files : []);
    // Ensure options is always an object
    const options: any = typeof formData.options === 'string' ? JSON.parse(formData.options) : (formData.options || {});
    const [venuePopoverOpen, setVenuePopoverOpen] = useState(false);
    const [venueSearch, setVenueSearch] = useState('');
    const filteredVenues = venues.filter(v => v.name.toLowerCase().includes(venueSearch.toLowerCase()));
    return (
      <form onSubmit={e => { e.preventDefault(); onSubmit({ ...formData, media_files: selectedMedia, options, sport_type: null }); }} className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="venue_id">Venue *</Label>
            <Popover open={venuePopoverOpen} onOpenChange={setVenuePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                  type="button"
                  onClick={() => setVenuePopoverOpen((open) => !open)}
                >
                  {venues.find(v => v.id === formData.venue_id)?.name || 'Select venue'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search venue..."
                    value={venueSearch}
                    onValueChange={setVenueSearch}
                  />
                  <CommandList>
                    {filteredVenues.length === 0 ? (
                      <div className="p-2 text-muted-foreground">No venues found</div>
                    ) : (
                      filteredVenues.map(v => (
                        <CommandItem
                          key={v.id}
                          value={v.id}
                          onSelect={() => {
                            setFormData(prev => ({ ...prev, venue_id: v.id }));
                            setVenuePopoverOpen(false);
                          }}
                        >
                          {v.name}
                        </CommandItem>
                      ))
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="category_name">Category Name *</Label>
            <Input id="category_name" value={formData.category_name as string} onChange={e => setFormData(prev => ({ ...prev, category_name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category_type">Category Type</Label>
            <Input id="category_type" value={formData.category_type as string || ''} onChange={e => setFormData(prev => ({ ...prev, category_type: e.target.value }))} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="description">Description (JSON or text)</Label>
            <Textarea id="description" value={formData.description as string || ''} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Description as text or JSON..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ticket_delivery_days">Ticket Delivery Days</Label>
            <Input id="ticket_delivery_days" type="number" value={formData.ticket_delivery_days as number || ''} onChange={e => setFormData(prev => ({ ...prev, ticket_delivery_days: e.target.value ? parseInt(e.target.value) : undefined }))} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Options</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!options.video_wall}
                  onChange={e => setFormData(prev => ({ ...prev, options: { ...options, video_wall: e.target.checked } }))}
                />
                Video Wall
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!options.numbered_seating}
                  onChange={e => setFormData(prev => ({ ...prev, options: { ...options, numbered_seating: e.target.checked } }))}
                />
                Numbered Seating
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!options.covered_seating}
                  onChange={e => setFormData(prev => ({ ...prev, options: { ...options, covered_seating: e.target.checked } }))}
                />
                Covered Seating
              </label>
            </div>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Media Files</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedMedia.length > 0 ? (
                selectedMedia.map((img: any) => (
                  <div key={img.id} className="relative group w-24 h-24 border rounded overflow-hidden">
                    <img src={img.thumbnail_url || img.image_url} alt={img.description || ''} className="object-cover w-full h-full" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition"
                      onClick={() => setSelectedMedia(prev => prev.filter((i: any) => i.id !== img.id))}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No media selected</span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMediaSelector(true)}
            >
              {selectedMedia.length > 0 ? 'Edit Media' : 'Select Media'}
            </Button>
            <Dialog open={showMediaSelector} onOpenChange={setShowMediaSelector}>
              <DialogContent className="!max-w-6xl">
                <DialogHeader>
                  <DialogTitle>Select Media Files</DialogTitle>
                </DialogHeader>
                <MediaLibrarySelector
                  selectedItems={selectedMedia}
                  onSelect={item => {
                    setSelectedMedia(prev => {
                      const exists = prev.find((img: any) => img.id === item.id);
                      if (exists) {
                        return prev.filter((img: any) => img.id !== item.id);
                      } else {
                        return [...prev, item];
                      }
                    });
                  }}
                  multiple={true}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() => setShowMediaSelector(false)}
                  >
                    Confirm Selection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <DrawerFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}</Button>
        </DrawerFooter>
      </form>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Venues List */}
      <div className="w-1/4 min-w-[260px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Venues
              <Button size="icon" variant="outline" onClick={() => { setEditingVenue(null); setVenueDrawerOpen(true); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
            <Input placeholder="Search venues..." value={venueSearch} onChange={e => setVenueSearch(e.target.value)} />
          </CardHeader>
          <CardContent className="px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setVenueSortKey('name');
                    setVenueSortDir(venueSortKey === 'name' && venueSortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Name
                      {venueSortKey === 'name' ? (
                        venueSortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setVenueSortKey('city');
                    setVenueSortDir(venueSortKey === 'city' && venueSortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      City
                      {venueSortKey === 'city' ? (
                        venueSortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedVenues.map(venue => (
                  <TableRow key={venue.id} className={selectedVenue?.id === venue.id ? 'bg-muted' : ''}>
                    <TableCell onClick={() => setSelectedVenue(venue)} className="cursor-pointer font-medium">{venue.name}</TableCell>
                    <TableCell>{venue.city || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingVenue(venue); setVenueDrawerOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDeleteVenue(venue)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {/* Ticket Categories Table */}
      <div className="flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Ticket Categories
              <Button size="icon" variant="outline" onClick={() => { setEditingCategory(null); setCategoryDrawerOpen(true); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
            <Input placeholder="Search categories..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)} />
          </CardHeader>
          <CardContent className="px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setCatSortKey('name');
                    setCatSortDir(catSortKey === 'name' && catSortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Name
                      {catSortKey === 'name' ? (
                        catSortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  {!selectedVenue && (
                    <TableHead className="cursor-pointer select-none" onClick={() => {
                      setCatSortKey('venue');
                      setCatSortDir(catSortKey === 'venue' && catSortDir === 'asc' ? 'desc' : 'asc');
                    }}>
                      <span className="inline-flex items-center gap-1">
                        Venue
                        {catSortKey === 'venue' ? (
                          catSortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </span>
                    </TableHead>
                  )}
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setCatSortKey('type');
                    setCatSortDir(catSortKey === 'type' && catSortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Type
                      {catSortKey === 'type' ? (
                        catSortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => {
                    setCatSortKey('delivery');
                    setCatSortDir(catSortKey === 'delivery' && catSortDir === 'asc' ? 'desc' : 'asc');
                  }}>
                    <span className="inline-flex items-center gap-1">
                      Delivery Days
                      {catSortKey === 'delivery' ? (
                        catSortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCategories.map(cat => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.category_name}</TableCell>
                    {!selectedVenue && <TableCell>{venues.find(v => v.id === cat.venue_id)?.name || '-'}</TableCell>}
                    <TableCell>{cat.category_type || '-'}</TableCell>
                    <TableCell>{cat.ticket_delivery_days || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors ${
                                cat.options?.video_wall 
                                  ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15' 
                                  : 'bg-muted/50 text-muted-foreground/50 border-muted/30'
                              }`}>
                                <Monitor className="h-3.5 w-3.5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Video Wall</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors ${
                                cat.options?.numbered_seating 
                                  ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15' 
                                  : 'bg-muted/50 text-muted-foreground/50 border-muted/30'
                              }`}>
                                <Hash className="h-3.5 w-3.5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Numbered Seating</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors ${
                                cat.options?.covered_seating 
                                  ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15' 
                                  : 'bg-muted/50 text-muted-foreground/50 border-muted/30'
                              }`}>
                                <Umbrella className="h-3.5 w-3.5" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Covered Seating</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingCategory(cat); setCategoryDrawerOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDeleteCategory(cat)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {/* Venue Form */}
      <VenueForm
        open={venueDrawerOpen}
        onOpenChange={setVenueDrawerOpen}
        venue={editingVenue || undefined}
        service="inventory"
        showDeleteButton={true}
      />
      {/* Category Drawer */}
      <Drawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen} direction="right">
        <DrawerContent className="!w-[500px] max-w-none">
          <DrawerHeader>
            <DrawerTitle>{editingCategory ? 'Edit Ticket Category' : 'Add New Ticket Category'}</DrawerTitle>
            <DrawerDescription>{editingCategory ? 'Update ticket category information' : 'Create a new ticket category for this venue'}</DrawerDescription>
          </DrawerHeader>
          <CategoryFormDrawer
            category={editingCategory || undefined}
            onSubmit={data => {
              if (editingCategory) {
                updateCategoryMutation.mutate({ id: editingCategory.id, data });
              } else {
                createCategoryMutation.mutate(data);
              }
            }}
            onCancel={() => setCategoryDrawerOpen(false)}
            isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
          />
        </DrawerContent>
      </Drawer>
      {/* Venue Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteVenue} onOpenChange={open => { if (!open) setConfirmDeleteVenue(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Venue</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete the venue "{confirmDeleteVenue?.name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteVenue(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (confirmDeleteVenue) { deleteVenueMutation.mutate(confirmDeleteVenue.id); setConfirmDeleteVenue(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Category Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteCategory} onOpenChange={open => { if (!open) setConfirmDeleteCategory(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket Category</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete the ticket category "{confirmDeleteCategory?.category_name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteCategory(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (confirmDeleteCategory) { deleteCategoryMutation.mutate(confirmDeleteCategory.id); setConfirmDeleteCategory(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 