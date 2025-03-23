import supabase from '../supabase-config';
import { supabaseGet, supabasePost, supabasePut } from '../supabase-api';

export interface Event {
  id: string;
  warranty_id: string;
  event_type: string;
  description?: string;
  date?: string;
  status?: string;
  documents?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventInput {
  warranty_id: string;
  event_type: string;
  description?: string;
  date?: string;
  status?: string;
  documents?: string[];
  notes?: string;
}

/**
 * Get all events for a specific warranty
 * @param warrantyId The ID of the warranty to get events for
 * @returns Array of events
 */
export async function getWarrantyEvents(warrantyId: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('warranty_id', warrantyId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error getting events for warranty ${warrantyId}:`, error);
    return [];
  }
}

/**
 * Get a specific event by ID
 * @param eventId The ID of the event to get
 * @returns The event or null if not found
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error getting event with ID ${eventId}:`, error);
    return null;
  }
}

/**
 * Create a new event
 * @param eventData The event data to create
 * @returns The created event or null if creation failed
 */
export async function createEvent(eventData: EventInput): Promise<Event | null> {
  try {
    // Set created_at and updated_at timestamps
    const now = new Date().toISOString();
    const dataWithTimestamps = {
      ...eventData,
      created_at: now,
      updated_at: now
    };
    
    const { data, error } = await supabase
      .from('events')
      .insert([dataWithTimestamps])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
}

/**
 * Update an existing event
 * @param eventId The ID of the event to update
 * @param eventData The event data to update
 * @returns The updated event or null if update failed
 */
export async function updateEvent(eventId: string, eventData: Partial<EventInput>): Promise<Event | null> {
  try {
    // Update the updated_at timestamp
    const dataWithTimestamp = {
      ...eventData,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('events')
      .update(dataWithTimestamp)
      .eq('id', eventId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating event with ID ${eventId}:`, error);
    return null;
  }
}

/**
 * Delete an event
 * @param eventId The ID of the event to delete
 * @returns True if successful, false otherwise
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting event with ID ${eventId}:`, error);
    return false;
  }
}

/**
 * Get events filtered by status
 * @param status The status to filter by
 * @returns Array of events with the specified status
 */
export async function getEventsByStatus(status: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', status)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error getting events with status ${status}:`, error);
    return [];
  }
}

/**
 * Get events filtered by type
 * @param eventType The event type to filter by
 * @returns Array of events with the specified type
 */
export async function getEventsByType(eventType: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_type', eventType)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error getting events with type ${eventType}:`, error);
    return [];
  }
}

/**
 * Upload a document for an event
 * @param eventId The ID of the event to upload a document for
 * @param file The file to upload
 * @returns The URL of the uploaded document or null if upload failed
 */
export async function uploadEventDocument(eventId: string, file: File): Promise<string | null> {
  try {
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const filePath = `events/${eventId}/${Date.now()}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('warranty_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: publicURL } = supabase.storage
      .from('warranty_documents')
      .getPublicUrl(filePath);
    
    // Update the event with the new document URL
    await updateEventDocuments(eventId, publicURL.publicUrl);
    
    return publicURL.publicUrl;
  } catch (error) {
    console.error(`Error uploading document for event ${eventId}:`, error);
    return null;
  }
}

/**
 * Update an event's documents array with a new document URL
 * @param eventId The ID of the event to update
 * @param documentUrl The URL of the document to add
 * @returns True if successful, false otherwise
 */
async function updateEventDocuments(eventId: string, documentUrl: string): Promise<boolean> {
  try {
    // First get the current documents array
    const { data: event } = await supabase
      .from('events')
      .select('documents')
      .eq('id', eventId)
      .single();
    
    if (!event) return false;
    
    // Create or update the documents array
    const documents = event.documents || [];
    documents.push(documentUrl);
    
    // Update the event with the new documents array
    const { error } = await supabase
      .from('events')
      .update({ 
        documents,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating documents for event ${eventId}:`, error);
    return false;
  }
}

/**
 * Subscribe to events changes for a specific warranty
 * @param warrantyId The ID of the warranty to subscribe to events for
 * @param callback Function to call when events change
 * @returns The subscription that can be used to unsubscribe
 */
export function subscribeToWarrantyEvents(warrantyId: string, callback: (payload: any) => void) {
  const channelName = `warranty-events-${warrantyId}`;
  
  // Subscribe to changes
  const subscription = supabase.channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `warranty_id=eq.${warrantyId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  // Return the subscription for cleanup
  return subscription;
} 