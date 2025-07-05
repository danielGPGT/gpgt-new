import { supabase } from './supabase';

// Types
export interface Sport {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SportInsert {
  name: string;
}

export interface SportUpdate {
  name?: string;
}

export interface Venue {
  id: string;
  name: string;
  slug?: string;
  country?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  images?: any;
  map_url?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface VenueInsert {
  name: string;
  slug?: string;
  country?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  images?: any;
  map_url?: string;
  website?: string;
}

export interface VenueUpdate {
  name?: string;
  slug?: string;
  country?: string;
  city?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  images?: any;
  map_url?: string;
  website?: string;
}

export interface Event {
  id: string;
  sport_id?: string;
  name: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  venue_id?: string;
  event_image?: any;
  sport?: Sport;
  venue?: Venue;
  created_at: string;
  updated_at: string;
}

export interface EventInsert {
  sport_id?: string;
  name: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  venue_id?: string;
  event_image?: any;
}

export interface EventUpdate {
  sport_id?: string;
  name?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  venue_id?: string;
  event_image?: any;
}

export interface Package {
  id: string;
  event_id?: string;
  name: string;
  slug?: string;
  description?: string;
  base_type?: string;
  active?: boolean;
  package_image?: any;
  event?: Event;
  tiers?: PackageTier[];
  created_at: string;
  updated_at: string;
}

export interface PackageInsert {
  event_id?: string;
  name: string;
  slug?: string;
  description?: string;
  base_type?: string;
  active?: boolean;
  package_image?: any;
}

export interface PackageUpdate {
  event_id?: string;
  name?: string;
  slug?: string;
  description?: string;
  base_type?: string;
  active?: boolean;
  package_image?: any;
}

export interface PackageTier {
  id: string;
  package_id?: string;
  name: string;
  short_label?: string;
  description?: string;
  display_order?: number;
  price_override?: number;
  components?: PackageComponent[];
  created_at: string;
  updated_at: string;
}

export interface PackageTierInsert {
  package_id?: string;
  name: string;
  short_label?: string;
  description?: string;
  display_order?: number;
  price_override?: number;
}

export interface PackageTierUpdate {
  package_id?: string;
  name?: string;
  short_label?: string;
  description?: string;
  display_order?: number;
  price_override?: number;
}

export interface PackageComponent {
  id: string;
  tier_id?: string;
  event_id?: string;
  component_type: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight';
  component_id: string;
  default_quantity?: number;
  price_override?: number;
  notes?: string;
  component_data?: any; // The actual component data (ticket, room, etc.)
  created_at: string;
  updated_at: string;
}

export interface PackageComponentInsert {
  tier_id?: string;
  event_id?: string;
  component_type: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight';
  component_id: string;
  default_quantity?: number;
  price_override?: number;
  notes?: string;
}

export interface PackageComponentUpdate {
  tier_id?: string;
  event_id?: string;
  component_type?: 'ticket' | 'hotel_room' | 'circuit_transfer' | 'airport_transfer' | 'flight';
  component_id?: string;
  default_quantity?: number;
  price_override?: number;
  notes?: string;
}

export interface EventFilters {
  sport_id?: string;
  event_name?: string;
  venue_id?: string;
  date_from?: Date;
  date_to?: Date;
  country?: string;
}

export class PackageManagerService {
  // Sports
  static async getSports(): Promise<Sport[]> {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch sports: ${error.message}`);
    }

    return data || [];
  }

  static async createSport(sport: SportInsert): Promise<Sport> {
    const { data, error } = await supabase
      .from('sports')
      .insert(sport)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sport: ${error.message}`);
    }

    return data;
  }

