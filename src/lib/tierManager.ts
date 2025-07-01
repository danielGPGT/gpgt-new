import { supabase } from './supabase';
import { Database } from '@/types/supabase';

type PlanType = 'starter' | 'professional' | 'enterprise';
type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

interface Subscription {
  id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  team_id: string;
}

interface FeatureAccess {
  [key: string]: boolean;
}

interface PlanLimits {
  [key: string]: number;
}

// Define feature access for each plan
const PLAN_FEATURES: Record<PlanType, FeatureAccess> = {
  starter: {
    basic_booking: true,
    ai_itinerary_generator: true,
    basic_templates: true,
    email_support: true,
    pdf_export: true,
    media_library: false,
    custom_branding: false,
    api_access: false,
    team_collaboration: false,
    white_label: false,
    advanced_ai: false,
    analytics: false,
    bulk_operations: false,
    priority_support: false,
  },
  professional: {
    basic_booking: true,
    ai_itinerary_generator: true,
    basic_templates: true,
    email_support: true,
    pdf_export: true,
    media_library: true,
    custom_branding: true,
    api_access: true,
    team_collaboration: false,
    white_label: true,
    advanced_ai: true,
    analytics: true,
    bulk_operations: true,
    priority_support: true,
  },
  enterprise: {
    basic_booking: true,
    ai_itinerary_generator: true,
    basic_templates: true,
    email_support: true,
    pdf_export: true,
    media_library: true,
    custom_branding: true,
    api_access: true,
    team_collaboration: true,
    white_label: true,
    advanced_ai: true,
    analytics: true,
    bulk_operations: true,
    priority_support: true,
  },
};

// Define usage limits for each plan
const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  starter: {
    itineraries_per_month: 5,
    pdf_downloads_per_month: 10,
    api_calls_per_month: 0,
    team_members: 1,
    storage_gb: 1,
  },
  professional: {
    itineraries_per_month: -1, // Unlimited
    pdf_downloads_per_month: -1, // Unlimited
    api_calls_per_month: 1000,
    team_members: 1,
    storage_gb: 10,
  },
  enterprise: {
    itineraries_per_month: -1, // Unlimited
    pdf_downloads_per_month: -1, // Unlimited
    api_calls_per_month: -1, // Unlimited
    team_members: -1, // Unlimited
    storage_gb: -1, // Unlimited
  },
};

