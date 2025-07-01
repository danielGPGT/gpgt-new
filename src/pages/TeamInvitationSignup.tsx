import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TeamInvitationSignup() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setError('No invitation token found.');
      setLoading(false);
      return;
    }
    // Fetch invitation and team info
    const fetchInvite = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/team-invitation-info?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!data.success) {
          setError(data.error || 'Invalid or expired invitation.');
        } else {
          setInvite(data.invite);
          setTeam(data.team);
          setEmail(data.invite.email || '');
        }
      } catch (err) {
        setError('Failed to load invitation.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [loading]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setSigningUp(true);
    setError('');
    try {
      const { data, error: signUpError, user } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setSigningUp(false);
        return;
      }
      // Wait for user to be available (may be in data.user or returned as user)
      const newUser = data?.user || user;
      if (!newUser) {
        setError('Signup succeeded but user not found. Please check your email to confirm your account.');
        setSigningUp(false);
        return;
      }
      // Accept the invitation automatically
      const acceptRes = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user_id: newUser.id, name })
      });
      const acceptData = await acceptRes.json();
      if (!acceptData.success) {
        setError('Account created, but failed to join team: ' + (acceptData.error || 'Unknown error'));
        setSigningUp(false);
        return;
      }
      // Success: redirect to dashboard or show message
      navigate('/dashboard');
    } catch (err) {
      setError('Signup failed.');
    } finally {
      setSigningUp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle>Team Invitation Signup</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Join {team?.name || 'the team'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-2 mb-4">
            {team?.logo_url ? (
              <img src={team.logo_url} alt="Team Logo" className="w-16 h-16 rounded-full border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            )}
            <div className="text-lg font-semibold">{team?.name || 'Team'}</div>
          </div>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                ref={emailInputRef}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={signingUp}>
              {signingUp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 