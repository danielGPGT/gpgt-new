import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  MessageSquare, 
  FileText, 
  Plane, 
  Star, 
  User, 
  Building,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Info,
  Eye,
  Edit,
  TrendingUp,
  MapPin,
  CreditCard,
  Receipt,
  CalendarDays,
  Activity,
  BarChart3,
  Target,
  Zap,
  Crown,
  Award,
  Users,
  Globe,
  Heart,
  Sparkles,
  Plus
} from 'lucide-react';
import { Client } from '@/types/crm';
import { supabase } from '@/lib/supabase';

interface TimelineItem {
  id: string;
  type: 'interaction' | 'quote' | 'booking' | 'travel_history' | 'note';
  title: string;
  description: string;
  date: Date;
  status?: 'completed' | 'pending' | 'cancelled' | 'draft' | 'confirmed' | 'active' | 'inactive';
  amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
  icon: React.ReactNode;
  color: string;
  category: string;
}

interface ClientTimelineProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function for interaction icons
const getInteractionIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'phone':
      return <Phone className="h-4 w-4" />;
    case 'meeting':
      return <Calendar className="h-4 w-4" />;
    case 'quote_sent':
      return <FileText className="h-4 w-4" />;
    case 'quote_accepted':
      return <CheckCircle className="h-4 w-4" />;
    case 'quote_declined':
      return <AlertCircle className="h-4 w-4" />;
    case 'follow_up':
      return <MessageSquare className="h-4 w-4" />;
    case 'note':
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

