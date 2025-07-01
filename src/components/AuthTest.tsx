import { useState, useEffect } from 'react';
import { auth } from '@/lib/auth';
import type { UserProfile } from '@/lib/auth';
import { useAuth } from '@/lib/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // First ensure profile exists
      await auth.ensureProfileExists();
      // Then load it
      const userProfile = await auth.getCurrentUserProfile();
      setProfile(userProfile);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Error loading profile');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await auth.signUp(email, password, name);
      alert('Check your email for the confirmation link!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await auth.signIn(email, password);
      // Profile will be loaded by the useEffect when user state changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err.message : 'Error signing out');
    }
  };

  return (
    <Card className="w-[350px] mx-auto mt-8">
      <CardHeader>
        <CardTitle>Auth Test</CardTitle>
      </CardHeader>
      <CardContent>
        {user && profile ? (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="font-medium">Signed in as:</p>
              <p className="text-sm break-all">{profile.email}</p>
              <p className="text-sm text-muted-foreground mt-2">Name: {profile.name}</p>
              <p className="text-sm text-muted-foreground">ID: {profile.id}</p>
              {profile.agency_name && (
                <p className="text-sm text-muted-foreground">Agency: {profile.agency_name}</p>
              )}
            </div>
            <Button 
              onClick={handleSignOut}
              variant="destructive"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button
                onClick={handleSignUp}
                disabled={loading || !email || !password || !name}
                variant="outline"
                type="button"
              >
                Sign Up
              </Button>
              <Button
                onClick={handleSignIn}
                disabled={loading || !email || !password}
                type="button"
              >
                Sign In
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
} 