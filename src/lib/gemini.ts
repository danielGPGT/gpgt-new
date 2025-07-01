import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'sonner';
import { jsonrepair } from 'jsonrepair';

export interface TripPreferences {
  clientName: string;
  destination: string;
  startDate: string;
  endDate: string;
  numberOfTravelers: number;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  preferences: {
    tone: string;
    pace: 'relaxed' | 'moderate' | 'active';
    interests: string[];
    accommodationType: string[];
    diningPreferences: string[];
  };
  specialRequests?: string;
  transportType?: string;
  fromLocation?: string;
  travelType?: string;
  // Selected components from new intake form
  selectedFlights?: Array<{
    originAirport: string;
    destinationAirport: string;
    cabinClass: string;
    airline?: string;
    flightNumber?: string;
    departureTime?: string;
    arrivalTime?: string;
    total: number;
    currency: string;
  }>;
  selectedHotels?: Array<{
    hotelName: string;
    destinationCity: string;
    numberOfRooms: number;
    roomTypes: string[];
    starRating?: number;
    pricePerNight: number;
    currency: string;
    checkIn?: string;
    checkOut?: string;
  }>;
  selectedEvent?: {
    id: string;
    name: string;
    dateOfEvent: string;
    venue: {
      name: string;
      city: string;
      country: string;
    };
  };
  selectedTicket?: {
    id: string;
    categoryName: string;
    price: number;
    currency: string;
    available: boolean;
  };
}

export interface ItineraryDay {
  date: string;
  activities: {
    time: string;
    description: string;
    location?: string;
    notes?: string;
    estimatedCost?: number;
    costType?: 'per-person' | 'total';
  }[];
  imageUrl?: string;
}

export interface HotelRecommendation {
  name: string;
  location: string;
  pricePerNight: number;
  rating: string;
  amenities: string[];
}

export interface TransportBreakdown {
  type: string;
  description: string;
  cost: number;
}

export interface ActivityBreakdown {
  name: string;
  cost: number;
  type: string;
}

export interface DiningRecommendation {
  name: string;
  cuisine: string;
  priceRange: string;
  location: string;
}

export interface BudgetBreakdown {
  accommodation: {
    total: number;
    perNight: number;
    hotelRecommendations: HotelRecommendation[];
  };
  transportation: {
    total: number;
    breakdown: TransportBreakdown[];
  };
  activities: {
    total: number;
    breakdown: ActivityBreakdown[];
  };
  dining: {
    total: number;
    perDay: number;
    recommendations: DiningRecommendation[];
  };
  miscellaneous: {
    total: number;
    description: string;
  };
}

export interface LuxuryHighlight {
  title: string;
  description: string;
  whyLuxury: string;
}

export interface TravelTip {
  category: string;
  tips: string[];
}

export interface GeneratedItinerary {
  title: string;
  destination: string;
  clientName: string;
  days: ItineraryDay[];
  summary: string;
  totalBudget: {
    amount: number;
    currency: string;
  };
  budgetBreakdown: BudgetBreakdown;
  luxuryHighlights: LuxuryHighlight[];
  travelTips: TravelTip[];
}

