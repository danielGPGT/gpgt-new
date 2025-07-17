import React, { useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Car, Users, Tag, Calendar } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CircuitTransfer {
  id: string;
  hotel_id: string;
  transfer_type: string;
  supplier?: string;
  coach_capacity: number;
  days: number;
  sell_price_per_seat_gbp: number;
  gpgt_hotels?: { id: string; name: string };
}
interface Hotel {
  id: string;
  name: string;
}
interface CircuitTransfersTabV2Props {
  selectedTierId: string;
  allHotels: Hotel[];
  circuitTransfers: CircuitTransfer[];
  selectedHotelId: string | null;
  adults: number;
  value: { id: string; quantity: number } | null;
  onChange: (val: { id: string; quantity: number } | null) => void;
}

const CircuitTransfersTabV2: React.FC<CircuitTransfersTabV2Props> = ({
  selectedTierId,
  allHotels,
  circuitTransfers,
  selectedHotelId,
  adults,
  value,
  onChange,
}) => {
  const hotelTransfers = useMemo(
    () => circuitTransfers.filter((t) => t.hotel_id === selectedHotelId),
    [circuitTransfers, selectedHotelId]
  );
  const selectedTransfer = value
    ? circuitTransfers.find((t) => t.id === value.id)
    : null;
  const hotelName =
    selectedTransfer?.gpgt_hotels?.name ||
    (selectedHotelId
      ? allHotels.find((h) => String(h.id) === String(selectedHotelId))?.name
      : null) ||
    "Unknown Hotel";

  // Auto-adjust transfer if hotel changes
  useEffect(() => {
    if (!selectedHotelId) {
      onChange(null);
      return;
    }
    // If 'No Circuit Transfer' is selected, do nothing
    if (value === null) return;
    // If current transfer doesn't match hotel, auto-select appropriate transfer
    if (!value || (selectedTransfer && selectedTransfer.hotel_id !== selectedHotelId)) {
      if (hotelTransfers.length > 0) {
        let toSelect = null;
        // Try to find a transfer with the same transfer_type as the previous selection
        if (selectedTransfer) {
          const sameType = hotelTransfers.find(t => t.transfer_type === selectedTransfer.transfer_type);
          if (sameType) {
            toSelect = sameType;
          }
        }
        // If not found, select the cheapest per-seat transfer
        if (!toSelect) {
          toSelect = hotelTransfers.reduce((min, t) =>
            t.sell_price_per_seat_gbp < min.sell_price_per_seat_gbp ? t : min,
            hotelTransfers[0]
          );
        }
        onChange({ id: toSelect.id, quantity: adults });
      } else {
        onChange(null);
      }
    }
  }, [selectedHotelId]);

  // Auto-adjust quantity to always match the number of adults
  useEffect(() => {
    if (!selectedTransfer || !value) return;
    if (value.quantity !== adults) {
      onChange({ ...value, quantity: adults });
    }
    // eslint-disable-next-line
  }, [selectedTransfer, adults]);

  // --- UI ---
  const useRadio = hotelTransfers.length > 0 && hotelTransfers.length <= 4;

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">
        Select Circuit Transfer
      </h3>

      <div className="space-y-4">
        {/* No Circuit Transfer Card */}
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
              <div className="font-semibold text-lg text-[var(--color-foreground)]">No Circuit Transfer</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Do not include a circuit transfer in this package</div>
            </div>
            {!value && <Badge variant="secondary">Selected</Badge>}
          </CardContent>
        </Card>
        {/* Dropdown for circuit transfer selection */}
        {hotelTransfers.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-lg text-[var(--color-foreground)] mb-1">Choose a Circuit Transfer</div>
                <Select
                  value={value ? value.id : ''}
                  onValueChange={id => {
                    const transfer = hotelTransfers.find(t => t.id === id);
                    if (transfer) onChange({ id, quantity: adults });
                  }}
                >
                  <SelectTrigger className="w-full max-w-xl">
                    <SelectValue placeholder="Select circuit transfer" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotelTransfers.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex flex-row items-center gap-4 w-full">
                          <span className="font-semibold mr-2 min-w-[120px]">{t.transfer_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mr-4">
                            <Tag className="h-4 w-4" />{t.supplier || 'Standard'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mr-4">
                            <Users className="h-4 w-4" />{t.coach_capacity} seats
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground mr-4">
                            <Calendar className="h-4 w-4" />{t.days} day{t.days !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-[var(--color-primary)] font-semibold ml-auto">
                            £{t.sell_price_per_seat_gbp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-muted-foreground font-normal">/seat</span>
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
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-700)] flex items-center justify-center">
                    <Car className="h-8 w-8 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xl text-[var(--color-foreground)] truncate mb-1">{hotelName}</div>
                    <div className="text-base font-semibold text-[var(--color-primary-700)] truncate mb-1">{selectedTransfer.transfer_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-[var(--color-muted-foreground)]">
                      <span className="flex items-center gap-1"><Tag className="h-4 w-4" />{selectedTransfer.supplier || 'Standard'}</span>
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" />{selectedTransfer.coach_capacity} seats/coach</span>
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{selectedTransfer.days} day{selectedTransfer.days !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                {/* Divider for desktop */}
                <div className="hidden md:block w-px bg-[var(--color-border)] my-6" />
                {/* Right: Price, Quantity, Total */}
                <div className="flex flex-col justify-center items-end gap-4 p-6 md:w-1/3 w-full">
                  <div className="flex flex-row items-end gap-8 justify-end w-full">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Per Seat Price</span>
                      <span className="text-base font-semibold text-[var(--color-primary)]">£{(selectedTransfer.sell_price_per_seat_gbp || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)] mt-2">Total</span>
                      <span className="text-base font-semibold text-[var(--color-primary)]">£{((selectedTransfer.sell_price_per_seat_gbp || 0) * (value.quantity || adults)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-5 w-full justify-end mt-4">
                    <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Quantity</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => { e.stopPropagation(); onChange({ id: selectedTransfer.id, quantity: Math.max(1, (value.quantity || adults) - 1) }); }}
                        disabled={(value.quantity || adults) <= 1}
                        className="w-8 h-8 p-0"
                        tabIndex={-1}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        value={value.quantity || adults}
                        onClick={e => e.stopPropagation()}
                        onChange={e => {
                          e.stopPropagation();
                          const val = parseInt(e.target.value, 10);
                          onChange({ id: selectedTransfer.id, quantity: Number.isFinite(val) && val > 0 ? val : 1 });
                        }}
                        min={1}
                        max={adults}
                        className="w-14 text-center font-bold text-base bg-transparent border-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => { e.stopPropagation(); onChange({ id: selectedTransfer.id, quantity: Math.min(adults, (value.quantity || adults) + 1) }); }}
                        disabled={(value.quantity || adults) >= adults}
                        className="w-8 h-8 p-0"
                        tabIndex={-1}
                      >
                        +
                      </Button>
                      <span className="text-xs text-[var(--color-muted-foreground)] ml-2">Max: {adults}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CircuitTransfersTabV2;
