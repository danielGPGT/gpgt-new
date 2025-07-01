import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Plus, Bell, User, FileText, Home, Map, Calendar, Image } from 'lucide-react';
import { Link } from 'react-router-dom';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'New Proposal', href: '/new-proposal', icon: Plus },
  { name: 'Itineraries', href: '/itineraries', icon: Map },
  { name: 'Quotes', href: '/quotes', icon: FileText },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Media Library', href: '/media-library', icon: Image },
];

export function Navbar() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold">LuxeTripBuilder</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/builder">
              <Plus className="h-5 w-5" />
              <span className="sr-only">Create New Itinerary</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link to="/quotes">
              <FileText className="h-5 w-5" />
              <span className="sr-only">My Quotes</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <div className="relative">
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <User className="h-5 w-5" />
              <span className="sr-only">User Menu</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
} 