import { useState } from 'react';
import { WandSparkles, Instagram, Github, Linkedin, User, Settings, LogOut, ChevronDown, Sun, Moon, Menu, X, Calendar, Clock, Phone, Mail, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/components/ThemeProvider';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from '@/components/ui/navigation-menu';
import { Link, useLocation } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import LuxeLogo from '@/assets/imgs/logo.svg';

const Logo = ({ className }: { className?: string }) => (
  <svg 
    width="100%" 
    height="100%" 
    viewBox="0 0 539 128" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path d="M184.2 110.152C178.653 110.152 173.661 109.171 169.224 107.208C164.872 105.16 161.416 102.429 158.856 99.016C156.296 95.5173 154.931 91.6347 154.76 87.368H169.864C170.12 90.3547 171.528 92.872 174.088 94.92C176.733 96.8827 180.019 97.864 183.944 97.864C188.04 97.864 191.197 97.096 193.416 95.56C195.72 93.9387 196.872 91.8907 196.872 89.416C196.872 86.7707 195.592 84.808 193.032 83.528C190.557 82.248 186.589 80.84 181.128 79.304C175.837 77.8533 171.528 76.4453 168.2 75.08C164.872 73.7147 161.971 71.624 159.496 68.808C157.107 65.992 155.912 62.28 155.912 57.672C155.912 53.9173 157.021 50.504 159.24 47.432C161.459 44.2747 164.616 41.8 168.712 40.008C172.893 38.216 177.672 37.32 183.048 37.32C191.069 37.32 197.512 39.368 202.376 43.464C207.325 47.4747 209.971 52.9787 210.312 59.976H195.72C195.464 56.8187 194.184 54.3013 191.88 52.424C189.576 50.5467 186.461 49.608 182.536 49.608C178.696 49.608 175.752 50.3333 173.704 51.784C171.656 53.2347 170.632 55.1547 170.632 57.544C170.632 59.4213 171.315 61 172.68 62.28C174.045 63.56 175.709 64.584 177.672 65.352C179.635 66.0347 182.536 66.9307 186.376 68.04C191.496 69.4053 195.677 70.8133 198.92 72.264C202.248 73.6293 205.107 75.6773 207.496 78.408C209.885 81.1387 211.123 84.7653 211.208 89.288C211.208 93.2987 210.099 96.8827 207.88 100.04C205.661 103.197 202.504 105.672 198.408 107.464C194.397 109.256 189.661 110.152 184.2 110.152ZM255.007 110.152C248.351 110.152 242.335 108.659 236.959 105.672C231.583 102.6 227.359 98.3333 224.287 92.872C221.215 87.3253 219.679 80.9253 219.679 73.672C219.679 66.504 221.258 60.1467 224.415 54.6C227.572 49.0533 231.882 44.7867 237.343 41.8C242.804 38.8133 248.906 37.32 255.647 37.32C262.388 37.32 268.49 38.8133 273.951 41.8C279.412 44.7867 283.722 49.0533 286.879 54.6C290.036 60.1467 291.615 66.504 291.615 73.672C291.615 80.84 289.994 87.1973 286.751 92.744C283.508 98.2907 279.071 102.6 273.439 105.672C267.892 108.659 261.748 110.152 255.007 110.152ZM255.007 97.48C258.762 97.48 262.26 96.584 265.503 94.792C268.831 93 271.519 90.312 273.567 86.728C275.615 83.144 276.639 78.792 276.639 73.672C276.639 68.552 275.658 64.2427 273.695 60.744C271.732 57.16 269.13 54.472 265.887 52.68C262.644 50.888 259.146 49.992 255.391 49.992C251.636 49.992 248.138 50.888 244.895 52.68C241.738 54.472 239.22 57.16 237.343 60.744C235.466 64.2427 234.527 68.552 234.527 73.672C234.527 81.2667 236.447 87.1547 240.287 91.336C244.212 95.432 249.119 97.48 255.007 97.48ZM318.072 14.28V109H303.48V14.28H318.072ZM398.542 38.472V109H383.95V100.68C381.646 103.581 378.617 105.885 374.862 107.592C371.193 109.213 367.267 110.024 363.086 110.024C357.539 110.024 352.547 108.872 348.11 106.568C343.758 104.264 340.302 100.851 337.742 96.328C335.267 91.8053 334.03 86.344 334.03 79.944V38.472H348.494V77.768C348.494 84.0827 350.073 88.9467 353.23 92.36C356.387 95.688 360.697 97.352 366.158 97.352C371.619 97.352 375.929 95.688 379.086 92.36C382.329 88.9467 383.95 84.0827 383.95 77.768V38.472H398.542ZM429.827 48.712C431.96 45.128 434.776 42.3547 438.275 40.392C441.859 38.344 446.083 37.32 450.947 37.32V52.424H447.235C441.518 52.424 437.166 53.8747 434.179 56.776C431.278 59.6773 429.827 64.712 429.827 71.88V109H415.235V38.472H429.827V48.712ZM456.936 73.416C456.936 66.3333 458.387 60.0613 461.288 54.6C464.275 49.1387 468.285 44.9147 473.32 41.928C478.44 38.856 484.072 37.32 490.216 37.32C495.763 37.32 500.584 38.4293 504.68 40.648C508.861 42.7813 512.189 45.4693 514.664 48.712V38.472H529.384V109H514.664V98.504C512.189 101.832 508.819 104.605 504.552 106.824C500.285 109.043 495.421 110.152 489.96 110.152C483.901 110.152 478.355 108.616 473.32 105.544C468.285 102.387 464.275 98.0347 461.288 92.488C458.387 86.856 456.936 80.4987 456.936 73.416ZM514.664 73.672C514.664 68.808 513.64 64.584 511.592 61C509.629 57.416 507.027 54.6853 503.784 52.808C500.541 50.9307 497.043 49.992 493.288 49.992C489.533 49.992 486.035 50.9307 482.792 52.808C479.549 54.6 476.904 57.288 474.856 60.872C472.893 64.3707 471.912 68.552 471.912 73.416C471.912 78.28 472.893 82.5467 474.856 86.216C476.904 89.8853 479.549 92.7013 482.792 94.664C486.12 96.5413 489.619 97.48 493.288 97.48C497.043 97.48 500.541 96.5413 503.784 94.664C507.027 92.7867 509.629 90.056 511.592 86.472C513.64 82.8027 514.664 78.536 514.664 73.672Z" className="fill-current"/>
    <rect x="58.2402" y="100.48" width="11" height="27.52" rx="5.5" className="fill-primary"/>
    <rect x="58.2402" width="11" height="27.52" rx="5.5" className="fill-primary-400"/>
    <rect x="85.7222" y="93.8682" width="11" height="27.52" rx="5.5" transform="rotate(-45 85.7222 93.8682)" className="fill-primary"/>
    <rect x="14.6724" y="22.8181" width="11" height="27.52" rx="5.5" transform="rotate(-45 14.6724 22.8181)" className="fill-primary"/>
    <rect x="100.48" y="69.76" width="11" height="27.52" rx="5.5" transform="rotate(-90 100.48 69.76)" className="fill-primary"/>
    <rect y="69.76" width="11" height="27.52" rx="5.5" transform="rotate(-90 0 69.76)" className="fill-primary"/>
    <rect x="34.1323" y="85.7223" width="11" height="27.52" rx="5.5" transform="rotate(45 34.1323 85.7223)" className="fill-primary"/>
    <rect x="105.182" y="14.6722" width="11" height="27.52" rx="5.5" transform="rotate(45 105.182 14.6722)" className="fill-primary"/>
    <circle cx="63.5" cy="64.5" r="29.5" className="fill-primary"/>
  </svg>
);


// Recent blog posts data
const recentPosts = [
  {
    slug: 'welcome-to-the-blog',
    title: 'Welcome to the AItinerary Blog',
    date: '2024-06-10',
    category: 'Company',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=200&fit=crop',
  },
  {
    slug: 'ai-in-travel',
    title: 'How AI is Transforming B2B Travel',
    date: '2024-06-09',
    category: 'Technology',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
  },
  {
    slug: 'luxury-travel-trends-2024',
    title: 'Luxury Travel Trends to Watch in 2024',
    date: '2024-06-07',
    category: 'Trends',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=200&fit=crop',
  },
];

export function PublicHeader() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)] shadow-sm">
      {/* Top Header with Contact Details */}
      <div className="bg-[var(--primary)] text-primary-foreground text-sm">
        <div className="px-4 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 container mx-auto">
            {/* Contact Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@solura.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Mon-Fri 9AM-6PM GMT</span>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="flex items-center gap-4">
              <a href="/support" className="hover:text-white/80 transition-colors">
                Support
              </a>
              <a href="/contact" className="hover:text-white/80 transition-colors">
                Contact
              </a>
              <a href="/demo" className="hover:text-white/80 transition-colors">
                Book Demo
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="w-fullsm:px-6 py-3 flex items-center justify-between container mx-auto">
        {/* Logo/Brand - Always goes to homepage */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Logo className="h-8" />
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="/" 
                  className={`text-base font-medium transition-colors ${
                    location.pathname === '/' 
                      ? 'text-[var(--primary)] font-semibold' 
                      : 'text-[var(--foreground)] hover:text-[var(--primary)]'
                  }`}
                >
                  Home
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="/how-it-works" 
                  className={`text-base font-medium transition-colors ${
                    location.pathname === '/how-it-works' 
                      ? 'text-[var(--primary)] font-semibold' 
                      : 'text-[var(--foreground)] hover:text-[var(--primary)]'
                  }`}
                >
                  How It Works
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="/pricing" 
                  className={`text-base font-medium transition-colors ${
                    location.pathname === '/pricing' 
                      ? 'text-[var(--primary)] font-semibold' 
                      : 'text-[var(--foreground)] hover:text-[var(--primary)]'
                  }`}
                >
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="/features" 
                  className={`text-base font-medium transition-colors ${
                    location.pathname === '/features' 
                      ? 'text-[var(--primary)] font-semibold' 
                      : 'text-[var(--foreground)] hover:text-[var(--primary)]'
                  }`}
                >
                  Features
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger 
                  className={`text-base font-medium transition-colors ${
                    location.pathname.startsWith('/blog') 
                      ? 'text-[var(--primary)] font-semibold' 
                      : 'text-[var(--foreground)] hover:text-[var(--primary)]'
                  }`}
                >
                  Blog
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[750px] p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Recent Posts Section */}
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent Posts</h3>
                          <Link to="/blog" className="text-sm text-[var(--primary)] hover:underline font-medium">
                            View All Posts →
                          </Link>
                        </div>
                        <div className="space-y-4">
                          {recentPosts.map((post) => (
                            <Link
                              key={post.slug}
                              to={`/blog/${post.slug}`}
                              className="flex gap-4 p-4 rounded-lg hover:bg-[var(--muted)] transition-all duration-200 group border border-transparent hover:border-[var(--border)]"
                            >
                              <div className="flex-shrink-0">
                                <img
                                  src={post.image}
                                  alt={post.title}
                                  className="w-20 h-16 object-cover rounded-md group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-[var(--primary)] transition-colors mb-3">
                                  {post.title}
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                                  <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 rounded-full font-medium">
                                    {post.category}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {post.readTime}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Categories & Quick Links */}
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">Categories</h3>
                        <div className="space-y-3 mb-8">
                          <Link to="/blog/category/technology" className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--muted)] transition-colors group">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                              <WandSparkles className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <div className="font-medium text-sm group-hover:text-[var(--primary)] transition-colors mb-1">Technology</div>
                              <div className="text-xs text-[var(--muted-foreground)]">AI, APIs, & Innovation</div>
                            </div>
                          </Link>
                          <Link to="/blog/category/business" className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--muted)] transition-colors group">
                            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <div className="font-medium text-sm group-hover:text-[var(--primary)] transition-colors mb-1">Business</div>
                              <div className="text-xs text-[var(--muted-foreground)]">Strategy & Growth</div>
                            </div>
                          </Link>
                          <Link to="/blog/category/trends" className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--muted)] transition-colors group">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                              <Star className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <div className="font-medium text-sm group-hover:text-[var(--primary)] transition-colors mb-1">Trends</div>
                              <div className="text-xs text-[var(--muted-foreground)]">Industry Insights</div>
                            </div>
                          </Link>
                        </div>

                        {/* Newsletter Signup */}
                        <div className="bg-[var(--muted)]/50 rounded-lg p-6 border border-[var(--border)]">
                          <h4 className="font-medium text-sm mb-3">Stay Updated</h4>
                          <p className="text-xs text-[var(--muted-foreground)] mb-4 leading-relaxed">
                            Get the latest travel tech insights delivered to your inbox.
                          </p>
                          <div className="flex gap-3">
                            <input
                              type="email"
                              placeholder="Enter your email"
                              className="flex-1 px-4 py-3 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                            />
                            <Button size="sm" className="px-4 py-3 text-xs">
                              Subscribe
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink 
                  href="/about" 
                  className={`text-base font-medium transition-colors ${
                    location.pathname === '/about' 
                      ? 'text-[var(--primary)] font-semibold' 
                      : 'text-[var(--foreground)] hover:text-[var(--primary)]'
                  }`}
                >
                  About
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Right side - Social + Theme Toggle + Auth/User Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Social Media Icons - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" title="Instagram">
              <Button variant="ghost" size="icon">
                <Instagram className="h-5 w-5 text-[var(--foreground)]" />
              </Button>
            </a>
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" title="GitHub">
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5 text-[var(--foreground)]" />
              </Button>
            </a>
            <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
              <Button variant="ghost" size="icon">
                <Linkedin className="h-5 w-5 text-[var(--foreground)]" />
              </Button>
            </a>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {/* Auth/User Section */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* My Dashboard Button - Hidden on mobile */}
              <div className="hidden sm:block">
                <Link to="/dashboard">
                  <Button variant="default" size="sm">
                    My Dashboard
                  </Button>
                </Link>
              </div>
              
              {/* User Profile Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-[var(--muted)] transition-all duration-200 hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                  >
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-transparent transition-all duration-200 group-hover:ring-[var(--primary)]/20">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-white font-semibold">
                        {user.user_metadata?.name?.[0] || user.email?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-64 p-2 mt-2 border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl shadow-xl rounded-xl" 
                  align="end" 
                  sideOffset={8}
                >
                  <div className="p-3">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 text-white font-semibold">
                            {user.user_metadata?.name?.[0] || user.email?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-none text-[var(--foreground)] truncate">
                            {user.user_metadata?.name || 'User'}
                          </p>
                          <p className="text-xs leading-none text-[var(--muted-foreground)] mt-1 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="my-2 h-px bg-[var(--border)]" />
                  
                  <div className="space-y-1">
                    <Link 
                      to="/dashboard" 
                      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-[var(--muted)] transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center group-hover:bg-blue-500/20 transition-colors duration-150">
                        <User className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">Dashboard</span>
                        <p className="text-xs text-[var(--muted-foreground)]">View your trips & bookings</p>
                      </div>
                    </Link>
                    
                    <Link 
                      to="/settings" 
                      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-[var(--muted)] transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="w-8 h-8 bg-gray-500/10 rounded-lg flex items-center justify-center group-hover:bg-gray-500/20 transition-colors duration-150">
                        <Settings className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">Settings</span>
                        <p className="text-xs text-[var(--muted-foreground)]">Manage your account</p>
                      </div>
                    </Link>
                  </div>
                  
                  <div className="my-2 h-px bg-[var(--border)]" />
                  
                  <button 
                    onClick={handleSignOut} 
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-red-500/10 transition-colors duration-150 cursor-pointer group text-red-600 focus:text-red-600 focus:bg-red-500/10"
                  >
                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors duration-150">
                      <LogOut className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium">Sign out</span>
                      <p className="text-xs text-[var(--muted-foreground)]">Log out of your account</p>
                    </div>
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Start For Free</Button>
              </Link>
            </div>
          )}
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-lg">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Navigation Links */}
            <nav className="space-y-2">
              <Link
                to="/"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname === '/' 
                    ? 'text-[var(--primary)] bg-[var(--primary)]/10 font-semibold' 
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/how-it-works"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname === '/how-it-works' 
                    ? 'text-[var(--primary)] bg-[var(--primary)]/10 font-semibold' 
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                to="/pricing"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname === '/pricing' 
                    ? 'text-[var(--primary)] bg-[var(--primary)]/10 font-semibold' 
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/features"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname === '/features' 
                    ? 'text-[var(--primary)] bg-[var(--primary)]/10 font-semibold' 
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <div className="px-3 py-2">
                <div className={`text-base font-medium mb-2 ${
                  location.pathname.startsWith('/blog') 
                    ? 'text-[var(--primary)] font-semibold' 
                    : 'text-[var(--foreground)]'
                }`}>
                  Blog
                </div>
                <div className="space-y-2 ml-4">
                  {recentPosts.map((post) => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className={`block py-2 text-sm transition-colors ${
                        location.pathname === `/blog/${post.slug}` 
                          ? 'text-[var(--primary)] font-medium' 
                          : 'text-[var(--muted-foreground)] hover:text-[var(--primary)]'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {post.title}
                    </Link>
                  ))}
                  <Link
                    to="/blog"
                    className={`block py-2 text-sm transition-colors ${
                      location.pathname === '/blog' 
                        ? 'text-[var(--primary)] font-medium' 
                        : 'text-[var(--primary)] hover:underline'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    View All Posts →
                  </Link>
                </div>
              </div>
              <Link
                to="/about"
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  location.pathname === '/about' 
                    ? 'text-[var(--primary)] bg-[var(--primary)]/10 font-semibold' 
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
            </nav>

            {/* Mobile Social Links */}
            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" title="Instagram">
                <Button variant="ghost" size="icon">
                  <Instagram className="h-5 w-5 text-[var(--foreground)]" />
                </Button>
              </a>
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer" title="GitHub">
                <Button variant="ghost" size="icon">
                  <Github className="h-5 w-5 text-[var(--foreground)]" />
                </Button>
              </a>
              <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                <Button variant="ghost" size="icon">
                  <Linkedin className="h-5 w-5 text-[var(--foreground)]" />
                </Button>
              </a>
            </div>

            {/* Mobile Auth Section */}
            {!user && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}

            {user && (
              <div className="pt-2 border-t border-[var(--border)]">
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="default" className="w-full">My Dashboard</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 