-- Bayver Recipes Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- RECIPES TABLE
-- ============================================
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('main', 'side', 'dessert', 'breakfast', 'appetizer', 'bread', 'soup', 'salad', 'drink')),
    servings INTEGER DEFAULT 4,
    prep_time TEXT,
    cook_time TEXT,
    instructions TEXT,
    image_url TEXT, -- Cloudflare R2 URL (thumbnail)
    image_url_display TEXT, -- Display size (800px)
    image_url_full TEXT, -- Full resolution
    cuisine TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    is_crockpot BOOLEAN DEFAULT false,
    cost_estimate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);

-- ============================================
-- INGREDIENTS TABLE
-- ============================================
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity DECIMAL(10,2),
    unit TEXT,
    notes TEXT,
    category TEXT CHECK (category IN ('produce', 'meat', 'dairy', 'pantry', 'spices', 'canned', 'frozen', 'other')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for recipe lookup
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);

-- ============================================
-- STORE ITEMS TABLE (Non-recipe items)
-- ============================================
CREATE TABLE store_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('side', 'snack', 'beverage', 'condiment', 'other')),
    walmart_price DECIMAL(10,2),
    last_price_update TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MEAL PLANS TABLE
-- ============================================
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    main_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
    servings INTEGER DEFAULT 4,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for date-based queries
CREATE INDEX idx_meal_plans_date ON meal_plans(date);

-- ============================================
-- MEAL PLAN SIDES TABLE
-- ============================================
CREATE TABLE meal_plan_sides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    store_item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
    servings INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure either recipe_id OR store_item_id is set, but not both
    CHECK (
        (recipe_id IS NOT NULL AND store_item_id IS NULL) OR
        (recipe_id IS NULL AND store_item_id IS NOT NULL)
    )
);

-- Index for meal plan lookup
CREATE INDEX idx_meal_plan_sides_meal_plan_id ON meal_plan_sides(meal_plan_id);

-- ============================================
-- USER FAVORITES TABLE (for future multi-user support)
-- ============================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID, -- Will be populated when auth is added
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recipe_id, user_id)
);

-- ============================================
-- RECIPE RATINGS TABLE (for future features)
-- ============================================
CREATE TABLE recipe_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID, -- Will be populated when auth is added
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recipe_id, user_id)
);

-- ============================================
-- AUTO-UPDATE TIMESTAMP FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to recipes table
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to store_items table
CREATE TRIGGER update_store_items_updated_at BEFORE UPDATE ON store_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Complete recipe view with all ingredients
CREATE VIEW recipes_with_ingredients AS
SELECT
    r.*,
    json_agg(
        json_build_object(
            'id', i.id,
            'name', i.name,
            'quantity', i.quantity,
            'unit', i.unit,
            'notes', i.notes,
            'category', i.category
        ) ORDER BY i.display_order
    ) FILTER (WHERE i.id IS NOT NULL) AS ingredients
FROM recipes r
LEFT JOIN ingredients i ON r.id = i.recipe_id
GROUP BY r.id;

-- Complete meal plan view with all details
CREATE VIEW meal_plans_complete AS
SELECT
    mp.id,
    mp.date,
    mp.meal_type,
    mp.servings as main_servings,
    mp.notes,
    json_build_object(
        'id', r.id,
        'title', r.title,
        'image_url', r.image_url,
        'category', r.category
    ) AS main_recipe,
    json_agg(
        CASE
            WHEN mps.recipe_id IS NOT NULL THEN
                json_build_object(
                    'type', 'recipe',
                    'id', sr.id,
                    'name', sr.title,
                    'image_url', sr.image_url,
                    'servings', mps.servings
                )
            WHEN mps.store_item_id IS NOT NULL THEN
                json_build_object(
                    'type', 'store_item',
                    'id', si.id,
                    'name', si.name,
                    'servings', mps.servings
                )
        END
    ) FILTER (WHERE mps.id IS NOT NULL) AS sides
FROM meal_plans mp
JOIN recipes r ON mp.main_recipe_id = r.id
LEFT JOIN meal_plan_sides mps ON mp.id = mps.meal_plan_id
LEFT JOIN recipes sr ON mps.recipe_id = sr.id
LEFT JOIN store_items si ON mps.store_item_id = si.id
GROUP BY mp.id, mp.date, mp.meal_type, mp.servings, mp.notes, r.id, r.title, r.image_url, r.category;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables (for future auth)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_sides ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll add proper policies when auth is added)
CREATE POLICY "Allow all for now" ON recipes FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON ingredients FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON store_items FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON meal_plans FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON meal_plan_sides FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON favorites FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON recipe_ratings FOR ALL USING (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert sample data

-- INSERT INTO recipes (title, category, servings, prep_time, cook_time, instructions, cuisine, difficulty)
-- VALUES
--     ('Test Meatloaf', 'main', 6, '20 minutes', '1 hour', 'Mix ingredients and bake.', 'american', 'easy'),
--     ('Test Green Beans', 'side', 4, '5 minutes', '10 minutes', 'Steam and season.', 'american', 'easy');

-- INSERT INTO store_items (name, category, walmart_price)
-- VALUES
--     ('Kraft Mac & Cheese', 'side', 1.99),
--     ('Uncle Ben''s Rice', 'side', 2.49);
