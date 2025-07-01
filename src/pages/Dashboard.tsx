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
const chartData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-09", desktop: 59, mobile: 110 },
  { date: "2024-04-10", desktop: 261, mobile: 190 },
  { date: "2024-04-11", desktop: 327, mobile: 350 },
  { date: "2024-04-12", desktop: 292, mobile: 210 },
  { date: "2024-04-13", desktop: 342, mobile: 380 },
  { date: "2024-04-14", desktop: 137, mobile: 220 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-16", desktop: 138, mobile: 190 },
  { date: "2024-04-17", desktop: 446, mobile: 360 },
  { date: "2024-04-18", desktop: 364, mobile: 410 },
  { date: "2024-04-19", desktop: 243, mobile: 180 },
  { date: "2024-04-20", desktop: 89, mobile: 150 },
  { date: "2024-04-21", desktop: 137, mobile: 200 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-23", desktop: 138, mobile: 230 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-04-25", desktop: 215, mobile: 250 },
  { date: "2024-04-26", desktop: 75, mobile: 130 },
  { date: "2024-04-27", desktop: 383, mobile: 420 },
  { date: "2024-04-28", desktop: 122, mobile: 180 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-04-30", desktop: 454, mobile: 380 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-02", desktop: 293, mobile: 310 },
  { date: "2024-05-03", desktop: 247, mobile: 190 },
  { date: "2024-05-04", desktop: 385, mobile: 420 },
  { date: "2024-05-05", desktop: 481, mobile: 390 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-07", desktop: 388, mobile: 300 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-09", desktop: 227, mobile: 180 },
  { date: "2024-05-10", desktop: 293, mobile: 330 },
  { date: "2024-05-11", desktop: 335, mobile: 270 },
  { date: "2024-05-12", desktop: 197, mobile: 240 },
  { date: "2024-05-13", desktop: 197, mobile: 160 },
  { date: "2024-05-14", desktop: 448, mobile: 490 },
  { date: "2024-05-15", desktop: 473, mobile: 380 },
  { date: "2024-05-16", desktop: 338, mobile: 400 },
  { date: "2024-05-17", desktop: 499, mobile: 420 },
  { date: "2024-05-18", desktop: 315, mobile: 350 },
  { date: "2024-05-19", desktop: 235, mobile: 180 },
  { date: "2024-05-20", desktop: 177, mobile: 230 },
  { date: "2024-05-21", desktop: 82, mobile: 140 },
  { date: "2024-05-22", desktop: 81, mobile: 120 },
  { date: "2024-05-23", desktop: 252, mobile: 290 },
  { date: "2024-05-24", desktop: 294, mobile: 220 },
  { date: "2024-05-25", desktop: 201, mobile: 250 },
  { date: "2024-05-26", desktop: 213, mobile: 170 },
  { date: "2024-05-27", desktop: 420, mobile: 460 },
  { date: "2024-05-28", desktop: 233, mobile: 190 },
  { date: "2024-05-29", desktop: 78, mobile: 130 },
  { date: "2024-05-30", desktop: 340, mobile: 280 },
  { date: "2024-05-31", desktop: 178, mobile: 230 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-02", desktop: 470, mobile: 410 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-04", desktop: 439, mobile: 380 },
  { date: "2024-06-05", desktop: 88, mobile: 140 },
  { date: "2024-06-06", desktop: 294, mobile: 250 },
  { date: "2024-06-07", desktop: 323, mobile: 370 },
  { date: "2024-06-08", desktop: 385, mobile: 320 },
  { date: "2024-06-09", desktop: 438, mobile: 480 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-11", desktop: 92, mobile: 150 },
  { date: "2024-06-12", desktop: 492, mobile: 420 },
  { date: "2024-06-13", desktop: 81, mobile: 130 },
  { date: "2024-06-14", desktop: 426, mobile: 380 },
  { date: "2024-06-15", desktop: 307, mobile: 350 },
  { date: "2024-06-16", desktop: 371, mobile: 310 },
  { date: "2024-06-17", desktop: 475, mobile: 520 },
  { date: "2024-06-18", desktop: 107, mobile: 170 },
  { date: "2024-06-19", desktop: 341, mobile: 290 },
  { date: "2024-06-20", desktop: 408, mobile: 450 },
  { date: "2024-06-21", desktop: 169, mobile: 210 },
  { date: "2024-06-22", desktop: 317, mobile: 270 },
  { date: "2024-06-23", desktop: 480, mobile: 530 },
  { date: "2024-06-24", desktop: 132, mobile: 180 },
  { date: "2024-06-25", desktop: 141, mobile: 190 },
  { date: "2024-06-26", desktop: 434, mobile: 380 },
  { date: "2024-06-27", desktop: 448, mobile: 490 },
  { date: "2024-06-28", desktop: 149, mobile: 200 },
  { date: "2024-06-29", desktop: 103, mobile: 160 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
];
const chartConfig = {
  views: {
    label: "Page Views",
  },
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
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
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("desktop");
  const total = React.useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
    }),
    []
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
    booking.clientName.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
    booking.destination.toLowerCase().includes(bookingSearchTerm.toLowerCase()) ||
    booking.status.toLowerCase().includes(bookingSearchTerm.toLowerCase())
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
    <div className="mx-auto px-8 pt-0 pb-8 space-y-8">
      {/* Today summary section */}
      <div className=" mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
          {/* Left: Main Metrics and Chart */}
          <div className="flex-1 w-full h-full">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-2">
              <div>
                <h2 className="text-2xl font-bold">Today</h2>
                <p className="text-muted-foreground text-sm mt-1">Your Payouts at a glance</p>
              </div>
              <div className="flex gap-8 items-end mt-2 sm:mt-0 flex-wrap">
                <div className="text-right">
                  <div className="text-muted-foreground text-sm">Gross volume</div>
                  <div className="text-xl font-semibold">$0.00</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-sm">Yesterday</div>
                  <div className="text-xl font-semibold">$0.00</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-sm">USD Balance</div>
                  <div className="text-xl font-semibold">$0.00</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-sm">Payouts</div>
                  <div className="text-xl font-semibold">$0.00</div>
                </div>
              </div>
            </div>
            {/* Improved Chart UI */}
            <div className="rounded-xl border border-border bg-gradient-to-b from-card/95 to-card/20 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-base">Payouts Overview</span>
                  <span className="ml-2 text-xs text-muted-foreground">(last 3 months)</span>
                </div>
                <div className="flex gap-2">
                  {(['desktop', 'mobile'] as const).map((key) => (
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
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-[150px]"
                        nameKey="views"
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });
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
                  Total {chartConfig[activeChart].label.toLowerCase()}: <span className="font-semibold text-foreground">{total[activeChart as 'desktop' | 'mobile'].toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground italic">Interactive chart</div>
              </div>
            </div>
          </div>
          {/* Right: Info Card */}
          <div className="w-full lg:w-96 h-full ">
            <div className="bg-gradient-to-b from-card/95 to-card/20 rounded-xl p-6 shadow flex flex-col gap-4 border border-border h-full justify-center">
              <div className="w-full flex justify-center mb-2">
                <UndrawMakeItRain
                  primaryColor="var(--primary)"
                  secondaryColor="var(--secondary)"
                  height="150px"
                  className="object-contain"
                />
                <SiStripe className="h-8 w-8 text-[#635BFF] mt-2" />
              </div>
              <div className="flex items-center gap-2 mb-1 justify-center">
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-semibold">Action Required</span>
              </div>
              <div className="font-bold text-lg mb-1 text-center">Connect your Stripe account</div>
              <div className="text-muted-foreground text-sm mb-3 text-center">
                In order to receive payouts from your bookings, you must connect your Stripe account. This enables secure and fast transfers directly to your bank.
              </div>
              <button className="bg-primary text-primary-foreground font-semibold rounded-lg px-5 py-2 mt-2 shadow hover:bg-primary/90 transition-colors mx-auto">
                Connect Stripe
              </button>
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
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border"><TrendingUp className="w-4 h-4 text-muted-foreground" />+12.5%</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">Trending up this month <TrendingUp className="w-4 h-4 text-muted-foreground" /></div>
            <div className="text-xs text-muted-foreground">Visitors for the last 6 months</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-b  from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Total Quotes</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">-20%</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{totalQuotes}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">Down 20% this period</div>
            <div className="text-xs text-muted-foreground">Quote volume needs attention</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-b  from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Active Bookings</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border"><TrendingUp className="w-4 h-4 text-muted-foreground" />+12.5%</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{confirmedQuotes}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">Strong user retention <TrendingUp className="w-4 h-4 text-muted-foreground" /></div>
            <div className="text-xs text-muted-foreground">Engagement exceeds targets</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-b  from-card/95 to-background/20 border border-border rounded-2xl shadow-sm pt-0 pb-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Conversion Rate</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border">+4.5%</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{conversionRate.toFixed(1)}%</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">Steady increase <TrendingUp className="w-4 h-4 text-muted-foreground" /></div>
            <div className="text-xs text-muted-foreground">Meets growth projections</div>
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

            <Card className="border border-border bg-gradient-to-b from-card/95 to-background/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Chart
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
                      <span>Monthly Goal Progress</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Customer Satisfaction</span>
                      <span>98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
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