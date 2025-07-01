import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { gemini } from '@/lib/gemini';
import type { GeneratedItinerary, TripPreferences } from '@/lib/gemini';

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

const samplePreferences: TripPreferences = {
  clientName: 'John Smith',
  destination: 'Paris, France',
  startDate: '2024-06-01',
  endDate: '2024-06-07',
  numberOfTravelers: 2,
  budget: {
    min: 15000,
    max: 25000,
    currency: 'USD',
  },
  preferences: {
    tone: 'luxury',
    pace: 'moderate',
    interests: ['fine dining', 'art', 'shopping'],
    accommodationType: ['luxury hotel'],
    diningPreferences: ['fine dining', 'local cuisine'],
  },
  specialRequests: 'Private tour of the Louvre',
};

export function ItineraryTest() {
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await gemini.generateItinerary(samplePreferences);
      setItinerary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Test Gemini Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Test Itinerary'}
          </Button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
              Error: {error}
            </div>
          )}

          {itinerary && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">{itinerary.title}</h3>
              <p className="text-sm text-gray-600">{itinerary.summary}</p>
              <div className="mt-4">
                <h4 className="font-medium">Daily Schedule:</h4>
                {itinerary.days.map((day, index) => (
                  <div key={index} className="mt-2 p-2 bg-gray-50 rounded">
                    <p className="font-medium">Day {index + 1} - {formatDateWithDay(day.date)}</p>
                    {day.activities.map((activity, actIndex) => (
                      <div key={actIndex} className="ml-4 mt-1">
                        <p><strong>{activity.time}</strong> - {activity.description}</p>
                        {activity.location && <p className="text-sm text-gray-600">Location: {activity.location}</p>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 