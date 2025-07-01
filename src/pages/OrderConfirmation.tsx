import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Mail, Lock } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';

interface SessionData {
  customer_email: string;
  plan_type: string;
  amount_total: number;
  currency: string;
  subscription_status: string;
}

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn: auth } = useAuth();
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Fetch session data from Stripe directly using the session ID
    // For now, we'll use a simplified approach since we don't have a get-session endpoint
    // In production, you might want to add this endpoint to your Edge Function
    const fetchSessionData = async () => {
      try {
        // Since we don't have a get-session endpoint yet, we'll use the session ID
        // to construct basic session data. In a real implementation, you'd fetch this from Stripe
        const mockSessionData: SessionData = {
          customer_email: 'customer@example.com', // This would come from Stripe
          plan_type: 'pro', // This would be determined from the session
          amount_total: 2900, // £29.00 in pence
          currency: 'gbp',
          subscription_status: 'active'
        };
        
        setSessionData(mockSessionData);
        setEmail(mockSessionData.customer_email);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Failed to load session data');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setSigningIn(true);
    
    try {
      const result = await auth.signIn(email, password);
      
      if (result.user) {
        toast.success('Welcome! Your account is now active.');
        navigate('/dashboard');
      } else {
        toast.error(result.error?.message || 'Sign in failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Sign in failed');
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading your order details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Order</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button asChild>
                  <Link to="/signup">Try Again</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to LuxeTripBuilder!</CardTitle>
            <p className="text-muted-foreground">
              Your account has been created and your subscription is now active.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Success Message */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-medium mb-1">🎉 Payment Successful!</div>
                <div>Your {sessionData?.plan_type} plan is now active.</div>
                {sessionData?.plan_type === 'starter' ? (
                  <div className="text-sm mt-1">You're on a 7-day free trial.</div>
                ) : (
                  <div className="text-sm mt-1">Your subscription is now active and billing.</div>
                )}
              </AlertDescription>
            </Alert>

            {/* Account Details */}
            {sessionData && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Account Details</h3>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">Email:</span> {sessionData.customer_email}</div>
                  <div><span className="font-medium">Plan:</span> {sessionData.plan_type}</div>
                  <div><span className="font-medium">Status:</span> Active</div>
                </div>
              </div>
            )}

            {/* Sign In Form */}
            <div>
              <h3 className="font-medium mb-3">Sign In to Your Account</h3>
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-medium mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="signin-password" className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={signingIn}
                >
                  {signingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In & Go to Dashboard'
                  )}
                </Button>
              </form>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Having trouble signing in?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default OrderConfirmation; 