import { useAuth } from '@/lib/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { QuoteService, type QuoteResponse } from '@/lib/quoteService';
import { BookingService, type Booking, type BookingStats } from '@/lib/bookingService';
import { toast } from 'sonner';
import { 
  Loader2, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  User, 
  Plus, 
  TrendingUp, 
  Globe, 
  Clock, 
  Star,
  Search,
  Filter,
  Download,
  Share2,
  Heart,
  Zap,
  Award,
  Users,
  DollarSign,
  Plane,
  Hotel,
  Utensils,
  Camera,
  Sparkles,
  Crown,
  Trophy,
  Target,
  BarChart3,
  Activity,
  Compass,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Receipt,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock3,
  CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { UsageDashboard } from '@/components/UsageDashboard';
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import * as React from "react";
import { UndrawMakeItRain } from 'react-undraw-illustrations';
import { SiStripe } from 'react-icons/si';

// Interactive chart data and config for the Today summary section
// Generate real chart data from quotes and bookings
const chartConfig = {
  bookingRevenue: {
    label: "Booking Revenue",
    color: "var(--primary-500)",
  },
  quotes: {
    label: "Quotes Created",
    color: "var(--secondary-950)",
  },
  bookings: {
    label: "Bookings Created", 
    color: "var(--primary-300)",
  },
} satisfies ChartConfig;

export function Dashboard() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteResponse[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("bookingRevenue");
  const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | '1y'>('30d');
  
  // Generate chart data from actual quotes and bookings with time range support
  const chartData = React.useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
    const dateRange = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toISOString().split('T')[0];
    });

    return dateRange.map(date => {
      // QUOTES DATA (from quotes table)
      // Quotes created on this date
      const quotesOnDate = quotes.filter(q => 
        q.createdAt.split('T')[0] === date
      );
      
      // BOOKINGS DATA (from bookings table)
      // Bookings created on this date
      const bookingsOnDate = bookings.filter(b => 
        b.createdAt?.split('T')[0] === date
      );
      
      // Confirmed bookings on this date
      const confirmedBookingsOnDate = bookings.filter(b => 
        b.createdAt?.split('T')[0] === date && b.status === 'confirmed'
      );
      
      // Revenue from confirmed bookings on this date
      const bookingRevenueOnDate = confirmedBookingsOnDate.reduce((sum, b) => sum + (b.totalCost || 0), 0);

      return {
        date,
        bookingRevenue: bookingRevenueOnDate,
        quotes: quotesOnDate.length,
        bookings: bookingsOnDate.length,
      };
    });
  }, [quotes, bookings, timeRange]);
  
  const total = React.useMemo(
    () => ({
      bookingRevenue: chartData.reduce((acc, curr) => acc + curr.bookingRevenue, 0),
      quotes: chartData.reduce((acc, curr) => acc + curr.quotes, 0),
      bookings: chartData.reduce((acc, curr) => acc + curr.bookings, 0),
    }),
    [chartData]
  );

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [userQuotes, userBookings, stats] = await Promise.all([
        QuoteService.getQuotes(),
        BookingService.getUserBookings(),
        BookingService.getBookingStats()
      ]);
      
      setQuotes(userQuotes);
      setBookings(userBookings);
      setBookingStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    
    try {
      await QuoteService.deleteQuote(id);
      setQuotes(quotes.filter(q => q.id !== id));
      toast.success('Quote deleted successfully');
    } catch (error) {
      console.error('Failed to delete quote:', error);
      toast.error('Failed to delete quote');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    try {
      await BookingService.deleteBooking(id);
      setBookings(bookings.filter(b => b.id !== id));
      // Reload stats after deletion
      const stats = await BookingService.getBookingStats();
      setBookingStats(stats);
      toast.success('Booking deleted successfully');
    } catch (error) {
      console.error('Failed to delete booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'pending' | 'cancelled' | 'completed') => {
    try {
      await BookingService.updateBookingStatus(bookingId, newStatus);
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
      // Reload stats after status update
      const stats = await BookingService.getBookingStats();
      setBookingStats(stats);
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'completed': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock3 className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Calculate business metrics
  const totalQuotes = quotes.length;
  const confirmedQuotes = quotes.filter(q => q.status === 'confirmed').length;
  const pendingQuotes = quotes.filter(q => q.status === 'draft').length;
  const cancelledQuotes = quotes.filter(q => q.status === 'cancelled').length;
  
  const totalRevenue = quotes
    .filter(q => q.status === 'confirmed')
    .reduce((sum, q) => sum + q.totalPrice, 0);
  
  const conversionRate = totalQuotes > 0 ? (confirmedQuotes / totalQuotes) * 100 : 0;
  
  const thisMonthQuotes = quotes.filter(q => {
    const date = new Date(q.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const thisMonthRevenue = quotes
    .filter(q => {
      const date = new Date(q.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && q.status === 'confirmed';
    })
    .reduce((sum, q) => sum + q.totalPrice, 0);

  const filteredQuotes = quotes.filter(quote =>
    quote.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.clientAddress?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking =>
    (booking.clientName?.toLowerCase() || '').includes(bookingSearchTerm.toLowerCase()) ||
    (booking.destination?.toLowerCase() || '').includes(bookingSearchTerm.toLowerCase()) ||
    (booking.status?.toLowerCase() || '').includes(bookingSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="px-4 py-8 space-y-8">
        {/* Today summary section placeholder for loading state */}
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-8 animate-pulse h-56" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-8 py-8 space-y-8">
      {/* Today summary section */}
      <div className=" mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
          {/* Left: Main Metrics and Chart */}
          <div className="flex-1 w-full h-full">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-2">
              <div>
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <p className="text-muted-foreground text-sm mt-1">Your business performance at a glance</p>
              </div>
              <div className="flex gap-8 items-end mt-2 sm:mt-0 flex-wrap">
                <div className="text-right">
                  <div className="text-muted-foreground text-sm">Total Revenue</div>
                  <div className="text-xl font-semibold">{formatCurrency(totalRevenue)}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-sm">Total Quotes</div>
                  <div className="text-xl font-semibold">{totalQuotes}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-sm">Bookings Created</div>
                  <div className="text-xl font-semibold">{bookings.length}</div>
                </div>
              </div>
            </div>
            {/* Improved Chart UI */}
            <div className="rounded-xl border border-border bg-gradient-to-b from-card/95 to-card/20 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-semibold text-base">Business Performance</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({timeRange === '7d' ? 'last 7 days' : timeRange === '30d' ? 'last 30 days' : 'last year'})
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex gap-1 bg-muted rounded-lg p-1">
                    {(['7d', '30d', '1y'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          timeRange === range
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {range === '7d' ? '7D' : range === '30d' ? '30D' : '1Y'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  {(['bookingRevenue', 'quotes', 'bookings'] as const).map((key) => (
                    <button
                      key={key}
                      data-active={activeChart === key}
                      className={
                        `px-4 py-1 rounded-lg border text-sm font-medium transition-colors ` +
                        (activeChart === key
                          ? "bg-primary text-primary-foreground border-primary shadow"
                          : "bg-background text-foreground border-border hover:bg-muted/60")
                      }
                      onClick={() => setActiveChart(key)}
                    >
                      {chartConfig[key].label}
                    </button>
                  ))}
                </div>
              </div>
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[250px] w-full"
              >
                <LineChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={timeRange === '1y' ? 60 : 32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      if (timeRange === '1y') {
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          year: "2-digit",
                        });
                      } else {
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                      }
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        nameKey={activeChart}
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });
                        }}
                        valueFormatter={(value) => {
                          if (activeChart === 'bookingRevenue') {
                            return formatCurrency(value);
                          } else {
                            return value.toString();
                          }
                        }}
                      />
                    }
                  />
                  <Line
                    dataKey={activeChart}
                    type="monotone"
                    stroke={`var(--color-${activeChart})`}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-muted-foreground">
                  {activeChart === 'bookingRevenue' && `Total Booking Revenue: ${formatCurrency(total[activeChart])}`}
                  {activeChart === 'quotes' && `Total Quotes: ${total[activeChart].toLocaleString()}`}
                  {activeChart === 'bookings' && `Total Bookings: ${total[activeChart].toLocaleString()}`}
                </div>
                <div className="text-xs text-muted-foreground italic">Interactive chart</div>
              </div>
            </div>
          </div>
          {/* Right: Business Overview Card */}
          <div className="w-full lg:w-96 h-full">
            <div className="bg-gradient-to-b from-card/95 to-card/20 rounded-xl p-6 shadow flex flex-col gap-4 border border-border h-full justify-center">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg mb-2">Today's Business Overview</h3>
                <p className="text-muted-foreground text-sm">Your daily activity summary</p>
              </div>
              
              {/* Today's Activity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Quotes Created</span>
              </div>
                  <span className="text-lg font-bold">
                    {quotes.filter(q => q.createdAt.split('T')[0] === new Date().toISOString().split('T')[0]).length}
                  </span>
              </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Bookings Confirmed</span>
                  </div>
                  <span className="text-lg font-bold">
                    {bookings.filter(b => b.createdAt?.split('T')[0] === new Date().toISOString().split('T')[0] && b.status === 'confirmed').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Revenue Today</span>
                  </div>
                  <span className="text-lg font-bold">
                    {formatCurrency(
                      bookings
                        .filter(b => b.createdAt?.split('T')[0] === new Date().toISOString().split('T')[0] && b.status === 'confirmed')
                        .reduce((sum, b) => sum + (b.totalCost || 0), 0)
                    )}
                  </span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/package-intake-test">
                    <button className="w-full bg-primary text-primary-foreground font-medium rounded-lg px-3 py-2 text-sm shadow hover:bg-primary/90 transition-colors">
                      Create Quote
              </button>
                  </Link>
                  <Link to="/bookings">
                    <button className="w-full bg-secondary text-secondary-foreground font-medium rounded-lg px-3 py-2 text-sm shadow hover:bg-secondary/90 transition-colors">
                      View Bookings
                    </button>
                  </Link>
            </div>
          </div>
              
              {/* Pending Items */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">Pending Items</h4>
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Quotes to Follow Up</span>
                    <span className="font-semibold">
                      {quotes.filter(q => q.status === 'sent').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pending Bookings</span>
                    <span className="font-semibold">
                      {bookings.filter(b => b.status === 'pending_payment').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      

  

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between mb-4 gap-4">
          <TabsList className="grid grid-cols-4 p-1 rounded-xl w-fit">
            <TabsTrigger value="overview" className="rounded-lg !text-muted-foreground !data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm transition-colors">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="quotes" className="rounded-lg !text-muted-foreground !data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm transition-colors">
              <FileText className="h-4 w-4 mr-2" />
              Quotes
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-lg !text-muted-foreground !data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm transition-colors">
              <CheckCircle className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="usage" className="rounded-lg !text-muted-foreground !data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm transition-colors">
              <Target className="h-4 w-4 mr-2" />
              Usage & Plans
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2 ml-auto">
            <Link to="/bookings">
              <Button variant="outline" className="rounded-lg px-4">View Bookings</Button>
            </Link>
            <Link to="/new-proposal">
              <Button className="rounded-lg px-4">Create Proposal</Button>
            </Link>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Total Revenue</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                From Bookings
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">
              {formatCurrency(bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.totalCost || 0), 0))}
            </div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Confirmed bookings only <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Reliable revenue tracking</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-b  from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Total Quotes</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Created
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{totalQuotes}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              All time quotes <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Sales pipeline activity</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-b  from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Active Bookings</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                Confirmed
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Confirmed bookings <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Active business</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-b  from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Avg Booking Value</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Per Booking
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">
              {(() => {
                const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
                const totalValue = confirmedBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
                return confirmedBookings.length > 0 ? formatCurrency(totalValue / confirmedBookings.length) : formatCurrency(0);
              })()}
            </div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
              Average confirmed booking <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">Revenue per booking</div>
          </CardContent>
        </Card>
      </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Quotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quotes.slice(0, 5).map((quote) => (
                    <Link
                      key={quote.id}
                      to={`/quote/${quote.id}`}
                      className="block group"
                    >
                      <div
                        className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 group-hover:bg-[var(--primary)]/20 transition-colors">
                            <FileText className="h-5 w-5 text-[var(--primary)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate text-sm text-foreground">{quote.clientEmail || 'Client'}</p>
                            <p className="text-xs text-muted-foreground truncate">{getTimeAgo(quote.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 min-w-[90px]">
                          <span className="font-bold text-[var(--primary)] text-base">{formatCurrency(quote.totalPrice, quote.currency)}</span>
                          <Badge 
                            variant={getStatusColor(quote.status)}
                            className="text-xs px-2 py-0.5 rounded-full capitalize"
                          >
                            {quote.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate text-sm text-foreground">
                            {booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : booking.leadTravelerName || 'Client'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {booking.eventName ? `${booking.eventName} • ` : ''}{getTimeAgo(booking.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 min-w-[90px]">
                        <span className="font-bold text-green-600 text-base">
                          {formatCurrency(booking.totalCost, booking.currency)}
                        </span>
                        <Badge 
                          variant={getStatusColor(booking.status)}
                          className="text-xs px-2 py-0.5 rounded-full capitalize"
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No bookings yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border bg-gradient-to-b from-card/95 to-background/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Business Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Quote to Booking Rate</span>
                      <span>{conversionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={conversionRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Confirmed Bookings</span>
                      <span>{bookings.filter(b => b.status === 'confirmed').length}</span>
                    </div>
                    <Progress 
                      value={bookings.length > 0 ? (bookings.filter(b => b.status === 'confirmed').length / bookings.length) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Average Booking Value</span>
                      <span>
                        {(() => {
                          const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
                          const totalValue = confirmedBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
                          return confirmedBookings.length > 0 ? formatCurrency(totalValue / confirmedBookings.length) : formatCurrency(0);
                        })()}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-primary rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-gradient-to-b from-card/95 to-background/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  This Month Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Quotes This Month</span>
                    </div>
                    <span className="text-lg font-bold">
                      {quotes.filter(q => {
                        const date = new Date(q.createdAt);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Bookings This Month</span>
                    </div>
                    <span className="text-lg font-bold">
                      {bookings.filter(b => {
                        const date = new Date(b.createdAt);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Revenue This Month</span>
                    </div>
                    <span className="text-lg font-bold">
                      {formatCurrency(
                        bookings
                          .filter(b => {
                            const date = new Date(b.createdAt);
                            const now = new Date();
                            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && b.status === 'confirmed';
                          })
                          .reduce((sum, b) => sum + (b.totalCost || 0), 0)
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quotes" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search quotes by client, destination, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2 px-6 py-3 rounded-xl">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Quotes Grid */}
          {filteredQuotes.length === 0 ? (
            <Card className="text-center py-16 border border-border/50 bg-card">
              <CardContent>
                <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-3">No quotes found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start by creating your first quote'}
                </p>
                <Link to="/new-proposal">
                  <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 px-6 py-3 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Quote
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuotes.map((quote) => (
                <Card key={quote.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-border/50 bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[var(--primary)]" />
                        <span className="text-sm font-medium">Quote #{quote.id.slice(0, 8)}</span>
                      </div>
                      <Badge 
                        variant={getStatusColor(quote.status)}
                        className="text-xs"
                      >
                        {quote.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Client</p>
                      <p className="font-medium">{quote.clientEmail || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-xl font-bold text-[var(--primary)]">
                        {formatCurrency(quote.totalPrice, quote.currency)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formatDate(quote.createdAt)}</span>
                      <span>{getTimeAgo(quote.createdAt)}</span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link to={`/quote/${quote.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search bookings by client, destination, or status..."
                value={bookingSearchTerm}
                onChange={(e) => setBookingSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2 px-6 py-3 rounded-xl">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Bookings Grid */}
          {filteredBookings.length === 0 ? (
            <Card className="text-center py-16 border border-border/50 bg-card">
              <CardContent>
                <div className="mx-auto w-16 h-16 bg-muted rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-3">No bookings found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {bookingSearchTerm ? 'Try adjusting your search terms' : 'Start by creating quotes and confirming them as bookings'}
                </p>
                <Link to="/new-proposal">
                  <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 px-6 py-3 rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Quote
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-border/50 bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Booking #{booking.id.slice(0, 8)}</span>
                      </div>
                      <Badge 
                        variant={getStatusColor(booking.status)}
                        className="text-xs"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Client</p>
                      <p className="font-medium">{booking.clientName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-medium">{booking.destination}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cost</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(booking.totalCost, booking.currency)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>{formatDate(booking.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(booking.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
} 