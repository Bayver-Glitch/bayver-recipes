'use client';

import Image from 'next/image';

interface Recipe {
  id: string;
  title: string;
  category: string;
  servings: number;
  image_url: string;
  prep_time?: string;
  cook_time?: string;
}

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => {
        // TODO: Open recipe modal in Phase 4
        window.location.href = `/recipe/${recipe.id}`;
      }}
    >
      <div className="relative h-48 bg-gray-200">
        <Image
          src={recipe.image_url || placeholderImage}
          alt={recipe.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = placeholderImage;
          }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
            {recipe.category}
          </span>
          <span className="text-sm text-gray-500">
            Serves {recipe.servings}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {recipe.title}
        </h3>

        {(recipe.prep_time || recipe.cook_time) && (
          <div className="flex gap-4 text-sm text-gray-600">
            {recipe.prep_time && (
              <span>⏱️ Prep: {recipe.prep_time}</span>
            )}
            {recipe.cook_time && (
              <span>🔥 Cook: {recipe.cook_time}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
