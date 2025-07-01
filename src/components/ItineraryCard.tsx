import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import type { ItineraryDay } from '@/lib/gemini';
import { ImageUpload } from './ImageUpload';
import { Trash2 } from 'lucide-react';
import { Drawer } from '@/components/ui/drawer';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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

export type ItineraryCardProps = {
  day: ItineraryDay;
  onChange: (updated: ItineraryDay) => void;
  onRegenerate: () => void;
  index: number;
  dragHandleProps?: any;
  destination?: string;
  includeInventory?: boolean;
  inventoryTypes?: string[];
};

export function ItineraryCard({ day, onChange, onRegenerate, index, dragHandleProps, destination, includeInventory, inventoryTypes }: ItineraryCardProps) {
  const [editing, setEditing] = useState(false);
  const [localDay, setLocalDay] = useState(day);
  // Inline editing state for activities
  const [editingActivity, setEditingActivity] = useState<{ idx: number; field: string } | null>(null);
  const [activityDraft, setActivityDraft] = useState<string | number>('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [showHotelDrawer, setShowHotelDrawer] = useState(false);

  const handleFieldChange = (field: keyof ItineraryDay, value: any) => {
    const updated = { ...localDay, [field]: value };
    setLocalDay(updated);
    onChange(updated);
  };

  const handleActivityChange = (idx: number, field: string, value: any) => {
    const updatedActivities = localDay.activities.map((a, i) =>
      i === idx ? { ...a, [field]: value } : a
    );
    handleFieldChange('activities', updatedActivities);
  };

  // Inline edit handlers for activities
  const handleActivityFieldClick = (idx: number, field: string, value: any) => {
    setEditingActivity({ idx, field });
    setActivityDraft(value ?? '');
  };

  const handleActivityFieldBlur = (idx: number, field: string) => {
    setEditingActivity(null);
    handleActivityChange(idx, field, activityDraft);
  };

  const handleActivityFieldChange = (value: string | number) => {
    setActivityDraft(value);
  };

  const addActivity = () => {
    const newActivity = { time: '', description: '', location: '', notes: '', estimatedCost: 0, costType: 'total' };
    handleFieldChange('activities', [...localDay.activities, newActivity]);
  };

  const removeActivity = (idx: number) => {
    const updated = localDay.activities.filter((_, i) => i !== idx);
    handleFieldChange('activities', updated);
  };

  const handleImageChange = (imageUrl: string) => {
    handleFieldChange('imageUrl', imageUrl);
  };

  return (
    <div className="bg-background shadow p-6 mb-4 rounded-lg border border-[var(--border)]/30">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span {...dragHandleProps} className="cursor-move select-none text-xl font-bold text-[var(--primary)]">≡</span>
          <h3 className="text-xl font-bold">Day {index + 1}</h3>
        </div>
        <Button size="sm" variant="outline" onClick={onRegenerate}>
          Regenerate Day with AI
        </Button>
      </div>

      {/* Image Section */}
      <div className="mb-4">
        <ImageUpload
          currentImage={localDay.imageUrl}
          onImageChange={handleImageChange}
          destination={destination}
          activity={localDay.activities[0]?.description}
        />
      </div>

      <p className="mb-2 text-muted-foreground">{formatDateWithDay(day.date)}</p>
      <ul className="list-disc list-inside text-muted-foreground mb-2">
        {localDay.activities.map((activity, idx) => {
          const isEvent = activity.time === 'Event';
          return (
            <li
              key={idx}
              className={
                isEvent
                  ? 'mb-1 flex flex-col gap-1 rounded-xl p-4 bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 border-2 border-yellow-400 shadow-lg ring-2 ring-yellow-300 font-bold text-yellow-900 relative'
                  : 'mb-1 flex flex-col gap-1 bg-card backdrop-blur-sm rounded p-2'
              }
            >
              {isEvent ? (
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-4xl md:text-5xl drop-shadow-lg cursor-help" title="Featured Event">🎉</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      This is a ticketed event you selected.
                    </TooltipContent>
                  </Tooltip>
                  <span className="uppercase tracking-widest font-extrabold text-yellow-800 text-xs md:text-sm px-2 py-1 bg-yellow-300 rounded shadow">FEATURED EVENT</span>
                  <span className="ml-0 md:ml-4 text-lg md:text-2xl font-extrabold text-yellow-900">{activity.description}</span>
                </div>
              ) : (
                <div className="flex gap-2 items-center flex-wrap">
                  {/* Inline editable time */}
                  {editingActivity?.idx === idx && editingActivity.field === 'time' ? (
                    <input
                      ref={inputRef as any}
                      className="w-20 text-xs font-semibold bg-transparent border-b border-[var(--primary)] focus:outline-none focus:border-[var(--primary)] px-1"
                      value={activityDraft}
                      onChange={e => handleActivityFieldChange(e.target.value)}
                      onBlur={() => handleActivityFieldBlur(idx, 'time')}
                      onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.blur(); }}
                    />
                  ) : (
                    <span
                      className="font-semibold text-xs cursor-pointer hover:bg-[var(--primary)]/10 rounded px-1 py-0.5"
                      onClick={() => handleActivityFieldClick(idx, 'time', activity.time)}
                      title="Click to edit"
                    >
                      {activity.time || <span className="text-foreground italic">Time</span>}
                    </span>
                  )}
                  {/* Inline editable description */}
                  {editingActivity?.idx === idx && editingActivity.field === 'description' ? (
                    <input
                      ref={inputRef as any}
                      className="flex-1 text-xs font-medium bg-transparent border-b border-[var(--primary)] focus:outline-none focus:border-[var(--primary)] px-1"
                      value={activityDraft}
                      onChange={e => handleActivityFieldChange(e.target.value)}
                      onBlur={() => handleActivityFieldBlur(idx, 'description')}
                      onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.blur(); }}
                    />
                  ) : (
                    <span
                      className="font-medium text-xs cursor-pointer hover:bg-[var(--primary)]/10 rounded px-1 py-0.5"
                      onClick={() => handleActivityFieldClick(idx, 'description', activity.description)}
                      title="Click to edit"
                    >
                      {activity.description || <span className="text-foreground italic">Description</span>}
                    </span>
                  )}
                  {/* Inline editable location */}
                  {editingActivity?.idx === idx && editingActivity.field === 'location' ? (
                    <input
                      ref={inputRef as any}
                      className="w-32 text-xs bg-transparent border-b border-[var(--primary)] focus:outline-none focus:border-[var(--primary)] px-1"
                      value={activityDraft}
                      onChange={e => handleActivityFieldChange(e.target.value)}
                      onBlur={() => handleActivityFieldBlur(idx, 'location')}
                      onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.blur(); }}
                    />
                  ) : (
                    <span
                      className="text-xs text-muted-foreground cursor-pointer hover:bg-[var(--primary)]/10 rounded px-1 py-0.5"
                      onClick={() => handleActivityFieldClick(idx, 'location', activity.location)}
                      title="Click to edit"
                    >
                      {activity.location || <span className="text-foreground italic">Location</span>}
                    </span>
                  )}
                  {/* Inline editable notes */}
                  {editingActivity?.idx === idx && editingActivity.field === 'notes' ? (
                    <input
                      ref={inputRef as any}
                      className="w-32 text-xs bg-transparent border-b border-[var(--primary)] focus:outline-none focus:border-[var(--primary)] px-1"
                      value={activityDraft}
                      onChange={e => handleActivityFieldChange(e.target.value)}
                      onBlur={() => handleActivityFieldBlur(idx, 'notes')}
                      onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.blur(); }}
                    />
                  ) : (
                    <span
                      className="text-xs text-muted-foreground italic cursor-pointer hover:bg-[var(--primary)]/10 rounded px-1 py-0.5"
                      onClick={() => handleActivityFieldClick(idx, 'notes', activity.notes)}
                      title="Click to edit"
                    >
                      {activity.notes || <span className="text-foreground italic">Notes</span>}
                    </span>
                  )}
                  {/* Inline editable estimatedCost */}
                  {editingActivity?.idx === idx && editingActivity.field === 'estimatedCost' ? (
                    <input
                      ref={inputRef as any}
                      className="w-16 text-xs bg-transparent border-b border-[var(--primary)] focus:outline-none focus:border-[var(--primary)] px-1"
                      type="number"
                      value={activityDraft}
                      onChange={e => handleActivityFieldChange(Number(e.target.value))}
                      onBlur={() => handleActivityFieldBlur(idx, 'estimatedCost')}
                      onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.blur(); }}
                    />
                  ) : (
                    <span
                      className="ml-2 text-xs text-[var(--primary)] cursor-pointer hover:bg-[var(--primary)]/10 rounded px-1 py-0.5"
                      onClick={() => handleActivityFieldClick(idx, 'estimatedCost', activity.estimatedCost)}
                      title="Click to edit"
                    >
                      {activity.estimatedCost ? activity.estimatedCost : <span className="text-foreground italic">Cost</span>}
                    </span>
                  )}
                  {/* Inline editable costType */}
                  {editingActivity?.idx === idx && editingActivity.field === 'costType' ? (
                    <select
                      ref={inputRef as any}
                      className="w-24 text-xs bg-transparent border-b border-[var(--primary)] focus:outline-none focus:border-[var(--primary)] px-1"
                      value={activityDraft}
                      onChange={e => handleActivityFieldChange(e.target.value)}
                    >
                      <option value="total">Total</option>
                      <option value="per person">Per Person</option>
                    </select>
                  ) : (
                    <span
                      className="ml-2 text-xs text-muted-foreground cursor-pointer hover:bg-[var(--primary)]/10 rounded px-1 py-0.5"
                      onClick={() => handleActivityFieldClick(idx, 'costType', activity.costType)}
                      title="Click to edit"
                    >
                      {activity.costType || <span className="text-foreground italic">Cost Type</span>}
                    </span>
                  )}
                  {/* Remove activity button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ml-2 text-destructive hover:bg-destructive/10"
                    onClick={() => removeActivity(idx)}
                    title="Remove activity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <Button size="sm" variant="secondary" onClick={addActivity} className="mt-2">+ Add Activity</Button>
      {/* Inventory selection UI */}
      {includeInventory && inventoryTypes?.includes('hotels') && (
        <div className="my-4">
          <Button variant="secondary" onClick={() => setShowHotelDrawer(true)}>
            Search real hotels
          </Button>
          {/* Hotel search drawer/modal scaffold */}
          {showHotelDrawer && (
            <Drawer open={showHotelDrawer} onOpenChange={setShowHotelDrawer}>
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Search Real Hotels (Coming Soon)</h2>
                <p>Hotel search UI will go here.</p>
                <Button variant="outline" onClick={() => setShowHotelDrawer(false)}>Close</Button>
              </div>
            </Drawer>
          )}
        </div>
      )}
    </div>
  );
} 