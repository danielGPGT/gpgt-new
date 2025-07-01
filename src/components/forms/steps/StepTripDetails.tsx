import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DayPicker } from 'react-day-picker';
import { format, differenceInDays, addDays } from 'date-fns';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Minus,
  Trash2, 
  Copy,
  Edit,
  CheckCircle,
  AlertCircle,
  Plane,
  Building2,
  Heart,
  Clock,
  ArrowRight,
  CalendarDays,
  UserPlus,
  Group,
  Sparkles,
  Star,
  Globe,
  TrendingUp,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

import { NewIntake, TravelerGroup, TripPurpose } from '@/types/newIntake';
import { useNewIntakeStore } from '@/store/newIntake';
import { useGoogleMapsScript } from '@/hooks/useGoogleMapsScript';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';

interface StepTripDetailsProps {
  disabled?: boolean;
}

const PURPOSE_OPTIONS: { value: TripPurpose; label: string; icon: any; description: string; color: string }[] = [
  { value: 'leisure', label: 'Leisure', icon: Plane, description: 'Vacation and relaxation', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { value: 'honeymoon', label: 'Honeymoon', icon: Heart, description: 'Romantic getaway', color: 'bg-pink-500/10 text-pink-600 border-pink-200' },
  { value: 'business', label: 'Business', icon: Building2, description: 'Work-related travel', color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
  { value: 'group-celebration', label: 'Group Celebration', icon: Users, description: 'Special events and celebrations', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
];

// Date selection helpers
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Quick duration buttons
const quickDurations = [
  { label: '3 Days', value: 3 },
  { label: '5 Days', value: 5 },
  { label: '1 Week', value: 7 },
  { label: '10 Days', value: 10 },
  { label: '2 Weeks', value: 14 },
  { label: '3 Weeks', value: 21 },
  { label: '1 Month', value: 30 },
];

// Popular travel periods
const popularPeriods = [
  { label: 'Winter', startMonth: 11, startDay: 20, endMonth: 0, endDay: 5, icon: Star, color: 'bg-red-100 text-red-700' },
  { label: 'Spring', startMonth: 2, startDay: 15, endMonth: 3, endDay: 15, icon: Star, color: 'bg-pink-100 text-pink-700' },
  { label: 'Summer', startMonth: 5, startDay: 15, endMonth: 7, endDay: 31, icon: Star, color: 'bg-yellow-100 text-yellow-700' },
];

// Quick traveler presets
const travelerPresets = [
  { label: 'Solo', adults: 1, children: 0, icon: User, color: 'bg-blue-100 text-blue-700' },
  { label: 'Couple', adults: 2, children: 0, icon: Heart, color: 'bg-pink-100 text-pink-700' },
  { label: 'Family', adults: 2, children: 2, icon: Users, color: 'bg-green-100 text-green-700' },
  { label: 'Group', adults: 4, children: 0, icon: Group, color: 'bg-purple-100 text-purple-700' },
];

// Traveler type options with radio button styling
const travelerTypes = [
  { 
    value: 'solo', 
    label: 'Solo Traveler', 
    icon: User, 
    description: 'Single adult traveler',
    adults: 1,
    children: 0,
    color: 'bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20',
    selectedColor: 'bg-blue-500 text-white border-blue-500'
  },
  { 
    value: 'couple', 
    label: 'Couple', 
    icon: Heart, 
    description: 'Two adult travelers',
    adults: 2,
    children: 0,
    color: 'bg-pink-500/10 text-pink-600 border-pink-200 hover:bg-pink-500/20',
    selectedColor: 'bg-pink-500 text-white border-pink-500'
  },
  { 
    value: 'family', 
    label: 'Family', 
    icon: Users, 
    description: 'Adults with children',
    adults: 2,
    children: 2,
    color: 'bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20',
    selectedColor: 'bg-green-500 text-white border-green-500'
  },
  { 
    value: 'group', 
    label: 'Group', 
    icon: Group, 
    description: 'Multiple travelers with subgroups',
    adults: 4,
    children: 0,
    color: 'bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20',
    selectedColor: 'bg-purple-500 text-white border-purple-500'
  },
];

// Advanced traveler configurations for each type
const travelerConfigs = {
  solo: {
    minAdults: 1,
    maxAdults: 1,
    minChildren: 0,
    maxChildren: 0,
    allowSubgroups: false,
    defaultAdults: 1,
    defaultChildren: 0,
  },
  couple: {
    minAdults: 2,
    maxAdults: 2,
    minChildren: 0,
    maxChildren: 4,
    allowSubgroups: false,
    defaultAdults: 2,
    defaultChildren: 0,
  },
  family: {
    minAdults: 1,
    maxAdults: 4,
    minChildren: 1,
    maxChildren: 6,
    allowSubgroups: false,
    defaultAdults: 2,
    defaultChildren: 2,
  },
  group: {
    minAdults: 3,
    maxAdults: 20,
    minChildren: 0,
    maxChildren: 10,
    allowSubgroups: true,
    defaultAdults: 4,
    defaultChildren: 0,
  },
};

export function StepTripDetails({ disabled }: StepTripDetailsProps) {
  const form = useFormContext<NewIntake>();
  const { addGroup, updateGroup, removeGroup, duplicateGroup } = useNewIntakeStore();
  
  // Debug logging
  console.log('StepTripDetails - disabled prop:', disabled);
  console.log('StepTripDetails - window.google?.maps?.places:', !!window.google?.maps?.places);
  
  // Add error boundary
  if (!form) {
    console.error('Form context not found');
    return <div>Form context not available</div>;
  }
  
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [selectedTravelerType, setSelectedTravelerType] = useState<string>('solo');
  
  // Date selection state
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedEndMonth, setSelectedEndMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Watch form values efficiently - only watch what we need
  const useSubgroups = form.watch('tripDetails.useSubgroups');
  const groups = form.watch('tripDetails.groups');
  const startDate = form.watch('tripDetails.startDate');
  const endDate = form.watch('tripDetails.endDate');
  const totalAdults = form.watch('tripDetails.totalTravelers.adults') || 0;
  const totalChildren = form.watch('tripDetails.totalTravelers.children') || 0;
  const hasPrimaryDestination = form.watch('tripDetails.primaryDestination');
  const hasPurpose = form.watch('tripDetails.purpose');

  // Determine current traveler type based on form values
  useEffect(() => {
    const adults = totalAdults;
    const children = totalChildren;
    
    if (adults === 1 && children === 0) {
      setSelectedTravelerType('solo');
    } else if (adults === 2 && children === 0) {
      setSelectedTravelerType('couple');
    } else if (adults >= 1 && children >= 1) {
      setSelectedTravelerType('family');
    } else if (adults >= 3 || useSubgroups) {
      setSelectedTravelerType('group');
    }
  }, [totalAdults, totalChildren, useSubgroups]);

  // Handle traveler type selection
  const handleTravelerTypeSelect = (type: string) => {
    setSelectedTravelerType(type);
    const config = travelerConfigs[type as keyof typeof travelerConfigs];
    
    // Set default values for the selected type
    form.setValue('tripDetails.totalTravelers.adults', config.defaultAdults);
    form.setValue('tripDetails.totalTravelers.children', config.defaultChildren);
    
    // Enable/disable subgroups based on type
    if (config.allowSubgroups) {
      form.setValue('tripDetails.useSubgroups', true);
      // Auto-create initial groups for group type
      if (type === 'group') {
        const initialGroups: TravelerGroup[] = [
          {
            id: `group_${Date.now()}_1`,
            name: 'Group 1',
            adults: config.defaultAdults,
            children: config.defaultChildren,
            childAges: Array.from({ length: config.defaultChildren }, (_, i) => 10 + i),
            travelerNames: [
              ...Array.from({ length: config.defaultAdults }, (_, i) => ({
                name: `Adult ${i + 1}`,
                type: 'adult' as const,
              })),
              ...Array.from({ length: config.defaultChildren }, (_, i) => ({
                name: `Child ${i + 1}`,
                type: 'child' as const,
                age: 10 + i,
              })),
            ],
            notes: 'Initial travel group',
          }
        ];
        form.setValue('tripDetails.groups', initialGroups);
      }
    } else {
      form.setValue('tripDetails.useSubgroups', false);
      // Clear existing groups if subgroups are not allowed
      form.setValue('tripDetails.groups', []);
    }
    
    toast.success(`Selected ${travelerTypes.find(t => t.value === type)?.label} configuration`);
  };

  // Calculate duration when dates change - simplified
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        form.setValue('tripDetails.duration', diffDays);
      }
    }
  }, [startDate, endDate]);

  // Group validation functions
  const validateGroups = () => {
    if (!useSubgroups) return true;
    
    const groups = form.watch('tripDetails.groups') || [];
    const totalAdults = form.watch('tripDetails.totalTravelers.adults') || 0;
    const totalChildren = form.watch('tripDetails.totalTravelers.children') || 0;
    
    // Check if groups exist
    if (groups.length === 0) {
      toast.error('Please create at least one travel group');
      return false;
    }
    
    // Calculate total travelers in groups
    let groupAdults = 0;
    let groupChildren = 0;
    
    groups.forEach(group => {
      groupAdults += group.adults || 0;
      groupChildren += group.children || 0;
    });
    
    // Check if all travelers are assigned
    if (groupAdults !== totalAdults) {
      toast.error(`All adults must be assigned to groups. Found ${groupAdults}/${totalAdults} adults assigned.`);
      return false;
    }
    
    if (groupChildren !== totalChildren) {
      toast.error(`All children must be assigned to groups. Found ${groupChildren}/${totalChildren} children assigned.`);
      return false;
    }
    
    // Check if each group has at least one traveler
    const emptyGroups = groups.filter(group => (group.adults || 0) + (group.children || 0) === 0);
    if (emptyGroups.length > 0) {
      toast.error('All groups must have at least one traveler assigned');
      return false;
    }
    
    return true;
  };

  // Check completion status
  const hasStartDate = startDate;
  const hasEndDate = endDate;
  const hasAdults = totalAdults;
  const hasValidGroups = validateGroups();

  const isComplete = hasPrimaryDestination && hasStartDate && hasEndDate && hasAdults && hasPurpose && hasValidGroups;

  // Enhanced group management functions
  const handleAddGroup = () => {
    const existingGroups = form.watch('tripDetails.groups') || [];
    const newGroup: TravelerGroup = {
      id: `group_${Date.now()}`,
      name: `Group ${existingGroups.length + 1}`,
      adults: 0,
      children: 0,
      childAges: [],
      travelerNames: [],
      notes: '',
    };

    const updatedGroups = [...existingGroups, newGroup];
    form.setValue('tripDetails.groups', updatedGroups);
    setShowGroupForm(true);
    setEditingGroupId(newGroup.id);
    toast.success('New group created');
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<TravelerGroup>) => {
    const groups = form.watch('tripDetails.groups') || [];
    const updatedGroups = groups.map(group => 
      group.id === groupId ? { ...group, ...updates } : group
    );
    
    form.setValue('tripDetails.groups', updatedGroups);
    setEditingGroupId(null);
    setShowGroupForm(false);
    toast.success('Group updated successfully');
  };

  const handleRemoveGroup = (groupId: string) => {
    const groups = form.watch('tripDetails.groups') || [];
    const groupToRemove = groups.find(g => g.id === groupId);
    
    if (groupToRemove && (groupToRemove.adults || 0) + (groupToRemove.children || 0) > 0) {
      const confirmed = window.confirm(
        `Are you sure you want to remove "${groupToRemove.name}"? This will unassign ${groupToRemove.adults || 0} adults and ${groupToRemove.children || 0} children.`
      );
      if (!confirmed) return;
    }
    
    const updatedGroups = groups.filter(group => group.id !== groupId);
    form.setValue('tripDetails.groups', updatedGroups);
    toast.success('Group removed');
  };

  const handleDuplicateGroup = (groupId: string) => {
    const groups = form.watch('tripDetails.groups') || [];
    const groupToDuplicate = groups.find(g => g.id === groupId);
    
    if (groupToDuplicate) {
      const newGroup: TravelerGroup = {
        ...groupToDuplicate,
        id: `group_${Date.now()}`,
        name: `${groupToDuplicate.name} (Copy)`,
      };
      
      const updatedGroups = [...groups, newGroup];
      form.setValue('tripDetails.groups', updatedGroups);
      toast.success('Group duplicated');
    }
  };

  const handleEditGroup = (groupId: string) => {
    setEditingGroupId(groupId);
    setShowGroupForm(true);
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setShowGroupForm(false);
  };

  // Date selection handlers
  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('tripDetails.startDate', format(date, 'yyyy-MM-dd'));
      setStartDateOpen(false);
      
      // Auto-set end date to 7 days after start date if no end date is set
      if (!endDate) {
        const defaultEndDate = addDays(date, 6); // 7 days total
        form.setValue('tripDetails.endDate', format(defaultEndDate, 'yyyy-MM-dd'));
        setSelectedEndMonth(defaultEndDate);
      }
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('tripDetails.endDate', format(date, 'yyyy-MM-dd'));
      setEndDateOpen(false);
      setSelectedEndMonth(date);
    }
  };

  const handleMonthChange = (monthIndex: number) => {
    const newDate = new Date(selectedYear, monthIndex, 1);
    setSelectedMonth(newDate);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(year, selectedMonth.getMonth(), 1);
    setSelectedMonth(newDate);
    setSelectedYear(year);
  };

  // Quick duration selection
  const selectDurationFromStartDate = (days: number) => {
    // Use the selected start date if available, otherwise use today
    const currentStartDate = startDate ? new Date(startDate) : new Date();
    const endDate = addDays(currentStartDate, days - 1);
    
    // Only set start date if it's not already set
    if (!startDate) {
      form.setValue('tripDetails.startDate', format(currentStartDate, 'yyyy-MM-dd'));
      setSelectedMonth(currentStartDate);
    }
    
    form.setValue('tripDetails.endDate', format(endDate, 'yyyy-MM-dd'));
    form.setValue('tripDetails.duration', days);
    
    setSelectedEndMonth(endDate);
  };

  // Popular period selection
  const handlePopularPeriod = (period: typeof popularPeriods[0]) => {
    const currentYear = new Date().getFullYear();
    const today = new Date();
    let startDate = new Date(currentYear, period.startMonth, period.startDay);
    let endDate = new Date(currentYear, period.endMonth, period.endDay);
    
    // Handle year rollover (e.g., Holiday Season)
    if (period.endMonth < period.startMonth) {
      endDate.setFullYear(currentYear + 1);
    }
    
    // If the period has already passed this year, use next year
    if (endDate < today) {
      startDate = new Date(currentYear + 1, period.startMonth, period.startDay);
      endDate = new Date(currentYear + 1, period.endMonth, period.endDay);
      
      // Handle year rollover for next year
      if (period.endMonth < period.startMonth) {
        endDate.setFullYear(currentYear + 2);
      }
    }
    
    form.setValue('tripDetails.startDate', format(startDate, 'yyyy-MM-dd'));
    form.setValue('tripDetails.endDate', format(endDate, 'yyyy-MM-dd'));
    form.setValue('tripDetails.duration', differenceInDays(endDate, startDate) + 1);
    
    setSelectedMonth(startDate);
    setSelectedEndMonth(endDate);
  };

  // Google Maps Autocomplete for Primary Destination (Step2Destinations pattern, but for tripDetails.primaryDestination)
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const { place: primaryPlace } = useGooglePlaces(primaryInputRef);
  const { ref: primaryRegisterRef, ...primaryRegisterProps } = form.register('tripDetails.primaryDestination');

  // Update form value when a place is selected
  useEffect(() => {
    if (primaryPlace) {
      const locationString = [
        primaryPlace.city,
        primaryPlace.state,
        primaryPlace.country
      ].filter(Boolean).join(', ');
      form.setValue('tripDetails.primaryDestination', locationString, { shouldValidate: true });
    }
  }, [primaryPlace]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto space-y-6 max-w-4xl"
    >
      {/* Trip Purpose & Destination */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-[var(--card-foreground)]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/30 shadow-sm">
                <Globe className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <div className="text-lg font-semibold">Trip Purpose & Destination</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)]">
                  Tell us about your travel plans and where you're headed
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trip Purpose Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Star className="h-4 w-4 text-[var(--primary)]" />
                Trip Purpose
              </Label>
              
              {/* Enhanced Purpose Selection with Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PURPOSE_OPTIONS.map((option) => {
                  const isSelected = form.watch('tripDetails.purpose') === option.value;
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "relative flex cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm",
                        isSelected
                          ? "border-[var(--primary)] bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 shadow-sm"
                          : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]/20"
                      )}
                      onClick={() => form.setValue('tripDetails.purpose', option.value)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all duration-200",
                          isSelected
                            ? "bg-[var(--primary)] border-[var(--primary)] shadow-sm"
                            : "bg-[var(--muted)]/50 border-[var(--border)]"
                        )}>
                          <option.icon className={cn(
                            "w-5 h-5 transition-colors duration-200",
                            isSelected ? "text-white" : "text-[var(--muted-foreground)]"
                          )} />
                        </div>
                        <div className="flex-1">
                          <div className={cn(
                            "font-semibold transition-colors duration-200",
                            isSelected ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                          )}>
                            {option.label}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">
                            {option.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination Input with Enhanced Styling */}
            <div className="space-y-3">
              <Label htmlFor="primaryDestination" className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--primary)]" />
                Primary Destination *
              </Label>
              
              <div className="relative group">
                <div className={cn(
                  "absolute inset-0 rounded-xl border-2 transition-all duration-200",
                  form.formState.errors.tripDetails?.primaryDestination
                    ? "border-red-500/50"
                    : "border-[var(--border)] group-focus-within:border-[var(--primary)]/50"
                )} />
                <Input
                  ref={e => {
                    primaryInputRef.current = e;
                    primaryRegisterRef(e);
                  }}
                  {...primaryRegisterProps}
                  placeholder="e.g. Paris, France"
                  disabled={disabled}
                  className="relative h-10 pl-12 pr-4 rounded-lg border-0 bg-transparent focus:ring-0 focus:border-0 placeholder:text-[var(--muted-foreground)]/60"
                />
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors duration-200" />
                
                {/* Enhanced validation message */}
                {form.formState.errors.tripDetails?.primaryDestination && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.tripDetails.primaryDestination.message}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Destination Preview */}
              {primaryPlace && (
                <div className="p-3 bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/10 rounded-lg border border-[var(--accent)]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-[var(--accent-foreground)]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[var(--accent-foreground)]">
                        {primaryPlace.city}, {primaryPlace.country}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {primaryPlace.state && `${primaryPlace.state}, `}{primaryPlace.country}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-[var(--accent)]/20 text-[var(--accent-foreground)] border-[var(--accent)]/30">
                      Selected
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Travel Dates */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-[var(--card-foreground)]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--secondary)]/20 to-[var(--secondary)]/10 flex items-center justify-center border border-[var(--secondary)]/30 shadow-sm">
                <CalendarDays className="h-5 w-5 text-[var(--secondary)]" />
              </div>
              <div>
                <div className="text-lg font-semibold">Travel Dates</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)]">
                  When are you planning to travel?
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Popular Periods */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Star className="h-4 w-4 text-[var(--primary)]" />
                Popular Periods
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {popularPeriods.map((period) => {
                  const Icon = period.icon;
                  return (
                    <div
                      key={period.label}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-sm",
                        "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]/20"
                      )}
                      onClick={() => handlePopularPeriod(period)}
                    >
                      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", period.color)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[var(--foreground)]">{period.label}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Popular travel time</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Duration Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--primary)]" />
                Quick Duration from Start Date
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {quickDurations.map((duration) => (
                  <div
                    key={duration.label}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md text-center",
                      "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]/20"
                    )}
                    onClick={() => selectDurationFromStartDate(duration.value)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <div>
                      <div className="font-medium text-[var(--foreground)] text-sm">{duration.label}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{duration.value} days</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--primary)]" />
                Select Dates
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--muted-foreground)]">Start Date *</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 rounded-lg border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30 transition-all duration-200",
                          !startDate && "text-[var(--muted-foreground)]"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(new Date(startDate), "MMM dd, yyyy") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl border-[var(--border)] bg-[var(--background)]" align="start">
                      {/* Quick Year/Month Selection */}
                      <div className="p-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                        <div className="flex gap-2">
                          <Select value={selectedMonth.getMonth().toString()} onValueChange={(value) => handleMonthChange(parseInt(value))}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month: string, index: number) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={selectedYear.toString()} onValueChange={(value) => handleYearChange(parseInt(value))}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year: number) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DayPicker
                        mode="single"
                        selected={startDate ? new Date(startDate) : undefined}
                        onSelect={handleStartDateSelect}
                        month={selectedMonth}
                        onMonthChange={setSelectedMonth}
                        disabled={(date) => date < new Date()}
                        className="p-2"
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.tripDetails?.startDate && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.tripDetails.startDate.message}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label className="text-xs text-[var(--muted-foreground)]">End Date *</Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 rounded-lg border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30 transition-all duration-200",
                          !endDate && "text-[var(--muted-foreground)]"
                        )}
                        disabled={!startDate}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(new Date(endDate), "MMM dd, yyyy") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl border-[var(--border)] bg-[var(--background)]" align="start">
                      {/* Quick Year/Month Selection */}
                      <div className="p-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                        <div className="flex gap-2">
                          <Select value={selectedEndMonth.getMonth().toString()} onValueChange={(value) => setSelectedEndMonth(new Date(parseInt(value)))}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((month: string, index: number) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={selectedEndMonth.getFullYear().toString()} onValueChange={(value) => setSelectedEndMonth(new Date(parseInt(value), selectedEndMonth.getMonth(), 1))}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year: number) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DayPicker
                        mode="single"
                        selected={endDate ? new Date(endDate) : undefined}
                        onSelect={handleEndDateSelect}
                        month={selectedEndMonth}
                        onMonthChange={setSelectedEndMonth}
                        disabled={(date) => !startDate || date <= new Date(startDate)}
                        className="p-2"
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.tripDetails?.endDate && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {form.formState.errors.tripDetails.endDate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Trip Duration Display */}
            {startDate && endDate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary)]/5 rounded-lg border border-[var(--primary)]/20"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[var(--primary)]">
                    {form.watch('tripDetails.duration') || 0} day{(form.watch('tripDetails.duration') || 0) !== 1 ? 's' : ''} trip
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {new Date(startDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} - {new Date(endDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[var(--primary)]/60" />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Traveler Count */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-gradient-to-br from-[var(--card)] via-[var(--card)]/95 to-[var(--background)]/30 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-[var(--card-foreground)]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-600)]/20 to-[var(--primary-600)]/10 flex items-center justify-center border border-[var(--primary-600)]/30 shadow-sm">
                <Users className="h-5 w-5 text-[var(--primary-600)]" />
              </div>
              <div>
                <div className="text-lg font-semibold">Traveler Count</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)]">
                  How many people are traveling with you?
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Traveler Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--primary)]" />
                Traveler Type *
              </Label>
              <RadioGroup
                value={selectedTravelerType}
                onValueChange={handleTravelerTypeSelect}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2"
              >
                {travelerTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedTravelerType === type.value;
                  const config = travelerConfigs[type.value as keyof typeof travelerConfigs];
                  
                  return (
                    <div
                      key={type.value}
                      className={cn(
                        'relative p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer',
                        'bg-[var(--background)] hover:bg-[var(--accent)]',
                        isSelected 
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm' 
                          : 'border-[var(--border)] hover:border-[var(--primary)]/30',
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <RadioGroupItem
                        value={type.value}
                        id={type.value}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={disabled}
                      />
                      <div className="flex flex-col items-center text-center gap-2 pointer-events-none">
                        <Icon className={cn(
                          'h-5 w-5 transition-colors duration-300',
                          isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                        )} />
                        <div>
                          <label htmlFor={type.value} className="text-sm font-semibold text-[var(--foreground)] block">
                            {type.label}
                          </label>
                          <p className="text-xs text-[var(--muted-foreground)]">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
              </div>

            {/* Traveler Count Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                <Label className="text-sm font-semibold text-[var(--foreground)]">
                  Traveler Details
                </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                  <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--primary)]" />
                  Adults *
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = form.watch('tripDetails.totalTravelers.adults') || 0;
                        const config = travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs];
                        if (current > config.minAdults) {
                        form.setValue('tripDetails.totalTravelers.adults', current - 1);
                      }
                    }}
                      disabled={disabled || (form.watch('tripDetails.totalTravelers.adults') || 0) <= (travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs]?.minAdults || 1)}
                    className="h-12 w-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/30 transition-all duration-200"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Controller
                    name="tripDetails.totalTravelers.adults"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="adults"
                        type="number"
                          min={travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs]?.minAdults || 1}
                          max={travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs]?.maxAdults || 20}
                        placeholder="1"
                        disabled={disabled}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                            const config = travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs];
                            const clampedValue = Math.max(config.minAdults, Math.min(config.maxAdults, value));
                            field.onChange(clampedValue);
                        }}
                        className="h-10 rounded-lg border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-all duration-200 text-center text-base font-semibold"
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = form.watch('tripDetails.totalTravelers.adults') || 0;
                        const config = travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs];
                        if (current < config.maxAdults) {
                      form.setValue('tripDetails.totalTravelers.adults', current + 1);
                        }
                    }}
                      disabled={disabled || (form.watch('tripDetails.totalTravelers.adults') || 0) >= (travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs]?.maxAdults || 20)}
                    className="h-12 w-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/30 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.formState.errors.tripDetails?.totalTravelers?.adults && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.tripDetails.totalTravelers.adults.message}
                  </p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  Adults are travelers 18 years and older
                </p>
              </div>

              <div className="space-y-4">
                  <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--secondary)]" />
                  Children
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = form.watch('tripDetails.totalTravelers.children') || 0;
                        const config = travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs];
                        if (current > config.minChildren) {
                        form.setValue('tripDetails.totalTravelers.children', current - 1);
                      }
                    }}
                      disabled={disabled || (form.watch('tripDetails.totalTravelers.children') || 0) <= (travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs]?.minChildren || 0)}
                    className="h-12 w-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--secondary)]/30 transition-all duration-200"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Controller
                    name="tripDetails.totalTravelers.children"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="children"
                        type="number"
                          min={travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs]?.minChildren || 0}
                          max={travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs]?.maxChildren || 10}
                        placeholder="0"
                        disabled={disabled}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                            const config = travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs];
                            const clampedValue = Math.max(config.minChildren, Math.min(config.maxChildren, value));
                            field.onChange(clampedValue);
                        }}
                        className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--secondary)] focus:ring-[var(--secondary)]/20 transition-all duration-200 text-center text-lg font-semibold"
                      />
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = form.watch('tripDetails.totalTravelers.children') || 0;
                        const config = travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs];
                        if (current < config.maxChildren) {
                      form.setValue('tripDetails.totalTravelers.children', current + 1);
                        }
                    }}
                      disabled={disabled || (form.watch('tripDetails.totalTravelers.children') || 0) >= (travelerConfigs[selectedTravelerType as keyof typeof travelerConfigs]?.maxChildren || 10)}
                    className="h-12 w-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--secondary)]/30 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.formState.errors.tripDetails?.totalTravelers?.children && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.tripDetails.totalTravelers.children.message}
                  </p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  Children are travelers under 18 years old
                </p>
              </div>
            </div>

            {/* Total Travelers Summary */}
            {((form.watch('tripDetails.totalTravelers.adults') || 0) + (form.watch('tripDetails.totalTravelers.children') || 0)) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/10 rounded-2xl border border-[var(--accent)]/20"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[var(--accent-foreground)]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[var(--accent-foreground)]">
                    Total Travelers: {(form.watch('tripDetails.totalTravelers.adults') || 0) + (form.watch('tripDetails.totalTravelers.children') || 0)}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {form.watch('tripDetails.totalTravelers.adults') || 0} adults, {form.watch('tripDetails.totalTravelers.children') || 0} children
                  </div>
                </div>
                <Badge variant="outline" className="bg-[var(--accent)]/20 text-[var(--accent-foreground)] border-[var(--accent)]/30">
                  {(form.watch('tripDetails.totalTravelers.adults') || 0) + (form.watch('tripDetails.totalTravelers.children') || 0)} total
                </Badge>
              </motion.div>
            )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Grouping - Only show for Group type */}
      {selectedTravelerType === 'group' && (form.watch('tripDetails.totalTravelers.adults') || 0) + (form.watch('tripDetails.totalTravelers.children') || 0) > 1 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gradient-to-br from-[var(--card)] via-[var(--card)]/95 to-[var(--background)]/30 border border-[var(--border)] rounded-3xl shadow-lg overflow-hidden backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-4 text-[var(--card-foreground)]">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--secondary-600)]/20 to-[var(--secondary-600)]/10 flex items-center justify-center border border-[var(--secondary-600)]/30 shadow-sm">
                  <Group className="h-6 w-6 text-[var(--secondary-600)]" />
                </div>
                <div>
                  <div className="text-xl font-bold">Travel Groups</div>
                  <div className="text-sm font-normal text-[var(--muted-foreground)] mt-1">
                    Organize travelers into groups for different preferences and booking requirements
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--muted)]/20 to-[var(--muted)]/10 rounded-2xl border border-[var(--muted)]/20">
                <div className="flex items-center gap-3">
                  <Switch
                    id="useSubgroups"
                    checked={useSubgroups}
                    onCheckedChange={(checked) => {
                      form.setValue('tripDetails.useSubgroups', checked);
                      if (!checked) {
                        // Clear groups when disabling subgroups
                        form.setValue('tripDetails.groups', []);
                        toast.success('Groups cleared - using single booking');
                      }
                    }}
                    disabled={disabled}
                  />
                  <div>
                    <Label htmlFor="useSubgroups" className="text-sm font-semibold text-[var(--foreground)]">
                      Enable travel subgroups
                    </Label>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Create separate groups for different booking preferences, budgets, or travel styles
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 px-3 py-1">
                  {(form.watch('tripDetails.totalTravelers.adults') || 0) + (form.watch('tripDetails.totalTravelers.children') || 0)} travelers
                </Badge>
              </div>

              {useSubgroups && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                      Travel Groups
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const totalAdults = form.watch('tripDetails.totalTravelers.adults') || 0;
                          const totalChildren = form.watch('tripDetails.totalTravelers.children') || 0;
                          
                          if (totalAdults + totalChildren > 1) {
                            const newGroups: TravelerGroup[] = [];
                            
                            // Intelligent group creation based on traveler composition
                            if (totalAdults > 0 && totalChildren > 0) {
                              // Mixed group - create separate groups
                              newGroups.push({
                                id: `group_${Date.now()}_adults`,
                                name: 'Adults Group',
                                adults: totalAdults,
                                children: 0,
                                childAges: [],
                                travelerNames: Array.from({ length: totalAdults }, (_, i) => ({
                                  name: `Adult ${i + 1}`,
                                  type: 'adult' as const,
                                })),
                                notes: 'Adult travelers group',
                              });
                              newGroups.push({
                                id: `group_${Date.now()}_children`,
                                name: 'Children Group',
                                adults: 0,
                                children: totalChildren,
                                childAges: Array.from({ length: totalChildren }, (_, i) => 10 + i),
                                travelerNames: Array.from({ length: totalChildren }, (_, i) => ({
                                  name: `Child ${i + 1}`,
                                  type: 'child' as const,
                                  age: 10 + i,
                                })),
                                notes: 'Children travelers group',
                              });
                            } else if (totalAdults > 1) {
                              // Multiple adults - create groups of 2-3
                              const groupSize = totalAdults <= 6 ? 2 : 3;
                              const groupCount = Math.ceil(totalAdults / groupSize);
                              for (let i = 0; i < groupCount; i++) {
                                const groupAdults = Math.min(groupSize, totalAdults - (i * groupSize));
                                newGroups.push({
                                  id: `group_${Date.now()}_${i}`,
                                  name: `Group ${i + 1}`,
                                  adults: groupAdults,
                                  children: 0,
                                  childAges: [],
                                  travelerNames: Array.from({ length: groupAdults }, (_, j) => ({
                                    name: `Adult ${(i * groupSize) + j + 1}`,
                                    type: 'adult' as const,
                                  })),
                                  notes: `Travel group ${i + 1}`,
                                });
                              }
                            } else if (totalChildren > 1) {
                              // Multiple children - create groups by age
                              const childAges = Array.from({ length: totalChildren }, (_, i) => 10 + i);
                              const olderChildren = childAges.filter(age => age >= 12).length;
                              const youngerChildren = childAges.filter(age => age < 12).length;
                              
                              if (olderChildren > 0) {
                                newGroups.push({
                                  id: `group_${Date.now()}_older`,
                                  name: 'Older Children',
                                  adults: 0,
                                  children: olderChildren,
                                  childAges: childAges.filter(age => age >= 12),
                                  travelerNames: childAges
                                    .map((age, index) => ({ age, index }))
                                    .filter(({ age }) => age >= 12)
                                    .map(({ index }) => ({
                                      name: `Child ${index + 1}`,
                                      type: 'child' as const,
                                      age: childAges[index],
                                    })),
                                  notes: 'Children 12+ years old',
                                });
                              }
                              
                              if (youngerChildren > 0) {
                                newGroups.push({
                                  id: `group_${Date.now()}_younger`,
                                  name: 'Younger Children',
                                  adults: 0,
                                  children: youngerChildren,
                                  childAges: childAges.filter(age => age < 12),
                                  travelerNames: childAges
                                    .map((age, index) => ({ age, index }))
                                    .filter(({ age }) => age < 12)
                                    .map(({ index }) => ({
                                      name: `Child ${index + 1}`,
                                      type: 'child' as const,
                                      age: childAges[index],
                                    })),
                                  notes: 'Children under 12 years old',
                                });
                              }
                            }
                            
                            form.setValue('tripDetails.groups', newGroups);
                            toast.success(`Created ${newGroups.length} intelligent groups based on your travelers`);
                          }
                        }}
                        disabled={disabled}
                        className="h-9 px-3 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/30 transition-all duration-200 text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Smart Create
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddGroup}
                        disabled={disabled}
                        className="h-9 px-3 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/30 transition-all duration-200 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Group
                      </Button>
                    </div>
                  </div>

                  {/* Group Validation Status */}
                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        hasValidGroups ? "bg-green-500/20 text-green-600" : "bg-orange-500/20 text-orange-600"
                      )}>
                        {hasValidGroups ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <h5 className="font-semibold text-[var(--foreground)]">
                          {hasValidGroups ? 'Groups Validated' : 'Group Validation Required'}
                        </h5>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {hasValidGroups 
                            ? 'All travelers are properly assigned to groups' 
                            : 'Please ensure all travelers are assigned to groups'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Group Summary */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)]/50">
                        <span className="text-[var(--muted-foreground)]">Total Adults:</span>
                        <span className="font-semibold text-[var(--foreground)]">{totalAdults}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)]/50">
                        <span className="text-[var(--muted-foreground)]">Total Children:</span>
                        <span className="font-semibold text-[var(--foreground)]">{totalChildren}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)]/50">
                        <span className="text-[var(--muted-foreground)]">Groups Created:</span>
                        <span className="font-semibold text-[var(--foreground)]">{(groups || []).length}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)]/50">
                        <span className="text-[var(--muted-foreground)]">Status:</span>
                        <Badge variant={hasValidGroups ? "default" : "secondary"} className="text-xs">
                          {hasValidGroups ? 'Ready' : 'Incomplete'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Groups List */}
                  <div className="space-y-3">
                    {(groups || []).map((group, index) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/30 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                              <Group className="h-4 w-4 text-[var(--primary)]" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-[var(--foreground)]">{group.name}</h5>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {(group.adults || 0) + (group.children || 0)} travelers
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGroup(group.id)}
                              disabled={disabled}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateGroup(group.id)}
                              disabled={disabled}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveGroup(group.id)}
                              disabled={disabled}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-[var(--primary)]" />
                            <span className="text-[var(--muted-foreground)]">Adults:</span>
                            <span className="font-medium text-[var(--foreground)]">{group.adults || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-[var(--secondary)]" />
                            <span className="text-[var(--muted-foreground)]">Children:</span>
                            <span className="font-medium text-[var(--foreground)]">{group.children || 0}</span>
                          </div>
                        </div>
                        
                        {group.notes && (
                          <div className="mt-3 p-2 rounded-lg bg-[var(--muted)]/30">
                            <p className="text-xs text-[var(--muted-foreground)]">{group.notes}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Status Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex justify-between items-center pt-8"
      >
        <div className="text-sm text-[var(--muted-foreground)] flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              Trip details complete - ready for next step
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Please fill in all required trip details
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isComplete && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 px-3 py-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Group Form Modal */}
      {showGroupForm && (
        <GroupFormModal
          group={editingGroupId ? groups.find(g => g.id === editingGroupId) : undefined}
          onSave={handleUpdateGroup}
          onCancel={handleCancelEdit}
          disabled={disabled}
        />
      )}
    </motion.div>
  );
}

