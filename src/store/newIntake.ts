import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NewIntake } from '@/types/newIntake';

type NewIntakeStore = {
  // Form data
  intakeData: NewIntake | null;
  
  // Form state
  currentStep: number;
  isSubmitting: boolean;
  lastSaved: string | null;
  
  // Actions
  setIntakeData: (data: NewIntake) => void;
  updateIntakeData: (updates: Partial<NewIntake>) => void;
  setCurrentStep: (step: number) => void;
  resetForm: () => void;
  
  // Draft management
  saveDraft: () => void;
  loadDraft: (draftId: string) => void;
  clearDraft: () => void;
  
  // Client management
  setClient: (client: NewIntake['client']) => void;
  setIsNewClient: (isNew: boolean) => void;
  
  // Group management
  addGroup: (group: NewIntake['tripDetails']['groups'][0]) => void;
  updateGroup: (groupId: string, updates: Partial<NewIntake['tripDetails']['groups'][0]>) => void;
  removeGroup: (groupId: string) => void;
  duplicateGroup: (groupId: string) => void;
  
  // Section toggles
  toggleSection: (section: 'flights' | 'hotels' | 'transfers' | 'events', enabled: boolean) => void;
  
  // Event management
  addEvent: (event: NewIntake['events']['events'][0]) => void;
  updateEvent: (eventId: string, updates: Partial<NewIntake['events']['events'][0]>) => void;
  removeEvent: (eventId: string) => void;
};

// Default form data
const defaultIntakeData: NewIntake = {
  client: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    preferences: {
      language: 'en',
      tone: 'luxury',
      notes: '',
    },
    pastTrips: [],
  },
  isNewClient: false,
  tripDetails: {
    tripName: '',
    primaryDestination: '',
    startDate: '',
    endDate: '',
    duration: 0,
    purpose: 'leisure',
    totalTravelers: {
      adults: 1,
      children: 0,
    },
    useSubgroups: false,
    groups: [],
  },
  preferences: {
    tone: 'luxury',
    currency: 'GBP',
    budget: {
      amount: 0,
      type: 'total',
    },
    language: 'en',
    specialRequests: '',
    travelPriorities: ['comfort', 'experience'],
  },
  flights: {
    enabled: false,
    groups: [],
  },
  hotels: {
    enabled: false,
    groups: [],
  },
  transfers: {
    enabled: false,
    groups: [],
  },
  events: {
    enabled: false,
    events: [],
  },
  summary: {
    internalNotes: '',
    quoteReference: '',
    agentId: '',
  },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    version: '1.0',
  },
};

