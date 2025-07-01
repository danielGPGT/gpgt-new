import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
let stripe: Stripe | null = null;

const initializeStripe = async () => {
  if (!stripe) {
    stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripe;
};

// Stripe Product IDs for each tier
const STRIPE_PRODUCTS = {
  free: null, // Free plan doesn't need Stripe product
  pro: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
  agency: import.meta.env.VITE_STRIPE_AGENCY_PRICE_ID,
  enterprise: null, // Enterprise is custom, not handled via Stripe checkout
};

// Supabase Edge Function URL
const STRIPE_HANDLER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-handler`;

export interface SubscriptionData {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired';
  plan_type: 'free' | 'pro' | 'agency' | 'enterprise';
  seat_count?: number;
  team_name?: string;
  base_price?: number;
  seat_price?: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  team_id: string | null;
}

export class StripeService {
  /**
   * Create a new subscription
   */
  static async createSubscription(
    userId: string | null,
    planType: 'free' | 'pro' | 'agency' | 'enterprise',
    customerEmail: string,
    customerName?: string,
    options?: { seatCount?: number },
    signupData?: { email: string; password: string; name: string }
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      if (planType === 'free') {
        // For free plan, create team/subscription in DB as before
        // Always find the user's team first
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('id, subscription_id')
          .or(`owner_id.eq.${userId},team_members.user_id.eq.${userId}`)
          .single();
        if (teamError || !team) {
          return { success: false, error: 'No team found for user' };
        }
        // Create free subscription for the team
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            team_id: team.id,
            plan_type: 'free',
            status: 'active',
            seat_count: 1,
            base_price: 0,
            seat_price: 0,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancel_at_period_end: false,
            stripe_subscription_id: undefined,
            stripe_customer_id: undefined
          })
          .select()
          .single();
        if (error) {
          console.error('Error creating free subscription:', error);
          return { success: false, error: 'Failed to create free subscription' };
        }
        // Update team with new subscription_id
        await supabase.from('teams').update({ subscription_id: data.id }).eq('id', team.id);
        return { success: true, subscriptionId: data.id };
      }
      // Handle enterprise plan: do not attempt Stripe checkout
      if (planType === 'enterprise') {
        return { success: false, error: 'Enterprise plans are custom. Please contact sales.' };
      }
      // For paid plans, DO NOT create any DB records yet. Only create Stripe Checkout session.
      const stripe = await initializeStripe();
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }
      // Create the checkout session
      const session = await this.createCheckoutSession(
        userId,
        planType,
        customerEmail,
        customerName,
        options,
        signupData
      );
      if (!session.success) {
        return { success: false, error: session.error };
      }
      
      // Redirect to Stripe Checkout with better error handling
      try {
        const { error } = await stripe.redirectToCheckout({
          sessionId: session.sessionId!,
        });
        
        if (error) {
          console.error('Stripe checkout error:', error);
          return { success: false, error: error.message };
        }
        
        // If no error, the redirect should have happened
        return { success: true, subscriptionId: session.sessionId };
      } catch (redirectError) {
        console.error('Redirect error:', redirectError);
        // If redirect fails, return the session ID so the caller can handle it
        return { 
          success: true, 
          subscriptionId: session.sessionId,
          error: 'Redirect failed, but session created. Please try again.'
        };
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Create a Stripe checkout session
   */
  static async createCheckoutSession(
    userId: string | null,
    planType: 'free' | 'pro' | 'agency' | 'enterprise',
    customerEmail: string,
    customerName?: string,
    options?: { seatCount?: number },
    signupData?: { email: string; password: string; name: string }
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const priceId = STRIPE_PRODUCTS[planType];
      if (!priceId) {
        return { success: false, error: 'Invalid plan type' };
      }

      // Create checkout session using Supabase Edge Function
      const response = await fetch(STRIPE_HANDLER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'create-checkout-session',
          priceId,
          customerEmail,
          userId, // Can be null for new signups
          planType,
          seatCount: options?.seatCount,
          signupData, // Include signup data for account creation after payment
          successUrl: `${window.location.origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing?subscription=cancelled`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        return { success: false, error: `Server error: ${response.status}` };
      }

      const result = await response.json();
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, sessionId: result.sessionId };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get current subscription for a user
   */
  static async getCurrentSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      // 1. Find the user's teams (member)
      const memberTeamsRaw = (await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)).data;
      const memberTeams: Array<{ team_id: string | null }> = memberTeamsRaw ?? [];
      const memberTeamIds = memberTeams.map(tm => tm.team_id).filter((id): id is string => typeof id === 'string' && !!id);
      let teamId: string | undefined = undefined;
      if (memberTeamIds.length > 0) {
        teamId = memberTeamIds[0]!;
      }
      if (!teamId) {
        console.error('❌ No team found for user:', userId);
        return null;
      }
      // 2. Get the team's subscription
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('team_id', teamId as string)
        .single();
      if (error || !subscription) {
        console.error('❌ Database error fetching team subscription:', error);
        return null;
      }
      return subscription;
    } catch (error) {
      console.error('❌ Error in getCurrentSubscription:', error);
      return null;
    }
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  static async updateSubscription(
    userId: string,
    newPlanType: 'free' | 'pro' | 'agency' | 'enterprise'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const currentSubscription = await this.getCurrentSubscription(userId);
      if (!currentSubscription?.stripe_subscription_id) {
        return { success: false, error: 'No active subscription found to update.' };
      }

      const newPriceId = STRIPE_PRODUCTS[newPlanType];
      if (!newPriceId) {
        return { success: false, error: 'Invalid new plan type.' };
      }

      // Use the Supabase Edge Function to update the subscription
      const response = await fetch(STRIPE_HANDLER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'update-subscription',
          subscriptionId: currentSubscription.stripe_subscription_id,
          newPriceId: newPriceId,
          userId,
          newPlanType,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('Error updating subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentSubscription = await this.getCurrentSubscription(userId);
      if (!currentSubscription?.stripe_subscription_id) {
        return { success: false, error: 'No active subscription found to cancel.' };
      }

      const response = await fetch(STRIPE_HANDLER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'cancel-subscription',
          subscriptionId: currentSubscription.stripe_subscription_id,
        }),
      });

      const result = await response.json();
      return { success: result.success, error: result.error };

    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  static async reactivateSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: currentSubscription } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', userId)
        .single();
        
      if (!currentSubscription?.stripe_subscription_id) {
        return { success: false, error: 'No subscription found to reactivate.' };
      }

      const response = await fetch(STRIPE_HANDLER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'reactivate-subscription',
          subscriptionId: currentSubscription.stripe_subscription_id,
        }),
      });

      const result = await response.json();
      return { success: result.success, error: result.error };
      
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get billing portal URL for customer
   */
  static async getBillingPortalUrl(userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data: subscription, error: dbError } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (dbError || !subscription?.stripe_customer_id) {
        return { success: false, error: 'No customer found for billing portal.' };
      }

      const response = await fetch(STRIPE_HANDLER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'billing-portal',
          customerId: subscription.stripe_customer_id,
          returnUrl: `${window.location.origin}/settings`,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true, url: result.url };
      } else {
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('Error getting billing portal URL:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get pricing information
   */
  static async getPricing(): Promise<{ success: boolean; pricing?: any; error?: string }> {
    try {
      // For now, return static pricing data
      // In the future, this could fetch from Stripe API
      const pricing = {
        free: { price: 0, currency: 'gbp' },
        pro: { price: 2900, currency: 'gbp' }, // £29.00 in pence
        agency: { price: 7900, currency: 'gbp' }, // £79.00 in pence
        enterprise: { price: null, currency: 'gbp' }
      };
      
      return { success: true, pricing };
    } catch (error) {
      console.error('Error getting pricing:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Format price for display
   */
  static formatPrice(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  /**
   * Create or get Stripe customer
   */
  static async createOrGetCustomer(
    userId: string,
    email: string,
    name?: string
  ): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
      const response = await fetch(STRIPE_HANDLER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'create-customer',
          userId,
          email,
          name,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true, customerId: result.customerId };
      } else {
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('Error creating/getting customer:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Sync subscription data from Stripe
   */
  static async syncSubscription(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const currentSubscription = await this.getCurrentSubscription(userId);
      if (!currentSubscription?.stripe_subscription_id) {
        return { success: false, error: 'No Stripe subscription found to sync.' };
      }

      // For now, return the current subscription data
      // In the future, this could fetch fresh data from Stripe
      return { success: true, data: currentSubscription };

    } catch (error) {
      console.error('Error syncing subscription:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get checkout session URL
   */
  static async getCheckoutSessionUrl(sessionId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // For now, construct the URL manually
      // In the future, this could fetch from Stripe API
      const stripe = await initializeStripe();
      if (!stripe) {
        return { success: false, error: 'Stripe not initialized' };
      }

      // Try to redirect to checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Error getting checkout session URL:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}
