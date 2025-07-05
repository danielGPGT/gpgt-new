import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Hotel, Star, Users, Calendar as CalendarIcon, BedDouble, Plus, Minus } from 'lucide-react';

// Dummy data structure for now
const DUMMY_HOTELS = [
  {
    id: 'hotel1',
    name: 'Grand Palace Hotel',
    brand: 'LuxuryStay',
    star_rating: 5,
    address: '123 Main St',
    city: 'London',
    country: 'UK',
    description: 'A beautiful luxury hotel in the heart of the city.',
    images: [
      '/hotel1-1.jpg',
      '/hotel1-2.jpg',
      '/hotel1-3.jpg',
    ],
    amenities: ['Free WiFi', 'Pool', 'Spa', 'Gym', 'Bar', 'Restaurant'],
    check_in_time: '15:00',
    check_out_time: '11:00',
    room_types: [
      {
        id: 'room1',
        name: 'Deluxe Double Room',
        max_people: 2,
        description: 'Spacious room with city view, king bed, and luxury bathroom.',
        price_per_stay: 1200,
        price_per_night: 400,
        extra_night_price: 450,
        images: ['/room1-1.jpg', '/room1-2.jpg'],
        available: 5,
        amenities: ['King Bed', 'Ensuite Bathroom', 'Balcony', 'Coffee Maker'],
      },
      {
        id: 'room2',
        name: 'Family Suite',
        max_people: 3,
        description: 'Suite with two bedrooms, living area, and kitchenette.',
        price_per_stay: 1800,
        price_per_night: 600,
        extra_night_price: 650,
        images: ['/room2-1.jpg', '/room2-2.jpg'],
        available: 2,
        amenities: ['2 Bedrooms', 'Kitchenette', 'Living Area', 'Sofa Bed'],
      },
    ],
  },
];

export function StepHotelRooms({ setCurrentStep, currentStep }: { setCurrentStep: (step: number) => void; currentStep: number }) {
  const { watch, setValue } = useFormContext();
  const adults = watch('travelers.adults') || 1;
  // For demo, use dummy data
  const [selectedRooms, setSelectedRooms] = useState([
    { hotelId: 'hotel1', roomTypeId: 'room1', quantity: 1, checkIn: '2024-07-01', checkOut: '2024-07-04' },
  ]);

  // Calculate nights
  function getNights(checkIn: string, checkOut: string) {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    return Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // UI for each hotel room card
  function RoomCard({ hotel, room, selected, onChange }: any) {
    const nights = getNights(selected.checkIn, selected.checkOut);
    const baseNights = 3; // For demo, assume 3 nights is base
    const extraNights = Math.max(0, nights - baseNights);
    const basePrice = room.price_per_stay;
    const extraNightPrice = room.extra_night_price;
    const total = basePrice + extraNights * extraNightPrice;
    return (
      <Card className="mb-8 bg-[var(--color-card)]/95 border border-[var(--color-border)] shadow-lg rounded-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Images Carousel */}
          <div className="md:w-1/3 w-full bg-black/10">
            <Carousel>
              <CarouselContent>
                {room.images.map((img: string, idx: number) => (
                  <CarouselItem key={idx}>
                    <img src={img} alt={room.name} className="w-full h-56 object-cover rounded-none md:rounded-l-2xl" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
          {/* Info & Controls */}
          <div className="flex-1 p-6 flex flex-col gap-4">
            {/* Hotel Info */}
            <div className="flex items-center gap-3 mb-2">
              <Hotel className="h-6 w-6 text-[var(--color-primary-600)]" />
              <div>
                <div className="font-bold text-lg text-[var(--color-foreground)]">{hotel.name}</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">{hotel.brand} • {hotel.city}, {hotel.country}</div>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(hotel.star_rating)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400" />)}
                </div>
              </div>
            </div>
            {/* Room Info */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <div className="flex-1">
                <div className="font-semibold text-base text-[var(--color-foreground)]">{room.name}</div>
                <div className="text-xs text-[var(--color-muted-foreground)] mb-1">Max {room.max_people} people</div>
                <div className="text-sm text-[var(--color-muted-foreground)] mb-2">{room.description}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {room.amenities.map((a: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
                  ))}
                </div>
              </div>
              {/* Dates */}
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold mb-1">Check-in</Label>
                <Input type="date" value={selected.checkIn} onChange={e => onChange({ ...selected, checkIn: e.target.value })} className="mb-2" />
                <Label className="text-xs font-semibold mb-1">Check-out</Label>
                <Input type="date" value={selected.checkOut} onChange={e => onChange({ ...selected, checkOut: e.target.value })} />
              </div>
              {/* Quantity */}
              <div className="flex flex-col items-end gap-1">
                <Label className="text-xs font-semibold mb-1">Rooms</Label>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onChange({ ...selected, quantity: Math.max(1, selected.quantity - 1) })} disabled={selected.quantity <= 1}>-</Button>
                  <Input type="number" min={1} max={room.available} value={selected.quantity} onChange={e => onChange({ ...selected, quantity: Math.max(1, Math.min(room.available, parseInt(e.target.value) || 1)) })} className="w-14 text-center" />
                  <Button size="sm" variant="outline" onClick={() => onChange({ ...selected, quantity: Math.min(room.available, selected.quantity + 1) })} disabled={selected.quantity >= room.available}>+</Button>
                </div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Available: {room.available}</div>
              </div>
            </div>
            {/* Price Breakdown */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 mt-2">
              <div className="flex-1">
                <div className="text-xs text-[var(--color-muted-foreground)]">Base stay ({baseNights} nights):</div>
                <div className="font-bold text-lg text-[var(--color-primary)]">£{basePrice.toLocaleString()}</div>
                {extraNights > 0 && (
                  <div className="text-xs text-[var(--color-muted-foreground)]">Extra nights ({extraNights}): £{(extraNightPrice * extraNights).toLocaleString()}</div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xs text-[var(--color-muted-foreground)]">Total for this room</div>
                <div className="text-2xl font-extrabold text-[var(--color-primary)]">£{total.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Main render
  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">Select Your Hotel Rooms</h3>
      {selectedRooms.map((sel, idx) => {
        const hotel = DUMMY_HOTELS.find(h => h.id === sel.hotelId);
        const room = hotel?.room_types.find((r: any) => r.id === sel.roomTypeId);
        if (!hotel || !room) return null;
        return (
          <RoomCard
            key={sel.hotelId + sel.roomTypeId}
            hotel={hotel}
            room={room}
            selected={sel}
            onChange={updated => {
              const newRooms = [...selectedRooms];
              newRooms[idx] = updated;
              setSelectedRooms(newRooms);
            }}
          />
        );
      })}
      {/* Add another room type (demo: just add the other room) */}
      {selectedRooms.length < DUMMY_HOTELS[0].room_types.length && (
        <Button
          variant="outline"
          onClick={() => {
            const nextRoom = DUMMY_HOTELS[0].room_types.find((r: any) => !selectedRooms.some(sel => sel.roomTypeId === r.id));
            if (!nextRoom) return;
            setSelectedRooms([...selectedRooms, { hotelId: 'hotel1', roomTypeId: nextRoom.id, quantity: 1, checkIn: '2024-07-01', checkOut: '2024-07-04' }]);
          }}
          className="rounded-xl px-5 py-2"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Another Room Type
        </Button>
      )}
    </div>
  );
} 