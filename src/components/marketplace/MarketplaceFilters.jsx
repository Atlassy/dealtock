// src/components/marketplace/MarketplaceFilters.jsx
import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin, Tag, Calendar, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function MarketplaceFilters({ filters, onFilterChange }) {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    search: filters.search || '',
    category: filters.category || '',
    location: filters.location || '',
    minPrice: filters.minPrice || '',
    maxPrice: filters.maxPrice || '',
    condition: filters.condition || '',
    sortBy: filters.sortBy || 'created_at',
    sortOrder: filters.sortOrder || 'desc'
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch unique categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('products')
        .select('category')
        .eq('status', 'available')
        .eq('available_for_sale', true)
        .not('category', 'is', null);
      
      const uniqueCategories = [...new Set(data?.map(item => item.category))];
      setCategories(uniqueCategories);
    };
    
    fetchCategories();
  }, []);

  // Fetch unique locations from products table
  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from('products')
        .select('location')
        .eq('status', 'available')
        .eq('available_for_sale', true)
        .not('location', 'is', null)
        .neq('location', '');
      
      const uniqueLocations = [...new Set(data?.map(item => item.location))];
      setLocations(uniqueLocations);
    };
    
    fetchLocations();
  }, []);

  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  const resetFilters = () => {
    const resetValues = {
      search: '',
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    };
    setLocalFilters(resetValues);
    onFilterChange(resetValues);
  };

  const hasActiveFilters = localFilters.search || localFilters.category || localFilters.location || 
                          localFilters.minPrice || localFilters.maxPrice || localFilters.condition;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header with mobile toggle */}
      <div className="flex items-center justify-between lg:block mb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </h2>
          <button 
            className="lg:hidden text-gray-500 p-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <X className="h-4 w-4" /> : 'Show'}
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className={`${isExpanded ? 'block' : 'hidden lg:block'} space-y-3`}>
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Product name..."
              value={localFilters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Sort By - Newest to Old */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Sort by
          </label>
          <select
            value={localFilters.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
          >
            <option value="created_at">Newest First</option>
            <option value="name">Name A-Z</option>
            <option value="category">Category</option>
            <option value="sale_price">Price: Low to High</option>
            <option value="sale_price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Category
            </label>
            <select
              value={localFilters.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {/* Location Filter (from products table) */}
        {locations.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Product Location
            </label>
            <select
              value={localFilters.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        )}

        {/* Price Range */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Price Range (MAD)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={localFilters.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
              className="w-1/2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max"
              value={localFilters.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
              className="w-1/2 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Condition Filter - Only New and Opened Like New */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Condition
          </label>
          <select
            value={localFilters.condition}
            onChange={(e) => handleChange('condition', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Conditions</option>
            <option value="new">New</option>
            <option value="opened_like_new">Opened - Like New</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={applyFilters}
            className="flex-1 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded hover:bg-primary/90 transition-colors"
          >
            Apply Filters
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}