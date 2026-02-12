'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';

interface Recipe {
  id: string;
  title: string;
  category: string;
  servings: number;
  image_url: string;
  image_url_display?: string;
  image_url_full?: string;
  prep_time?: string;
  cook_time?: string;
  instructions?: string;
  ingredients: Array<{
    id: string;
    name: string;
    amount: string;
    unit?: string;
  }>;
}

export default function RecipeDetailPage() {
  const params = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchRecipe(params.id as string);
    }
  }, [params.id]);

  const fetchRecipe = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recipes/${id}`);
      if (!response.ok) throw new Error('Failed to fetch recipe');
      const data = await response.json();
      setRecipe(data);
    } catch (error) {
      console.error('Error fetching recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Recipe not found</h1>
        <a href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to recipes
        </a>
      </div>
    );
  }

  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <a href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to recipes
      </a>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Recipe Header */}
        <div className="relative h-96">
          <Image
            src={recipe.image_url_display || recipe.image_url || placeholderImage}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-8">
          {/* Title and Meta */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <span className="px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                {recipe.category}
              </span>
              <span className="text-gray-600">Serves {recipe.servings}</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {recipe.title}
            </h1>

            {(recipe.prep_time || recipe.cook_time) && (
              <div className="flex gap-6 text-gray-700">
                {recipe.prep_time && (
                  <div>
                    <span className="font-semibold">Prep time:</span> {recipe.prep_time}
                  </div>
                )}
                {recipe.cook_time && (
                  <div>
                    <span className="font-semibold">Cook time:</span> {recipe.cook_time}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>
                    {ingredient.amount} {ingredient.unit} {ingredient.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          {recipe.instructions && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {recipe.instructions}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-8 pt-6 border-t">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Add to Meal Planner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
