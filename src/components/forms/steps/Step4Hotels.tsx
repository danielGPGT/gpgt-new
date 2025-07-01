import { useFormContext } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Search,
  Bed,
  Calendar,
  Clock,
  Building2,
  Phone,
  Mail,
  Home,
  Group,
  User
} from 'lucide-react';
import { cn, convertCurrency, formatCurrency } from '@/lib/utils';
import { rateHawkService, type RateHawkSearchResponse, type RateHawkHotelWithRooms } from '@/lib/api/ratehawk';
import { toast } from 'sonner';
import { useNewIntakeStore } from '@/store/newIntake';
import { NewIntake, TravelerGroup } from '@/types/newIntake';

interface Step4HotelsProps {
  disabled?: boolean;
}

export function Step4Hotels({ disabled = false }: Step4HotelsProps) {
  const form = useFormContext<NewIntake>();
  const { toggleSection } = useNewIntakeStore();
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [hotels, setHotels] = useState<RateHawkSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<RateHawkHotelWithRooms | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  // Group assignment state
  const [accommodationType, setAccommodationType] = useState<'hotel' | 'villa'>('hotel');
  const [groupAssignmentMode, setGroupAssignmentMode] = useState<'together' | 'separate'>('together');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Get form values for search
  const destination = form.watch('tripDetails.primaryDestination');
  const startDate = form.watch('tripDetails.startDate');
  const endDate = form.watch('tripDetails.endDate');
  const adults = form.watch('tripDetails.totalTravelers.adults') || 1;
  const children = form.watch('tripDetails.totalTravelers.children') || 0;
  const hotelGroups = form.watch('hotels.groups') || [];
  const hotelsEnabled = form.watch('hotels.enabled');
  const tripGroups = form.watch('tripDetails.groups') || [];
  const useSubgroups = form.watch('tripDetails.useSubgroups') || false;

  // Helper functions for group logic
  const getAvailableGroups = (): TravelerGroup[] => {
    if (!useSubgroups || tripGroups.length === 0) {
      // Return a default group if no subgroups
      return [{
        id: 'default',
        name: 'All Travelers',
        adults,
        children,
        childAges: [],
        travelerNames: [],
        notes: '',
      }];
    }
    return tripGroups;
  };

  const calculateTotalTravelers = (groupIds: string[]): { adults: number; children: number } => {
    const groups = getAvailableGroups();
    const selectedGroupsData = groups.filter(g => groupIds.includes(g.id));
    
    return selectedGroupsData.reduce(
      (total, group) => ({
        adults: total.adults + (group.adults || 0),
        children: total.children + (group.children || 0),
      }),
      { adults: 0, children: 0 }
    );
  };

  const calculateRequiredRooms = (groupIds: string[]): number => {
    if (accommodationType === 'villa') {
      // Villa can accommodate all travelers together
      return 1;
    }
    
    const { adults, children } = calculateTotalTravelers(groupIds);
    // Assume 2 adults per room, children can share with parents
    const adultRooms = Math.ceil(adults / 2);
    const childRooms = children > 0 ? Math.ceil(children / 2) : 0;
    return Math.max(adultRooms + childRooms, 1);
  };

  const searchHotels = async () => {
    if (!destination || !startDate || !endDate) {
      toast.error('Please fill in destination, start date, and end date first');
      return;
    }

    setIsLoading(true);
    setHotels(null);

    try {
      // Use mock data for testing
      const mockResults = rateHawkService.getMockHotels();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHotels(mockResults);
      toast.success(`Found ${mockResults.hotels.length} hotels`);
    } catch (error) {
      console.error('Hotel search error:', error);
      toast.error('Failed to search hotels. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHotelSelection = (hotel: RateHawkHotelWithRooms, roomId: string) => {
    const selectedRoom = hotel.rooms.find(room => room.id === roomId);
    if (!selectedRoom) return;

    // Get client's preferred currency
    const preferredCurrency = form.watch('preferences.currency') || 'GBP';
    const originalCurrency = selectedRoom.price.currency;
    const originalPrice = selectedRoom.price.amount;

    // Convert price to preferred currency with 2% spread
    const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);

    // Determine which groups to assign
    const groupsToAssign = groupAssignmentMode === 'together' 
      ? getAvailableGroups().map(g => g.id)
      : selectedGroups.length > 0 ? selectedGroups : getAvailableGroups().map(g => g.id);

    // Calculate required rooms
    const requiredRooms = calculateRequiredRooms(groupsToAssign);

    // Create hotel group entries for each assigned group
    const hotelGroupEntries = groupsToAssign.map(groupId => {
      const group = getAvailableGroups().find(g => g.id === groupId);
      const groupTravelers = calculateTotalTravelers([groupId]);
      
      return {
        groupId,
        destinationCity: destination || '',
        numberOfRooms: accommodationType === 'villa' ? 1 : Math.ceil(groupTravelers.adults / 2),
        roomTypes: accommodationType === 'villa' ? ['Villa'] : [selectedRoom.name],
        starRating: accommodationType === 'villa' ? 5 : hotel.stars,
        amenities: accommodationType === 'villa' ? ['Private Pool', 'Kitchen', 'Multiple Bedrooms', 'Garden'] : (hotel.amenities || []),
        useSameHotelAs: groupAssignmentMode === 'together' && groupsToAssign.length > 1 ? groupsToAssign[0] : undefined,
        selectedHotel: {
          hotelId: accommodationType === 'villa' ? `villa_${Date.now()}` : hotel.id,
          hotelName: accommodationType === 'villa' ? 'Private Villa' : hotel.name,
          pricePerNight: accommodationType === 'villa' ? originalPrice * requiredRooms : originalPrice,
          currency: originalCurrency,
          roomType: accommodationType === 'villa' ? 'Private Villa' : selectedRoom.name,
          checkIn: startDate,
          checkOut: endDate,
          // Converted price fields
          convertedPricePerNight: accommodationType === 'villa' ? convertedPrice * requiredRooms : convertedPrice,
          convertedCurrency: preferredCurrency,
        }
      };
    });

    // Add to hotels groups
    form.setValue('hotels.groups', hotelGroupEntries);
    
    // Enable hotels section in both form and store
    form.setValue('hotels.enabled', true);
    toggleSection('hotels', true);
    
    setSelectedHotel(hotel);
    setSelectedRoomId(roomId);
    setIsSearchDialogOpen(false);
    
    const accommodationName = accommodationType === 'villa' ? 'Private Villa' : hotel.name;
    const roomType = accommodationType === 'villa' ? 'Villa' : selectedRoom.name;
    toast.success(`Selected ${accommodationName} - ${roomType} for ${groupsToAssign.length} group(s)`);
  };

  const handleSkipHotelSelection = (skip: boolean) => {
    if (skip) {
      form.setValue('hotels.groups', []);
      form.setValue('hotels.enabled', false);
      setSelectedHotel(null);
      setSelectedRoomId(null);
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
    };

    return amenityMap[amenity] || Building2;
  };

  const formatPrice = (amount: number, currency: string) => {
    return formatCurrency(amount, currency);
  };

  const renderStars = (stars: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'h-4 w-4',
          i < stars ? 'text-yellow-400 fill-current' : 'text-gray-300'
        )}
      />
    ));
  };

  const selectedHotelData = hotelGroups.length > 0 ? hotelGroups[0] : null;
  const skipHotelSelection = hotelGroups.length === 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[var(--card)] via-[var(--card)]/95 to-[var(--background)]/30 border border-[var(--border)] rounded-3xl shadow-lg overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-[var(--card-foreground)]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/30 shadow-sm">
              <Hotel className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
              <div className="text-xl font-bold">Hotel Selection</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)] mt-1">
                Choose your accommodation for the trip
              </div>
            </div>
          </CardTitle>
        </CardHeader>

          <CardContent className="space-y-6">
          {/* Accommodation Type Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Hotel className="h-4 w-4 text-[var(--primary)]" />
              Accommodation Type
            </Label>
            <RadioGroup
              value={accommodationType}
              onValueChange={(value: 'hotel' | 'villa') => setAccommodationType(value)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className={cn(
                "relative flex cursor-pointer rounded-xl border-2 p-4 transition-all duration-200",
                accommodationType === 'hotel'
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50"
              )}>
                <RadioGroupItem value="hotel" id="hotel" className="sr-only" />
                <div className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    accommodationType === 'hotel'
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  )}>
                    <Hotel className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--foreground)]">Hotel</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Traditional hotel accommodation with individual rooms
                    </div>
                  </div>
                </div>
              </div>

              <div className={cn(
                "relative flex cursor-pointer rounded-xl border-2 p-4 transition-all duration-200",
                accommodationType === 'villa'
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50"
              )}>
                <RadioGroupItem value="villa" id="villa" className="sr-only" />
                <div className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    accommodationType === 'villa'
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  )}>
                    <Home className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--foreground)]">Private Villa</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Exclusive villa for all travelers to stay together
                    </div>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Group Assignment (only show if subgroups are enabled) */}
          {useSubgroups && tripGroups.length > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Group className="h-4 w-4 text-[var(--primary)]" />
                Group Assignment
              </Label>
              <RadioGroup
                value={groupAssignmentMode}
                onValueChange={(value: 'together' | 'separate') => setGroupAssignmentMode(value)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className={cn(
                  "relative flex cursor-pointer rounded-xl border-2 p-4 transition-all duration-200",
                  groupAssignmentMode === 'together'
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50"
                )}>
                  <RadioGroupItem value="together" id="together" className="sr-only" />
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      groupAssignmentMode === 'together'
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    )}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--foreground)]">Stay Together</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        All groups share the same accommodation
                      </div>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "relative flex cursor-pointer rounded-xl border-2 p-4 transition-all duration-200",
                  groupAssignmentMode === 'separate'
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50"
                )}>
                  <RadioGroupItem value="separate" id="separate" className="sr-only" />
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      groupAssignmentMode === 'separate'
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                    )}>
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--foreground)]">Separate Groups</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Choose specific groups for this accommodation
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>

              {/* Group Selection (only show if separate mode is selected) */}
              {groupAssignmentMode === 'separate' && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-[var(--foreground)]">
                    Select Groups
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tripGroups.map((group) => (
                      <div
                        key={group.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
                          selectedGroups.includes(group.id)
                            ? "border-[var(--primary)] bg-[var(--primary)]/10"
                            : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50"
                        )}
                        onClick={() => {
                          setSelectedGroups(prev => 
                            prev.includes(group.id)
                              ? prev.filter(id => id !== group.id)
                              : [...prev, group.id]
                          );
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => {}}
                          className="h-4 w-4 text-[var(--primary)] rounded border-[var(--border)] focus:ring-[var(--primary)]/20"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-[var(--foreground)]">{group.name}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {(group.adults || 0) + (group.children || 0)} travelers
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search Parameters Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-[var(--muted)]/20 to-[var(--muted)]/10 rounded-2xl border border-[var(--muted)]/20">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--primary)]" />
              <div>
                <div className="text-xs text-[var(--muted-foreground)]">Destination</div>
                <div className="text-sm font-medium">{destination || 'Not set'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--primary)]" />
              <div>
                <div className="text-xs text-[var(--muted-foreground)]">Check-in</div>
                <div className="text-sm font-medium">{startDate || 'Not set'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--primary)]" />
              <div>
                <div className="text-xs text-[var(--muted-foreground)]">Check-out</div>
                <div className="text-sm font-medium">{endDate || 'Not set'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--primary)]" />
              <div>
                <div className="text-xs text-[var(--muted-foreground)]">Travelers</div>
                <div className="text-sm font-medium">
                  {useSubgroups && tripGroups.length > 0 
                    ? `${tripGroups.length} group(s)` 
                    : `${adults + children} (${adults}A, ${children}C)`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Accommodation Summary */}
          {(accommodationType === 'villa' || (useSubgroups && tripGroups.length > 0)) && (
            <div className="p-4 bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/10 rounded-2xl border border-[var(--accent)]/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
                  {accommodationType === 'villa' ? (
                    <Home className="h-4 w-4 text-[var(--accent-foreground)]" />
                  ) : (
                    <Group className="h-4 w-4 text-[var(--accent-foreground)]" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--accent-foreground)]">
                    {accommodationType === 'villa' ? 'Villa Accommodation' : 'Group Assignment'}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {accommodationType === 'villa' 
                      ? 'All travelers will stay together in a private villa'
                      : groupAssignmentMode === 'together'
                        ? 'All groups will share the same accommodation'
                        : 'Selected groups will have separate accommodations'
                    }
                  </div>
                </div>
              </div>
              
              {useSubgroups && tripGroups.length > 0 && groupAssignmentMode === 'separate' && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[var(--accent-foreground)]">Selected Groups:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedGroups.length > 0 ? (
                      selectedGroups.map(groupId => {
                        const group = tripGroups.find(g => g.id === groupId);
                        const { adults, children } = calculateTotalTravelers([groupId]);
                        const requiredRooms = calculateRequiredRooms([groupId]);
                        return (
                          <Badge key={groupId} variant="outline" className="text-xs bg-[var(--accent)]/20 text-[var(--accent-foreground)] border-[var(--accent)]/30">
                            {group?.name} ({adults + children} travelers, {requiredRooms} room{requiredRooms > 1 ? 's' : ''})
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">No groups selected</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hotel Selection Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hotel className="h-5 w-5 text-[var(--primary)]" />
                <span className="font-semibold">Accommodation</span>
              </div>
              <Badge variant="outline" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
                {selectedHotelData ? 'Selected' : skipHotelSelection ? 'Skipped' : 'Not selected'}
              </Badge>
            </div>

            {/* Selected Hotel Display */}
            {selectedHotelData && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800">
                      {accommodationType === 'villa' ? 'Villa' : 'Hotel'} Selected
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      {selectedHotelData.destinationCity} • {selectedHotelData.roomTypes.join(', ')} • {selectedHotelData.numberOfRooms} room(s)
                    </p>
                    {selectedHotelData.starRating && (
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: selectedHotelData.starRating }, (_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    )}
                    {/* Show group information */}
                    {useSubgroups && tripGroups.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-green-600 font-medium">Assigned Groups:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {hotelGroups.map((hotelGroup, index) => {
                            const group = tripGroups.find(g => g.id === hotelGroup.groupId);
                            return (
                              <Badge key={index} variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                {group?.name || hotelGroup.groupId}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      form.setValue('hotels.groups', []);
                      form.setValue('hotels.enabled', false);
                      setSelectedHotel(null);
                      setSelectedRoomId(null);
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!destination || !startDate || !endDate) {
                        toast.error('Please fill in destination, start date, and end date first');
                        return;
                      }
                      setIsSearchDialogOpen(true);
                      searchHotels();
                    }}
                    disabled={disabled || !destination || !startDate || !endDate}
                    className="flex-1 h-12 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-medium"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Hotels
                  </Button>
                </DialogTrigger>
              </Dialog>
                
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSkipHotelSelection(!skipHotelSelection)}
                              disabled={disabled}
                className={cn(
                  "h-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] transition-all duration-200",
                  skipHotelSelection && "bg-[var(--accent)] border-[var(--accent)]"
                )}
              >
                {skipHotelSelection ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Skipping Hotels
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Skip Hotel Selection
                  </>
                )}
              </Button>
            </div>

            {/* Skip Hotel Selection Message */}
            {skipHotelSelection && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="text-sm font-semibold text-amber-800">
                      Hotel selection skipped
                    </div>
                    <div className="text-xs text-amber-700">
                      You can add hotel preferences later or let us suggest options based on your budget and style.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hotel Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="!max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Hotels
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Search Summary */}
            <div className="p-4 bg-gradient-to-r from-[var(--muted)]/20 to-[var(--muted)]/10 rounded-2xl border border-[var(--muted)]/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[var(--muted-foreground)]">Destination</div>
                  <div className="font-medium">{destination}</div>
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)]">Check-in</div>
                  <div className="font-medium">{startDate}</div>
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)]">Check-out</div>
                  <div className="font-medium">{endDate}</div>
                </div>
                <div>
                  <div className="text-[var(--muted-foreground)]">Travelers</div>
                  <div className="font-medium">{adults + children} ({adults}A, {children}C)</div>
                </div>
              </div>
            </div>

            {/* Filters and Results Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Column */}
              <div className="lg:col-span-1 space-y-4">
                <div className="sticky top-4">
                  <div className="p-4 bg-gradient-to-br from-[var(--card)]/50 to-[var(--background)]/30 border border-[var(--border)] rounded-2xl space-y-6">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-[var(--primary)]" />
                      <h3 className="font-semibold text-[var(--foreground)]">Filters</h3>
                    </div>

                    {/* Star Rating Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[var(--foreground)]">Star Rating</Label>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <div key={stars} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`stars-${stars}`}
                              className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                            <label htmlFor={`stars-${stars}`} className="text-sm text-[var(--foreground)] flex items-center gap-1">
                              {renderStars(stars)}
                              <span>{stars}+ stars</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[var(--foreground)]">Price Range (per night)</Label>
                      <div className="space-y-2">
                        {[
                          { label: 'Budget', range: '$0 - $100' },
                          { label: 'Mid-range', range: '$100 - $250' },
                          { label: 'Premium', range: '$250 - $500' },
                          { label: 'Luxury', range: '$500+' }
                        ].map((price) => (
                          <div key={price.label} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`price-${price.label}`}
                              className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                            <label htmlFor={`price-${price.label}`} className="text-sm text-[var(--foreground)]">
                              {price.label} ({price.range})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amenities Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[var(--foreground)]">Amenities</Label>
                      <div className="space-y-2">
                        {[
                          'WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking', 
                          'Air Conditioning', 'Pet Friendly', 'Business Center'
                        ].map((amenity) => (
                          <div key={amenity} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`amenity-${amenity}`}
                              className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                            <label htmlFor={`amenity-${amenity}`} className="text-sm text-[var(--foreground)] flex items-center gap-1">
                              {(() => {
                                const Icon = getAmenityIcon(amenity);
                                return <Icon className="h-3 w-3" />;
                              })()}
                              {amenity}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[var(--foreground)]">Location</Label>
                      <div className="space-y-2">
                        {[
                          'City Center', 'Airport', 'Beach', 'Mountains', 'Downtown', 'Suburbs'
                        ].map((location) => (
                          <div key={location} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`location-${location}`}
                              className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                            <label htmlFor={`location-${location}`} className="text-sm text-[var(--foreground)] flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {location}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Room Type Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[var(--foreground)]">Room Type</Label>
                      <div className="space-y-2">
                        {[
                          'Standard', 'Deluxe', 'Suite', 'Family', 'Executive', 'Presidential'
                        ].map((roomType) => (
                          <div key={roomType} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`room-${roomType}`}
                              className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                            <label htmlFor={`room-${roomType}`} className="text-sm text-[var(--foreground)] flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              {roomType}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                      className="w-full h-9 rounded-lg border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/30"
                    >
                      Clear All Filters
                            </Button>
                          </div>
                        </div>
                      </div>

              {/* Results Column */}
              <div className="lg:col-span-3 space-y-6">
                {/* Loading State */}
                {isLoading && (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className="border rounded-2xl p-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <Skeleton className="w-20 h-20 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hotel Results */}
                {!isLoading && hotels && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-[var(--muted-foreground)]">
                        Found {hotels.totalResults} hotels
                      </div>
                      <Badge variant="outline" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
                        Mock Data
                      </Badge>
                    </div>

                    <div className="space-y-6">
                      {hotels.hotels.map((hotel) => (
                        <div key={hotel.id} className="border border-[var(--border)] rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow">
                          {/* Hotel Header */}
                          <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-xl bg-[var(--muted)]/20 flex items-center justify-center overflow-hidden">
                              {hotel.images && hotel.images.length > 0 ? (
                                <img
                                  src={hotel.images[0]}
                                  alt={hotel.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Hotel className="h-10 w-10 text-[var(--muted-foreground)]" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg">{hotel.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1">
                                      {renderStars(hotel.stars)}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {hotel.rating}/5
                                    </Badge>
                                    <span className="text-sm text-[var(--muted-foreground)]">
                                      {hotel.address.city}, {hotel.address.country}
                                    </span>
                                  </div>
                                </div>
              </div>
                              
                              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                                {hotel.description}
                              </p>

                              {/* Hotel Details */}
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)] mb-3">
                                {hotel.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {hotel.phone}
                                  </div>
                                )}
                                {hotel.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {hotel.email}
              </div>
            )}
                                {hotel.checkInTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Check-in: {hotel.checkInTime}
                                  </div>
                                )}
                              </div>

                              {/* Amenities */}
                              {hotel.amenities && hotel.amenities.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {hotel.amenities.slice(0, 6).map((amenity, index) => {
                                    const Icon = getAmenityIcon(amenity);
                                    return (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        <Icon className="h-3 w-3 mr-1" />
                                        {amenity}
                                      </Badge>
                                    );
                                  })}
                                  {hotel.amenities.length > 6 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{hotel.amenities.length - 6} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
        </div>
        
                          <Separator />

                          {/* Rooms/Rates */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-[var(--foreground)]">Available Rooms</h4>
                            <div className="grid gap-3">
                              {hotel.rooms.map((room) => (
                                <div
                                  key={room.id}
                                  className={cn(
                                    "p-4 border rounded-xl transition-all duration-200 cursor-pointer",
                                    selectedHotel?.id === hotel.id && selectedRoomId === room.id
                                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                                      : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--accent)]/20"
                                  )}
                                  onClick={() => handleHotelSelection(hotel, room.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h5 className="font-medium">{room.name}</h5>
                                        <Badge variant="outline" className="text-xs">
                                          {room.type}
                                        </Badge>
                                        {room.refundable && (
                                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                                            Refundable
            </Badge>
          )}
        </div>
                                      
                                      <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)] mb-2">
                                        <div className="flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          {room.capacity.adults}A, {room.capacity.children}C
                                        </div>
                                        {room.boardType && (
                                          <div className="flex items-center gap-1">
                                            <Utensils className="h-3 w-3" />
                                            {room.boardType}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {room.cancellationPolicy && (
                                        <div className="text-xs text-[var(--muted-foreground)]">
                                          {room.cancellationPolicy}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="text-right">
                                      <div className="text-lg font-semibold text-[var(--primary)]">
                                        {(() => {
                                          const preferredCurrency = form.watch('preferences.currency') || 'GBP';
                                          const originalCurrency = room.price.currency;
                                          const originalPrice = room.price.amount;
                                          
                                          if (preferredCurrency !== originalCurrency) {
                                            const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);
                                            return formatCurrency(convertedPrice, preferredCurrency);
                                          }
                                          return formatPrice(originalPrice, originalCurrency);
                                        })()}
                                      </div>
                                      <div className="text-xs text-[var(--muted-foreground)]">per night</div>
                                      {room.price.originalAmount && room.price.originalAmount > room.price.amount && (
                                        <div className="text-xs text-[var(--muted-foreground)] line-through">
                                          {formatPrice(room.price.originalAmount, room.price.currency)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {!isLoading && hotels && hotels.hotels.length === 0 && (
                  <div className="text-center py-12">
                    <Hotel className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No hotels found</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Try adjusting your search criteria or dates.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 