  static async updateSport(id: string, updates: SportUpdate): Promise<Sport> {
    const { data, error } = await supabase
      .from('sports')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update sport: ${error.message}`);
    }

    return data;
  }

  static async deleteSport(id: string): Promise<void> {
    const { error } = await supabase
      .from('sports')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete sport: ${error.message}`);
    }
  }

  // Venues
  static async getVenues(): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch venues: ${error.message}`);
    }

    return data || [];
  }

  static async createVenue(venue: VenueInsert): Promise<Venue> {
    const { data, error } = await supabase
      .from('venues')
      .insert(venue)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create venue: ${error.message}`);
    }

    return data;
  }

  static async updateVenue(id: string, updates: VenueUpdate): Promise<Venue> {
    const { data, error } = await supabase
      .from('venues')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update venue: ${error.message}`);
    }

    return data;
  }

  static async deleteVenue(id: string): Promise<void> {
    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete venue: ${error.message}`);
    }
  }

  // Events
  static async getEvents(filters?: EventFilters): Promise<Event[]> {
    let query = supabase
      .from('events')
      .select(`
        *,
        sport:sports(*),
        venue:venues(*)
      `)
      .order('start_date', { ascending: false });

    if (filters?.sport_id) {
      query = query.eq('sport_id', filters.sport_id);
    }

    if (filters?.venue_id) {
      query = query.eq('venue_id', filters.venue_id);
    }

    if (filters?.event_name) {
      query = query.ilike('name', `%${filters.event_name}%`);
    }

    if (filters?.date_from) {
      query = query.gte('start_date', filters.date_from.toISOString().split('T')[0]);
    }

    if (filters?.date_to) {
      query = query.lte('end_date', filters.date_to.toISOString().split('T')[0]);
    }

    if (filters?.country) {
      query = query.eq('venue.country', filters.country);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    return data || [];
  }

  static async createEvent(event: EventInsert): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select(`
        *,
        sport:sports(*),
        venue:venues(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }

    return data;
  }

  static async updateEvent(id: string, updates: EventUpdate): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        sport:sports(*),
        venue:venues(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }

    return data;
  }

  static async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }

  // Packages
  static async getPackages(): Promise<Package[]> {
    const { data, error } = await supabase
      .from('packages')
      .select(`
        *,
        event:events(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch packages: ${error.message}`);
    }

    return data || [];
  }

  static async getPackagesByEvent(eventId: string): Promise<Package[]> {
    const { data, error } = await supabase
      .from('packages')
      .select(`
        *,
        event:events(*),
        tiers:package_tiers(
          *,
          components:package_components(*)
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch packages: ${error.message}`);
    }

    // Fetch actual component data for each package component
    if (data) {
      for (const pkg of data) {
        if (pkg.tiers) {
          for (const tier of pkg.tiers) {
            if (tier.components) {
              for (const component of tier.components) {
                try {
                  const componentData = await this.getComponentData(component.component_type, component.component_id);
                  component.component_data = componentData;
                } catch (error) {
                  console.warn(`Failed to fetch component data for ${component.component_type}:${component.component_id}`, error);
                  component.component_data = null;
                }
              }
            }
          }
        }
      }
    }

    return data || [];
  }

  static async createPackage(packageData: PackageInsert): Promise<Package> {
    const { data, error } = await supabase
      .from('packages')
      .insert(packageData)
      .select(`
        *,
        event:events(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create package: ${error.message}`);
    }

    return data;
  }

  static async updatePackage(id: string, updates: PackageUpdate): Promise<Package> {
    const { data, error } = await supabase
      .from('packages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        event:events(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update package: ${error.message}`);
    }

    return data;
  }

  static async deletePackage(id: string): Promise<void> {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete package: ${error.message}`);
    }
  }

  // Package Tiers
  static async createPackageTier(tier: PackageTierInsert): Promise<PackageTier> {
    const { data, error } = await supabase
      .from('package_tiers')
      .insert(tier)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create package tier: ${error.message}`);
    }

    return data;
  }

  static async updatePackageTier(id: string, updates: PackageTierUpdate): Promise<PackageTier> {
    const { data, error } = await supabase
      .from('package_tiers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update package tier: ${error.message}`);
    }

    return data;
  }

  static async deletePackageTier(id: string): Promise<void> {
    const { error } = await supabase
      .from('package_tiers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete package tier: ${error.message}`);
    }
  }

  // Package Components
  static async createPackageComponent(component: PackageComponentInsert): Promise<PackageComponent> {
    const { data, error } = await supabase
      .from('package_components')
      .insert(component)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create package component: ${error.message}`);
    }

    return data;
  }

  static async updatePackageComponent(id: string, updates: PackageComponentUpdate): Promise<PackageComponent> {
    const { data, error } = await supabase
      .from('package_components')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update package component: ${error.message}`);
    }

    return data;
  }

  static async deletePackageComponent(id: string): Promise<void> {
    const { error } = await supabase
      .from('package_components')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete package component: ${error.message}`);
    }
  }

  // Get component data by type and ID
  static async getComponentData(componentType: string, componentId: string): Promise<any> {
    let query;
    
    switch (componentType) {
      case 'ticket':
        query = supabase
          .from('tickets')
          .select(`
            *,
            ticket_category:ticket_categories(category_name)
          `)
          .eq('id', componentId)
          .single();
        break;
        
      case 'hotel_room':
        query = supabase
          .from('hotel_rooms')
          .select(`
            *,
            hotel:gpgt_hotels(name, brand, star_rating)
          `)
          .eq('id', componentId)
          .single();
        break;
        
      case 'circuit_transfer':
        query = supabase
          .from('circuit_transfers')
          .select(`
            *,
            hotel:gpgt_hotels(name, brand, star_rating)
          `)
          .eq('id', componentId)
          .single();
        break;
        
      case 'airport_transfer':
        query = supabase
          .from('airport_transfers')
          .select(`
            *,
            hotel:gpgt_hotels(name, brand, star_rating)
          `)
          .eq('id', componentId)
          .single();
        break;
        
      case 'flight':
        query = supabase
          .from('flights')
          .select('*')
          .eq('id', componentId)
          .single();
        break;

      default:
        throw new Error(`Invalid component type: ${componentType}`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch component data: ${error.message}`);
    }

    return data;
  }

  // Get available components for an event with pricing and related data
  static async getAvailableComponents(eventId: string, componentType: string, hotelId?: string): Promise<any[]> {
    let query;
    
    switch (componentType) {
      case 'ticket':
        // Tickets filtered by event_id and active status
        query = supabase
          .from('tickets')
          .select(`
            *,
            ticket_category:ticket_categories(category_name)
          `)
          .eq('event_id', eventId)
          .eq('active', true)
          .gt('quantity_available', 0); // Only show tickets with availability
        break;
        
      case 'hotel_room':
        // Hotel rooms filtered by event_id only
        query = supabase
          .from('hotel_rooms')
          .select(`
            *,
            hotel:gpgt_hotels(name, brand, star_rating)
          `)
          .eq('event_id', eventId)
          .eq('active', true);
        break;
        
      case 'circuit_transfer':
        // Circuit transfers filtered by event_id and hotel_id
        query = supabase
          .from('circuit_transfers')
          .select(`
            *,
            hotel:gpgt_hotels(name, brand, star_rating)
          `)
          .eq('event_id', eventId)
          .eq('active', true);
        
        if (hotelId) {
          query = query.eq('hotel_id', hotelId);
        }
        break;
        
      case 'airport_transfer':
        // Airport transfers filtered by event_id and hotel_id
        query = supabase
          .from('airport_transfers')
          .select(`
            *,
            hotel:gpgt_hotels(name, brand, star_rating)
          `)
          .eq('event_id', eventId)
          .eq('active', true);
        
        if (hotelId) {
          query = query.eq('hotel_id', hotelId);
        }
        break;
        
      case 'flight':
        // Flights filtered by event_id and active status
        query = supabase
          .from('flights')
          .select('*')
          .eq('event_id', eventId)
          .eq('active', true);
        break;

      default:
        throw new Error(`Invalid component type: ${componentType}`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch available components: ${error.message}`);
    }

    return data || [];
  }
}