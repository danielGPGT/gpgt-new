import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Building2, Globe } from 'lucide-react';


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




  const currentPlan = 'unlimited';

  const getPlanConfig = (plan: string) => {
    return {
      label: 'Unlimited',
      color: 'bg-green-100 text-green-800 hover:bg-green-200',
      icon: <Crown className="h-3 w-3" />
    };
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