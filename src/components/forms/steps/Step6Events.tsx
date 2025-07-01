import { useFormContext, Controller } from 'react-hook-form';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn, convertCurrency, formatCurrency } from '@/lib/utils';
import { useNewIntakeStore } from '@/store/newIntake';
import { EventType, SeatPreference } from '@/types/newIntake';
import { toast } from 'sonner';

const eventTypesList = [
  { label: 'Concerts', value: 'concerts' },
  { label: 'Sports', value: 'sports' },
  { label: 'Theater', value: 'theater' },
  { label: 'Festivals', value: 'festivals' },
  { label: 'Exhibitions', value: 'exhibitions' },
];

// Helper to fetch all countries from Sports Events 365 API
async function fetchCountries() {
  // Check cache first
  const cached = localStorage.getItem('sports365_countries');
  const cacheTime = localStorage.getItem('sports365_countries_time');
  
  // Cache is valid for 24 hours, but only if it has more than 50 countries (to avoid old limited cache)
  if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 24 * 60 * 60 * 1000) {
    const cachedCountries = JSON.parse(cached);
    if (cachedCountries.length > 50) {
      return cachedCountries;
    } else {
      // Clear old limited cache
      localStorage.removeItem('sports365_countries');
      localStorage.removeItem('sports365_countries_time');
    }
  }

  const API_KEY = import.meta.env.VITE_SPORTSEVENTS365_API_KEY || '';
  const USERNAME = import.meta.env.VITE_SPORTSEVENTS365_USERNAME || '';
  const PASSWORD = import.meta.env.VITE_SPORTSEVENTS365_PASSWORD || '';
  
  // Create Base64 encoded credentials
  const credentials = btoa(`${USERNAME}:${PASSWORD}`);
  
  let allCountries: any[] = [];
  let currentPage = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    const url = `https://api-v2.sandbox365.com/countries?apiKey=${API_KEY}&page=${currentPage}`;
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch countries page ${currentPage}: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    const pageCountries = data.data || [];
    allCountries = [...allCountries, ...pageCountries];
    
    // Check if there are more pages
    hasMorePages = data.meta?.current_page < data.meta?.last_page;
    currentPage++;
    
    // Add a small delay to avoid overwhelming the API
    if (hasMorePages) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Cache the results
  localStorage.setItem('sports365_countries', JSON.stringify(allCountries));
  localStorage.setItem('sports365_countries_time', Date.now().toString());
  
  return allCountries;
}

// Helper to fetch cities by country ID
async function fetchCitiesByCountry(countryId: string) {
  // Check cache first
  const cacheKey = `sports365_cities_${countryId}`;
  const cached = localStorage.getItem(cacheKey);
  const cacheTime = localStorage.getItem(`${cacheKey}_time`);
  
  // Cache is valid for 24 hours
  if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 24 * 60 * 60 * 1000) {
    return JSON.parse(cached);
  }

  const API_KEY = import.meta.env.VITE_SPORTSEVENTS365_API_KEY || '';
  const USERNAME = import.meta.env.VITE_SPORTSEVENTS365_USERNAME || '';
  const PASSWORD = import.meta.env.VITE_SPORTSEVENTS365_PASSWORD || '';
  
  // Create Base64 encoded credentials
  const credentials = btoa(`${USERNAME}:${PASSWORD}`);
  
  const url = `https://api-v2.sandbox365.com/countries/${countryId}/city?apiKey=${API_KEY}`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch cities: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json();
  
  // Handle different possible response structures
  let cities = [];
  if (Array.isArray(data)) {
    cities = data;
  } else if (Array.isArray(data.data)) {
    cities = data.data;
  } else if (Array.isArray(data.cities)) {
    cities = data.cities;
  } else if (data && typeof data === 'object') {
    if (data.data && typeof data.data === 'object' && data.data.id) {
      cities = [data.data];
    } else if (data.id) {
      cities = [data];
    }
  }
  
  // Cache the results
  localStorage.setItem(cacheKey, JSON.stringify(cities));
  localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
  
  return cities;
}

