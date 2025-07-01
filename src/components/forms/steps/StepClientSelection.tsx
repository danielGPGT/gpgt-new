import React, { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  MapPin,
  Clock,
  Plane,
  Heart,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronsUpDown,
  Plus,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { NewIntake } from '@/types/newIntake';
import { useNewIntakeStore } from '@/store/newIntake';
import { CRMService } from '@/lib/crmService';
import { Client } from '@/types/crm';

interface StepClientSelectionProps {
  disabled?: boolean;
}

export function StepClientSelection({ disabled }: StepClientSelectionProps) {
  const form = useFormContext<NewIntake>();
  const { setClient, setIsNewClient } = useNewIntakeStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [open, setOpen] = useState(false);

  const clientMode = form.watch('isNewClient') ? 'create' : 'select';

  // Search clients
  const searchClients = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await CRMService.searchClients(query);
      // Sort by most recent first (assuming clients have createdAt or updatedAt field)
      const sortedResults = results.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Error searching clients:', error);
      toast.error('Failed to search clients');
    } finally {
      setIsSearching(false);
    }
  };

  // Load initial clients
  const loadInitialClients = async () => {
    setIsSearching(true);
    try {
      // Load recent clients or all clients when no search query
      const results = await CRMService.searchClients(''); // Empty query to get recent/all clients
      // Sort by most recent first
      const sortedResults = results.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle popover open/close
  const handlePopoverChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && searchResults.length === 0) {
      loadInitialClients();
    }
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (value.length >= 2) {
      searchClients(value);
    } else if (value.length === 0) {
      // When search is cleared, load initial clients
      loadInitialClients();
    } else {
      // For single character, still search but with shorter query
      searchClients(value);
    }
  };

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setIsNewClient(false);
    setOpen(false);
    
    // Update form with client data
    const clientData = {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      preferences: {
        language: client.preferences?.language || 'en',
        tone: client.preferences?.tone || 'luxury',
        notes: client.preferences?.notes || '',
      },
      pastTrips: client.pastTrips || [],
    };

    setClient(clientData);
    form.setValue('client', clientData);
    form.setValue('isNewClient', false);
    
    toast.success(`Selected client: ${client.firstName} ${client.lastName}`);
  };

  // Handle new client creation
  const handleCreateClient = async () => {
    const clientData = form.getValues('client');
    
    if (!clientData.firstName || !clientData.lastName || !clientData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreatingClient(true);
    try {
      const newClient = await CRMService.createClient({
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.company,
        address: clientData.address,
        preferences: clientData.preferences,
      });

      setSelectedClient(newClient);
      setClient({
        ...clientData,
        id: newClient.id,
      });
      
      toast.success('Client created successfully!');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    } finally {
      setIsCreatingClient(false);
    }
  };

  // Switch to create mode
  const switchToCreate = () => {
    setIsNewClient(true);
    form.setValue('isNewClient', true);
    setSelectedClient(null);
    setSearchResults([]);
    setSearchQuery('');
    setOpen(false);
  };

  // Switch to select mode
  const switchToSelect = () => {
    setIsNewClient(false);
    form.setValue('isNewClient', false);
    setSelectedClient(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto space-y-8"
    >
      {/* Client Selection Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-b from-[var(--card)]/95 to-[var(--background)]/20 border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-[var(--card-foreground)]">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                <Users className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <div className="text-lg font-semibold">Client Selection</div>
                <div className="text-sm font-normal text-[var(--muted-foreground)]">
                  Choose how to handle client information
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-3">
              <Button
                variant={clientMode === 'select' ? 'default' : 'outline'}
                onClick={() => switchToSelect()}
                className={`flex-1 h-12 rounded-xl transition-all duration-200 ${
                  clientMode === 'select' 
                    ? 'bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-md' 
                    : 'border-[var(--border)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/30'
                }`}
              >
                <Search className="h-4 w-4 mr-2" />
                Select Existing Client
              </Button>
              
              <Button
                variant={clientMode === 'create' ? 'default' : 'outline'}
                onClick={() => switchToCreate()}
                className={`flex-1 h-12 rounded-xl transition-all duration-200 ${
                  clientMode === 'create' 
                    ? 'bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-md' 
                    : 'border-[var(--border)] hover:bg-[var(--accent)] hover:border-[var(--primary)]/30'
                }`}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create New Client
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {clientMode === 'select' ? (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Client Combobox */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[var(--foreground)]">Select Client</Label>
                    <Popover open={open} onOpenChange={handlePopoverChange}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          disabled={disabled}
                        >
                          {selectedClient ? (
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {selectedClient.firstName} {selectedClient.lastName}
                              {selectedClient.company && (
                                <Badge variant="secondary" className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)]">
                                  {selectedClient.company}
                                </Badge>
                              )}
                            </span>
                          ) : (
                            <span className="text-[var(--muted-foreground)]">
                              Search for a client...
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Search by name, email, or company..." 
                            value={searchQuery}
                            onValueChange={handleSearchChange}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="text-center py-6">
                                {searchQuery ? (
                                  <>
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[var(--muted-foreground)]" />
                                    <p className="text-sm text-[var(--muted-foreground)] mb-2">No clients found for "{searchQuery}"</p>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={switchToCreate}
                                      className="flex items-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Create new client
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Users className="w-8 h-8 mx-auto mb-2 text-[var(--muted-foreground)]" />
                                    <p className="text-sm text-[var(--muted-foreground)] mb-2">No clients found</p>
                                    <p className="text-xs text-[var(--muted-foreground)] mb-3">Start typing to search or create a new client</p>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={switchToCreate}
                                      className="flex items-center gap-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Create your first client
                                    </Button>
                                  </>
                                )}
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {isSearching && (
                                <div className="flex items-center justify-center py-4">
                                  <div className="w-4 h-4 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin"></div>
                                </div>
                              )}
                              {searchResults.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={`${client.firstName} ${client.lastName} ${client.email} ${client.company}`}
                                  onSelect={() => handleClientSelect(client)}
                                  className="flex items-center gap-3 p-3"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {client.firstName} {client.lastName}
                                    </div>
                                    <div className="text-sm text-[var(--muted-foreground)] flex items-center gap-4">
                                      {client.email && (
                                        <span className="flex items-center gap-1">
                                          <Mail className="w-3 h-3" />
                                          {client.email}
                                        </span>
                                      )}
                                      {client.phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="w-3 h-3" />
                                          {client.phone}
                                        </span>
                                      )}
                                      {client.company && (
                                        <span className="flex items-center gap-1">
                                          <Building2 className="w-3 h-3" />
                                          {client.company}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <CheckCircle className="w-4 h-4 text-[var(--primary)]" />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Selected Client Info */}
                  {selectedClient && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-[var(--muted)]/40 border border-[var(--border)]"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="h-5 w-5 text-[var(--primary)]" />
                        <span className="font-semibold text-[var(--foreground)]">Selected Client</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[var(--muted-foreground)]" />
                          <span className="text-sm text-[var(--foreground)]">
                            {selectedClient.firstName} {selectedClient.lastName}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[var(--muted-foreground)]" />
                          <span className="text-sm text-[var(--foreground)]">{selectedClient.email}</span>
                        </div>
                        
                        {selectedClient.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-[var(--muted-foreground)]" />
                            <span className="text-sm text-[var(--foreground)]">{selectedClient.phone}</span>
                          </div>
                        )}
                        
                        {selectedClient.company && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[var(--muted-foreground)]" />
                            <span className="text-sm text-[var(--foreground)]">{selectedClient.company}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-[var(--foreground)]">
                        First Name *
                      </Label>
                      <Controller
                        name="client.firstName"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="firstName"
                            placeholder="Enter first name"
                            disabled={disabled}
                            className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          />
                        )}
                      />
                      {form.formState.errors.client?.firstName && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.client.firstName.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-[var(--foreground)]">
                        Last Name *
                      </Label>
                      <Controller
                        name="client.lastName"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="lastName"
                            placeholder="Enter last name"
                            disabled={disabled}
                            className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          />
                        )}
                      />
                      {form.formState.errors.client?.lastName && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.client.lastName.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
                        Email *
                      </Label>
                      <Controller
                        name="client.email"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            disabled={disabled}
                            className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          />
                        )}
                      />
                      {form.formState.errors.client?.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.client.email.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-[var(--foreground)]">
                        Phone
                      </Label>
                      <Controller
                        name="client.phone"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="phone"
                            placeholder="Enter phone number"
                            disabled={disabled}
                            className="h-11 rounded-xl border-[var(--border)] bg-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          />
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-medium text-[var(--foreground)]">
                        Company (optional)
                      </Label>
                      <Controller
                        name="client.company"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="company"
                            placeholder="Enter company name"
                            disabled={disabled}
                            className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator className="bg-[var(--border)]" />
                  
                  <div>
                    <h4 className="text-sm font-medium text-[var(--foreground)] mb-4">Address Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="street" className="text-sm font-medium text-[var(--foreground)]">
                          Street Address
                        </Label>
                        <Controller
                          name="client.address.street"
                          control={form.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="street"
                              placeholder="Enter street address"
                              disabled={disabled}
                              className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-[var(--foreground)]">
                          City
                        </Label>
                        <Controller
                          name="client.address.city"
                          control={form.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="city"
                              placeholder="Enter city"
                              disabled={disabled}
                              className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium text-[var(--foreground)]">
                          State/Province
                        </Label>
                        <Controller
                          name="client.address.state"
                          control={form.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="state"
                              placeholder="Enter state/province"
                              disabled={disabled}
                              className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zipCode" className="text-sm font-medium text-[var(--foreground)]">
                          ZIP/Postal Code
                        </Label>
                        <Controller
                          name="client.address.zipCode"
                          control={form.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="zipCode"
                              placeholder="Enter ZIP/postal code"
                              disabled={disabled}
                              className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="country" className="text-sm font-medium text-[var(--foreground)]">
                          Country
                        </Label>
                        <Controller
                          name="client.address.country"
                          control={form.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="country"
                              placeholder="Enter country"
                              disabled={disabled}
                              className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCreateClient}
                    disabled={isCreatingClient || disabled}
                    className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingClient ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[var(--primary-foreground)]/30 border-t-[var(--primary-foreground)] rounded-full animate-spin" />
                        Creating Client...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Create Client
                      </div>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-between items-center pt-6"
      >
        <div className="text-sm text-[var(--muted-foreground)]">
          {selectedClient ? 'Client selected - ready to proceed' : 'Please select or create a client'}
        </div>
        
        <div className="flex items-center gap-2">
          {selectedClient && (
            <Badge variant="outline" className="bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 