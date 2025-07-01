import { useState, useCallback } from 'react';
import { QuoteService, QuoteResponse } from '@/lib/quoteService';
import { QuoteInput } from '@/utils/createQuotePayload';
import { toast } from 'sonner';

export interface UseQuoteServiceReturn {
  // Quote creation
  createQuote: (quoteData: QuoteInput) => Promise<QuoteResponse | null>;
  isCreatingQuote: boolean;
  
  // Quote fetching
  getUserQuotes: () => Promise<QuoteResponse[]>;
  getQuoteById: (quoteId: string) => Promise<QuoteResponse | null>;
  isFetchingQuotes: boolean;
  
  // Quote management
  updateQuoteStatus: (quoteId: string, status: 'draft' | 'confirmed' | 'cancelled') => Promise<void>;
  isUpdatingQuote: boolean;
  
  // Quote deletion
  deleteQuote: (quoteId: string) => Promise<boolean>;
  isDeletingQuote: boolean;
  
  // Quote confirmation
  confirmQuote: (quoteId: string) => Promise<string | null>;
  isConfirmingQuote: boolean;
  
  // Booking creation
  createBooking: (quoteId: string, bookingData: any) => Promise<string | null>;
  isCreatingBooking: boolean;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export function useQuoteService(): UseQuoteServiceReturn {
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [isFetchingQuotes, setIsFetchingQuotes] = useState(false);
  const [isUpdatingQuote, setIsUpdatingQuote] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isConfirmingQuote, setIsConfirmingQuote] = useState(false);
  const [isDeletingQuote, setIsDeletingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createQuote = useCallback(async (quoteData: QuoteInput): Promise<QuoteResponse | null> => {
    setIsCreatingQuote(true);
    setError(null);
    
    try {
      const quote = await QuoteService.createQuote(quoteData);
      toast.success('Quote created successfully!');
      return quote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create quote';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsCreatingQuote(false);
    }
  }, []);

  const getUserQuotes = useCallback(async (): Promise<QuoteResponse[]> => {
    setIsFetchingQuotes(true);
    setError(null);
    
    try {
      const quotes = await QuoteService.getQuotes();
      return quotes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quotes';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsFetchingQuotes(false);
    }
  }, []);

  const getQuoteById = useCallback(async (quoteId: string): Promise<QuoteResponse | null> => {
    setIsFetchingQuotes(true);
    setError(null);
    
    try {
      const quote = await QuoteService.getQuoteById(quoteId);
      return quote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quote';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsFetchingQuotes(false);
    }
  }, []);

  const updateQuoteStatus = useCallback(async (quoteId: string, status: 'draft' | 'confirmed' | 'cancelled'): Promise<void> => {
    setIsUpdatingQuote(true);
    setError(null);
    
    try {
      await QuoteService.updateQuoteStatus(quoteId, status);
      toast.success(`Quote status updated to ${status}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update quote status';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdatingQuote(false);
    }
  }, []);

  const deleteQuote = useCallback(async (quoteId: string): Promise<boolean> => {
    setIsDeletingQuote(true);
    setError(null);
    
    try {
      await QuoteService.deleteQuote(quoteId);
      toast.success('Quote deleted successfully!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quote';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsDeletingQuote(false);
    }
  }, []);

  const confirmQuote = useCallback(async (quoteId: string): Promise<string | null> => {
    setIsConfirmingQuote(true);
    setError(null);
    
    try {
      const confirmation = await QuoteService.confirmQuote(quoteId);
      toast.success('Quote confirmed successfully!');
      return confirmation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm quote';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsConfirmingQuote(false);
    }
  }, []);

  const createBooking = useCallback(async (quoteId: string, bookingData: any): Promise<string | null> => {
    setIsCreatingBooking(true);
    setError(null);
    
    try {
      const bookingId = await QuoteService.createBooking(quoteId, bookingData);
      toast.success('Booking created successfully!');
      return bookingId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsCreatingBooking(false);
    }
  }, []);

  return {
    createQuote,
    isCreatingQuote,
    getUserQuotes,
    getQuoteById,
    isFetchingQuotes,
    updateQuoteStatus,
    isUpdatingQuote,
    deleteQuote,
    isDeletingQuote,
    confirmQuote,
    isConfirmingQuote,
    createBooking,
    isCreatingBooking,
    error,
    clearError,
  };
} 