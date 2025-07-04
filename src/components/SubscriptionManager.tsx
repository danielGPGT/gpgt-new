import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Crown, Users, Building2, Sparkles, Shield, Mail, Link } from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';

export function SubscriptionManager() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Crown className="h-5 w-5 text-green-600" />
            Unlimited Access
          </CardTitle>
          <CardDescription className="text-green-700">
            You have unlimited access to all features and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                Unlimited Plan
              </Badge>
              <p className="text-sm text-green-700">
                All features included • No restrictions • No limits
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-800">Free</p>
              <p className="text-sm text-green-600">No payment required</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Included Features
          </CardTitle>
          <CardDescription>
            All premium features are now available to all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Unlimited itineraries</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Unlimited PDF downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Unlimited API calls</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Custom branding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">White label</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Team collaboration</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Advanced AI features</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Analytics dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Bulk operations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Priority support</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Support & Help
          </CardTitle>
          <CardDescription>
            Get help and support for any questions or issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Email: support@luxetripbuilder.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Link className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Documentation: docs.luxetripbuilder.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Community: community.luxetripbuilder.com</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 