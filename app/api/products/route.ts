import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase-config';

export async function GET() {
  try {
    // Get products from Supabase
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
    
    // Map IDs to _id for compatibility with frontend
    const productsWithCompatibleIds = data?.map(product => ({
      _id: product.id,
      ...product
    })) || [];
    
    return NextResponse.json({ products: productsWithCompatibleIds });
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Create product in Supabase
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }
    
    // Return with _id for compatibility with frontend
    return NextResponse.json({ 
      product: {
        _id: data.id,
        ...data
      }
    });
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 