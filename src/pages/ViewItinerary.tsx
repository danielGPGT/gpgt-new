import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loadItinerary, type SavedItinerary } from '@/lib/itineraryService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, User, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PDFExportButton } from '@/components/PDFExportButton';

// Helper function to format date with day of the week
const formatDateWithDay = (dateString: string) => {
  const date = new Date(dateString);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return `${dayOfWeek}, ${formattedDate}`;
};

export default function ViewItinerary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<SavedItinerary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchItinerary(id);
  }, [id]);

  const fetchItinerary = async (itineraryId: string) => {
    setLoading(true);
    try {
      const data = await loadItinerary(itineraryId);
      setItinerary(data);
    } catch (error) {
      toast.error('Failed to load itinerary');
      navigate('/itineraries');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-[var(--muted-foreground)] mb-4">Itinerary not found.</p>
        <Button onClick={() => navigate('/itineraries')}>Back to Itineraries</Button>
      </div>
    );
  }

  const heroImage = itinerary.days?.[0]?.imageUrl || undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white/90 to-white/80 flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-3xl mx-auto rounded-2xl shadow-2xl overflow-hidden bg-white/80 backdrop-blur-2xl border-0">
        {/* Hero Image */}
        <div className="relative h-56 w-full bg-gray-100 flex items-center justify-center">
          {heroImage ? (
            <img 
              src={heroImage} 
              alt="Itinerary" 
              className="object-cover w-full h-full"
              onError={(e) => {
                // Hide the broken image and show fallback
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div className="flex flex-col items-center justify-center w-full h-full text-gray-300" style={{ display: heroImage ? 'none' : 'flex' }}>
            <MapPin className="h-10 w-10 mb-2" />
            <span className="text-xs">No Image</span>
          </div>
          <div className="absolute top-4 left-4">
            <Badge className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 text-white border-0 text-xs font-medium px-2 py-1 shadow-md">
              LUXURY
            </Badge>
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <PDFExportButton 
              itinerary={itinerary} 
              className="bg-white/80 hover:bg-gray-200 rounded-full p-2 shadow"
            />
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/80 hover:bg-gray-200 rounded-full p-1 shadow"
              onClick={() => navigate(-1)}
              title="Back"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{itinerary.title}</h1>
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <User className="h-4 w-4" /> {itinerary.client_name}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <MapPin className="h-4 w-4" /> {itinerary.destination}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Calendar className="h-4 w-4" /> {formatDateWithDay(itinerary.date_created)}
              </div>
            </div>
          </div>

          {/* Trip Summary */}
          {(itinerary.preferences as any)?.summary && (
            <div className="mb-8 bg-[var(--primary)]/5 p-4 rounded-lg border border-[var(--primary)]/20">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Trip Summary</h3>
              <p className="text-[var(--muted-foreground)] leading-relaxed">{(itinerary.preferences as any).summary}</p>
            </div>
          )}

          {/* Daily Schedule */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">Daily Schedule</h3>
            <div className="space-y-6">
              {itinerary.days?.map((day, index) => (
                <div key={index} className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-[var(--border)]/30">
                  <h4 className="text-md font-semibold text-[var(--foreground)] mb-2">
                    Day {index + 1} - {formatDateWithDay(day.date)}
                  </h4>
                  <ul className="space-y-2">
                    {day.activities?.map((activity, actIndex) => (
                      <li key={actIndex} className="flex gap-4 items-start">
                        <div className="bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 rounded-full text-xs font-medium min-w-[60px] text-center">
                          {activity.time}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-[var(--foreground)]">{activity.description}</span>
                          {activity.location && (
                            <span className="text-xs text-[var(--muted-foreground)] ml-2">📍 {activity.location}</span>
                          )}
                          {activity.notes && (
                            <span className="text-xs text-[var(--muted-foreground)] ml-2 italic">{activity.notes}</span>
                          )}
                          {activity.estimatedCost ? (
                            <span className="ml-2 text-xs text-[var(--primary)]">{activity.estimatedCost} ({activity.costType})</span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Trip Preferences */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">Trip Preferences</h3>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-[var(--border)]/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-[var(--foreground)]">Client:</span> {itinerary.client_name}
                </div>
                <div>
                  <span className="font-semibold text-[var(--foreground)]">Destination:</span> {itinerary.destination}
                </div>
                <div>
                  <span className="font-semibold text-[var(--foreground)]">Created:</span> {formatDateWithDay(itinerary.date_created)}
                </div>
                <div>
                  <span className="font-semibold text-[var(--foreground)]">Duration:</span> {itinerary.days?.length || 0} days
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 