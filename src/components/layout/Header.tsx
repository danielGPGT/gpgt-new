import { useState } from 'react';
import { WandSparkles, Instagram, Github, Linkedin, User, Settings, LogOut, ChevronDown, Sun, Moon, Menu, X, Calendar, Clock, Phone, Mail, TrendingUp, Star, Search as SearchIcon, ChevronLeft, ChevronRight, PanelLeft, Crown, HelpCircle, Bell, Plus, ShieldCheck, Briefcase, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/components/ThemeProvider';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRole } from '@/lib/RoleContext';
import { useEffect } from 'react';
import { hasTeamFeature } from '@/lib/teamUtils';

interface HeaderProps {
  showNavigation?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarCollapseToggle?: () => void;
}

export function Header({ showNavigation = true, sidebarCollapsed, onSidebarCollapseToggle }: HeaderProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  // Role context is no longer used since we show actual team member role
  // const { role, setRole, loading: roleLoading } = useRole();
  const [teamMemberRole, setTeamMemberRole] = useState<string | null>(null);
  const [loadingTeamRole, setLoadingTeamRole] = useState(false);
  const [isNotB2B, setIsNotB2B] = useState<boolean | null>(null);

  useEffect(() => {
    hasTeamFeature('is_not_b2b').then(setIsNotB2B);
  }, []);

  // Fetch team member role
  useEffect(() => {
    const fetchTeamMemberRole = async () => {
      if (!user?.id) return;
      
      setLoadingTeamRole(true);
      try {
        const { data: member, error } = await supabase
          .from('team_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching team member role:', error);
        } else {
          setTeamMemberRole(member?.role || null);
        }
      } catch (error) {
        console.error('Error fetching team member role:', error);
      } finally {
        setLoadingTeamRole(false);
      }
    };

    fetchTeamMemberRole();
  }, [user?.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header className="sticky px-4 top-0 z-50 w-full h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className=" flex h-16 items-center px-2 md:px-4 gap-2 mx-auto ">
        {/* Sidebar collapse/expand button */}
        {typeof sidebarCollapsed === 'boolean' && onSidebarCollapseToggle && (
          <Button variant="ghost" size="icon" className="mr-1" onClick={onSidebarCollapseToggle}>
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}
        {/* Search bar (always visible on desktop, icon on mobile) */}
        <div className="flex-1 flex items-center min-w-0">
          <div className="relative w-full max-w-xs hidden sm:block">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 md:w-[300px] lg:w-[400px]"
            />
          </div>
          {/* Mobile search icon */}
          <Button variant="ghost" size="icon" className="sm:hidden ml-1">
            <SearchIcon className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        </div>
        {/* Role badge and switcher (desktop only) */}
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="ghost" size="icon" className="ml-1">
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          </div>
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild size="sm" className="p-1 bg-primary rounded-full hover:bg-primary/80 text-primary-foreground ml-1">
                <Link to="/package-intake-test">
                  <Plus className="h-6 w-6" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent variant="default">+ New Proposal</TooltipContent>
          </Tooltip>
          {/* Team Member Role Badge - Switchable for Testing */}
          {user && (isNotB2B !== false) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="px-3 py-1 shadow-sm font-semibold uppercase gap-1 flex items-center">
                  {loadingTeamRole ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : teamMemberRole === 'owner' ? (
                    <Crown className="w-4 h-4 text-primary" />
                  ) : teamMemberRole === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  ) : teamMemberRole === 'sales' ? (
                    <Briefcase className="w-4 h-4 text-primary" />
                  ) : teamMemberRole === 'operations' ? (
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                  {loadingTeamRole ? 'Loading...' : teamMemberRole ? teamMemberRole.charAt(0).toUpperCase() + teamMemberRole.slice(1) : 'Member'}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Switch Role (Testing)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTeamMemberRole('owner')}>
                  <Crown className="w-4 h-4 mr-2 text-primary" /> Owner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTeamMemberRole('admin')}>
                  <ShieldCheck className="w-4 h-4 mr-2 text-primary" /> Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTeamMemberRole('sales')}>
                  <Briefcase className="w-4 h-4 mr-2 text-primary" /> Sales
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTeamMemberRole('operations')}>
                  <ShieldCheck className="w-4 h-4 mr-2 text-primary" /> Operations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTeamMemberRole('member')}>
                  <User className="w-4 h-4 mr-2 text-primary" /> Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  // Reset to actual database role
                  const fetchTeamMemberRole = async () => {
                    if (!user?.id) return;
                    const { data: member } = await supabase
                      .from('team_members')
                      .select('role')
                      .eq('user_id', user.id)
                      .eq('status', 'active')
                      .maybeSingle();
                    setTeamMemberRole(member?.role || null);
                  };
                  fetchTeamMemberRole();
                }}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset to Database Role
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {/* Divider (desktop only) */}
        <div className="hidden sm:block h-8 w-px bg-border mx-3" />
        {/* Right side actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Social Links - only show in public routes */}
          {showNavigation && (
            <div className="hidden sm:flex items-center space-x-1">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4" />
                  <span className="sr-only">Instagram</span>
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              </Button>
            </div>
          )}

          {/* Theme Toggle */}
          {/* Auth/User Section */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name} />
                    <AvatarFallback>
                      {user.user_metadata?.name?.[0] || user.email?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
        {/* Mobile menu button - only show if navigation is enabled */}
        {showNavigation && (
          <Button variant="ghost" size="icon" className="ml-2 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}
      </div>
      {/* Mobile Menu - only show if navigation is enabled */}
      {showNavigation && mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container px-4 py-4 space-y-4">
            <nav className="space-y-2">
              <Link
                to="/"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname === '/' 
                    ? 'text-foreground bg-muted' 
                    : 'text-foreground/60 hover:bg-muted'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/how-it-works"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname === '/how-it-works' 
                    ? 'text-foreground bg-muted' 
                    : 'text-foreground/60 hover:bg-muted'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                to="/features"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname === '/features' 
                    ? 'text-foreground bg-muted' 
                    : 'text-foreground/60 hover:bg-muted'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname === '/pricing' 
                    ? 'text-foreground bg-muted' 
                    : 'text-foreground/60 hover:bg-muted'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/blog"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname.startsWith('/blog') 
                    ? 'text-foreground bg-muted' 
                    : 'text-foreground/60 hover:bg-muted'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                to="/about"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname === '/about' 
                    ? 'text-foreground bg-muted' 
                    : 'text-foreground/60 hover:bg-muted'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
            </nav>

            {/* Mobile Social Links */}
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Mobile Auth Section */}
            {!user && (
              <div className="flex flex-col space-y-2 pt-2 border-t">
                <Button variant="outline" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 