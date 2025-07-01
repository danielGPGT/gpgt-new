import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { CRMService } from '@/lib/crmService';
import type { Client } from '@/types/crm';

interface ClientSelectorProps {
  selectedClientId?: string;
  onClientSelect: (client: Client | null) => void;
  placeholder?: string;
  className?: string;
}

export default function ClientSelector({ 
  selectedClientId, 
  onClientSelect, 
  placeholder = "Select a client...",
  className 
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === selectedClientId);
      setSelectedClient(client || null);
    }
  }, [selectedClientId, clients]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const clientsData = await CRMService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    onClientSelect(client);
    setOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedClient(null);
    onClientSelect(null);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'prospect':
        return 'bg-blue-100 text-blue-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredClients = clients.filter(client => 
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchValue.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchValue.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className={className}>
      <Label className="text-sm font-medium">Client</Label>
      <div className="flex gap-2 mt-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              {selectedClient ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(selectedClient.firstName, selectedClient.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </span>
                    {selectedClient.email && (
                      <span className="text-xs text-muted-foreground">
                        {selectedClient.email}
                      </span>
                    )}
                  </div>
                  <Badge className={`text-xs ${getStatusColor(selectedClient.status)}`}>
                    {selectedClient.status}
                  </Badge>
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search clients..." 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>
                  <div className="p-4 text-center">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No clients found</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        // Navigate to new client form
                        window.open('/crm/new-client', '_blank');
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New Client
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredClients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={`${client.firstName} ${client.lastName} ${client.email || ''} ${client.company || ''}`}
                      onSelect={() => handleClientSelect(client)}
                      className="flex items-center gap-3 p-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(client.firstName, client.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {client.firstName} {client.lastName}
                          </span>
                          <Badge className={`text-xs ${getStatusColor(client.status)}`}>
                            {client.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {client.email && (
                            <span>{client.email}</span>
                          )}
                          {client.email && client.company && ' • '}
                          {client.company && (
                            <span>{client.company}</span>
                          )}
                        </div>
                      </div>
                      {selectedClient?.id === client.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {selectedClient && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearSelection}
          >
            Clear
          </Button>
        )}
      </div>

      {selectedClient && (
        <Card className="mt-3">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(selectedClient.firstName, selectedClient.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {selectedClient.email && <span>{selectedClient.email}</span>}
                    {selectedClient.phone && (
                      <>
                        {selectedClient.email && '•'}
                        <span>{selectedClient.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getStatusColor(selectedClient.status)}`}>
                  {selectedClient.status}
                </Badge>
                {selectedClient.budgetPreference && (
                  <Badge variant="outline" className="text-xs">
                    ${selectedClient.budgetPreference.min.toLocaleString()} - ${selectedClient.budgetPreference.max.toLocaleString()}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 