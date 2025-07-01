import { create } from 'zustand';
import { TripIntake } from '@/types/trip';

export type IntakeData = TripIntake;

type IntakeStore = {
  intakeData: IntakeData | null;
  setIntakeData: (data: IntakeData) => void;
  updateEventData: (event: any, ticket: any) => void;
};

export const useIntakeStore = create<IntakeStore>((set) => ({
  intakeData: null,
  setIntakeData: (data) => set({ intakeData: data }),
  updateEventData: (event, ticket) => set((state) => ({
    intakeData: {
      ...state.intakeData,
      selectedEvent: event,
      selectedTicket: ticket
    }
  })),
})); 