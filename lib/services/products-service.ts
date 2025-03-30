import supabase from '@/lib/supabase-config';

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  model?: string;
  purchase_date?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Gets all products
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    console.log('Fetching all products from Supabase');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} products`);
    return data || [];
  } catch (error) {
    console.error('Error getting all products:', error);
    return [];
  }
}

/**
 * Gets a product by ID
 * @param id The product ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      return null;
    }
    
    return data as Product;
  } catch (error) {
    console.error(`Error getting product with ID ${id}:`, error);
    return null;
  }
}

/**
 * Creates a new product
 * @param product The product to create
 */
export async function createProduct(product: Partial<Product>): Promise<Product | null> {
  try {
    // Ensure we have the required fields
    if (!product.name) {
      throw new Error('Product must have a name');
    }
    
    // Set created_at and updated_at
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...product,
        created_at: now,
        updated_at: now
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }
    
    return data as Product;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

/**
 * Updates a product
 * @param id The product ID
 * @param product The updated product data
 */
export async function updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
  try {
    // Set updated_at
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('products')
      .update({
        ...product,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating product with ID ${id}:`, error);
      throw error;
    }
    
    return data as Product;
  } catch (error) {
    console.error(`Error updating product with ID ${id}:`, error);
    return null;
  }
}

/**
 * Deletes a product
 * @param id The product ID
 */
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting product with ID ${id}:`, error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting product with ID ${id}:`, error);
    return false;
  }
} 