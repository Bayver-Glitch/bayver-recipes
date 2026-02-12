// Migration script to transfer recipes from recipes.json to Supabase
// Run with: node migrate-recipes.js

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURATION
// ============================================
// You'll need to set these environment variables:
// SUPABASE_URL=https://your-project.supabase.co
// SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set');
    console.log('\nUsage:');
    console.log('  SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=your-key node migrate-recipes.js');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// CATEGORY MAPPING
// ============================================
const categoryMap = {
    'appetizer': 'appetizer',
    'bread': 'bread',
    'breakfast': 'breakfast',
    'crockpot': 'main', // Crockpot items are typically mains
    'dessert': 'dessert',
    'dinner': 'main',
    'drinks': 'drink',
    'lunch': 'main',
    'salad': 'salad',
    'sides': 'side',
    'soup': 'soup'
};

// ============================================
// HELPER FUNCTIONS
// ============================================
function mapCategory(mealType) {
    return categoryMap[mealType] || 'main';
}

function parseIngredient(ing) {
    // Extract category from existing data
    const category = ing.category || 'other';

    // Parse amount and unit from amount field if present
    let quantity = null;
    let unit = '';

    if (ing.amount) {
        // Try to extract numeric quantity
        const match = ing.amount.match(/^([\d\/½⅓⅔¼¾⅛⅜⅝⅞.]+)\s*(.*)$/);
        if (match) {
            quantity = parseFloat(match[1]) || null;
            unit = match[2].trim();
        } else {
            // No numeric quantity, treat entire amount as unit
            unit = ing.amount;
        }
    }

    return {
        name: ing.name,
        quantity: quantity,
        unit: unit,
        notes: '',
        category: category
    };
}

// ============================================
// MIGRATION FUNCTION
// ============================================
async function migrateRecipes() {
    console.log('🚀 Starting recipe migration...\n');

    // Load recipes.json
    let recipes;
    try {
        const data = fs.readFileSync('./recipes.json', 'utf8');
        recipes = JSON.parse(data);
        console.log(`✅ Loaded ${recipes.length} recipes from recipes.json\n`);
    } catch (error) {
        console.error('❌ Error loading recipes.json:', error.message);
        process.exit(1);
    }

    let successCount = 0;
    let failCount = 0;

    for (const recipe of recipes) {
        console.log(`📝 Migrating: ${recipe.name}...`);

        try {
            // Map meal_type to category
            const category = mapCategory(recipe.tags?.meal_type || recipe.meal_type || 'dinner');

            // Insert recipe
            const { data: insertedRecipe, error: recipeError } = await supabase
                .from('recipes')
                .insert({
                    title: recipe.name,
                    description: '', // Add description if you want
                    category: category,
                    servings: recipe.servings || 4,
                    prep_time: recipe.prep_time || '',
                    cook_time: recipe.cook_time || '',
                    instructions: recipe.directions?.join('\n\n') || '',
                    image_url: recipe.image || null, // We'll handle image optimization later
                    image_url_display: recipe.image || null,
                    image_url_full: recipe.image || null,
                    cuisine: recipe.tags?.cuisine || recipe.cuisine || 'american',
                    difficulty: recipe.tags?.difficulty || recipe.difficulty || 'medium',
                    is_crockpot: recipe.tags?.crockpot || recipe.crockpot || false,
                    cost_estimate: recipe.cost_estimate || null
                })
                .select()
                .single();

            if (recipeError) {
                throw new Error(`Recipe insert failed: ${recipeError.message}`);
            }

            // Insert ingredients
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                const ingredientsToInsert = recipe.ingredients.map((ing, index) => {
                    const parsed = parseIngredient(ing);
                    return {
                        recipe_id: insertedRecipe.id,
                        ...parsed,
                        display_order: index
                    };
                });

                const { error: ingredientsError } = await supabase
                    .from('ingredients')
                    .insert(ingredientsToInsert);

                if (ingredientsError) {
                    console.warn(`  ⚠️  Warning: Some ingredients failed to insert: ${ingredientsError.message}`);
                }
            }

            console.log(`  ✅ Success (${recipe.ingredients?.length || 0} ingredients)`);
            successCount++;

        } catch (error) {
            console.error(`  ❌ Failed: ${error.message}`);
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Migration complete!`);
    console.log(`   Successful: ${successCount}/${recipes.length}`);
    console.log(`   Failed: ${failCount}/${recipes.length}`);
    console.log('='.repeat(50));
}

// ============================================
// RUN MIGRATION
// ============================================
migrateRecipes().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
