export interface User {
  id: string;
  email: string;
  name: string;
  agencyName?: string;
  logo?: string;
}

export interface TripPreferences {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  tone: 'luxury' | 'playful' | 'romantic' | 'adventure';
  travelType: 'solo' | 'couple' | 'group';
  budget: 'luxury' | 'premium' | 'standard';
  clientName: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time?: string;
  location?: string;
  cost?: string;
  image?: string;
}

export interface Day {
  id: string;
  dayNumber: number;
  title: string;
  narrative: string;
  activities: Activity[];
}

export interface Itinerary {
  id: string;
  title: string;
  clientName: string;
  destination: string;
  generatedBy: string;
  dateCreated: string;
  preferences: TripPreferences;
  days: Day[];
}

export interface Store {
  currentUser: User | null;
  currentItinerary: Itinerary | null;
  savedItineraries: Itinerary[];
  setCurrentUser: (user: User | null) => void;
  setCurrentItinerary: (itinerary: Itinerary | null) => void;
  addSavedItinerary: (itinerary: Itinerary) => void;
  removeSavedItinerary: (id: string) => void;
} 