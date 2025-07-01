import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthProvider';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading, hasAccess } = useStripeSubscription();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Only check access when both auth and subscription are loaded
    if (!authLoading && !subscriptionLoading) {
      setIsChecking(false);
    }
  }, [authLoading, subscriptionLoading]);

  // Show loading while checking auth and subscription
  if (authLoading || subscriptionLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to pricing if user does not have access
  if (!hasAccess()) {
    return <Navigate to="/pricing" state={{ upgradeRequired: true }} replace />;
  }

  return <>{children}</>;
} 