import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QuoteResponse } from '@/lib/quoteService';
import { useQuoteService } from '@/hooks/useQuoteService';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Clock, 
  FileText, 
  Download, 
  CheckCircle, 
  Edit,
  Phone,
  Mail,
  Star,
  Plane,
  Hotel,
  Utensils,
  Camera,
  Ticket,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

export default function ViewQuote() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getQuoteById, confirmQuote, isConfirmingQuote } = useQuoteService();

  useEffect(() => {
    if (quoteId) {
      loadQuote();
    }
  }, [quoteId]);

  const loadQuote = async () => {
    if (!quoteId) return;
    
    try {
      setIsLoading(true);
      const quoteData = await getQuoteById(quoteId);
      setQuote(quoteData);
    } catch (error) {
      console.error('Failed to load quote:', error);
      toast.error('Failed to load quote details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmQuote = async () => {
    if (!quoteId) return;
    
    try {
      const bookingId = await confirmQuote(quoteId);
      if (bookingId) {
        toast.success('Quote confirmed! Booking created successfully.');
        navigate('/bookings');
      }
    } catch (error) {
      console.error('Failed to confirm quote:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Quote not found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The quote you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/quotes">
              Back to Quotes
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const itinerary = quote.generatedItinerary;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/quotes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotes
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{itinerary?.title || 'Travel Quote'}</h1>
            <p className="text-muted-foreground">
              Quote ID: {quote.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(quote.status)}>
            {quote.status}
          </Badge>
          {quote.status === 'draft' && (
            <Button onClick={handleConfirmQuote} disabled={isConfirmingQuote}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isConfirmingQuote ? 'Confirming...' : 'Confirm Quote'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Trip Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Client</p>
                    <p className="text-sm text-muted-foreground">{itinerary?.clientName || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Destination</p>
                    <p className="text-sm text-muted-foreground">{itinerary?.destination || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">{itinerary?.days?.length || 0} days</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Total Cost</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(quote.totalPrice, quote.currency)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Itinerary */}
          {itinerary?.days && itinerary.days.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daily Itinerary</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/edit-itinerary/${quote.id}`, { 
                      state: { 
                        fromQuote: true,
                        quoteData: quote,
                        itineraryData: itinerary
                      }
                    })}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Itinerary
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {itinerary.days.map((day, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold text-lg mb-3">
                        Day {index + 1} - {formatDate(day.date)}
                      </h4>
                      <div className="space-y-3">
                        {day.activities?.map((activity, activityIndex) => (
                          <div key={activityIndex} className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{activity.time}</span>
                              </div>
                              {activity.estimatedCost && (
                                <Badge variant="outline">
                                  {formatCurrency(activity.estimatedCost, quote.currency)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm mb-1">{activity.description}</p>
                            {activity.location && (
                              <p className="text-xs text-muted-foreground">
                                📍 {activity.location}
                              </p>
                            )}
                            {activity.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                💡 {activity.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget Breakdown */}
          {itinerary?.budgetBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Accommodation */}
                  {itinerary.budgetBreakdown.accommodation && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Hotel className="h-4 w-4" />
                        Accommodation
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span>Total: {formatCurrency(itinerary.budgetBreakdown.accommodation.total, quote.currency)}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(itinerary.budgetBreakdown.accommodation.perNight, quote.currency)} per night
                          </span>
                        </div>
                        {itinerary.budgetBreakdown.accommodation.hotelRecommendations?.map((hotel, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">{hotel.name}</span>
                              <span>{formatCurrency(hotel.pricePerNight, quote.currency)}</span>
                            </div>
                            <p className="text-muted-foreground">{hotel.location} • {hotel.rating}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transportation */}
                  {itinerary.budgetBreakdown.transportation && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        Transportation
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span>Total: {formatCurrency(itinerary.budgetBreakdown.transportation.total, quote.currency)}</span>
                        </div>
                        {itinerary.budgetBreakdown.transportation.breakdown?.map((transport, index) => (
                          <div key={index} className="text-sm flex justify-between">
                            <span>{transport.description}</span>
                            <span>{formatCurrency(transport.cost, quote.currency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  {itinerary.budgetBreakdown.activities && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Activities
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span>Total: {formatCurrency(itinerary.budgetBreakdown.activities.total, quote.currency)}</span>
                        </div>
                        {itinerary.budgetBreakdown.activities.breakdown?.map((activity, index) => (
                          <div key={index} className="text-sm flex justify-between">
                            <span>{activity.name}</span>
                            <span>{formatCurrency(activity.cost, quote.currency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dining */}
                  {itinerary.budgetBreakdown.dining && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        Dining
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span>Total: {formatCurrency(itinerary.budgetBreakdown.dining.total, quote.currency)}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(itinerary.budgetBreakdown.dining.perDay, quote.currency)} per day
                          </span>
                        </div>
                        {itinerary.budgetBreakdown.dining.recommendations?.map((restaurant, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">{restaurant.name}</span>
                              <span>{restaurant.priceRange}</span>
                            </div>
                            <p className="text-muted-foreground">{restaurant.cuisine} • {restaurant.location}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Flights */}
                  {quote.selectedFlights && quote.selectedFlights.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Plane className="h-4 w-4" />
                        Selected Flights
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        {quote.selectedFlights.map((flight, index) => (
                          <div key={index} className="text-sm mb-3 last:mb-0">
                            <div className="flex justify-between">
                              <span className="font-medium">{flight.originAirport} → {flight.destinationAirport}</span>
                              <span>{formatCurrency(flight.total, flight.currency)}</span>
                            </div>
                            <p className="text-muted-foreground">
                              {flight.cabinClass} Class
                              {flight.airline && ` • ${flight.airline}`}
                              {flight.flightNumber && ` • Flight ${flight.flightNumber}`}
                            </p>
                            {flight.departureTime && flight.arrivalTime && (
                              <p className="text-muted-foreground">
                                {flight.departureTime} - {flight.arrivalTime}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Hotels */}
                  {quote.selectedHotels && quote.selectedHotels.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Selected Hotels
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        {quote.selectedHotels.map((hotel, index) => (
                          <div key={index} className="text-sm mb-3 last:mb-0">
                            <div className="flex justify-between">
                              <span className="font-medium">{hotel.hotelName}</span>
                              <span>{formatCurrency(hotel.pricePerNight, hotel.currency)}/night</span>
                            </div>
                            <p className="text-muted-foreground">
                              {hotel.destinationCity}
                              {hotel.starRating && ` • ${hotel.starRating}★`}
                              {hotel.numberOfRooms > 1 && ` • ${hotel.numberOfRooms} rooms`}
                            </p>
                            <p className="text-muted-foreground">
                              {hotel.roomTypes.join(', ')}
                              {hotel.checkIn && hotel.checkOut && ` • ${hotel.checkIn} - ${hotel.checkOut}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Event Tickets */}
                  {quote.selectedEvent && quote.selectedTicket && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        Event Tickets
                      </h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span>Total: {formatCurrency(quote.selectedTicket.price * (itinerary?.numberOfTravelers || 1), quote.currency)}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(quote.selectedTicket.price, quote.selectedTicket.currency)} per person
                          </span>
                        </div>
                        <div className="text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{quote.selectedEvent.name}</span>
                            <span>{formatCurrency(quote.selectedTicket.price, quote.selectedTicket.currency)}</span>
                          </div>
                          <p className="text-muted-foreground">
                            {quote.selectedTicket.categoryName} • {formatDate(quote.selectedEvent.dateOfEvent)}
                          </p>
                          <p className="text-muted-foreground">
                            {quote.selectedEvent.venue?.name || 'Venue not specified'}, {quote.selectedEvent.venue?.city || 'Location not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Luxury Highlights */}
          {itinerary?.luxuryHighlights && itinerary.luxuryHighlights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Luxury Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {itinerary.luxuryHighlights.map((highlight, index) => (
                    <div key={index} className="border-l-4 border-primary/20 pl-4">
                      <h4 className="font-medium mb-1">{highlight.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{highlight.description}</p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Why Luxury:</strong> {highlight.whyLuxury}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Contact Information */}
          {(quote.clientEmail || quote.clientPhone || quote.clientAddress) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quote.clientEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{quote.clientEmail}</p>
                    </div>
                  </div>
                )}
                {quote.clientPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{quote.clientPhone}</p>
                    </div>
                  </div>
                )}
                {quote.clientAddress && (
                  <div>
                    <p className="text-sm font-medium mb-2">Address</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{quote.clientAddress.street}</p>
                      <p>{quote.clientAddress.city}, {quote.clientAddress.state} {quote.clientAddress.zipCode}</p>
                      <p>{quote.clientAddress.country}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quote Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge className={getStatusColor(quote.status)}>
                  {quote.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(quote.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Price</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(quote.totalPrice, quote.currency)}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button className="w-full" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Quote
                </Button>
                <Button className="w-full" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Client
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Travel Tips */}
          {itinerary?.travelTips && itinerary.travelTips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Travel Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {itinerary.travelTips.map((tip, index) => (
                    <div key={index}>
                      <h4 className="font-medium text-sm mb-2">{tip.category}</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {tip.tips.map((tipText, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{tipText}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 