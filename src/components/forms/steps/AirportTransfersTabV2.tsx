import React, { useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Car, Users, Tag, Calendar, ArrowRightLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AirportTransfer {
  id: string;
  hotel_id: string;
  transport_type: string;
  supplier?: string;
  max_capacity: number;
  price_per_car_gbp_markup: number;
  transferDirection?: 'outbound' | 'return' | 'both';
  gpgt_hotels?: { id: string; name: string };
}
interface Hotel {
  id: string;
  name: string;
}
interface AirportTransfersTabV2Props {
  allHotels: Hotel[];
  airportTransfers: AirportTransfer[];
  selectedHotelId: string | null;
  adults: number;
  value: { id: string; quantity: number; transferDirection?: 'outbound' | 'return' | 'both' } | null;
  onChange: (val: { id: string; quantity: number; transferDirection?: 'outbound' | 'return' | 'both' } | null) => void;
  noAirportTransfer?: boolean;
}

const AirportTransfersTabV2: React.FC<AirportTransfersTabV2Props> = ({
  allHotels,
  airportTransfers,
  selectedHotelId,
  adults,
  value,
  onChange,
  noAirportTransfer,
}) => {
  const hotelTransfers = useMemo(
    () => airportTransfers.filter((t) => t.hotel_id === selectedHotelId),
    [airportTransfers, selectedHotelId]
  );
  const selectedTransfer = value
    ? airportTransfers.find((t) => t.id === value.id)
    : null;
  const hotelName =
    selectedTransfer?.gpgt_hotels?.name ||
    (selectedHotelId
      ? allHotels.find((h) => String(h.id) === String(selectedHotelId))?.name
      : null) ||
    "Unknown Hotel";

  // Auto-adjust transfer if hotel changes
  useEffect(() => {
    if (noAirportTransfer) return;
    if (!selectedHotelId) {
      onChange(null);
      return;
    }
    // If 'No Airport Transfer' is selected, do nothing
    if (value === null) return;
    // If current transfer doesn't match hotel, auto-select appropriate transfer
    if (!value || (selectedTransfer && selectedTransfer.hotel_id !== selectedHotelId)) {
      if (hotelTransfers.length > 0) {
        let toSelect = null;
        // Try to find a transfer with the same transfer_type as the previous selection
        if (selectedTransfer) {
          const sameType = hotelTransfers.find(t => t.transport_type === selectedTransfer.transport_type);
          if (sameType) {
            toSelect = sameType;
          }
        }
        // If not found, select the cheapest per-car transfer
        if (!toSelect) {
          toSelect = hotelTransfers.reduce((min, t) =>
            t.price_per_car_gbp_markup < min.price_per_car_gbp_markup ? t : min,
            hotelTransfers[0]
          );
        }
        onChange({ id: toSelect.id, quantity: adults, transferDirection: toSelect.transferDirection || 'both' });
      } else {
        onChange(null);
      }
    }
  }, [selectedHotelId, noAirportTransfer]);

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">
        Select Airport Transfer
      </h3>

      <div className="space-y-4">
        {/* No Airport Transfer Card */}
        <Card
          className={`cursor-pointer py-0 border-2 ${!value ? 'border-[var(--color-primary)] bg-primary/5' : 'border-[var(--color-border)]'} transition-all hover:shadow-md`}
          tabIndex={0}
          onClick={() => onChange(null)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onChange(null); }}
          aria-selected={!value}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <Car className="h-6 w-6 text-[var(--color-muted-foreground)]" />
            <div className="flex-1">
              <div className="font-semibold text-lg text-[var(--color-foreground)]">No Airport Transfer</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Do not include an airport transfer in this package</div>
            </div>
            {!value && <Badge variant="secondary">Selected</Badge>}
          </CardContent>
        </Card>
        {/* Dropdown for airport transfer selection */}
        {hotelTransfers.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg text-[var(--color-foreground)] mb-1">Choose an Airport Transfer</div>
                <Select
                  value={value ? value.id : ''}
                  onValueChange={id => {
                    const transfer = hotelTransfers.find(t => t.id === id);
                    if (transfer) onChange({ id, quantity: adults, transferDirection: transfer.transferDirection || 'both' });
                  }}
                >
                  <SelectTrigger className="w-full max-w-xl">
                    <SelectValue placeholder="Select airport transfer" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotelTransfers.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex flex-row items-center gap-4 w-full">
                          <span className="font-semibold mr-2 min-w-[120px]">{t.transport_type ? t.transport_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown Type'}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mr-4">
                            <Tag className="h-4 w-4" />{t.supplier || 'Standard'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mr-4">
                            <Users className="h-4 w-4" />{t.max_capacity} seats
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mr-4">
                            <ArrowRightLeft className="h-4 w-4" />{t.transferDirection || 'both'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-[var(--color-primary)] font-semibold ml-auto">
                            £{t.price_per_car_gbp_markup.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-muted-foreground font-normal">/car</span>
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Show selected transfer card */}
            {value && selectedTransfer && (
              <Card
                key={selectedTransfer.id}
                className={`relative border-2 transition-all flex flex-col md:flex-row md:items-stretch gap-0 p-0 border-[var(--color-primary)] bg-primary/10 shadow-lg rounded-xl overflow-hidden group`}
                tabIndex={0}
                aria-selected={true}
              >
                {/* Checkmark for selected */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white shadow">
                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M4 8.5l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
                {/* Left: Icon and Info */}
                <div className="flex flex-row items-center gap-4 min-w-[220px] p-6 md:w-2/3 w-full">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-secondary-600)] to-[var(--color-secondary-700)] flex items-center justify-center">
                    <Car className="h-8 w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xl text-[var(--color-foreground)] truncate mb-1">{hotelName}</div>
                    <div className="text-base font-semibold text-[var(--color-secondary-700)] truncate mb-1">{selectedTransfer.transport_type ? selectedTransfer.transport_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown Type'}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted-foreground)]">
                      <span className="flex items-center gap-1"><Tag className="h-4 w-4" />{selectedTransfer.supplier || 'Standard'}</span>
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" />{selectedTransfer.max_capacity} seats/vehicle</span>
                      <span className="flex items-center gap-1"><ArrowRightLeft className="h-4 w-4" />{value.transferDirection || 'both'}</span>
                    </div>
                  </div>
                </div>
                {/* Divider for desktop */}
                <div className="hidden md:block w-px bg-[var(--color-border)] my-6" />
                {/* Right: Price, Quantity, Total */}
                <div className="flex flex-col justify-center items-end gap-4 p-6 md:w-1/3 w-full">
                  <div className="flex flex-row items-end gap-8 justify-end w-full">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Per Car Price</span>
                      <span className="text-base font-semibold text-[var(--color-primary)]">£{(selectedTransfer.price_per_car_gbp_markup || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)] mt-2">Total</span>
                      <span className="text-base font-semibold text-[var(--color-primary)]">£{((selectedTransfer.price_per_car_gbp_markup || 0) * (value.quantity || adults) * (value.transferDirection === 'both' ? 2 : 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-5 w-full justify-end mt-4">
                    <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Quantity</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => value.quantity > 1 && onChange({ ...value, quantity: value.quantity - 1 })}
                        disabled={value.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        value={value.quantity}
                        onChange={e => {
                          const qty = Math.max(1, parseInt(e.target.value) || 1);
                          onChange({ ...value, quantity: qty });
                        }}
                        className="w-16 text-center"
                        aria-label="Quantity"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onChange({ ...value, quantity: value.quantity + 1 })}
                        aria-label="Increase quantity"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                 {/* Direction Selector */}
                 <div className="flex flex-row items-center gap-4 mt-4">
                   <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Direction</span>
                   <Select
                     value={value.transferDirection || 'both'}
                     onValueChange={dir => onChange({ ...value, transferDirection: dir as 'outbound' | 'return' | 'both' })}
                   >
                     <SelectTrigger className="w-32">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="outbound">Outbound</SelectItem>
                       <SelectItem value="return">Return</SelectItem>
                       <SelectItem value="both">Both Ways</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                {/* Capacity Warning */}
                {selectedTransfer.max_capacity && (selectedTransfer.max_capacity * value.quantity < adults) && (
                  <div className="mt-4 text-xs text-orange-600 font-medium text-right">
                    ⚠️ Not enough vehicles for all passengers. Increase quantity or select a larger vehicle.
                  </div>
                )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AirportTransfersTabV2; 