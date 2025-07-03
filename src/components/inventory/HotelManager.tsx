import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Trash2, Search, Star, Bed, Building, Settings, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { HotelService, type HotelWithRoomCount } from '@/lib/hotelService';
import { HotelFormDrawer } from './HotelFormDrawer';
import { HotelRoomsTable } from './HotelRoomsTable';
import type { Hotel } from '@/lib/hotelService';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Download, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function HotelManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  // Filter state
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  // Sorting state
  const [sortKey, setSortKey] = useState<'name' | 'city' | 'country' | 'room_count'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Derived filter options from hotels data
  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['hotels', search],
    queryFn: () => HotelService.getHotelsWithRoomCounts(search),
  });

  // Derived filter options from hotels data
  const hotelsAny = hotels as any[];

  // Compute unique filter options
  const countries = Array.from(new Set(hotelsAny.map(h => h.country).filter(Boolean)));
  const cities = countryFilter === 'all'
    ? Array.from(new Set(hotelsAny.map(h => h.city).filter(Boolean)))
    : Array.from(new Set(hotelsAny.filter(h => h.country === countryFilter).map(h => h.city).filter(Boolean)));

  // Filter hotels based on filter state
  const filteredHotels = hotelsAny.filter(hotel => {
    if (countryFilter !== 'all' && hotel.country !== countryFilter) return false;
    if (cityFilter !== 'all' && hotel.city !== cityFilter) return false;
    return true;
  });

  // Sort hotels
  const sortedHotels = [...filteredHotels].sort((a, b) => {
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(sortedHotels.length / pageSize);
  const paginatedHotels = sortedHotels.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => HotelService.deleteHotel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      toast.success('Hotel deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete hotel: ${error.message}`);
    },
  });

  const handleViewRooms = (hotel: HotelWithRoomCount) => {
    setSelectedHotel(hotel as Hotel);
  };

  const handleBackToHotels = () => {
    setSelectedHotel(null);
  };

  const [selectedHotels, setSelectedHotels] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Selection logic
  const toggleHotelSelection = (hotelId: string) => {
    setSelectedHotels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hotelId)) {
        newSet.delete(hotelId);
      } else {
        newSet.add(hotelId);
      }
      return newSet;
    });
  };
  const toggleAllHotels = () => {
    if (selectedHotels.size === paginatedHotels.length) {
      setSelectedHotels(new Set());
    } else {
      setSelectedHotels(new Set(paginatedHotels.map(h => h.id)));
    }
  };

  // Export CSV
  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const selectedHotelsData = paginatedHotels.filter(h => selectedHotels.has(h.id));
      const hotelsToExport = selectedHotelsData.length > 0 ? selectedHotelsData : paginatedHotels;
      const csvContent = [
        ['Name', 'City', 'Country', 'Room Count'].join(','),
        ...hotelsToExport.map(hotel => [
          `"${hotel.name || ''}"`,
          `"${hotel.city || ''}"`,
          `"${hotel.country || ''}"`,
          hotel.room_count
        ].join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hotels-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Hotels exported successfully');
    } catch (error) {
      toast.error('Failed to export hotels');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Import CSV logic
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const preview = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        }).filter(row => Object.values(row).some(v => v !== ''));
        setImportPreview(preview);
      } catch (error) {
        toast.error('Failed to parse CSV file');
        console.error('CSV parsing error:', error);
      }
    };
    reader.readAsText(file);
  };
  const importHotels = async () => {
    if (!importFile) return;
    setIsImporting(true);
    try {
      const csv = await importFile.text();
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const hotelsToImport = lines.slice(1)
        .map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        })
        .filter(row => Object.values(row).some(v => v !== ''));
      let successCount = 0;
      let errorCount = 0;
      for (const row of hotelsToImport) {
        try {
          // Only use fields: name, city, country
          const hotelData = {
            name: row['Name'],
            city: row['City'],
            country: row['Country'],
          };
          await HotelService.createHotel(hotelData);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} hotels${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        setImportDialogOpen(false);
        setImportFile(null);
        setImportPreview([]);
      } else {
        toast.error(`Failed to import any hotels. ${errorCount} errors occurred.`);
      }
    } catch (error) {
      toast.error('Failed to import hotels');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'name', 'city', 'country', 'room_count', 'actions'
  ]));
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

  return (
    <>
      {/* Header and Actions Row */}
      {!selectedHotel && (
        <Card className="mt-0">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <CardTitle>Hotels</CardTitle>
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
                      { key: 'name', label: 'Name' },
                      { key: 'city', label: 'City' },
                      { key: 'country', label: 'Country' },
                      { key: 'room_count', label: '# Rooms' },
                      { key: 'address', label: 'Address' },
                      { key: 'phone', label: 'Phone' },
                      { key: 'email', label: 'Email' },
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
                {/* Bulk Actions Bar (to the right of Import, before Add) */}
                {selectedHotels.size > 0 && (
                  <div className="flex items-center gap-3 p-0 bg-transparent shadow-none animate-slide-in-up">
                    <Badge variant="secondary" className="text-xs font-semibold bg-primary-100 text-primary-800 border-primary-200">
                      {selectedHotels.size} selected
                    </Badge>
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
                      onClick={async () => {
                        await Promise.all(Array.from(selectedHotels).map(id => deleteMutation.mutateAsync(id)));
                        setSelectedHotels(new Set());
                      }}
                      className="text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete Selected
                    </Button>
                  </div>
                )}
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-5 w-5" /> Import CSV
                </Button>
                <Button variant="default" onClick={() => setDrawerOpen(true)}>
                  <Plus className="h-5 w-5" /> Add Hotel
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
                      placeholder="Search hotels..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-8 h-8 rounded-md text-sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      setCountryFilter('all');
                      setCityFilter('all');
                      setSearch('');
                    }}
                  >
                    Clear All
                  </Button>
                </div>
                {/* Filters at flex-end */}
                <div className="flex flex-wrap gap-2 items-center justify-end">
                  {/* Country Filter */}
                  <Select
                    value={countryFilter}
                    onValueChange={setCountryFilter}
                  >
                    <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
                      <SelectValue placeholder="All countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All countries</SelectItem>
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* City Filter */}
                  <Select
                    value={cityFilter}
                    onValueChange={setCityFilter}
                  >
                    <SelectTrigger className="h-8 min-w-[110px] text-xs rounded-md">
                      <SelectValue placeholder="All cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All cities</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      {/* Table OUTSIDE Card, like in TicketsManager */}
      {!selectedHotel && (
        <div className="mt-0">
          <Card className="border py-0 mt-4 border-border rounded-2xl shadow-sm overflow-hidden">
          <Table className="">
            <TableHeader className="bg-muted sticky top-0 z-10 border-b border-primary-200">
              <TableRow className="">
                {/* Selection Checkbox */}
                <TableHead className="">
                  <Checkbox
                    checked={selectedHotels.size === paginatedHotels.length && paginatedHotels.length > 0}
                    onCheckedChange={toggleAllHotels}
                    aria-label="Select all hotels"
                  />
                </TableHead>
                {visibleColumns.has('name') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('name');
                      setSortDir(sortKey === 'name' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Name
                      {sortKey === 'name' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('city') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('city');
                      setSortDir(sortKey === 'city' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      City
                      {sortKey === 'city' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('country') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('country');
                      setSortDir(sortKey === 'country' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      Country
                      {sortKey === 'country' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('room_count') && (
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => {
                      setSortKey('room_count');
                      setSortDir(sortKey === 'room_count' && sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      # Rooms
                      {sortKey === 'room_count' ? (
                        sortDir === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </span>
                  </TableHead>
                )}
                {visibleColumns.has('address') && (
                  <TableHead className="font-medium">Address</TableHead>
                )}
                {visibleColumns.has('phone') && (
                  <TableHead className="font-medium">Phone</TableHead>
                )}
                {visibleColumns.has('email') && (
                  <TableHead className="font-medium">Email</TableHead>
                )}
                {visibleColumns.has('actions') && (
                  <TableHead className="text-right font-medium">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={1 + Array.from(visibleColumns).length} className="text-center py-12 text-muted-foreground bg-muted/10 border-b border-border/30">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : paginatedHotels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={1 + Array.from(visibleColumns).length} className="text-center py-12 text-muted-foreground bg-muted/10 border-b border-border/30">
                    <div className="flex flex-col items-center gap-2">
                      <Building className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-sm font-medium">No hotels found</span>
                      <span className="text-xs text-muted-foreground/70">Try adjusting your filters or add a new hotel</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedHotels.map((hotel: any, index: number) => (
                <TableRow
                  key={hotel.id}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    selectedHotels.has(hotel.id)
                      ? 'bg-primary-50/20 border-primary-200'
                      : index % 2 === 0
                        ? 'bg-card'
                        : 'bg-muted/20'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <TableCell className="border-r border-border/30 bg-muted/10">
                    <Checkbox
                      checked={selectedHotels.has(hotel.id)}
                      onCheckedChange={() => toggleHotelSelection(hotel.id)}
                      aria-label={`Select hotel ${hotel.id}`}
                    />
                  </TableCell>
                  {visibleColumns.has('name') && (
                    <TableCell className="font-medium">{hotel.name}</TableCell>
                  )}
                  {visibleColumns.has('city') && (
                    <TableCell>{hotel.city}</TableCell>
                  )}
                  {visibleColumns.has('country') && (
                    <TableCell>{hotel.country}</TableCell>
                  )}
                  {visibleColumns.has('room_count') && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{hotel.room_count}</span>
                        <Bed className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.has('address') && (
                    <TableCell>{hotel.address || ''}</TableCell>
                  )}
                  {visibleColumns.has('phone') && (
                    <TableCell>{hotel.phone || ''}</TableCell>
                  )}
                  {visibleColumns.has('email') && (
                    <TableCell>{hotel.contact_email || ''}</TableCell>
                  )}
                  {visibleColumns.has('actions') && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleViewRooms(hotel)}
                          title="View Rooms"
                        >
                          <Bed className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => { setEditingHotel(hotel); setDrawerOpen(true); }}
                          title="Edit Hotel"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" title="Delete Hotel">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Hotel</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{hotel.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(hotel.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </Card>
          {/* Pagination */}
          <div className="flex justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
          {/* Import CSV Dialog */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Import Hotels from CSV</DialogTitle>
                <div className="text-sm text-muted-foreground">
                  Upload a CSV file with hotel data. The file should include headers: Name, City, Country
                </div>
              </DialogHeader>
              <div className="space-y-6">
                {/* File Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="flex-1"
                    />
                    {importFile && (
                      <Badge variant="secondary" className="text-xs">
                        {importFile.name}
                      </Badge>
                    )}
                  </div>
                  {/* Preview */}
                  {importPreview.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Preview (first 5 rows):</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(importPreview[0] || {}).map(header => (
                                <TableHead key={header} className="text-xs">
                                  {header}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importPreview.map((row, index) => (
                              <TableRow key={index}>
                                {Object.values(row).map((value, cellIndex) => (
                                  <TableCell key={cellIndex} className="text-xs">
                                    {String(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setImportDialogOpen(false);
                  setImportFile(null);
                  setImportPreview([]);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={importHotels}
                  disabled={!importFile || isImporting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isImporting ? 'Importing...' : 'Import Hotels'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {/* Hotel Rooms Table (when a hotel is selected) */}
      {selectedHotel && (
        <CardContent className='p-0'>
          <HotelRoomsTable hotelId={selectedHotel.id} hotelName={selectedHotel.name} onBack={handleBackToHotels} />
        </CardContent>
      )}

      {/* Hotel Form Drawer */}
      <HotelFormDrawer
        hotel={editingHotel}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingHotel(null);
        }}
      />
    </>
  );
} 