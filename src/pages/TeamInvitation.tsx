import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/AuthProvider';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function TeamInvitation() {
  const query = useQuery();
  const token = query.get('token');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No invitation token found in the URL.');
    }
    if (!loading && !user && token) {
      const redirectUrl = `/team-invitation-signup?token=${encodeURIComponent(token)}`;
      window.location.replace(redirectUrl);
    }
  }, [token, loading, user, location.pathname, location.search]);

  const handleAccept = async () => {
    if (!user || !token) return;
    setStatus('submitting');
    setError('');
    try {
      const res = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user_id: user.id, name: user.user_metadata?.name || user.email })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setSuccessMsg('You have successfully joined the team!');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setStatus('error');
        setError(data.error || 'Failed to accept invitation.');
      }
    } catch (err) {
      setStatus('error');
      setError('An unexpected error occurred.');
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle>Team Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>No invitation token found.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Team Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'idle' && (
            <div className="space-y-4">
              <p className="text-muted-foreground">You have been invited to join a team. Click below to accept the invitation.</p>
              <Button onClick={handleAccept} className="w-full h-11 text-base font-semibold">
                Accept Invitation
              </Button>
            </div>
          )}
          {status === 'submitting' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Accepting invitation...</span>
            </div>
          )}
          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMsg}
              </AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 