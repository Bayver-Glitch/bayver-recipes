import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - List all store items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = supabase
      .from('store_items')
      .select('*')
      .order('name', { ascending: true });

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Search by name if provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch store items' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new store item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, brand, category, default_amount, unit, estimated_price } = body;

    // Validation
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('store_items')
      .insert({
        name,
        brand,
        category,
        default_amount: default_amount || 1,
        unit,
        estimated_price: estimated_price ? parseFloat(estimated_price) : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create store item' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
