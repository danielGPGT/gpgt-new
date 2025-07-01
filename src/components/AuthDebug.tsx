import { useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthDebug() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkCurrentSession = async () => {
    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session error:', error);
      
      if (session?.user) {
        console.log('User ID:', session.user.id);
        console.log('User email:', session.user.email);
        console.log('User metadata:', session.user.user_metadata);
      }
      
      setDebugInfo({
        session: session,
        error: error,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userMetadata: session?.user?.user_metadata
      });
    } catch (err) {
      console.error('Error checking session:', err);
      setDebugInfo({ error: err });
    } finally {
      setLoading(false);
    }
  };

  const testInvalidLogin = async () => {
    setLoading(true);
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'wrongpassword123';
      
      console.log('Testing login with:', testEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      console.log('Login result:', data);
      console.log('Login error:', error);
      
      setDebugInfo({
        testEmail,
        testPassword,
        loginData: data,
        loginError: error,
        shouldFail: !data?.user && error
      });
    } catch (err) {
      console.error('Error testing login:', err);
      setDebugInfo({ testError: err });
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setDebugInfo({ message: 'Session cleared' });
    } catch (err) {
      console.error('Error clearing session:', err);
      setDebugInfo({ error: err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button onClick={checkCurrentSession} disabled={loading}>
            Check Session
          </Button>
          <Button onClick={testInvalidLogin} disabled={loading} variant="outline">
            Test Invalid Login
          </Button>
          <Button onClick={clearSession} disabled={loading} variant="destructive">
            Clear Session
          </Button>
        </div>
        
        {debugInfo && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Current Auth State:</h4>
          <p><strong>User:</strong> {user ? 'Logged in' : 'Not logged in'}</p>
          {user && (
            <>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 