// Helper to convert file buffer to Gemini-compatible format
async function fileToGenerativePart(file: File) {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private itineraryModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
  private mediaModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Gemini 2.0 Flash for itinerary/quote creation (better reasoning and planning)
    this.itineraryModel = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.9,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 8192,
      }
    });

    // Gemini 1.5 Flash for media library (better multimodal capabilities)
    this.mediaModel = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 4096,
      }
    });
  }

  // Use jsonrepair to handle malformed JSON responses from Gemini
  private tryRepairJson(str: string): string {
    try {
      const cleaned = str.replace(/```json|```/gi, '').trim();
      const repaired = jsonrepair(cleaned);
      return repaired;
    } catch (error) {
      console.error('JSON repair failed:', error);
      return this.basicJsonRepair(str);
    }
  }

  // Fallback method for basic JSON repair
  private basicJsonRepair(str: string): string {
    str = str.replace(/```json|```/gi, '').trim();
    const openBraces = (str.match(/{/g) || []).length;
    let closeBraces = (str.match(/}/g) || []).length;
    const openBrackets = (str.match(/\[/g) || []).length;
    let closeBrackets = (str.match(/\]/g) || []).length;
    while (closeBraces < openBraces) {
      str += '}';
      closeBraces++;
    }
    while (closeBrackets < openBrackets) {
      str += ']';
      closeBrackets++;
    }
    return str;
  }

  // Use Gemini 2.0 Flash for itinerary generation (better planning and reasoning)
  async generateItinerary(preferences: TripPreferences): Promise<GeneratedItinerary> {
    try {
      const prompt = this.buildPrompt(preferences);
      const result = await this.itineraryModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const cleanedText = this.tryRepairJson(text);
        const itinerary = JSON.parse(cleanedText) as GeneratedItinerary;
        return itinerary;
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.error('Raw response was:', text);
        throw new Error('Failed to parse AI response. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error generating itinerary:', error);
      throw error;
    }
  }

  // Use Gemini 1.5 Flash for media library content (better multimodal capabilities)
  async generateContent(prompt: string, imageFile?: File): Promise<{ response: { text: () => string } }> {
    try {
      if (imageFile) {
        // Use the media model (Gemini 1.5 Flash) for requests with images
        const imagePart = await fileToGenerativePart(imageFile);
        const result = await this.mediaModel.generateContent([prompt, imagePart]);
        return result;
      } else {
        // Use the media model for text-only requests in media library context
        const result = await this.mediaModel.generateContent(prompt);
        return result;
      }
    } catch (error) {
      console.error('❌ Error generating content:', error);
      throw error;
    }
  }

  // Use Gemini 2.0 Flash for quote generation (better reasoning and planning)
  async generateQuote(preferences: TripPreferences): Promise<GeneratedItinerary> {
    try {
      const prompt = this.buildQuotePrompt(preferences);
      const result = await this.itineraryModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const cleanedText = this.tryRepairJson(text);
        const quote = JSON.parse(cleanedText) as GeneratedItinerary;
        return quote;
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.error('Raw response was:', text);
        throw new Error('Failed to parse AI response. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error generating quote:', error);
      throw error;
    }
  }

  private buildPrompt(preferences: TripPreferences): string {
    const duration = Math.ceil((new Date(preferences.endDate).getTime() - new Date(preferences.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const budgetPerDay = preferences.budget.max / duration;
    const budgetPerPerson = preferences.budget.max / preferences.numberOfTravelers;

    console.log('🔍 buildPrompt - specialRequests content:', preferences.specialRequests);

    // Check if this is an event-focused trip
    const hasEventRequest = preferences.specialRequests?.toLowerCase().includes('include') && 
                           preferences.specialRequests?.toLowerCase().includes('as the main focus');
    
    // Alternative detection - check for any event-related content
    const hasEventContent = preferences.specialRequests?.toLowerCase().includes('event') ||
                           preferences.specialRequests?.toLowerCase().includes('ticket') ||
                           preferences.specialRequests?.toLowerCase().includes('grand prix') ||
                           preferences.specialRequests?.toLowerCase().includes('f1');
    
    const isEventTrip = hasEventRequest || hasEventContent;
    
    console.log('🔍 Event detection debug:', {
      specialRequests: preferences.specialRequests,
      hasEventRequest,
      hasEventContent,
      isEventTrip,
      specialRequestsLower: preferences.specialRequests?.toLowerCase()
    });

    // Build selected components information
    let selectedComponentsInfo = '';
    let selectedComponentsCost = 0;
    
    if (preferences.selectedFlights && preferences.selectedFlights.length > 0) {
      selectedComponentsInfo += '\n\nSELECTED FLIGHTS (ALREADY BOOKED):\n';
      preferences.selectedFlights.forEach((flight, index) => {
        selectedComponentsInfo += `${index + 1}. ${flight.originAirport} → ${flight.destinationAirport}\n`;
        selectedComponentsInfo += `   - Class: ${flight.cabinClass}\n`;
        if (flight.airline) selectedComponentsInfo += `   - Airline: ${flight.airline}\n`;
        if (flight.flightNumber) selectedComponentsInfo += `   - Flight: ${flight.flightNumber}\n`;
        if (flight.departureTime) selectedComponentsInfo += `   - Departure: ${flight.departureTime}\n`;
        if (flight.arrivalTime) selectedComponentsInfo += `   - Arrival: ${flight.arrivalTime}\n`;
        selectedComponentsInfo += `   - Price: ${flight.total} ${flight.currency}\n`;
        selectedComponentsCost += flight.total;
      });
    }

    if (preferences.selectedHotels && preferences.selectedHotels.length > 0) {
      selectedComponentsInfo += '\n\nSELECTED HOTELS (ALREADY BOOKED):\n';
      preferences.selectedHotels.forEach((hotel, index) => {
        selectedComponentsInfo += `${index + 1}. ${hotel.hotelName}\n`;
        selectedComponentsInfo += `   - Location: ${hotel.destinationCity}\n`;
        selectedComponentsInfo += `   - Rooms: ${hotel.numberOfRooms}\n`;
        selectedComponentsInfo += `   - Room Types: ${hotel.roomTypes.join(', ')}\n`;
        if (hotel.starRating) selectedComponentsInfo += `   - Rating: ${hotel.starRating}★\n`;
        selectedComponentsInfo += `   - Price per Night: ${hotel.pricePerNight} ${hotel.currency}\n`;
        if (hotel.checkIn) selectedComponentsInfo += `   - Check-in: ${hotel.checkIn}\n`;
        if (hotel.checkOut) selectedComponentsInfo += `   - Check-out: ${hotel.checkOut}\n`;
        // Calculate total hotel cost for the trip duration
        const tripDuration = Math.ceil((new Date(preferences.endDate).getTime() - new Date(preferences.startDate).getTime()) / (1000 * 60 * 60 * 24));
        selectedComponentsCost += hotel.pricePerNight * hotel.numberOfRooms * tripDuration;
      });
    }

    if (preferences.selectedEvent && preferences.selectedTicket) {
      selectedComponentsInfo += '\n\nSELECTED EVENT (ALREADY BOOKED):\n';
      selectedComponentsInfo += `- Event: ${preferences.selectedEvent.name}\n`;
      selectedComponentsInfo += `- Date: ${preferences.selectedEvent.dateOfEvent}\n`;
      selectedComponentsInfo += `- Venue: ${preferences.selectedEvent.venue.name}, ${preferences.selectedEvent.venue.city}\n`;
      selectedComponentsInfo += `- Ticket Type: ${preferences.selectedTicket.categoryName}\n`;
      selectedComponentsInfo += `- Price: ${preferences.selectedTicket.price} ${preferences.selectedTicket.currency}\n`;
      selectedComponentsCost += preferences.selectedTicket.price * preferences.numberOfTravelers;
    }

    // Calculate remaining budget for other activities
    const remainingBudget = preferences.budget.max - selectedComponentsCost;
    const remainingBudgetPerDay = remainingBudget / duration;

    let eventInstructions = '';
    if (isEventTrip) {
      eventInstructions = `

CRITICAL EVENT INFORMATION - THIS IS THE CENTERPIECE OF THE TRIP:
${preferences.specialRequests}

STRICT ITINERARY REQUIREMENTS FOR EVENT:
1. Event Integration:
   - The specified event is the MAIN FOCUS of the trip
   - ALL event sessions must be included in the itinerary
   - Each session should be clearly marked in activities
   - Do not schedule other major activities during event times
   - Specify the exact time of the event in the activities research the website of the event to get the exact time, if no times are specified, suggest the best time to arrive for the event

2. Transportation & Logistics:
   - Include detailed transport to/from each session
   - Factor in traffic and security check times
   - Suggest optimal departure times from hotel
   - Include parking/drop-off information if available

3. Complementary Activities:
   - Plan activities that enhance the event experience
   - Include relevant fan zones or event villages
   - Suggest nearby attractions for non-event times
   - Include post-session dining or entertainment aligned with event timing

4. Accommodation:
   - Suggest hotels close to the event venue
   - Consider traffic patterns during event days
   - Include luxury properties with event shuttle services if available

5. Special Considerations:
   - Note best times to arrive for optimal experience
   - Include backup plans for weather delays
   - List essential items to bring for the event`;
    }

    return `You are a luxury travel itinerary planning assistant specializing in creating detailed, premium travel experiences. Generate a comprehensive luxury travel itinerary with detailed pricing breakdowns and recommendations.

IMPORTANT:
* Respond with ONLY valid, compact JSON. Do NOT include markdown, code fences, or any extra text.
* Provide comprehensive, detailed itineraries with specific times, locations, and pricing.
* Include multiple activities per day with realistic timing and costs.
* Be thorough in your recommendations and pricing breakdowns.

CLIENT INFORMATION:
- Name: ${preferences.clientName}
- Travel Type: ${preferences.travelType || 'Not specified'}
- From: ${preferences.fromLocation || 'Not specified'}
- To: ${preferences.destination}
- Preferred Transport: ${preferences.transportType || 'Not specified'}
- Dates: ${preferences.startDate} to ${preferences.endDate} (${duration} days)
- Number of Travelers: ${preferences.numberOfTravelers}
- Total Budget: ${preferences.budget.min}-${preferences.budget.max} ${preferences.budget.currency}
${selectedComponentsCost > 0 ? `- Selected Components Cost: ${selectedComponentsCost} ${preferences.budget.currency}` : ''}
${selectedComponentsCost > 0 ? `- Remaining Budget for Activities: ${remainingBudget} ${preferences.budget.currency}` : ''}
${selectedComponentsCost > 0 ? `- Budget per Day (Remaining): ~${remainingBudgetPerDay.toFixed(0)} ${preferences.budget.currency}` : `- Budget per Day: ~${budgetPerDay.toFixed(0)} ${preferences.budget.currency}`}
- Budget per Person: ~${budgetPerPerson.toFixed(0)} ${preferences.budget.currency}

PREFERENCES:
- Tone: ${preferences.preferences.tone}
- Pace: ${preferences.preferences.pace}
- Interests: ${preferences.preferences.interests.join(', ')}
- Accommodation Types: ${preferences.preferences.accommodationType.join(', ')}
- Dining Preferences: ${preferences.preferences.diningPreferences.join(', ')}
${preferences.specialRequests ? `- Special Requests: ${preferences.specialRequests}` : ''}${selectedComponentsInfo}${eventInstructions}

INSTRUCTIONS:
1. Create a detailed daily itinerary with specific times, locations, and activities
2. Focus on creating engaging activities and experiences - pricing will be calculated separately from selected components
3. ${preferences.selectedHotels && preferences.selectedHotels.length > 0 ? 'Use the selected hotels that are already booked - do not recommend different hotels' : 'Recommend specific luxury hotels/resorts (pricing will be calculated separately)'}
4. ${preferences.selectedFlights && preferences.selectedFlights.length > 0 ? 'Use the selected flights that are already booked - do not recommend different flights' : 'Include transport recommendations (pricing will be calculated separately)'}
5. Suggest premium activities and experiences (do not include pricing)
6. Recommend fine dining establishments (do not include pricing)
7. Consider the tone and interests when selecting activities
8. Focus on creating a compelling itinerary that matches the traveler's preferences
9. Include insider tips and luxury touches
10. Add special experiences that match the traveler's preferences${isEventTrip ? `
11. Make the specified event the absolute centerpiece of the itinerary
12. Schedule all activities around the event timing
13. Include event-specific logistics and recommendations` : ''}
${preferences.selectedFlights && preferences.selectedFlights.length > 0 ? `
14. Incorporate the selected flights into the itinerary with proper timing
15. Plan airport transfers and connections based on the selected flight times` : ''}
${preferences.selectedHotels && preferences.selectedHotels.length > 0 ? `
16. Use the selected hotels as the base for all daily activities
17. Plan activities around the selected hotel locations` : ''}

IMPORTANT: Do not include any pricing information in the response. Focus only on creating the itinerary, activities, and recommendations. Pricing will be calculated separately from the selected components.

Respond with ONLY a JSON object in this exact format, with no additional text or formatting:
{
  "title": string,
  "destination": string,
  "clientName": string,
  "days": [
    {
      "date": string,
      "activities": [
        {
          "time": string,
          "description": string,
          "location": string,
          "notes": string,
          "estimatedCost": number,
          "costType": "per-person" | "total"
        }
      ]
    }
  ],
  "summary": string,
  "totalBudget": {
    "amount": number,
    "currency": string
  },
  "budgetBreakdown": {
    "accommodation": {
      "total": number,
      "perNight": number,
      "hotelRecommendations": [
        {
          "name": string,
          "location": string,
          "pricePerNight": number,
          "rating": string,
          "amenities": string[]
        }
      ]
    },
    "transportation": {
      "total": number,
      "breakdown": [
        {
          "type": string,
          "description": string,
          "cost": number
        }
      ]
    },
    "activities": {
      "total": number,
      "breakdown": [
        {
          "name": string,
          "cost": number,
          "type": string
        }
      ]
    },
    "dining": {
      "total": number,
      "perDay": number,
      "recommendations": [
        {
          "name": string,
          "cuisine": string,
          "priceRange": string,
          "location": string
        }
      ]
    },
    "miscellaneous": {
      "total": number,
      "description": string
    }
  },
  "luxuryHighlights": [
    {
      "title": string,
      "description": string,
      "whyLuxury": string
    }
  ],
  "travelTips": [
    {
      "category": string,
      "tips": string[]
    }
  ]
}`;
  }

  private buildQuotePrompt(preferences: TripPreferences): string {
    const duration = Math.ceil((new Date(preferences.endDate).getTime() - new Date(preferences.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const budgetPerDay = preferences.budget.max / duration;
    const budgetPerPerson = preferences.budget.max / preferences.numberOfTravelers;

    // Build selected components information
    let selectedComponentsInfo = '';
    let selectedComponentsCost = 0;
    
    if (preferences.selectedFlights && preferences.selectedFlights.length > 0) {
      selectedComponentsInfo += '\n\nSELECTED FLIGHTS (ALREADY BOOKED):\n';
      preferences.selectedFlights.forEach((flight, index) => {
        selectedComponentsInfo += `${index + 1}. ${flight.originAirport} → ${flight.destinationAirport}\n`;
        selectedComponentsInfo += `   - Class: ${flight.cabinClass}\n`;
        if (flight.airline) selectedComponentsInfo += `   - Airline: ${flight.airline}\n`;
        if (flight.flightNumber) selectedComponentsInfo += `   - Flight: ${flight.flightNumber}\n`;
        if (flight.departureTime) selectedComponentsInfo += `   - Departure: ${flight.departureTime}\n`;
        if (flight.arrivalTime) selectedComponentsInfo += `   - Arrival: ${flight.arrivalTime}\n`;
        selectedComponentsInfo += `   - Price: ${flight.total} ${flight.currency}\n`;
        selectedComponentsCost += flight.total;
      });
    }

    if (preferences.selectedHotels && preferences.selectedHotels.length > 0) {
      selectedComponentsInfo += '\n\nSELECTED HOTELS (ALREADY BOOKED):\n';
      preferences.selectedHotels.forEach((hotel, index) => {
        selectedComponentsInfo += `${index + 1}. ${hotel.hotelName}\n`;
        selectedComponentsInfo += `   - Location: ${hotel.destinationCity}\n`;
        selectedComponentsInfo += `   - Rooms: ${hotel.numberOfRooms}\n`;
        selectedComponentsInfo += `   - Room Types: ${hotel.roomTypes.join(', ')}\n`;
        if (hotel.starRating) selectedComponentsInfo += `   - Rating: ${hotel.starRating}★\n`;
        selectedComponentsInfo += `   - Price per Night: ${hotel.pricePerNight} ${hotel.currency}\n`;
        if (hotel.checkIn) selectedComponentsInfo += `   - Check-in: ${hotel.checkIn}\n`;
        if (hotel.checkOut) selectedComponentsInfo += `   - Check-out: ${hotel.checkOut}\n`;
        // Calculate total hotel cost for the trip duration
        selectedComponentsCost += hotel.pricePerNight * hotel.numberOfRooms * duration;
      });
    }

    if (preferences.selectedEvent && preferences.selectedTicket) {
      selectedComponentsInfo += '\n\nSELECTED EVENT (ALREADY BOOKED):\n';
      selectedComponentsInfo += `- Event: ${preferences.selectedEvent.name}\n`;
      selectedComponentsInfo += `- Date: ${preferences.selectedEvent.dateOfEvent}\n`;
      selectedComponentsInfo += `- Venue: ${preferences.selectedEvent.venue.name}, ${preferences.selectedEvent.venue.city}\n`;
      selectedComponentsInfo += `- Ticket Type: ${preferences.selectedTicket.categoryName}\n`;
      selectedComponentsInfo += `- Price: ${preferences.selectedTicket.price} ${preferences.selectedTicket.currency}\n`;
      selectedComponentsCost += preferences.selectedTicket.price * preferences.numberOfTravelers;
    }

    // Calculate remaining budget for other activities
    const remainingBudget = preferences.budget.max - selectedComponentsCost;
    const remainingBudgetPerDay = remainingBudget / duration;

    return `You are a luxury travel quote generation assistant. Create a professional, detailed quote for a luxury travel experience.

IMPORTANT:
* Respond with ONLY valid, compact JSON. Do NOT include markdown, code fences, or any extra text.
* Focus on creating a compelling, professional quote with detailed pricing.
* Include luxury touches and premium recommendations.

CLIENT INFORMATION:
- Name: ${preferences.clientName}
- Destination: ${preferences.destination}
- Dates: ${preferences.startDate} to ${preferences.endDate} (${duration} days)
- Number of Travelers: ${preferences.numberOfTravelers}
- Total Budget: ${preferences.budget.min}-${preferences.budget.max} ${preferences.budget.currency}
${selectedComponentsCost > 0 ? `- Selected Components Cost: ${selectedComponentsCost} ${preferences.budget.currency}` : ''}
${selectedComponentsCost > 0 ? `- Remaining Budget for Activities: ${remainingBudget} ${preferences.budget.currency}` : ''}
${selectedComponentsCost > 0 ? `- Budget per Day (Remaining): ~${remainingBudgetPerDay.toFixed(0)} ${preferences.budget.currency}` : `- Budget per Day: ~${budgetPerDay.toFixed(0)} ${preferences.budget.currency}`}
- Budget per Person: ~${budgetPerPerson.toFixed(0)} ${preferences.budget.currency}
- Travel Type: ${preferences.travelType || 'Luxury'}
- From: ${preferences.fromLocation || 'Not specified'}

PREFERENCES:
- Tone: ${preferences.preferences.tone}
- Pace: ${preferences.preferences.pace}
- Interests: ${preferences.preferences.interests.join(', ')}
- Accommodation Types: ${preferences.preferences.accommodationType.join(', ')}
- Dining Preferences: ${preferences.preferences.diningPreferences.join(', ')}
${preferences.specialRequests ? `- Special Requests: ${preferences.specialRequests}` : ''}${selectedComponentsInfo}

QUOTE REQUIREMENTS:
1. Create a compelling title that reflects the luxury nature of the trip
2. Provide a detailed summary highlighting the unique aspects
3. Focus on creating engaging content - pricing will be calculated separately from selected components
4. ${preferences.selectedHotels && preferences.selectedHotels.length > 0 ? 'Use the selected hotels that are already booked - do not recommend different hotels' : 'Recommend premium accommodations (pricing will be calculated separately)'}
5. ${preferences.selectedFlights && preferences.selectedFlights.length > 0 ? 'Use the selected flights that are already booked - do not recommend different flights' : 'Include luxury transportation recommendations (pricing will be calculated separately)'}
6. Suggest exclusive activities and experiences (do not include pricing)
7. Recommend fine dining establishments (do not include pricing)
8. Add luxury highlights that make this trip special
9. Include professional travel tips
10. Ensure the quote feels premium and exclusive
11. Focus on creating compelling content that showcases the luxury experience
12. ${preferences.selectedEvent ? 'Make the selected event the centerpiece of the quote' : ''}

IMPORTANT: Do not include any pricing information in the response. Focus only on creating compelling content, recommendations, and highlights. Pricing will be calculated separately from the selected components.

Respond with ONLY a JSON object in this exact format, with no additional text or formatting:
{
  "title": string,
  "destination": string,
  "clientName": string,
  "days": [
    {
      "date": string,
      "activities": [
        {
          "time": string,
          "description": string,
          "location": string,
          "notes": string,
          "estimatedCost": number,
          "costType": "per-person" | "total"
        }
      ]
    }
  ],
  "summary": string,
  "totalBudget": {
    "amount": number,
    "currency": string
  },
  "budgetBreakdown": {
    "accommodation": {
      "total": number,
      "perNight": number,
      "hotelRecommendations": [
        {
          "name": string,
          "location": string,
          "pricePerNight": number,
          "rating": string,
          "amenities": string[]
        }
      ]
    },
    "transportation": {
      "total": number,
      "breakdown": [
        {
          "type": string,
          "description": string,
          "cost": number
        }
      ]
    },
    "activities": {
      "total": number,
      "breakdown": [
        {
          "name": string,
          "cost": number,
          "type": string
        }
      ]
    },
    "dining": {
      "total": number,
      "perDay": number,
      "recommendations": [
        {
          "name": string,
          "cuisine": string,
          "priceRange": string,
          "location": string
        }
      ]
    },
    "miscellaneous": {
      "total": number,
      "description": string
    }
  },
  "luxuryHighlights": [
    {
      "title": string,
      "description": string,
      "whyLuxury": string
    }
  ],
  "travelTips": [
    {
      "category": string,
      "tips": string[]
    }
  ]
}`;
  }
}

// Create a singleton instance
let geminiInstance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiInstance) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not defined in environment variables');
    }
    geminiInstance = new GeminiService(apiKey);
  }
  return geminiInstance;
}

export const gemini = getGeminiService(); 