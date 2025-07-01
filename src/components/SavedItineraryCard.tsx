import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SavedItinerary } from '@/lib/itineraryService';

interface SavedItineraryCardProps {
  itinerary: SavedItinerary;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export function SavedItineraryCard({ itinerary, onEdit, onDelete, onExport }: SavedItineraryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{itinerary.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Created {new Date(itinerary.created_at).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Client:</strong> {itinerary.client_name}</p>
          <p><strong>Destination:</strong> {itinerary.destination}</p>
          <p><strong>Duration:</strong> {itinerary.days.length} days</p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="outline" onClick={onExport}>
          Export PDF
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
} 