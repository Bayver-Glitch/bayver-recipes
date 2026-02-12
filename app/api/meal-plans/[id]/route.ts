import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Get single meal plan with sides
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select(`
        *,
        recipe:recipes(id, title, category, image_url, servings),
        store_item:store_items(id, name, brand, category)
      `)
      .eq('id', id)
      .single();

    if (mealPlanError) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Fetch sides
    const { data: sides, error: sidesError } = await supabase
      .from('meal_plan_sides')
      .select(`
        *,
        recipe:recipes(id, title, category, image_url),
        store_item:store_items(id, name, brand, category)
      `)
      .eq('meal_plan_id', id);

    if (sidesError) {
      console.error('Sides error:', sidesError);
    }

    return NextResponse.json({
      ...mealPlan,
      sides: sides || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update meal plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      meal_date,
      meal_type,
      servings,
      notes,
      sides,
    } = body;

    // Update meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .update({
        meal_date,
        meal_type,
        servings,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (mealPlanError) {
      console.error('Supabase error:', mealPlanError);
      return NextResponse.json(
        { error: 'Failed to update meal plan' },
        { status: 500 }
      );
    }

    // Update sides if provided
    if (sides !== undefined) {
      // Delete existing sides
      await supabase
        .from('meal_plan_sides')
        .delete()
        .eq('meal_plan_id', id);

      // Insert new sides
      if (sides.length > 0) {
        const sidesData = sides.map((side: any) => ({
          meal_plan_id: id,
          recipe_id: side.recipe_id || null,
          store_item_id: side.store_item_id || null,
          servings: side.servings || servings || 4,
        }));

        await supabase.from('meal_plan_sides').insert(sidesData);
      }
    }

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete meal plan (cascades to sides)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete meal plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
