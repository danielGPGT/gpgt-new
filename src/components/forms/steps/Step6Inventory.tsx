import { useFormContext, Controller } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Step6Inventory({ onBack }: { onBack: () => void }) {
  const form = useFormContext();
  const includeInventory = form.watch('includeInventory') || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <label className="font-medium mb-2">Include real-time inventory options:</label>
        <Controller
          name="includeInventory.flights"
          control={form.control}
          render={({ field }) => (
            <label className="flex items-center gap-2">
              <Checkbox checked={!!field.value} onCheckedChange={checked => field.onChange(!!checked)} />
              Flights
            </label>
          )}
        />
        <Controller
          name="includeInventory.hotels"
          control={form.control}
          render={({ field }) => (
            <label className="flex items-center gap-2">
              <Checkbox checked={!!field.value} onCheckedChange={checked => field.onChange(!!checked)} />
              Hotels
            </label>
          )}
        />
        <Controller
          name="includeInventory.events"
          control={form.control}
          render={({ field }) => (
            <label className="flex items-center gap-2">
              <Checkbox checked={!!field.value} onCheckedChange={checked => field.onChange(!!checked)} />
              Events
            </label>
          )}
        />
      </div>

      {/* Flight Filters */}
      {includeInventory.flights && (
        <div className="pl-6 space-y-2 border-l border-muted">
          <div className="font-semibold">Flight Filters</div>
          <Controller
            name="flightFilters.preferredAirlines"
            control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="Preferred Airlines (comma separated)" onChange={e => field.onChange(e.target.value.split(',').map((s: string) => s.trim()))} />
            )}
          />
          <Controller
            name="flightFilters.nonstopOnly"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-center gap-2">
                <Checkbox checked={!!field.value} onCheckedChange={checked => field.onChange(!!checked)} />
                Nonstop Only
              </label>
            )}
          />
          <Controller
            name="flightFilters.departureTimeRange"
            control={form.control}
            render={({ field }) => (
              <div className="flex gap-2 items-center">
                <Input type="time" value={field.value?.[0] || ''} onChange={e => field.onChange([e.target.value, field.value?.[1] || ''])} />
                <span>-</span>
                <Input type="time" value={field.value?.[1] || ''} onChange={e => field.onChange([field.value?.[0] || '', e.target.value])} />
              </div>
            )}
          />
        </div>
      )}

      {/* Hotel Filters */}
      {includeInventory.hotels && (
        <div className="pl-6 space-y-2 border-l border-muted">
          <div className="font-semibold">Hotel Filters</div>
          <Controller
            name="hotelFilters.minStarRating"
            control={form.control}
            render={({ field }) => (
              <Input type="number" min={1} max={5} {...field} placeholder="Min Star Rating (1-5)" />
            )}
          />
          <Controller
            name="hotelFilters.roomType"
            control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="Room Type (e.g. Suite, Deluxe)" />
            )}
          />
          <Controller
            name="hotelFilters.amenities"
            control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="Amenities (comma separated)" onChange={e => field.onChange(e.target.value.split(',').map((s: string) => s.trim()))} />
            )}
          />
        </div>
      )}

      {/* Event Filters */}
      {includeInventory.events && (
        <div className="pl-6 space-y-2 border-l border-muted">
          <div className="font-semibold">Event Filters</div>
          <Controller
            name="eventFilters.types"
            control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="Event Types (comma separated)" onChange={e => field.onChange(e.target.value.split(',').map((s: string) => s.trim()))} />
            )}
          />
          <Controller
            name="eventFilters.regions"
            control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="Regions (comma separated)" onChange={e => field.onChange(e.target.value.split(',').map((s: string) => s.trim()))} />
            )}
          />
        </div>
      )}

      {/* Agent Context */}
      <div className="pt-4">
        <div className="font-semibold mb-2">Agent Context (optional)</div>
        <Controller
          name="agentContext.agentId"
          control={form.control}
          render={({ field }) => (
            <Input {...field} placeholder="Agent ID" />
          )}
        />
        <Controller
          name="agentContext.marginOverride"
          control={form.control}
          render={({ field }) => (
            <Input type="number" step="0.01" min={0} max={1} {...field} placeholder="Margin Override (e.g. 0.15)" />
          )}
        />
      </div>
    </div>
  );
} 