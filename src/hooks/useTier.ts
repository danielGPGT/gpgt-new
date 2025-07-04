import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { TierManager } from '@/lib/tierManager';

export function useTier() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('unlimited');
  const [usage, setUsage] = useState({
    itineraries_created: 0,
    pdf_downloads: 0,
    api_calls: 0,
    limit_reached: {
      itineraries: false,
      pdf_downloads: false,
      api_calls: false,
    },
  });

  const tierManager = TierManager.getInstance();

  const initializeTier = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await tierManager.initialize(user.id);
      setCurrentPlan(tierManager.getCurrentPlan());
      
      const currentUsage = await tierManager.getCurrentUsage();
      setUsage(currentUsage);
    } catch (error) {
      console.error('Error initializing tier:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    initializeTier();
  }, [initializeTier]);

  const incrementUsage = useCallback(async (type: 'itineraries' | 'pdf_downloads' | 'api_calls') => {
    if (!user?.id) return false;
    
    const success = await tierManager.incrementUsage(type);
    if (success) {
      const currentUsage = await tierManager.getCurrentUsage();
      setUsage(currentUsage);
    }
    return success;
  }, [user?.id]);

  const canCreateItinerary = () => {
    return tierManager.canCreateItinerary();
  };

  const canDownloadPDF = () => {
    return tierManager.canDownloadPDF();
  };

  const canUseAPI = () => {
    return tierManager.canUseAPI();
  };

  const hasCustomBranding = () => {
    return tierManager.hasCustomBranding();
  };

  const hasWhiteLabel = () => {
    return tierManager.hasWhiteLabel();
  };

  const hasPrioritySupport = () => {
    return tierManager.hasPrioritySupport();
  };

  const hasTeamCollaboration = () => {
    return tierManager.hasTeamCollaboration();
  };

  const hasAdvancedAIFeatures = () => {
    return tierManager.hasAdvancedAIFeatures();
  };

  const getPlanLimits = () => {
    return tierManager.getPlanLimits();
  };

  const getUpgradeMessage = () => {
    return tierManager.getUpgradeMessage();
  };

  const getLimitReachedMessage = (type: 'itineraries' | 'pdf_downloads' | 'api_calls') => {
    return tierManager.getLimitReachedMessage(type);
  };

  const createSubscription = async (planType: 'starter' | 'professional' | 'enterprise') => {
    if (!user) return false;
    
    const success = await tierManager.createSubscription(user.id, planType);
    if (success) {
      await initializeTier();
    }
    return success;
  };

  const updateSubscription = async (planType: 'starter' | 'professional' | 'enterprise') => {
    if (!user) return false;
    
    const success = await tierManager.updateSubscription(user.id, planType);
    if (success) {
      await initializeTier();
    }
    return success;
  };

  const cancelSubscription = async () => {
    if (!user) return false;
    
    const success = await tierManager.cancelSubscription(user.id);
    if (success) {
      await initializeTier();
    }
    return success;
  };

  return {
    isLoading,
    currentPlan,
    usage,
    incrementUsage,
    canCreateItinerary,
    canDownloadPDF,
    canUseAPI,
    hasCustomBranding,
    hasWhiteLabel,
    hasPrioritySupport,
    hasTeamCollaboration,
    hasAdvancedAIFeatures,
    getPlanLimits,
    getUpgradeMessage,
    getLimitReachedMessage,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    refresh: initializeTier,
  };
} 