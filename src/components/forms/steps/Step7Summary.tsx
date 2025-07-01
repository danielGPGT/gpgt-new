import React from 'react';
import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Users, 
  MapPin, 
  Calendar, 
  Plane, 
  Building2, 
  Car, 
  Ticket,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Star,
  Clock,
  Package,
  Heart,
  ArrowRight,
  Loader2,
  Sparkles,
  Download
} from 'lucide-react';
import { cn, convertCurrency, formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { useQuoteService } from '@/hooks/useQuoteService';
import { createNewIntakeQuotePayload } from '@/utils/createNewIntakeQuotePayload';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { NewIntake } from '@/types/newIntake';

interface Step7SummaryProps {
  disabled?: boolean;
  onGenerateItinerary?: () => void;
  onExportPDF?: () => void;
}

export function Step7Summary({ disabled, onGenerateItinerary, onExportPDF }: Step7SummaryProps) {
  const form = useFormContext<NewIntake>();
  
  // Use watch instead of getValues to get reactive form data
  const formData = form.watch();

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Price calculation functions - using converted prices stored in form data
  const calculateFlightPrice = () => {
    if (!formData.flights?.enabled || !formData.flights.groups) return { total: 0, details: [] };
    
    let totalFlightPrice = 0;
    let flightDetails: Array<{cabinClass: string, pricePerPerson: number, travelers: number, subtotal: number, currency: string, originalPrice?: number, originalCurrency?: string}> = [];
    
    formData.flights.groups.forEach(group => {
      // Use converted flight data if available
      if (group.selectedFlight?.convertedTotal) {
        const pricePerPerson = group.selectedFlight.convertedTotal;
        const currency = group.selectedFlight.convertedCurrency || 'GBP';
        const originalPrice = group.selectedFlight.total;
        const originalCurrency = group.selectedFlight.currency;
        
        // Get travelers for this specific group (if using subgroups) or total travelers
        const travelers = formData.tripDetails?.useSubgroups 
          ? (group.adults || formData.tripDetails?.totalTravelers?.adults || 1)
          : (formData.tripDetails?.totalTravelers?.adults || 1);
        
        const subtotal = pricePerPerson * travelers;
        
        flightDetails.push({
          cabinClass: group.cabinClass,
          pricePerPerson,
          travelers,
          subtotal,
          currency,
          originalPrice,
          originalCurrency
        });
        
        totalFlightPrice += subtotal;
      } else if (group.selectedFlight?.total) {
        // Fallback to original price if no conversion available
        const pricePerPerson = group.selectedFlight.total;
        const currency = group.selectedFlight.currency || 'GBP';
        
        // Get travelers for this specific group (if using subgroups) or total travelers
        const travelers = formData.tripDetails?.useSubgroups 
          ? (group.adults || formData.tripDetails?.totalTravelers?.adults || 1)
          : (formData.tripDetails?.totalTravelers?.adults || 1);
        
        const subtotal = pricePerPerson * travelers;
        
        flightDetails.push({
          cabinClass: group.cabinClass,
          pricePerPerson,
          travelers,
          subtotal,
          currency
        });
        
        totalFlightPrice += subtotal;
      }
      // Removed fallback estimated pricing - only show actual selected flights
    });
    
    return { total: totalFlightPrice, details: flightDetails };
  };

  const calculateHotelPrice = () => {
    if (!formData.hotels?.enabled || !formData.hotels.groups) return { total: 0, details: [] };
    
    let totalHotelPrice = 0;
    const duration = formData.tripDetails?.duration || 1;
    let hotelDetails: Array<{starRating: number, pricePerRoom: number, rooms: number, nights: number, subtotal: number, currency: string, originalPrice?: number, originalCurrency?: string}> = [];
    
    formData.hotels.groups.forEach(group => {
      // Use converted hotel data if available
      if (group.selectedHotel?.convertedPricePerNight) {
        const pricePerRoom = group.selectedHotel.convertedPricePerNight;
        const currency = group.selectedHotel.convertedCurrency || 'GBP';
        const originalPrice = group.selectedHotel.pricePerNight;
        const originalCurrency = group.selectedHotel.currency;
        const numberOfRooms = group.numberOfRooms || 1;
        const subtotal = pricePerRoom * numberOfRooms * duration;
        
        hotelDetails.push({
          starRating: group.starRating || 3,
          pricePerRoom,
          rooms: numberOfRooms,
          nights: duration,
          subtotal,
          currency,
          originalPrice,
          originalCurrency
        });
        
        totalHotelPrice += subtotal;
      } else if (group.selectedHotel?.pricePerNight) {
        // Fallback to original price if no conversion available
        const pricePerRoom = group.selectedHotel.pricePerNight;
        const currency = group.selectedHotel.currency || 'GBP';
        const numberOfRooms = group.numberOfRooms || 1;
        const subtotal = pricePerRoom * numberOfRooms * duration;
        
        hotelDetails.push({
          starRating: group.starRating || 3,
          pricePerRoom,
          rooms: numberOfRooms,
          nights: duration,
          subtotal,
          currency
        });
        
        totalHotelPrice += subtotal;
      }
      // Removed fallback estimated pricing - only show actual selected hotels
    });
    
    return { total: totalHotelPrice, details: hotelDetails };
  };

  const calculateTransferPrice = () => {
    if (!formData.transfers?.enabled || !formData.transfers.groups) return { total: 0, details: [] };
    
    let totalTransferPrice = 0;
    let transferDetails: Array<{vehicleType: string, pricePerTransfer: number, transfers: number, subtotal: number, currency: string}> = [];
    
    formData.transfers.groups.forEach(group => {
      // Only show prices if transfers are actually configured
      if (group.arrivalTransfer || group.departureTransfer) {
        // For now, return 0 since we don't have actual transfer pricing yet
        // This will be updated when transfer pricing is implemented
        const pricePerTransfer = 0;
        
        // Count transfers (arrival and/or departure)
        let transferCount = 0;
        if (group.arrivalTransfer) transferCount++;
        if (group.departureTransfer) transferCount++;
        
        const subtotal = pricePerTransfer * transferCount;
        
        transferDetails.push({
          vehicleType: group.vehicleType,
          pricePerTransfer,
          transfers: transferCount,
          subtotal,
          currency: 'GBP'
        });
        
        totalTransferPrice += subtotal;
      }
    });
    
    return { total: totalTransferPrice, details: transferDetails };
  };

  const calculateEventPrice = () => {
    if (!formData.events?.enabled || !formData.events.events) return { total: 0, details: [] };
    
    let totalEventPrice = 0;
    let eventDetails: Array<{eventName: string, ticketPrice: number, quantity: number, subtotal: number, currency: string}> = [];
    
    formData.events.events.forEach(event => {
      event.groups?.forEach(group => {
        if (group.ticketDetails?.convertedPrice && group.ticketDetails?.convertedCurrency) {
          // Use the stored converted price
          const ticketPrice = group.ticketDetails.convertedPrice;
          const ticketQuantity = group.tickets || 1;
          const subtotal = ticketPrice * ticketQuantity;
          const currency = group.ticketDetails.convertedCurrency;
          
          eventDetails.push({
            eventName: event.name,
            ticketPrice,
            quantity: ticketQuantity,
            subtotal,
            currency
          });
          
          totalEventPrice += subtotal;
        } else if (group.ticketDetails?.price && group.ticketDetails?.currency) {
          // Fallback to original price if no conversion available
          const ticketPrice = group.ticketDetails.price;
          const ticketQuantity = group.tickets || 1;
          const subtotal = ticketPrice * ticketQuantity;
          const currency = group.ticketDetails.currency;
          
          eventDetails.push({
            eventName: event.name,
            ticketPrice,
            quantity: ticketQuantity,
            subtotal,
            currency
          });
          
          totalEventPrice += subtotal;
        }
      });
    });
    
    return { total: totalEventPrice, details: eventDetails };
  };

  // Calculate total price
  const flightPrice = calculateFlightPrice().total;
  const hotelPrice = calculateHotelPrice().total;
  const transferPrice = calculateTransferPrice().total;
  const eventPrice = calculateEventPrice().total;
  const totalPrice = flightPrice + hotelPrice + transferPrice + eventPrice;
  const preferredCurrency = formData.preferences?.currency || 'GBP';

  // Check completion status - only require essential information
  const hasClient = formData.client?.firstName && formData.client?.lastName;
  const hasTripDetails = formData.tripDetails?.primaryDestination && formData.tripDetails?.startDate && formData.tripDetails?.endDate;
  const hasPreferences = formData.preferences?.tone && formData.preferences?.currency;
  
  // Service sections are optional - users can generate quotes without selecting all components
  const hasFlights = !formData.flights?.enabled || (formData.flights?.enabled && formData.flights?.groups?.length > 0);
  const hasHotels = !formData.hotels?.enabled || (formData.hotels?.enabled && formData.hotels?.groups?.length > 0);
  const hasTransfers = !formData.transfers?.enabled || (formData.transfers?.enabled && formData.transfers?.groups?.length > 0);
  const hasEvents = !formData.events?.enabled || (formData.events?.enabled && formData.events?.events?.length > 0);

  // Only require essential information for quote generation
  const isComplete = hasClient && hasTripDetails && hasPreferences;

  const quoteService = useQuoteService();
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGenerateQuote = async () => {
    if (disabled || !isComplete) return;

    setGeneratingQuote(true);
    setQuoteError(null);
    quoteService.clearError();

    try {
      // Debug logging for form data before quote generation
      console.log('🔍 Step7Summary - Form data before quote generation:', {
        flights: formData.flights,
        flightGroups: formData.flights?.groups,
        selectedFlights: formData.flights?.groups?.filter(group => group.selectedFlight),
        hotels: formData.hotels,
        hotelGroups: formData.hotels?.groups,
        selectedHotels: formData.hotels?.groups?.filter(group => group.selectedHotel),
        events: formData.events,
        selectedEvents: formData.events?.events?.filter(event => event.groups?.some(group => group.ticketDetails))
      });

      const quotePayload = createNewIntakeQuotePayload(formData);
      const quote = await quoteService.createQuote(quotePayload);

      if (quote && quote.id) {
        toast.success('Quote generated successfully!');
        navigate(`/quote/${quote.id}`);
      } else {
        setQuoteError('Failed to generate quote. Please try again later.');
      }
    } catch (error) {
      console.error('Quote generation error:', error);
      setQuoteError('An error occurred while generating the quote. Please try again later.');
    } finally {
      setGeneratingQuote(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto space-y-8"
    >
      {/* Summary Header */}
      <Card className="bg-gradient-to-br from-[var(--card)] via-[var(--card)]/95 to-[var(--background)]/30 border border-[var(--border)] rounded-3xl shadow-lg overflow-hidden backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-[var(--card-foreground)]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/30 shadow-sm">
              <FileText className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <div>
              <div className="text-xl font-bold">Quote Summary</div>
              <div className="text-sm font-normal text-[var(--muted-foreground)] mt-1">
                Review all details before generating your travel quote
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Client Information */}
          {hasClient && (
            <div className="space-y-3">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Users className="h-4 w-4" />
                Client Information
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {formData.client ? `${formData.client.firstName} ${formData.client.lastName}` : 'Not specified'}</div>
                <div><span className="font-medium">Email:</span> {formData.client?.email || 'Not specified'}</div>
                <div><span className="font-medium">Phone:</span> {formData.client?.phone || 'Not specified'}</div>
              </div>
            </div>
          )}

          {/* Trip Details */}
          {hasTripDetails && (
            <div className="space-y-3">
              <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Trip Details
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Destination:</span> {formData.tripDetails?.primaryDestination || 'Not specified'}</div>
                <div><span className="font-medium">Duration:</span> {formData.tripDetails?.duration || 0} days</div>
                <div><span className="font-medium">Travelers:</span> {formData.tripDetails?.totalTravelers?.adults || 0} adults, {formData.tripDetails?.totalTravelers?.children || 0} children</div>
                <div><span className="font-medium">Purpose:</span> {formData.tripDetails?.purpose || 'Not specified'}</div>
              </div>
            </div>
          )}

          {/* Travel Dates */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Travel Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--muted)]/30 rounded-lg">
                <div className="text-sm text-[var(--muted-foreground)]">Start Date</div>
                <div className="font-medium">{formatDate(formData.tripDetails?.startDate || '')}</div>
              </div>
              <div className="p-3 bg-[var(--muted)]/30 rounded-lg">
                <div className="text-sm text-[var(--muted-foreground)]">End Date</div>
                <div className="font-medium">{formatDate(formData.tripDetails?.endDate || '')}</div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Travel Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div><span className="font-medium">Style:</span> {formData.preferences?.tone || 'Not specified'}</div>
                <div><span className="font-medium">Currency:</span> {formData.preferences?.currency || 'GBP'}</div>
                <div><span className="font-medium">Language:</span> {formData.preferences?.language || 'English'}</div>
              </div>
              <div className="space-y-2">
                <div><span className="font-medium">Budget:</span> {formData.preferences?.budget?.amount ? formatCurrency(formData.preferences.budget.amount, formData.preferences.currency) : 'Not specified'}</div>
                <div><span className="font-medium">Budget Type:</span> {formData.preferences?.budget?.type || 'total'}</div>
                <div><span className="font-medium">Priorities:</span> {formData.preferences?.travelPriorities?.join(', ') || 'Not specified'}</div>
              </div>
            </div>
          </div>

          <Separator className="bg-[var(--border)]" />

          {/* Services Summary */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Included Services</h3>
              <Badge variant="secondary" className="text-xs">
                Optional - Select what you need
              </Badge>
            </div>
            
            {/* Flights */}
            <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[var(--muted)]/10 rounded-xl">
              <Plane className="h-5 w-5 text-[var(--primary)]" />
              <span className="font-medium text-[var(--foreground)]">Flights</span>
              {formData.flights?.enabled ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {formData.flights.groups?.length || 0} group{formData.flights.groups?.length !== 1 ? 's' : ''} configured
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-[var(--muted-foreground)]">Excluded</span>
                </>
                )}
              </div>
              
              {/* Flight Details */}
              {formData.flights?.enabled && formData.flights.groups && formData.flights.groups.length > 0 && (
                <div className="ml-8 space-y-3">
                  {formData.flights.groups.map((group, index) => (
                    <div key={index} className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-[var(--muted-foreground)]">Route:</span>
                          <span className="ml-2 font-medium">
                            {group.originAirport} → {group.destinationAirport}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Class:</span>
                          <Badge variant="outline" className="ml-2 capitalize">
                            {group.cabinClass}
                          </Badge>
                        </div>
                        {group.preferredAirlines && group.preferredAirlines.length > 0 && (
                          <div>
                            <span className="text-[var(--muted-foreground)]">Airlines:</span>
                            <span className="ml-2 font-medium">
                              {group.preferredAirlines.join(', ')}
                            </span>
                          </div>
                        )}
                        {group.flexibleDates && (
                          <div>
                            <span className="text-[var(--muted-foreground)]">Flexible Dates:</span>
                            <Badge variant="secondary" className="ml-2">Yes</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hotels */}
            <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[var(--muted)]/10 rounded-xl">
              <Building2 className="h-5 w-5 text-[var(--primary)]" />
              <span className="font-medium text-[var(--foreground)]">Hotels</span>
              {formData.hotels?.enabled ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {formData.hotels.groups?.length || 0} group{formData.hotels.groups?.length !== 1 ? 's' : ''} configured
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-[var(--muted-foreground)]">Excluded</span>
                </>
                )}
              </div>
              
              {/* Hotel Details */}
              {formData.hotels?.enabled && formData.hotels.groups && formData.hotels.groups.length > 0 && (
                <div className="ml-8 space-y-3">
                  {formData.hotels.groups.map((group, index) => (
                    <div key={index} className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-[var(--muted-foreground)]">Destination:</span>
                          <span className="ml-2 font-medium">
                            {group.destinationCity}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Rooms:</span>
                          <span className="ml-2 font-medium">
                            {group.numberOfRooms}
                          </span>
                        </div>
                        {group.roomTypes && group.roomTypes.length > 0 && (
                          <div>
                            <span className="text-[var(--muted-foreground)]">Room Types:</span>
                            <span className="ml-2 font-medium">
                              {group.roomTypes.join(', ')}
                            </span>
                          </div>
                        )}
                        {group.starRating && (
                          <div>
                            <span className="text-[var(--muted-foreground)]">Star Rating:</span>
                            <div className="ml-2 flex items-center gap-1">
                              {Array.from({ length: group.starRating }, (_, i) => (
                                <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                              ))}
                            </div>
                          </div>
                        )}
                        {group.amenities && group.amenities.length > 0 && (
                          <div className="md:col-span-2">
                            <span className="text-[var(--muted-foreground)]">Amenities:</span>
                            <div className="ml-2 mt-1 flex flex-wrap gap-1">
                              {group.amenities.slice(0, 5).map((amenity, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {group.amenities.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{group.amenities.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transfers */}
            <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[var(--muted)]/10 rounded-xl">
              <Car className="h-5 w-5 text-[var(--primary)]" />
              <span className="font-medium text-[var(--foreground)]">Transfers</span>
              {formData.transfers?.enabled ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {formData.transfers.groups?.length || 0} group{formData.transfers.groups?.length !== 1 ? 's' : ''} configured
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span className="text-sm text-[var(--muted-foreground)]">Excluded</span>
                </>
              )}
            </div>

              {/* Transfer Details */}
              {formData.transfers?.enabled && formData.transfers.groups && formData.transfers.groups.length > 0 && (
                <div className="ml-8 space-y-3">
                  {formData.transfers.groups.map((group, index) => (
                    <div key={index} className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-[var(--muted-foreground)]">Type:</span>
                          <Badge variant="outline" className="ml-2 capitalize">
                            {group.type}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Vehicle:</span>
                          <Badge variant="outline" className="ml-2 capitalize">
                            {group.vehicleType}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Pickup:</span>
                          <span className="ml-2 font-medium">
                            {group.pickupLocation}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Dropoff:</span>
                          <span className="ml-2 font-medium">
                            {group.dropoffLocation}
                          </span>
                        </div>
                        {group.pickupDate && (
                          <div>
                            <span className="text-[var(--muted-foreground)]">Date:</span>
                            <span className="ml-2 font-medium">
                              {formatDate(group.pickupDate)}
                            </span>
                          </div>
                        )}
                        {group.pickupTime && (
                          <div>
                            <span className="text-[var(--muted-foreground)]">Time:</span>
                            <span className="ml-2 font-medium">
                              {group.pickupTime}
                  </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Events */}
            {formData.events?.enabled && formData.events?.events && formData.events.events.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-[var(--primary)]" />
                  Selected Events & Tickets
                </h3>
                
                <div className="space-y-4">
                  {formData.events.events.map((event, eventIndex) => (
                    <div key={eventIndex} className="border border-[var(--border)] rounded-xl p-4 bg-gradient-to-br from-[var(--background)]/50 to-[var(--background)]/20">
                      <div className="space-y-4">
                        {/* Event Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-[var(--muted-foreground)]">Event Name</span>
                            <p className="font-semibold text-[var(--foreground)]">{event.name}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[var(--muted-foreground)]">Event Date</span>
                            <p className="font-semibold text-[var(--foreground)]">{formatDate(event.date)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[var(--muted-foreground)]">Venue</span>
                            <p className="font-semibold text-[var(--foreground)]">
                              {typeof event.venue === 'string' 
                                ? event.venue 
                                : event.venue?.name || 'Not specified'
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[var(--muted-foreground)]">Location</span>
                            <p className="font-semibold text-[var(--foreground)]">
                              {typeof event.venue === 'object' && event.venue
                                ? `${event.venue.city || ''}, ${event.venue.country || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') || 'Not specified'
                                : 'Not specified'
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[var(--muted-foreground)]">Event Type</span>
                            <Badge variant="outline" className="capitalize">{event.type}</Badge>
                          </div>
                        </div>

                        {/* Ticket Groups */}
                        {event.groups && event.groups.length > 0 && (
                          <div className="space-y-3">
                            <span className="text-sm font-medium text-[var(--muted-foreground)]">Selected Tickets</span>
                            {event.groups.map((group, groupIndex) => (
                              <div key={groupIndex} className="p-3 bg-[var(--primary)]/5 rounded-lg border border-[var(--primary)]/20">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <span className="text-sm font-medium text-[var(--muted-foreground)]">Ticket Type</span>
                                    <p className="font-semibold text-[var(--foreground)]">
                                      {group.ticketDetails?.categoryName || group.ticketType || 'Standard Ticket'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-[var(--muted-foreground)]">Quantity</span>
                                    <p className="font-semibold text-[var(--foreground)]">{group.tickets || 1} ticket(s)</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-[var(--muted-foreground)]">Price</span>
                                    <p className="font-semibold text-[var(--foreground)]">
                                      {group.ticketDetails?.price && group.ticketDetails?.currency 
                                        ? `${formatCurrency(group.ticketDetails.price, group.ticketDetails.currency)} per ticket`
                                        : 'Price not available'
                                      }
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Additional Ticket Details */}
                                {(group.ticketDetails?.seatType || group.ticketDetails?.availability || group.ticketDetails?.notes) && (
                                  <div className="mt-3 pt-3 border-t border-[var(--primary)]/20">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {group.ticketDetails?.seatType && (
                                        <div>
                                          <span className="text-xs font-medium text-[var(--muted-foreground)]">Seat Type</span>
                                          <p className="text-sm text-[var(--foreground)]">{group.ticketDetails.seatType}</p>
                                        </div>
                                      )}
                                      {group.ticketDetails?.availability && (
                                        <div>
                                          <span className="text-xs font-medium text-[var(--muted-foreground)]">Availability</span>
                                          <Badge variant={group.ticketDetails.availability === 'Available' ? 'default' : 'secondary'} className="text-xs">
                                            {group.ticketDetails.availability}
                                          </Badge>
                                        </div>
                                      )}
                                      {group.ticketDetails?.notes && (
                                        <div className="md:col-span-2">
                                          <span className="text-xs font-medium text-[var(--muted-foreground)]">Notes</span>
                                          <p className="text-sm text-[var(--foreground)]">{group.ticketDetails.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          {(flightPrice > 0 || hotelPrice > 0 || transferPrice > 0 || eventPrice > 0) && (
            <div className="space-y-6">
              <Separator className="bg-[var(--border)]" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[var(--primary)]" />
                  Price Breakdown
                </h3>
                
                <div className="space-y-3">
                  {/* Flights */}
                  {flightPrice > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-[var(--muted)]/10 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Plane className="h-4 w-4 text-[var(--primary)]" />
                          <span className="font-medium text-[var(--foreground)]">Flights</span>
                          <span className="text-sm text-[var(--muted-foreground)]">
                            {formData.tripDetails?.totalTravelers?.adults || 1} traveler(s)
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[var(--foreground)]">
                            {formatCurrency(flightPrice, preferredCurrency)}
                          </div>
                        </div>
                      </div>
                      {/* Flight Details */}
                      {calculateFlightPrice().details.map((detail, index) => (
                        <div key={index} className="ml-8 p-2 bg-[var(--background)]/50 rounded-lg border border-[var(--border)]/50">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">
                              {detail.cabinClass.charAt(0).toUpperCase() + detail.cabinClass.slice(1)} Class
                            </span>
                            <div className="text-right">
                              <div className="text-[var(--muted-foreground)]">
                                {formatCurrency(detail.pricePerPerson, preferredCurrency)} × {detail.travelers} = {formatCurrency(detail.subtotal, preferredCurrency)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hotels */}
                  {hotelPrice > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-[var(--muted)]/10 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-[var(--primary)]" />
                          <span className="font-medium text-[var(--foreground)]">Hotels</span>
                          <span className="text-sm text-[var(--muted-foreground)]">
                            {formData.tripDetails?.duration || 1} night(s)
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[var(--foreground)]">
                            {formatCurrency(hotelPrice, preferredCurrency)}
                          </div>
                        </div>
                      </div>
                      {/* Hotel Details */}
                      {calculateHotelPrice().details.map((detail, index) => (
                        <div key={index} className="ml-8 p-2 bg-[var(--background)]/50 rounded-lg border border-[var(--border)]/50">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">
                              {detail.starRating}★ Hotel
                            </span>
                            <div className="text-right">
                              <div className="text-[var(--muted-foreground)]">
                                {formatCurrency(detail.pricePerRoom, preferredCurrency)} × {detail.rooms} room(s) × {detail.nights} night(s) = {formatCurrency(detail.subtotal, preferredCurrency)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transfers */}
                  {transferPrice > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-[var(--muted)]/10 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Car className="h-4 w-4 text-[var(--primary)]" />
                          <span className="font-medium text-[var(--foreground)]">Transfers</span>
                          <span className="text-sm text-[var(--muted-foreground)]">
                            {(() => {
                              let transferCount = 0;
                              formData.transfers?.groups?.forEach(group => {
                                if (group.arrivalTransfer) transferCount++;
                                if (group.departureTransfer) transferCount++;
                              });
                              return `${transferCount} transfer(s)`;
                            })()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[var(--foreground)]">
                            {formatCurrency(transferPrice, preferredCurrency)}
                          </div>
                        </div>
                      </div>
                      {/* Transfer Details */}
                      {calculateTransferPrice().details.map((detail, index) => (
                        <div key={index} className="ml-8 p-2 bg-[var(--background)]/50 rounded-lg border border-[var(--border)]/50">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">
                              {detail.vehicleType.charAt(0).toUpperCase() + detail.vehicleType.slice(1)} Transfer
                            </span>
                            <div className="text-right">
                              <div className="text-[var(--muted-foreground)]">
                                {formatCurrency(detail.pricePerTransfer, preferredCurrency)} × {detail.transfers} = {formatCurrency(detail.subtotal, preferredCurrency)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Events */}
                  {eventPrice > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-[var(--muted)]/10 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Ticket className="h-4 w-4 text-[var(--primary)]" />
                          <span className="font-medium text-[var(--foreground)]">Events</span>
                          <span className="text-sm text-[var(--muted-foreground)]">
                            {(() => {
                              let ticketCount = 0;
                              formData.events?.events?.forEach(event => {
                                event.groups?.forEach(group => {
                                  ticketCount += group.tickets || 0;
                                });
                              });
                              return `${ticketCount} ticket(s)`;
                            })()}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[var(--foreground)]">
                            {formatCurrency(eventPrice, preferredCurrency)}
                          </div>
                        </div>
                      </div>
                      {/* Event Details */}
                      {calculateEventPrice().details.map((detail, index) => (
                        <div key={index} className="ml-8 p-2 bg-[var(--background)]/50 rounded-lg border border-[var(--border)]/50">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">
                              {detail.eventName}
                            </span>
                            <div className="text-right">
                              <div className="text-[var(--muted-foreground)]">
                                {formatCurrency(detail.ticketPrice, preferredCurrency)} × {detail.quantity} = {formatCurrency(detail.subtotal, preferredCurrency)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/20">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-[var(--primary)]" />
                    <span className="text-lg font-semibold text-[var(--foreground)]">Total Estimated Cost</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-[var(--primary)]">
                      {formatCurrency(totalPrice, preferredCurrency)}
                    </span>
                  </div>
                </div>

                {/* Currency Conversion Notice */}
                {preferredCurrency !== 'GBP' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <div className="text-sm text-blue-800">
                        <span className="font-medium">Currency Conversion:</span> All prices have been converted from GBP to {preferredCurrency} with a 2% spread to cover exchange charges and processing fees. Original prices are shown for reference.
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Disclaimer */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <div className="text-sm text-amber-800">
                      <span className="font-medium">Price Estimate:</span> These are estimated costs based on current market rates. 
                      Final pricing may vary based on availability, seasonal rates, and specific booking requirements.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {(quoteError || quoteService.error) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {quoteError || quoteService.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onExportPDF}
              disabled={disabled || !isComplete}
              className="h-12 px-6 rounded-xl border-[var(--border)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/30"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              type="button"
              onClick={handleGenerateQuote}
              disabled={disabled || !isComplete || generatingQuote}
              className="h-12 px-6 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]"
            >
              {generatingQuote ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Quote...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Quote
                </>
              )}
            </Button>
          </div>

      {/* Status Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex justify-between items-center pt-6"
      >
        <div className="text-sm text-[var(--muted-foreground)]">
          {isComplete 
                ? 'Essential information complete - ready to generate quote and itinerary'
                : 'Please complete client information, trip details, and preferences to proceed'
          }
        </div>
        
        <div className="flex items-center gap-2">
          {isComplete && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
            </Badge>
          )}
        </div>
      </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 