import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Trash2, Search, Star, Bed, Building } from 'lucide-react';
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

export default function HotelManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);


  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['hotels', search],
    queryFn: () => HotelService.getHotelsWithRoomCounts(search),
  });

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

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold">
            {selectedHotel ? `${selectedHotel.name} - Rooms` : 'Hotels'}
          </CardTitle>
          <p className="text-muted-foreground">
            {selectedHotel ? 'Manage hotel rooms' : 'Manage hotel inventory'}
          </p>
        </div>
        {selectedHotel && (
          <Button variant="outline" onClick={handleBackToHotels}>
            <Building className="w-4 h-4 mr-2" /> Back to Hotels
          </Button>
        )}
        {!selectedHotel && (
          <Button variant="default" onClick={() => setDrawerOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Hotel
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {selectedHotel ? (
          <HotelRoomsTable hotelId={selectedHotel.id} hotelName={selectedHotel.name} />
        ) : (
          <div className="mt-6">
            <div className="flex items-center mb-4 gap-2">
              <Input
                placeholder="Search hotels..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead># Rooms</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                ) : hotels.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>No hotels found</TableCell></TableRow>
                ) : hotels.map((hotel: HotelWithRoomCount) => (
                  <TableRow key={hotel.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{hotel.name}</div>
                        {hotel.brand && (
                          <div className="text-sm text-muted-foreground">{hotel.brand}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{hotel.city}</TableCell>
                    <TableCell>{hotel.country}</TableCell>
                    <TableCell>
                      {hotel.star_rating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{hotel.star_rating}</span>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{hotel.room_count}</span>
                        <Bed className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="flex gap-2">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <HotelFormDrawer
        hotel={editingHotel}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingHotel(null);
        }}
      />
    </Card>
  );
} 