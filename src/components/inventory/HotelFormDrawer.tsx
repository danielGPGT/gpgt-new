import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, Save, Building2, MapPin, Clock, Phone, Mail, Star, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getGeminiService } from '@/lib/gemini';
import MediaLibrarySelector from '@/components/MediaLibrarySelector';
import { MediaItem } from '@/lib/mediaLibrary';
import { useAuth } from '@/lib/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HotelService, type Hotel, type HotelInsert, type HotelUpdate } from '@/lib/hotelService';

interface HotelFormDrawerProps {
  hotel?: Hotel | null;
  isOpen: boolean;
  onClose: () => void;
}

type FormData = {
  name: string;
  brand: string;
  star_rating: number | null;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  images: string[];
  amenities: string[];
  check_in_time: string;
  check_out_time: string;
  contact_email: string;
  phone: string;
  room_types: string[];
};

const STAR_RATINGS = [1, 2, 3, 4, 5];
const COMMON_AMENITIES = [
  'WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Room Service', 
  'Concierge', 'Parking', 'Airport Shuttle', 'Business Center', 'Laundry'
];

const COMMON_ROOM_TYPES = ['Standard'];

export function HotelFormDrawer({ hotel, isOpen, onClose }: HotelFormDrawerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [selectedMediaItems, setSelectedMediaItems] = useState<MediaItem[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: hotel?.name || '',
    brand: hotel?.brand || '',
    star_rating: hotel?.star_rating || null,
    address: hotel?.address || '',
    city: hotel?.city || '',
    country: hotel?.country || '',
    latitude: hotel?.latitude || null,
    longitude: hotel?.longitude || null,
    description: hotel?.description || '',
    images: hotel?.images || [],
    amenities: hotel?.amenities || [],
    check_in_time: hotel?.check_in_time || '15:00',
    check_out_time: hotel?.check_out_time || '11:00',
    contact_email: hotel?.contact_email || '',
    phone: hotel?.phone || '',
    room_types: hotel?.room_types || [],
  });

  // Reset form data when hotel prop changes
  useEffect(() => {
    setFormData({
      name: hotel?.name || '',
      brand: hotel?.brand || '',
      star_rating: hotel?.star_rating || null,
      address: hotel?.address || '',
      city: hotel?.city || '',
      country: hotel?.country || '',
      latitude: hotel?.latitude || null,
      longitude: hotel?.longitude || null,
      description: hotel?.description || '',
      images: hotel?.images || [],
      amenities: hotel?.amenities || [],
      check_in_time: hotel?.check_in_time || '15:00',
      check_out_time: hotel?.check_out_time || '11:00',
      contact_email: hotel?.contact_email || '',
      phone: hotel?.phone || '',
      room_types: hotel?.room_types || [],
    });
    // Reset step to 1 when switching between edit/add
    setCurrentStep(1);
    // Reset other states
    setSelectedMediaItems([]);
    setIsAutoFilling(false);
  }, [hotel]);

  // Reset form data when drawer opens (for add mode)
  useEffect(() => {
    if (isOpen && !hotel) {
      // Reset form when opening drawer for add mode
      setFormData({
        name: '',
        brand: '',
        star_rating: null,
        address: '',
        city: '',
        country: '',
        latitude: null,
        longitude: null,
        description: '',
        images: [],
        amenities: [],
        check_in_time: '15:00',
        check_out_time: '11:00',
        contact_email: '',
        phone: '',
        room_types: [],
      });
      setCurrentStep(1);
      setSelectedMediaItems([]);
      setIsAutoFilling(false);
    }
  }, [isOpen, hotel]);

  const createMutation = useMutation({
    mutationFn: (data: HotelInsert) => HotelService.createHotel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      toast.success('Hotel created successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to create hotel: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: HotelUpdate }) => 
      HotelService.updateHotel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      toast.success('Hotel updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to update hotel: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    const hotelData = {
      ...formData,
      images: formData.images.length > 0 ? formData.images : null,
      amenities: formData.amenities.length > 0 ? formData.amenities : null,
      room_types: formData.room_types.length > 0 ? formData.room_types : null,
    };

    if (hotel) {
      updateMutation.mutate({ id: hotel.id, data: hotelData });
    } else {
      createMutation.mutate(hotelData);
    }
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAmenity = (amenity: string) => {
    if (!formData.amenities.includes(amenity)) {
      updateField('amenities', [...formData.amenities, amenity]);
    }
  };

  const removeAmenity = (amenity: string) => {
    updateField('amenities', formData.amenities.filter(a => a !== amenity));
  };

  const addRoomType = (roomType: string) => {
    if (!formData.room_types.includes(roomType)) {
      updateField('room_types', [...formData.room_types, roomType]);
    }
  };

  const removeRoomType = (roomType: string) => {
    updateField('room_types', formData.room_types.filter(rt => rt !== roomType));
  };

  const addImage = (url: string) => {
    if (url && !formData.images.includes(url)) {
      updateField('images', [...formData.images, url]);
    }
  };

  const removeImage = (url: string) => {
    updateField('images', formData.images.filter(img => img !== url));
  };

  const handleAutoFill = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a hotel name first');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to use auto-fill');
      return;
    }

    setIsAutoFilling(true);
    try {
      const geminiService = getGeminiService();
      const hotelInfo = await geminiService.generateHotelInfo(formData.name, user.id);
      
      // Update form data with generated information
      setFormData(prev => ({
        ...prev,
        name: hotelInfo.name,
        brand: hotelInfo.brand,
        star_rating: hotelInfo.star_rating,
        address: hotelInfo.address,
        city: hotelInfo.city,
        country: hotelInfo.country,
        latitude: hotelInfo.latitude,
        longitude: hotelInfo.longitude,
        description: hotelInfo.description,
        images: hotelInfo.images,
        amenities: hotelInfo.amenities,
        check_in_time: hotelInfo.check_in_time,
        check_out_time: hotelInfo.check_out_time,
        contact_email: hotelInfo.contact_email,
        phone: hotelInfo.phone,
        room_types: hotelInfo.room_types,
      }));

      const imageCount = hotelInfo.images.length;
      toast.success(`Hotel information auto-filled successfully!${imageCount > 0 ? ` Found ${imageCount} relevant image${imageCount !== 1 ? 's' : ''} from your media library.` : ''}`);
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error('Failed to auto-fill hotel information. Please try again.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleMediaSelect = (mediaItem: MediaItem) => {
    setSelectedMediaItems(prev => {
      const isSelected = prev.some(item => item.id === mediaItem.id);
      if (isSelected) {
        return prev.filter(item => item.id !== mediaItem.id);
      } else {
        return [...prev, mediaItem];
      }
    });
  };

  const handleSaveMediaSelection = () => {
    const imageUrls = selectedMediaItems.map(item => item.image_url);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }));
    setSelectedMediaItems([]);
    setShowMediaLibrary(false);
    toast.success(`${imageUrls.length} image(s) added to hotel`);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.name && formData.city && formData.country;
      case 2:
        return true; // Optional fields
      case 3:
        return true; // Optional fields
      default:
        return false;
    }
  };

  const canProceed = isStepValid(currentStep);
  const canSubmit = isStepValid(1) && isStepValid(2) && isStepValid(3);
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="!max-w-4xl h-full">
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-2xl font-bold">
                {hotel ? 'Edit Hotel' : 'Add New Hotel'}
              </DrawerTitle>
              <DrawerDescription>
                Step {currentStep} of 3
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center pt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 mx-2 transition-colors ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </DrawerHeader>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Building2 className="w-5 h-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Hotel Name *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          placeholder="Enter hotel name"
                          className="flex-1"
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleAutoFill}
                                disabled={isAutoFilling || !formData.name.trim()}
                                className="shrink-0"
                              >
                                <Sparkles className={`w-4 h-4 ${isAutoFilling ? 'animate-spin' : ''}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Auto-fill hotel information with AI</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => updateField('brand', e.target.value)}
                        placeholder="e.g., Marriott, Hilton"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="star_rating" className="text-sm font-medium">Star Rating</Label>
                      <Select
                        value={formData.star_rating?.toString() || ''}
                        onValueChange={(value) => updateField('star_rating', value ? parseInt(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          {STAR_RATINGS.map(rating => (
                            <SelectItem key={rating} value={rating.toString()}>
                              <div className="flex items-center gap-2">
                                {rating} <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Hotel description..."
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        placeholder="Full address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-medium">Country *</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-sm font-medium">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude || ''}
                        onChange={(e) => updateField('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="e.g., 40.7128"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm font-medium">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude || ''}
                        onChange={(e) => updateField('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="e.g., -74.0060"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Clock className="w-5 h-5 text-primary" />
                    Check-in/Check-out Times
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="check_in_time" className="text-sm font-medium">Check-in Time</Label>
                      <Input
                        id="check_in_time"
                        type="time"
                        value={formData.check_in_time}
                        onChange={(e) => updateField('check_in_time', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check_out_time" className="text-sm font-medium">Check-out Time</Label>
                      <Input
                        id="check_out_time"
                        type="time"
                        value={formData.check_out_time}
                        onChange={(e) => updateField('check_out_time', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Phone className="w-5 h-5 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => updateField('contact_email', e.target.value)}
                        placeholder="contact@hotel.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-card-foreground">Room Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.room_types.map((roomType) => (
                        <Badge 
                          key={roomType} 
                          variant="secondary" 
                          className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors" 
                          onClick={() => removeRoomType(roomType)}
                        >
                          {roomType} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={() => addRoomType('Standard')}
                        disabled={formData.room_types.includes('Standard')}
                      >
                        Standard
                      </Button>
                      <Input
                        type="text"
                        placeholder="Add custom room type"
                        className="w-48"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const value = e.currentTarget.value.trim();
                            if (value && !formData.room_types.includes(value)) {
                              addRoomType(value);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-card-foreground">Amenities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.amenities.map((amenity) => (
                        <Badge 
                          key={amenity} 
                          variant="secondary" 
                          className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors" 
                          onClick={() => removeAmenity(amenity)}
                        >
                          {amenity} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {COMMON_AMENITIES.map((amenity) => (
                        <Button
                          key={amenity}
                          variant="outline"
                          size="sm"
                          className="border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => addAmenity(amenity)}
                          disabled={formData.amenities.includes(amenity)}
                        >
                          {amenity}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-card-foreground">Hotel Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img src={image} alt={`Hotel ${index + 1}`} className="w-20 h-20 object-cover rounded" />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 w-6 h-6"
                            onClick={() => removeImage(image)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Select from Media Library
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Select Hotel Images</DialogTitle>
                            <DialogDescription>
                              Choose images from your media library to add to this hotel.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex-1 overflow-hidden">
                            <MediaLibrarySelector
                              onSelect={handleMediaSelect}
                              selectedItems={selectedMediaItems}
                              multiple={true}
                              maxItems={10}
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => setShowMediaLibrary(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveMediaSelection} disabled={selectedMediaItems.length === 0}>
                              Add {selectedMediaItems.length} Image{selectedMediaItems.length !== 1 ? 's' : ''}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <div className="flex gap-2 flex-1">
                        <Input
                          placeholder="Or enter image URL"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addImage((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button variant="outline" onClick={() => {
                          const input = document.querySelector('input[placeholder="Or enter image URL"]') as HTMLInputElement;
                          if (input?.value) {
                            addImage(input.value);
                            input.value = '';
                          }
                        }}>
                          Add URL
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <DrawerFooter className="border-t border-border">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              <DrawerClose asChild>
                <Button variant="outline">
                  Cancel
                </Button>
              </DrawerClose>
              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Hotel'}
                </Button>
              )}
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 