export function ClientTimeline({ client, open, onOpenChange }: ClientTimelineProps) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (client && open) {
      loadTimelineData();
    }
  }, [client, open]);

  const loadTimelineData = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const items: TimelineItem[] = [];

      // Fetch client interactions
      const { data: interactions, error: interactionsError } = await supabase
        .from('client_interactions')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (interactionsError) {
        console.error('Error fetching interactions:', interactionsError);
      } else if (interactions) {
        interactions.forEach(interaction => {
          items.push({
            id: `interaction-${interaction.id}`,
            type: 'interaction',
            title: interaction.subject || interaction.interaction_type,
            description: interaction.content || `${interaction.interaction_type} interaction`,
            date: new Date(interaction.created_at),
            status: 'completed',
            icon: getInteractionIcon(interaction.interaction_type),
            color: 'var(--color-primary-500)',
            category: 'interaction',
            metadata: { 
              agent: 'Travel Agent', 
              type: interaction.interaction_type,
              outcome: interaction.outcome,
              nextAction: interaction.next_action
            }
          });
        });
      }

      // Fetch quotes
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('Error fetching quotes:', quotesError);
      } else if (quotes) {
        quotes.forEach(quote => {
          items.push({
            id: `quote-${quote.id}`,
            type: 'quote',
            title: `Quote #${quote.id.slice(0, 8)}`,
            description: `${quote.destination} - ${quote.client_name}`,
            date: new Date(quote.created_at),
            status: quote.status as any,
            amount: quote.total_price || 0,
            currency: quote.currency || 'GBP',
            icon: <FileText className="h-4 w-4" />,
            color: 'var(--color-secondary-600)',
            category: 'quote',
            metadata: { 
              agent: 'Travel Agent', 
              destination: quote.destination,
              startDate: quote.start_date,
              endDate: quote.end_date,
              travelers: quote.travelers
            }
          });
        });
      }

      // Fetch bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      } else if (bookings) {
        bookings.forEach(booking => {
          const bookingData = booking.booking_data || {};
          items.push({
            id: `booking-${booking.id}`,
            type: 'booking',
            title: `Booking #${booking.id.slice(0, 8)}`,
            description: `${booking.client_name} - ${bookingData.destination || 'Travel Package'}`,
            date: new Date(booking.created_at),
            status: booking.status as any,
            amount: booking.total_cost || 0,
            currency: booking.currency || 'GBP',
            icon: <Plane className="h-4 w-4" />,
            color: 'var(--color-chart-1)',
            category: 'booking',
            metadata: { 
              agent: 'Travel Agent', 
              supplierRef: booking.supplier_ref,
              bookingData: booking.booking_data
            }
          });
        });
      }

      // Fetch travel history
      const { data: travelHistory, error: travelError } = await supabase
        .from('client_travel_history')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (travelError) {
        console.error('Error fetching travel history:', travelError);
      } else if (travelHistory) {
        travelHistory.forEach(travel => {
          items.push({
            id: `travel-${travel.id}`,
            type: 'travel_history',
            title: `Trip to ${travel.destination}`,
            description: `${travel.trip_type || 'Travel'} - ${travel.start_date} to ${travel.end_date}`,
            date: new Date(travel.created_at),
            status: travel.status as any,
            amount: travel.total_spent || 0,
            currency: travel.currency || 'USD',
            icon: <Globe className="h-4 w-4" />,
            color: 'var(--color-chart-2)',
            category: 'travel_history',
            metadata: { 
              agent: 'Travel Agent', 
              destination: travel.destination,
              startDate: travel.start_date,
              endDate: travel.end_date,
              tripType: travel.trip_type,
              notes: travel.notes
            }
          });
        });
      }

      // Sort by date (newest first)
      items.sort((a, b) => b.date.getTime() - a.date.getTime());
      console.log('Loaded timeline data:', items);
      setTimelineItems(items);
    } catch (error) {
      console.error('Error loading timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
      case 'inactive':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
      case 'inactive':
        return <AlertCircle className="h-4 w-4" />;
      case 'draft':
        return <FileText className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const filteredItems = timelineItems.filter(item => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const stats = {
    total: timelineItems.length,
    interactions: timelineItems.filter(item => item.category === 'interaction').length,
    quotes: timelineItems.filter(item => item.category === 'quote').length,
    bookings: timelineItems.filter(item => item.category === 'booking').length,
    travel_history: timelineItems.filter(item => item.category === 'travel_history').length,
  };

  const totalRevenue = timelineItems
    .filter(item => item.amount && (item.status === 'confirmed' || item.status === 'completed'))
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const conversionRate = stats.quotes > 0 ? (stats.bookings / stats.quotes) * 100 : 0;

  console.log('Timeline items:', timelineItems);
  console.log('Filtered items:', filteredItems);
  console.log('Stats:', stats);

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[90vh] overflow-y-auto sm:!max-w-[95vw] lg:!max-w-[90vw] xl:!max-w-[85vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Client Activity Timeline</span>
            </div>
            <Badge variant="outline" className="ml-auto">
              {client.firstName} {client.lastName}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info Card - Professional Style */}
          <Card className="bg-gradient-to-b from-card/95 to-background/20 border border-border rounded-2xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-lg">
                  <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                    {client.firstName[0]}{client.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-foreground">
                      {client.firstName} {client.lastName}
                    </h3>
                    {client.status === 'vip' && (
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm">
                        <Crown className="h-3 w-3 mr-1" />
                        VIP Client
                      </Badge>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {client.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </div>
                    )}
                    {client.company && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {client.company}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Client since {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {stats.total} total activities
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                  <div className="text-3xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
                  <div className="text-xs text-muted-foreground mt-1">From confirmed bookings</div>
                </div>
              </div>
            </CardContent>
          </Card>

          

          {/* Timeline Tabs - Professional Style */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 p-1 rounded-xl bg-muted/40">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="interaction" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Interactions ({stats.interactions})
              </TabsTrigger>
              <TabsTrigger value="quote" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Quotes ({stats.quotes})
              </TabsTrigger>
              <TabsTrigger value="booking" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Bookings ({stats.bookings})
              </TabsTrigger>
              <TabsTrigger value="travel_history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Travel History ({stats.travel_history})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="border border-border">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-96" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <Card className="border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Activity className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Start building the client relationship by adding interactions, quotes, or notes. 
                      This timeline will show all client activity in chronological order.
                    </p>
                    <Button className="mt-4" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Activity
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredItems.map((item, index) => (
                    <div key={item.id} className="relative">
                      {/* Timeline Line */}
                      {index < filteredItems.length - 1 && (
                        <div 
                          className="absolute left-6 top-16 w-0.5 h-20 bg-gradient-to-b from-primary/30 to-transparent"
                          style={{ zIndex: 0 }}
                        />
                      )}
                      
                      {/* Timeline Item - Professional Style */}
                      <Card className="relative border-l-4 py-0 transition-all hover:shadow-lg hover:scale-[1.01]" style={{ borderLeftColor: item.color }}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div 
                              className="flex items-center justify-center w-12 h-12 rounded-xl border-2 border-background shadow-sm"
                              style={{ backgroundColor: item.color, color: 'white' }}
                            >
                              {item.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                  <h4 className="font-semibold text-foreground text-base">{item.title}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {item.status && (
                                    <Badge 
                                      variant={getStatusColor(item.status)}
                                      className="text-xs"
                                    >
                                      {getStatusIcon(item.status)}
                                      <span className="ml-1 capitalize">{item.status}</span>
                                    </Badge>
                                  )}
                                  {item.amount && (
                                    <Badge variant="secondary" className="text-xs">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      {formatCurrency(item.amount, item.currency)}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Metadata */}
                              {item.metadata && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 pt-3 border-t border-border/50">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {item.date.toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {getTimeAgo(item.date)}
                                  </div>
                                  {item.metadata.agent && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {item.metadata.agent}
                                    </div>
                                  )}
                                  {item.metadata.destination && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {item.metadata.destination}
                                    </div>
                                  )}
                                  {item.metadata.travelDates && (
                                    <div className="flex items-center gap-1">
                                      <CalendarDays className="h-3 w-3" />
                                      {item.metadata.travelDates}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 px-3">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 px-3">
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 