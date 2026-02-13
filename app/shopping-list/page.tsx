'use client';

import { useState, useEffect } from 'react';

interface ShoppingListItem {
  name: string;
  amount: string;
  unit: string;
  category: string;
  source: string;
}

interface ShoppingListData {
  startDate: string;
  endDate: string;
  mealCount: number;
  totalItems: number;
  categorized: {
    [key: string]: ShoppingListItem[];
  };
}

export default function ShoppingListPage() {
  const [listData, setListData] = useState<ShoppingListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Get current week range
  const getWeekRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0],
    };
  };

  const [dateRange, setDateRange] = useState(getWeekRange());

  useEffect(() => {
    generateList();
  }, [dateRange]);

  const generateList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      const response = await fetch(`/api/shopping-list?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to generate shopping list');

      const data = await response.json();
      setListData(data);
      setCheckedItems(new Set()); // Reset checked items
    } catch (error) {
      console.error('Error generating list:', error);
      alert('Failed to generate shopping list');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (itemKey: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemKey)) {
      newChecked.delete(itemKey);
    } else {
      newChecked.add(itemKey);
    }
    setCheckedItems(newChecked);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handlePrint = () => {
    window.print();
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Produce': '🥬',
      'Meat & Seafood': '🥩',
      'Dairy & Eggs': '🥛',
      'Pantry': '🏺',
      'Frozen': '❄️',
      'Canned': '🥫',
      'Beverages': '🥤',
      'Other': '📦',
    };
    return icons[category] || '📦';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
          {listData && (
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(listData.startDate)} - {formatDate(listData.endDate)} • {listData.mealCount} meals • {listData.totalItems} items
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateList}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : '🔄 Refresh'}
          </button>
          <button
            onClick={handlePrint}
            disabled={!listData || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Shopping List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !listData || listData.totalItems === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">
            No meal plans found for this date range
          </p>
          <a
            href="/meal-planner"
            className="text-blue-600 hover:underline"
          >
            Go to Meal Planner to add meals
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(listData.categorized)
            .filter(([_, items]) => items.length > 0)
            .map(([category, items]) => (
              <div key={category} className="bg-white rounded-lg shadow overflow-hidden print:break-inside-avoid">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getCategoryIcon(category)} {category}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({items.length} items)
                    </span>
                  </h2>
                </div>
                <ul className="divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const itemKey = `${category}-${index}`;
                    const isChecked = checkedItems.has(itemKey);
                    return (
                      <li
                        key={itemKey}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer print:hover:bg-white"
                        onClick={() => toggleItem(itemKey)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItem(itemKey)}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 print:hidden"
                          />
                          <div className={`flex-1 ${isChecked ? 'line-through text-gray-400' : ''}`}>
                            <div className="font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.amount} {item.unit}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 print:hidden">
                              Used in: {item.source}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          header {
            display: none;
          }
          button {
            display: none;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:hover\\:bg-white:hover {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}
