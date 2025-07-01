import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Package, Ticket, Hotel, Car, Plane, Coffee } from 'lucide-react';
import { InventorySummary } from '@/types/inventory';
import { InventoryService } from '@/lib/inventoryService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// Import inventory components (we'll create these next)
import { TicketsManager } from '@/components/inventory/TicketsManager';
import { HotelRoomsTable } from '@/components/inventory/HotelRoomsTable';
import { CircuitTransfersTable } from '@/components/inventory/CircuitTransfersTable';
import { AirportTransfersTable } from '@/components/inventory/AirportTransfersTable';
import { FlightsTable } from '@/components/inventory/FlightsTable';
import { LoungePassesTable } from '@/components/inventory/LoungePassesTable';
import { SportsEventsManager } from '@/components/inventory/SportsEventsManager';
import { VenuesManager } from '@/components/inventory/VenuesManager';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('overview');

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
    <div className="mx-auto py-6 space-y-6 px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage tickets, hotels, transfers, flights, and packages
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="sports-events">Sports & Events</TabsTrigger>
          <TabsTrigger value="venues">Venues & Ticket Categories</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="hotels">
            <Hotel className="h-4 w-4 mr-2" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="circuit-transfers">
            <Car className="h-4 w-4 mr-2" />
            Circuit
          </TabsTrigger>
          <TabsTrigger value="airport-transfers">
            <Car className="h-4 w-4 mr-2" />
            Airport
          </TabsTrigger>
          <TabsTrigger value="flights">
            <Plane className="h-4 w-4 mr-2" />
            Flights
          </TabsTrigger>
          <TabsTrigger value="lounge-passes">
            <Coffee className="h-4 w-4 mr-2" />
            Lounges
          </TabsTrigger>
          <TabsTrigger value="packages">
            <Package className="h-4 w-4 mr-2" />
            Packages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sports-events">
          <SportsEventsManager />
        </TabsContent>

        <TabsContent value="venues">
          <VenuesManager />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Tickets
                </CardTitle>
                <CardDescription>
                  Event tickets and passes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab('tickets')}>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Hotel Rooms
                </CardTitle>
                <CardDescription>
                  Accommodation inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab('hotels')}>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Transfers
                </CardTitle>
                <CardDescription>
                  Ground transportation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab('circuit-transfers')}>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Flights
                </CardTitle>
                <CardDescription>
                  Air travel options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab('flights')}>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Lounge Passes
                </CardTitle>
                <CardDescription>
                  Airport lounge access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab('lounge-passes')}>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Packages
                </CardTitle>
                <CardDescription>
                  Pre-built travel packages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab('packages')}>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsManager />
        </TabsContent>

        <TabsContent value="hotels">
          <HotelRoomsTable />
        </TabsContent>

        <TabsContent value="circuit-transfers">
          <CircuitTransfersTable />
        </TabsContent>

        <TabsContent value="airport-transfers">
          <AirportTransfersTable />
        </TabsContent>

        <TabsContent value="flights">
          <FlightsTable />
        </TabsContent>

        <TabsContent value="lounge-passes">
          <LoungePassesTable />
        </TabsContent>

      </Tabs>
    </div>
  );
} 