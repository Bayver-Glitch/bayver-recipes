import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ShoppingListItem {
  name: string;
  amount: string;
  unit: string;
  category: string;
  source: string; // Which meals use this ingredient
}

// GET - Generate shopping list from meal plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Fetch meal plans in date range
    const { data: mealPlans, error: mealPlansError } = await supabase
      .from('meal_plans')
      .select(`
        *,
        recipe:recipes(id, title, category, servings),
        store_item:store_items(id, name, brand, category, default_amount, unit)
      `)
      .gte('meal_date', startDate)
      .lte('meal_date', endDate);

    if (mealPlansError) {
      console.error('Meal plans error:', mealPlansError);
      return NextResponse.json(
        { error: 'Failed to fetch meal plans' },
        { status: 500 }
      );
    }

    // Fetch sides for these meal plans
    const mealPlanIds = mealPlans.map((mp) => mp.id);
    const { data: sides, error: sidesError } = await supabase
      .from('meal_plan_sides')
      .select(`
        *,
        recipe:recipes(id, title, category, servings),
        store_item:store_items(id, name, brand, category, default_amount, unit)
      `)
      .in('meal_plan_id', mealPlanIds);

    if (sidesError) {
      console.error('Sides error:', sidesError);
    }

    // Collect all recipe IDs we need ingredients for
    const recipeIds = new Set<string>();
    mealPlans.forEach((mp) => {
      if (mp.recipe_id) recipeIds.add(mp.recipe_id);
    });
    sides?.forEach((side) => {
      if (side.recipe_id) recipeIds.add(side.recipe_id);
    });

    // Fetch ingredients for all recipes
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('ingredients')
      .select('*')
      .in('recipe_id', Array.from(recipeIds));

    if (ingredientsError) {
      console.error('Ingredients error:', ingredientsError);
    }

    // Build shopping list
    const shoppingList: { [key: string]: ShoppingListItem } = {};

    // Helper function to add item to shopping list
    const addToList = (name: string, amount: string, unit: string, category: string, source: string) => {
      const key = `${name.toLowerCase()}_${unit.toLowerCase()}`;
      if (shoppingList[key]) {
        // Aggregate amounts (simple addition for now)
        const existingAmount = parseFloat(shoppingList[key].amount) || 0;
        const newAmount = parseFloat(amount) || 0;
        shoppingList[key].amount = (existingAmount + newAmount).toString();
        shoppingList[key].source += `, ${source}`;
      } else {
        shoppingList[key] = { name, amount, unit, category, source };
      }
    };

    // Process main dishes
    mealPlans.forEach((mp) => {
      if (mp.recipe) {
        // Get ingredients for this recipe
        const recipeIngredients = ingredients?.filter((i) => i.recipe_id === mp.recipe_id) || [];
        const servingMultiplier = mp.servings / (mp.recipe.servings || 1);

        recipeIngredients.forEach((ing) => {
          const adjustedAmount = (parseFloat(ing.amount) || 0) * servingMultiplier;
          addToList(
            ing.name,
            adjustedAmount.toFixed(2),
            ing.unit || '',
            'ingredient',
            mp.recipe.title
          );
        });
      } else if (mp.store_item) {
        // Add store item to list
        addToList(
          `${mp.store_item.name}${mp.store_item.brand ? ` (${mp.store_item.brand})` : ''}`,
          (mp.store_item.default_amount || 1).toString(),
          mp.store_item.unit || 'unit',
          mp.store_item.category,
          `${mp.meal_type} on ${mp.meal_date}`
        );
      }
    });

    // Process sides
    sides?.forEach((side) => {
      const mealPlan = mealPlans.find((mp) => mp.id === side.meal_plan_id);
      if (!mealPlan) return;

      if (side.recipe) {
        const recipeIngredients = ingredients?.filter((i) => i.recipe_id === side.recipe_id) || [];
        const servingMultiplier = side.servings / (side.recipe.servings || 1);

        recipeIngredients.forEach((ing) => {
          const adjustedAmount = (parseFloat(ing.amount) || 0) * servingMultiplier;
          addToList(
            ing.name,
            adjustedAmount.toFixed(2),
            ing.unit || '',
            'ingredient',
            side.recipe.title
          );
        });
      } else if (side.store_item) {
        addToList(
          `${side.store_item.name}${side.store_item.brand ? ` (${side.store_item.brand})` : ''}`,
          (side.store_item.default_amount || 1).toString(),
          side.store_item.unit || 'unit',
          side.store_item.category,
          `Side for ${mealPlan.meal_type} on ${mealPlan.meal_date}`
        );
      }
    });

    // Convert to array and group by category
    const listArray = Object.values(shoppingList);

    // Category grouping
    const categorized: { [key: string]: ShoppingListItem[] } = {
      'Produce': [],
      'Meat & Seafood': [],
      'Dairy & Eggs': [],
      'Pantry': [],
      'Frozen': [],
      'Canned': [],
      'Beverages': [],
      'Other': [],
    };

    listArray.forEach((item) => {
      // Simple category mapping based on keywords
      const name = item.name.toLowerCase();
      const cat = item.category.toLowerCase();

      if (cat.includes('frozen') || name.includes('frozen')) {
        categorized['Frozen'].push(item);
      } else if (cat.includes('canned') || name.includes('canned')) {
        categorized['Canned'].push(item);
      } else if (cat.includes('beverage') || cat.includes('drink')) {
        categorized['Beverages'].push(item);
      } else if (cat.includes('main') || name.includes('chicken') || name.includes('beef') ||
                 name.includes('pork') || name.includes('fish') || name.includes('meat')) {
        categorized['Meat & Seafood'].push(item);
      } else if (name.includes('milk') || name.includes('cheese') || name.includes('butter') ||
                 name.includes('cream') || name.includes('egg') || name.includes('yogurt')) {
        categorized['Dairy & Eggs'].push(item);
      } else if (name.includes('tomato') || name.includes('lettuce') || name.includes('onion') ||
                 name.includes('pepper') || name.includes('carrot') || name.includes('potato')) {
        categorized['Produce'].push(item);
      } else if (cat.includes('condiment') || cat.includes('snack') || name.includes('oil') ||
                 name.includes('flour') || name.includes('sugar') || name.includes('salt')) {
        categorized['Pantry'].push(item);
      } else {
        categorized['Other'].push(item);
      }
    });

    return NextResponse.json({
      startDate,
      endDate,
      mealCount: mealPlans.length + (sides?.length || 0),
      categorized,
      totalItems: listArray.length,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
