import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Code, 
  Image, 
  TrendingUp, 
  AlertTriangle,
  Crown,
  Users,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TierManager } from '@/lib/tierManager';
import { useAuth } from '@/lib/AuthProvider';

export function UsageDashboard() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<any>(null);
  const [plan, setPlan] = useState<string>('starter');
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUsageData();
    }
  }, [user?.id]);

  const loadUsageData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const tierManager = TierManager.getInstance();
      await tierManager.initialize(user.id);
      
      const currentUsage = await tierManager.getCurrentUsage();
      const currentPlan = tierManager.getCurrentPlan();
      const planInfo = tierManager.getPlanInfo();
      
      setUsage(currentUsage);
      setPlan(currentPlan);
      setLimits(planInfo);
    } catch (error) {
      console.error('Error loading usage data:', error);
      // Set default values on error
      setUsage({
        itineraries_created: 0,
        pdf_downloads: 0,
        api_calls: 0,
        limit_reached: {
          itineraries: false,
          pdf_downloads: false,
          api_calls: false,
        },
      });
      setPlan('starter');
      setLimits({
        itineraries_per_month: 5,
        pdf_downloads_per_month: 10,
        api_calls_per_month: 0,
        media_library: false,
        custom_branding: false,
        team_collaboration: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    if (limit === 0) return 100; // not available
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'professional':
        return <Crown className="h-4 w-4" />;
      case 'enterprise':
        return <Globe className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'professional':
        return 'bg-purple-500';
      case 'enterprise':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded"></div>
              <div className="h-2 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage || !limits) {
    return null;
  }

  // Ensure usage has the required properties with fallbacks
  const safeUsage = {
    itineraries_created: usage.itineraries_created || 0,
    pdf_downloads: usage.pdf_downloads || 0,
    api_calls: usage.api_calls || 0,
    limit_reached: {
      itineraries: usage.limit_reached?.itineraries || false,
      pdf_downloads: usage.limit_reached?.pdf_downloads || false,
      api_calls: usage.limit_reached?.api_calls || false,
    },
  };

  const usageItems = [
    {
      title: 'Itineraries Created',
      current: safeUsage.itineraries_created,
      limit: limits.itineraries_per_month || 0,
      icon: <FileText className="h-4 w-4" />,
      unit: 'itineraries'
    },
    {
      title: 'PDF Downloads',
      current: safeUsage.pdf_downloads,
      limit: limits.pdf_downloads_per_month || 0,
      icon: <Download className="h-4 w-4" />,
      unit: 'downloads'
    },
    {
      title: 'API Calls',
      current: safeUsage.api_calls,
      limit: limits.api_calls_per_month || 0,
      icon: <Code className="h-4 w-4" />,
      unit: 'calls'
    }
  ];

  const featureAccess = [
    {
      title: 'Media Library',
      hasAccess: limits.media_library || false,
      icon: <Image className="h-4 w-4" />
    },
    {
      title: 'Custom Branding',
      hasAccess: limits.custom_branding || false,
      icon: <Crown className="h-4 w-4" />
    },
    {
      title: 'Team Collaboration',
      hasAccess: limits.team_collaboration || false,
      icon: <Users className="h-4 w-4" />
    }
  ];

  const hasReachedLimits = safeUsage.limit_reached.itineraries || 
                          safeUsage.limit_reached.pdf_downloads || 
                          safeUsage.limit_reached.api_calls;

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Current Plan
              <Badge className={`${getPlanColor(plan)} text-white`}>
                {getPlanIcon(plan)}
                <span className="ml-1 capitalize">{plan}</span>
              </Badge>
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/pricing">
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {plan === 'starter' && 'Perfect for individual travel agents getting started.'}
            {plan === 'professional' && 'Ideal for growing travel agencies with advanced needs.'}
            {plan === 'enterprise' && 'For large travel organizations requiring custom solutions.'}
          </p>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {usageItems.map((item, index) => {
            const percentage = getUsagePercentage(item.current, item.limit);
            const isUnlimited = item.limit === -1;
            const isNotAvailable = item.limit === 0;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isUnlimited ? (
                      <span className="text-green-600 font-medium">Unlimited</span>
                    ) : isNotAvailable ? (
                      <span className="text-red-600 font-medium">Not Available</span>
                    ) : (
                      `${item.current} / ${item.limit} ${item.unit}`
                    )}
                  </div>
                </div>
                {!isUnlimited && !isNotAvailable && (
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                )}
                {percentage >= 90 && !isUnlimited && !isNotAvailable && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      You're approaching your limit. Consider upgrading your plan.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feature Access */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featureAccess.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`p-2 rounded-full ${feature.hasAccess ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {feature.icon}
                </div>
                <div>
                  <div className="font-medium">{feature.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {feature.hasAccess ? 'Available' : 'Not available'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Alert */}
      {hasReachedLimits && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You've reached some of your plan limits. Upgrade to continue using all features.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 