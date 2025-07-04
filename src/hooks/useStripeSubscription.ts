import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { StripeService, type SubscriptionData } from '@/lib/stripeService';
import { TierManager } from '@/lib/tierManager';
import { toast } from 'sonner';

export function useStripeSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pricing, setPricing] = useState<any>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const loadSubscription = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      
      // Always return unlimited subscription
      const unlimitedSubscription = await StripeService.getCurrentSubscription(user.id);
      setSubscription(unlimitedSubscription);

      // Initialize tier manager
      const tierManager = TierManager.getInstance();
      await tierManager.initialize(user.id);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refreshSubscription = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      const unlimitedSubscription = await StripeService.getCurrentSubscription(user.id);
      setSubscription(unlimitedSubscription);

      const tierManager = TierManager.getInstance();
      await tierManager.initialize(user.id);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setSubscription(null);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      setPricingLoading(true);
      const result = await StripeService.getPricing();
      if (result.success) {
        setPricing(result.pricing);
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
    } finally {
      setPricingLoading(false);
    }
  };

  const createSubscription = useCallback(async (
    planType: 'free' | 'pro' | 'agency' | 'enterprise',
    email: string,
    name?: string,
    options?: { seatCount?: number }
  ) => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    setProcessing(true);
    try {
      const result = await StripeService.createSubscription(
        user.id,
        planType,
        email,
        name,
        options
      );

      if (result.success) {
        await refreshSubscription();
        toast.success('Subscription created successfully');
      } else {
        toast.error(result.error || 'Failed to create subscription');
      }

      return result;
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to create subscription');
      return { success: false, error: 'Unknown error occurred' };
    } finally {
      setProcessing(false);
    }
  }, [user?.id, refreshSubscription]);

  const updateSubscription = useCallback(async (
    newPlanType: 'free' | 'pro' | 'agency' | 'enterprise'
  ) => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    setProcessing(true);
    try {
      const result = await StripeService.updateSubscription(user.id, newPlanType);

      if (result.success) {
        await refreshSubscription();
        toast.success('Subscription updated successfully');
      } else {
        toast.error(result.error || 'Failed to update subscription');
      }

      return result;
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
      return { success: false, error: 'Unknown error occurred' };
    } finally {
      setProcessing(false);
    }
  }, [user?.id, refreshSubscription]);

  const cancelSubscription = useCallback(async () => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    setProcessing(true);
    try {
      const result = await StripeService.cancelSubscription(user.id);

      if (result.success) {
        await refreshSubscription();
        toast.success('Subscription canceled successfully');
      } else {
        toast.error(result.error || 'Failed to cancel subscription');
      }

      return result;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
      return { success: false, error: 'Unknown error occurred' };
    } finally {
      setProcessing(false);
    }
  }, [user?.id, refreshSubscription]);

  const openBillingPortal = useCallback(async () => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    setProcessing(true);
    try {
      const result = await StripeService.getBillingPortalUrl(user.id);

      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error(result.error || 'Failed to open billing portal');
      }

      return result;
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Failed to open billing portal');
      return { success: false, error: 'Unknown error occurred' };
    } finally {
      setProcessing(false);
    }
  }, [user?.id]);

  const hasAccess = useCallback((feature: string) => {
    return true; // All features available
  }, []);

  const getDaysUntilRenewal = useCallback(() => {
    return null; // No renewal needed
  }, []);

  const getFormattedRenewalDate = useCallback(() => {
    return null; // No renewal needed
  }, []);

  const getPlanPrice = (planType: 'free' | 'pro' | 'agency' | 'enterprise') => {
    return 'Free'; // All plans are free
  };

  const getPlanFeatures = (planType: 'free' | 'pro' | 'agency' | 'enterprise') => {
    return [
      'Unlimited itineraries',
      'Unlimited PDF downloads',
      'Unlimited API calls',
      'All features included',
      'No restrictions',
      'Priority support',
      'Custom branding',
      'White label',
      'Team collaboration',
      'Advanced AI features',
      'Analytics dashboard',
      'Bulk operations'
    ];
  };

  const getCurrentPlan = () => {
    return 'unlimited';
  };

  const isSubscriptionActive = () => {
    return true;
  };

  const isSubscriptionCanceled = () => {
    return false;
  };

  return {
    // State
    subscription,
    loading,
    processing,
    pricing,
    pricingLoading,
    
    // Actions
    createSubscription,
    updateSubscription,
    cancelSubscription,
    openBillingPortal,
    loadSubscription,
    refreshSubscription,
    
    // Computed values
    getPlanPrice,
    getPlanFeatures,
    getCurrentPlan,
    isSubscriptionActive,
    isSubscriptionCanceled,
    hasAccess,
    getDaysUntilRenewal,
    getFormattedRenewalDate,
  };
} 