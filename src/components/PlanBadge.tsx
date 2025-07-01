import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Building2, Globe } from 'lucide-react';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';

interface PlanBadgeProps {
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function PlanBadge({ 
  variant = 'secondary', 
  size = 'default',
  showIcon = true,
  className = ''
}: PlanBadgeProps) {
  const { subscription, getCurrentPlan } = useStripeSubscription();

  if (!subscription) {
    return null;
  }

  const currentPlan = getCurrentPlan();

  const getPlanConfig = (plan: string) => {
    switch (plan) {
      case 'free':
        return {
          label: 'Free',
          color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          icon: <Users className="h-3 w-3" />
        };
      case 'pro':
        return {
          label: 'Pro',
          color: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
          icon: <Crown className="h-3 w-3" />
        };
      case 'agency':
        return {
          label: 'Agency',
          color: 'bg-green-100 text-green-800 hover:bg-green-200',
          icon: <Building2 className="h-3 w-3" />
        };
      case 'enterprise':
        return {
          label: 'Enterprise',
          color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
          icon: <Globe className="h-3 w-3" />
        };
      default:
        return {
          label: 'Free',
          color: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
          icon: <Users className="h-3 w-3" />
        };
    }
  };

  const planConfig = getPlanConfig(currentPlan);

  return (
    <Badge 
      variant={variant} 
      className={`${planConfig.color} ${className}`}
    >
      {showIcon && planConfig.icon}
      <span className={showIcon ? 'ml-1' : ''}>
        {planConfig.label}
      </span>
    </Badge>
  );
} 