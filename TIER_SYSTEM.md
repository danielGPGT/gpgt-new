# Tier System Implementation

This document outlines the comprehensive tier system implemented in AItinerary to manage user subscriptions, usage limits, and feature access.

## Overview

The tier system provides three subscription levels with different limits and features:

- **Starter**: Basic features with monthly limits
- **Professional**: Advanced features with higher limits
- **Enterprise**: Full access with unlimited usage

## Database Schema

### Tables

#### `subscriptions`
Tracks user subscription information:
- `id`: Unique identifier
- `user_id`: References auth.users
- `plan_type`: 'starter', 'professional', or 'enterprise'
- `status`: 'active', 'canceled', 'past_due', 'trialing'
- `current_period_start`: Subscription start date
- `current_period_end`: Subscription end date
- `cancel_at_period_end`: Whether to cancel at period end

#### `usage_tracking`
Tracks monthly usage for each user:
- `id`: Unique identifier
- `user_id`: References auth.users
- `month`: YYYY-MM format
- `itineraries_created`: Number of itineraries created
- `pdf_downloads`: Number of PDF downloads
- `api_calls`: Number of API calls made

## Plan Limits

### Starter Plan
- **Itineraries**: 5 per month
- **PDF Downloads**: 10 per month
- **API Calls**: 100 per month
- **Custom Branding**: ❌
- **White Label**: ❌
- **Priority Support**: ❌
- **Team Collaboration**: ❌
- **Advanced AI Features**: ❌

### Professional Plan
- **Itineraries**: Unlimited
- **PDF Downloads**: Unlimited
- **API Calls**: 1,000 per month
- **Custom Branding**: ✅
- **White Label**: ✅
- **Priority Support**: ✅
- **Team Collaboration**: ✅
- **Advanced AI Features**: ✅

### Enterprise Plan
- **Itineraries**: Unlimited
- **PDF Downloads**: Unlimited
- **API Calls**: Unlimited
- **Custom Branding**: ✅
- **White Label**: ✅
- **Priority Support**: ✅
- **Team Collaboration**: ✅
- **Advanced AI Features**: ✅

## Implementation Details

### Core Components

#### `TierManager` (`src/lib/tierManager.ts`)
Singleton class that manages:
- User subscription status
- Usage tracking and limits
- Feature access control
- Upgrade/downgrade operations

#### `useTier` Hook (`src/hooks/useTier.ts`)
React hook providing easy access to tier functionality:
- Current plan and usage
- Feature access checks
- Usage increment methods
- Subscription management

#### `UsageDashboard` (`src/components/UsageDashboard.tsx`)
Component displaying:
- Current plan information
- Usage statistics with progress bars
- Feature availability
- Upgrade prompts

#### `TierRestriction` (`src/components/TierRestriction.tsx`)
Component for restricting access to premium features:
- Shows upgrade prompts when limits are reached
- Displays feature comparison across plans
- Provides direct links to pricing page

### Integration Points

#### Itinerary Creation
- Checks limits before creating new itineraries
- Increments usage counter after successful creation
- Shows appropriate error messages when limits are reached

#### PDF Export
- Validates download limits before export
- Tracks successful downloads
- Disables button when limits are reached

#### API Usage
- Monitors API call frequency
- Enforces rate limits based on plan
- Provides usage statistics

### Database Triggers

#### Automatic Subscription Creation
New users automatically get a Starter plan subscription:
```sql
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Usage Tracking
Automatic timestamp updates for audit trails:
```sql
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## Usage Examples

### Checking Feature Access
```typescript
const { canCreateItinerary, hasCustomBranding } = useTier();

if (canCreateItinerary()) {
  // Create itinerary
} else {
  // Show upgrade prompt
}
```

### Incrementing Usage
```typescript
const { incrementUsage } = useTier();

// After successful operation
await incrementUsage('itineraries');
```

### Restricting Features
```typescript
import { TierRestriction } from '@/components/TierRestriction';

<TierRestriction type="custom_branding">
  <CustomBrandingComponent />
</TierRestriction>
```

### Displaying Usage Dashboard
```typescript
import { UsageDashboard } from '@/components/UsageDashboard';

<UsageDashboard />
```

## Security Features

### Row Level Security (RLS)
All subscription and usage tables have RLS enabled:
- Users can only access their own data
- Automatic user ID filtering
- Secure by default

### Input Validation
- Plan type validation with CHECK constraints
- Status validation for subscriptions
- Unique constraints on usage tracking

## Monitoring and Analytics

### Usage Tracking
- Monthly usage aggregation
- Real-time limit checking
- Historical usage data

### Upgrade Funnel
- Limit reached notifications
- Upgrade prompts with plan comparison
- Direct links to pricing page

## Future Enhancements

### Planned Features
- Usage analytics dashboard
- Automated billing integration
- Team management for Enterprise plans
- Custom plan creation
- Usage forecasting

### API Rate Limiting
- Real-time rate limiting
- Burst allowance for Professional plans
- Custom rate limits for Enterprise

## Migration Guide

### Setting Up New Database
1. Run the migration script: `supabase/migrations/20241201000000_create_tier_system.sql`
2. Verify RLS policies are active
3. Test automatic subscription creation

### Updating Existing Users
```sql
-- Create starter subscriptions for existing users
INSERT INTO public.subscriptions (user_id, plan_type, status)
SELECT id, 'starter', 'active' 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.subscriptions);
```

## Troubleshooting

### Common Issues

#### Usage Not Tracking
- Check if user has active subscription
- Verify RLS policies are working
- Ensure proper error handling

#### Limits Not Enforcing
- Verify TierManager is initialized
- Check database constraints
- Review usage calculation logic

#### Upgrade Prompts Not Showing
- Confirm TierRestriction component usage
- Check plan comparison logic
- Verify pricing page links

### Debug Mode
Enable debug logging in TierManager:
```typescript
// Add to tierManager.ts
private debug = true;

private log(message: string) {
  if (this.debug) {
    console.log(`[TierManager] ${message}`);
  }
}
```

## Support

For questions about the tier system implementation:
1. Check this documentation
2. Review the component examples
3. Test with different user scenarios
4. Monitor usage patterns in production 