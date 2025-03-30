import supabase from '@/lib/supabase-config';

export interface Event {
  id: string;
  warranty_id?: string;
  event_type: string;
  description: string;
  date: string;
  status?: string;
  documents?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  location?: string;
  color?: string;
}

/**
 * Gets all events
 */
export async function getAllEvents(): Promise<Event[]> {
  try {
    console.log('Fetching all events from Supabase');
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
    
    // Map the Supabase data to the Event interface
    const events = data?.map(event => ({
      ...event,
      title: event.title || event.description,
      startDate: event.date,
      eventType: event.event_type
    })) || [];
    
    console.log(`Retrieved ${events.length} events`);
    return events;
  } catch (error) {
    console.error('Error getting all events:', error);
    return [];
  }
}

/**
 * Gets an event by ID
 * @param id The event ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching event with ID ${id}:`, error);
      return null;
    }
    
    return data as Event;
  } catch (error) {
    console.error(`Error getting event with ID ${id}:`, error);
    return null;
  }
}

/**
 * Creates a new event
 * @param event The event to create
 */
export async function createEvent(event: Partial<Event>): Promise<Event | null> {
  try {
    // Ensure we have the required fields
    if (!event.date || !event.event_type) {
      throw new Error('Event must have a date and event type');
    }
    
    // Set created_at and updated_at
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('events')
      .insert([{
        ...event,
        created_at: now,
        updated_at: now
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }
    
    return data as Event;
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
}

/**
 * Updates an event
 * @param id The event ID
 * @param event The updated event data
 */
export async function updateEvent(id: string, event: Partial<Event>): Promise<Event | null> {
  try {
    // Set updated_at
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('events')
      .update({
        ...event,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating event with ID ${id}:`, error);
      throw error;
    }
    
    return data as Event;
  } catch (error) {
    console.error(`Error updating event with ID ${id}:`, error);
    return null;
  }
}

/**
 * Deletes an event
 * @param id The event ID
 */
export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting event with ID ${id}:`, error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting event with ID ${id}:`, error);
    return false;
  }
}

/**
 * Gets events for a specific warranty
 * @param warrantyId The warranty ID
 */
export async function getEventsByWarranty(warrantyId: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('warranty_id', warrantyId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error(`Error fetching events for warranty ${warrantyId}:`, error);
      throw error;
    }
    
    return data as Event[];
  } catch (error) {
    console.error(`Error getting events for warranty ${warrantyId}:`, error);
    return [];
  }
}

/**
 * Gets upcoming events
 * @param days Number of days to look ahead
 */
export async function getUpcomingEvents(days: number = 30): Promise<Event[]> {
  try {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', now.toISOString())
      .lte('date', future.toISOString())
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
    
    return data as Event[];
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
} 