// Helper to fetch events by city ID
async function fetchEventsByCity(cityId: string) {
  const API_KEY = import.meta.env.VITE_SPORTSEVENTS365_API_KEY || '';
  const USERNAME = import.meta.env.VITE_SPORTSEVENTS365_USERNAME || '';
  const PASSWORD = import.meta.env.VITE_SPORTSEVENTS365_PASSWORD || '';
  
  // Create Base64 encoded credentials
  const credentials = btoa(`${USERNAME}:${PASSWORD}`);
  
  const url = `https://api-v2.sandbox365.com/events/city/${cityId}?apiKey=${API_KEY}`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json();
  
  // Handle different possible response structures
  let events = [];
  if (Array.isArray(data)) {
    events = data;
  } else if (Array.isArray(data.data)) {
    events = data.data;
  } else if (Array.isArray(data.events)) {
    events = data.events;
  } else if (data && typeof data === 'object') {
    if (data.data && typeof data.data === 'object' && data.data.id) {
      events = [data.data];
    } else if (data.id) {
      events = [data];
    }
  }
  
  return events;
}

// Helper to fetch tickets by event ID
async function fetchTicketsByEvent(eventId: string) {
  const API_KEY = import.meta.env.VITE_SPORTSEVENTS365_API_KEY || '';
  const USERNAME = import.meta.env.VITE_SPORTSEVENTS365_USERNAME || '';
  const PASSWORD = import.meta.env.VITE_SPORTSEVENTS365_PASSWORD || '';
  
  // Create Base64 encoded credentials
  const credentials = btoa(`${USERNAME}:${PASSWORD}`);
  
  const url = `https://api-v2.sandbox365.com/tickets/${eventId}?apiKey=${API_KEY}`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch tickets: ${res.status} ${res.statusText}`);
  }
  
  const data = await res.json();
  
  // Handle different possible response structures
  let tickets = [];
  if (Array.isArray(data)) {
    tickets = data;
  } else if (Array.isArray(data.data)) {
    tickets = data.data;
  } else if (Array.isArray(data.tickets)) {
    tickets = data.tickets;
  } else if (data && typeof data === 'object') {
    if (data.data && typeof data.data === 'object' && data.data.id) {
      tickets = [data.data];
    } else if (data.id) {
      tickets = [data];
    }
  }
  
  return tickets;
}

function normalizeDate(dateStr: string) {
  if (!dateStr) return '';
  
  // Handle different possible date formats
  console.log('Normalizing date:', dateStr);
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // If it's in DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If it's in MM/DD/YYYY format (US format)
  if (dateStr.includes('/') && dateStr.split('/')[0].length <= 2) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  // Try to parse as ISO date string
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn('Could not parse date:', dateStr);
  }
  
  console.warn('Unknown date format:', dateStr);
  return dateStr; // Return as is if we can't parse it
}

// Filter events by trip date range
function isEventInRange(event: any, startDate: string, endDate: string) {
  if (!startDate || !endDate || !event.dateOfEvent) {
    return true; // If no dates are set, show all events
  }
  
  const eventDate = normalizeDate(event.dateOfEvent);
  
  // Debug logging for date comparison
  console.log('Date comparison:', {
    eventDate,
    startDate,
    endDate,
    eventName: event.name,
    isInRange: eventDate >= startDate && eventDate <= endDate
  });
  
  return eventDate >= startDate && eventDate <= endDate;
}

export function Step6Events() {
  const form = useFormContext();
  const { addEvent, toggleSection } = useNewIntakeStore();
  
  // Check if this is the new proposal form
  const isNewProposalForm = form && form.formState && 'tripDetails' in form.getValues();
  
  // Try to get dates from different possible field structures - prioritize tripDetails fields
  const startDate = form.watch('tripDetails.startDate') || form.watch('travelerInfo.startDate') || form.watch('startDate');
  const endDate = form.watch('tripDetails.endDate') || form.watch('travelerInfo.endDate') || form.watch('endDate');
  
  // Get primary destination for auto-selection
  const primaryDestination = form.watch('tripDetails.primaryDestination');

  // Get traveler count for quantity limits
  const totalTravelers = (() => {
    if (isNewProposalForm) {
      const adults = form.watch('tripDetails.totalTravelers.adults') || 0;
      const children = form.watch('tripDetails.totalTravelers.children') || 0;
      return adults + children;
    } else {
      const adults = form.watch('travelerInfo.travelers.adults') || 0;
      const children = form.watch('travelerInfo.travelers.children') || 0;
      return adults + children;
    }
  })();

  console.log('🔍 Step6Events - Traveler count debug:', {
    isNewProposalForm,
    tripDetailsAdults: form.watch('tripDetails.totalTravelers.adults'),
    tripDetailsChildren: form.watch('tripDetails.totalTravelers.children'),
    travelerInfoAdults: form.watch('travelerInfo.travelers.adults'),
    travelerInfoChildren: form.watch('travelerInfo.travelers.children'),
    calculatedTotalTravelers: totalTravelers
  });

  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // For NewProposal form, we'll use local state instead of form fields
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  
  // Auto-selection state
  const [autoSelectedCountry, setAutoSelectedCountry] = useState<string>('');
  const [autoSelectedCity, setAutoSelectedCity] = useState<string>('');
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);

  // State for storing selected event and ticket data
  const [selectedEventData, setSelectedEventData] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  // State for ticket quantities
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});

  // Helper function to calculate quantity limits for a ticket
  const getQuantityLimits = (ticket: any) => {
    const minQuantity = 1;
    
    // Get available quantity from the ticket's availableSellingQuantities
    // The availableSellingQuantities array contains the quantities that can be purchased
    // For example: [1, 2, 3, 4] means you can buy 1, 2, 3, or 4 tickets
    const availableQuantities = ticket.availableSellingQuantities || [1];
    const maxAvailableQuantity = Math.max(...availableQuantities);
    
    // The maximum should be the minimum of:
    // 1. Total travelers (can't buy more tickets than travelers)
    // 2. Maximum available selling quantity (can't buy more than available)
    const maxQuantity = Math.min(totalTravelers, maxAvailableQuantity);
    
    console.log('🔍 Quantity limits debug:', {
      ticketId: ticket.id,
      totalTravelers,
      availableQuantities,
      maxAvailableQuantity,
      ticketQuantity: ticket.quantity,
      calculatedMax: maxQuantity,
      availableSellingQuantities: ticket.availableSellingQuantities
    });
    
    return { minQuantity, maxQuantity };
  };

  // Helper function to get current quantity for a ticket
  const getCurrentQuantity = (ticketId: string) => {
    return ticketQuantities[ticketId] || 1;
  };

  // Helper function to update quantity for a ticket
  const updateTicketQuantity = (ticketId: string, quantity: number) => {
    setTicketQuantities(prev => ({
      ...prev,
      [ticketId]: quantity
    }));
  };

  // Function to find matching country and city based on primary destination
  const findMatchingLocation = useCallback((destination: string, countriesList: any[]) => {
    if (!destination || !countriesList.length) return null;
    
    console.log('Looking for matches for destination:', destination);
    
    // Normalize the destination string for better matching
    const normalizedDest = destination.toLowerCase().trim();
    
    // Try to extract country and city from destination string
    const parts = destination.split(',').map(part => part.trim());
    const city = parts[0];
    const country = parts[parts.length - 1]; // Last part is usually the country
    
    console.log('Extracted city:', city, 'country:', country);
    
    // First, try to find exact country match
    let matchedCountry = countriesList.find(c => 
      c.name.toLowerCase() === country.toLowerCase() ||
      c.name.toLowerCase().includes(country.toLowerCase()) ||
      country.toLowerCase().includes(c.name.toLowerCase())
    );
    
    // If no exact match, try partial matches
    if (!matchedCountry) {
      matchedCountry = countriesList.find(c => 
        c.name.toLowerCase().includes(country.toLowerCase()) ||
        country.toLowerCase().includes(c.name.toLowerCase())
      );
    }
    
    // If still no match, try to find by city name in country names (for cases like "New York, USA")
    if (!matchedCountry) {
      matchedCountry = countriesList.find(c => 
        c.name.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(c.name.toLowerCase())
      );
    }
    
    if (matchedCountry) {
      console.log('Found matching country:', matchedCountry.name);
      return { country: matchedCountry, city: city };
    }
    
    console.log('No matching country found');
    return null;
  }, []);

  // Auto-select country and city when countries are loaded and primary destination is available
  useEffect(() => {
    if (countries.length > 0 && primaryDestination && !autoSelectedCountry) {
      setIsAutoSelecting(true);
      
      const match = findMatchingLocation(primaryDestination, countries);
      if (match) {
        console.log('Auto-selecting country:', match.country.name);
        setAutoSelectedCountry(match.country.id.toString());
        
        // For NewProposal form, update local state
        if (isNewProposalForm) {
          setSelectedCountryId(match.country.id.toString());
        } else {
          // For IntakeForm, update form field
          (form as any).setValue('eventCountryId', match.country.id.toString());
        }
        
        // Try to find matching city after cities are loaded
        setAutoSelectedCity(match.city);
      }
      
      setIsAutoSelecting(false);
    }
  }, [countries, primaryDestination, autoSelectedCountry, findMatchingLocation, isNewProposalForm, form]);

  // Auto-select city when cities are loaded
  useEffect(() => {
    if (cities.length > 0 && autoSelectedCity && !selectedCityId) {
      console.log('Looking for matching city:', autoSelectedCity, 'in cities:', cities);
      
      // Try to find exact city match
      let matchedCity = cities.find(c => 
        c.name.toLowerCase() === autoSelectedCity.toLowerCase()
      );
      
      // If no exact match, try partial matches
      if (!matchedCity) {
        matchedCity = cities.find(c => 
          c.name.toLowerCase().includes(autoSelectedCity.toLowerCase()) ||
          autoSelectedCity.toLowerCase().includes(c.name.toLowerCase())
        );
      }
      
      if (matchedCity) {
        console.log('Auto-selecting city:', matchedCity.name);
        
        // For NewProposal form, update local state
        if (isNewProposalForm) {
          setSelectedCityId(matchedCity.id.toString());
        } else {
          // For IntakeForm, update form field
          (form as any).setValue('eventCityId', matchedCity.id.toString());
        }
      }
    }
  }, [cities, autoSelectedCity, selectedCityId, isNewProposalForm, form]);

  // Handle ticket selection - automatically add event when ticket is selected
  const handleTicketSelection = (ticketId: string) => {
    const newSelectedId = selectedTicketId === ticketId ? null : ticketId;
    setSelectedTicketId(newSelectedId);
    
    // Find the selected ticket and its event
    const selectedTicket = tickets.find(t => t.id.toString() === newSelectedId);
    const selectedEventData = selectedEvent;
    
    // Store the selected data for later use
    setSelectedTicket(selectedTicket);
    setSelectedEventData(selectedEventData);
    
    // Automatically add the event when a ticket is selected
    if (selectedTicket && selectedEventData) {
      // Get client's preferred currency
      const preferredCurrency = form.watch('preferences.currency') || 'GBP';
      const originalCurrency = selectedTicket.currency;
      const originalPrice = selectedTicket.price;

      // Convert price to preferred currency with 2% spread
      const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);

      // Get the chosen quantity for this ticket
      const chosenQuantity = getCurrentQuantity(ticketId);

      // Create event object according to NewIntake type structure with full ticket details
      const newEvent = {
        id: `event_${Date.now()}`,
        type: selectedEventData.type as EventType,
        name: selectedEventData.name,
        date: selectedEventData.date,
        venue: typeof selectedEventData.venue === 'string' ? selectedEventData.venue : selectedEventData.venue?.name || '',
        groups: [{
          groupId: 'default', // Default group - can be enhanced later
          tickets: chosenQuantity, // Use the chosen quantity instead of ticket.quantity
          seatPreference: selectedTicket.seatPreference as SeatPreference,
          addOns: selectedTicket.addOns || [],
          // Add full ticket details
          ticketDetails: {
            categoryName: selectedTicket.categoryName,
            categoryMain: selectedTicket.splittedCategoryName?.main,
            categorySecondary: selectedTicket.splittedCategoryName?.secondary,
            price: originalPrice,
            currency: originalCurrency,
            availableQuantity: selectedTicket.availableSellingQuantities?.length || 0,
            immediateConfirmation: selectedTicket.immediateConfirmation,
            restrictions: selectedTicket.categoryRestrictions || [],
            importantNotes: selectedTicket.importantNotes,
            purchaseAlert: selectedTicket.purchaseAlert,
            // Converted price fields
            convertedPrice: convertedPrice,
            convertedCurrency: preferredCurrency,
          },
        }],
      };

      // Debug logging for venue structure
      console.log('Event venue debug:', {
        originalVenue: selectedEventData.venue,
        venueType: typeof selectedEventData.venue,
        extractedVenue: typeof selectedEventData.venue === 'string' ? selectedEventData.venue : selectedEventData.venue?.name || '',
        finalVenue: newEvent.venue
      });

      // Add event to store
      addEvent(newEvent);
      
      // ALSO update the form data so it appears in the summary
      const currentEvents = form.getValues('events.events') || [];
      form.setValue('events.events', [...currentEvents, newEvent]);
      
      // Enable events section in both form and store
      form.setValue('events.enabled', true);
      toggleSection('events', true);
      
      // Clear selection after adding
      setSelectedEventData(null);
      setSelectedTicket(null);
      setSelectedEvent(null);
      setSelectedTicketId(null);
      
      toast.success(`Added ${selectedEventData.name} - ${selectedTicket.splittedCategoryName?.main} to your events`);
    }
  };

  // Fetch countries on mount
  useEffect(() => {
    setLoadingCountries(true);
    fetchCountries()
      .then(countries => {
        setCountries(countries);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoadingCountries(false));
  }, []);

  // Fetch cities when country changes
  useEffect(() => {
    if (!selectedCountryId) return;
    
    setLoadingCities(true);
    setCities([]);
    
    // Update form field if it exists, otherwise just update local state
    if (!isNewProposalForm) {
      (form as any).setValue('eventCityId', ''); // Reset city selection
    } else {
      setSelectedCityId(''); // Reset local state
    }
    
    fetchCitiesByCountry(selectedCountryId)
      .then(cities => {
        setCities(cities);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoadingCities(false));
  }, [selectedCountryId, countries, isNewProposalForm]);

  // Fetch events when city changes
  useEffect(() => {
    if (!selectedCityId) return;
    setLoadingEvents(true);
    setError(null);
    setSelectedEvent(null);
    setTickets([]);
    
    // Update form field if it exists, otherwise just update local state
    if (!isNewProposalForm) {
      (form as any).setValue('eventId', ''); // Reset event selection
    }
    
    fetchEventsByCity(selectedCityId)
      .then(events => {
        setEvents(events);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoadingEvents(false));
  }, [selectedCityId, isNewProposalForm]);

  // Fetch tickets when event is selected
  useEffect(() => {
    if (!selectedEvent) return;
    setLoadingTickets(true);
    setError(null);
    fetchTicketsByEvent(selectedEvent.id.toString())
      .then(tickets => {
        setTickets(tickets);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoadingTickets(false));
  }, [selectedEvent]);

  // Filter events by date
  const filteredEvents = events.filter((event: any) => isEventInRange(event, startDate, endDate));

  // Debug logging
  console.log('Step6Events Debug:', {
    startDate,
    endDate,
    totalEvents: events.length,
    filteredEvents: filteredEvents.length,
    hasDates: !!(startDate && endDate)
  });

  // If no dates are available, show all events with a warning
  const eventsToShow = startDate && endDate ? filteredEvents : events;
  const showDateWarning = !(startDate && endDate) && events.length > 0;

  // Add state for debugging - allow showing all events even when dates are set
  const [showAllEvents, setShowAllEvents] = useState(false);
  const finalEventsToShow = showAllEvents ? events : eventsToShow;

  // Get selected country name for display
  const selectedCountry = countries.find((country: any) => country.id.toString() === selectedCountryId);
  const selectedCity = cities.find((city: any) => {
    return city && city.id && city.id.toString() === selectedCityId;
  });

  return (
    <div className="space-y-8">
      <div>
        <label className="block font-medium mb-2">Select City</label>
        {isNewProposalForm ? (
          // For NewProposal form, use direct state management
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={cityOpen}
                className="w-full justify-between"
                disabled={!selectedCountryId || loadingCities}
              >
                {loadingCities ? 'Loading cities...' : 
                 selectedCity ? selectedCity.name : 'Select a city...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search cities..." />
                <CommandList>
                  <CommandEmpty>No city found.</CommandEmpty>
                  <CommandGroup>
                    {cities.map((city: any) => (
                      <CommandItem
                        key={city.id}
                        value={city.name}
                        onSelect={() => {
                          setSelectedCityId(city.id.toString());
                          setCityOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCityId === city.id.toString() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {city.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          // For IntakeForm, use Controller
          <Controller
            name="eventCityId"
            control={form.control}
            defaultValue={''}
            render={({ field }) => (
              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={cityOpen}
                    className="w-full justify-between"
                    disabled={!selectedCountryId || loadingCities}
                  >
                    {loadingCities ? 'Loading cities...' : 
                     selectedCity ? selectedCity.name : 'Select a city...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search cities..." />
                    <CommandList>
                      <CommandEmpty>No city found.</CommandEmpty>
                      <CommandGroup>
                        {cities.map((city: any) => (
                          <CommandItem
                            key={city.id}
                            value={city.name}
                            onSelect={() => {
                              field.onChange(city.id.toString());
                              setCityOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCityId === city.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {city.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          />
        )}
      </div>
      
      <div>
        <label className="block font-medium mb-2">Available Events & Tickets</label>
        {loadingEvents && <div className="text-gray-500 italic">Loading events...</div>}
        {error && <div className="text-red-500 italic">{error}</div>}
        <Controller
          name="selectedEvents"
          control={form.control}
          defaultValue={[]}
          render={({ field }) => (
            <div className="grid gap-4">
              {!loadingEvents && !error && finalEventsToShow.length === 0 && (
                <div className="text-gray-500 italic">No events found for your trip dates and city.</div>
              )}
              {finalEventsToShow.map((event: any) => {
                const isSelected = field.value?.includes(event.id);
                return (
                  <div
                    key={event.id}
                    className={`border rounded-lg p-4 bg-white/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]/10' : ''}`}
                  >
                    <div>
                      <div className="font-semibold text-lg">{event.name}</div>
                      <div className="text-sm text-gray-500">{event.dateOfEvent} {event.venue?.name && <>• {event.venue.name}</>}</div>
                    </div>
                    <div className="mt-2 md:mt-0 font-bold text-[var(--primary)] text-lg">
                      {(() => {
                        if (!event.minTicketPrice?.price) return 'See site for price';
                        
                        const preferredCurrency = form.watch('preferences.currency') || 'GBP';
                        const originalCurrency = event.minTicketPrice.currency;
                        const originalPrice = event.minTicketPrice.price;
                        
                        if (preferredCurrency !== originalCurrency) {
                          const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);
                          return formatCurrency(convertedPrice, preferredCurrency);
                        }
                        return formatCurrency(originalPrice, originalCurrency);
                      })()}
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                      >
                        {selectedEvent?.id === event.id ? 'Hide Tickets' : 'View Tickets'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        />
        
        {/* Tickets display */}
        {selectedEvent && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Tickets</h3>
            
            {loadingTickets && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading tickets...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            {!loadingTickets && !error && tickets.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <p className="text-gray-600">No tickets available for this event.</p>
              </div>
            )}
            
            {!loadingTickets && !error && tickets.length > 0 && (
              <fieldset role="radiogroup" className="space-y-3 border-0 p-0 m-0">
                {tickets.map((ticket: any) => {
                  const ticketId = ticket.id.toString();
                  const isSelected = selectedTicketId === ticketId;
                  const { minQuantity, maxQuantity } = getQuantityLimits(ticket);
                  const currentQuantity = getCurrentQuantity(ticketId);
                  
                  return (
                    <label
                      key={ticket.id}
                      htmlFor={`ticket-radio-${ticketId}`}
                      className={`block cursor-pointer bg-card border rounded-xl p-4 transition-all ${
                        isSelected
                          ? 'border-primary shadow-sm ring-1 ring-primary'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        id={`ticket-radio-${ticketId}`}
                        name="selectedTicketId"
                        value={ticketId}
                        checked={isSelected}
                        onChange={() => handleTicketSelection(ticketId)}
                        className="sr-only"
                        aria-checked={isSelected}
                      />
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <h4 className="font-semibold text-card-foreground text-lg">
                            {ticket.splittedCategoryName?.main} • {ticket.splittedCategoryName?.secondary}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {ticket.categoryName}
                          </p>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center space-x-4">
                              {ticket.availableSellingQuantities && (
                                <div className="text-sm text-muted-foreground">
                                  {ticket.availableSellingQuantities.length} tickets available
                                </div>
                              )}
                              {ticket.immediateConfirmation ? (
                                <div className="flex items-center text-sm text-accent-foreground">
                                  <span className="mr-1">●</span> Immediate Confirmation
                                </div>
                              ) : (
                                <div className="flex items-center text-sm text-primary">
                                  <span className="mr-1">●</span> Hold for 24 hours
                                </div>
                              )}
                            </div>
                            
                            {/* Quantity Selector */}
                            <div className="flex items-center space-x-3 mt-3">
                              <label className="text-sm font-medium text-muted-foreground">
                                Quantity:
                              </label>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  disabled={currentQuantity <= minQuantity}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (currentQuantity > minQuantity) {
                                      updateTicketQuantity(ticketId, currentQuantity - 1);
                                    }
                                  }}
                                >
                                  -
                                </Button>
                                <span className="text-sm font-medium min-w-[2rem] text-center">
                                  {currentQuantity}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  disabled={currentQuantity >= maxQuantity}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (currentQuantity < maxQuantity) {
                                      updateTicketQuantity(ticketId, currentQuantity + 1);
                                    }
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                (max {maxQuantity})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="text-1xl font-bold text-primary">
                            {(() => {
                              const preferredCurrency = form.watch('preferences.currency') || 'GBP';
                              const originalCurrency = ticket.currency;
                              const originalPrice = ticket.price;
                              
                              if (preferredCurrency !== originalCurrency) {
                                const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);
                                return formatCurrency(convertedPrice * currentQuantity, preferredCurrency);
                              }
                              return formatCurrency(originalPrice * currentQuantity, originalCurrency);
                            })()}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {(() => {
                              const preferredCurrency = form.watch('preferences.currency') || 'GBP';
                              const originalCurrency = ticket.currency;
                              const originalPrice = ticket.price;
                              
                              if (preferredCurrency !== originalCurrency) {
                                const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);
                                return `${formatCurrency(convertedPrice, preferredCurrency)} each`;
                              }
                              return `${formatCurrency(originalPrice, originalCurrency)} each`;
                            })()}
                          </div>
                          <span
                            className={`mt-4 px-6 py-2 rounded-full text-sm font-medium transition-all select-none ${
                              isSelected
                                ? 'bg-primary/10 text-primary border border-primary'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </div>
                      {(ticket.categoryRestrictions?.length > 0 || ticket.importantNotes || ticket.purchaseAlert) && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <button
                            className="text-sm text-primary hover:text-primary/90 flex items-center"
                            onClick={e => { e.preventDefault(); /* Toggle notes visibility */ }}
                          >
                            See important notes
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </label>
                  );
                })}
              </fieldset>
            )}
          </div>
        )}
      </div>
      
      {/* Selected Tickets Display */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Selected Tickets</h3>
        
        {/* Get selected events from form */}
        {(() => {
          const selectedEvents = form.watch('events.events') || [];
          
          if (selectedEvents.length === 0) {
            return (
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <p className="text-gray-600">No tickets selected yet.</p>
                <p className="text-sm text-gray-500 mt-1">Select tickets from the events above to add them to your trip.</p>
              </div>
            );
          }
          
          return (
            <div className="space-y-4">
              {selectedEvents.map((event: any, eventIndex: number) => (
                <div key={event.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 text-lg">{event.name}</h4>
                      <p className="text-sm text-green-700 mt-1">{event.date}</p>
                      <p className="text-sm text-green-600 mt-1">{event.venue}</p>
                      
                      {event.groups?.map((group: any, groupIndex: number) => (
                        <div key={group.groupId} className="mt-3 p-3 bg-white rounded border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-green-900">
                                {group.ticketDetails?.categoryName || 'Selected Ticket'}
                              </p>
                              <p className="text-sm text-green-700">
                                Quantity: {group.tickets} ticket{group.tickets !== 1 ? 's' : ''}
                              </p>
                              {group.ticketDetails?.categoryMain && (
                                <p className="text-sm text-green-600">
                                  {group.ticketDetails.categoryMain}
                                  {group.ticketDetails.categorySecondary && ` • ${group.ticketDetails.categorySecondary}`}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-900">
                                {(() => {
                                  const preferredCurrency = form.watch('preferences.currency') || 'GBP';
                                  const originalCurrency = group.ticketDetails?.currency || 'GBP';
                                  const originalPrice = group.ticketDetails?.price || 0;
                                  const quantity = group.tickets || 1;
                                  
                                  if (group.ticketDetails?.convertedPrice) {
                                    return formatCurrency(group.ticketDetails.convertedPrice * quantity, preferredCurrency);
                                  } else if (preferredCurrency !== originalCurrency) {
                                    const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);
                                    return formatCurrency(convertedPrice * quantity, preferredCurrency);
                                  }
                                  return formatCurrency(originalPrice * quantity, originalCurrency);
                                })()}
                              </div>
                              <div className="text-sm text-green-600">
                                {(() => {
                                  const preferredCurrency = form.watch('preferences.currency') || 'GBP';
                                  const originalCurrency = group.ticketDetails?.currency || 'GBP';
                                  const originalPrice = group.ticketDetails?.price || 0;
                                  
                                  if (group.ticketDetails?.convertedPrice) {
                                    return `${formatCurrency(group.ticketDetails.convertedPrice, preferredCurrency)} each`;
                                  } else if (preferredCurrency !== originalCurrency) {
                                    const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);
                                    return `${formatCurrency(convertedPrice, preferredCurrency)} each`;
                                  }
                                  return `${formatCurrency(originalPrice, originalCurrency)} each`;
                                })()}
                              </div>
                            </div>
                          </div>
                          
                          {/* Remove button */}
                          <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => {
                                // Remove this event from the form
                                const currentEvents = form.getValues('events.events') || [];
                                const updatedEvents = currentEvents.filter((_: any, index: number) => index !== eventIndex);
                                form.setValue('events.events', updatedEvents);
                                
                                // Also remove from store if using store
                                // This would need to be implemented based on your store structure
                                
                                toast.success(`Removed ${event.name} from selected tickets`);
                              }}
                            >
                              Remove
                </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Total summary */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-blue-900">Total Selected Tickets</h4>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-900">
                      {(() => {
                        const selectedEvents = form.watch('events.events') || [];
                        let totalCost = 0;
                        const preferredCurrency = form.watch('preferences.currency') || 'GBP';
                        
                        selectedEvents.forEach((event: any) => {
                          event.groups?.forEach((group: any) => {
                            const quantity = group.tickets || 1;
                            
                            if (group.ticketDetails?.convertedPrice) {
                              totalCost += group.ticketDetails.convertedPrice * quantity;
                            } else {
                              const originalPrice = group.ticketDetails?.price || 0;
                              const originalCurrency = group.ticketDetails?.currency || 'GBP';
                              
                              if (preferredCurrency !== originalCurrency) {
                                const convertedPrice = convertCurrency(originalPrice, originalCurrency, preferredCurrency, 0.02);
                                totalCost += convertedPrice * quantity;
                              } else {
                                totalCost += originalPrice * quantity;
                              }
                            }
                          });
                        });
                        
                        return formatCurrency(totalCost, preferredCurrency);
                      })()}
                    </div>
                    <div className="text-sm text-blue-600">
                      {(() => {
                        const selectedEvents = form.watch('events.events') || [];
                        let totalTickets = 0;
                        
                        selectedEvents.forEach((event: any) => {
                          event.groups?.forEach((group: any) => {
                            totalTickets += group.tickets || 0;
                          });
                        });
                        
                        return `${totalTickets} ticket${totalTickets !== 1 ? 's' : ''} selected`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
} 