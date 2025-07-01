import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  User, 
  Search, 
  Filter,
  Download,
  Share2,
  Plus,
  X,
  Sparkles,
  Globe,
  SortAsc,
  Target,
  RefreshCw,
  SlidersHorizontal,
  FilterX
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { PDFExportButton } from '@/components/PDFExportButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';

// Updated interface to match quote data structure
interface QuoteItinerary {
  id: string;
  title: string;
  client_name: string;
  destination: string;
  created_at: string;
  updated_at: string;
  generated_itinerary: {
    title: string;
    clientName: string;
    destination: string;
    days: any[];
    summary?: string;
  };
  status: 'draft' | 'confirmed' | 'cancelled';
  total_price: number;
  currency: string;
}

export function Itineraries() {
  const [itineraries, setItineraries] = useState<QuoteItinerary[]>([]);
  const [filteredItineraries, setFilteredItineraries] = useState<QuoteItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterDestination, setFilterDestination] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<QuoteItinerary | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchAllItineraries();
  }, []);

  useEffect(() => {
    filterAndSortItineraries();
  }, [itineraries, searchTerm, sortBy, filterDestination]);

  const fetchAllItineraries = async () => {
    setLoading(true);
    try {
      // Load all quotes from the database
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform quote data to match the expected format
      const transformedItineraries = (data || []).map(quote => ({
        id: quote.id,
        title: quote.generated_itinerary?.title || 'Untitled Itinerary',
        client_name: quote.client_name || quote.generated_itinerary?.clientName || 'Client',
        destination: quote.destination || quote.generated_itinerary?.destination || 'Destination',
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        generated_itinerary: quote.generated_itinerary,
        status: quote.status,
        total_price: quote.total_price,
        currency: quote.currency,
      }));

      setItineraries(transformedItineraries);
    } catch (error) {
      console.error('Failed to load itineraries:', error);
      toast.error('Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortItineraries = () => {
    let filtered = [...itineraries];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(itinerary =>
        itinerary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itinerary.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itinerary.destination.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Destination filter
    if (filterDestination !== 'all') {
      filtered = filtered.filter(itinerary =>
        itinerary.destination.toLowerCase() === filterDestination.toLowerCase()
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'client':
          return a.client_name.localeCompare(b.client_name);
        case 'destination':
          return a.destination.localeCompare(b.destination);
        default:
          return 0;
      }
    });

    setFilteredItineraries(filtered);
    setCurrentPage(1);
  };

  const handleDeleteItinerary = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;
    
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItineraries(itineraries.filter(it => it.id !== id));
      toast.success('Itinerary deleted successfully');
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
      toast.error('Failed to delete itinerary');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'GBP',
    }).format(amount);
  };

  const getUniqueDestinations = () => {
    const destinations = [...new Set(itineraries.map(it => it.destination))];
    return destinations.sort();
  };

  const paginatedItineraries = filteredItineraries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredItineraries.length / itemsPerPage);

  // Modal open handler
  const handleView = (itinerary: QuoteItinerary) => {
    setSelectedItinerary(itinerary);
    setViewModalOpen(true);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterDestination('all');
    setSortBy('date');
  };

  const hasActiveFilters = searchTerm || filterDestination !== 'all' || sortBy !== 'date';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">All Itineraries</h1>
          <p className="text-muted-foreground">
            {filteredItineraries.length} of {itineraries.length} itineraries
          </p>
        </div>
        <Link to="/new-proposal">
          <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 px-6 py-3 rounded-2xl shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </Link>
      </div>

      {/* Premium Filters Section */}
      <Card className="mb-8 border-0 bg-card backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/20 rounded-xl">
              <SlidersHorizontal className="h-5 w-5 text-[var(--primary)]" />
            </div>
            Advanced Filters
            {hasActiveFilters && (
              <Badge className="ml-2 bg-[var(--primary)] text-white border-0">
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </label>
              <Input
                placeholder="Search itineraries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/50 border-0 shadow-sm"
              />
            </div>

            {/* Destination Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Destination
              </label>
              <Select value={filterDestination} onValueChange={setFilterDestination}>
                <SelectTrigger className="bg-white/50 border-0 shadow-sm">
                  <SelectValue placeholder="All destinations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All destinations</SelectItem>
                  {getUniqueDestinations().map((destination) => (
                    <SelectItem key={destination} value={destination}>
                      {destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/50 border-0 shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="client">Client Name</SelectItem>
                  <SelectItem value="destination">Destination</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FilterX className="h-4 w-4" />
                Actions
              </label>
              <Button
                variant="outline"
                onClick={clearAllFilters}
                disabled={!hasActiveFilters}
                className="w-full bg-white/50 border-0 shadow-sm hover:bg-white/70"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itineraries Grid */}
      {filteredItineraries.length === 0 ? (
        <Card className="border-0 bg-card backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/20 rounded-full flex items-center justify-center mb-6">
              <Globe className="h-12 w-12 text-[var(--primary)]" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No itineraries found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {hasActiveFilters 
                ? "Try adjusting your filters to see more results."
                : "Create your first itinerary to get started with your travel planning journey."
              }
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearAllFilters} variant="outline">
                <FilterX className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            ) : (
              <Link to="/new-proposal">
                <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Itinerary
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedItineraries.map((itinerary) => (
            <Card
              key={itinerary.id}
              className="group pt-0 pb-0 border-0 bg-card backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-300 hover:scale-105 flex flex-col"
            >
              {/* Image Section */}
              <div className="relative h-48 overflow-hidden">
                {itinerary.generated_itinerary?.days?.[0]?.imageUrl ? (
                  <img
                    src={itinerary.generated_itinerary.days[0].imageUrl}
                    alt={itinerary.destination}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/20 flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-[var(--primary)]/50" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <Badge 
                    className={`${
                      itinerary.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : itinerary.status === 'cancelled'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    } border-0 shadow-sm`}
                  >
                    {itinerary.status}
                  </Badge>
                </div>

                {/* Price Badge */}
                {itinerary.total_price && (
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-primary text-primary-foreground border-0 shadow-sm font-semibold">
                      {formatCurrency(itinerary.total_price, itinerary.currency)}
                    </Badge>
                  </div>
                )}

                {/* Action Buttons Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleView(itinerary)}
                    className="bg-white/90 text-gray-900 hover:bg-white border-0 shadow-sm"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/edit-itinerary/${itinerary.id}`, { 
                      state: { 
                        fromQuote: true,
                        quoteData: itinerary,
                        itineraryData: itinerary.generated_itinerary
                      }
                    })}
                    className="bg-white/90 text-gray-900 hover:bg-white border-0 shadow-sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteItinerary(itinerary.id)}
                    className="bg-destructive hover:bg-destructive/90 border-0 shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content Section */}
              <CardContent className="p-6 pt-0 flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                    {itinerary.title}
                  </h3>

                  {/* Client & Destination */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="truncate">{itinerary.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{itinerary.destination}</span>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{itinerary.generated_itinerary?.days?.length || 0} days</span>
                    </div>
                    <span>{formatDate(itinerary.created_at)}</span>
                  </div>
                </div>

                {/* Action Buttons - Always at bottom */}
                <div className="flex gap-2 pt-4 mt-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(itinerary)}
                    className="flex-1 bg-white/50 border-0 shadow-sm hover:bg-white/70"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/edit-itinerary/${itinerary.id}`, { 
                      state: { 
                        fromQuote: true,
                        quoteData: itinerary,
                        itineraryData: itinerary.generated_itinerary
                      }
                    })}
                    className="flex-1 bg-white/50 border-0 shadow-sm hover:bg-white/70"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="bg-white/50 border-0 shadow-sm"
            >
              Previous
            </Button>
            <div className="flex items-center gap-2 px-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="bg-white/50 border-0 shadow-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedItinerary?.title}
            </DialogTitle>
            <DialogDescription>
              View itinerary details and manage your trip
            </DialogDescription>
          </DialogHeader>
          
          {selectedItinerary && (
            <div className="space-y-6">
              {/* Trip Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {selectedItinerary.generated_itinerary?.days?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {selectedItinerary.destination}
                  </div>
                  <div className="text-sm text-muted-foreground">Destination</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {selectedItinerary.client_name}
                  </div>
                  <div className="text-sm text-muted-foreground">Client</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)]">
                    {formatCurrency(selectedItinerary.total_price, selectedItinerary.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                </div>
              </div>

              {/* Itinerary Days */}
              {selectedItinerary.generated_itinerary?.days && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Daily Itinerary</h3>
                  {selectedItinerary.generated_itinerary.days.map((day, index) => (
                    <Card key={index} className="border-0 bg-muted/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Day {index + 1} - {formatDate(day.date)}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {day.activities?.map((activity: any, activityIndex: number) => (
                            <div key={activityIndex} className="flex items-start gap-3 p-2 bg-white/50 rounded">
                              <div className="text-sm font-medium text-[var(--primary)] min-w-[60px]">
                                {activity.time}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{activity.description}</div>
                                {activity.location && (
                                  <div className="text-sm text-muted-foreground">
                                    📍 {activity.location}
                                  </div>
                                )}
                                {activity.notes && (
                                  <div className="text-sm text-muted-foreground">
                                    💡 {activity.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <PDFExportButton 
                  itinerary={{
                    id: selectedItinerary.id,
                    title: selectedItinerary.title,
                    client_name: selectedItinerary.client_name,
                    destination: selectedItinerary.destination,
                    generated_by: user?.id || '',
                    date_created: selectedItinerary.created_at,
                    days: selectedItinerary.generated_itinerary?.days || [],
                    preferences: {
                      travelerInfo: {
                        name: selectedItinerary.client_name,
                        email: '',
                        phone: '',
                        address: {
                          street: '',
                          city: '',
                          state: '',
                          zipCode: '',
                          country: '',
                        },
                        travelType: 'solo',
                        transportType: 'plane',
                        startDate: '',
                        endDate: '',
                        travelers: { adults: 1, children: 0 },
                      },
                      destinations: {
                        from: '',
                        primary: selectedItinerary.destination,
                        additional: [],
                        duration: 0,
                      },
                      style: {
                        tone: 'luxury',
                        interests: [],
                      },
                      experience: {
                        pace: 'balanced',
                        accommodation: 'boutique',
                        specialRequests: '',
                      },
                      budget: {
                        amount: selectedItinerary.total_price || 0,
                        currency: selectedItinerary.currency || 'GBP',
                        experienceType: 'exclusive',
                        travelClass: 'business',
                      },
                      eventRequests: '',
                      eventTypes: [],
                      includeInventory: { flights: false, hotels: false, events: false },
                      flightFilters: undefined,
                      hotelFilters: undefined,
                      eventFilters: undefined,
                      agentContext: undefined,
                    },
                    created_at: selectedItinerary.created_at,
                    updated_at: selectedItinerary.updated_at,
                  }}
                />
                <Button
                  onClick={() => navigate(`/edit-itinerary/${selectedItinerary.id}`, { 
                    state: { 
                      fromQuote: true,
                      quoteData: selectedItinerary,
                      itineraryData: selectedItinerary.generated_itinerary
                    }
                  })}
                  className="bg-[var(--primary)] hover:bg-[var(--primary)]/90"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Itinerary
                </Button>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 