import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - List all meal plans with their sides
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase
      .from('meal_plans')
      .select(`
        *,
        recipe:recipes(id, title, category, image_url),
        store_item:store_items(id, name, brand, category)
      `)
      .order('meal_date', { ascending: true })
      .order('meal_type', { ascending: true });

    // Filter by date range if provided
    if (startDate) {
      query = query.gte('meal_date', startDate);
    }
    if (endDate) {
      query = query.lte('meal_date', endDate);
    }

    const { data: mealPlans, error: mealPlansError } = await query;

    if (mealPlansError) {
      console.error('Supabase error:', mealPlansError);
      return NextResponse.json(
        { error: 'Failed to fetch meal plans' },
        { status: 500 }
      );
    }

    // Fetch sides for each meal plan
    const mealPlanIds = mealPlans.map((mp) => mp.id);
    const { data: sides, error: sidesError } = await supabase
      .from('meal_plan_sides')
      .select(`
        *,
        recipe:recipes(id, title, category, image_url),
        store_item:store_items(id, name, brand, category)
      `)
      .in('meal_plan_id', mealPlanIds);

    if (sidesError) {
      console.error('Sides error:', sidesError);
    }

    // Attach sides to meal plans
    const mealPlansWithSides = mealPlans.map((mp) => ({
      ...mp,
      sides: sides?.filter((s) => s.meal_plan_id === mp.id) || [],
    }));

    return NextResponse.json(mealPlansWithSides);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new meal plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      meal_date,
      meal_type,
      recipe_id,
      store_item_id,
      servings,
      notes,
      sides,
    } = body;

    // Validation
    if (!meal_date || !meal_type) {
      return NextResponse.json(
        { error: 'Meal date and type are required' },
        { status: 400 }
      );
    }

    if (!recipe_id && !store_item_id) {
      return NextResponse.json(
        { error: 'Either recipe or store item is required' },
        { status: 400 }
      );
    }

    // Create meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert({
        meal_date,
        meal_type,
        recipe_id: recipe_id || null,
        store_item_id: store_item_id || null,
        servings: servings || 4,
        notes: notes || null,
      })
      .select()
      .single();

    if (mealPlanError) {
      console.error('Supabase error:', mealPlanError);
      return NextResponse.json(
        { error: 'Failed to create meal plan' },
        { status: 500 }
      );
    }

    // Create sides if provided
    if (sides && sides.length > 0) {
      const sidesData = sides.map((side: any) => ({
        meal_plan_id: mealPlan.id,
        recipe_id: side.recipe_id || null,
        store_item_id: side.store_item_id || null,
        servings: side.servings || servings || 4,
      }));

      const { error: sidesError } = await supabase
        .from('meal_plan_sides')
        .insert(sidesData);

      if (sidesError) {
        console.error('Sides error:', sidesError);
        // Don't fail the whole operation if sides fail
      }
    }

    return NextResponse.json(mealPlan, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
