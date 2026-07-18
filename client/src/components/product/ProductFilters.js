'use client';

import { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassInput from '../ui/GlassInput';
import StarRating from '../ui/StarRating';
import api from '../../lib/api';

export default function ProductFilters({ filters, setFilters, categories: initialCategories = [] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice || '');
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice || '');

  // Fetch categories if not passed in
  useEffect(() => {
    if (initialCategories.length > 0) return;
    const fetchCats = async () => {
      try {
        const { data } = await api.get('/categories');
        if (data.success) setCategories(data.categories);
      } catch (err) {
        console.error('Fetch filters categories error:', err);
      }
    };
    fetchCats();
  }, [initialCategories]);

  // Sync inputs on external changes
  useEffect(() => {
    setMinPriceInput(filters.minPrice || '');
    setMaxPriceInput(filters.maxPrice || '');
  }, [filters.minPrice, filters.maxPrice]);

  const handleCategoryToggle = (slug) => {
    const isSelected = filters.category === slug;
    setFilters((prev) => ({
      ...prev,
      category: isSelected ? '' : slug, // Single select / filter for simplicity in routing
      page: 1,
    }));
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      minPrice: minPriceInput ? parseFloat(minPriceInput) : '',
      maxPrice: maxPriceInput ? parseFloat(maxPriceInput) : '',
      page: 1,
    }));
  };

  const handleRatingSelect = (stars) => {
    const isSelected = parseFloat(filters.rating) === stars;
    setFilters((prev) => ({
      ...prev,
      rating: isSelected ? '' : stars,
      page: 1,
    }));
  };

  const handleClearAll = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      sort: '',
      page: 1,
    });
  };

  return (
    <GlassCard className="flex flex-col gap-6 text-left" hover={false}>
      {/* Category Section */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 tracking-wider uppercase mb-3 border-b border-white/20 pb-1.5">
          Categories
        </h4>
        <div className="flex flex-col gap-2.5">
          {categories.map((cat) => {
            const isChecked = filters.category === cat.slug;
            return (
              <label key={cat.id} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCategoryToggle(cat.slug)}
                  className="rounded border-gray-300 text-lavender-500 focus:ring-lavender-400 w-4 h-4"
                />
                <span className={isChecked ? 'text-lavender-600 font-semibold' : ''}>
                  {cat.name} ({cat._count?.products || 0})
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range Section */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 tracking-wider uppercase mb-3 border-b border-white/20 pb-1.5">
          Price Range (₹)
        </h4>
        <form onSubmit={handlePriceApply} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <GlassInput
              type="number"
              placeholder="Min"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-1/2"
            />
            <GlassInput
              type="number"
              placeholder="Max"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-1/2"
            />
          </div>
          <GlassButton type="submit" size="sm" className="w-full text-xs">
            Apply Price
          </GlassButton>
        </form>
      </div>

      {/* Rating Section */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 tracking-wider uppercase mb-3 border-b border-white/20 pb-1.5">
          Rating
        </h4>
        <div className="flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const isSelected = parseFloat(filters.rating) === stars;
            return (
              <div
                key={stars}
                role="button"
                tabIndex={0}
                onClick={() => handleRatingSelect(stars)}
                onKeyDown={(e) => e.key === 'Enter' && handleRatingSelect(stars)}
                className={`flex items-center gap-2 text-sm text-left py-1 px-2 rounded-lg hover:bg-white/40 transition-colors w-full cursor-pointer ${
                  isSelected ? 'bg-white/50 border border-white/40' : ''
                }`}
              >
                <StarRating rating={stars} size="sm" />
                <span className={`text-xs text-gray-500 font-medium ${isSelected ? 'font-bold text-lavender-600' : ''}`}>
                  {stars === 5 ? 'Only' : '& Up'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear All button */}
      <GlassButton
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClearAll}
        className="w-full mt-2 text-xs border border-dashed border-gray-300"
      >
        Clear All Filters
      </GlassButton>
    </GlassCard>
  );
}
