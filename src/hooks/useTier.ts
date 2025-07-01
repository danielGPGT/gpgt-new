import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { tierManager } from '@/lib/tierManager';

export function useTier() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<'starter' | 'professional' | 'enterprise'>('starter');
  const [usage, setUsage] = useState<{
    itineraries_created: number;
    pdf_downloads: number;
    api_calls: number;
    limit_reached: {
      itineraries: boolean;
      pdf_downloads: boolean;
      api_calls: boolean;
    };
  } | null>(null);

  useEffect(() => {
    if (user) {
      initializeTier();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const initializeTier = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await tierManager.initialize(user.id);
      setCurrentPlan(tierManager.getCurrentPlan());
      setUsage(tierManager.getCurrentUsage());
    } catch (error) {
      console.error('Error initializing tier manager:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const incrementUsage = async (type: 'itineraries' | 'pdf_downloads' | 'api_calls') => {
    if (!user) return false;
    
    const success = await tierManager.incrementUsage(type);
    if (success) {
      setUsage(tierManager.getCurrentUsage());
    }
    return success;
  };

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