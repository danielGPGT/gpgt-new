import { create } from 'zustand';
import { Package, PackageBuilderStep, PackageFilters, DatabasePackage } from '@/types/packages';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PackageStore {
  // State
  packages: DatabasePackage[];
  currentPackage: Package | null;
  currentStep: PackageBuilderStep;
  isSubmitting: boolean;
  isGeneratingAI: boolean;
  isLoading: boolean;
  
  // Actions
  setCurrentStep: (step: PackageBuilderStep) => void;
  setCurrentPackage: (pkg: Package | null) => void;
  updateCurrentPackage: (updates: Partial<Package>) => void;
  resetBuilder: () => void;
  
  // Package CRUD operations
  createPackage: (pkg: Package) => Promise<string | null>;
  updatePackage: (id: string, updates: Partial<Package>) => Promise<boolean>;
  deletePackage: (id: string) => Promise<boolean>;
  fetchPackages: (filters?: PackageFilters) => Promise<void>;
  fetchPackage: (id: string) => Promise<Package | null>;
  
  // AI generation
  generateItineraryText: (pkg: Package) => Promise<string | null>;
  generateIntroCopy: (pkg: Package) => Promise<string | null>;
  
  // Package usage
  loadPackageIntoQuote: (packageId: string) => Promise<Package | null>;
  duplicatePackage: (id: string) => Promise<string | null>;
}

const defaultPackage: Package = {
  name: '',
  description: '',
  tags: [],
  durationDays: 7,
  minTravelers: 1,
  maxTravelers: undefined,
  isPublic: false,
  status: 'draft',
  destinations: [],
  flights: {
    enabled: false,
  },
  transfers: [],
  events: [],
  itineraryText: '',
  pricing: {
    basePrice: 0,
    currency: 'GBP',
    pricingType: 'per_person',
    marginType: 'percentage',
    marginValue: 0.15,
    internalNotes: '',
  },
  version: '1.0',
};