// Group Form Modal Component
interface GroupFormModalProps {
  group?: TravelerGroup;
  onSave: (groupId: string, updates: Partial<TravelerGroup>) => void;
  onCancel: () => void;
  disabled?: boolean;
}

function GroupFormModal({ group, onSave, onCancel, disabled }: GroupFormModalProps) {
  const [formData, setFormData] = useState<TravelerGroup>(
    group || {
      id: `group_${Date.now()}`,
      name: '',
      adults: 1,
      children: 0,
      childAges: [],
      travelerNames: [{ name: 'Adult 1', type: 'adult' as const }],
      notes: '',
    }
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Smart traveler name generation
  const generateTravelerNames = (adults: number, children: number, childAges: number[]) => {
    const names: Array<{ name: string; type: 'adult' | 'child'; age?: number }> = [];
    
    // Generate adult names
    for (let i = 0; i < adults; i++) {
      names.push({
        name: `Adult ${i + 1}`,
        type: 'adult' as const,
      });
    }
    
    // Generate child names with ages
    for (let i = 0; i < children; i++) {
      names.push({
        name: `Child ${i + 1}`,
        type: 'child' as const,
        age: childAges[i] || 10 + i,
      });
    }
    
    return names;
  };

  const handleSave = () => {
    // Validation
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }
    
    if (formData.adults + formData.children === 0) {
      newErrors.travelers = 'At least one traveler is required';
    }
    
    if (formData.children > 0 && formData.childAges.length !== formData.children) {
      newErrors.childAges = 'All children must have ages specified';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Generate traveler names if not already set
    const updatedFormData = {
      ...formData,
      travelerNames: formData.travelerNames.length === 0 
        ? generateTravelerNames(formData.adults, formData.children, formData.childAges)
        : formData.travelerNames
    };
    
    onSave(formData.id, updatedFormData);
  };

  const handleAdultChange = (newAdultCount: number) => {
    if (newAdultCount < 0) return;
    
    const newChildAges = [...formData.childAges];
    const newTravelerNames = [...formData.travelerNames];
    
    // Update adult names
    const currentAdults = newTravelerNames.filter(t => t.type === 'adult').length;
    if (newAdultCount > currentAdults) {
      // Add new adults
      for (let i = currentAdults; i < newAdultCount; i++) {
        newTravelerNames.push({
          name: `Adult ${i + 1}`,
          type: 'adult' as const,
        });
      }
    } else if (newAdultCount < currentAdults) {
      // Remove excess adults
      const adultsToKeep = newTravelerNames.filter(t => t.type === 'adult').slice(0, newAdultCount);
      const childrenToKeep = newTravelerNames.filter(t => t.type === 'child');
      newTravelerNames.splice(0, newTravelerNames.length, ...adultsToKeep, ...childrenToKeep);
    }
    
    setFormData({
      ...formData,
      adults: newAdultCount,
      travelerNames: newTravelerNames,
    });
    
    // Clear validation errors
    if (errors.travelers) {
      setErrors({ ...errors, travelers: undefined });
    }
  };

  const handleChildChange = (newChildCount: number) => {
    if (newChildCount < 0) return;
    
    const newChildAges = [...formData.childAges];
    const newTravelerNames = [...formData.travelerNames];
    
    // Update child ages array
    if (newChildCount > newChildAges.length) {
      // Add new child ages
      for (let i = newChildAges.length; i < newChildCount; i++) {
        newChildAges.push(10 + i);
      }
    } else if (newChildCount < newChildAges.length) {
      // Remove excess child ages
      newChildAges.splice(newChildCount);
    }
    
    // Update child names
    const currentChildren = newTravelerNames.filter(t => t.type === 'child').length;
    if (newChildCount > currentChildren) {
      // Add new children
      for (let i = currentChildren; i < newChildCount; i++) {
        newTravelerNames.push({
          name: `Child ${i + 1}`,
          type: 'child' as const,
          age: newChildAges[i],
        });
      }
    } else if (newChildCount < currentChildren) {
      // Remove excess children
      const adultsToKeep = newTravelerNames.filter(t => t.type === 'adult');
      const childrenToKeep = newTravelerNames.filter(t => t.type === 'child').slice(0, newChildCount);
      newTravelerNames.splice(0, newTravelerNames.length, ...adultsToKeep, ...childrenToKeep);
    }
    
    setFormData({
      ...formData,
      children: newChildCount,
      childAges: newChildAges,
      travelerNames: newTravelerNames,
    });
    
    // Clear validation errors
    if (errors.travelers || errors.childAges) {
      setErrors({ ...errors, travelers: undefined, childAges: undefined });
    }
  };

  const updateTravelerName = (index: number, name: string) => {
    const newTravelerNames = [...formData.travelerNames];
    newTravelerNames[index] = { ...newTravelerNames[index], name };
    setFormData({ ...formData, travelerNames: newTravelerNames });
  };

  const updateChildAge = (index: number, age: number) => {
    if (age < 0 || age > 17) return;
    
    const newChildAges = [...formData.childAges];
    newChildAges[index] = age;
    
    // Update corresponding traveler name age
    const newTravelerNames = [...formData.travelerNames];
    const childTravelers = newTravelerNames.filter(t => t.type === 'child');
    if (childTravelers[index]) {
      childTravelers[index].age = age;
    }
    
    setFormData({
      ...formData,
      childAges: newChildAges,
      travelerNames: newTravelerNames,
    });
    
    // Clear validation errors
    if (errors.childAges) {
      setErrors({ ...errors, childAges: undefined });
    }
  };

  const totalTravelers = formData.adults + formData.children;
  const isGroupValid = formData.name.trim() && totalTravelers > 0 && 
    (formData.children === 0 || formData.childAges.length === formData.children);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[var(--background)] rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-[var(--border)] shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[var(--foreground)]">
            {group ? 'Edit Group' : 'New Travel Group'}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-semibold text-[var(--foreground)]">
              Group Name *
            </Label>
            <Input
              id="groupName"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              placeholder="e.g., London Departure Group, Family Group, Business Travelers"
              disabled={disabled}
              className={cn(
                "h-12 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20",
                errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              )}
            />
            {errors.name && (
              <p className="text-red-500 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Group Summary */}
          {totalTravelers > 0 && (
            <div className="p-4 bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/10 rounded-2xl border border-[var(--accent)]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-[var(--accent-foreground)]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[var(--accent-foreground)]">
                    Group Summary: {totalTravelers} total travelers
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {formData.adults} adults, {formData.children} children
                  </div>
                </div>
                <Badge variant="outline" className="bg-[var(--accent)]/20 text-[var(--accent-foreground)] border-[var(--accent)]/30">
                  {totalTravelers} total
                </Badge>
              </div>
            </div>
          )}

          {/* Traveler Counts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--primary)]" />
                Adults
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdultChange(Math.max(0, formData.adults - 1))}
                  disabled={disabled || formData.adults <= 0}
                  className="h-12 w-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/30 transition-all duration-200"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  disabled={disabled}
                  value={formData.adults}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    handleAdultChange(value);
                  }}
                  className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 transition-all duration-200 text-center text-lg font-semibold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdultChange(formData.adults + 1)}
                  disabled={disabled}
                  className="h-12 w-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/30 transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Adults are travelers 18 years and older
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--secondary)]" />
                Children
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleChildChange(Math.max(0, formData.children - 1))}
                  disabled={disabled || formData.children <= 0}
                  className="h-12 w-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--secondary)]/30 transition-all duration-200"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  disabled={disabled}
                  value={formData.children}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    handleChildChange(value);
                  }}
                  className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--secondary)] focus:ring-[var(--secondary)]/20 transition-all duration-200 text-center text-lg font-semibold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleChildChange(formData.children + 1)}
                  disabled={disabled}
                  className="h-12 w-12 rounded-xl border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:border-[var(--secondary)]/30 transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Children are travelers under 18 years old
              </p>
            </div>
          </div>

          {/* Validation Error for Travelers */}
          {errors.travelers && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.travelers}
              </p>
            </div>
          )}

          {/* Child Ages */}
          {formData.children > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--secondary)]" />
                Child Ages
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: formData.children }, (_, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-xs text-[var(--muted-foreground)]">
                      Child {index + 1} Age
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="17"
                      placeholder="10"
                      disabled={disabled}
                      value={formData.childAges[index] || ''}
                      onChange={(e) => {
                        const age = parseInt(e.target.value) || 0;
                        updateChildAge(index, age);
                      }}
                      className="h-10 rounded-lg border-[var(--border)] bg-[var(--background)] focus:border-[var(--secondary)] focus:ring-[var(--secondary)]/20"
                    />
                  </div>
                ))}
              </div>
              {errors.childAges && (
                <p className="text-red-500 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.childAges}
                </p>
              )}
            </div>
          )}

          {/* Traveler Names */}
          {formData.travelerNames.length > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--primary)]" />
                Traveler Names
              </Label>
              <div className="space-y-3">
                {formData.travelerNames.map((traveler, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-[var(--muted)]/10 rounded-xl">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold",
                      traveler.type === 'adult' 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-green-100 text-green-700"
                    )}>
                      {traveler.type === 'adult' ? 'A' : 'C'}
                    </div>
                    <div className="flex-1">
                      <Input
                        value={traveler.name}
                        onChange={(e) => updateTravelerName(index, e.target.value)}
                        placeholder={`${traveler.type === 'adult' ? 'Adult' : 'Child'} ${index + 1} name`}
                        disabled={disabled}
                        className="h-9 rounded-lg border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                      />
                    </div>
                    {traveler.type === 'child' && traveler.age && (
                      <Badge variant="outline" className="text-xs">
                        {traveler.age}y
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group Notes */}
          <div className="space-y-2">
            <Label htmlFor="groupNotes" className="text-sm font-semibold text-[var(--foreground)]">
              Group Notes (Optional)
            </Label>
            <Textarea
              id="groupNotes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requirements or preferences for this group..."
              disabled={disabled}
              className="min-h-[80px] rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={disabled}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={disabled || !isGroupValid}
            className="rounded-xl"
          >
            {group ? 'Update Group' : 'Create Group'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
} 