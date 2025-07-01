import { create } from 'zustand';
import { Store, User, Itinerary } from '../types';

export const useStore = create<Store>((set) => ({
  currentUser: null,
  currentItinerary: null,
  savedItineraries: [],
  
  setCurrentUser: (user: User | null) => set({ currentUser: user }),
  
  setCurrentItinerary: (itinerary: Itinerary | null) => 
    set({ currentItinerary: itinerary }),
  
  addSavedItinerary: (itinerary: Itinerary) => 
    set((state) => ({
      savedItineraries: [...state.savedItineraries, itinerary]
    })),
  
  removeSavedItinerary: (id: string) =>
    set((state) => ({
      savedItineraries: state.savedItineraries.filter((i) => i.id !== id)
    })),
})); 