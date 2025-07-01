import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuoteService, type QuoteResponse } from '@/lib/quoteService';
import { BookingService, type BookingStats } from '@/lib/bookingService';
import { DollarSign, FileText, CheckCircle, TrendingUp } from 'lucide-react';

export default function Analytics() {
  const [quotes, setQuotes] = useState<QuoteResponse[]>([]);
  const [conversionData, setConversionData] = useState<{ date: string; conversion: number; totalQuotes: number }[]>([]);
  const [timeRange, setTimeRange] = useState('90d');
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);

  useEffect(() => {
    async function fetchData() {
      const userQuotes = await QuoteService.getQuotes();
      setQuotes(userQuotes);
      // Example: build conversion rate data by day
      const byDay: Record<string, { date: string; total: number; confirmed: number }> = {};
      userQuotes.forEach(q => {
        const day = q.createdAt.slice(0, 10);
        if (!byDay[day]) byDay[day] = { date: day, total: 0, confirmed: 0 };
        byDay[day].total++;
        if (q.status === 'confirmed') byDay[day].confirmed++;
      });
      const arr: { date: string; total: number; confirmed: number }[] = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
      setConversionData(arr.map((d) => ({
        date: d.date,
        conversion: d.total > 0 ? (d.confirmed / d.total) * 100 : 0,
        totalQuotes: d.total,
      })));
      // Fetch booking stats
      const stats = await BookingService.getBookingStats();
      setBookingStats(stats);
    }
    fetchData();
  }, []);

  // Filter data by time range
  const filteredData = conversionData.filter(item => {
    const date = new Date(item.date);
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === '30d') daysToSubtract = 30;
    else if (timeRange === '7d') daysToSubtract = 7;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  const chartConfig = {
    conversion: {
      label: 'Conversion Rate',
      color: 'var(--primary)',
    },
    totalQuotes: {
      label: 'Total Quotes',
      color: 'var(--secondary)',
    },
  };

  // Dashboard metrics
  const totalQuotes = quotes.length;
  const confirmedQuotes = quotes.filter(q => q.status === 'confirmed').length;
  const totalRevenue = quotes.filter(q => q.status === 'confirmed').reduce((sum, q) => sum + q.totalPrice, 0);
  const conversionRate = totalQuotes > 0 ? (confirmedQuotes / totalQuotes) * 100 : 0;
  const activeBookings = bookingStats?.confirmedBookings || 0;

  // Currency formatting
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="px-8 mx-auto pb-8 space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-b from-card/95 to-background/10 border border-border rounded-2xl shadow-sm">
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
        <Card className="bg-gradient-to-b  from-card/95 to-background/10 border border-border rounded-2xl shadow-sm">
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
        <Card className="bg-gradient-to-b  from-card/95 to-background/10 border border-border rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Active Bookings</span>
              <span className="flex items-center gap-1 text-xs font-semibold bg-muted px-2 py-0.5 rounded-full border border-border"><TrendingUp className="w-4 h-4 text-muted-foreground" />+12.5%</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-4">{activeBookings}</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">Strong user retention <TrendingUp className="w-4 h-4 text-muted-foreground" /></div>
            <div className="text-xs text-muted-foreground">Engagement exceeds targets</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-b  from-card/95 to-background/10 border border-border rounded-2xl shadow-sm">
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
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Conversion Rate</CardTitle>
            <CardDescription>Quote to booking conversion rate over time</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex" aria-label="Select a value">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={filteredData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={value => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={value => {
                      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                    indicator="dot"
                    formatter={(_value, name, item) => {
                      if (name === 'conversion' && typeof item.value === 'number') {
                        return <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', marginRight: 6, verticalAlign: 'middle' }} />Conversion Rate: <b>{item.value.toFixed(1)}%</b></span>;
                      }
                      if (name === 'totalQuotes') {
                        return <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--secondary)', marginRight: 6, verticalAlign: 'middle' }} />Total Quotes: <b>{item.value}</b></span>;
                      }
                      return null;
                    }}
                  />
                }
              />
              <Area
                dataKey="conversion"
                type="natural"
                fill="var(--primary)"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                yAxisId={0}
              />
              <Area
                dataKey="totalQuotes"
                type="natural"
                fill="var(--secondary)"
                stroke="var(--secondary)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                yAxisId={1}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      {/* Placeholder for more analytics/charts */}
      <Card>
        <CardHeader>
          <CardTitle>More Analytics Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We will add more charts and business insights here.</p>
        </CardContent>
      </Card>
    </div>
  );
} 