import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Users, 
  Plane, 
  Bed, 
  Car, 
  Plus, 
  Trash2, 
  Settings,
  UserPlus,
  Group,
  Search,
  CheckCircle,
  Mail,
  Phone,
  Building2,
  MapPin,
  Sparkles,
  AlertCircle
} from "lucide-react";
import ClientSelector from '@/components/crm/ClientSelector';
import { CRMService } from '@/lib/crmService';
import { Client } from '@/types/crm';
import { TripIntake } from '@/types/trip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Step1TravelerInfoProps {
  disabled?: boolean;
}

export function Step1TravelerInfo({ disabled }: Step1TravelerInfoProps) {
  const form = useFormContext<TripIntake>();
  const [clientMode, setClientMode] = useState<'select' | 'create'>('select');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // Form state for new client creation
  const [newClientData, setNewClientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    notes: ''
  });

  // Auto-fill form when client is selected
  useEffect(() => {
    if (selectedClient) {
      // Set client ID for quote creation
      form.setValue('clientId', selectedClient.id);
      
      // Auto-fill traveler info from client data
      form.setValue('travelerInfo.name', `${selectedClient.firstName} ${selectedClient.lastName}`);
      form.setValue('travelerInfo.email', selectedClient.email || '');
      form.setValue('travelerInfo.phone', selectedClient.phone || '');
      
      if (selectedClient.address) {
        form.setValue('travelerInfo.address.street', selectedClient.address.street || '');
        form.setValue('travelerInfo.address.city', selectedClient.address.city || '');
        form.setValue('travelerInfo.address.state', selectedClient.address.state || '');
        form.setValue('travelerInfo.address.zipCode', selectedClient.address.zipCode || '');
        form.setValue('travelerInfo.address.country', selectedClient.address.country || '');
      }
    }
  }, [selectedClient, form]);

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    if (client) {
      // Set client ID for quote creation
      form.setValue('clientId', client.id);
      
      // Auto-fill traveler info from client data
      const fullName = `${client.firstName} ${client.lastName}`;
      form.setValue('travelerInfo.name', fullName);
      form.setValue('travelerInfo.email', client.email || '');
      form.setValue('travelerInfo.phone', client.phone || '');
      
      console.log('Setting form values for client:', {
        clientId: client.id,
        name: fullName,
        email: client.email,
        phone: client.phone
      });
      
      if (client.address) {
        form.setValue('travelerInfo.address.street', client.address.street || '');
        form.setValue('travelerInfo.address.city', client.address.city || '');
        form.setValue('travelerInfo.address.state', client.address.state || '');
        form.setValue('travelerInfo.address.zipCode', client.address.zipCode || '');
        form.setValue('travelerInfo.address.country', client.address.country || '');
      }
    } else {
      // Clear form when no client is selected
      form.setValue('clientId', '');
      form.setValue('travelerInfo.name', '');
      form.setValue('travelerInfo.email', '');
      form.setValue('travelerInfo.phone', '');
      form.setValue('travelerInfo.address.street', '');
      form.setValue('travelerInfo.address.city', '');
      form.setValue('travelerInfo.address.state', '');
      form.setValue('travelerInfo.address.zipCode', '');
      form.setValue('travelerInfo.address.country', '');
    }
  };

  const handleCreateClient = async () => {
    if (!newClientData.firstName || !newClientData.lastName || !newClientData.email) {
      return;
    }

    setIsCreatingClient(true);
    try {
      const newClient = await CRMService.createClient(newClientData);
      setSelectedClient(newClient);
      handleClientSelect(newClient);
      
      // Force form validation to clear after setting values
      await form.trigger(['travelerInfo.name', 'travelerInfo.email', 'travelerInfo.phone']);
      
      setClientMode('select');
      setNewClientData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        notes: ''
      });
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setIsCreatingClient(false);
    }
  };

  if (disabled) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-card rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-card rounded animate-pulse" />
          <div className="h-32 bg-card rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-card rounded animate-pulse" />
          <div className="h-12 bg-card rounded animate-pulse" />
        </div>
      </div>
    );
  }

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
                onClick={() => setClientMode('select')}
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
                onClick={() => setClientMode('create')}
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
                  <ClientSelector
                    selectedClientId={selectedClient?.id}
                    onClientSelect={handleClientSelect}
                  />
                  
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
                      <Input
                        id="firstName"
                        value={newClientData.firstName}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                        placeholder="Enter first name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-[var(--foreground)]">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={newClientData.lastName}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                        placeholder="Enter last name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newClientData.email}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                        placeholder="Enter email address"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-[var(--foreground)]">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-medium text-[var(--foreground)]">
                        Company (optional)
                      </Label>
                      <Input
                        id="company"
                        value={newClientData.company}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, company: e.target.value }))}
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                        placeholder="Enter company name"
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
                        <Input
                          id="street"
                          value={newClientData.address.street}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))}
                          className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          placeholder="Enter street address"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-[var(--foreground)]">
                          City
                        </Label>
                        <Input
                          id="city"
                          value={newClientData.address.city}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                          className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          placeholder="Enter city"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium text-[var(--foreground)]">
                          State/Province
                        </Label>
                        <Input
                          id="state"
                          value={newClientData.address.state}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                          className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          placeholder="Enter state/province"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zipCode" className="text-sm font-medium text-[var(--foreground)]">
                          ZIP/Postal Code
                        </Label>
                        <Input
                          id="zipCode"
                          value={newClientData.address.zipCode}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, address: { ...prev.address, zipCode: e.target.value } }))}
                          className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          placeholder="Enter ZIP/postal code"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="country" className="text-sm font-medium text-[var(--foreground)]">
                          Country
                        </Label>
                        <Input
                          id="country"
                          value={newClientData.address.country}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, address: { ...prev.address, country: e.target.value } }))}
                          className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-[var(--foreground)]">
                      Notes
                    </Label>
                    <textarea
                      id="notes"
                      value={newClientData.notes}
                      onChange={(e) => setNewClientData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full h-20 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 resize-none"
                      placeholder="Any additional notes about this client..."
                    />
                  </div>
                  
                  <Button
                    onClick={handleCreateClient}
                    disabled={isCreatingClient || !newClientData.firstName || !newClientData.lastName || !newClientData.email}
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