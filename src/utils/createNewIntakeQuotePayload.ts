import { NewIntake } from '@/types/newIntake';
import { QuoteInput } from '@/utils/createQuotePayload';
import { TripIntake } from '@/types/newIntake';
import { TripPreferences } from '@/lib/gemini';

export function createNewIntakeQuotePayload(formData: NewIntake): QuoteInput {
  // Extract client information
  const client = formData.client;
  
  // Extract trip details
  const tripDetails = formData.tripDetails;
  
  // Extract preferences
  const preferences = formData.preferences;
  
  // Extract selected components
  const flights = formData.flights;
  const hotels = formData.hotels;
  const transfers = formData.transfers;
  const events = formData.events;

  // Calculate total travelers
  const totalTravelers = (tripDetails?.totalTravelers?.adults || 0) + (tripDetails?.totalTravelers?.children || 0);

  // Extract selected flight data
  const selectedFlights = flights?.enabled && flights.groups ? 
    flights.groups
      .filter(group => group.selectedFlight)
      .map(group => ({
        groupId: group.groupId,
        originAirport: group.originAirport,
        destinationAirport: group.destinationAirport,
        cabinClass: group.cabinClass,
        selectedFlight: {
          recommendationId: group.selectedFlight?.recommendationId,
          routing: group.selectedFlight?.routing,
          total: group.selectedFlight?.convertedTotal || group.selectedFlight?.total,
          currency: group.selectedFlight?.convertedCurrency || group.selectedFlight?.currency,
          airline: group.selectedFlight?.airline,
          flightNumber: group.selectedFlight?.flightNumber,
          departureTime: group.selectedFlight?.departureTime,
          arrivalTime: group.selectedFlight?.arrivalTime,
        }
      })) : [];

  // Debug logging for flight data
  console.log('🔍 Flight data debug:', {
    flightsEnabled: flights?.enabled,
    flightGroups: flights?.groups,
    selectedFlights,
    selectedFlightsCount: selectedFlights.length,
    // Add detailed logging for each group
    groupDetails: flights?.groups?.map(group => ({
      groupId: group.groupId,
      hasSelectedFlight: !!group.selectedFlight,
      selectedFlightData: group.selectedFlight,
      originAirport: group.originAirport,
      destinationAirport: group.destinationAirport,
      cabinClass: group.cabinClass
    }))
  });

  // Extract selected hotel data
  const selectedHotels = hotels?.enabled && hotels.groups ?
    hotels.groups
      .filter(group => group.selectedHotel)
      .map(group => ({
        groupId: group.groupId,
        destinationCity: group.destinationCity,
        numberOfRooms: group.numberOfRooms,
        roomTypes: group.roomTypes,
        starRating: group.starRating,
        selectedHotel: {
          hotelId: group.selectedHotel?.hotelId,
          hotelName: group.selectedHotel?.hotelName,
          pricePerNight: group.selectedHotel?.convertedPricePerNight || group.selectedHotel?.pricePerNight,
          currency: group.selectedHotel?.convertedCurrency || group.selectedHotel?.currency,
          roomType: group.selectedHotel?.roomType,
          checkIn: group.selectedHotel?.checkIn,
          checkOut: group.selectedHotel?.checkOut,
        }
      })) : [];

  // Extract selected event data
  const selectedEvents = events?.enabled && events.events ?
    events.events
      .filter(event => event.groups?.some(group => group.ticketDetails))
      .map(event => ({
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventVenue: event.venue,
        eventType: event.type,
        groups: event.groups?.filter(group => group.ticketDetails).map(group => ({
          groupId: group.groupId,
          tickets: group.tickets,
          seatPreference: group.seatPreference,
          ticketDetails: {
            categoryName: group.ticketDetails?.categoryName,
            price: group.ticketDetails?.convertedPrice || group.ticketDetails?.price,
            currency: group.ticketDetails?.convertedCurrency || group.ticketDetails?.currency,
            availableQuantity: group.ticketDetails?.availableQuantity,
            immediateConfirmation: group.ticketDetails?.immediateConfirmation,
            restrictions: group.ticketDetails?.restrictions,
            importantNotes: group.ticketDetails?.importantNotes,
          }
        }))
      })) : [];

  // Create special requests based on selected components with detailed information
  const specialRequests = [];
  
  if (selectedFlights.length > 0) {
    const flightDetails = selectedFlights.map(flight => 
      `${flight.originAirport}-${flight.destinationAirport} (${flight.cabinClass})`
    ).join(', ');
    specialRequests.push(`SELECTED FLIGHTS: ${flightDetails}`);
  }
  
  if (selectedHotels.length > 0) {
    const hotelDetails = selectedHotels.map(hotel => 
      `${hotel.selectedHotel.hotelName} (${hotel.numberOfRooms} room(s), ${hotel.starRating}★)`
    ).join(', ');
    specialRequests.push(`SELECTED HOTELS: ${hotelDetails}`);
  }
  
  if (transfers?.enabled && transfers.groups?.length) {
    const transferDetails = transfers.groups.map(group => {
      const types = [];
      if (group.arrivalTransfer) types.push('arrival');
      if (group.departureTransfer) types.push('departure');
      return `${group.vehicleType} (${types.join(', ')})`;
    }).join(', ');
    specialRequests.push(`SELECTED TRANSFERS: ${transferDetails}`);
  }
  
  if (selectedEvents.length > 0) {
    const eventDetails = selectedEvents.map(event => 
      `${event.eventName} (${event.groups?.reduce((total, group) => total + (group.tickets || 0), 0)} tickets)`
    ).join(', ');
    specialRequests.push(`SELECTED EVENTS: ${eventDetails}`);
  }

  // Add any existing special requests
  if (preferences?.specialRequests) {
    specialRequests.push(preferences.specialRequests);
  }

  const combinedSpecialRequests = specialRequests.join(' ');

  // Calculate total cost from selected components
  let totalSelectedCost = 0;
  const preferredCurrency = preferences?.currency || 'GBP';

  // Add flight costs
  selectedFlights.forEach(flight => {
    if (flight.selectedFlight.total) {
      totalSelectedCost += flight.selectedFlight.total;
    }
  });

  // Add hotel costs
  const tripDuration = tripDetails?.duration || 1;
  selectedHotels.forEach(hotel => {
    if (hotel.selectedHotel.pricePerNight) {
      totalSelectedCost += hotel.selectedHotel.pricePerNight * hotel.numberOfRooms * tripDuration;
    }
  });

  // Add event costs
  selectedEvents.forEach(event => {
    event.groups?.forEach(group => {
      if (group.ticketDetails?.price && group.tickets) {
        totalSelectedCost += group.ticketDetails.price * group.tickets;
      }
    });
  });

  // Create the quote payload
  const quotePayload: QuoteInput = {
    clientId: client?.id,
    tripDetails: {
      clientName: client ? `${client.firstName} ${client.lastName}` : 'Not specified',
      clientEmail: client?.email || 'Not specified',
      clientPhone: client?.phone || 'Not specified',
      clientAddress: {
        street: client?.address?.street || '',
        city: client?.address?.city || '',
        state: client?.address?.state || '',
        zipCode: client?.address?.zipCode || '',
        country: client?.address?.country || '',
      },
      destination: tripDetails?.primaryDestination || 'Not specified',
      startDate: tripDetails?.startDate || '',
      endDate: tripDetails?.endDate || '',
      numberOfTravelers: totalTravelers,
    },
    preferences: {
      tone: preferences?.tone || 'luxury',
      interests: preferences?.travelPriorities || [],
      pace: 'moderate', // Default since pace is not in new intake
      accommodationType: ['hotel'], // Default since accommodation type is not in new intake
      diningPreferences: [], // Default since dining preferences are not in new intake
      specialRequests: combinedSpecialRequests || undefined,
    },
    budget: {
      amount: totalSelectedCost > 0 ? totalSelectedCost : (preferences?.budget?.amount || 0),
      currency: preferredCurrency,
      travelClass: 'economy', // Default since travel class is not in new intake
    },
    includeInventory: {
      flights: flights?.enabled || false,
      hotels: hotels?.enabled || false,
      events: events?.enabled || false,
    },
    filters: {
      flightFilters: undefined, // Not available in new intake
      hotelFilters: undefined, // Not available in new intake
      eventFilters: undefined, // Not available in new intake
    },
    agentContext: {
      marginOverride: 0.15, // Default 15% margin
      commissionRate: 0.10, // Default 10% commission
      currency: preferredCurrency,
    },
    // Include selected components with actual data
    selectedEvent: selectedEvents.length > 0 ? {
      id: selectedEvents[0].eventId,
      name: selectedEvents[0].eventName,
      dateOfEvent: selectedEvents[0].eventDate,
      venue: {
        name: selectedEvents[0].eventVenue || 'Not specified',
        city: tripDetails?.primaryDestination || 'Not specified',
        country: 'Not specified',
      },
    } : undefined,
    selectedTicket: selectedEvents.length > 0 && selectedEvents[0].groups?.length ? {
      id: selectedEvents[0].groups[0].groupId,
      categoryName: selectedEvents[0].groups[0].ticketDetails?.categoryName || 'General',
      price: selectedEvents[0].groups[0].ticketDetails?.price || 0,
      currency: selectedEvents[0].groups[0].ticketDetails?.currency || preferredCurrency,
      available: selectedEvents[0].groups[0].ticketDetails?.availableQuantity ? selectedEvents[0].groups[0].ticketDetails.availableQuantity > 0 : true,
    } : undefined,
    selectedFlights: selectedFlights.length > 0 ? selectedFlights.map(flight => ({
      originAirport: flight.originAirport,
      destinationAirport: flight.destinationAirport,
      cabinClass: flight.cabinClass,
      airline: flight.selectedFlight?.airline,
      flightNumber: flight.selectedFlight?.flightNumber,
      departureTime: flight.selectedFlight?.departureTime,
      arrivalTime: flight.selectedFlight?.arrivalTime,
      total: flight.selectedFlight?.total || 0,
      currency: flight.selectedFlight?.currency || preferredCurrency,
    })) : undefined,
    selectedHotels: selectedHotels.length > 0 ? selectedHotels.map(hotel => ({
      hotelName: hotel.selectedHotel?.hotelName || 'Selected Hotel',
      destinationCity: hotel.destinationCity,
      numberOfRooms: hotel.numberOfRooms,
      roomTypes: hotel.roomTypes,
      starRating: hotel.starRating,
      pricePerNight: hotel.selectedHotel?.pricePerNight || 0,
      currency: hotel.selectedHotel?.currency || preferredCurrency,
      checkIn: hotel.selectedHotel?.checkIn,
      checkOut: hotel.selectedHotel?.checkOut,
    })) : undefined,
    selectedHotel: selectedHotels.length > 0 ? {
      hotel: {
        id: selectedHotels[0].selectedHotel.hotelId || 'unknown',
        name: selectedHotels[0].selectedHotel.hotelName || 'Selected Hotel',
        rating: selectedHotels[0].starRating || 3,
        stars: selectedHotels[0].starRating || 3,
        address: {
          country: 'Not specified',
          city: selectedHotels[0].destinationCity || 'Not specified',
          street: 'Not specified',
          zip: 'Not specified',
        },
        location: {
          latitude: 0,
          longitude: 0,
        },
        images: [],
        amenities: [],
        description: 'Hotel selected from intake form',
      },
      room: {
        id: 'selected-room',
        name: selectedHotels[0].selectedHotel.roomType || 'Standard Room',
        type: selectedHotels[0].selectedHotel.roomType || 'standard',
        capacity: {
          adults: tripDetails?.totalTravelers?.adults || 1,
          children: tripDetails?.totalTravelers?.children || 0,
        },
        price: {
          amount: selectedHotels[0].selectedHotel.pricePerNight || 0,
          currency: selectedHotels[0].selectedHotel.currency || preferredCurrency,
          originalAmount: selectedHotels[0].selectedHotel.pricePerNight || 0,
        },
        cancellationPolicy: 'Standard cancellation policy',
        boardType: 'Room Only',
        refundable: true,
        available: true,
      },
      selectedAt: new Date().toISOString(),
    } : undefined,
    packageComponents: {
      selectedItems: [
        ...selectedFlights.map(f => `Flight: ${f.originAirport}-${f.destinationAirport}`),
        ...selectedHotels.map(h => `Hotel: ${h.selectedHotel.hotelName}`),
        ...selectedEvents.map(e => `Event: ${e.eventName}`),
      ],
      aiAnalysis: `Generated from new intake form with ${selectedFlights.length} flights, ${selectedHotels.length} hotels, and ${selectedEvents.length} events selected.`,
      recommendations: [],
    },
  };

  // Debug logging for final quote payload
  console.log('🔍 Final quote payload debug:', {
    hasSelectedFlights: !!quotePayload.selectedFlights,
    selectedFlightsCount: quotePayload.selectedFlights?.length || 0,
    selectedFlightsData: quotePayload.selectedFlights,
    hasSelectedHotels: !!quotePayload.selectedHotels,
    selectedHotelsCount: quotePayload.selectedHotels?.length || 0,
    selectedHotelsData: quotePayload.selectedHotels,
    hasSelectedEvent: !!quotePayload.selectedEvent,
    hasSelectedTicket: !!quotePayload.selectedTicket,
    totalSelectedCost,
    specialRequests: quotePayload.preferences.specialRequests
  });

  return quotePayload;
} 