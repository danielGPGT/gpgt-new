import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Lock, 
  Crown, 
  Users, 
  Globe, 
  Building2, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Star
} from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { Link } from 'react-router-dom';

interface TierRestrictionProps {
  type: 'custom_branding' | 'media_library' | 'team_collaboration' | 'api_access' | 'white_label' | 'advanced_ai';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

interface FeatureRequirement {
  plan: 'free' | 'pro' | 'agency' | 'enterprise';
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const FEATURE_REQUIREMENTS: Record<string, FeatureRequirement> = {
  custom_branding: {
    plan: 'pro',
    name: 'Custom Branding',
    description: 'Add your logo and customize PDF exports with your branding',
    icon: <Crown className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500'
  },
  media_library: {
    plan: 'pro',
    name: 'Media Library',
    description: 'Access to our extensive library of high-quality travel images',
    icon: <Star className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500'
  },
  team_collaboration: {
    plan: 'agency',
    name: 'Team Collaboration',
    description: 'Work together with your team members on itineraries',
    icon: <Users className="h-5 w-5" />,
    color: 'from-green-500 to-emerald-500'
  },
  api_access: {
    plan: 'pro',
    name: 'API Access',
    description: 'Integrate our services into your own applications',
    icon: <Globe className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500'
  },
  white_label: {
    plan: 'pro',
    name: 'White Label',
    description: 'Remove our branding and use your own',
    icon: <Building2 className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500'
  },
  advanced_ai: {
    plan: 'pro',
    name: 'Advanced AI',
    description: 'Access to advanced AI features and customization',
    icon: <Crown className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500'
  }
};

const PLAN_COMPARISON = {
  free: {
    name: 'Free (Solo)',
    price: '£0',
    features: [
      'Basic booking tools with markup',
      'AI itinerary generator',
      '5 itineraries per month',
      '10 PDF downloads per month',
      'Basic AI recommendations',
      'Standard templates',
      'Email support'
    ],
    limitations: [
      'No Media Library access',
      'No custom branding',
      'No API access',
      'No priority support',
      'No team collaboration'
    ]
  },
  pro: {
    name: 'Pro (White-label)',
    price: '£39',
    features: [
      'All Free features',
      'PDF branding & customization',
      'Logo upload & management',
      'Custom portal branding',
      'Unlimited itineraries',
      'Unlimited PDF downloads',
      'Full Media Library access',
      'Advanced AI features',
      'Analytics dashboard (1 year)',
      'API access (1000 calls/month)',
      'Priority support',
      'Bulk operations'
    ],
    limitations: []
  },
  agency: {
    name: 'Agency',
    price: '£99 + £10/seat',
    features: [
      'All Pro features',
      'Multi-seat dashboard (up to 10 seats)',
      'Team collaboration tools',
      'Role-based permissions',
      'Shared media library',
      'Team analytics & reporting',
      'Bulk team operations',
      'Advanced team management',
      'Dedicated team support'
    ],
    limitations: [
      'Limited to 10 team members',
      'No custom integrations'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'All Agency features',
      'Unlimited seats',
      'API access',
      'Premium support',
      'Custom integrations',
      'White-label solution',
      'Dedicated account manager',
      'Training & onboarding',
      'SLA guarantee',
      'Advanced security',
      'Custom AI training',
      '24/7 phone support'
    ],
    limitations: []
  }
};

export function TierRestriction({ 
  type, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: TierRestrictionProps) {
  const { user } = useAuth();
  const { subscription, getCurrentPlan } = useStripeSubscription();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const requirement = FEATURE_REQUIREMENTS[type];
  const currentPlan = getCurrentPlan();
  
  // Check if user has access to this feature
  const hasAccess = () => {
    if (!subscription) return false;
    
    const planHierarchy = ['free', 'pro', 'agency', 'enterprise'];
    const currentPlanIndex = planHierarchy.indexOf(currentPlan);
    const requiredPlanIndex = planHierarchy.indexOf(requirement.plan);
    
    return currentPlanIndex >= requiredPlanIndex;
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const UpgradePrompt = () => (
    <Card className="border-dashed border-2 border-muted-foreground/25">
      <CardContent className="p-6 text-center">
        <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br ${requirement.color} flex items-center justify-center text-white`}>
          {requirement.icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{requirement.name}</h3>
        <p className="text-muted-foreground mb-4">{requirement.description}</p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Available on {requirement.plan.charAt(0).toUpperCase() + requirement.plan.slice(1)} plan and above
          </span>
        </div>
        {showUpgradePrompt && (
          <Button onClick={() => setShowUpgradeDialog(true)}>
            Upgrade to Access
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <UpgradePrompt />
      
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Upgrade Your Plan
            </DialogTitle>
            <DialogDescription>
              Choose the perfect plan to unlock {requirement.name} and more powerful features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {Object.entries(PLAN_COMPARISON).map(([planKey, plan]) => {
              const planHierarchy = ['free', 'pro', 'agency', 'enterprise'];
              const currentPlanIndex = planHierarchy.indexOf(currentPlan);
              const thisPlanIndex = planHierarchy.indexOf(planKey);
              const isCurrentPlan = currentPlan === planKey;
              const isUpgrade = thisPlanIndex > currentPlanIndex;
              const isDowngrade = thisPlanIndex < currentPlanIndex;
              const hasFeature = thisPlanIndex >= planHierarchy.indexOf(requirement.plan);
              
              return (
                <Card key={planKey} className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                      Current Plan
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-2xl font-bold">{plan.price}</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Features:</h4>
                      <ul className="space-y-1">
                        {plan.features.slice(0, 4).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 4 && (
                          <li className="text-xs text-muted-foreground">
                            +{plan.features.length - 4} more features
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    {plan.limitations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Limitations:</h4>
                        <ul className="space-y-1">
                          {plan.limitations.slice(0, 2).map((limitation, index) => (
                            <li key={index} className="flex items-center gap-2 text-xs">
                              <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                              <span className="text-muted-foreground">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      {hasFeature ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Includes {requirement.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <XCircle className="h-4 w-4" />
                          <span>No {requirement.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2">
                      {isCurrentPlan ? (
                        <Button variant="secondary" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : planKey === 'enterprise' ? (
                        <Button variant="outline" className="w-full" asChild>
                          <a href="mailto:sales@luxetripbuilder.com?subject=Enterprise Plan Inquiry">
                            Contact Sales
                          </a>
                        </Button>
                      ) : user ? (
                        <Button 
                          className="w-full" 
                          variant={isUpgrade ? "default" : "outline"}
                          asChild
                        >
                          <Link to="/settings">
                            {isUpgrade ? 'Upgrade' : 'Downgrade'}
                          </Link>
                        </Button>
                      ) : (
                        <Button className="w-full" asChild>
                          <Link to={`/signup?plan=${planKey}`}>
                            Get Started
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 