export class TierManager {
  private static instance: TierManager;
  private currentUser: string | null = null;
  private currentPlan: PlanType = 'starter';
  private subscription: Subscription | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): TierManager {
    if (!TierManager.instance) {
      TierManager.instance = new TierManager();
    }
    return TierManager.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (this.initialized && this.currentUser === userId) {
      return;
    }

    this.currentUser = userId;
    await this.loadUserSubscription();
    
    // If no subscription exists, create a default starter subscription
    if (!this.subscription) {
      const success = await this.createSubscription(userId, 'starter');
      if (success) {
        await this.loadUserSubscription(); // Reload after creating
      }
    }
    
    this.initialized = true;
  }

  private async loadUserSubscription(): Promise<void> {
    if (!this.currentUser) return;
    try {
      // Fetch the user's subscription directly
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', this.currentUser)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError || !subscription) {
        this.subscription = null;
        this.currentPlan = 'starter';
      } else {
        this.subscription = subscription;
        this.currentPlan = subscription.plan_type;
      }
    } catch (error) {
      console.error('Error loading user subscription:', error);
      this.subscription = null;
      this.currentPlan = 'starter';
    }
  }

  getCurrentPlan(): PlanType {
    return this.currentPlan;
  }

  getSubscription(): Subscription | null {
    return this.subscription;
  }

  hasFeature(feature: string): boolean {
    const planFeatures = PLAN_FEATURES[this.currentPlan];
    return planFeatures[feature] || false;
  }

  getLimit(limit: string): number {
    if (!this.currentPlan || !PLAN_LIMITS[this.currentPlan]) {
      // Fallback to starter plan if currentPlan is invalid
      return PLAN_LIMITS['starter'][limit] || 0;
    }
    const planLimits = PLAN_LIMITS[this.currentPlan];
    return planLimits[limit] || 0;
  }

  isUnlimited(limit: string): boolean {
    return this.getLimit(limit) === -1;
  }

  canAccess(feature: string): boolean {
    return this.hasFeature(feature);
  }

  getPlanFeatures(): FeatureAccess {
    return PLAN_FEATURES[this.currentPlan];
  }

  getPlanLimits(): PlanLimits {
    return PLAN_LIMITS[this.currentPlan];
  }

  getPlanInfo(): PlanLimits & FeatureAccess {
    return {
      ...PLAN_LIMITS[this.currentPlan],
      ...PLAN_FEATURES[this.currentPlan],
    };
  }

  isActive(): boolean {
    if (!this.subscription) return false;
    return this.subscription.status === 'active';
  }

  isCanceled(): boolean {
    if (!this.subscription) return false;
    return this.subscription.cancel_at_period_end;
  }

  getDaysUntilRenewal(): number | null {
    if (!this.subscription?.current_period_end) return null;
    
    const endDate = new Date(this.subscription.current_period_end);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  getRenewalDate(): string | null {
    if (!this.subscription?.current_period_end) return null;
    
    return new Date(this.subscription.current_period_end).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Check if user can perform an action based on usage limits
  canPerformAction(action: string, currentUsage: number = 0): boolean {
    const limit = this.getLimit(action);
    
    if (this.isUnlimited(action)) {
      return true;
    }
    
    return currentUsage < limit;
  }

  // Get remaining quota for a specific limit
  getRemainingQuota(limit: string, currentUsage: number = 0): number {
    const limitValue = this.getLimit(limit);
    
    if (this.isUnlimited(limit)) {
      return -1; // Unlimited
    }
    
    return Math.max(0, limitValue - currentUsage);
  }

  // Get plan upgrade suggestions based on usage
  getUpgradeSuggestions(currentUsage: Record<string, number>): PlanType[] {
    const suggestions: PlanType[] = [];
    const planHierarchy: PlanType[] = ['starter', 'professional', 'enterprise'];
    const currentPlanIndex = planHierarchy.indexOf(this.currentPlan);

    // Check if user is hitting limits
    for (const [limit, usage] of Object.entries(currentUsage)) {
      const limitValue = this.getLimit(limit);
      
      if (limitValue !== -1 && usage >= limitValue * 0.8) { // 80% of limit
        // Find the next plan that offers higher limits
        for (let i = currentPlanIndex + 1; i < planHierarchy.length; i++) {
          const nextPlan = planHierarchy[i];
          const nextPlanLimit = PLAN_LIMITS[nextPlan][limit];
          
          if (nextPlanLimit === -1 || nextPlanLimit > limitValue) {
            if (!suggestions.includes(nextPlan)) {
              suggestions.push(nextPlan);
            }
            break;
          }
        }
      }
    }

    return suggestions;
  }

  // Check if user needs a specific feature
  needsFeature(feature: string): boolean {
    return !this.hasFeature(feature);
  }

  // Get the minimum plan required for a feature
  getMinimumPlanForFeature(feature: string): PlanType | null {
    const planHierarchy: PlanType[] = ['starter', 'professional', 'enterprise'];
    
    for (const plan of planHierarchy) {
      if (PLAN_FEATURES[plan][feature]) {
        return plan;
      }
    }
    
    return null;
  }

  // Get upgrade path for a specific feature
  getUpgradePathForFeature(feature: string): PlanType[] {
    const minimumPlan = this.getMinimumPlanForFeature(feature);
    if (!minimumPlan) return [];
    
    const planHierarchy: PlanType[] = ['starter', 'professional', 'enterprise'];
    const currentPlanIndex = planHierarchy.indexOf(this.currentPlan);
    const minimumPlanIndex = planHierarchy.indexOf(minimumPlan);
    
    if (minimumPlanIndex <= currentPlanIndex) return [];
    
    return planHierarchy.slice(currentPlanIndex + 1, minimumPlanIndex + 1);
  }

  async createSubscription(userId: string, planType: PlanType): Promise<boolean> {
    try {
      const now = new Date();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      // First check if user already has an active subscription
      const { data: existingSubscription, error: checkError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing subscription:', checkError);
        return false;
      }

      if (existingSubscription) {
        return true; // User already has a subscription
      }

      // Create new subscription
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        });

      if (error) {
        if (error.code === '42703') {
          console.warn('Subscriptions table not found, skipping subscription creation');
          return true; // Allow the operation to continue
        }
        console.error('Error creating subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createSubscription:', error);
      return false;
    }
  }

  // Reset the manager (useful for testing or user logout)
  reset(): void {
    this.currentUser = null;
    this.currentPlan = 'starter';
    this.subscription = null;
    this.initialized = false;
  }

  // Get current usage for the user
  async getCurrentUsage(): Promise<{
    itineraries_created: number;
    pdf_downloads: number;
    api_calls: number;
    limit_reached: {
      itineraries: boolean;
      pdf_downloads: boolean;
      api_calls: boolean;
    };
  }> {
    if (!this.currentUser) {
      return {
        itineraries_created: 0,
        pdf_downloads: 0,
        api_calls: 0,
        limit_reached: {
          itineraries: false,
          pdf_downloads: false,
          api_calls: false,
        },
      };
    }

    try {
      // Get current month's usage from the database
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Fetch usage data from the database
      const { data: usageData, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', this.currentUser)
        .eq('month', monthKey)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching usage data:', error);
      }

      const usage = usageData || {
        itineraries_created: 0,
        pdf_downloads: 0,
        api_calls: 0,
      };

      // Ensure currentPlan is valid before checking limits
      if (!this.currentPlan || !PLAN_LIMITS[this.currentPlan]) {
        this.currentPlan = 'starter';
      }

      // Check if limits are reached
      const limit_reached = {
        itineraries: !this.canPerformAction('itineraries_per_month', usage.itineraries_created),
        pdf_downloads: !this.canPerformAction('pdf_downloads_per_month', usage.pdf_downloads),
        api_calls: !this.canPerformAction('api_calls_per_month', usage.api_calls),
      };

      return {
        ...usage,
        limit_reached,
      };
    } catch (error) {
      console.error('Error getting current usage:', error);
      return {
        itineraries_created: 0,
        pdf_downloads: 0,
        api_calls: 0,
        limit_reached: {
          itineraries: false,
          pdf_downloads: false,
          api_calls: false,
        },
      };
    }
  }

  // Increment usage for a specific type
  async incrementUsage(type: 'itineraries' | 'pdf_downloads' | 'api_calls'): Promise<boolean> {
    if (!this.currentUser) return false;

    try {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Get current usage
      const { data: currentUsage, error: fetchError } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', this.currentUser)
        .eq('month', monthKey)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current usage:', fetchError);
        return false;
      }

      const usage = currentUsage || {
        user_id: this.currentUser,
        month: monthKey,
        itineraries_created: 0,
        pdf_downloads: 0,
        api_calls: 0,
      };

      // Check if we can perform this action
      const usageKey = `${type}_${type === 'itineraries' ? 'created' : type === 'pdf_downloads' ? 'downloads' : 'calls'}`;
      if (!this.canPerformAction(`${type}_per_month`, usage[usageKey])) {
        return false;
      }

      // Increment the usage
      usage[usageKey] += 1;

      // Upsert the usage data
      const { error: upsertError } = await supabase
        .from('usage_tracking')
        .upsert(usage, {
          onConflict: 'user_id,month',
        });

      if (upsertError) {
        console.error('Error updating usage:', upsertError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  // Check if user can create itinerary
  canCreateItinerary(): boolean {
    return this.canAccess('ai_itinerary_generator');
  }

  // Check if user can download PDF
  canDownloadPDF(): boolean {
    return this.canAccess('pdf_export');
  }

  // Check if user can use API
  canUseAPI(): boolean {
    return this.canAccess('api_access');
  }

  // Check if user has custom branding
  hasCustomBranding(): boolean {
    return this.canAccess('custom_branding');
  }

  // Check if user has white label
  hasWhiteLabel(): boolean {
    return this.canAccess('white_label');
  }

  // Check if user has priority support
  hasPrioritySupport(): boolean {
    return this.canAccess('priority_support');
  }

  // Check if user has team collaboration
  hasTeamCollaboration(): boolean {
    return this.canAccess('team_collaboration');
  }

  // Check if user has advanced AI features
  hasAdvancedAIFeatures(): boolean {
    return this.canAccess('advanced_ai');
  }

  // Get upgrade message
  getUpgradeMessage(): string {
    const planHierarchy: PlanType[] = ['starter', 'professional', 'enterprise'];
    const currentPlanIndex = planHierarchy.indexOf(this.currentPlan);
    
    if (currentPlanIndex >= planHierarchy.length - 1) {
      return 'You are already on the highest tier.';
    }

    const nextPlan = planHierarchy[currentPlanIndex + 1];
    return `Upgrade to ${nextPlan} to unlock more features and higher limits.`;
  }

  // Get limit reached message
  getLimitReachedMessage(type: 'itineraries' | 'pdf_downloads' | 'api_calls'): string {
    const planHierarchy: PlanType[] = ['starter', 'professional', 'enterprise'];
    const currentPlanIndex = planHierarchy.indexOf(this.currentPlan);
    
    if (currentPlanIndex >= planHierarchy.length - 1) {
      return `You have reached your ${type} limit for this month.`;
    }

    const nextPlan = planHierarchy[currentPlanIndex + 1];
    return `You have reached your ${type} limit. Upgrade to ${nextPlan} for higher limits.`;
  }

  // Update subscription
  async updateSubscription(userId: string, planType: PlanType): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ plan_type: planType })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating subscription:', error);
        return false;
      }

      // Reload the subscription data
      await this.loadUserSubscription();
      return true;
    } catch (error) {
      console.error('Error in updateSubscription:', error);
      return false;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: true,
          status: 'canceled'
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error canceling subscription:', error);
        return false;
      }

      // Reload the subscription data
      await this.loadUserSubscription();
      return true;
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      return false;
    }
  }
}

// Export singleton instance
export const tierManager = TierManager.getInstance(); 