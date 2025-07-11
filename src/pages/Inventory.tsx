import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Ticket, Hotel, Car, Plane, Coffee } from 'lucide-react';
import { InventorySummary } from '@/types/inventory';
import { InventoryService } from '@/lib/inventoryService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

// Import inventory components (we'll create these next)
import { TicketsManager } from '@/components/inventory/TicketsManager';
import HotelManager from '@/components/inventory/HotelManager';

import { AirportTransfersTable } from '@/components/inventory/AirportTransfersTable';
import FlightsManager from '@/components/inventory/FlightsManager';
import { LoungePassesManager } from '@/components/inventory/LoungePassesManager';
import { SportsEventsManager } from '@/components/inventory/SportsEventsManager';
import { VenuesManager } from '@/components/inventory/VenuesManager';
import AirportTransfersManager from '@/components/inventory/AirportTransfersManager';
import CircuitTransfersManager from '@/components/inventory/CircuitTransfersManager';

const tabOptions = [
  { value: 'tickets', label: 'Tickets' },
  { value: 'hotel-rooms', label: 'Hotels' },
  { value: 'circuit-transfers', label: 'Circuit Transfers' },
  { value: 'airport-transfers', label: 'Airport Transfers' },
  { value: 'flights', label: 'Flights' },
  { value: 'lounge-passes', label: 'Lounge Passes' },
  { value: 'sports-events', label: 'Sports Events' },
  { value: 'venues', label: 'Venues' },
  // Add more as needed
];

export default function InventoryPage() {
  const [tab, setTab] = useState(tabOptions[0].value);

  // Fetch inventory summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => InventoryService.getInventorySummary(),
  });

  const summaryData: InventorySummary = summary || {
    total_items: 0,
    available_items: 0,
    low_stock_items: 0,
    provisional_items: 0,
    out_of_stock_items: 0,
    total_value: 0,
    currency: 'EUR'
  };

  const handleRefresh = () => {
    toast.success('Inventory refreshed');
  };

  return (
    <div className="mx-auto py-4 px-8">
      <h1 className="text-2xl font-bold flex-1">Inventory</h1>
      <div className="mb-2 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
      <p className="text-muted-foreground">
        Manage Inventory and Pricing for all events
      </p>
        <Select value={tab} onValueChange={setTab}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {tab === 'tickets' && <TicketsManager />}
        {tab === 'hotel-rooms' && <HotelManager />}
        {tab === 'circuit-transfers' && <CircuitTransfersManager />}
        {tab === 'airport-transfers' && <AirportTransfersManager />}
        {tab === 'flights' && <FlightsManager />}
        {tab === 'lounge-passes' && <LoungePassesManager />}
        {tab === 'sports-events' && <SportsEventsManager />}
        {tab === 'venues' && <VenuesManager />}
        {/* Add more tab content as needed */}
      </div>
    </div>
  );
} 