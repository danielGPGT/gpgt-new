// Simplified service that removes all Stripe/subscription logic
// All operations now return success without any payment processing

export interface SubscriptionData {
  id: string;
  status: 'active';
  plan_type: 'unlimited';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: false;
  stripe_subscription_id: '';
  stripe_customer_id: '';
  team_id: string | null;
}

export class StripeService {
  /**
   * Create a new subscription (always succeeds)
   */
  static async createSubscription(
    userId: string | null,
    planType: 'free' | 'pro' | 'agency' | 'enterprise',
    customerEmail: string,
    customerName?: string,
    options?: { seatCount?: number },
    signupData?: { email: string; password: string; name: string }
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    return { success: true, subscriptionId: 'unlimited' };
  }

  /**
   * Create a Stripe checkout session (always succeeds)
   */
  static async createCheckoutSession(
    userId: string | null,
    planType: 'free' | 'pro' | 'agency' | 'enterprise',
    customerEmail: string,
    customerName?: string,
    options?: { seatCount?: number },
    signupData?: { email: string; password: string; name: string }
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    return { success: true, sessionId: 'unlimited' };
  }

  /**
   * Get current subscription (always returns unlimited)
   */
  static async getCurrentSubscription(userId: string): Promise<SubscriptionData | null> {
    return {
      id: 'unlimited',
      status: 'active',
      plan_type: 'unlimited',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      stripe_subscription_id: '',
      stripe_customer_id: '',
      team_id: null,
    };
  }

  /**
   * Update subscription (always succeeds)
   */
  static async updateSubscription(
    userId: string,
    newPlanType: 'free' | 'pro' | 'agency' | 'enterprise'
  ): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  /**
   * Cancel subscription (always succeeds)
   */
  static async cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  /**
   * Reactivate subscription (always succeeds)
   */
  static async reactivateSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  /**
   * Get billing portal URL (returns empty)
   */
  static async getBillingPortalUrl(userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    return { success: true, url: '' };
  }

  /**
   * Get pricing (returns unlimited plan)
   */
  static async getPricing(): Promise<{ success: boolean; pricing?: any; error?: string }> {
    return {
      success: true,
      pricing: {
        unlimited: {
          productName: 'Unlimited',
          amount: 0,
          currency: 'USD',
          features: [
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
          ]
        }
      }
    };
  }

  /**
   * Format price (returns free)
   */
  static formatPrice(amount: number, currency: string): string {
    return 'Free';
  }

  /**
   * Create or get customer (always succeeds)
   */
  static async createOrGetCustomer(
    userId: string,
    email: string,
    name?: string
  ): Promise<{ success: boolean; customerId?: string; error?: string }> {
    return { success: true, customerId: 'unlimited' };
  }

  /**
   * Sync subscription (always succeeds)
   */
  static async syncSubscription(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    return { success: true, data: { plan: 'unlimited' } };
  }

  /**
   * Get checkout session URL (returns empty)
   */
  static async getCheckoutSessionUrl(sessionId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    return { success: true, url: '' };
  }
}
