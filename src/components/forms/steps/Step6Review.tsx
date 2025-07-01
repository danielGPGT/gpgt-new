import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Users, DollarSign, Heart, Clock, Building, Star, Ticket, Mail, Phone, Home } from 'lucide-react';
import { useIntakeStore } from '@/store/intake';
import { formatCurrency } from '@/lib/utils';

export function Step6Review() {
  const form = useFormContext();
  const formData = form.getValues();
  const { intakeData } = useIntakeStore();
  
  // Get selected event and ticket from store
  const selectedEvent = (intakeData as any)?.selectedEvent;
  const selectedTicket = (intakeData as any)?.selectedTicket;

  // Debug logging
  console.log('🔍 Step6Review - Intake store data:', {
    hasIntakeData: !!intakeData,
    hasSelectedEvent: !!selectedEvent,
    hasSelectedTicket: !!selectedTicket,
    selectedEvent: selectedEvent,
    selectedTicket: selectedTicket,
    fullIntakeData: intakeData
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTravelTypeIcon = (type: string) => {
    switch (type) {
      case 'solo': return '👤';
      case 'couple': return '💑';
      case 'family': return '👨‍👩‍👧‍👦';
      case 'group': return '👥';
      default: return '👤';
    }
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'plane': return '✈️';
      case 'train': return '🚂';
      case 'car': return '🚗';
      case 'ship': return '🚢';
      default: return '✈️';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Review Your Trip Details</h2>
        <p className="text-muted-foreground">Please review all your selections before generating your quote</p>
      </div>

      {/* Traveler Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Traveler Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Traveler Name</p>
              <p className="font-semibold">{formData.travelerInfo?.name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Travel Type</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTravelTypeIcon(formData.travelerInfo?.travelType)}</span>
                <span className="font-semibold capitalize">{formData.travelerInfo?.travelType || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Travelers</p>
              <p className="font-semibold">
                {formData.travelerInfo?.travelers?.adults || 0} adults, {formData.travelerInfo?.travelers?.children || 0} children
              </p>
            </div>
          </div>
          
          {/* Contact Information */}
          <Separator />
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold">{formData.travelerInfo?.email || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="font-semibold">{formData.travelerInfo?.phone || 'Not specified'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Home className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="font-semibold">
                  {formData.travelerInfo?.address?.street || 'Not specified'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formData.travelerInfo?.address?.city && formData.travelerInfo?.address?.state && formData.travelerInfo?.address?.zipCode
                    ? `${formData.travelerInfo.address.city}, ${formData.travelerInfo.address.state} ${formData.travelerInfo.address.zipCode}`
                    : 'Not specified'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {formData.travelerInfo?.address?.country || 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Destinations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Destinations & Travel Logistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">From</p>
              <p className="font-semibold">{formData.destinations?.from || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Primary Destination</p>
              <p className="font-semibold">{formData.destinations?.primary || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transport Type</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTransportIcon(formData.travelerInfo?.transportType)}</span>
                <span className="font-semibold capitalize">{formData.travelerInfo?.transportType || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trip Duration</p>
              <p className="font-semibold">{formData.destinations?.duration || 0} days</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Start Date</p>
              <p className="font-semibold">{formatDate(formData.travelerInfo?.startDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">End Date</p>
              <p className="font-semibold">{formatDate(formData.travelerInfo?.endDate)}</p>
            </div>
          </div>
          {formData.destinations?.additional && formData.destinations.additional.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Additional Destinations</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.destinations.additional.map((dest: string, index: number) => (
                  <Badge key={index} variant="secondary">{dest}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5" />
            Trip Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tone</p>
              <Badge variant="outline" className="capitalize">{formData.style?.tone || 'Not specified'}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Interests</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.style?.interests?.map((interest: string, index: number) => (
                  <Badge key={index} variant="secondary" className="capitalize">{interest}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Experience Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pace</p>
              <Badge variant="outline" className="capitalize">{formData.experience?.pace || 'Not specified'}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Accommodation</p>
              <Badge variant="outline" className="capitalize">{formData.experience?.accommodation || 'Not specified'}</Badge>
            </div>
          </div>
          {formData.experience?.specialRequests && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Special Requests</p>
              <p className="text-sm bg-muted p-3 rounded-lg mt-1">{formData.experience.specialRequests}</p>
            </div>
          )}
          {selectedEvent && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Event-Focused Special Requests</p>
              <p className="text-sm bg-primary/5 p-3 rounded-lg mt-1 border border-primary/20">
                <span className="font-medium">EVENT FOCUSED TRIP:</span> The main purpose of this trip is to attend {selectedEvent.name} on {formatDate(selectedEvent.dateOfEvent)}. 
                {selectedTicket && ` Ticket type: ${selectedTicket.categoryName}.`} This event should be the absolute centerpiece of the entire itinerary. All activities should be planned around this event, including proper transportation to/from the venue, accommodation near the event location, and complementary activities that enhance the event experience.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Budget & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Budget Amount</p>
              <p className="font-semibold text-lg">
                {formData.budget?.amount ? formatCurrency(formData.budget.amount, formData.budget.currency) : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Experience Type</p>
              <Badge variant="outline" className="capitalize">{formData.budget?.experienceType || 'Not specified'}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Travel Class</p>
              <Badge variant="outline" className="capitalize">{formData.budget?.travelClass || 'Not specified'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Event & Ticket */}
      {selectedEvent && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ticket className="h-5 w-5" />
              Selected Event & Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event Name</p>
                <p className="font-semibold">{selectedEvent.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event Date</p>
                <p className="font-semibold">{formatDate(selectedEvent.dateOfEvent)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Venue</p>
                <p className="font-semibold">{selectedEvent.venue?.name || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="font-semibold">{selectedEvent.venue?.city}, {selectedEvent.venue?.country}</p>
              </div>
            </div>
            {selectedTicket && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ticket Type</p>
                    <p className="font-semibold">{selectedTicket.categoryName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Price</p>
                    <p className="font-semibold">
                      {selectedTicket.price ? formatCurrency(selectedTicket.price, selectedTicket.currency) : 'Price not available'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Availability</p>
                    <p className="font-semibold">{selectedTicket.available ? 'Available' : 'Limited'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Events */}
      {(formData.eventRequests || (formData.eventTypes && formData.eventTypes.length > 0)) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5" />
              Events & Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.eventRequests && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event Requests</p>
                <p className="text-sm bg-muted p-3 rounded-lg mt-1">{formData.eventRequests}</p>
              </div>
            )}
            {formData.eventTypes && formData.eventTypes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event Types</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.eventTypes.map((type: string, index: number) => (
                    <Badge key={index} variant="secondary">{type}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="text-center p-6 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">
          Ready to generate your personalized luxury itinerary?
        </p>
        <p className="text-xs text-muted-foreground">
          Click "Generate Quote" below to create your custom travel proposal with AI-powered recommendations.
        </p>
      </div>
    </div>
  );
} 