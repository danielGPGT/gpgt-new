import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar,
  Tag,
  Users,
  Plane,
  DollarSign,
  FileText,
  Clock,
  Star,
  Briefcase,
  User,
  Globe,
  CreditCard,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CRMService } from '@/lib/crmService';
import { QuoteService } from '@/lib/quoteService';
import type { Client, ClientInteraction, ClientTravelHistory } from '@/types/crm';
import type { QuoteResponse } from '@/lib/quoteService';
import { ClientIntegrationStatus } from '@/components/crm/ClientIntegrationStatus';
import { supabase } from '@/lib/supabase';

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [travelHistory, setTravelHistory] = useState<ClientTravelHistory[]>([]);
  const [quotes, setQuotes] = useState<QuoteResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadClientData();
      loadTeamId();
    }
  }, [clientId]);

  const loadClientData = async () => {
    if (!clientId) return;
    
    try {
      setIsLoading(true);
      const [clientData, interactionsData, travelHistoryData, quotesData] = await Promise.all([
        CRMService.getClientById(clientId),
        CRMService.getClientInteractions(clientId),
        CRMService.getClientTravelHistory(clientId),
        QuoteService.getQuotes() // We'll filter for this client
      ]);

      setClient(clientData);
      setInteractions(interactionsData);
      setTravelHistory(travelHistoryData);
      
      // Filter quotes for this client
      const clientQuotes = quotesData.filter(quote => 
        quote.clientName === `${clientData.firstName} ${clientData.lastName}` ||
        quote.clientEmail === clientData.email
      );
      setQuotes(clientQuotes);
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      setTeamId(teamMember?.team_id || null);
    } catch (error) {
      console.error('Failed to load team ID:', error);
    }
  };

  const handleDeleteClient = async () => {
    if (!client || !window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      await CRMService.deleteClient(client.id);
      navigate('/crm');
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'quote_sent':
        return <FileText className="h-4 w-4" />;
      case 'quote_accepted':
        return <Star className="h-4 w-4" />;
      case 'quote_declined':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="mx-auto px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Client not found</h2>
          <p className="text-muted-foreground mb-6">The client you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/crm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CRM
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-8 py-0 space-y-8">
      {/* Header */}
      <div className="flex flex-col pt-4 lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/crm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CRM
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {getInitials(client.firstName, client.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {client.firstName} {client.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
                {client.source && (
                  <Badge variant="outline">
                    {client.source.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to={`/new-proposal?clientId=${client.id}`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Quote
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/crm/client/${client.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Client
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDeleteClient}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="travel">Travel History</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                    )}
                    
                    {client.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {client.company && (
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Company</p>
                          <p className="text-sm text-muted-foreground">{client.company}</p>
                        </div>
                      </div>
                    )}
                    
                    {client.jobTitle && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Job Title</p>
                          <p className="text-sm text-muted-foreground">{client.jobTitle}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {client.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{client.address.street}</p>
                          <p>{client.address.city}, {client.address.state} {client.address.zipCode}</p>
                          <p>{client.address.country}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {client.preferences && (
                <Card>
                  <CardHeader>
                    <CardTitle>Travel Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {client.preferences.travelStyle && (
                      <div className="flex items-center gap-3">
                        <Plane className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Travel Style</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {client.preferences.travelStyle}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {client.preferences.dietaryRestrictions && client.preferences.dietaryRestrictions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Dietary Restrictions</p>
                        <div className="flex gap-1 flex-wrap">
                          {client.preferences.dietaryRestrictions.map((restriction, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {restriction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {client.preferences.specialRequests && (
                      <div>
                        <p className="text-sm font-medium mb-2">Special Requests</p>
                        <p className="text-sm text-muted-foreground">{client.preferences.specialRequests}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {client.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Quotes</span>
                    <span className="font-semibold">{quotes.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Interactions</span>
                    <span className="font-semibold">{interactions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trips</span>
                    <span className="font-semibold">{travelHistory.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Contact</span>
                    <span className="font-semibold">
                      {client.lastContactAt ? formatDate(client.lastContactAt) : 'Never'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Integration Status */}
              {teamId && clientId && (
                <ClientIntegrationStatus clientId={clientId} teamId={teamId} />
              )}

              {client.budgetPreference && (
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Preference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Range</span>
                        <span className="font-semibold">
                          {formatCurrency(client.budgetPreference.min)} - {formatCurrency(client.budgetPreference.max)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Currency</span>
                        <span className="font-semibold">{client.budgetPreference.currency}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {client.tags && client.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 flex-wrap">
                      {client.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Client Interactions</h2>
            <Button asChild>
              <Link to={`/crm/client/${client.id}/interaction/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Interaction
              </Link>
            </Button>
          </div>

          {interactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No interactions yet</h3>
                <p className="text-muted-foreground mb-4">Start tracking your communications with this client.</p>
                <Button asChild>
                  <Link to={`/crm/client/${client.id}/interaction/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Interaction
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {interactions.map((interaction) => (
                <Card key={interaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {getInteractionIcon(interaction.interactionType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium capitalize">
                              {interaction.interactionType.replace('_', ' ')}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {formatDate(interaction.createdAt)}
                            </Badge>
                          </div>
                          {interaction.subject && (
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              {interaction.subject}
                            </p>
                          )}
                          {interaction.content && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {interaction.content}
                            </p>
                          )}
                          {interaction.outcome && (
                            <div className="text-sm">
                              <span className="font-medium">Outcome: </span>
                              <span className="text-muted-foreground">{interaction.outcome}</span>
                            </div>
                          )}
                          {interaction.nextAction && (
                            <div className="text-sm mt-1">
                              <span className="font-medium">Next Action: </span>
                              <span className="text-muted-foreground">{interaction.nextAction}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="travel" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Travel History</h2>
            <Button asChild>
              <Link to={`/crm/client/${client.id}/travel/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Trip
              </Link>
            </Button>
          </div>

          {travelHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No travel history</h3>
                <p className="text-muted-foreground mb-4">Track this client's travel experiences.</p>
                <Button asChild>
                  <Link to={`/crm/client/${client.id}/travel/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Trip
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {travelHistory.map((trip) => (
                <Card key={trip.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold mb-1">{trip.destination}</h4>
                        <Badge variant="outline" className="text-xs">
                          {trip.tripType || 'Trip'}
                        </Badge>
                      </div>
                      <Badge className={trip.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {trip.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {trip.startDate && trip.endDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                          </span>
                        </div>
                      )}
                      
                      {trip.totalSpent && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {formatCurrency(trip.totalSpent, trip.currency)}
                          </span>
                        </div>
                      )}
                      
                      {trip.notes && (
                        <p className="text-muted-foreground text-xs">{trip.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quotes" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Quotes & Proposals</h2>
            <Button asChild>
              <Link to={`/new-proposal?clientId=${client.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Quote
              </Link>
            </Button>
          </div>

          {quotes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No quotes yet</h3>
                <p className="text-muted-foreground mb-4">Create your first quote for this client.</p>
                <Button asChild>
                  <Link to={`/new-proposal?clientId=${client.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Quote
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quotes.map((quote) => (
                <Card key={quote.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold mb-1">{quote.destination || 'Trip'}</h4>
                        <Badge variant="outline" className="text-xs">
                          {quote.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Value</span>
                        <span className="font-semibold">
                          {formatCurrency(quote.totalPrice, quote.currency)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {quote.startDate && quote.endDate 
                            ? `${formatDate(quote.startDate)} - ${formatDate(quote.endDate)}`
                            : formatDate(quote.createdAt)
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link to={`/quote/${quote.id}`}>
                          View Quote
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 