export const useNewIntakeStore = create<NewIntakeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      intakeData: null,
      currentStep: 0,
      isSubmitting: false,
      lastSaved: null,
      
      // Actions
      setIntakeData: (data) => {
        set({ 
          intakeData: data,
          lastSaved: new Date().toISOString(),
        });
      },
      
      updateIntakeData: (updates) => {
        const current = get().intakeData || defaultIntakeData;
        const updated = {
          ...current,
          ...updates,
          metadata: {
            ...current.metadata,
            updatedAt: new Date().toISOString(),
          },
        };
        set({ 
          intakeData: updated,
          lastSaved: new Date().toISOString(),
        });
      },
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      resetForm: () => {
        set({
          intakeData: null,
          currentStep: 0,
          isSubmitting: false,
          lastSaved: null,
        });
      },
      
      saveDraft: () => {
        const { intakeData } = get();
        if (intakeData) {
          const draftId = `draft_${Date.now()}`;
          const drafts = JSON.parse(localStorage.getItem('newIntakeDrafts') || '{}');
          drafts[draftId] = {
            ...intakeData,
            metadata: {
              ...intakeData.metadata,
              updatedAt: new Date().toISOString(),
            },
          };
          localStorage.setItem('newIntakeDrafts', JSON.stringify(drafts));
          set({ lastSaved: new Date().toISOString() });
        }
      },
      
      loadDraft: (draftId) => {
        const drafts = JSON.parse(localStorage.getItem('newIntakeDrafts') || '{}');
        const draft = drafts[draftId];
        if (draft) {
          set({ intakeData: draft });
        }
      },
      
      clearDraft: () => {
        localStorage.removeItem('newIntakeDrafts');
      },
      
      setClient: (client) => {
        const current = get().intakeData || defaultIntakeData;
        set({
          intakeData: {
            ...current,
            client,
            metadata: {
              ...current.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },
      
      setIsNewClient: (isNew) => {
        const current = get().intakeData || defaultIntakeData;
        set({
          intakeData: {
            ...current,
            isNewClient: isNew,
            metadata: {
              ...current.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },
      
      addGroup: (group) => {
        const current = get().intakeData || defaultIntakeData;
        const updatedGroups = [...current.tripDetails.groups, group];
        set({
          intakeData: {
            ...current,
            tripDetails: {
              ...current.tripDetails,
              groups: updatedGroups,
            },
            metadata: {
              ...current.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },
      
      updateGroup: (groupId, updates) => {
        const current = get().intakeData || defaultIntakeData;
        const updatedGroups = current.tripDetails.groups.map(group =>
          group.id === groupId ? { ...group, ...updates } : group
        );
        set({
          intakeData: {
            ...current,
            tripDetails: {
              ...current.tripDetails,
              groups: updatedGroups,
            },
            metadata: {
              ...current.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },
      
      removeGroup: (groupId) => {
        const current = get().intakeData || defaultIntakeData;
        const updatedGroups = current.tripDetails.groups.filter(group => group.id !== groupId);
        set({
          intakeData: {
            ...current,
            tripDetails: {
              ...current.tripDetails,
              groups: updatedGroups,
            },
            metadata: {
              ...current.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },
      
      duplicateGroup: (groupId) => {
        const current = get().intakeData || defaultIntakeData;
        const groupToDuplicate = current.tripDetails.groups.find(group => group.id === groupId);
        if (groupToDuplicate) {
          const duplicatedGroup = {
            ...groupToDuplicate,
            id: `group_${Date.now()}`,
            name: `${groupToDuplicate.name} (Copy)`,
          };
          const updatedGroups = [...current.tripDetails.groups, duplicatedGroup];
          set({
            intakeData: {
              ...current,
              tripDetails: {
                ...current.tripDetails,
                groups: updatedGroups,
              },
              metadata: {
                ...current.metadata,
                updatedAt: new Date().toISOString(),
              },
            },
          });
        }
      },
      
      toggleSection: (section, enabled) => {
        const current = get().intakeData || defaultIntakeData;
        set({
          intakeData: {
            ...current,
            [section]: {
              ...current[section],
              enabled,
            },
            metadata: {
              ...current.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },
      
      addEvent: (event) => {
        const current = get().intakeData || defaultIntakeData;
        const updatedEvents = [...current.events.events, event];
        set({
          intakeData: {
            ...current,
            events: {
              ...current.events,
              events: updatedEvents,
            },
            metadata: {
              ...current.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },
      
      updateEvent: (eventId, updates) => {
        const current = get().intakeData || defaultIntakeData;
        const updatedEvents = current.events.events.map(event =>
          event.id === eventId ? { ...event, ...updates } : event
        );
        set({
          intakeData: {
            ...current,
            events: {
              ...current.events,
              events: updatedEvents,
            },
            metadata: {
              ...current.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },
      
      removeEvent: (eventId) => {
        const current = get().intakeData || defaultIntakeData;
        const updatedEvents = current.events.events.filter(event => event.id !== eventId);
        set({
          intakeData: {
            ...current,
            events: {
              ...current.events,
              events: updatedEvents,
            },
            metadata: {
              ...current.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },
    }),
    {
      name: 'new-intake-storage',
      partialize: (state) => ({
        intakeData: state.intakeData,
        currentStep: state.currentStep,
        lastSaved: state.lastSaved,
      }),
    }
  )
); 