import { useFormContext } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { HotelImageCarousel } from '@/components/ui/carousel';
import { 
  Hotel, 
  Star, 
  MapPin, 
  Users, 
  CreditCard, 
  Wifi, 
  Waves, 
  Utensils, 
  Heart,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  SkipForward,
  Bed,
  Calendar,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { rateHawkService, type RateHawkSearchResponse, type RateHawkHotelWithRooms } from '@/lib/api/ratehawk';
import { toast } from 'sonner';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { formatCurrency } from '@/lib/utils';

interface StepHotelSelectionProps {
  shouldSearch?: boolean;
  onSearchComplete?: () => void;
}

export function StepHotelSelection({ shouldSearch = false, onSearchComplete }: StepHotelSelectionProps) {
  console.log('🏨 StepHotelSelection component rendering...');
  
  const form = useFormContext();
  const [hotels, setHotels] = useState<RateHawkSearchResponse | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipHotelSelection, setSkipHotelSelection] = useState(false);
  const [selectedHotelForRooms, setSelectedHotelForRooms] = useState<RateHawkHotelWithRooms | null>(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);

  // Get form values
  const destination = form.watch('destinations.primary');
  const startDate = form.watch('travelerInfo.startDate');
  const endDate = form.watch('travelerInfo.endDate');
  const adults = form.watch('travelerInfo.travelers.adults');
  const children = form.watch('travelerInfo.travelers.children');
  const currency = form.watch('budget.currency');

  console.log('📋 Form values:', { destination, startDate, endDate, adults, children, currency, skipHotelSelection });

  // Search hotels when shouldSearch prop changes to true
  useEffect(() => {
    if (shouldSearch) {
      searchHotels();
    }
  }, [shouldSearch]);

  // Watch form values for debugging
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      console.log('📝 Form field changed:', name, value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const searchHotels = async () => {
    if (!shouldSearch) return;
    
    console.log('🔍 searchHotels called with shouldSearch:', shouldSearch);
    
    const destination = form.watch('destinations.primary');
    const startDate = form.watch('travelerInfo.startDate');
    const endDate = form.watch('travelerInfo.endDate');
    const adults = form.watch('travelerInfo.travelers.adults');

    if (!destination || !startDate || !endDate) {
      toast.error('Please fill in destination, start date, and end date');
      onSearchComplete?.();
      return;
    }

    setLoading(true);
    setHotels(null);

    try {
      console.log('🔍 Searching hotels with params:', { destination, startDate, endDate, adults });
      
      const result = await rateHawkService.searchHotels({
        destination,
        checkIn: startDate,
        checkOut: endDate,
        adults,
        currency: 'USD',
        language: 'en'
      });

      console.log('✅ Hotel search successful:', result);
      setHotels(result);
      toast.success(`Found ${result.hotels.length} hotels`);
    } catch (error) {
      console.error('❌ Hotel search failed:', error);
      toast.error('Failed to search hotels. Please try again.');
    } finally {
      setLoading(false);
      onSearchComplete?.();
    }
  };

  const handleHotelSelection = (hotel: RateHawkHotelWithRooms, roomId: string) => {
    const selectedRoom = hotel.rooms.find(room => room.id === roomId);
    if (!selectedRoom) return;

    const selectedHotel = {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        rating: hotel.rating,
        stars: hotel.stars,
        address: hotel.address,
        location: hotel.location,
        images: hotel.images,
        amenities: hotel.amenities,
        description: hotel.description,
      },
      room: selectedRoom,
      selectedAt: new Date().toISOString(),
    };

    form.setValue('hotelSelection.selectedHotel', selectedHotel);
    form.setValue('hotelSelection.skipHotelSelection', false);
    setIsRoomDialogOpen(false);
    toast.success(`Selected ${hotel.name} - ${selectedRoom.name}`);
  };

  const openRoomDialog = (hotel: RateHawkHotelWithRooms) => {
    setSelectedHotelForRooms(hotel);
    setIsRoomDialogOpen(true);
  };

  const handleSkipHotelSelection = (skip: boolean) => {
    setSkipHotelSelection(skip);
    form.setValue('hotelSelection.skipHotelSelection', skip);
    if (skip) {
      form.setValue('hotelSelection.selectedHotel', undefined);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityMap: Record<string, any> = {
      'WiFi': Wifi,
      'Internet access': Wifi,
      'Free Wi-Fi': Wifi,
      'Pool': Waves,
      'Swimming pool': Waves,
      'Spa': Heart,
      'Restaurant': Utensils,
      'Gym': Users,
      'Fitness facilities': Users,
      '24-hour reception': Users,
      'Early check-in': Users,
      'Late check-out': Users,
      'Concierge services': Users,
      'Bar': Utensils,
      'Breakfast': Utensils,
      'Parking': CreditCard,
      'Parking nearby': CreditCard,
      'Free parking': CreditCard,
      'Spa tub': Waves,
      'Sauna': Heart,
      'Fitness': Users,
      'Golf': Users,
      'Kitchen': Utensils,
      'Private bathroom': Users,
      'Shared bathroom': Users,
      'TV': CreditCard,
      'Telephone': CreditCard,
      'Safe': CreditCard,
      'Air conditioning': Wifi,
      'Heating': Wifi,
      'Pets allowed': Heart,
      'Pet friendly': Heart,
      'Business center': Users,
      'Meeting rooms': Users,
      'Conference facilities': Users,
      'Laundry service': Users,
      'Dry cleaning': Users,
      'Room service': Utensils,
      'Airport shuttle': Users,
      'Shuttle service': Users,
      'Beach access': Waves,
      'Private beach': Waves,
      'Tennis court': Users,
      'Bicycle rental': Users,
      'Car rental': Users,
      'Tour desk': Users,
      'Currency exchange': CreditCard,
      'ATM': CreditCard,
      'Gift shop': CreditCard,
      'Beauty salon': Heart,
      'Hair salon': Heart,
      'Massage': Heart,
      'Steam room': Heart,
      'Hot tub': Waves,
      'Jacuzzi': Waves,
      'Outdoor pool': Waves,
      'Indoor pool': Waves,
      'Children\'s pool': Waves,
      'Kids club': Users,
      'Playground': Users,
      'Babysitting': Users,
      'High chair': Users,
      'Crib': Users,
      'Accessibility features': Users,
      'Wheelchair accessible': Users,
      'Elevator': Users,
      'Lift': Users,
      'Balcony': Users,
      'Terrace': Users,
      'Garden': Heart,
      'Outdoor seating': Utensils,
      'Rooftop terrace': Users,
      'Sun terrace': Users,
      'BBQ facilities': Utensils,
      'Picnic area': Utensils,
      'Fireplace': Wifi,
      'Minibar': Utensils,
      'Coffee maker': Utensils,
      'Kettle': Utensils,
      'Microwave': Utensils,
      'Refrigerator': Utensils,
      'Dishwasher': Utensils,
      'Washing machine': Users,
      'Dryer': Users,
      'Iron': Users,
      'Ironing board': Users,
      'Hair dryer': Users,
      'Bathrobe': Users,
      'Slippers': Users,
      'Toiletries': Users,
      'Towels': Users,
      'Linen': Users,
      'Extra long beds': Users,
      'King bed': Users,
      'Queen bed': Users,
      'Double bed': Users,
      'Single bed': Users,
      'Sofa bed': Users,
      'Rollaway bed': Users,
      'Cable TV': CreditCard,
      'Satellite TV': CreditCard,
      'Flat-screen TV': CreditCard,
      'DVD player': CreditCard,
      'iPod dock': CreditCard,
      'Alarm clock': CreditCard,
      'Desk': Users,
      'Work desk': Users,
      'Office chair': Users,
      'Laptop safe': CreditCard,
      'In-room safe': CreditCard,
      'Climate control': Wifi,
      'Fan': Wifi,
      'Ceiling fan': Wifi,
      'Soundproofing': Users,
      'Blackout curtains': Users,
      'City view': Users,
      'Mountain view': Users,
      'Ocean view': Users,
      'Garden view': Users,
      'Pool view': Users,
      'Street view': Users,
      'Interconnecting rooms': Users,
      'Adjoining rooms': Users,
      'Non-smoking': Users,
      'Smoking allowed': Users,
      'Allergy-free room': Users,
      'Hypoallergenic': Users,
      'Low-allergen room': Users,
    };
    
    // Try exact match first
    if (amenityMap[amenity]) {
      return amenityMap[amenity];
    }
    
    // Try partial matches
    const lowerAmenity = amenity.toLowerCase();
    for (const [key, icon] of Object.entries(amenityMap)) {
      if (lowerAmenity.includes(key.toLowerCase())) {
        return icon;
      }
    }
    
    return Hotel;
  };

  const formatPrice = (amount: number, currency: string) => {
    return formatCurrency(amount, currency);
  };

  const renderStars = (stars: number) => {
    // Ensure stars is a valid number between 0 and 5
    const validStars = Math.max(0, Math.min(5, Math.round(stars || 0)));
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4 transition-colors',
              i < validStars 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'fill-gray-200 text-gray-300'
            )}
          />
        ))}
        <span className="text-sm font-medium text-muted-foreground ml-1">
          ({validStars}/5)
        </span>
      </div>
    );
  };

  if (skipHotelSelection) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Hotel Selection</h3>
          <div className="flex items-center space-x-2">
            <Switch
              checked={skipHotelSelection}
              onCheckedChange={handleSkipHotelSelection}
            />
            <Label>Skip hotel selection</Label>
          </div>
        </div>
        
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <SkipForward className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Hotel selection skipped. You can add hotels later in the itinerary.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Select Your Hotel</h3>
        <div className="flex items-center space-x-2">
          <Switch
            checked={skipHotelSelection}
            onCheckedChange={handleSkipHotelSelection}
          />
          <Label>Skip hotel selection</Label>
        </div>
      </div>

      {/* Search Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>
              Searching for hotels in <strong>{destination}</strong> from{' '}
              <strong>{new Date(startDate).toLocaleDateString()}</strong> to{' '}
              <strong>{new Date(endDate).toLocaleDateString()}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-24 w-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-800 mb-2">Search Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={searchHotels} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                <Search className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotel Search Results */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex gap-4">
                  <Skeleton className="h-32 w-32 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-14" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hotels && hotels.hotels && hotels.hotels.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold">Found {hotels.hotels.length} hotels</h4>
              <p className="text-sm text-muted-foreground">Select your preferred accommodation</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {hotels.hotels.length} options
            </Badge>
          </div>
          
          {hotels.hotels.map((hotel, index) => (
            <Card key={hotel.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-muted/50">
              <CardHeader className="pb-6">
                <div className="flex gap-6">
                  {/* Hotel Image Gallery */}
                  <div className="relative flex-shrink-0">
                    <HotelImageCarousel
                      images={hotel.images}
                      alt={hotel.name}
                      className="w-40"
                      maxHeight="h-40"
                      showLightbox={true}
                    />
                    
                    {/* Star rating badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-background/90 text-foreground font-semibold shadow-lg border-border">
                        {hotel.stars || 3}★
                      </Badge>
                    </div>
                    
                    {/* Status badges */}
                    <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1">
                      {hotel.isClosed && (
                        <Badge className="bg-destructive text-destructive-foreground text-xs shadow-lg">
                          Closed
                        </Badge>
                      )}
                      {hotel.is_fallback && (
                        <Badge className="bg-amber-500 text-white text-xs shadow-lg">
                          Basic Info
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                          {hotel.name}
                        </CardTitle>
                        
                        {/* Rating and badges */}
                        <div className="flex items-center gap-4 mb-4">
                          {renderStars(hotel.stars)}
                          
                          <div className="flex gap-2">
                            {hotel.hotelChain && hotel.hotelChain !== 'No chain' && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                {hotel.hotelChain}
                              </Badge>
                            )}
                            
                            {hotel.kind && (
                              <Badge variant="secondary" className="text-xs bg-secondary/10 text-secondary-foreground border-secondary/20">
                                {hotel.kind}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick price preview */}
                      {hotel.rooms && hotel.rooms.length > 0 && (
                        <div className="text-right ml-4">
                          <div className="text-sm text-muted-foreground font-medium">From</div>
                          <div className="text-3xl font-bold text-primary">
                            {formatPrice(
                              Math.min(...hotel.rooms.map(r => r.price.amount)),
                              hotel.rooms[0].price.currency
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">per night</div>
                        </div>
                      )}
                    </div>

                    {/* Location and contact */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-foreground font-medium">
                          {hotel.address.street && `${hotel.address.street}, `}
                          {hotel.address.city}, {hotel.address.country}
                          {hotel.address.zip && ` ${hotel.address.zip}`}
                        </span>
                      </div>
                      
                      {hotel.location && hotel.location.latitude && hotel.location.longitude && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>📍 {hotel.location.latitude.toFixed(4)}, {hotel.location.longitude.toFixed(4)}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {hotel.phone && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {hotel.phone}
                          </span>
                        )}
                        {hotel.email && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {hotel.email}
                          </span>
                        )}
                        {hotel.checkInTime && (
                          <span>🕐 Check-in: {hotel.checkInTime}</span>
                        )}
                        {hotel.checkOutTime && (
                          <span>🕐 Check-out: {hotel.checkOutTime}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Payment Methods */}
                    {hotel.paymentMethods && hotel.paymentMethods.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Payment Methods</div>
                        <div className="flex gap-2 flex-wrap">
                          {hotel.paymentMethods.slice(0, 6).map((method) => (
                            <Badge key={method} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                              {method.toUpperCase()}
                            </Badge>
                          ))}
                          {hotel.paymentMethods.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{hotel.paymentMethods.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Amenities */}
                    {hotel.amenities && hotel.amenities.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Amenities</div>
                        <div className="flex gap-2 flex-wrap">
                          {hotel.amenities.slice(0, 8).map((amenity) => {
                            const Icon = getAmenityIcon(amenity);
                            return (
                              <Badge key={amenity} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                <Icon className="h-3 w-3 mr-1" />
                                {amenity}
                              </Badge>
                            );
                          })}
                          {hotel.amenities.length > 8 && (
                            <Badge variant="outline" className="text-xs">
                              +{hotel.amenities.length - 8} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">Available Rooms</span>
                    <Badge variant="secondary" className="text-xs bg-primary text-primary-foreground">
                      {hotel.rooms.length} options
                    </Badge>
                    {hotel.rooms.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        from {formatPrice(
                          Math.min(...hotel.rooms.map(r => r.price.amount)),
                          hotel.rooms[0].price.currency
                        )}
                      </span>
                    )}
                  </div>
                  
                  <Dialog open={isRoomDialogOpen && selectedHotelForRooms?.id === hotel.id} onOpenChange={(open) => {
                    if (!open) {
                      setIsRoomDialogOpen(false);
                      setSelectedHotelForRooms(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openRoomDialog(hotel);
                        }}
                        className="bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 border-primary/20"
                      >
                        <Bed className="h-4 w-4 mr-2" />
                        View Rooms
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="!w-[95vw] !max-w-[1400px] !sm:max-w-[1400px] max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={hotel.images[0]} 
                              alt={hotel.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-xl">{hotel.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <MapPin className="h-3 w-3" />
                              {hotel.address.city}, {hotel.address.country}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {renderStars(hotel.stars)}
                              <span className="text-sm text-muted-foreground">• {hotel.rooms.length} room types available</span>
                            </div>
                          </div>
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                          Select a room for {hotel.name}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {hotel.rooms.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h4 className="font-medium mb-2">No rooms available</h4>
                            <p>No rooms are available for the selected dates</p>
                          </div>
                        ) : (
                          <RadioGroup
                            value={form.watch('hotelSelection.selectedHotel')?.hotel.id === hotel.id 
                              ? form.watch('hotelSelection.selectedHotel')?.room.id 
                              : undefined}
                            onValueChange={(roomId) => handleHotelSelection(hotel, roomId)}
                          >
                            <Carousel
                              opts={{
                                align: "start",
                                loop: false,
                                slidesToScroll: 3,
                              }}
                              className="w-full"
                            >
                              <CarouselContent>
                                {/* Group rooms into sets of 3 for each carousel slide */}
                                {Array.from({ length: Math.ceil(hotel.rooms.length / 3) }, (_, slideIndex) => (
                                  <CarouselItem key={slideIndex} className="basis-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                                      {hotel.rooms.slice(slideIndex * 3, (slideIndex + 1) * 3).map((room) => (
                                        <div key={room.id} className="relative">
                                          <RadioGroupItem
                                            value={room.id}
                                            id={room.id}
                                            className="sr-only"
                                          />
                                          <Label htmlFor={room.id} className="cursor-pointer w-full">
                                            <Card className="group pt-0 pb-0 overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-muted/50 hover:from-background hover:to-primary/5 h-full">
                                              <CardContent className="p-0 h-full flex flex-col">
                                                {/* Room Image - Square aspect ratio */}
                                                <div className="relative w-full aspect-square">
                                                  {room.images && room.images.length > 0 ? (
                                                    <div className="relative h-full">
                                                      <HotelImageCarousel
                                                        images={room.images}
                                                        alt={room.name}
                                                        className="w-full h-full"
                                                        maxHeight="h-full"
                                                        showLightbox={true}
                                                      />
                                                      
                                                      {/* Price Badge Overlay */}
                                                      <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border">
                                                        <div className="text-lg font-bold text-primary">
                                                          {formatPrice(room.price.amount, room.price.currency)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">per night</div>
                                                      </div>
                                                      
                                                      {/* Image Counter */}
                                                      {room.images.length > 1 && (
                                                        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-full shadow-lg border border-border">
                                                          {room.images.length} photos
                                                        </div>
                                                      )}
                                                    </div>
                                                  ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                                      <div className="text-center">
                                                        <Bed className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                                        <p className="text-xs text-muted-foreground">No room image</p>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                                
                                                {/* Room Details - Content below image */}
                                                <div className="flex-1 p-3 flex flex-col">
                                                  {/* Header */}
                                                  <div className="mb-3">
                                                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors mb-1">
                                                      {room.name}
                                                    </h4>
                                                    {room.description && (
                                                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                        {room.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                  
                                                  {/* Status Badges */}
                                                  <div className="flex gap-1 mb-3">
                                                    {room.refundable && (
                                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                                                        Free Cancellation
                                                      </Badge>
                                                    )}
                                                    {room.available && (
                                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                                                        Available
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  
                                                  {/* Room Features Grid */}
                                                  <div className="grid grid-cols-2 gap-2 mb-3">
                                                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/50">
                                                      <div className="p-1.5 bg-primary/10 rounded-lg">
                                                        <Users className="h-3 w-3 text-primary" />
                                                      </div>
                                                      <div>
                                                        <div className="font-semibold text-xs">{room.capacity?.adults || 2} adults</div>
                                                        {room.capacity?.children > 0 && (
                                                          <div className="text-xs text-muted-foreground">{room.capacity.children} children</div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    
                                                    {room.boardType && (
                                                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/50">
                                                        <div className="p-1.5 bg-primary/10 rounded-lg">
                                                          <Utensils className="h-3 w-3 text-primary" />
                                                        </div>
                                                        <div>
                                                          <div className="font-semibold text-xs">{room.boardType}</div>
                                                          <div className="text-xs text-muted-foreground">Meal plan</div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                  
                                                  {/* Room Amenities */}
                                                  {room.amenities && room.amenities.length > 0 && (
                                                    <div className="mb-3 flex-1">
                                                      <div className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide text-primary/70">Room Features</div>
                                                      <div className="flex gap-1 flex-wrap">
                                                        {room.amenities.slice(0, 3).map((amenity) => (
                                                          <Badge key={amenity} variant="secondary" className="text-xs bg-secondary/30 text-secondary-foreground px-2 py-1 border border-border/50">
                                                            {amenity}
                                                          </Badge>
                                                        ))}
                                                        {room.amenities.length > 3 && (
                                                          <Badge variant="outline" className="text-xs px-2 py-1">
                                                            +{room.amenities.length - 3} more
                                                          </Badge>
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                                  
                                                  {/* Price Details - Always visible */}
                                                  <div className="mt-auto pt-3 border-t border-border/50">
                                                    <div className="flex items-center justify-between">
                                                      <div className="text-right">
                                                        {room.price.originalAmount && room.price.originalAmount > room.price.amount && (
                                                          <div className="text-xs text-muted-foreground line-through mb-1">
                                                            {formatPrice(room.price.originalAmount, room.price.currency)}
                                                          </div>
                                                        )}
                                                        <div className="text-xl font-bold text-primary">
                                                          {formatPrice(room.price.amount, room.price.currency)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground font-medium">per night</div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                            
                                            {/* Selection Indicator */}
                                            {form.watch('hotelSelection.selectedHotel')?.room.id === room.id && (
                                              <div className="absolute top-3 right-3 z-10">
                                                <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                                                  <CheckCircle className="h-4 w-4" />
                                                </div>
                                              </div>
                                            )}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </CarouselItem>
                                ))}
                              </CarouselContent>
                              <CarouselPrevious className="left-4" />
                              <CarouselNext className="right-4" />
                            </Carousel>
                          </RadioGroup>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hotels && hotels.hotels && hotels.hotels.length === 0 ? (
        <div className="text-center py-12">
          <Hotel className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No hotels found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search criteria or dates
          </p>
          <Button onClick={searchHotels} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search Again
          </Button>
        </div>
      ) : null}

      {/* Selected Hotel Summary */}
      {form.watch('hotelSelection.selectedHotel') && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="font-medium text-primary">Hotel Selected</span>
            </div>
            
            <div className="flex gap-4">
              {/* Hotel Image */}
              <div className="relative">
                <img
                  src={form.watch('hotelSelection.selectedHotel.hotel.images[0]')}
                  alt={form.watch('hotelSelection.selectedHotel.hotel.name')}
                  className="h-20 w-20 object-cover rounded-lg"
                  onError={(e) => {
                    const hotel = form.watch('hotelSelection.selectedHotel.hotel');
                    const currentIndex = hotel.images.indexOf(e.currentTarget.src);
                    if (currentIndex < hotel.images.length - 1) {
                      e.currentTarget.src = hotel.images[currentIndex + 1];
                    } else {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
                    }
                  }}
                />
                <Badge className="absolute -top-1 -right-1 bg-primary text-white text-xs">
                  {form.watch('hotelSelection.selectedHotel.hotel.stars')}★
                </Badge>
              </div>
              
              {/* Hotel Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {form.watch('hotelSelection.selectedHotel.hotel.name')}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {form.watch('hotelSelection.selectedHotel.hotel.address.city')}, 
                        {form.watch('hotelSelection.selectedHotel.hotel.address.country')}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      form.setValue('hotelSelection.selectedHotel', undefined);
                    }}
                  >
                    Change
                  </Button>
                </div>
                
                {/* Room Details */}
                <div className="bg-white rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-sm">
                        {form.watch('hotelSelection.selectedHotel.room.name')}
                      </h5>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Users className="h-3 w-3" />
                        <span>
                          {form.watch('hotelSelection.selectedHotel.room.capacity?.adults') || 2} adults, 
                          {form.watch('hotelSelection.selectedHotel.room.capacity?.children') || 0} children
                        </span>
                        {form.watch('hotelSelection.selectedHotel.room.boardType') && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {form.watch('hotelSelection.selectedHotel.room.boardType')}
                            </Badge>
                          </>
                        )}
                        {form.watch('hotelSelection.selectedHotel.room.refundable') && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Refundable
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg text-primary">
                        {formatPrice(
                          form.watch('hotelSelection.selectedHotel.room.price.amount'),
                          form.watch('hotelSelection.selectedHotel.room.price.currency')
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">per night</div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Amenities Preview */}
                {form.watch('hotelSelection.selectedHotel.hotel.amenities') && 
                 form.watch('hotelSelection.selectedHotel.hotel.amenities').length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {form.watch('hotelSelection.selectedHotel.hotel.amenities').slice(0, 6).map((amenity) => {
                      const Icon = getAmenityIcon(amenity);
                      return (
                        <Badge key={amenity} variant="secondary" className="text-xs">
                          <Icon className="h-3 w-3 mr-1" />
                          {amenity}
                        </Badge>
                      );
                    })}
                    {form.watch('hotelSelection.selectedHotel.hotel.amenities').length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{form.watch('hotelSelection.selectedHotel.hotel.amenities').length - 6} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 