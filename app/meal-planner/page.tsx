'use client';

import { useState, useEffect } from 'react';
import AddMealModal from '../components/AddMealModal';
import EditMealModal from '../components/EditMealModal';

interface MealPlan {
  id: string;
  meal_date: string;
  meal_type: string;
  servings: number;
  notes?: string;
  recipe?: {
    id: string;
    title: string;
    category: string;
    image_url: string;
  };
  store_item?: {
    id: string;
    name: string;
    brand?: string;
    category: string;
  };
  sides: Array<{
    id: string;
    recipe?: {
      id: string;
      title: string;
      category: string;
    };
    store_item?: {
      id: string;
      name: string;
      brand?: string;
    };
  }>;
}

export default function MealPlannerPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<string>('dinner');
  const [draggedMeal, setDraggedMeal] = useState<MealPlan | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Current month state
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchMealPlans();
  }, [currentDate]);

  const fetchMealPlans = async () => {
    setLoading(true);
    try {
      const monthRange = getMonthRange(currentDate);
      const params = new URLSearchParams({
        start_date: monthRange.start,
        end_date: monthRange.end,
      });

      const response = await fetch(`/api/meal-plans?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch meal plans');

      const data = await response.json();
      setMealPlans(data);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  };

  const handleAddMeal = (date: string) => {
    setSelectedDate(date);
    setSelectedMealType('dinner');
    setShowModal(true);
  };

  const handleModalClose = (saved: boolean) => {
    setShowModal(false);
    if (saved) {
      fetchMealPlans();
    }
  };

  const handleEditMeal = async (meal: MealPlan) => {
    // Fetch full meal details including sides
    try {
      const response = await fetch(`/api/meal-plans/${meal.id}`);
      if (!response.ok) throw new Error('Failed to fetch meal details');
      
      const fullMeal = await response.json();
      setSelectedMeal(fullMeal);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching meal details:', error);
      alert('Failed to load meal details');
    }
  };

  const handleEditModalClose = (saved: boolean) => {
    setShowEditModal(false);
    setSelectedMeal(null);
    if (saved) {
      fetchMealPlans();
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, meal: MealPlan) => {
    setDraggedMeal(meal);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight opacity to the dragged element
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedMeal(null);
    setDragOverDate(null);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);

    if (!draggedMeal || draggedMeal.meal_date === targetDate) {
      setDraggedMeal(null);
      return; // Same date, no update needed
    }

    // Update the meal plan with the new date
    try {
      const response = await fetch(`/api/meal-plans/${draggedMeal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meal_date: targetDate,
          meal_type: draggedMeal.meal_type,
          recipe_id: draggedMeal.recipe?.id || null,
          store_item_id: draggedMeal.store_item?.id || null,
          servings: draggedMeal.servings,
          notes: draggedMeal.notes,
          sides: draggedMeal.sides?.map(side => ({
            recipe_id: side.recipe?.id || null,
            store_item_id: side.store_item?.id || null,
            servings: draggedMeal.servings,
          })) || [],
        }),
      });

      if (!response.ok) throw new Error('Failed to move meal');

      // Refresh the meal plans
      fetchMealPlans();
      setDraggedMeal(null);
    } catch (error) {
      console.error('Error moving meal:', error);
      alert('Failed to move meal');
      setDraggedMeal(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this meal from your plan?')) return;

    try {
      const response = await fetch(`/api/meal-plans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete meal plan');

      fetchMealPlans();
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      alert('Failed to delete meal plan');
    }
  };

  const getMealsForDate = (date: string) => {
    return mealPlans.filter((mp) => mp.meal_date === date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar grid
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date.toISOString().split('T')[0]);
    }

    return days;
  };

  const calendarDays = getCalendarDays();

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meal Planner</h1>
        <div className="flex gap-3">
          <button
            onClick={goToToday}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('prev')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Month Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">{monthName}</h2>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="px-2 py-3 text-center text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="min-h-32 bg-gray-50"></div>;
              }

              const meals = getMealsForDate(date);
              const today = isToday(date);
              const dayNumber = new Date(date).getDate();

              return (
                <div
                  key={date}
                  onDragOver={(e) => handleDragOver(e, date)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, date)}
                  className={`min-h-32 p-2 hover:bg-gray-50 transition-colors ${
                    today ? 'bg-blue-50' : ''
                  } ${
                    dragOverDate === date ? 'bg-green-100 ring-2 ring-green-400' : ''
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-sm font-semibold ${
                        today
                          ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
                          : 'text-gray-700'
                      }`}
                    >
                      {dayNumber}
                    </span>
                    <button
                      onClick={() => handleAddMeal(date)}
                      className="text-blue-600 hover:text-blue-800 text-lg"
                      title="Add meal"
                    >
                      +
                    </button>
                  </div>

                  {/* Meals */}
                  <div className="space-y-1">
                    {meals.slice(0, 3).map((meal) => (
                      <div
                        key={meal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, meal)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleEditMeal(meal)}
                        className="bg-blue-100 border border-blue-200 rounded px-2 py-1 text-xs group relative cursor-move hover:bg-blue-200 transition-colors"
                        title="Click to edit, drag to move"
                      >
                        <div className="font-medium text-gray-900 truncate">
                          {meal.meal_type === 'breakfast' && '🍳 '}
                          {meal.meal_type === 'lunch' && '🥗 '}
                          {meal.meal_type === 'dinner' && '🍽️ '}
                          {meal.meal_type === 'snack' && '🍪 '}
                          {meal.recipe?.title || meal.store_item?.name}
                        </div>
                        {meal.sides && meal.sides.length > 0 && (
                          <div className="text-gray-600 text-[10px] truncate">
                            + {meal.sides.length} side{meal.sides.length !== 1 ? 's' : ''}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(meal.id);
                          }}
                          className="absolute top-0 right-0 text-red-600 hover:text-red-800 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete meal"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {meals.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{meals.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddMealModal
          date={selectedDate}
          mealType={selectedMealType}
          onClose={handleModalClose}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMeal && (
        <EditMealModal
          mealPlan={selectedMeal}
          onClose={handleEditModalClose}
        />
      )}
    </div>
  );
}
