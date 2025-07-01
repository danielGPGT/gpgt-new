import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { ItineraryDay } from '@/lib/gemini';
import { ItineraryCard } from './ItineraryCard';

interface ItineraryEditorProps {
  days: ItineraryDay[];
  onChange: (days: ItineraryDay[]) => void;
  onRegenerateDay: (index: number) => void;
  destination?: string;
  includeInventory?: boolean;
  inventoryTypes?: string[];
}

function SortableItineraryCard({ day, index, onChange, onRegenerate, id, destination, includeInventory, inventoryTypes }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ItineraryCard
        day={day}
        onChange={updated => onChange(index, updated)}
        onRegenerate={() => onRegenerate(index)}
        index={index}
        dragHandleProps={listeners}
        destination={destination}
        includeInventory={includeInventory}
        inventoryTypes={inventoryTypes}
      />
    </div>
  );
}

export function ItineraryEditor({ days, onChange, onRegenerateDay, destination, includeInventory, inventoryTypes }: ItineraryEditorProps) {
  const [items, setItems] = useState(days.map((_, i) => i.toString()));

  // Keep items in sync with days
  if (items.length !== days.length) {
    setItems(days.map((_, i) => i.toString()));
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onChange(arrayMove(days, oldIndex, newIndex));
    }
  };

  const handleDayChange = (index: number, updated: ItineraryDay) => {
    const newDays = days.map((d, i) => (i === index ? updated : d));
    onChange(newDays);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((id, idx) => (
          <SortableItineraryCard
            key={id}
            id={id}
            day={days[parseInt(id)]}
            index={parseInt(id)}
            onChange={handleDayChange}
            onRegenerate={onRegenerateDay}
            destination={destination}
            includeInventory={includeInventory}
            inventoryTypes={inventoryTypes}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
} 