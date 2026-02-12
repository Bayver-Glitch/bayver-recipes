'use client';

import { useState, useEffect } from 'react';

interface StoreItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  default_amount: number;
  unit?: string;
  estimated_price?: number;
}

interface StoreItemModalProps {
  item: StoreItem | null;
  onClose: (saved: boolean) => void;
}

const categories = [
  'main',
  'side',
  'snack',
  'beverage',
  'condiment',
  'frozen',
  'canned',
  'other'
];

export default function StoreItemModal({ item, onClose }: StoreItemModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'other',
    default_amount: 1,
    unit: '',
    estimated_price: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        brand: item.brand || '',
        category: item.category,
        default_amount: item.default_amount,
        unit: item.unit || '',
        estimated_price: item.estimated_price?.toString() || '',
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = item
        ? `/api/store-items/${item.id}`
        : '/api/store-items';

      const method = item ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          default_amount: parseInt(formData.default_amount.toString()),
          estimated_price: formData.estimated_price || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save item');

      onClose(true);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {item ? 'Edit Store Item' : 'Add Store Item'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mac & Cheese"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Kraft"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Default Amount and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.default_amount}
                onChange={(e) => setFormData({ ...formData, default_amount: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="box, can, etc."
              />
            </div>
          </div>

          {/* Estimated Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.estimated_price}
              onChange={(e) => setFormData({ ...formData, estimated_price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
