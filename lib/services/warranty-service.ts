import { supabaseGet, supabasePost, supabasePut, supabaseDelete } from '@/lib/supabase-api';
import supabase from '@/lib/supabase-config';

export interface Warranty {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  provider?: string;
  warranty_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WarrantyInput {
  product_id: string;
  warranty_provider?: string;
  warranty_type?: string;
  start_date?: string;
  end_date?: string;
  duration_months?: number;
  terms?: string;
  documents?: string[];
  contact_info?: Record<string, any>;
}

export interface WarrantyListResponse {
  warranties: Warranty[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WarrantyDetailResponse {
  warranty: Warranty;
}

/**
 * Check if the warranties table exists
 */
export async function checkWarrantiesTable(): Promise<boolean> {
  try {
    // Try to list tables
    const { data, error } = await supabase
      .from('warranties')
      .select('id')
      .limit(1);
    
    // If there's an error, the table likely doesn't exist
    if (error) {
      console.warn('Warranties table does not exist or cannot be accessed');
      console.warn('Error details:', error);
      return false;
    }
    
    // Table exists if we can query it
    return true;
  } catch (error) {
    console.warn('Error checking warranties table:', error);
    return false;
  }
}

/**
 * Gets all warranties with fallback to dummy data if table doesn't exist
 */
export async function getAllWarranties(): Promise<Warranty[]> {
  try {
    console.log('Fetching all warranties from Supabase');
    
    // First, check if the table exists
    const tableExists = await checkWarrantiesTable();
    if (!tableExists) {
      console.log('Warranties table does not exist, returning mock data');
      return getMockWarranties();
    }
    
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching warranties:', error);
      return getMockWarranties();
    }
    
    console.log(`Retrieved ${data?.length || 0} warranties`);
    return data || [];
  } catch (error) {
    console.error('Error getting all warranties:', error);
    return getMockWarranties();
  }
}

/**
 * Gets a warranty by ID with fallback
 * @param id The warranty ID
 */
export async function getWarrantyById(id: string): Promise<Warranty | null> {
  try {
    // First, check if the table exists
    const tableExists = await checkWarrantiesTable();
    if (!tableExists) {
      console.log('Warranties table does not exist, returning mock data');
      const mockWarranties = getMockWarranties();
      return mockWarranties.find(w => w.id === id) || null;
    }
    
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching warranty with ID ${id}:`, error);
      return null;
    }
    
    return data as Warranty;
  } catch (error) {
    console.error(`Error getting warranty with ID ${id}:`, error);
    return null;
  }
}

/**
 * Creates a new warranty with fallback
 * @param warranty The warranty to create
 */
export async function createWarranty(warranty: Partial<Warranty>): Promise<Warranty | null> {
  try {
    // First, check if the table exists
    const tableExists = await checkWarrantiesTable();
    if (!tableExists) {
      console.log('Warranties table does not exist, cannot create warranty');
      return null;
    }
    
    // Ensure we have the required fields
    if (!warranty.name) {
      throw new Error('Warranty must have a name');
    }
    
    // Set created_at and updated_at
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('warranties')
      .insert([{
        ...warranty,
        created_at: now,
        updated_at: now
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating warranty:', error);
      throw error;
    }
    
    return data as Warranty;
  } catch (error) {
    console.error('Error creating warranty:', error);
    return null;
  }
}

/**
 * Gets expiring warranties
 * @param days Number of days to look ahead (default 30)
 */
export async function getExpiringWarranties(days: number = 30): Promise<Warranty[]> {
  try {
    // First, check if the table exists
    const tableExists = await checkWarrantiesTable();
    if (!tableExists) {
      console.log('Warranties table does not exist, returning mock data');
      const mockWarranties = getMockWarranties();
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + days);
      
      return mockWarranties.filter(w => {
        if (!w.end_date) return false;
        const endDate = new Date(w.end_date);
        return endDate >= now && endDate <= future;
      });
    }
    
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);
    
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .gte('end_date', now.toISOString())
      .lte('end_date', future.toISOString())
      .order('end_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching expiring warranties:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting expiring warranties:', error);
    return [];
  }
}

/**
 * Gets warranty statistics
 */
export async function getWarrantyStats(): Promise<{
  total: number;
  active: number;
  expiring: number;
  expired: number;
}> {
  try {
    // First, check if the table exists
    const tableExists = await checkWarrantiesTable();
    if (!tableExists) {
      console.log('Warranties table does not exist, returning mock stats');
      const mockWarranties = getMockWarranties();
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + 30);
      
      const active = mockWarranties.filter(w => {
        if (!w.end_date) return false;
        return new Date(w.end_date) >= now;
      }).length;
      
      const expired = mockWarranties.filter(w => {
        if (!w.end_date) return false;
        return new Date(w.end_date) < now;
      }).length;
      
      const expiring = mockWarranties.filter(w => {
        if (!w.end_date) return false;
        const endDate = new Date(w.end_date);
        return endDate <= future && endDate >= now;
      }).length;
      
      return {
        total: mockWarranties.length,
        active,
        expiring,
        expired
      };
    }
    
    const { data: warranties, error } = await supabase
      .from('warranties')
      .select('*');
    
    if (error) {
      console.error('Error fetching warranties for stats:', error);
      return { total: 0, active: 0, expiring: 0, expired: 0 };
    }
    
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    const active = warranties.filter(w => {
      if (!w.end_date) return false;
      return new Date(w.end_date) >= now;
    }).length;
    
    const expired = warranties.filter(w => {
      if (!w.end_date) return false;
      return new Date(w.end_date) < now;
    }).length;
    
    const expiring = warranties.filter(w => {
      if (!w.end_date) return false;
      const endDate = new Date(w.end_date);
      return endDate <= thirtyDaysFromNow && endDate >= now;
    }).length;
    
    return {
      total: warranties.length,
      active,
      expiring,
      expired
    };
  } catch (error) {
    console.error('Error getting warranty stats:', error);
    return { total: 0, active: 0, expiring: 0, expired: 0 };
  }
}

/**
 * Provides mock warranty data for when the real table doesn't exist
 */
function getMockWarranties(): Warranty[] {
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);
  
  const twoYearsFromNow = new Date(now);
  twoYearsFromNow.setFullYear(now.getFullYear() + 2);
  
  const oneMonthFromNow = new Date(now);
  oneMonthFromNow.setMonth(now.getMonth() + 1);
  
  return [
    {
      id: '1',
      name: 'TV Extended Warranty',
      description: 'Extended warranty for Samsung TV',
      start_date: oneMonthAgo.toISOString(),
      end_date: twoYearsFromNow.toISOString(),
      status: 'active',
      provider: 'Samsung',
      warranty_number: 'TV-12345',
      created_at: oneMonthAgo.toISOString(),
      updated_at: oneMonthAgo.toISOString()
    },
    {
      id: '2',
      name: 'Laptop Protection Plan',
      description: 'Accidental damage protection for MacBook Pro',
      start_date: oneMonthAgo.toISOString(),
      end_date: oneMonthFromNow.toISOString(),
      status: 'expiring',
      provider: 'Apple',
      warranty_number: 'AP-67890',
      created_at: oneMonthAgo.toISOString(),
      updated_at: oneMonthAgo.toISOString()
    },
    {
      id: '3',
      name: 'Refrigerator Warranty',
      description: 'Standard warranty for LG refrigerator',
      start_date: oneMonthAgo.toISOString(),
      end_date: oneMonthAgo.toISOString(), // Already expired
      status: 'expired',
      provider: 'LG',
      warranty_number: 'LG-54321',
      created_at: oneMonthAgo.toISOString(),
      updated_at: oneMonthAgo.toISOString()
    }
  ];
}

// Get a list of warranties
export const getWarranties = async (page = 1, limit = 10): Promise<WarrantyListResponse> => {
  try {
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Get the total count
    const { count, error: countError } = await supabase
      .from('warranties')
      .select('id', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    return {
      warranties: data as Warranty[],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  } catch (error) {
    console.error('Error getting warranties:', error);
    throw error;
  }
};

// Get a specific warranty by ID
export const getWarranty = async (id: string): Promise<WarrantyDetailResponse> => {
  try {
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error(`Warranty with ID ${id} not found`);
    
    return { warranty: data as Warranty };
  } catch (error) {
    console.error(`Error getting warranty with ID ${id}:`, error);
    throw error;
  }
};

// Replace lines 413-436 with this updated function
export const createWarrantyApi = async (warrantyData: WarrantyInput): Promise<WarrantyDetailResponse> => {
  try {
    console.log('Creating warranty via API:', warrantyData);
    const response = await supabasePost<WarrantyDetailResponse>('warranties', warrantyData);
    
    if (!response || !response.warranty) {
      throw new Error('Failed to create warranty');
    }
    
    return response;
  } catch (error) {
    console.error('Error creating warranty:', error);
    throw error;
  }
};

// Update an existing warranty
export const updateWarranty = async (id: string, warrantyData: Partial<WarrantyInput>): Promise<WarrantyDetailResponse> => {
  try {
    const { data, error } = await supabase
      .from('warranties')
      .update({
        ...warrantyData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error(`Warranty with ID ${id} not found`);
    
    return { warranty: data as Warranty };
  } catch (error) {
    console.error(`Error updating warranty with ID ${id}:`, error);
    throw error;
  }
};

// Delete a warranty
export const deleteWarranty = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('warranties')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting warranty with ID ${id}:`, error);
    throw error;
  }
};

// Upload warranty document
export const uploadWarrantyDocument = async (file: File, warrantyId: string): Promise<string> => {
  try {
    const fileName = `${warrantyId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('warranty-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    if (!data) throw new Error('Failed to upload document');
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('warranty-documents')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading warranty document:', error);
    throw error;
  }
};

// Subscribe to warranty changes
export const subscribeToWarrantyChanges = (callback: (payload: any) => void) => {
  const channel = supabase.channel('warranty-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'warranties' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}; 