export const usePackageStore = create<PackageStore>((set, get) => ({
  // Initial state
  packages: [],
  currentPackage: null,
  currentStep: 'overview',
  isSubmitting: false,
  isGeneratingAI: false,
  isLoading: false,

  // Step management
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setCurrentPackage: (pkg) => set({ currentPackage: pkg }),
  
  updateCurrentPackage: (updates) => {
    const { currentPackage } = get();
    if (currentPackage) {
      set({ 
        currentPackage: { ...currentPackage, ...updates }
      });
    }
  },

  resetBuilder: () => {
    set({
      currentPackage: { ...defaultPackage },
      currentStep: 'overview',
      isSubmitting: false,
      isGeneratingAI: false,
    });
  },

  // Package CRUD operations
  createPackage: async (pkg) => {
    set({ isSubmitting: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('packages')
        .insert({
          user_id: user.id,
          name: pkg.name,
          description: pkg.description,
          tags: pkg.tags,
          duration_days: pkg.durationDays,
          min_travelers: pkg.minTravelers,
          max_travelers: pkg.maxTravelers,
          is_public: pkg.isPublic,
          status: pkg.status,
          destinations: pkg.destinations,
          flights: pkg.flights,
          transfers: pkg.transfers,
          events: pkg.events,
          itinerary_text: pkg.itineraryText,
          base_price: pkg.pricing.basePrice,
          currency: pkg.pricing.currency,
          pricing_type: pkg.pricing.pricingType,
          margin_type: pkg.pricing.marginType,
          margin_value: pkg.pricing.marginValue,
          internal_notes: pkg.pricing.internalNotes,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Package created successfully!');
      await get().fetchPackages();
      return data.id;
    } catch (error) {
      console.error('Error creating package:', error);
      toast.error('Failed to create package');
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updatePackage: async (id, updates) => {
    set({ isSubmitting: true });
    try {
      const { error } = await supabase
        .from('packages')
        .update({
          name: updates.name,
          description: updates.description,
          tags: updates.tags,
          duration_days: updates.durationDays,
          min_travelers: updates.minTravelers,
          max_travelers: updates.maxTravelers,
          is_public: updates.isPublic,
          status: updates.status,
          destinations: updates.destinations,
          flights: updates.flights,
          transfers: updates.transfers,
          events: updates.events,
          itinerary_text: updates.itineraryText,
          base_price: updates.pricing?.basePrice,
          currency: updates.pricing?.currency,
          pricing_type: updates.pricing?.pricingType,
          margin_type: updates.pricing?.marginType,
          margin_value: updates.pricing?.marginValue,
          internal_notes: updates.pricing?.internalNotes,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Package updated successfully!');
      await get().fetchPackages();
      return true;
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error('Failed to update package');
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  deletePackage: async (id) => {
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Package deleted successfully!');
      await get().fetchPackages();
      return true;
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
      return false;
    }
  },

  fetchPackages: async (filters) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('packages')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`);

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic);
      }

      if (filters?.duration?.min) {
        query = query.gte('duration_days', filters.duration.min);
      }

      if (filters?.duration?.max) {
        query = query.lte('duration_days', filters.duration.max);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      set({ packages: data || [] });
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Failed to fetch packages');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPackage: async (id) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Convert database format to frontend format
      const packageData: Package = {
        id: data.id,
        name: data.name,
        description: data.description,
        tags: data.tags,
        durationDays: data.duration_days,
        minTravelers: data.min_travelers,
        maxTravelers: data.max_travelers,
        isPublic: data.is_public,
        status: data.status,
        destinations: data.destinations,
        flights: data.flights,
        transfers: data.transfers,
        events: data.events,
        itineraryText: data.itinerary_text,
        pricing: {
          basePrice: data.base_price || 0,
          currency: data.currency,
          pricingType: data.pricing_type,
          marginType: data.margin_type,
          marginValue: data.margin_value,
          internalNotes: data.internal_notes,
        },
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        version: data.version,
      };

      return packageData;
    } catch (error) {
      console.error('Error fetching package:', error);
      toast.error('Failed to fetch package');
      return null;
    }
  },

  // AI generation
  generateItineraryText: async (pkg) => {
    set({ isGeneratingAI: true });
    try {
      // This would integrate with your Gemini AI service
      // For now, return a placeholder
      const itineraryText = `Experience the perfect ${pkg.durationDays}-day journey through ${pkg.destinations.map(d => d.name).join(' and ')}. This carefully curated package offers luxury accommodations, exclusive experiences, and seamless travel arrangements.`;
      
      return itineraryText;
    } catch (error) {
      console.error('Error generating itinerary text:', error);
      toast.error('Failed to generate itinerary text');
      return null;
    } finally {
      set({ isGeneratingAI: false });
    }
  },

  generateIntroCopy: async (pkg) => {
    set({ isGeneratingAI: true });
    try {
      // This would integrate with your Gemini AI service
      const introCopy = `Discover the ultimate ${pkg.tags.join(', ')} experience with our exclusive ${pkg.name} package. Perfect for ${pkg.minTravelers}-${pkg.maxTravelers || 'unlimited'} travelers seeking an unforgettable adventure.`;
      
      return introCopy;
    } catch (error) {
      console.error('Error generating intro copy:', error);
      toast.error('Failed to generate intro copy');
      return null;
    } finally {
      set({ isGeneratingAI: false });
    }
  },

  // Package usage
  loadPackageIntoQuote: async (packageId) => {
    const packageData = await get().fetchPackage(packageId);
    if (packageData) {
      set({ currentPackage: packageData });
      return packageData;
    }
    return null;
  },

  duplicatePackage: async (id) => {
    const originalPackage = await get().fetchPackage(id);
    if (!originalPackage) return null;

    const duplicatedPackage: Package = {
      ...originalPackage,
      id: undefined,
      name: `${originalPackage.name} (Copy)`,
      status: 'draft',
      createdAt: undefined,
      updatedAt: undefined,
    };

    return await get().createPackage(duplicatedPackage);
  },
})); 