'use client';

import { useState, useEffect } from 'react';

interface Recipe {
  id: string;
  title: string;
  category: string;
  servings?: number;
  image_url?: string;
}

interface StoreItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
}

interface SideItem {
  type: 'recipe' | 'store_item';
  recipe_id?: string;
  store_item_id?: string;
  servings: number;
}

interface MealPlan {
  id: string;
  meal_date: string;
  meal_type: string;
  recipe_id?: string;
  store_item_id?: string;
  servings: number;
  notes?: string;
  recipe?: Recipe;
  store_item?: StoreItem;
  sides?: any[];
}

interface EditMealModalProps {
  mealPlan: MealPlan;
  onClose: (saved: boolean) => void;
}

export default function EditMealModal({ mealPlan, onClose }: EditMealModalProps) {
  const [step, setStep] = useState<'main' | 'sides'>('main');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemType, setItemType] = useState<'recipe' | 'store_item'>('recipe');

  // Main dish selection - Initialize from existing meal
  const [mainType, setMainType] = useState<'recipe' | 'store_item'>(
    mealPlan.recipe_id ? 'recipe' : 'store_item'
  );
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(mealPlan.recipe_id || '');
  const [selectedStoreItemId, setSelectedStoreItemId] = useState<string>(mealPlan.store_item_id || '');
  const [servings, setServings] = useState(mealPlan.servings);
  const [notes, setNotes] = useState(mealPlan.notes || '');
  const [mealDate, setMealDate] = useState(mealPlan.meal_date);
  const [mealType, setMealType] = useState(mealPlan.meal_type);

  // Sides selection - Initialize from existing sides
  const [sides, setSides] = useState<SideItem[]>([]);

  useEffect(() => {
    fetchItems();
    initializeSides();
  }, []);

  const initializeSides = () => {
    if (mealPlan.sides && mealPlan.sides.length > 0) {
      const initialSides = mealPlan.sides.map((side: any) => ({
        type: side.recipe_id ? 'recipe' as const : 'store_item' as const,
        recipe_id: side.recipe_id || undefined,
        store_item_id: side.store_item_id || undefined,
        servings: side.servings || mealPlan.servings,
      }));
      setSides(initialSides);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [recipesRes, storeItemsRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/store-items'),
      ]);

      if (recipesRes.ok) {
        const recipesData = await recipesRes.json();
        setRecipes(recipesData);
      }

      if (storeItemsRes.ok) {
        const storeItemsData = await storeItemsRes.json();
        setStoreItems(storeItemsData);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    const items = itemType === 'recipe' ? recipes : storeItems;
    if (!searchQuery) return items;

    return items.filter((item) => {
      const name = 'title' in item ? item.title : item.name;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  const handleMainNext = () => {
    if ((mainType === 'recipe' && !selectedRecipeId) ||
        (mainType === 'store_item' && !selectedStoreItemId)) {
      alert('Please select a main dish');
      return;
    }
    setStep('sides');
  };

  const handleAddSide = (id: string) => {
    const newSide: SideItem = {
      type: itemType,
      recipe_id: itemType === 'recipe' ? id : undefined,
      store_item_id: itemType === 'store_item' ? id : undefined,
      servings: servings,
    };
    setSides([...sides, newSide]);
  };

  const handleRemoveSide = (index: number) => {
    setSides(sides.filter((_, i) => i !== index));
  };

  const getSideName = (side: SideItem) => {
    if (side.type === 'recipe') {
      const recipe = recipes.find((r) => r.id === side.recipe_id);
      return recipe?.title || 'Unknown';
    } else {
      const item = storeItems.find((s) => s.id === side.store_item_id);
      return `${item?.name || 'Unknown'}${item?.brand ? ` (${item.brand})` : ''}`;
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/meal-plans/${mealPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meal_date: mealDate,
          meal_type: mealType,
          recipe_id: mainType === 'recipe' ? selectedRecipeId : null,
          store_item_id: mainType === 'store_item' ? selectedStoreItemId : null,
          servings,
          notes: notes || null,
          sides: sides.map((side) => ({
            recipe_id: side.recipe_id || null,
            store_item_id: side.store_item_id || null,
            servings: side.servings,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to update meal plan');

      onClose(true);
    } catch (error) {
      console.error('Error updating meal plan:', error);
      alert('Failed to update meal plan');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getCurrentMainName = () => {
    if (mainType === 'recipe') {
      const recipe = recipes.find(r => r.id === selectedRecipeId);
      return recipe?.title || 'Select a recipe';
    } else {
      const item = storeItems.find(s => s.id === selectedStoreItemId);
      return item ? `${item.name}${item.brand ? ` (${item.brand})` : ''}` : 'Select a store item';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'main' ? 'Edit Main Dish' : 'Edit Side Dishes'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {formatDate(mealDate)} • {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </p>
        </div>

        <div className="p-6">
          {step === 'main' ? (
            // STEP 1: Edit Main Dish
            <div className="space-y-4">
              {/* Date & Meal Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Type
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              </div>

              {/* Type Selection */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setMainType('recipe')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    mainType === 'recipe'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Recipe
                </button>
                <button
                  onClick={() => setMainType('store_item')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    mainType === 'store_item'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Store Item
                </button>
              </div>

              {/* Current Selection Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">
                  Current: {getCurrentMainName()}
                </p>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder={`Search ${mainType === 'recipe' ? 'recipes' : 'store items'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Items List */}
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : mainType === 'recipe' ? (
                  <div className="divide-y">
                    {getFilteredItems().map((recipe: any) => (
                      <label
                        key={recipe.id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="main-recipe"
                          value={recipe.id}
                          checked={selectedRecipeId === recipe.id}
                          onChange={(e) => setSelectedRecipeId(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{recipe.title}</div>
                          <div className="text-sm text-gray-500">{recipe.category}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {getFilteredItems().map((item: any) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="main-store-item"
                          value={item.id}
                          checked={selectedStoreItemId === item.id}
                          onChange={(e) => setSelectedStoreItemId(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {item.name} {item.brand && `(${item.brand})`}
                          </div>
                          <div className="text-sm text-gray-500">{item.category}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Servings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servings
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special instructions or modifications..."
                />
              </div>
            </div>
          ) : (
            // STEP 2: Edit Side Dishes
            <div className="space-y-4">              {/* Current Sides */}
              {sides.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Sides:</h3>
                  <div className="space-y-2">
                    {sides.map((side, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg"
                      >
                        <span className="text-sm text-gray-900">
                          {getSideName(side)} ({side.servings} servings)
                        </span>
                        <button
                          onClick={() => handleRemoveSide(index)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Type Selection for Sides */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setItemType('recipe')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    itemType === 'recipe'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Recipe Sides
                </button>
                <button
                  onClick={() => setItemType('store_item')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    itemType === 'store_item'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Store Item Sides
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder={`Search ${itemType === 'recipe' ? 'side recipes' : 'store items'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Available Sides */}
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : itemType === 'recipe' ? (
                  <div className="divide-y">
                    {getFilteredItems()
                      .filter((recipe: any) => 
                        recipe.category === 'side' || 
                        recipe.category === 'salad' || 
                        recipe.category === 'vegetable'
                      )
                      .map((recipe: any) => {
                        const alreadyAdded = sides.some(s => s.recipe_id === recipe.id);
                        return (
                          <div
                            key={recipe.id}
                            className="flex items-center justify-between p-4 hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{recipe.title}</div>
                              <div className="text-sm text-gray-500">{recipe.category}</div>
                            </div>
                            <button
                              onClick={() => handleAddSide(recipe.id)}
                              disabled={alreadyAdded}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                alreadyAdded
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {alreadyAdded ? 'Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="divide-y">
                    {getFilteredItems()
                      .filter((item: any) => 
                        item.category === 'side' || 
                        item.category === 'vegetable' ||
                        item.category === 'frozen'
                      )
                      .map((item: any) => {
                        const alreadyAdded = sides.some(s => s.store_item_id === item.id);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {item.name} {item.brand && `(${item.brand})`}
                              </div>
                              <div className="text-sm text-gray-500">{item.category}</div>
                            </div>
                            <button
                              onClick={() => handleAddSide(item.id)}
                              disabled={alreadyAdded}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                alreadyAdded
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {alreadyAdded ? 'Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 text-center mt-4">
                {sides.length === 0 
                  ? 'No sides added. Click "Save Changes" to continue without sides.' 
                  : `${sides.length} side${sides.length !== 1 ? 's' : ''} selected`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
          {step === 'main' ? (
            <>
              <button
                onClick={() => onClose(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMainNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Next: Sides
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('main')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
