import React, { useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Hotel, 
  Star, 
  Search,
  Building,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

import { Package, Destination } from '@/types/packages';
import { mockHotels } from '@/lib/mockData/mockHotelData';

interface StepDestinationsProps {
  form: UseFormReturn<Package>;
}

const AMENITIES = [
  'WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Room Service',
  'Concierge', 'Valet Parking', 'Airport Shuttle', 'Business Center',
  'Kids Club', 'Beach Access', 'Mountain View', 'City View'
];

export function StepDestinations({ form }: StepDestinationsProps) {
  const { control, watch, setValue, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'destinations',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<number | null>(null);

  const watchedDestinations = watch('destinations');

  const handleAddDestination = () => {
    append({
      id: `dest_${Date.now()}`,
      name: '',
      country: '',
      stayLength: 1,
      hotel: undefined,
    });
  };

  const handleRemoveDestination = (index: number) => {
    remove(index);
  };

  const handleHotelTypeChange = (index: number, type: 'api' | 'manual') => {
    const destination = watchedDestinations[index];
    if (destination) {
      setValue(`destinations.${index}.hotel`, {
        type,
        apiHotel: type === 'api' ? {} : undefined,
        manualHotel: type === 'manual' ? {
          name: '',
          stars: 4,
          imageUrl: '',
          amenities: [],
          notes: '',
        } : undefined,
      });
    }
  };

  const handleAddAmenity = (destIndex: number, amenity: string) => {
    const currentAmenities = watchedDestinations[destIndex]?.hotel?.manualHotel?.amenities || [];
    if (!currentAmenities.includes(amenity)) {
      setValue(`destinations.${destIndex}.hotel.manualHotel.amenities`, [...currentAmenities, amenity]);
    }
  };

  const handleRemoveAmenity = (destIndex: number, amenity: string) => {
    const currentAmenities = watchedDestinations[destIndex]?.hotel?.manualHotel?.amenities || [];
    setValue(`destinations.${destIndex}.hotel.manualHotel.amenities`, 
      currentAmenities.filter(a => a !== amenity)
    );
  };

  const handleSelectApiHotel = (destIndex: number, hotel: any) => {
    setValue(`destinations.${destIndex}.hotel.apiHotel`, {
      id: hotel.id,
      name: hotel.name,
      stars: hotel.star_rating,
      amenities: hotel.amenities || [],
      imageUrl: hotel.images?.[0] || '',
    });
  };

  // Filter hotels based on search term - using a simplified approach for now
  const filteredHotels = mockHotels.slice(0, 10).map(hotel => ({
    id: hotel.id,
    name: `Hotel ${hotel.id}`,
    star_rating: 4,
    amenities: ['WiFi', 'Pool'],
    images: [],
    city: 'Sample City',
    country: 'Sample Country'
  }));

  return (
    <div className="space-y-6">
      {/* Add Destination Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Destinations & Accommodations</h3>
          <p className="text-muted-foreground">
            Add destinations and choose hotels for each location
          </p>
        </div>
        <Button onClick={handleAddDestination} type="button">
          <Plus className="w-4 h-4 mr-2" />
          Add Destination
        </Button>
      </div>

      {/* Destinations List */}
      <div className="space-y-4">
        {fields.map((field, index) => {
          const destination = watchedDestinations[index];
          const hotelType = destination?.hotel?.type;
          const apiHotel = destination?.hotel?.apiHotel;
          const manualHotel = destination?.hotel?.manualHotel;

          return (
            <Card key={field.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Destination {index + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveDestination(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Destination Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`destinations.${index}.name`}>Destination Name *</Label>
                    <Input
                      id={`destinations.${index}.name`}
                      placeholder="e.g., Bali, Indonesia"
                      {...form.register(`destinations.${index}.name` as const)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`destinations.${index}.country`}>Country</Label>
                    <Input
                      id={`destinations.${index}.country`}
                      placeholder="e.g., Indonesia"
                      {...form.register(`destinations.${index}.country` as const)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`destinations.${index}.stayLength`}>Stay Length (Nights) *</Label>
                    <Input
                      id={`destinations.${index}.stayLength`}
                      type="number"
                      min="1"
                      max="30"
                      {...form.register(`destinations.${index}.stayLength` as const, { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <Separator />

                {/* Hotel Selection */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Hotel Selection</Label>
                    <RadioGroup
                      value={hotelType || 'api'}
                      onValueChange={(value) => handleHotelTypeChange(index, value as 'api' | 'manual')}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="api" id={`hotel-api-${index}`} />
                        <Label htmlFor={`hotel-api-${index}`}>Use API Hotel (RateHawk)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id={`hotel-manual-${index}`} />
                        <Label htmlFor={`hotel-manual-${index}`}>Add Manually</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {hotelType === 'api' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Search Hotels</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search hotels by name, city, or country..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {searchTerm && (
                        <div className="max-h-60 overflow-y-auto border rounded-md">
                          {filteredHotels.map((hotel) => (
                            <div
                              key={hotel.id}
                              className={`p-3 border-b cursor-pointer hover:bg-muted ${
                                apiHotel?.id === hotel.id ? 'bg-primary/10' : ''
                              }`}
                              onClick={() => handleSelectApiHotel(index, hotel)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium">{hotel.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {hotel.city}, {hotel.country}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {hotel.star_rating && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs">{hotel.star_rating}</span>
                                      </div>
                                    )}
                                    {hotel.amenities && hotel.amenities.length > 0 && (
                                      <div className="flex gap-1">
                                        {hotel.amenities.slice(0, 3).map((amenity) => (
                                          <Badge key={amenity} variant="outline" className="text-xs">
                                            {amenity}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {apiHotel?.name && (
                        <Card className="bg-muted/50">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{apiHotel.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {apiHotel.stars && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs">{apiHotel.stars}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge variant="secondary">API Hotel</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {hotelType === 'manual' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`destinations.${index}.hotel.manualHotel.name`}>Hotel Name *</Label>
                          <Input
                            id={`destinations.${index}.hotel.manualHotel.name`}
                            placeholder="e.g., The Ritz-Carlton Bali"
                            {...form.register(`destinations.${index}.hotel.manualHotel.name` as const)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`destinations.${index}.hotel.manualHotel.stars`}>Star Rating</Label>
                          <Select
                            value={manualHotel?.stars?.toString() || '4'}
                            onValueChange={(value) => 
                              setValue(`destinations.${index}.hotel.manualHotel.stars`, parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((stars) => (
                                <SelectItem key={stars} value={stars.toString()}>
                                  {stars} Star{stars > 1 ? 's' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`destinations.${index}.hotel.manualHotel.imageUrl`}>Hotel Image URL</Label>
                        <Input
                          id={`destinations.${index}.hotel.manualHotel.imageUrl`}
                          placeholder="https://example.com/hotel-image.jpg"
                          {...form.register(`destinations.${index}.hotel.manualHotel.imageUrl` as const)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Amenities</Label>
                        <div className="flex flex-wrap gap-2">
                          {AMENITIES.map((amenity) => {
                            const isSelected = manualHotel?.amenities?.includes(amenity);
                            return (
                              <Button
                                key={amenity}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => 
                                  isSelected 
                                    ? handleRemoveAmenity(index, amenity)
                                    : handleAddAmenity(index, amenity)
                                }
                              >
                                {amenity}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`destinations.${index}.hotel.manualHotel.notes`}>Notes</Label>
                        <Textarea
                          id={`destinations.${index}.hotel.manualHotel.notes`}
                          placeholder="Additional notes about the hotel..."
                          rows={2}
                          {...form.register(`destinations.${index}.hotel.manualHotel.notes` as const)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {fields.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">No destinations added</h3>
                <p className="text-muted-foreground">
                  Add your first destination to start building your package
                </p>
              </div>
              <Button onClick={handleAddDestination} type="button">
                <Plus className="w-4 h-4 mr-2" />
                Add First Destination
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {errors.destinations && (
        <div className="text-sm text-destructive">
          {errors.destinations.message}
        </div>
      )}
    </div>
  );
} 