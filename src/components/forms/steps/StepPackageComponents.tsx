import { useFormContext } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { gemini } from '@/lib/gemini';
import { mockFlightService } from '@/lib/services/mockFlightService';
import { mockTransferService } from '@/lib/services/mockTransferService';
import { mockHotelService } from '@/lib/services/mockHotelService';
import { getMockInsurance } from '@/lib/mockData';
import { getAirlineById, getLocationById } from '@/lib/mockData/mockFlightData';
import { TripIntake } from '@/types/trip';
import { 
  Plane, 
  Car, 
  Star, 
  CheckCircle, 
  Building,
  Sparkles,
  Loader2,
  Info,
  Shield,
  Edit3,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Clock,
  MapPin,
  Users,
  Zap,
  Award,
  Route,
  ArrowRight,
  Check,
  X,
  Plus,
  Heart,
  TrendingUp,
  DollarSign,
  CalendarDays,
  User,
  Building2,
  Car as CarIcon,
  Download,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackageComponent {
  id: string;
  type: 'outboundFlight' | 'inboundFlight' | 'hotel' | 'transfer' | 'insurance';
  title: string;
  description: string;
  price: number;
  currency: string;
  rating?: number;
  image?: string;
  data: any;
  selected: boolean;
  isSmartRecommendation?: boolean;
  aiReasoning: string;
  dates?: string;
  duration?: string;
  capacity?: number;
  amenities?: string[];
}

interface QuickAlternative {
  id: string;
  title: string;
  price: number;
  currency: string;
  data: any;
  isSmartRecommendation?: boolean;
}

interface EditModalProps {
  component: PackageComponent;
  allOptions: any[];
  onSelect: (option: any) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function StepPackageComponents() {
  const form = useFormContext<TripIntake>();
  const [selectedComponent, setSelectedComponent] = useState<PackageComponent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableData, setAvailableData] = useState<any>({});
  const [smartDefaults, setSmartDefaults] = useState<PackageComponent[]>([]);
  const [alternatives, setAlternatives] = useState<PackageComponent[]>([]);
  const [showTravelerAssignment, setShowTravelerAssignment] = useState<string | null>(null);

  // Get form data
  const travelerInfo = form.watch('travelerInfo');
  const destinations = form.watch('destinations');
  const style = form.watch('style');
  const experience = form.watch('experience');
  const budget = form.watch('budget');
  const individualTravelers = form.watch('travelerInfo.individualTravelers') || [];
  const travelerGroups = form.watch('travelerInfo.travelerGroups') || [];

  // Enhanced: Per-traveler component tracking
  const [travelerComponents, setTravelerComponents] = useState<Record<string, PackageComponent[]>>({});
  const [componentAssignments, setComponentAssignments] = useState<Record<string, string[]>>({});

  // Calculate per-traveler totals
  const calculateTravelerTotals = () => {
    const totals: Record<string, number> = {};
    
    individualTravelers.forEach(traveler => {
      const travelerComps = travelerComponents[traveler.id] || [];
      totals[traveler.id] = travelerComps.reduce((sum, comp) => sum + comp.price, 0);
    });
    
    return totals;
  };

  const travelerTotals = calculateTravelerTotals();
  const groupTotal = Object.values(travelerTotals).reduce((sum, total) => sum + total, 0);

  // Assign component to travelers
  const assignComponentToTravelers = (componentId: string, travelerIds: string[]) => {
    const component = smartDefaults.find(c => c.id === componentId) || alternatives.find(c => c.id === componentId);
    if (!component) return;

    // Update component assignments
    setComponentAssignments(prev => ({
      ...prev,
      [componentId]: travelerIds
    }));

    // Update traveler components
    setTravelerComponents(prev => {
      const newState = { ...prev };
      
      // Remove component from all travelers first
      Object.keys(newState).forEach(travelerId => {
        newState[travelerId] = newState[travelerId].filter(c => c.id !== componentId);
      });
      
      // Add component to selected travelers
      travelerIds.forEach(travelerId => {
        if (!newState[travelerId]) newState[travelerId] = [];
        newState[travelerId].push(component);
      });
      
      return newState;
    });
  };

  // Get travelers assigned to a component
  const getAssignedTravelers = (componentId: string) => {
    return componentAssignments[componentId] || [];
  };

  // Check if a traveler is assigned to a component
  const isTravelerAssigned = (componentId: string, travelerId: string) => {
    return getAssignedTravelers(componentId).includes(travelerId);
  };

  // Toggle traveler assignment
  const toggleTravelerAssignment = (componentId: string, travelerId: string) => {
    const currentAssignments = getAssignedTravelers(componentId);
    const isAssigned = currentAssignments.includes(travelerId);
    
    if (isAssigned) {
      assignComponentToTravelers(componentId, currentAssignments.filter(id => id !== travelerId));
    } else {
      assignComponentToTravelers(componentId, [...currentAssignments, travelerId]);
    }
  };

  // Get component price for specific travelers
  const getComponentPriceForTravelers = (component: PackageComponent, travelerIds: string[]) => {
    if (travelerIds.length === 0) return 0;
    
    // For shared components, divide price among travelers
    if (component.type === 'hotel' || component.type === 'transfer') {
      return component.price / Math.max(1, travelerIds.length);
    }
    
    // For individual components, multiply by number of travelers
    return component.price * travelerIds.length;
  };

  useEffect(() => {
    generateSmartDefaults();
  }, []);

  // Save selections to form
  useEffect(() => {
    form.setValue('packageComponents', {
      components: smartDefaults.map(comp => ({
        id: comp.id,
        type: (comp.type === 'outboundFlight' || comp.type === 'inboundFlight' ? 'flight' : comp.type) as 'flight' | 'hotel' | 'transfer' | 'event' | 'activity' | 'insurance',
        title: comp.title,
        description: comp.description,
        price: comp.price,
        currency: comp.currency,
        rating: comp.rating,
        image: comp.image,
        data: comp.data,
        selected: comp.selected || false,
        isSmartRecommendation: comp.isSmartRecommendation || false,
        aiReasoning: comp.aiReasoning,
        dates: comp.dates,
        duration: comp.duration,
        capacity: comp.capacity,
        amenities: comp.amenities,
        travelerAssignments: individualTravelers.map(traveler => ({
          travelerId: traveler.id,
          assigned: getAssignedTravelers(comp.id).includes(traveler.id),
          customPrice: undefined,
          notes: undefined,
        })),
        componentPricing: {
          basePrice: comp.price,
          markup: 0,
          totalPrice: comp.price,
          perTraveler: comp.price,
          currency: comp.currency,
        }
      })),
      groupSummary: {
        totalTravelers: individualTravelers.length,
        totalCost: groupTotal,
        costPerTraveler: travelerTotals,
        currency: 'GBP',
        markup: 0,
        commission: 0,
      }
    });
  }, [smartDefaults, individualTravelers, groupTotal, travelerTotals, form]);

  const generateSmartDefaults = async () => {
    setIsLoading(true);
    
    try {
      // Get all available data
      const availableData = await collectAvailableData();
      setAvailableData(availableData);
      
      // Generate smart defaults based on form preferences
      const defaults = await generateSmartDefaultsHelper(availableData);
      
      // Generate alternatives for each component
      const alts: Record<string, QuickAlternative[]> = {};
      defaults.forEach(component => {
        const componentAlternatives = generateAlternatives(component, availableData);
        alts[component.id] = componentAlternatives.map(alt => ({
          id: alt.id,
          title: alt.title,
          price: alt.price,
          currency: alt.currency,
          data: alt.data,
          isSmartRecommendation: alt.isSmartRecommendation
        }));
      });
      
      setSmartDefaults(defaults);
      setAlternatives(defaults);
      
    } catch (error) {
      console.error('Error generating smart defaults:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const collectAvailableData = async () => {
    const data: any = {};

    // Get all flights using the new API structure
    try {
      const flightResult = await mockFlightService.searchFlights({});
      console.log('Flight search result:', flightResult);
      
      // Extract outbound and inbound flights from the Flights array
      data.outboundFlights = flightResult.flights.filter((f: any) => 
        f.DepartureAirportId === 'LHR' || f.DepartureAirportId === 'LGW' || f.DepartureAirportId === 'STN'
      );
      data.inboundFlights = flightResult.flights.filter((f: any) => 
        f.ArrivalAirportId === 'LHR' || f.ArrivalAirportId === 'LGW' || f.ArrivalAirportId === 'STN'
      );
      
      // Also store the recommendations for route options
      data.flightRecommendations = flightResult.recommendations;
      
      console.log('Outbound flights:', data.outboundFlights.length);
      console.log('Inbound flights:', data.inboundFlights.length);
      console.log('Flight recommendations:', data.flightRecommendations.length);
    } catch (error) {
      console.log('Error getting flights:', error);
    }

    // Get all hotels
    try {
      const allHotels = await mockHotelService.searchHotels({});
      data.hotels = allHotels.hotels;
      console.log('Hotels loaded:', data.hotels);
    } catch (error) {
      console.log('Error getting hotels:', error);
    }

    // Get all transfers
    try {
      const allTransfers = await mockTransferService.searchTransfers({});
      data.transfers = allTransfers.transfers;
    } catch (error) {
      console.log('Error getting transfers:', error);
    }

    // Get all insurance
    data.insurance = getMockInsurance();

    return data;
  };

  const generateSmartDefaultsHelper = async (availableData: any): Promise<PackageComponent[]> => {
    const defaults: PackageComponent[] = [];
    
    // Get traveler information and group assignments
    const totalTravelers = (travelerInfo?.travelers?.adults || 0) + (travelerInfo?.travelers?.children || 0);
    const individualTravelers = travelerInfo?.individualTravelers || [];
    const travelerGroups = travelerInfo?.travelerGroups || [];
    
    console.log('Total travelers:', totalTravelers, 'Adults:', travelerInfo?.travelers?.adults, 'Children:', travelerInfo?.travelers?.children);
    console.log('Individual travelers:', individualTravelers);
    console.log('Traveler groups:', travelerGroups);

    // Handle flight bookings based on groups or individual preferences
    if (availableData.outboundFlights?.length > 0 || availableData.inboundFlights?.length > 0) {
      const flightGroups = travelerGroups.filter(g => g.type === 'flight');
      
      if (flightGroups.length > 0) {
        // Multiple flight groups - create separate components for each
        flightGroups.forEach((group, index) => {
          const groupTravelers = individualTravelers.filter(t => group.travelers.includes(t.id));
          const groupSize = groupTravelers.length;
          
          if (groupSize > 0) {
            const outboundFlight = getBestFlightMatch(availableData.outboundFlights, budget, 'outbound', group);
            const inboundFlight = getBestFlightMatch(availableData.inboundFlights, budget, 'inbound', group);
            
            const routeComponent = createFlightRouteComponent(
              outboundFlight, 
              inboundFlight, 
              group, 
              groupTravelers, 
              availableData.flightRecommendations
            );
            
            if (routeComponent) {
              defaults.push(routeComponent);
            }
          }
        });
      } else {
        // Single group booking - use original logic
        const outboundFlight = availableData.outboundFlights?.length > 0 
          ? getBestFlightMatch(availableData.outboundFlights, budget, 'outbound')
          : null;
        const inboundFlight = availableData.inboundFlights?.length > 0
          ? getBestFlightMatch(availableData.inboundFlights, budget, 'inbound')
          : null;

        const routeComponent = createFlightRouteComponent(
          outboundFlight, 
          inboundFlight, 
          null, 
          [], 
          availableData.flightRecommendations,
          totalTravelers
        );
        
        if (routeComponent) {
          defaults.push(routeComponent);
        }
      }
    }

    // Handle hotel bookings based on groups or individual preferences
    if (availableData.hotels?.length > 0) {
      const hotelGroups = travelerGroups.filter(g => g.type === 'hotel');
      
      if (hotelGroups.length > 0) {
        // Multiple hotel groups - create separate components for each
        hotelGroups.forEach((group, index) => {
          const groupTravelers = individualTravelers.filter(t => group.travelers.includes(t.id));
          const groupSize = groupTravelers.length;
          
          if (groupSize > 0) {
            const hotelComponent = createHotelComponent(availableData.hotels, group, groupTravelers, budget, experience);
            if (hotelComponent) {
              defaults.push(hotelComponent);
            }
          }
        });
      } else {
        // Single group booking - use original logic
        console.log('Creating hotel component with hotels:', availableData.hotels);
        const bestHotel = getBestHotelMatch(availableData.hotels, experience, budget, totalTravelers);
        console.log('Best hotel selected:', bestHotel);
        
        const hotelComponent = createHotelComponent(availableData.hotels, null, [], budget, experience, totalTravelers);
        if (hotelComponent) {
          defaults.push(hotelComponent);
        }
      }
    }

    // Handle transfer bookings based on groups or individual preferences
    if (availableData.transfers?.length > 0) {
      const transferGroups = travelerGroups.filter(g => g.type === 'transfer');
      
      if (transferGroups.length > 0) {
        // Multiple transfer groups - create separate components for each
        transferGroups.forEach((group, index) => {
          const groupTravelers = individualTravelers.filter(t => group.travelers.includes(t.id));
          const groupSize = groupTravelers.length;
          
          if (groupSize > 0) {
            const transferComponent = createTransferComponent(availableData.transfers, group, groupTravelers, budget, travelerInfo);
            if (transferComponent) {
              defaults.push(transferComponent);
            }
          }
        });
      } else {
        // Single group booking - use original logic
        const bestTransfer = getBestTransferMatch(availableData.transfers, travelerInfo, budget, totalTravelers);
        
        const transferComponent = createTransferComponent(availableData.transfers, null, [], budget, travelerInfo, totalTravelers);
        if (transferComponent) {
          defaults.push(transferComponent);
        }
      }
    }

    // Handle insurance (typically per person, but can be grouped)
    if (availableData.insurance?.length > 0) {
      const bestInsurance = getBestInsuranceMatch(availableData.insurance, budget, totalTravelers);
      
      const insuranceComponent = createInsuranceComponent(availableData.insurance, bestInsurance, totalTravelers);
      if (insuranceComponent) {
        defaults.push(insuranceComponent);
      }
    }

    return defaults;
  };

  // Helper function to create flight route component
  const createFlightRouteComponent = (
    outboundFlight: any, 
    inboundFlight: any, 
    group: any, 
    groupTravelers: any[], 
    recommendations: any[],
    totalTravelers?: number
  ): PackageComponent | null => {
    const travelers = group ? groupTravelers : [];
    const travelerCount = group ? travelers.length : (totalTravelers || 0);
    
    if (!outboundFlight && !inboundFlight) return null;

    let routeTitle = '';
    let routeDescription = '';
    let routePrice = 0;
    let routeData: any = {};
    let routeDates = '';
    let routeDuration = '';

    if (outboundFlight && inboundFlight) {
      // Round trip
      const outboundAirline = getAirlineById(outboundFlight.MarketingAirlineId);
      const outboundFrom = getLocationById(outboundFlight.DepartureAirportId);
      const outboundTo = getLocationById(outboundFlight.ArrivalAirportId);
      
      routeTitle = group ? `${group.name} - ${outboundAirline?.AirlineName || outboundFlight.MarketingAirlineId} Round Trip` 
                        : `${outboundAirline?.AirlineName || outboundFlight.MarketingAirlineId} Round Trip`;
      routeDescription = `${outboundFrom?.AirportName || outboundFlight.DepartureAirportId} → ${outboundTo?.AirportName || outboundFlight.ArrivalAirportId}`;
      
      // Use recommendation pricing if available, otherwise estimate
      const recommendation = recommendations?.find((rec: any) => 
        rec.Routing.includes(outboundFlight.DepartureAirportId) && 
        rec.Routing.includes(inboundFlight.ArrivalAirportId)
      );
      
      // Calculate total price based on number of travelers and their preferences
      const basePrice = recommendation ? recommendation.Total : 600;
      routePrice = calculateGroupFlightPrice(basePrice, travelers, group);
      
      routeDates = `${outboundFlight.DepartureDateTime.split('T')[0]} - ${inboundFlight.DepartureDateTime.split('T')[0]}`;
      routeDuration = `${outboundFlight.FlightDuration} + ${inboundFlight.FlightDuration}`;
      routeData = {
        type: 'roundTrip',
        outbound: outboundFlight,
        inbound: inboundFlight,
        totalPrice: routePrice,
        recommendation: recommendation,
        travelers: travelers,
        group: group,
        pricePerPerson: basePrice
      };
    } else if (outboundFlight) {
      // One way outbound
      const airline = getAirlineById(outboundFlight.MarketingAirlineId);
      const from = getLocationById(outboundFlight.DepartureAirportId);
      const to = getLocationById(outboundFlight.ArrivalAirportId);
      
      routeTitle = group ? `${group.name} - ${airline?.AirlineName || outboundFlight.MarketingAirlineId} One Way`
                        : `${airline?.AirlineName || outboundFlight.MarketingAirlineId} One Way`;
      routeDescription = `${from?.AirportName || outboundFlight.DepartureAirportId} → ${to?.AirportName || outboundFlight.ArrivalAirportId}`;
      routePrice = calculateGroupFlightPrice(300, travelers, group);
      routeDates = outboundFlight.DepartureDateTime.split('T')[0];
      routeDuration = outboundFlight.FlightDuration;
      routeData = {
        type: 'oneWay',
        direction: 'outbound',
        flight: outboundFlight,
        travelers: travelers,
        group: group,
        pricePerPerson: 300
      };
    } else if (inboundFlight) {
      // One way inbound
      const airline = getAirlineById(inboundFlight.MarketingAirlineId);
      const from = getLocationById(inboundFlight.DepartureAirportId);
      const to = getLocationById(inboundFlight.ArrivalAirportId);
      
      routeTitle = group ? `${group.name} - ${airline?.AirlineName || inboundFlight.MarketingAirlineId} One Way`
                        : `${airline?.AirlineName || inboundFlight.MarketingAirlineId} One Way`;
      routeDescription = `${from?.AirportName || inboundFlight.DepartureAirportId} → ${to?.AirportName || inboundFlight.ArrivalAirportId}`;
      routePrice = calculateGroupFlightPrice(300, travelers, group);
      routeDates = inboundFlight.DepartureDateTime.split('T')[0];
      routeDuration = inboundFlight.FlightDuration;
      routeData = {
        type: 'oneWay',
        direction: 'inbound',
        flight: inboundFlight,
        travelers: travelers,
        group: group,
        pricePerPerson: 300
      };
    }

    if (routeTitle) {
      return {
        id: group ? `flightRoute-${group.id}` : 'flightRoute',
        type: 'outboundFlight',
        title: routeTitle,
        description: routeDescription,
        price: routePrice,
        currency: 'GBP',
        rating: 4.5,
        data: routeData,
        selected: true,
        isSmartRecommendation: true,
        aiReasoning: group ? `Best value for ${group.name} (${travelerCount} travelers)` 
                          : `Best value for money with optimal timing for ${travelerCount} traveler${travelerCount > 1 ? 's' : ''}`,
        dates: routeDates,
        duration: routeDuration,
        capacity: travelerCount,
        amenities: ['WiFi', 'Entertainment', 'Meal Service', 'Lounge Access']
      };
    }

    return null;
  };

  // Helper function to create hotel component
  const createHotelComponent = (
    hotels: any[], 
    group: any, 
    groupTravelers: any[], 
    budget: any, 
    experience: any,
    totalTravelers?: number
  ): PackageComponent | null => {
    const travelers = group ? groupTravelers : [];
    const travelerCount = group ? travelers.length : (totalTravelers || 0);
    
    if (hotels.length === 0) return null;

    const bestHotel = getBestHotelMatch(hotels, experience, budget, travelerCount);
    const bestRoom = bestHotel.rooms[0];
    
    // Calculate total hotel price based on number of nights and travelers
    const nights = 4; // Default 4 nights
    const roomPrice = bestRoom.price.amount * nights;
    const totalHotelPrice = calculateGroupHotelPrice(roomPrice, travelers, group);
    
    return {
      id: group ? `hotel-${group.id}` : 'hotel',
      type: 'hotel',
      title: group ? `${group.name} - ${bestHotel.name}` : bestHotel.name,
      description: `${bestHotel.location.city} - ${bestRoom.name}`,
      price: totalHotelPrice,
      currency: bestRoom.price.currency,
      rating: bestHotel.rating,
      image: bestHotel.images[0],
      data: {
        ...bestHotel,
        travelers: travelers,
        group: group,
        nights: nights,
        pricePerNight: bestRoom.price.amount,
        totalPrice: totalHotelPrice
      },
      selected: true,
      isSmartRecommendation: true,
      aiReasoning: group ? `Premium location for ${group.name} (${travelerCount} travelers)`
                        : `Premium location with excellent amenities for ${travelerCount} traveler${travelerCount > 1 ? 's' : ''}`,
      dates: `${destinations?.outboundFlight?.date || 'Dec 4'} - ${destinations?.inboundFlight?.date || 'Dec 8'}`,
      duration: `${nights} nights`,
      capacity: Math.min(travelerCount, bestRoom.maxOccupancy),
      amenities: bestHotel.amenities
    };
  };

  // Helper function to create transfer component
  const createTransferComponent = (
    transfers: any[], 
    group: any, 
    groupTravelers: any[], 
    budget: any, 
    travelerInfo: any,
    totalTravelers?: number
  ): PackageComponent | null => {
    const travelers = group ? groupTravelers : [];
    const travelerCount = group ? travelers.length : (totalTravelers || 0);
    
    if (transfers.length === 0) return null;

    const bestTransfer = getBestTransferMatch(transfers, travelerInfo, budget, travelerCount);
    
    // Calculate transfer price based on number of travelers
    const transferPrice = calculateGroupTransferPrice(bestTransfer.price.amount, travelers, group, bestTransfer.vehicle.capacity);
    
    return {
      id: group ? `transfer-${group.id}` : 'transfer',
      type: 'transfer',
      title: group ? `${group.name} - ${bestTransfer.vehicle.name} Transfer` : `${bestTransfer.vehicle.name} Transfer`,
      description: `${bestTransfer.pickup.location} → ${bestTransfer.dropoff.location}`,
      price: transferPrice,
      currency: bestTransfer.price.currency,
      rating: 4.8,
      image: bestTransfer.vehicle.image,
      data: {
        ...bestTransfer,
        travelers: travelers,
        group: group,
        vehiclesNeeded: Math.ceil(travelerCount / bestTransfer.vehicle.capacity),
        pricePerVehicle: bestTransfer.price.amount,
        totalPrice: transferPrice
      },
      selected: true,
      isSmartRecommendation: true,
      aiReasoning: group ? `Reliable transfer service for ${group.name} (${travelerCount} travelers)`
                        : `Reliable airport transfer service for ${travelerCount} traveler${travelerCount > 1 ? 's' : ''}`,
      dates: `${destinations?.outboundFlight?.date || 'Dec 4'} - ${destinations?.inboundFlight?.date || 'Dec 8'}`,
      duration: bestTransfer.duration,
      capacity: travelerCount,
      amenities: ['Meet & Greet', 'Flight Tracking', 'Child Seats Available']
    };
  };

  // Helper function to create insurance component
  const createInsuranceComponent = (
    insurance: any[], 
    bestInsurance: any, 
    totalTravelers: number
  ): PackageComponent | null => {
    if (!bestInsurance) return null;
    
    // Calculate insurance price based on number of travelers
    const insurancePrice = bestInsurance.price.amount * totalTravelers;
    
    return {
      id: 'insurance',
      type: 'insurance',
      title: bestInsurance.name,
      description: `${bestInsurance.type} coverage`,
      price: insurancePrice,
      currency: bestInsurance.price.currency,
      rating: 4.7,
      data: {
        ...bestInsurance,
        travelers: totalTravelers,
        pricePerPerson: bestInsurance.price.amount,
        totalPrice: insurancePrice
      },
      selected: true,
      isSmartRecommendation: true,
      aiReasoning: `Comprehensive coverage for ${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''} on international travel`,
      dates: `${destinations?.outboundFlight?.date || 'Dec 4'} - ${destinations?.inboundFlight?.date || 'Dec 8'}`,
      duration: 'Trip duration',
      capacity: totalTravelers,
      amenities: ['Medical Coverage', 'Trip Cancellation', 'Baggage Protection']
    };
  };

  // Helper functions for calculating group pricing
  const calculateGroupFlightPrice = (basePrice: number, travelers: any[], group: any): number => {
    if (!group || travelers.length === 0) {
      return basePrice * (travelerInfo?.travelers?.adults || 1);
    }

    let totalPrice = 0;
    travelers.forEach(traveler => {
      let travelerPrice = basePrice;
      
      // Apply class upgrades based on individual preferences
      if (traveler.preferences?.flightClass) {
        switch (traveler.preferences.flightClass) {
          case 'premium_economy':
            travelerPrice *= 1.5;
            break;
          case 'business':
            travelerPrice *= 3;
            break;
          case 'first':
            travelerPrice *= 5;
            break;
        }
      }
      
      totalPrice += travelerPrice;
    });

    return totalPrice;
  };

  const calculateGroupHotelPrice = (basePrice: number, travelers: any[], group: any): number => {
    if (!group || travelers.length === 0) {
      return basePrice;
    }

    // For hotel groups, we need to calculate room requirements
    const roomPreferences = travelers.map(t => t.preferences?.hotelRoom || 'shared');
    const singleRooms = roomPreferences.filter(p => p === 'single').length;
    const suiteRooms = roomPreferences.filter(p => p === 'suite').length;
    const sharedRooms = roomPreferences.filter(p => p === 'shared').length;

    let totalPrice = 0;
    
    // Add single rooms
    totalPrice += singleRooms * basePrice;
    
    // Add suite rooms (2x price)
    totalPrice += suiteRooms * basePrice * 2;
    
    // Add shared rooms (1 room per 2 people, minimum 1)
    const sharedRoomCount = Math.ceil(sharedRooms / 2);
    totalPrice += sharedRoomCount * basePrice;

    return totalPrice;
  };

  const calculateGroupTransferPrice = (basePrice: number, travelers: any[], group: any, vehicleCapacity: number): number => {
    if (!group || travelers.length === 0) {
      return basePrice * Math.ceil((travelerInfo?.travelers?.adults || 1) / vehicleCapacity);
    }

    const privateTransfers = travelers.filter(t => t.preferences?.transferType === 'private').length;
    const sharedTransfers = travelers.filter(t => t.preferences?.transferType === 'shared').length;

    let totalPrice = 0;
    
    // Private transfers (1 vehicle per person)
    totalPrice += privateTransfers * basePrice;
    
    // Shared transfers (group by vehicle capacity)
    const sharedVehicleCount = Math.ceil(sharedTransfers / vehicleCapacity);
    totalPrice += sharedVehicleCount * basePrice;

    return totalPrice;
  };

  const selectAlternative = (componentId: string, alternative: QuickAlternative) => {
    setSelectedComponent(prev => 
      prev ? { ...prev, data: alternative.data, price: alternative.price, title: alternative.title } : null
    );
  };

  const openEditModal = (component: PackageComponent) => {
    setSelectedComponent(component);
    setShowEditModal(true);
  };

  const handleEditSelection = (option: any) => {
    if (selectedComponent) {
      setSelectedComponent(prev => 
        prev ? { 
          ...prev, 
          data: option, 
          price: getOptionPrice(option), 
          title: getOptionTitle(option),
          description: getOptionDescription(option)
        } : null
      );
    }
    setShowEditModal(false);
    setSelectedComponent(null);
  };

  const getOptionTitle = (option: any) => {
    if (option.ValidatingAirlineId) {
      // Flight recommendation
      const airline = getAirlineById(option.ValidatingAirlineId);
      return `${airline?.AirlineName || option.ValidatingAirlineId} Round Trip`;
    }
    if (option.name) {
      return option.name;
    }
    if (option.vehicle) {
      return `${option.vehicle.name} Transfer`;
    }
    return option.title || 'Unknown Option';
  };

  const getOptionDescription = (option: any) => {
    if (option.Routing) {
      // Flight recommendation
      return option.Routing;
    }
    if (option.departure && option.arrival) {
      return `${option.departure.city} → ${option.arrival.city}`;
    }
    if (option.location) {
      return option.location.city;
    }
    if (option.pickup && option.dropoff) {
      return `${option.pickup.location} → ${option.dropoff.location}`;
    }
    return option.description || 'No description available';
  };

  const getOptionPrice = (option: any) => {
    if (option.Total) {
      // Flight recommendation
      return option.Total;
    }
    if (option.type === 'roundTrip') {
      return option.totalPrice;
    } else if (option.type === 'oneWay') {
      return option.flight.price.amount;
    }
    return option.price?.amount || option.rooms?.[0]?.price?.amount || option.price || 0;
  };

  const getTotalPrice = () => {
    return selectedComponent ? selectedComponent.price : 0;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'outboundFlight':
      case 'inboundFlight':
        return <Plane className="h-5 w-5" />;
      case 'hotel':
        return <Building className="h-5 w-5" />;
      case 'transfer':
        return <Car className="h-5 w-5" />;
      case 'insurance':
        return <Shield className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const generateAlternatives = (component: PackageComponent, availableData: any): PackageComponent[] => {
    const alternatives: PackageComponent[] = [];
    const totalTravelers = (travelerInfo?.travelers?.adults || 0) + (travelerInfo?.travelers?.children || 0);
    const individualTravelers = travelerInfo?.individualTravelers || [];
    const travelerGroups = travelerInfo?.travelerGroups || [];

    switch (component.type) {
      case 'outboundFlight':
        // Generate flight alternatives
        const allFlights = [...(availableData.outboundFlights || []), ...(availableData.inboundFlights || [])];
        const flightAlternatives = allFlights
          .slice(0, 3)
          .map((flight: any, index: number) => {
            const airline = getAirlineById(flight.MarketingAirlineId);
            const from = getLocationById(flight.DepartureAirportId);
            const to = getLocationById(flight.ArrivalAirportId);
            
            // Calculate price based on travelers
            const basePrice = 400 + (index * 50); // Varying prices
            const totalPrice = basePrice * totalTravelers;
            
            return {
              id: `flight-alt-${index}`,
              type: 'outboundFlight' as const,
              title: `${airline?.AirlineName || flight.MarketingAirlineId} Alternative`,
              description: `${from?.AirportName || flight.DepartureAirportId} → ${to?.AirportName || flight.ArrivalAirportId}`,
              price: totalPrice,
              currency: 'GBP',
              rating: 4.2 - (index * 0.1),
              data: {
                flight: flight,
                travelers: totalTravelers,
                pricePerPerson: basePrice
              },
              selected: false,
              isSmartRecommendation: false,
              aiReasoning: `Alternative flight option for ${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''}`,
              dates: flight.DepartureDateTime.split('T')[0],
              duration: flight.FlightDuration,
              capacity: totalTravelers,
              amenities: ['WiFi', 'Entertainment', 'Meal Service']
            };
          });
        alternatives.push(...flightAlternatives);
        break;

      case 'hotel':
        // Generate hotel alternatives
        const hotelAlternatives = (availableData.hotels || [])
          .slice(1, 4)
          .map((hotel: any, index: number) => {
            const room = hotel.rooms[0];
            const nights = 4;
            const roomPrice = room.price.amount * nights;
            const totalPrice = roomPrice; // One room for the group
            
            return {
              id: `hotel-alt-${index}`,
              type: 'hotel' as const,
              title: hotel.name,
              description: `${hotel.location.city} - ${room.name}`,
              price: totalPrice,
              currency: room.price.currency,
              rating: hotel.rating,
              image: hotel.images[0],
              data: {
                ...hotel,
                travelers: totalTravelers,
                nights: nights,
                pricePerNight: room.price.amount,
                totalPrice: totalPrice
              },
              selected: false,
              isSmartRecommendation: false,
              aiReasoning: `Alternative accommodation option for ${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''}`,
              dates: `${destinations?.outboundFlight?.date || 'Dec 4'} - ${destinations?.inboundFlight?.date || 'Dec 8'}`,
              duration: `${nights} nights`,
              capacity: Math.min(totalTravelers, room.maxOccupancy),
              amenities: hotel.amenities
            };
          });
        alternatives.push(...hotelAlternatives);
        break;

      case 'transfer':
        // Generate transfer alternatives
        const transferAlternatives = (availableData.transfers || [])
          .slice(1, 3)
          .map((transfer: any, index: number) => {
            const transferPrice = transfer.price.amount * Math.ceil(totalTravelers / transfer.vehicle.capacity);
            
            return {
              id: `transfer-alt-${index}`,
              type: 'transfer' as const,
              title: `${transfer.vehicle.name} Alternative`,
              description: `${transfer.pickup.location} → ${transfer.dropoff.location}`,
              price: transferPrice,
              currency: transfer.price.currency,
              rating: 4.5 - (index * 0.1),
              image: transfer.vehicle.image,
              data: {
                ...transfer,
                travelers: totalTravelers,
                vehiclesNeeded: Math.ceil(totalTravelers / transfer.vehicle.capacity),
                pricePerVehicle: transfer.price.amount,
                totalPrice: transferPrice
              },
              selected: false,
              isSmartRecommendation: false,
              aiReasoning: `Alternative transfer service for ${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''}`,
              dates: `${destinations?.outboundFlight?.date || 'Dec 4'} - ${destinations?.inboundFlight?.date || 'Dec 8'}`,
              duration: transfer.duration,
              capacity: totalTravelers,
              amenities: ['Meet & Greet', 'Flight Tracking']
            };
          });
        alternatives.push(...transferAlternatives);
        break;

      case 'insurance':
        // Generate insurance alternatives
        const insuranceAlternatives = (availableData.insurance || [])
          .slice(1, 3)
          .map((insurance: any, index: number) => {
            const insurancePrice = insurance.price.amount * totalTravelers;
            
            return {
              id: `insurance-alt-${index}`,
              type: 'insurance' as const,
              title: insurance.name,
              description: `${insurance.type} coverage`,
              price: insurancePrice,
              currency: insurance.price.currency,
              rating: 4.3 - (index * 0.1),
              data: {
                ...insurance,
                travelers: totalTravelers,
                pricePerPerson: insurance.price.amount,
                totalPrice: insurancePrice
              },
              selected: false,
              isSmartRecommendation: false,
              aiReasoning: `Alternative insurance coverage for ${totalTravelers} traveler${totalTravelers > 1 ? 's' : ''}`,
              dates: `${destinations?.outboundFlight?.date || 'Dec 4'} - ${destinations?.inboundFlight?.date || 'Dec 8'}`,
              duration: 'Trip duration',
              capacity: totalTravelers,
              amenities: ['Medical Coverage', 'Trip Cancellation']
            };
          });
        alternatives.push(...insuranceAlternatives);
        break;
    }

    return alternatives;
  };

  // Smart selection helpers
  const getBestFlightMatch = (flights: any[], budget: any, direction: string, group?: any) => {
    console.log('getBestFlightMatch called with:', { flights: flights.length, budget, direction, group });
    
    // For now, just return the first flight since we don't have pricing in the flight objects
    // In a real implementation, you'd match against recommendations for pricing
    const result = flights[0];
    console.log('getBestFlightMatch result:', result);
    return result;
  };

  const getBestHotelMatch = (hotels: any[], experience: any, budget: any, totalTravelers: number) => {
    console.log('getBestHotelMatch called with:', { hotels: hotels.length, experience, budget, totalTravelers });
    
    // Sort by rating and filter by accommodation preference
    const sorted = hotels.sort((a, b) => b.rating - a.rating);
    const budgetLimit = budget?.amount * 0.2; // 20% of budget for hotels
    
    // Filter hotels that can accommodate the group
    const suitableHotels = sorted.filter(h => {
      const bestRoom = h.rooms[0];
      
      // Check if room can accommodate the group
      if (bestRoom.maxOccupancy < totalTravelers) return false;
      
      // Check if price is within budget
      if (bestRoom.price.amount > budgetLimit) return false;
      
      return true;
    });
    
    const result = suitableHotels.length > 0 ? suitableHotels[0] : sorted[0];
    console.log('getBestHotelMatch result:', result);
    return result;
  };

  const getBestTransferMatch = (transfers: any[], travelerInfo: any, budget: any, totalTravelers: number) => {
    // Sort by price and filter by passenger capacity
    const sorted = transfers.sort((a, b) => a.price.amount - b.price.amount);
    
    // Find transfers that can accommodate all travelers
    const suitable = sorted.filter(t => t.vehicle.capacity >= totalTravelers);
    
    // If no single vehicle can accommodate all, find the most efficient combination
    if (suitable.length === 0) {
      // Find the vehicle with the best capacity-to-price ratio
      const efficient = sorted.filter(t => t.vehicle.capacity >= Math.ceil(totalTravelers / 2));
      return efficient.length > 0 ? efficient[0] : sorted[0];
    }
    
    return suitable[0];
  };

  const getBestInsuranceMatch = (insurance: any[], budget: any, totalTravelers: number) => {
    // Prefer comprehensive coverage within budget
    const sorted = insurance.sort((a, b) => {
      // Prioritize comprehensive coverage
      if (a.type === 'Comprehensive' && b.type !== 'Comprehensive') return -1;
      if (b.type === 'Comprehensive' && a.type !== 'Comprehensive') return 1;
      // Then sort by price
      return a.price.amount - b.price.amount;
    });
    
    const budgetLimit = budget?.amount * 0.05; // 5% of budget for insurance per person
    const totalBudgetLimit = budgetLimit * totalTravelers;
    
    const affordable = sorted.filter(i => i.price.amount * totalTravelers <= totalBudgetLimit);
    return affordable.length > 0 ? affordable[0] : sorted[0];
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto space-y-8"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-[var(--card-foreground)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                  <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Package Components</div>
                  <div className="text-sm font-normal text-[var(--muted-foreground)]">
                    AI-powered recommendations for your perfect trip
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto space-y-8"
    >
      {/* Header Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-[var(--card-foreground)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                <Sparkles className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <div className="text-lg font-semibold">Package Components</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)]">
                  AI-powered recommendations for your perfect trip
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Smart Recommendations
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Best Value
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {getTotalPrice()} {budget?.currency || 'GBP'}
                </div>
                <div className="text-sm text-muted-foreground">Total Package Price</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Components Grid */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <AnimatePresence>
          {smartDefaults.map((component, index) => (
            <motion.div
              key={component.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 * index }}
            >
              <ComponentCard
                component={component}
                alternatives={alternatives.filter(c => c.type === component.type)}
                isExpanded={showAlternatives === component.id}
                onToggleExpand={() => setShowAlternatives(
                  showAlternatives === component.id ? null : component.id
                )}
                onSelectAlternative={selectAlternative}
                onEditAll={openEditModal}
                getIcon={getIcon}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Traveler Assignment Section */}
      {individualTravelers.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Traveler Assignments</h3>
            <Badge variant="secondary" className="text-sm">
              Group Total: £{groupTotal.toLocaleString()}
            </Badge>
          </div>

          {/* Per-Traveler Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {individualTravelers.map(traveler => (
              <Card key={traveler.id} className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[var(--primary)]" />
                      <span>{traveler.name || `Traveler ${traveler.id}`}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      £{travelerTotals[traveler.id]?.toLocaleString() || '0'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {travelerComponents[traveler.id]?.map(comp => (
                    <div key={comp.id} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--muted-foreground)]">{comp.title}</span>
                      <span className="font-medium">£{comp.price.toLocaleString()}</span>
                    </div>
                  ))}
                  {(!travelerComponents[traveler.id] || travelerComponents[traveler.id].length === 0) && (
                    <p className="text-xs text-[var(--muted-foreground)] italic">No components assigned</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Component Assignment Controls */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-[var(--foreground)]">Assign Components to Travelers</h4>
            {smartDefaults.map(component => (
              <Card key={component.id} className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getIcon(component.type)}
                      <span>{component.title}</span>
                      {component.isSmartRecommendation && (
                        <Badge variant="secondary" className="text-xs">AI Recommended</Badge>
                      )}
                    </div>
                    <span className="font-medium">£{component.price.toLocaleString()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {individualTravelers.map(traveler => (
                        <Button
                          key={traveler.id}
                          variant={isTravelerAssigned(component.id, traveler.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleTravelerAssignment(component.id, traveler.id)}
                          className="h-8 text-xs"
                        >
                          <User className="h-3 w-3 mr-1" />
                          {traveler.name || `Traveler ${traveler.id}`}
                          {isTravelerAssigned(component.id, traveler.id) && (
                            <CheckCircle className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span>
                        Assigned to {getAssignedTravelers(component.id).length} traveler{getAssignedTravelers(component.id).length !== 1 ? 's' : ''}
                      </span>
                      <span>
                        Total: £{getComponentPriceForTravelers(component, getAssignedTravelers(component.id)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Final Quote Summary */}
      {individualTravelers.length > 0 && groupTotal > 0 && (
        <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[var(--card-foreground)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Group Quote Summary</div>
                  <div className="text-sm font-normal text-[var(--muted-foreground)]">
                    Complete breakdown for {individualTravelers.length} travelers
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  £{groupTotal.toLocaleString()}
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">Total Group Cost</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Per-Traveler Summary Table */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[var(--foreground)]">Per-Traveler Breakdown</h4>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--muted)]/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-[var(--foreground)]">Traveler</th>
                      <th className="text-left p-3 font-medium text-[var(--foreground)]">Components</th>
                      <th className="text-right p-3 font-medium text-[var(--foreground)]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualTravelers.map((traveler, index) => (
                      <tr key={traveler.id} className={index % 2 === 0 ? 'bg-[var(--background)]' : 'bg-[var(--muted)]/20'}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[var(--primary)]" />
                            <span className="font-medium">{traveler.name || `Traveler ${traveler.id}`}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {travelerComponents[traveler.id]?.map(comp => (
                              <div key={comp.id} className="flex items-center gap-2 text-xs">
                                {getIcon(comp.type)}
                                <span className="text-[var(--muted-foreground)]">{comp.title}</span>
                                <span className="font-medium">£{comp.price.toLocaleString()}</span>
                              </div>
                            ))}
                            {(!travelerComponents[traveler.id] || travelerComponents[traveler.id].length === 0) && (
                              <span className="text-xs text-[var(--muted-foreground)] italic">No components assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-bold text-[var(--foreground)]">
                            £{travelerTotals[traveler.id]?.toLocaleString() || '0'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[var(--primary)]/10 border-t border-[var(--border)]">
                    <tr>
                      <td className="p-3 font-medium text-[var(--foreground)]">Group Total</td>
                      <td className="p-3 text-[var(--muted-foreground)]">
                        {Object.keys(componentAssignments).length} components assigned
                      </td>
                      <td className="p-3 text-right font-bold text-[var(--foreground)]">
                        £{groupTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Component Summary */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[var(--foreground)]">Component Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {smartDefaults.map(component => {
                  const assignedTravelers = getAssignedTravelers(component.id);
                  const componentTotal = getComponentPriceForTravelers(component, assignedTravelers);
                  
                  return (
                    <div key={component.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
                      <div className="flex items-center gap-2">
                        {getIcon(component.type)}
                        <div>
                          <div className="text-sm font-medium">{component.title}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {assignedTravelers.length} traveler{assignedTravelers.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">£{componentTotal.toLocaleString()}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          £{(componentTotal / Math.max(1, assignedTravelers.length)).toLocaleString()} each
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              <Button className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary)]/90">
                <CheckCircle className="h-4 w-4 mr-2" />
                Generate Quote
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Send to Client
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {selectedComponent && (
        <EditModal
          component={selectedComponent}
          allOptions={getAllOptionsForType(selectedComponent.type)}
          onSelect={handleEditSelection}
          onClose={() => {
            setShowEditModal(false);
            setSelectedComponent(null);
          }}
          isOpen={showEditModal}
        />
      )}
    </motion.div>
  );

  function getAllOptionsForType(type: string) {
    switch (type) {
      case 'outboundFlight':
      case 'inboundFlight':
        // Return flight recommendations instead of individual flights
        return availableData.flightRecommendations || [];
      case 'hotel':
        return availableData.hotels || [];
      case 'transfer':
        return availableData.transfers || [];
      case 'insurance':
        return availableData.insurance || [];
      default:
        return [];
    }
  }

  const getOptionDetails = (option: any) => {
    const details: string[] = [];
    
    if (option.duration) details.push(`Duration: ${option.duration}`);
    if (option.stops !== undefined) details.push(`Stops: ${option.stops}`);
    if (option.aircraft) details.push(`Aircraft: ${option.aircraft}`);
    if (option.class) details.push(`Class: ${option.class}`);
    if (option.rating) details.push(`Rating: ${option.rating}/5`);
    if (option.amenities?.length > 0) details.push(`Amenities: ${option.amenities.slice(0, 3).join(', ')}`);
    
    return details.join(' • ');
  };
}

interface ComponentCardProps {
  component: PackageComponent;
  alternatives: PackageComponent[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectAlternative: (componentId: string, alternative: PackageComponent) => void;
  onEditAll: (component: PackageComponent) => void;
  getIcon: (type: string) => any;
}

function ComponentCard({ 
  component, 
  alternatives, 
  isExpanded, 
  onToggleExpand, 
  onSelectAlternative,
  onEditAll,
  getIcon 
}: ComponentCardProps) {
  return (
    <Card className="py-0 bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
              {getIcon(component.type)}
            </div>
            <div>
              <h3 className="font-semibold text-[var(--card-foreground)]">{component.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">{component.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-primary">{component.price} {component.currency}</div>
            {component.isSmartRecommendation && (
              <Badge variant="outline" className="mt-1 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Recommended
              </Badge>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {component.dates && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Calendar className="h-4 w-4" />
              <span>{component.dates}</span>
            </div>
          )}
          {component.duration && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Clock className="h-4 w-4" />
              <span>{component.duration}</span>
            </div>
          )}
          {component.capacity && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Users className="h-4 w-4" />
              <span>{component.capacity} {component.type === 'transfer' ? 'passengers' : 'guests'}</span>
            </div>
          )}
          {component.rating && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{component.rating}/5</span>
            </div>
          )}
        </div>

        {/* AI Reasoning */}
        {component.aiReasoning && (
          <div className="mb-4 p-3 bg-[var(--primary)]/5 rounded-lg border border-[var(--primary)]/10">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[var(--primary)] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[var(--muted-foreground)]">{component.aiReasoning}</p>
            </div>
          </div>
        )}

        {/* Amenities */}
        {component.amenities && component.amenities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {component.amenities.slice(0, 4).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {component.amenities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{component.amenities.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onEditAll(component);
            }}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Edit All Options
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onToggleExpand();
            }}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Alternatives
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show Alternatives ({alternatives.length})
              </>
            )}
          </Button>
        </div>

        {/* Alternatives */}
        <AnimatePresence>
          {isExpanded && alternatives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-2"
            >
              <Separator />
              <div className="pt-4">
                <h4 className="text-sm font-medium text-[var(--card-foreground)] mb-3">
                  Quick Alternatives
                </h4>
                <div className="space-y-2">
                  {alternatives.slice(0, 3).map((alternative) => (
                    <div
                      key={alternative.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectAlternative(component.id, alternative);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                          {getIcon(component.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{alternative.title}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {alternative.isSmartRecommendation && (
                              <Badge variant="outline" className="mr-2 text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Smart
                              </Badge>
                            )}
                            Quick alternative
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{alternative.price} {alternative.currency}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {alternative.price < component.price ? (
                            <span className="text-green-600">Save {component.price - alternative.price} {component.currency}</span>
                          ) : (
                            <span className="text-orange-600">+{alternative.price - component.price} {component.currency}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function EditModal({ component, allOptions, onSelect, onClose, isOpen }: EditModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState('all');

  const filteredAndSortedOptions = allOptions
    .filter(option => {
      const matchesSearch = option.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           option.airline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           option.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'budget' && option.price?.amount <= 500) ||
                           (filterType === 'premium' && option.price?.amount > 500);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aValue = a[sortBy]?.amount || a[sortBy] || 0;
      const bValue = b[sortBy]?.amount || b[sortBy] || 0;
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

  const getOptionPrice = (option: any) => {
    return option.price?.amount || option.rooms?.[0]?.price?.amount || option.price || 0;
  };

  const getOptionTitle = (option: any) => {
    if (option.airline) {
      return `${option.airline} ${option.flightNumber}`;
    }
    if (option.name) {
      return option.name;
    }
    if (option.vehicle) {
      return `${option.vehicle.name} Transfer`;
    }
    return option.title || 'Unknown Option';
  };

  const getOptionDescription = (option: any) => {
    if (option.departure && option.arrival) {
      return `${option.departure.city} → ${option.arrival.city}`;
    }
    if (option.location) {
      return option.location.city;
    }
    if (option.pickup && option.dropoff) {
      return `${option.pickup.location} → ${option.dropoff.location}`;
    }
    return option.description || 'No description available';
  };

  const getOptionDetails = (option: any) => {
    const details: string[] = [];
    
    if (option.duration) details.push(`Duration: ${option.duration}`);
    if (option.stops !== undefined) details.push(`Stops: ${option.stops}`);
    if (option.aircraft) details.push(`Aircraft: ${option.aircraft}`);
    if (option.class) details.push(`Class: ${option.class}`);
    if (option.rating) details.push(`Rating: ${option.rating}/5`);
    if (option.amenities?.length > 0) details.push(`Amenities: ${option.amenities.slice(0, 3).join(', ')}`);
    
    return details.join(' • ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary-800">
            <Edit3 className="h-5 w-5 text-primary-600" />
            Edit {component.type.replace(/([A-Z])/g, ' $1').trim()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="flex gap-4 p-4 border-b bg-muted/30">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Options</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAndSortedOptions.map((option) => {
                const details = getOptionDetails(option);
                const isCurrentSelection = option.id === component.data.id;
                
                return (
                  <Card
                    key={option.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-lg",
                      isCurrentSelection && "ring-2 ring-primary bg-primary-50/50"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelect(option);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(option);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{getOptionTitle(option)}</h4>
                            {isCurrentSelection && (
                              <Badge variant="secondary" className="text-xs bg-primary-100 text-primary-800">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{getOptionDescription(option)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">{getOptionPrice(option)} {option.price?.currency || 'GBP'}</div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {details.split('•').map((detail, index) => (
                          <div key={index} className="flex items-center gap-1">
                            {detail.split(':')[0]}:
                          </div>
                        ))}
                      </div>

                      {/* Amenities */}
                      {option.amenities && option.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {option.amenities.slice(0, 4).map((amenity: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {option.amenities.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{option.amenities.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {filteredAndSortedOptions.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No options found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 