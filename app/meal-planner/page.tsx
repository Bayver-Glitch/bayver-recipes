'use client';

import { useState, useEffect } from 'react';
import AddMealModal from '../components/AddMealModal';

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

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealPlannerPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMealType, setSelectedMealType] = useState<string>('dinner');

  // Get current week range
  const getWeekRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0],
    };
  };

  const [weekRange, setWeekRange] = useState(getWeekRange());

  useEffect(() => {
    fetchMealPlans();
  }, [weekRange]);

  const fetchMealPlans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: weekRange.start,
        end_date: weekRange.end,
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

  const handleAddMeal = (date: string, mealType: string) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setShowModal(true);
  };

  const handleModalClose = (saved: boolean) => {
    setShowModal(false);
    if (saved) {
      fetchMealPlans();
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

  const getMealsForDate = (date: string, mealType: string) => {
    return mealPlans.filter(
      (mp) => mp.meal_date === date && mp.meal_type === mealType
    );
  };

  // Generate array of dates for current week
  const getWeekDates = () => {
    const dates = [];
    const start = new Date(weekRange.start);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const start = new Date(weekRange.start);
    const offset = direction === 'prev' ? -7 : 7;
    start.setDate(start.getDate() + offset);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    setWeekRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meal Planner</h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            ← Previous Week
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Week View */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">
                  Meal
                </th>
                {weekDates.map((date) => (
                  <th
                    key={date}
                    className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-40"
                  >
                    {formatDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mealTypes.map((mealType) => (
                <tr key={mealType} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 capitalize">
                    {mealType}
                  </td>
                  {weekDates.map((date) => {
                    const meals = getMealsForDate(date, mealType);
                    return (
                      <td key={date} className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          {meals.map((meal) => (
                            <div
                              key={meal.id}
                              className="bg-blue-50 border border-blue-200 rounded p-2 text-sm"
                            >
                              <div className="font-medium text-gray-900">
                                {meal.recipe?.title || meal.store_item?.name}
                                {meal.store_item?.brand && ` (${meal.store_item.brand})`}
                              </div>
                              {meal.sides.length > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                  + {meal.sides.length} side{meal.sides.length > 1 ? 's' : ''}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                Serves {meal.servings}
                              </div>
                              <button
                                onClick={() => handleDelete(meal.id)}
                                className="text-xs text-red-600 hover:text-red-800 mt-1"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => handleAddMeal(date, mealType)}
                            className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-300 border-dashed rounded hover:bg-blue-50 transition-colors"
                          >
                            + Add Meal
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}
